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
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import TypeVar

from pydantic import BaseModel, ValidationError

log = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class LLMError(RuntimeError):
    pass


INSTALL_HELP = (
    "Claude Code was not found on this computer, and no ANTHROPIC_API_KEY is set. "
    "Install Claude Code (Windows PowerShell: irm https://claude.ai/install.ps1 | iex; "
    "Mac/Linux: curl -fsSL https://claude.ai/install.sh | bash), open a NEW terminal, run `claude` "
    "once to log in, then restart Reel Studio. (The Claude desktop chat app can't be used by other programs.)"
)


def find_claude() -> str | None:
    """The Claude Code CLI: on PATH, or in the installer's folder when PATH hasn't been
    refreshed yet (common right after installing on Windows)."""
    found = shutil.which("claude")
    if found:
        return found
    home = Path.home()
    for candidate in (home / ".local" / "bin" / "claude.exe", home / ".local" / "bin" / "claude",
                      home / "AppData" / "Roaming" / "npm" / "claude.cmd"):
        if candidate.exists():
            return str(candidate)
    return None


def describe_backend(backend: str) -> str:
    """Like resolve_backend, but "missing" instead of raising (for status displays)."""
    try:
        return resolve_backend(backend)
    except LLMError:
        return "missing"


def resolve_backend(backend: str) -> str:
    if backend in ("claude-code", "api"):
        return backend
    if find_claude():
        return "claude-code"
    if os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN"):
        return "api"
    raise LLMError(INSTALL_HELP)


def ask(backend: str, model: str, system: str, prompt: str, schema: type[T],
        images: list[Path] | None = None, allow_web: bool = False, cwd: Path | None = None) -> T:
    backend = resolve_backend(backend)
    if backend == "claude-code":
        return _ask_claude_code(model, system, prompt, schema, images or [], allow_web, cwd)
    return _ask_api(model, system, prompt, schema, images or [])


def _ask_claude_code(model: str, system: str, prompt: str, schema: type[T], images: list[Path],
                     allow_web: bool, cwd: Path | None) -> T:
    claude = find_claude()
    if claude is None:
        raise LLMError(INSTALL_HELP)
    tools = []
    if images:
        tools.append("Read")
        prompt += "\n\nLook at these image files with the Read tool before answering:\n" + \
                  "\n".join(str(p.resolve()) for p in images)
    if allow_web:
        tools += ["WebSearch", "WebFetch"]

    # The prompt goes in on stdin and the system prompt from a file: Windows caps a
    # command line at ~32k characters, and long fact-check prompts come close.
    with tempfile.NamedTemporaryFile("w", suffix=".txt", encoding="utf-8", delete=False) as fh:
        fh.write(system)
        system_file = fh.name
    cmd = [
        claude, "-p",
        "--output-format", "json",
        "--json-schema", json.dumps(schema.model_json_schema()),
        "--append-system-prompt-file", system_file,
    ]
    if model:
        cmd += ["--model", model]
    # Only the tools this step needs are available, and they're pre-approved
    # so the non-interactive run never waits on a permission prompt.
    cmd += ["--tools", ",".join(tools)]
    if tools:
        cmd += ["--allowedTools", *tools]

    log.info("Asking Claude Code (%s)%s", model or "default model", " with web search" if allow_web else "")
    try:
        # Always UTF-8: Windows would otherwise decode with its legacy code page, fail on
        # characters like ₹ or emoji, and hand back no output at all.
        proc = subprocess.run(cmd, input=prompt, capture_output=True, text=True, encoding="utf-8",
                              errors="replace", timeout=900, cwd=cwd)
    finally:
        Path(system_file).unlink(missing_ok=True)
    stdout, stderr = proc.stdout or "", proc.stderr or ""
    if proc.returncode != 0 and not stdout.strip():
        raise LLMError(f"claude CLI failed ({proc.returncode}): {stderr.strip()[:500]}")
    try:
        out = json.loads(stdout)
    except json.JSONDecodeError as exc:
        raise LLMError(f"claude CLI returned non-JSON output: {stdout[:300]}") from exc
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
