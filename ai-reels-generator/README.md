# AI Reels / Shorts Generator

Fully automatic faceless short-video maker for **Instagram Reels** and **YouTube Shorts**.
Every run it:

1. **Finds what's trending** – Google Trends (daily searches for your country) + Reddit r/popular, with evergreen fallback topics. Already-used topics are skipped.
2. **Picks the best topic and writes a "sticky" script** with Claude – scroll-stopping hook, curiosity loop, payoff, call to action – plus caption, hashtags and a YouTube title.
3. **Records a voiceover** with free Microsoft Edge neural voices (English, Hindi and 70+ languages).
4. **Finds matching footage** for every scene on Pexels (or uses animated gradients without a key).
5. **Edits the video** – 1080×1920, 30 fps, bold word-by-word highlighted captions, hook title card, progress bar, optional background music.
6. **Sends you the response** – the finished video with caption and hashtags to your Telegram, plus a `report.json`. On GitHub Actions the video is attached to the run and summarised on the run page.

```
Trends ──► Claude (topic + script) ──► Voice (edge-tts) ──► Footage (Pexels)
                                                              │
         Telegram / report.json ◄── Video (moviepy + ffmpeg) ◄┘
```

## Quick start (local)

```bash
cd ai-reels-generator
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then fill in ANTHROPIC_API_KEY (others optional)

python -m reelgen                              # 1 video from today's trends
python -m reelgen --count 3                    # 3 videos
python -m reelgen --topic "Chandrayaan 4"      # force a topic
python -m reelgen --language Hindi --voice hi-IN-MadhurNeural
```

Output lands in `output/<timestamp>-<topic>/`:

| File | What |
|---|---|
| `reel.mp4` | the ready-to-post video |
| `thumbnail.jpg` | cover frame |
| `report.json` | topic, why it was chosen, caption, hashtags, YouTube title, narration |
| `script.json` | full scene-by-scene script |

## Run it automatically every day (GitHub Actions)

The workflow `.github/workflows/ai-reels.yml` (at the repo root) runs daily at 08:47 IST and can also be started by hand from the **Actions** tab ("Run workflow", optionally with a count or topic).

In the repo go to **Settings → Secrets and variables → Actions** and add:

| Secret | Required | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | https://console.anthropic.com/ |
| `PEXELS_API_KEY` | recommended | free at https://www.pexels.com/api/ |
| `TELEGRAM_BOT_TOKEN` | for the response on your phone | talk to [@BotFather](https://t.me/BotFather), `/newbot` |
| `TELEGRAM_CHAT_ID` | with the bot token | send your bot a message, then open `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy `chat.id` |

Optional **variables** (same page, "Variables" tab): `REEL_GEO` (default `IN`), `REEL_LANGUAGE` (default `English`), `REEL_VOICE`, `REEL_NICHE` (e.g. `tech and AI`).

Each run you get: a Telegram message with the video + caption + hashtags, a summary on the Actions run page, and the files under the run's **Artifacts**.

## Customising

- **Voice** – list all voices with `edge-tts --list-voices`. Good picks: `en-US-AndrewNeural`, `en-US-AvaNeural`, `en-IN-PrabhatNeural`, `hi-IN-MadhurNeural`, `hi-IN-SwaraNeural`.
- **Music** – drop royalty-free `.mp3` files into `assets/music/`; one is picked at random and mixed quietly under the voice.
- **Niche** – set `REEL_NICHE` so Claude prefers trends that fit your channel.
- **Length** – `--seconds 55` or `REEL_SECONDS` (Shorts max is 60s, Reels up to 90s).
- **Caption style** – colours and font size live at the top of `reelgen/captions.py`; set `REEL_FONT` to a `.ttf` path for a custom font.
- **Model** – `CLAUDE_MODEL` (default `claude-opus-5`).

## Project layout

```
reelgen/
  trends.py         trending-topic sources + history of used topics
  script_writer.py  Claude prompt + structured script schema
  voice.py          edge-tts voiceover with word timings
  visuals.py        Pexels footage / gradient fallback
  captions.py       word-by-word highlighted caption rendering
  video.py          final 9:16 composition and export
  notifier.py       Telegram + GitHub run summary
  pipeline.py       glue: runs all steps
```

## Notes

- Posting is left to you on purpose: review the video, then upload it. Auto-posting needs a YouTube Data API OAuth app or an Instagram Business account + Graph API, and it can be added as a final step in `pipeline.py`.
- Stock footage is from Pexels (free for commercial use). Check your music license.
- Trending news can be sensitive; the prompt tells Claude to skip tragedies and divisive politics and not to invent facts, but give each video a quick look before posting.
