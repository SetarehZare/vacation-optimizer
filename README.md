# 🌴 Off the Clock — Vacation Optimizer

> **Stretch your PTO into the longest possible vacations.**
> Pick a country, set your PTO budget, and the app finds the top 3 vacation windows of the year — ranked by how many days off you get per PTO day spent.

---

## ✨ Features

- 📅 **Smart optimizer** — slides a window over the full year and scores every possible vacation block by efficiency (`days off ÷ PTO days spent`)
- 🗺️ **16 countries** with regional holiday support (US states, German Länder, UK nations, Canadian provinces, and more)
- 🔥 **Live holiday data** — fetched straight from the [Nager.Date](https://date.nager.at) public API, always up to date
- 📊 **Year-at-a-glance heatmap** — see weekends, holidays, PTO days, and vacation stretches at once
- 🃏 **Window cards** — click any card to expand a day-by-day breakdown with efficiency math
- 📋 **Share your plan** — copies a formatted vacation summary to your clipboard in one click
- 🎨 **Tweaks panel** — switch accent palettes (Sunset / Ocean / Forest / Candy) and toggle UI sections
- 💾 **Persists your settings** — country, region, PTO, and year are saved to localStorage

---

## 🖥️ Tech Stack

| Layer | Tech |
|---|---|
| **Frontend** | React 18, Vite, custom CSS (no framework) |
| **Optimizer** | Pure JavaScript, runs entirely in the browser |
| **Holiday data** | [Nager.Date](https://date.nager.at) public API |
| **Backend** | Python 3.11, FastAPI, httpx, pydantic-settings |
| **LLM (local)** | Ollama (`qwen2.5:1.5b`) for free-text location parsing |
| **Package manager** | `uv` (Python), `npm` (JS) |

---
<img width="1903" height="1685" alt="screencapture-localhost-5173-2026-05-02-16_11_13" src="https://github.com/user-attachments/assets/5cf3d008-d230-4948-875a-9b3db68a3903" />

---

## 🚀 Running Locally

### Frontend only (no backend needed)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — holiday data is fetched directly from Nager.Date.

### Full stack (frontend + backend)

**Terminal 1 — backend:**
```bash
cd backend
uv sync
uv run uvicorn vacation_optimizer.main:app --reload
```

**Terminal 2 — frontend:**
```bash
cd frontend
npm run dev
```

The Vite dev server proxies `/api/*` to the FastAPI backend at `localhost:8000`.

### Optional: Ollama location parser

Install [Ollama](https://ollama.ai), then:
```bash
ollama pull qwen2.5:1.5b
```

This enables the `POST /optimize` endpoint to accept free-text location input (e.g. *"somewhere in Bavaria"*).

---

## 📁 Project Structure

```
vacation-optimizer/
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Main app, state, API calls
│   │   ├── components/
│   │   │   ├── Calendar.jsx      # Year heatmap
│   │   │   └── Windows.jsx       # Vacation window cards
│   │   ├── lib/
│   │   │   ├── optimizer.js      # Window scoring algorithm
│   │   │   └── countryMeta.js    # Country names, flags, regions
│   │   └── tweaks-panel.jsx      # Floating customisation panel
│   └── vite.config.js
├── backend/
│   └── src/vacation_optimizer/
│       ├── main.py               # FastAPI app + CORS
│       ├── optimizer.py          # Python sliding-window scorer
│       ├── holidays.py           # Nager.Date API client
│       ├── location.py           # Ollama location parser
│       └── config.py             # pydantic-settings config
└── prototype/                    # Original static HTML prototype
```

---

## 🧮 How the Optimizer Works

For every possible window of 3–14 days in the year:

1. Count how many of those days are **actual PTO** (not weekends or holidays)
2. Compute **score** = `total days ÷ PTO days`
3. Keep windows with score ≥ 1.5 and PTO cost ≤ 7
4. Greedily pick the **top 3 non-overlapping** windows by score

A score of `3.0` means every PTO day you spend buys you 3 full days away from work. 🎯

---

## 🌍 Supported Countries

🇺🇸 USA · 🇨🇦 Canada · 🇬🇧 UK · 🇦🇺 Australia · 🇩🇪 Germany · 🇫🇷 France · 🇪🇸 Spain · 🇮🇹 Italy · 🇳🇱 Netherlands · 🇯🇵 Japan · 🇮🇳 India · 🇲🇽 Mexico · 🇧🇷 Brazil · 🇿🇦 South Africa · 🇸🇬 Singapore · 🇮🇪 Ireland

---

## 🔧 Backend API

| Endpoint | Description |
|---|---|
| `GET /health` | Health check |
| `GET /api/holidays/{country}/{year}` | Holiday list from Nager.Date |
| `POST /optimize` | Server-side optimizer (accepts `country_code` or `location_text`) |

Interactive docs at **http://localhost:8000/docs** when running locally.

---

## 🧪 Tests

```bash
cd backend
uv run pytest -v
```

11 tests covering the optimizer logic and holiday API client.
