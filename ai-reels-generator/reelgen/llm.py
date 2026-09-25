"""One interface, two ways to reach Claude.

- "claude-code": runs the Claude Code CLI you're already logged in to
  (`claude -p ...`). No API key needed, and Claude can use web search to
  check facts about a trend before it writes.
- "api": the Anthropic API with ANTHROPIC_API_KEY (used on GitHub Actions).

"auto" (the default) picks claude-code when the `claude` command is installed.
"""

from __future__ import annotations

import base64
import json
import logging
import shutil
import subprocess
from pathlib import Path
from typing import TypeVar

from pydantic import BaseModel, ValidationError

log = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class LLMError(RuntimeError):
    pass


def resolve_backend(backend: str) -> str:
    if backend in ("claude-code", "api"):
        return backend
    return "claude-code" if shutil.which("claude") else "api"


def ask(backend: str, model: str, system: str, prompt: str, schema: type[T],
        images: list[Path] | None = None, allow_web: bool = False, cwd: Path | None = None) -> T:
    backend = resolve_backend(backend)
    if backend == "claude-code":
        return _ask_claude_code(model, system, prompt, schema, images or [], allow_web, cwd)
    return _ask_api(model, system, prompt, schema, images or [])


def _ask_claude_code(model: str, system: str, prompt: str, schema: type[T], images: list[Path],
                     allow_web: bool, cwd: Path | None) -> T:
    tools = []
    if images:
        tools.append("Read")
        prompt += "\n\nLook at these image files with the Read tool before answering:\n" + \
                  "\n".join(str(p.resolve()) for p in images)
    if allow_web:
        tools += ["WebSearch", "WebFetch"]

    cmd = [
        "claude", "-p", prompt,
        "--output-format", "json",
        "--json-schema", json.dumps(schema.model_json_schema()),
        "--append-system-prompt", system,
    ]
    if model:
        cmd += ["--model", model]
    # Only the tools this step needs are available, and they're pre-approved
    # so the non-interactive run never waits on a permission prompt.
    cmd += ["--tools", ",".join(tools)]
    if tools:
        cmd += ["--allowedTools", *tools]

    log.info("Asking Claude Code (%s)%s", model or "default model", " with web search" if allow_web else "")
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=900, cwd=cwd,
                          stdin=subprocess.DEVNULL)
    if proc.returncode != 0 and not proc.stdout.strip():
        raise LLMError(f"claude CLI failed ({proc.returncode}): {proc.stderr.strip()[:500]}")
    try:
        out = json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        raise LLMError(f"claude CLI returned non-JSON output: {proc.stdout[:300]}") from exc
    if out.get("is_error"):
        raise LLMError(f"Claude Code error: {out.get('result') or out.get('subtype')}")

    data = out.get("structured_output")
    if data is None:  # older CLI versions: parse the text result
        data = _extract_json(out.get("result", ""))
    try:
        return schema.model_validate(data)
    except ValidationError as exc:
        raise LLMError(f"Claude Code output did not match the schema: {exc}") from exc


def _ask_api(model: str, system: str, prompt: str, schema: type[T], images: list[Path]) -> T:
    import anthropic

    content: list[dict] = []
    for img in images:
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": "image/jpeg",
                       "data": base64.b64encode(img.read_bytes()).decode()},
        })
    content.append({"type": "text", "text": prompt})

    response = anthropic.Anthropic().messages.parse(
        model=model or "claude-opus-5",
        max_tokens=16000,
        system=system,
        messages=[{"role": "user", "content": content}],
        output_format=schema,
    )
    if response.stop_reason == "refusal" or response.parsed_output is None:
        raise LLMError(f"Claude returned no usable answer (stop_reason={response.stop_reason})")
    return response.parsed_output


def _extract_json(text: str):
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        raise LLMError(f"no JSON object in Claude's reply: {text[:300]}")
    return json.loads(text[start:end + 1])
