- [x] add settings button in sidebar for patients and update the settings page to also have the sidebar
- [x] remove the settings button from the top right of home and instead display the patient's unique code
- [x] body temp, oxygen level, and body weight are mentioned as conditions this app but should be treated as defaults that are optionally tracked, the user shouldn't have to select those from a menu at all
- [x] the dashboard layout should dynamically update according to what conditions the patient has (show blood sugar only if they have diabetes, etc)
- [x] there should be more widget based conditions what we have for diabetes and hypertension, come up with many more and frame widgets and trackables for them.
- [x] in the logging page, we should have things for general health like mood, sleep quality, medicines taken, many more, these should be optional for the patient to track and should be easy to log through button clicking 
- [x] patients should be able to make logs through three methods: the logging textbox, the button clicking general health stats under the log page, and they should be able to upload their disease-specific numbers by clicking the widgets on the dashboard 
- [x] people who are logged in as doctors and don't have any patients should be able to delete their account because they may be patients who have selected the wrong option during onboarding
- [x] make doctor dashboard's appointments this week and new health entries numbers accurate
- [x] doctors should be able to make entries for medicines in a nice lil table and the table should display in the patient's dashboard as a checklist that they can check off every day
- [x] temperature entry check? i think it doesn't work
- [x] remove sleep column in chronological log, just merge that with symptoms if sleep is bad
- [x] selecting from the quick log menu auto-scrolls up and inputs "undefined" into the text box (it still understands correctly but the description keeps saying The user reports poor mood, poor sleep quality, low appetite, low energy, and suboptimal hydration.
undefinedundefinedundefinedundefinedundefined)

# hackathon points related fixes (ai suggestions, make judgement calls on whether or not to implement these)

- [ ] Improve all empty states across the app (Dashboard, Insights, Doctor Dashboard) to have clear, guiding calls-to-action (e.g., "You haven't logged anything today. Click here to log.") instead of just "No data".
- [ ] Add a "Load Demo Data" or "Judge View" clear indicator on the login page so judges know they can instantly populate the app with rich historical data without narrating.
- [ ] Add a "Reset App / Clear Data" button in Settings to allow judges to easily wipe the local DB and test the onboarding flow end-to-end multiple times.

- [ ] Add a clear, empathetic tagline to the login page emphasizing the exact target audience: "The simplest daily health ledger for seniors and chronic care management."
- [ ] Audit application copy universally to be reassuring, empathetic, and free of medical jargon (e.g., "Your doctor will review this" instead of "Data synced").

- [ ] Implement AI "Smart Alerts": When parsing the daily log, if the AI detects severe/critical symptoms (like chest pain), display an immediate proactive warning advising them to contact their doctor.
- [ ] Expand the Insights page to include a simple "Ask my Health Ledger" chat input where the patient can ask Gemini questions about their own history (e.g., "When did my joint pain start?").

- [ ] Conduct a strict accessibility audit: Ensure all interactive buttons are at least 48x48px (fat-finger friendly) and all base font sizes are perfectly legible for 60-year-old eyes.
- [ ] Add a "Large Text" accessibility toggle in the Settings page that scales CSS variables for easier reading.