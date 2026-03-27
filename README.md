# KoalaRead-15 🐨

A free, interactive 15-minute daily reading assistant designed for **Year 2 students** (ages 7–8) in Australia. Includes a focus timer, curriculum-aligned stories, a Five Finger Retell checklist, and a procedurally generated Word Search puzzle.

---

## ✨ Features

| Feature | Details |
|---|---|
| 📖 **Story Library** | 3 levelled stories – Australian Animals, Space, Magic |
| ⏱ **15-Min Timer** | SVG ring countdown with celebratory chime & star badge reward |
| 🖐 **Five Finger Retell** | Interactive checklist: Characters, Setting, Problem, Events, Solution — with notes saved to LocalStorage |
| 🔍 **Word Search** | Procedurally generated 12×12 grid from story keywords; unlocks after timer completes |
| 📱 **Responsive** | Optimised for iPad/Tablet and desktop |
| 💾 **Offline-friendly** | Progress saved to `localStorage` — no backend needed |

---

## 🚀 Getting Started

```bash
npm install
npm run dev      # Development server
npm run build    # Production build → dist/
npm run preview  # Preview the production build
```

---

## 🏗 Project Structure

```
/src
  /components
    Timer.jsx       # 15-min countdown + Web Audio reward chime + badge
    Checklist.jsx   # Interactive Five Finger Retell (5 steps)
    PuzzleGame.jsx  # Dynamic 12×12 Word Search logic
  /content
    Year2Texts.json # 3 sample stories (Koala, Space, Magic)
  App.jsx           # Main app shell + story selection + tab navigation
  main.jsx          # React entry point
  index.css         # Tailwind base + custom animations
```

---

## 🌐 Deployment (GitHub Pages)

The app is pre-configured to deploy to GitHub Pages. Push to `main` and the included GitHub Actions workflow (`.github/workflows/deploy.yml`) will build and publish automatically.

The live URL will be: `https://<your-username>.github.io/LitTick/`

---

## 🛠 Tech Stack

- **React 18** + **Vite** — fast development and build
- **Tailwind CSS 3** — utility-first styling
- **Web Audio API** — reward chime (no audio files needed)
- **LocalStorage** — zero-cost progress persistence

---

## 📚 Curriculum Alignment

Stories are written at an Australian Year 2 reading level using vocabulary appropriate for 7–8 year olds, covering ACELA and ACELY literacy strands.

