/**
 * Clinic Queue Tracking System - Shared Queue Service
 * Author: Vivek Kumar (MSOT B.Tech CSE)
 * 
 * Purpose:
 * Single source of truth for queue data calculations and queue progression.
 * Supports sample tokens 021-025 with 021 initially being served.
 * Advances queue when staff calls next patient.
 */

const QUEUE_STORAGE_KEY = "clinic_queue_state";

// Baseline sample queue data matching requirements
const DEFAULT_QUEUE_STATE = {
  current_token: "021",
  current_status: "calling",
  next_token: "022",
  total_waiting: 4,
  doctor_room: "Room 1",
  avg_mins_per_patient: 6,
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
 * Retrieves the current queue state from storage or initializes defaults.
 * @returns {object} Queue state object
 */
function getQueueState() {
  try {
    const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn("Storage read failed, using defaults:", err);
  }
  saveQueueState(DEFAULT_QUEUE_STATE);
  return DEFAULT_QUEUE_STATE;
}

/**
 * Saves the queue state to storage and syncs to Firestore if live.
 * @param {object} state 
 */
function saveQueueState(state) {
  try {
    state.last_updated = new Date().toISOString();
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(state));

    // Dispatch a local custom event so this same tab knows storage changed
    window.dispatchEvent(new CustomEvent("clinic_queue_updated", { detail: state }));
  } catch (err) {
    console.error("Failed to save queue state:", err);
  }
}

/**
 * Resets the queue state to initial default (021 calling, 022-025 waiting).
 */
function resetQueueState() {
  const fresh = JSON.parse(JSON.stringify(DEFAULT_QUEUE_STATE));
  fresh.last_updated = new Date().toISOString();
  saveQueueState(fresh);
  return fresh;
}

/**
 * Advances the queue by calling a specific patient token, or the next in line.
 * @param {string} [tokenId] - Optional specific token to call (e.g. "022")
 * @returns {{ success: boolean, calledToken?: string, error?: string }}
 */
function callPatient(tokenId) {
  const state = getQueueState();

  // 1. Identify which token to call
  let targetToken = null;
  if (tokenId) {
    const normalized = tokenId.trim().padStart(3, "0");
    targetToken = state.tokens.find(t => t.token_id === normalized && t.status === "waiting");
    if (!targetToken) {
      return { success: false, error: `Token #${tokenId} is not waiting in the queue.` };
    }
  } else {
    // Call the next waiting token in order
    targetToken = state.tokens.find(t => t.status === "waiting");
    if (!targetToken) {
      return { success: false, error: "No more waiting patients in today's queue!" };
    }
  }

  // 2. Mark previous calling token as completed
  const previousCalling = state.tokens.find(t => t.token_id === state.current_token);
  if (previousCalling) {
    previousCalling.status = "completed";
    previousCalling.completed_at = new Date().toISOString();
  }

  // 3. Update target token to calling
  targetToken.status = "calling";
  targetToken.called_at = new Date().toISOString();
  state.current_token = targetToken.token_id;
  state.current_status = "calling";

  // 4. Determine new next token
  const nextWaiting = state.tokens.find(t => t.status === "waiting");
  state.next_token = nextWaiting ? nextWaiting.token_id : "None";

  // 5. Update total waiting count
  const waitingCount = state.tokens.filter(t => t.status === "waiting").length;
  state.total_waiting = waitingCount;

  // 6. Save and notify
  saveQueueState(state);

  return {
    success: true,
    calledToken: targetToken.token_id,
    nextToken: state.next_token,
    totalWaiting: state.total_waiting
  };
}

/**
 * Looks up a specific token and calculates its current queue metrics.
 * @param {string} tokenId - e.g. "025"
 * @returns {object|null} Computed token metrics or null if not found
 */
function getTokenQueueInfo(tokenId) {
  if (!tokenId) return null;

  const normalizedId = tokenId.trim().padStart(3, "0");
  const state = getQueueState();

  const tokenObj = state.tokens.find(t => t.token_id === normalizedId);
  if (!tokenObj) {
    return null;
  }

  // Check if completed
  if (tokenObj.status === "completed") {
    return {
      tokenId: normalizedId,
      status: "completed",
      statusLabel: "Consultation Completed",
      patientsAhead: 0,
      patientsAheadDisplay: "00",
      estimatedWaitText: "Completed",
      waitMinutesOnly: "0",
      waitUnit: "mins",
      progressStep: 5,
      isTurnApproaching: false,
      room: state.doctor_room || "Room 1",
      note: "Your consultation has ended. Thank you."
    };
  }

  // Check if currently being called
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
      progressStep: 5,
      isTurnApproaching: true,
      room: state.doctor_room || "Room 1",
      note: "Please proceed immediately to Consultation Room 1."
    };
  }

  // Count active consultations ahead:
  // 1. Tokens waiting with an earlier order number
  const waitingAhead = state.tokens.filter(t => 
    t.status === "waiting" && t.order < tokenObj.order
  ).length;

  // 2. Active token currently in consultation with the doctor
  const currentCallingCount = (state.current_token && state.current_token !== normalizedId) ? 1 : 0;
  
  const totalPatientsAhead = waitingAhead + currentCallingCount;

  let estimatedWaitText = "";
  let waitMinutesOnly = "";
  let waitUnit = "minutes";
  let progressStep = 1;

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
    // 4 or more patients ahead
    const minWait = totalPatientsAhead * 5;
    const maxWait = Math.round(totalPatientsAhead * 7.5 / 5) * 5;
    estimatedWaitText = `${minWait}–${maxWait} minutes`;
    waitMinutesOnly = `${minWait}–${maxWait}`;
    progressStep = 1;
  }

  const patientsAheadDisplay = String(totalPatientsAhead).padStart(2, "0");
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

// Export for app scripts
window.QueueService = {
  getQueueState,
  saveQueueState,
  resetQueueState,
  callPatient,
  getTokenQueueInfo
};
