# Update Health Metrics and Patient Dashboard Layout

The user has requested updates to the metrics tracked by both doctors and patients, along with UI changes to the patient dashboard.

## Proposed Changes

### 1. Condition Registry (`src/config/conditions.js`)
We will expand the condition registry to support the new health metrics.
- Add `temperature` (Body Temperature).
- Add `oxygen_level` (Blood Oxygen / SpO2).
- Add `body_weight` (Body Weight).
The doctor form in `doctor-dashboard.js` dynamically generates inputs based on these conditions, so simply adding them to the registry and the patient's profile will allow the doctor to log them. 

### 2. Patient Profile Metrics
In `src/services/storage.js`, we will add `temperature` to the default demo patient's `conditions` array so it immediately appears in their dashboard and for the doctor to track. (The patient already has `diabetes` and `hypertension`).
We will update `src/components/dashboard.js` to display the latest temperature reading in the "Your care plan" grid, alongside Blood Pressure and Blood Sugar.

### 3. Doctor Dashboard Metric Support
In `src/services/storage.js`, we will ensure the doctor's capabilities to add BP, oxygen level, body weight, and temperature are fully supported. We will add these conditions to the demo patient so the doctor can track them immediately.

### 4. Patient Dashboard Layout (`src/components/dashboard.js`)
- **Remove**: The `wellness-score` element from the top `hero-grid`.
- **Move/Add**: We will take the "Healthi insight" card (which is currently located at the bottom of the page in the `aside`) and move it up into the `hero-grid`, replacing the wellness score section. This provides immediate visibility into AI-generated insights right when the patient logs in.

## Verification Plan
- Load the app as the patient: Verify that the top area displays the "Insights" rather than the "Wellness score".
- Verify that Temperature is displayed alongside Blood Pressure and Blood Sugar in the patient's care plan.
- Log in as the doctor: Verify that when viewing the patient, forms exist to log BP, Oxygen Level, Body Weight, and Temperature. 

## Open Questions
- Does the doctor need to track Oxygen Level and Body Weight for *all* patients by default, or only if the patient has those specific conditions configured? (Assuming the latter, as the app is currently designed, but we will add them to the demo patient so they are visible).
