/**
 * Clinic Queue Tracking System - Feature 1: Patient Home
 * Author: Vivek Kumar (MSOT B.Tech CSE)
 * 
 * Purpose:
 * Handles token input from the patient, validates the input format,
 * checks against the clinic's active sample tokens, and routes valid
 * tokens to the Queue Status screen.
 */

// 1. Constants: The MVP pilot uses sample tokens 021 through 025
const VALID_SAMPLE_TOKENS = ["021", "022", "023", "024", "025"];
const DEFAULT_DEMO_TOKEN = "025";

// 2. DOM Elements
const tokenForm = document.getElementById("tokenForm");
const tokenInput = document.getElementById("tokenInput");
const errorAlert = document.getElementById("errorAlert");
const demoShortcutBtn = document.getElementById("demoShortcutBtn");

/**
 * Displays a friendly, helpful error message to the user.
 * @param {string} message - The error explanation to display.
 */
function showError(message) {
  errorAlert.textContent = message;
  errorAlert.classList.add("visible");
  tokenInput.focus();
}

/**
 * Clears any active error message.
 */
function clearError() {
  errorAlert.textContent = "";
  errorAlert.classList.remove("visible");
}

/**
 * Normalizes input (trims whitespace, removes symbols).
 * If user types "25", normalizes to "025" for convenience.
 * @param {string} rawInput 
 * @returns {string} Cleaned token string
 */
function normalizeToken(rawInput) {
  const cleaned = rawInput.trim();
  // If user enters 2 digits (e.g., '25'), pad with leading zero to match '025'
  if (/^\d{1,2}$/.test(cleaned)) {
    return cleaned.padStart(3, "0");
  }
  return cleaned;
}

/**
 * Validates the token number.
 * Checks for empty input, non-numeric formats, and presence in valid tokens.
 * @param {string} token 
 * @returns {{ isValid: boolean, error?: string, normalizedToken?: string }}
 */
function validateToken(token) {
  const normalized = normalizeToken(token);

  if (!normalized) {
    return {
      isValid: false,
      error: "Please enter your token number from your registration slip."
    };
  }

  // Check if token contains only digits
  if (!/^\d+$/.test(normalized)) {
    return {
      isValid: false,
      error: "Token numbers must only contain digits (e.g. 025)."
    };
  }

  // Check if token is part of today's active queue
  if (!VALID_SAMPLE_TOKENS.includes(normalized)) {
    return {
      isValid: false,
      error: `Token #${normalized} was not found. Please check your registration slip or ask at the reception desk.`
    };
  }

  return {
    isValid: true,
    normalizedToken: normalized
  };
}

/**
 * Handles form submission when the patient clicks "Check Queue" or presses Enter.
 * @param {Event} event 
 */
function handleFormSubmit(event) {
  event.preventDefault();
  clearError();

  const rawValue = tokenInput.value;
  const result = validateToken(rawValue);

  if (!result.isValid) {
    showError(result.error);
    return;
  }

  // Save to sessionStorage so it's readily accessible across pages
  sessionStorage.setItem("clinic_current_token", result.normalizedToken);

  // Navigate to Feature 2: Queue Status Screen with URL query parameter
  window.location.href = `queue-status.html?token=${encodeURIComponent(result.normalizedToken)}`;
}

/**
 * Handles clicking the demo shortcut button ("• Try it out with sample token 025").
 */
function handleDemoClick() {
  clearError();
  tokenInput.value = DEFAULT_DEMO_TOKEN;
  tokenInput.focus();
}

// 3. Event Listeners
tokenForm.addEventListener("submit", handleFormSubmit);
demoShortcutBtn.addEventListener("click", handleDemoClick);

// Clear errors automatically as soon as the user starts typing
tokenInput.addEventListener("input", () => {
  if (errorAlert.classList.contains("visible")) {
    clearError();
  }
});
