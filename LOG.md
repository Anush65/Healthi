# Healthi Project Log

* **Phase 1: Scaffolding started**: Initialized Vite project, setup environment, and created documentation.
* **Phase 2: Core Data Layer**: Added `storage.js` for IndexedDB CRUD and `gemini.js` for AI integration.
* **Phase 3: Onboarding & Quiz**: Created the basic `onboarding.js` setup flow and the `quiz.js` natural language daily logging interface. Updated `main.js` to correctly redirect non-onboarded users.
* **Phase 4: Visual Health Ledger**: Implemented `dashboard.js` to chronologically display the user's parsed health logs in a clean UI with severity colors.
* **Phase 5: Insights & Export**: Created `insights.js` for background pattern recognition from Gemini, and `export.js` leveraging Chart.js for a printable doctor report.
* **Phase 6: Polish**: Created `settings.js` allowing data reset, polished the dashboard header, and finalized print styles for high-contrast accessibility.
* **Phase 7: Tests & Docs**: Finalized the `README.md` and added unit tests for `storage.js` using Vitest and `fake-indexeddb`.
* **Fixes**: Fixed a build error regarding invalid unicode escape sequences in `export.js`.
* **Enhancements**: Implemented a robust fallback mechanism in `gemini.js` to automatically cycle through multiple Gemini models (`gemini-2.0-flash`, `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-flash-latest`) to ensure uptime if a single model is overloaded or fails.
* **Phase 8: Dynamic UI Architecture**: Refactored the dashboard and settings to use a `Condition Registry` system. Added support for dynamic quick-logging widgets and condition-specific charts (e.g., Blood Sugar for Diabetes, Blood Pressure for Hypertension) directly driven by the user's mapped profile conditions.
