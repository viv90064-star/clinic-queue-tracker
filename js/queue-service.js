/**
 * Clinic Queue Tracking System - Shared Queue Service
 * Author: Vivek Kumar (MSOT B.Tech CSE)
 * 
 * Purpose:
 * Single source of truth for queue data calculations.
 * Supports sample tokens 021-025 with 021 initially being served.
 * Provides functions to calculate patients ahead, estimated wait-time ranges,
 * and 5-segment progress steps.
 */

// Key used in browser storage so updates persist across pages
const QUEUE_STORAGE_KEY = "clinic_queue_state";

// Baseline sample queue data specified in the project requirements
const DEFAULT_QUEUE_STATE = {
  current_token: "021",
  current_status: "calling",
  doctor_room: "Room 1",
  avg_mins_per_patient: 6, // 5 to 7 mins average
  last_updated: new Date().toISOString(),
  tokens: [
    { token_id: "021", order: 1, status: "calling", note: "Now being called in Room 1" },
    { token_id: "022", order: 2, status: "waiting", note: "Next in line" },
    { token_id: "023", order: 3, status: "waiting", note: "In waiting area" },
    { token_id: "024", order: 4, status: "waiting", note: "In waiting area" },
    { token_id: "025", order: 5, status: "waiting", note: "In waiting area" }
  ]
};

/**
 * Retrieves the current queue state from storage, or initializes with defaults.
 * @returns {object} Queue state object
 */
function getQueueState() {
  try {
    const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn("Storage read failed, using default queue state:", err);
  }
  // Initialize storage with defaults
  saveQueueState(DEFAULT_QUEUE_STATE);
  return DEFAULT_QUEUE_STATE;
}

/**
 * Saves the queue state to storage.
 * @param {object} state 
 */
function saveQueueState(state) {
  try {
    state.last_updated = new Date().toISOString();
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save queue state:", err);
  }
}

/**
 * Resets the queue state to the initial default (021 calling, 022-025 waiting).
 */
function resetQueueState() {
  saveQueueState(DEFAULT_QUEUE_STATE);
  return DEFAULT_QUEUE_STATE;
}

/**
 * Looks up a specific token and calculates its current queue metrics.
 * @param {string} tokenId - e.g. "025"
 * @returns {object|null} Computed token metrics or null if not found
 */
function getTokenQueueInfo(tokenId) {
  if (!tokenId) return null;

  // Normalize token (e.g., "25" -> "025")
  const normalizedId = tokenId.trim().padStart(3, "0");
  const state = getQueueState();

  const tokenObj = state.tokens.find(t => t.token_id === normalizedId);
  if (!tokenObj) {
    return null; // Invalid or unknown token
  }

  // 1. Check if this token is currently being called
  const isCurrentlyCalling = (state.current_token === normalizedId) || (tokenObj.status === "calling");

  if (isCurrentlyCalling) {
    return {
      tokenId: normalizedId,
      status: "calling",
      statusLabel: "Now Being Called",
      patientsAhead: 0,
      patientsAheadDisplay: "00",
      estimatedWaitText: "Now (Your Turn!)",
      waitMinutesOnly: "0",
      waitUnit: "mins",
      progressStep: 5, // All 5 steps complete
      isTurnApproaching: true,
      room: state.doctor_room || "Room 1",
      note: "Please proceed immediately to Consultation Room 1."
    };
  }

  // 2. Count patients ahead:
  // Active tokens with order < this token's order that are not completed
  // Plus 1 if the currently calling patient is still in consultation!
  const waitingAhead = state.tokens.filter(t => 
    t.status === "waiting" && t.order < tokenObj.order
  ).length;

  // If a patient is currently with the doctor, that consultation is also ahead of this patient
  const currentCallingCount = (state.current_token && state.current_token !== normalizedId) ? 1 : 0;
  
  // Total people to be seen before this patient's turn:
  const totalPatientsAhead = waitingAhead + currentCallingCount;

  // 3. Calculate waiting-time range based on 5–7 mins per consultation
  let estimatedWaitText = "";
  let waitMinutesOnly = "";
  let waitUnit = "minutes";
  let progressStep = 1; // 1 to 5

  if (totalPatientsAhead === 0) {
    estimatedWaitText = "Next in line (< 5 mins)";
    waitMinutesOnly = "< 5";
    progressStep = 4;
  } else if (totalPatientsAhead === 1) {
    estimatedWaitText = "5–10 minutes";
    waitMinutesOnly = "5–10";
    progressStep = 4;
  } else if (totalPatientsAhead === 2) {
    estimatedWaitText = "10–15 minutes";
    waitMinutesOnly = "10–15";
    progressStep = 3;
  } else if (totalPatientsAhead === 3) {
    estimatedWaitText = "15–20 minutes";
    waitMinutesOnly = "15–20";
    progressStep = 2;
  } else {
    // 4 or more patients ahead (e.g. for Token 025: 4 ahead -> 20-30 minutes)
    const minWait = totalPatientsAhead * 5;
    const maxWait = Math.round(totalPatientsAhead * 7.5 / 5) * 5; // round to multiple of 5
    estimatedWaitText = `${minWait}–${maxWait} minutes`;
    waitMinutesOnly = `${minWait}–${maxWait}`;
    progressStep = 1;
  }

  // Formatted patients ahead display with leading zero (e.g., "04")
  const patientsAheadDisplay = String(totalPatientsAhead).padStart(2, "0");

  // Turn is approaching if next in line or 1 ahead
  const isTurnApproaching = totalPatientsAhead <= 1;

  return {
    tokenId: normalizedId,
    status: tokenObj.status,
    statusLabel: tokenObj.status === "waiting" ? "Waiting" : tokenObj.status,
    patientsAhead: totalPatientsAhead,
    patientsAheadDisplay: patientsAheadDisplay,
    estimatedWaitText: estimatedWaitText,
    waitMinutesOnly: waitMinutesOnly,
    waitUnit: waitUnit,
    progressStep: progressStep,
    isTurnApproaching: isTurnApproaching,
    room: state.doctor_room || "Room 1",
    note: isTurnApproaching
      ? "Your turn is approaching! Please stay near the consultation room."
      : "You're registered. We'll take it from here."
  };
}

// Export for browser scripts
window.QueueService = {
  getQueueState,
  saveQueueState,
  resetQueueState,
  getTokenQueueInfo
};
