# Clinic Queue Tracking System (MVP)

A lightweight, mobile-first web application designed for outpatient clinics in Patna to help registered patients track their queue position and approximate waiting times in real time.

Developed by **Vivek Kumar** (1st Year B.Tech Computer Science, MSOT).

* **Live Web App (Firebase Hosting):** [https://clinic-queue-tracker-a3b1b.web.app](https://clinic-queue-tracker-a3b1b.web.app)
* **GitHub Repository:** [https://github.com/viv90064-star/clinic-queue-tracker](https://github.com/viv90064-star/clinic-queue-tracker)
* **Figma Prototype:** [https://sip-format-11274582.figma.site/](https://sip-format-11274582.figma.site/)

---

## 1. Project Context & Problem Statement

In busy outpatient department (OPD) sessions, patients receive a physical paper registration token at the clinic reception. However, they frequently experience uncertainty regarding:
* How many patients are ahead of them?
* How long their approximate wait will be?
* When they should return to the consultation door?

This leads to corridor overcrowding and repeated inquiries at the reception desk.

**The Solution:** A minimal, focused MVP where patients enter their token number on their phone to check their queue position and approximate waiting time, kept synchronized by clinic staff through a protected receptionist dashboard.

---

## 2. Key Features (Matching Hand-Drawn Wireframes)

| Screen | File | Key Capabilities |
| :--- | :--- | :--- |
| **1. Patient Home** | [`index.html`](index.html) | • Clean welcome header (`01 / WELCOME`)<br>• Token input field (`e.g. 025`)<br>• Demo shortcut button: `• Try it out with sample token 025`<br>• Input validation with friendly error messages |
| **2. Queue Status** | [`queue-status.html`](queue-status.html) | • Large token display with status pill (`Waiting` / `Calling`)<br>• **Patients ahead of you** count (e.g. `04`)<br>• **Estimated Waiting Time** (e.g. `20–30 minutes` based on ~5–7 min/patient)<br>• **5-Step visual progress bar** (*Registered → In line → Mid-queue → Next → Your turn*)<br>• Explicit wait-time disclaimer note<br>• `↻ Refresh queue status` control |
| **3. Turn Approaching** | [`queue-status.html`](queue-status.html) | • Automatic inline alert banner when turn is close (`🔔 Your turn is approaching!`)<br>• Screen 4 overlay directing patients to **Consultation Room 1** |
| **4. Receptionist Dashboard** | [`reception.html`](reception.html) | • Protected by Firebase Authentication (email/password)<br>• 3 metric cards: **Current Token** (`021`), **Next Token** (`022`), **Total Waiting Patients** (`04`)<br>• Live patient queue table with **Call Patient →** buttons<br>• **Update Queue** button & **↺ Reset Demo Queue** helper |

---

## 3. Technology Stack & Security

* **Frontend:** Semantic HTML5, CSS3 (responsive grid, CSS variables, mobile-frame styling), and Vanilla JavaScript (ES6+ modular).
* **Database & Real-time State:** Firebase Cloud Firestore for live shared queue state.
* **Authentication:** Firebase Authentication to protect staff write actions.
* **Hosting:** Firebase Hosting / Vercel.
* **Security & Privacy:**
  * **No PHI (Personal Health Information):** Only anonymous token numbers (`021`–`025`) and queue statuses are stored.
  * **Firestore Security Rules ([`firestore.rules`](firestore.rules)):**
    ```javascript
    // Anyone can read queue status (no login required for patients)
    allow read: if true;
    // ONLY authenticated reception staff can call patients or modify queue
    allow write: if request.auth != null;
    ```
  * **Zero Hardcoded Secrets:** Configured with clean placeholders in [`js/firebase-config.js`](js/firebase-config.js). Includes an automatic offline fallback mode for immediate local testing.

---

## 4. How to Run Locally

You do not need to install heavy dependencies or build tools.

### Option 1: Built-in Python Server (Recommended)
1. Open your terminal in the project directory:
   ```bash
   cd clinic-queue-tracker
   ```
2. Start the local server:
   ```bash
   python3 -m http.server 8000
   ```
3. Open your browser and visit:  
   👉 **[http://localhost:8000](http://localhost:8000)**

### Option 2: Direct File Open
You can also open [`index.html`](index.html) or [`reception.html`](reception.html) directly in Google Chrome or Safari.

---

## 5. End-to-End Testing Guide

The system uses sample tokens **`021` to `025`**, with **`021`** initially in consultation:

1. **Step 1: Patient Home Lookup**
   * Visit `http://localhost:8000`.
   * Click **`• Try it out with sample token 025`**, then click **Check Queue →**.
   * Observe **Token 025**:
     * Status: `• Waiting`
     * Patients ahead: `04`
     * Estimated Waiting Time: `20–30 minutes`
     * Progress: Step 1 (*Registered*)
2. **Step 2: Receptionist Login & Queue Advancement**
   * In a new window or tab, visit `http://localhost:8000/reception.html`.
   * Click **Quick-fill demo credentials** (`reception@clinic.com` / `clinic123`), then **Sign In to Dashboard**.
   * Click **Call Patient →** next to token **022**.
3. **Step 3: Verify Patient Live Update**
   * Return to the patient window for **Token 025**.
   * The screen automatically updates (or click **↻ Refresh queue status**):
     * Patients ahead drops to **`03`**.
     * Estimated wait drops to **`15–20 minutes`**.
     * Progress bar reaches Step 2.
4. **Step 4: Verify Turn Approaching Alert**
   * On the reception dashboard, call token **023**, then token **024**.
   * On the patient window for **Token 025**:
     * Patients ahead drops to **`01`**, wait drops to **`5–10 minutes`**.
     * The **🔔 Your turn is approaching!** banner lights up, reminding the patient to move near **Consultation Room 1**.
5. **Step 5: Verify Active Calling**
   * On the reception dashboard, call token **025**.
   * The patient window displays **🎉 It's Your Turn Now!**, with 0 patients ahead and all 5 progress bars filled.
6. **Step 6: Resetting the Demo**
   * Click **↺ Reset Demo Queue** on the receptionist dashboard to restore the baseline state (`021` calling, `022`–`025` waiting).

---

## 6. Firebase Live Project Connection

To connect to a live Firebase project:
1. Create a project at [console.firebase.google.com](https://console.firebase.google.com/).
2. Enable **Email/Password** under **Authentication** and add staff user `reception@clinic.com`.
3. Create a **Firestore Database**, copy the rules from [`firestore.rules`](firestore.rules), and publish.
4. Copy your web credentials into [`js/firebase-config.js`](js/firebase-config.js):
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_ACTUAL_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT",
     ...
   };
   ```

---

## 7. Git Commit History

The project followed a disciplined feature-by-feature development flow:

* `26fc493` - `feat: implement Patient Home screen with token input, demo shortcut, and validation (Feature 1)`
* `7d1eb24` - `feat: implement Patient Queue Status screen with live metrics, progress bar, and turn approaching view (Feature 2)`
* `ab01f58` - `feat: implement Receptionist Dashboard, queue progression, Firebase Auth protection, and Firestore rules (Feature 3)`
* `b5062e9` - `feat: connect full clinic queue workflow, inline turn alerts, dynamic wait-time estimation, and verification (Feature 4)`

---

## 8. License & Acknowledgments

Built for the **Product Development Course** at **MSOT**.  
*Prototype designed in Figma and inspired by real-world outpatient waiting experiences in Patna, Bihar.*
