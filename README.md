# Clinic Queue Tracking System (MVP)

A lightweight, mobile-first web application designed for outpatient clinics to help registered patients track their queue position and approximate waiting times.

**Author:** Vivek Kumar (B.Tech Computer Science, MSOT)  
**Status:** Feature 1 Completed (Patient Home Screen)

---

## How to Run Locally

You don't need to install heavy frameworks or packages. Any simple local HTTP server works:

### Option 1: Using Python (Recommended)
Open your terminal in this project folder and run:

```bash
python3 -m http.server 8000
```

Then open your browser and visit:  
👉 **[http://localhost:8000](http://localhost:8000)**

### Option 2: Using Node.js (npx serve)
If you have Node.js installed:

```bash
npx serve .
```

---

## How to Test Feature 1

1. **Test Valid Sample Tokens:**
   * Enter `025` and click **Check Queue →** (or press Enter).
   * It will validate and navigate to the queue status screen for Token `025`.
   * Try other valid sample tokens: `021`, `022`, `023`, `024`.
2. **Test Demo Shortcut:**
   * Click **• Try it out with sample token 025**.
   * Notice that it auto-fills `025` into the input box immediately.
3. **Test Empty Input:**
   * Leave the field blank and click **Check Queue →**.
   * Notice the friendly error message: *"Please enter your token number from your registration slip."*
4. **Test Invalid / Unknown Token:**
   * Enter `999` or `ABC` and click **Check Queue →**.
   * Notice the error message: *"Token #999 was not found. Please check your registration slip or ask at the reception desk."*
5. **Auto-clearing error:**
   * When an error is shown, simply start typing to see the error clear automatically.

---

## File Overview

* **`index.html`**: The Patient Home screen matching Wireframe Sketch 1 (`01 / WELCOME`, token input, button, shortcut, and footer).
* **`queue-status.html`**: The target page that receives the token (placeholder ready for Feature 2).
* **`css/styles.css`**: Shared design system, layout, responsive mobile frame, colors, and typography.
* **`css/patient.css`**: Patient-specific styling including wireframe button shading and input helpers.
* **`js/patient-home.js`**: JavaScript logic for input validation, demo shortcut, and navigation.
* **`seed/initial-queue.json`**: Reference configuration of the clinic's initial state (Tokens 021–025).
* **`BUILD_LOG.md`**: Chronological log of changes and Git commits.
* **`implementation-plan.md`**: Complete architectural and database blueprint.
