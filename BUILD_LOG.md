# Clinic Queue Tracking System - Build Log

**Author:** Vivek Kumar (B.Tech Computer Science, MSOT)  
**Project:** Clinic Queue Tracking MVP  
**Stack:** HTML, CSS, JavaScript, Firebase Firestore, Firebase Auth  

---

## Build Milestones

### Phase 0: Implementation Plan & Project Planning
- [x] Studied Product Development PDF, low-fidelity wireframes, and Figma prototype.
- [x] Defined strict MVP scope, MoSCoW prioritization, and sample tokens (`021`–`025`).
- [x] Designed database schema and waiting time calculation algorithm (~5–7 mins/patient ahead).
- [x] Created `implementation-plan.md` and received user approval.

### Phase 1 & Feature 1: Project Setup & Patient Home (Token Lookup)
- [x] Initialized Git repository.
- [x] Created clean directory structure (`css/`, `js/`, `seed/`).
- [x] Created `.gitignore`.
- [x] Implemented `css/styles.css` with responsive mobile-first typography and wireframe aesthetics.
- [x] Implemented `css/patient.css` for Patient Home card, input field, demo shortcut, and error handling.
- [x] Built `index.html` matching wireframe sketch 1 (`01 / WELCOME`, token input `e.g. 025`, `Check Queue →`, demo shortcut `• Try it out with sample token 025`, and footer).
- [x] Implemented `js/patient-home.js` with validation against allowed sample tokens (`021`–`025`).
- [x] Verified locally on mobile & desktop viewport.

### Phase 2 & Feature 2: Patient Queue Status & Turn Approaching
- [x] Created `js/queue-service.js` with single source of truth for queue calculation logic:
  - Token `021` initially serving (`status: "calling"`).
  - Tokens `022`–`025` waiting.
  - Calculated `patientsAhead` (e.g. 4 ahead for Token `025`).
  - Estimated waiting-time calculation (`20–30 minutes` for Token `025` at 5–7 min/patient).
  - 5-step visual progress segments mapping.
- [x] Built `queue-status.html` matching wireframe sketch 2:
  - Header: `OUTPATIENT CLINIC • Queue tracker`.
  - Tag: `02 / YOUR PLACE IN LINE`.
  - Hero token card with large token number (`025`) and status pill (`• Waiting`).
  - Side-by-side metric cards: `Patients ahead of you` (`04`) and `Estimated Waiting Time` (`20–30 minutes`).
  - 5-segment progress bar from `Registered` to `Your turn`.
  - Primary button: `View Turn Status →` (navigates to Screen 4).
  - Secondary button: `← Back to Home`.
  - Disclaimer footer: *"This is an estimate and may change depending on queue movement and doctor availability."*
- [x] Built Turn Approaching modal view (Screen 4 from Product Development PDF) with room guidance.
- [x] Built helpful Invalid Token view for unknown or missing tokens (e.g. `999`).
- [x] Implemented `js/queue-status.js` with live updates, storage synchronization, and refresh actions.

### Phase 3 & Feature 3: Receptionist Dashboard & Firebase Security
- [x] Built `reception.html` matching wireframe sketch 3:
  - Simulated desktop window header (`o o o`, "Patna Outpatient Clinic").
  - Top header with reception desk tag, user auth email, and logout button.
  - 3 top metric cards: `Current Token: 021` (highlighted), `Next Token: 022`, `Total Waiting Patients: 04`.
  - Patient queue table with rows for `022` to `025`, status pill (`• Waiting`), and `Call Patient →` button.
  - Bottom action bar with `Update Queue` button and `Reset Demo Queue` helper.
- [x] Implemented `css/reception.css` with responsive desktop/tablet layout and auth overlay.
- [x] Implemented `js/firebase-config.js` with Firebase v10 modular initialization and robust local demo fallback.
- [x] Implemented `firestore.rules` restricting database write permissions to authenticated staff only (`allow write: if request.auth != null;`).
- [x] Created `firebase.json` for hosting and rule deployments.
- [x] Implemented `js/reception.js` with staff login/logout, queue progression (`callPatient`), and real-time syncing.

### Phase 4 & Feature 4: Full System Integration & Workflow Verification
- [x] Connected Patient Home (`index.html`), Queue Status (`queue-status.html`), and Receptionist Dashboard (`reception.html`) into one cohesive workflow.
- [x] Added inline Turn Approaching notification alert (`🔔 Your turn is approaching!`) that appears automatically when `patientsAhead <= 1`.
- [x] Enhanced wait-time estimation labeling with explicit disclaimer cards and notices.
- [x] Added manual refresh control (`↻ Refresh queue status`) alongside automatic storage and custom event listeners for instant and on-demand updates.
- [x] Added seamless navigation links between Patient Home and Staff Reception Desk.
- [x] Linked to Firebase Project `clinic-queue-tracker-a3b1b` with production Hosting configuration.
- [x] Executed end-to-end programmatic verification across all sample tokens (`021` to `025`):
  1. Initial state: Token `025` shows 4 patients ahead, 20–30 mins wait.
  2. Reception calls `022`: Token `025` updates to 3 patients ahead, 15–20 mins wait.
  3. Reception calls `023`: Token `025` updates to 2 patients ahead, 10–15 mins wait.
  4. Reception calls `024`: Token `025` updates to 1 patient ahead, 5–10 mins wait, Turn Approaching alert triggers.
  5. Reception calls `025`: Token `025` updates to 0 ahead, status "Now Being Called", 5/5 progress bar, and "It's Your Turn Now!" banner.
  6. Demo reset verified.

---

## Git Commit History
1. `feat: implement Patient Home screen with token input, demo shortcut, and validation (Feature 1)`
2. `feat: implement Patient Queue Status screen with live metrics, progress bar, and turn approaching view (Feature 2)`
3. `feat: implement Receptionist Dashboard, queue progression, Firebase Auth protection, and Firestore rules (Feature 3)`
4. `feat: connect full clinic queue workflow, inline turn alerts, dynamic wait-time estimation, and verification (Feature 4)`
