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

---

## Git Commit History
1. `feat: implement Patient Home screen with token input, demo shortcut, and validation (Feature 1)`
2. `feat: implement Patient Queue Status screen with live metrics, progress bar, and turn approaching view (Feature 2)`
