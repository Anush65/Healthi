# Healthi Application Format

Healthi is built as a single-page application (SPA) using Vanilla JS, HTML, and CSS (with Vite as the bundler).

## File Structure

- `index.html`: The main entry point.
- `src/main.js`: Bootstraps the application, handles routing, and mounts components.
- `src/style.css`: Contains the entire design system and responsive CSS.
- `src/components/`: Contains UI views (e.g., `dashboard.js`, `doctor-dashboard.js`, `log.js`, `insights.js`, `export.js`).
- `src/services/`: 
  - `firebase.js`: Firebase initialization.
  - `storage.js`: Handles all Firestore database operations (CRUD for logs, metrics, appointments, visits) and local demo mode fallback.
  - `gemini.js`: Handles calls to the Gemini API for natural language parsing and insight generation.
- `src/config/`: Contains app configuration (e.g., `conditions.js` which maps diseases to measurable metrics).

## Data Flow
- **Patient Logging**: Users log symptoms via natural text. `gemini.js` parses the text into structured JSON.
- **Doctor Care Plan**: Doctors review logs, input structured readings (BP, Blood Sugar, SpO2, Temperature, Weight), and save Care Plans.
- **Storage Layer**: `storage.js` persists data to Firebase Firestore (collections: `users`, `healthEntries`, `metricLogs`, `appointments`, `doctorVisits`).

## Authentication & Security
- Uses Firebase Authentication for distinct `patient` and `doctor` roles.
- Firestore Security Rules enforce strict access control, ensuring patients only see their own data and doctors only access assigned patients.
