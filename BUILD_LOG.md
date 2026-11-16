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
- [x] Implemented `js/patient-home.js` with:
  - Input formatting and trimming.
  - Demo shortcut click handler (auto-fills `025` and clears errors).
  - Validation against allowed sample tokens (`021`, `022`, `023`, `024`, `025`).
  - Helpful error messages for empty input or unknown tokens.
  - Navigation parameter handover to `queue-status.html?token=...`.
- [x] Verified locally on mobile & desktop viewport.

---

## Git Commit History
1. `docs: add comprehensive implementation plan and project architecture`
2. `feat: implement Patient Home screen with token input, demo shortcut, and validation (Feature 1)`
