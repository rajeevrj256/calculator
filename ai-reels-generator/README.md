# Reel Studio – AI Reels / Shorts Generator

Makes faceless **Instagram Reels** and **YouTube Shorts** from what's trending today, checks each video automatically, and keeps everything on your own computer. You watch, copy captions, and save videos from your phone.

Each video goes through these steps:

1. **Find trends.** It pulls Google Trends for your country and Reddit r/popular, with fallback topics if both are unavailable. It never repeats a topic.
2. **Claude writes it.** Claude picks the best topic, looks up the facts on the web, and writes a script in a creator's voice: a strong hook, short spoken lines, and none of the usual AI phrases ("did you know", "let's dive in", "mind-blowing", …).
3. **Voice.** Natural neural voices (English, Hindi and 70+ languages). The pace and pitch shift a little between scenes so it doesn't sound robotic.
4. **Footage.** Two or three different stock clips per scene from Pexels, cut every few seconds with editor-style punch-in zooms. No clip is used twice.
5. **Editing.** 1080×1920, bold word-by-word captions, a hook title, a progress bar, and optional music.
6. **Automatic verification** (see below). A video that fails is rewritten using the reviewer's notes and made again.
7. **Delivery.** The video shows up in the app on your phone and PC, with optional Telegram delivery.

## Automatic verification

Every video passes three checks before it counts as done:

| Check | What it looks at |
|---|---|
| Script | AI-sounding phrases, word count for the target length, scene count, symbols that TTS would read out |
| Technical | 1080×1920 resolution, duration, audio present and loud enough, black frames, captions covering the whole voiceover, file size |
| Claude review | Claude looks at frames from the **finished video** plus the script and scores how human it feels, the hook, how well the visuals match, and accuracy. Any factual error, contradiction or clickbait exaggeration is a blocking issue |

If a check fails, Claude rewrites the script using the feedback and the video is made again, up to `REEL_MAX_ATTEMPTS` times (default 3). If every attempt fails, you still get the best one, marked **"Check"** instead of **"✓"**, with the reasons listed.

## Run it on your computer (recommended)

The app runs on your PC or Mac. Videos are saved in `output/` on that computer. Your phone connects to it over the same Wi-Fi.

**1. Install once**
- [Python 3.10+](https://www.python.org/downloads/) (on Windows, tick "Add Python to PATH")
- [Claude Code](https://claude.com/claude-code). Open a terminal, run `claude` once and log in. The app then uses **your Claude Code login**, so no API key is needed.

**2. Start**
- Windows: double-click **`start.bat`**
- Mac / Linux: run **`./start.sh`**

The first start installs everything. Then it prints:

```
  Reel Studio is running
  On this computer:  http://localhost:8765
  On your phone:     http://192.168.1.23:8765   (same Wi-Fi)
  [QR code]
```

**3. Open it on both devices**
- **Computer:** open `http://localhost:8765`.
- **Phone:** scan the QR code, or type the phone address, while on the same Wi-Fi.
  - iPhone: in Safari tap **Share → Add to Home Screen**. It then opens full-screen like an app.
  - Android: in Chrome tap **⋮ → Add to Home screen**.

In the app:
- **Videos:** tap a video to watch it. You can **Save video**, **Copy caption** (caption and hashtags), and **Copy YouTube title**, and you can see why the topic was picked and which facts were used.
- **Create:** make a video now, from today's trends or your own topic, with live progress.
- **Settings:** country, language, voice, niche, length, a **daily automatic video** time, and which AI to use.

> Set `REEL_APP_PIN=1234` (your own PIN) in `.env` so nobody else on your Wi-Fi can use the app.
> The computer has to be on (and `start` running) to make videos and to watch them from your phone.

### Optional keys (`.env`)
- `PEXELS_API_KEY`: free from https://www.pexels.com/api/. **Strongly recommended.** Without it, videos use plain gradient backgrounds.
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`: also get each finished video on Telegram.
- Music: put royalty-free `.mp3` files in `assets/music/`.

### Command line

```bash
python -m reelgen                        # 1 video now
python -m reelgen --count 3
python -m reelgen --topic "Chandrayaan 4"
python -m reelgen --language Hindi --voice hi-IN-MadhurNeural
python -m reelgen serve                  # the app (what start.bat/start.sh run)
```

Each video gets a folder in `output/` containing `reel.mp4`, `thumbnail.jpg`, `report.json` (caption, hashtags, verification result), `script.json` and `review_frames.jpg` (the frames Claude reviewed).

## Optional: run in the cloud with GitHub Actions

`.github/workflows/ai-reels.yml` (at the repo root) makes a video every day with no computer needed. It uses an API key instead of Claude Code. Add these under **Settings → Secrets and variables → Actions**: `ANTHROPIC_API_KEY` (required), plus optionally `PEXELS_API_KEY`, `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. Videos appear under each run's **Artifacts**.

## Project layout

```
start.bat / start.sh   one-click start (installs on first run)
web/                   the phone + desktop app (installable web app)
reelgen/
  server.py         local app server, job queue, daily schedule
  llm.py            Claude via Claude Code CLI or API key
  trends.py         trending-topic sources + history of used topics
  script_writer.py  creator-style script + banned AI phrases
  verify.py         script, technical and Claude review checks
  voice.py          neural voiceover with word timings
  visuals.py        Pexels footage (multiple cuts per scene)
  captions.py       word-by-word highlighted captions
  video.py          final 9:16 edit and export
  notifier.py       Telegram + GitHub run summary
  pipeline.py       runs all steps with verify-and-retry
```

## Notes

- **Posting is up to you.** Save the video from the app and upload it in Instagram or YouTube. Auto-posting needs a YouTube API app or an Instagram Business account; it can be added later.
- **"Not AI-looking" has limits.** Stock footage, a natural script, and varied voice and pacing get close to a real faceless channel. For the most human result, record the voiceover yourself: replace `reel.mp4`'s voice, or ask for a "use my recording" option.
- **Always watch before posting.** Verification catches a lot, but trending news can be sensitive.
