/**
 * Clinic Queue Tracking System - Feature 2 & 4: Patient Queue Status
 * Author: Vivek Kumar (MSOT B.Tech CSE)
 * 
 * Purpose:
 * Reads patient token from URL, queries QueueService, renders live metrics,
 * displays inline and full Turn Approaching messages when turn is near,
 * and synchronizes automatically on refresh or queue updates.
 */

// 1. DOM Elements
const queueStatusView = document.getElementById("queueStatusView");
const invalidTokenView = document.getElementById("invalidTokenView");
const invalidTokenDesc = document.getElementById("invalidTokenDesc");

const inlineTurnAlert = document.getElementById("inlineTurnAlert");
const turnAlertIcon = document.getElementById("turnAlertIcon");
const turnAlertTitle = document.getElementById("turnAlertTitle");
const turnAlertMsg = document.getElementById("turnAlertMsg");

const tokenNumberDisplay = document.getElementById("tokenNumberDisplay");
const tokenStatusPill = document.getElementById("tokenStatusPill");
const tokenStatusText = document.getElementById("tokenStatusText");
const patientsAheadDisplay = document.getElementById("patientsAheadDisplay");
const waitTimeDisplay = document.getElementById("waitTimeDisplay");
const waitUnitDisplay = document.getElementById("waitUnitDisplay");
const progressStatusText = document.getElementById("progressStatusText");

const progressSegments = [
  document.getElementById("seg1"),
  document.getElementById("seg2"),
  document.getElementById("seg3"),
  document.getElementById("seg4"),
  document.getElementById("seg5")
];

const viewTurnStatusBtn = document.getElementById("viewTurnStatusBtn");
const turnApproachingView = document.getElementById("turnApproachingView");
const closeTurnStatusBtn = document.getElementById("closeTurnStatusBtn");
const approachingViewTitle = document.getElementById("approachingViewTitle");
const approachingViewDesc = document.getElementById("approachingViewDesc");
const approachingTokenDisplay = document.getElementById("approachingTokenDisplay");
const approachingRoomDisplay = document.getElementById("approachingRoomDisplay");
const refreshBtn = document.getElementById("refreshBtn");

let currentTokenId = null;

/**
 * Extracts the active token number from URL params or storage.
 * @returns {string|null}
 */
function getActiveTokenId() {
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("token");
  if (tokenFromUrl) {
    return tokenFromUrl.trim();
  }
  const tokenFromStorage = sessionStorage.getItem("clinic_current_token");
  if (tokenFromStorage) {
    return tokenFromStorage.trim();
  }
  return null;
}

/**
 * Renders the 5-segment visual progress bar.
 * @param {number} activeStep - 1 through 5
 * @param {boolean} isCalling - Whether currently calling
 */
function renderProgressBar(activeStep, isCalling) {
  progressSegments.forEach((seg, index) => {
    if (index < activeStep) {
      seg.classList.add("active");
    } else {
      seg.classList.remove("active");
    }
  });

  if (isCalling) {
    progressStatusText.textContent = "Your turn now!";
    progressStatusText.style.color = "#166534";
  } else if (activeStep >= 4) {
    progressStatusText.textContent = "Almost there!";
    progressStatusText.style.color = "#d97706";
  } else if (activeStep >= 2) {
    progressStatusText.textContent = "Moving forward";
    progressStatusText.style.color = "#2563eb";
  } else {
    progressStatusText.textContent = "You're in line";
    progressStatusText.style.color = "#64748b";
  }
}

/**
 * Main render function: Computes and displays queue status.
 */
function renderQueueStatus() {
  currentTokenId = getActiveTokenId();

  if (!currentTokenId) {
    showInvalidToken("No token number provided. Please enter your token from your clinic registration slip.");
    return;
  }

  const info = window.QueueService.getTokenQueueInfo(currentTokenId);

  if (!info) {
    showInvalidToken(`Token #${currentTokenId} could not be found in today's active clinic queue. Please check your paper slip or ask at the reception desk.`);
    return;
  }

  // Token is valid: Show status view
  queueStatusView.style.display = "block";
  invalidTokenView.classList.remove("visible");

  // 1. Hero Token Card
  tokenNumberDisplay.textContent = info.tokenId;
  tokenStatusText.textContent = info.statusLabel;

  if (info.status === "calling") {
    tokenStatusPill.className = "status-pill calling";
  } else if (info.status === "completed") {
    tokenStatusPill.className = "status-pill completed";
  } else {
    tokenStatusPill.className = "status-pill waiting";
  }

  // 2. Metrics (Patients Ahead & Estimated Waiting Time)
  patientsAheadDisplay.textContent = info.patientsAheadDisplay;
  waitTimeDisplay.textContent = info.waitMinutesOnly;
  waitUnitDisplay.textContent = info.waitUnit;

  // 3. 5-Segment Progress Bar
  renderProgressBar(info.progressStep, info.status === "calling");

  // 4. Simple Turn Approaching Message (Inline Alert)
  if (info.isYourTurn) {
    // Patient is currently being called
    inlineTurnAlert.className = "inline-turn-alert visible calling";
    turnAlertIcon.textContent = "🎉";
    turnAlertTitle.textContent = "It's Your Turn Now!";
    turnAlertMsg.textContent = `Token #${info.tokenId}: Please proceed into Consultation ${info.room} immediately.`;

    approachingViewTitle.textContent = "It's Your Turn!";
    approachingViewDesc.innerHTML = `Token <strong>${info.tokenId}</strong> is being called right now.`;
    viewTurnStatusBtn.querySelector("span:first-child").textContent = "Proceed to Room Now";
  } else if (info.isTurnApproaching) {
    // Patient is next in line or 1 ahead
    inlineTurnAlert.className = "inline-turn-alert visible";
    turnAlertIcon.textContent = "🔔";
    turnAlertTitle.textContent = "Your turn is approaching!";
    turnAlertMsg.textContent = `You are next in line. Please stay near Consultation ${info.room}.`;

    approachingViewTitle.textContent = "Your Turn is Approaching!";
    approachingViewDesc.innerHTML = `Token <strong>${info.tokenId}</strong> is next in line. Please stay near the consultation room.`;
    viewTurnStatusBtn.querySelector("span:first-child").textContent = "View Turn Status";
  } else {
    // Normal waiting state (2+ patients ahead)
    inlineTurnAlert.className = "inline-turn-alert";
    approachingViewTitle.textContent = "Your Turn Status";
    approachingViewDesc.innerHTML = `Token <strong>${info.tokenId}</strong> is currently waiting. ${info.patientsAheadDisplay} patients are ahead of you.`;
    viewTurnStatusBtn.querySelector("span:first-child").textContent = "View Turn Status";
  }

  // Full Screen 4 details
  approachingTokenDisplay.textContent = info.tokenId;
  approachingRoomDisplay.textContent = `Consultation ${info.room}`;
}

/**
 * Displays the invalid token error view.
 * @param {string} message 
 */
function showInvalidToken(message) {
  queueStatusView.style.display = "none";
  invalidTokenView.classList.add("visible");
  invalidTokenDesc.textContent = message;
}

// 2. Event Listeners

// Open Turn Approaching screen (Screen 4)
viewTurnStatusBtn.addEventListener("click", () => {
  turnApproachingView.classList.add("visible");
});

// Close Turn Approaching screen
closeTurnStatusBtn.addEventListener("click", () => {
  turnApproachingView.classList.remove("visible");
});

// Manual refresh button
refreshBtn.addEventListener("click", () => {
  refreshBtn.innerHTML = "<span>↻ Checking...</span>";
  setTimeout(() => {
    renderQueueStatus();
    refreshBtn.innerHTML = '<span aria-hidden="true">↻</span> Refresh queue status';
  }, 250);
});

// Real-time synchronization:
// Listens to cross-window storage events and local custom events
window.addEventListener("storage", (event) => {
  if (event.key === "clinic_queue_state") {
    renderQueueStatus();
  }
});

window.addEventListener("clinic_queue_updated", () => {
  renderQueueStatus();
});

// Initial load
document.addEventListener("DOMContentLoaded", renderQueueStatus);
