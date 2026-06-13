# Healthi

Healthi is a daily wellness and symptom tracker web app designed for the elderly and those managing chronic conditions. Rather than causing panic with arbitrary scores, Healthi provides a visual "Health Ledger" timeline to spot trends and provide medical professionals with instant context.

## Hackathon Features
- **Frictionless Logging:** Natural language input via the "Invisible Parser".
- **Visual Health Ledger:** Clean, chronological timeline.
- **Smart Insights:** "Predictive Analyst" background AI that correlates sleep, diet, and symptoms.
- **Doctor Export:** 1-click printable chart and table for clinical context.

## Tech Stack
- **Frontend**: Vite + Vanilla JS + Vanilla CSS
- **Database**: IndexedDB (offline-first) via `idb-keyval`
- **Charts**: Chart.js
- **AI**: Google Gemini API (`@google/generative-ai`)

## Setup Instructions
1. Clone the repository
2. Run `npm install`
3. Create a `.env` file and add: `VITE_GEMINI_API_KEY=your_api_key_here`
4. Run `npm run dev` to start the local server.

## Testing
Unit tests are written with Vitest. Run `npm run test` or `npx vitest run`.
