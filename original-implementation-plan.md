# Clinic Queue Tracking System (MVP) - Implementation Plan

**Author:** Vivek Kumar (B.Tech Computer Science, MSOT)  
**System:** Clinic Queue Tracking Web Application (Patna OPD Clinic Pilot)  
**Target Architecture:** HTML5, CSS3, Vanilla JavaScript, Firebase Firestore, Firebase Authentication, Firebase Hosting / Vercel  
**Status:** Pending Approval (Phase 0: Planning)

---

## 1. Project Goal & MVP Scope

### 1.1 Problem Statement
In busy outpatient department (OPD) clinics, patients receive a paper token after registration but often have no visibility into how many patients are ahead of them or when they will be called. This causes anxiety, frequent inquiries at the reception counter, and overcrowding in waiting corridors.

### 1.2 Solution & MVP Objective
A lightweight, mobile-first web application that allows patients who already hold a physical paper token (e.g., `021`, `022`, `023`, `024`, `025`) to look up their current queue status and estimated waiting time. A secure, authenticated receptionist dashboard allows clinic staff to advance the queue in real-time.

### 1.3 Strict Scope Boundaries (MoSCoW Alignment)
* **IN SCOPE (Must-Haves):**
  1. **Patient Token Lookup:** Single-field mobile screen to enter an existing token (e.g., `025`) with a demo shortcut for quick testing and clear error handling for invalid tokens.
  2. **Queue Position & Wait Time Display:** Mobile screen showing token number, current status, number of patients ahead, approximate waiting-time range (e.g., `20–30 minutes`), 5-step visual progress bar, and an explicit disclaimer.
  3. **Turn Approaching Alert:** Status view / alert informing the patient when their turn is next or being called to proceed to the consultation room.
  4. **Receptionist Dashboard (Protected):** Secure staff dashboard showing current token being called, next token in line, total waiting count, a live list of waiting tokens with "Call Patient" buttons, and an "Update Queue" action.
  5. **Data Persistence & Security:** Firebase Firestore for live shared queue state; Firebase Authentication to restrict write operations to authorized clinic staff only.
* **OUT OF SCOPE (Won't Have Now):**
  * No online patient self-registration or appointment booking (tokens are issued in person at reception).
  * No automatic digital token generation.
  * No online payments, billing, or prescription integration.
  * No third-party notification channels (SMS, WhatsApp, email) — status is checked on the web page.
  * No collection of real or sensitive Patient Health Information (PHI) — strictly tokens and status.

---

## 2. Screen-by-Screen UI Architecture

The interface directly reflects the low-fidelity hand-drawn wireframes and the Figma prototype (`https://sip-format-11274582.figma.site/`):

### Screen 1: Patient Home (`index.html`) — Mobile View
* **Header / Tagline:** `OUTPATIENT CLINIC • Queue tracker`
* **Section Index:** `01 / WELCOME`
* **Title & Subtitle:** "Clinic Queue Tracker" — "Check your waiting status"
* **Input Box:** "Enter your token number" with placeholder `e.g. 025` and subtext *"You'll find this on your registration slip."*
* **Demo Shortcut:** Clickable prompt `• Try it out with sample token 025` that pre-fills the input field.
* **Primary Button:** `Check Queue →` (validates format and queries Firestore).
* **Validation & Error State:** Inline error message if empty or token not found: *"Token not found. Please verify your token number or contact the reception desk."*
* **Footer:** *"Your time is valuable. We'll help you keep track of it."*

### Screen 2: Patient Queue Status (`queue-status.html`) — Mobile View
* **Header / Tagline:** `OUTPATIENT CLINIC • Queue tracker`
* **Section Index:** `02 / YOUR PLACE IN LINE`
* **Title & Subtitle:** "Your Queue Status" — *"You're registered. We'll take it from here."*
* **Hero Token Card:** Large display of Token Number (e.g., `025`) and current status pill badge (e.g., `Waiting`, `Calling`, `Completed`).
* **Metrics Cards (Side-by-Side):**
  * **Patients ahead of you:** e.g., `04` (Updated from user feedback: clear, direct wording).
  * **Estimated Waiting Time:** e.g., `20–30 minutes` (calculated dynamically).
* **5-Segment Queue Progress Bar:** Visual progress representation from `Registered` to `Your turn`.
* **Action Buttons:**
  * `View Turn Status →` (navigates or switches to the Turn Approaching state).
  * `← Back to Home` (returns to `index.html`).
* **Reassurance Disclaimer:** *"This is an estimate and may change depending on queue movement and doctor availability."*

### Screen 3: Turn Approaching View (`turn-approaching.html` / dynamic view)
* **Header / Tagline:** `OUTPATIENT CLINIC • Queue tracker`
* **Section Index:** `03 / TURN APPROACHING`
* **Visual Alert Banner:** High-visibility banner indicating the patient is next in line or currently being called.
* **Instructions:** Token number display with clear prompt: *"Your turn is approaching! Please stay near consultation room 1."*
* **Action:** `← Back to Queue Status`.

### Screen 4: Receptionist Dashboard (`reception.html`) — Desktop / Tablet View
* **Header / Tagline:** `OUTPATIENT CLINIC • Reception desk`
* **Auth Guard & Login Modal:** Unauthenticated visitors see a secure login form (Staff Email & Password). Once logged in, the dashboard is unlocked.
* **Top Metric Overview (3 Cards):**
  1. **Current Token:** e.g., `021` (*"Now being called"*)
  2. **Next Token:** e.g., `022` (*"Next in line"*)
  3. **Total Waiting Patients:** e.g., `04` (*"In the waiting area"*)
* **Patient Queue Table:**
  * Columns: `Token Number` | `Status` | `Action`
  * Rows for active tokens (`022`, `023`, `024`, `025`) with active status pill `• Waiting`.
  * Action button per row: `Call Patient →`.
* **Footer Action Bar:** Helper text *"Call the next patient to move the queue forward."* with a primary `Update Queue` button.
* **Staff Controls:** "Reset / Re-seed Demo Data (021–025)" button (essential for rapid testing and clinic demos) and "Log Out" button.

---

## 3. Database Schema & Business Logic

### 3.1 Firebase Firestore Collections & Document Structure

We will use Cloud Firestore in the Firebase Web SDK (v10 modular or clean compat wrapper for simplicity and beginner readability).

```text
Firestore Root
│
├── metadata/
│   └── clinic_queue (Document)
│       ├── current_token: "021"         (String: Token currently with doctor)
│       ├── current_status: "Calling"     (String: "Calling" | "In Consultation")
│       ├── next_token: "022"            (String: Next token in line)
│       ├── total_waiting: 4             (Number: Count of tokens waiting)
│       ├── avg_mins_per_patient: 6      (Number: Default consultation window baseline)
│       └── last_updated: Timestamp      (Timestamp of latest queue change)
│
└── tokens/ (Collection)
    ├── 021 (Document)
    │   ├── token_id: "021"
    │   ├── order: 1
    │   ├── status: "calling"            ("waiting" | "calling" | "completed")
    │   ├── created_at: Timestamp
    │   └── called_at: Timestamp
    ├── 022 (Document)
    │   ├── token_id: "022"
    │   ├── order: 2
    │   ├── status: "waiting"
    │   ├── created_at: Timestamp
    │   └── called_at: null
    ├── 023 (Document) ...
    ├── 024 (Document) ...
    └── 025 (Document)
        ├── token_id: "025"
        ├── order: 5
        ├── status: "waiting"
        ├── created_at: Timestamp
        └── called_at: null
```

### 3.2 Waiting-Time Calculation Algorithm
The algorithm is deterministic, transparent, and models real clinic consultation pacing (approx. 5 to 7 minutes per consultation):

1. **Calculate Patients Ahead ($N$):**
   * If a patient searches for Token $T$:
   * Retrieve all tokens where `status == "waiting"` and `order < T.order`.
   * $N$ = count of those waiting tokens.
2. **Determine Time Range:**
   * If $T.status == "calling"$:
     * Patients Ahead = `0`
     * Time Estimate = `"Now being called — please proceed to Room 1"`
   * If $N == 0$ and $T.status == "waiting"$:
     * Patients Ahead = `0`
     * Time Estimate = `"Up next (< 5 minutes)"`
   * If $N > 0$:
     * Min Wait = $N \times 5$ minutes
     * Max Wait = $N \times 7$ minutes (or rounded to 10-minute brackets)
     * *Example for Token 025 ($N = 4$ patients ahead: 021 is calling, 022, 023, 024 are ahead in line):*
       * Min = $4 \times 5 = 20$ minutes
       * Max = $4 \times 7 \approx 28 \rightarrow 30$ minutes
       * Result displayed: **"20–30 minutes"** (exact match to wireframe).
3. **Queue Progress Steps (5 Segments):**
   * Segment 1: Registered (Always lit for valid tokens)
   * Segment 2: Waiting in queue ($N \le 3$)
   * Segment 3: Halfway through ($N \le 2$)
   * Segment 4: Next in line ($N == 0$ or $1$)
   * Segment 5: Your turn ($T.status == "calling"$)

### 3.3 Security Rules (`firestore.rules`)
To fulfill the requirement: *"Protect receptionist write actions using authentication and database security rules."*

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Any patient can read queue status and token information (no sign-in required)
    match /metadata/{document=**} {
      allow read: if true;
      allow write: if request.auth != null; // Only authenticated staff can modify
    }
    
    match /tokens/{tokenId} {
      allow read: if true;
      allow write: if request.auth != null; // Only authenticated staff can advance queue
    }
  }
}
```

---

## 4. File & Folder Structure

We will organize the codebase cleanly with clear separation of concerns, avoiding complex framework boilerplate so that every file is easy to study and modify:

```text
product/
├── index.html                   # Screen 1: Patient Home (Token input & lookup)
├── queue-status.html            # Screen 2: Patient Queue Status & Screen 4: Turn Approaching
├── reception.html               # Screen 3: Protected Receptionist Dashboard
├── css/
│   ├── styles.css               # Design system: variables, fonts, resets, wireframe cards
│   ├── patient.css              # Patient mobile screens, progress bar, badges, disclaimer
│   └── reception.css            # Receptionist dashboard layout, metric cards, queue table
├── js/
│   ├── firebase-config.js       # Firebase configuration & initialization
│   ├── queue-service.js         # Core database queries, wait-time math, data formatting
│   ├── patient-home.js          # Patient token lookup, input validation, demo shortcut
│   ├── queue-status.js          # Queue status listener/refresher, progress bar animation
│   ├── reception.js             # Reception auth check, queue table rendering, "Call Next" actions
│   └── seed-data.js             # Helper utility to seed/reset tokens 021-025 in Firestore
├── seed/
│   └── initial-queue.json       # JSON reference data for sample tokens (021 to 025)
├── firestore.rules              # Firebase security rules enforcing auth for writes
├── firebase.json                # Firebase Hosting and Firestore configuration
├── .gitignore                   # Ignore node_modules, temp files, environment secrets
├── implementation-plan.md       # This comprehensive project plan
├── BUILD_LOG.md                 # Progressive build log documenting every commit & feature
└── README.md                    # Setup guide, run instructions, and testing steps
```

---

## 5. Phased Implementation Checklist

We will execute the development sequentially in 6 structured phases. Each phase will be committed to Git with clear commit messages and documented in `BUILD_LOG.md`.

### Phase 1: Project Scaffolding & Git Setup
- [ ] Initialize Git repository in `/Users/vivek/product`.
- [ ] Create `.gitignore` and base project structure (`css/`, `js/`, `seed/`).
- [ ] Initialize `BUILD_LOG.md` to document all subsequent actions and milestones.
- [ ] Create `seed/initial-queue.json` containing tokens `021`, `022`, `023`, `024`, `025`.

### Phase 2: Design System & Wireframe-Accurate Layouts (HTML & CSS)
- [ ] Build `css/styles.css` matching the wireframe aesthetic (monochrome/clean slate palette, clean borders, crisp typography, responsive layout).
- [ ] Build `index.html` (Patient Home) with mobile container, welcome header, token input, "• Try it out with sample token 025" shortcut, and footer.
- [ ] Build `queue-status.html` with hero token card, split metrics ("Patients ahead of you", "Estimated Waiting Time"), 5-step progress bar, "View Turn Status" button, and doctor availability disclaimer.
- [ ] Add Turn Approaching view / modal state in `queue-status.html`.
- [ ] Build `reception.html` with top 3 metric cards (`Current Token`, `Next Token`, `Total Waiting Patients`), queue table, "Call Patient" buttons, and "Update Queue" controls.

### Phase 3: Firebase Integration & Sample Data Seeding
- [ ] Setup `js/firebase-config.js` with Firebase v10 CDN modules.
- [ ] Setup `firestore.rules` to enforce read-for-all, write-for-authenticated-staff.
- [ ] Create `js/seed-data.js` to easily initialize Firestore with default state:
  * Token `021`: Status `calling`
  * Tokens `022`, `023`, `024`, `025`: Status `waiting`
  * Metadata: `current_token: "021"`, `next_token: "022"`, `total_waiting: 4`.

### Phase 4: Patient Features (Lookup, Status, Wait Calculations)
- [ ] Implement `js/patient-home.js`:
  * Handle input submission, trim input, validate format.
  * Demo shortcut: tapping `• Try it out with sample token 025` populates input and triggers lookup.
  * Error display: Show user-friendly error message if token does not exist in Firestore.
  * Successful lookup redirects to `queue-status.html?token=025`.
- [ ] Implement `js/queue-status.js`:
  * Parse token from URL parameters.
  * Query Firestore for token and queue metadata.
  * Calculate patients ahead and wait-time range (e.g. `20–30 minutes`).
  * Render 5-segment progress bar.
  * Wire up "View Turn Status" to show Screen 4 ("Your turn is approaching!").
  * Support manual refresh button and real-time Firestore listener for live updates.

### Phase 5: Receptionist Dashboard & Authentication
- [ ] Implement Firebase Authentication in `js/reception.js` (email & password login for reception staff).
- [ ] Implement dashboard data loading:
  * Display current token (`021`), next token (`022`), total waiting count (`4`).
  * Render patient queue table with rows for `022` to `025`.
- [ ] Implement queue progression logic:
  * Clicking "Call Patient →" on token `022`:
    * Marks `021` as `completed`.
    * Marks `022` as `calling`.
    * Sets next token to `023`.
    * Decrements total waiting count to `3`.
  * Real-time sync: when reception updates, any open patient screen for `025` updates to reflect 3 patients ahead and `15–25 minutes` wait.
- [ ] Add a "Reset Demo Queue" button for staff/testers to revert queue back to initial state (`021` calling, `022-025` waiting).

### Phase 6: Verification, Testing & Build Log Finalization
- [ ] Execute all test cases in the Testing Plan (see Section 6).
- [ ] Verify responsive design on mobile viewport (< 480px) and desktop (> 768px).
- [ ] Record final testing results and commit history in `BUILD_LOG.md`.
- [ ] Provide deployment instructions for Firebase Hosting / Vercel.

---

## 6. Comprehensive Testing Plan

| Test ID | Feature Under Test | Test Scenario / Action | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Token Lookup (Valid) | Enter `025` and click "Check Queue". | Navigates to Queue Status showing Token 025, Status: Waiting. | Pending |
| **TC-02** | Token Lookup (Demo Shortcut) | Click `• Try it out with sample token 025`. | Input auto-fills with `025` and proceeds to queue status. | Pending |
| **TC-03** | Token Lookup (Invalid) | Enter `999` or letters `ABC`. | Stays on page; shows *"Token not found. Please verify your token number or contact the reception desk."* | Pending |
| **TC-04** | Queue Status Metrics | Inspect Token `025` initial status. | Shows **Patients ahead of you: 04** and **Estimated Waiting Time: 20–30 minutes**. | Pending |
| **TC-05** | Progress Bar Display | Inspect 5-step progress bar for Token `025`. | Displays registered step lit, progress proportional to position in line. | Pending |
| **TC-06** | Disclaimer Visibility | Inspect Queue Status footer note. | Displays note: *"This is an estimate and may change depending on queue movement and doctor availability."* | Pending |
| **TC-07** | Turn Approaching Alert | Click "View Turn Status →" or view token when next in line. | Displays Screen 4: *"Your turn is approaching! Please stay near consultation room 1."* | Pending |
| **TC-08** | Reception Auth Guard | Navigate to `reception.html` without signing in. | Queue controls are hidden/locked; login modal prompts for staff credentials. | Pending |
| **TC-09** | Receptionist Queue Progression | Staff logs in and clicks "Call Patient →" for `022`. | Token `021` completes, `022` becomes current, `023` becomes next, waiting count becomes `3`. | Pending |
| **TC-10** | Live Patient View Update | Keep `queue-status.html?token=025` open while staff calls `022`. | Token `025` position updates to **3 patients ahead**, wait time reduces to **15–25 minutes**. | Pending |
| **TC-11** | Security Rules Enforcement | Attempt write to `tokens` or `metadata` without auth. | Firebase rejects write with `permission-denied`. | Pending |
| **TC-12** | Demo Reset Action | Staff clicks "Reset Demo Queue" on dashboard. | State resets to `021` calling, `022–025` waiting, 4 total waiting. | Pending |

---

## 7. Version Control & Git Commit Strategy

Every phase will correspond to clear, readable Git commits following conventional commit syntax:

1. `chore: project initialization, folder structure, and build log`
2. `feat(ui): implement responsive patient home, queue status, and reception layouts matching wireframes`
3. `feat(firebase): configure firestore schema, security rules, and seed script for tokens 021-025`
4. `feat(patient): implement token validation, lookup routing, and dynamic wait-time calculation`
5. `feat(reception): implement staff authentication, queue advancement, and demo reset controls`
6. `test: verify queue progression, live updates, and test matrix across mobile and desktop`

---

*This plan is ready for review. Coding will begin upon user confirmation.*
