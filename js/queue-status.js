/**
 * Clinic Queue Tracking System - Feature 2: Patient Queue Status
 * Author: Vivek Kumar (MSOT B.Tech CSE)
 * 
 * Purpose:
 * Reads the patient's token from URL parameters, looks up live queue metrics
 * (patients ahead, estimated wait time, status, progress segments),
 * and handles the "Turn Approaching" alert view.
 */

// 1. DOM Elements
const queueStatusView = document.getElementById("queueStatusView");
const invalidTokenView = document.getElementById("invalidTokenView");
const invalidTokenDesc = document.getElementById("invalidTokenDesc");

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
const approachingTokenDisplay = document.getElementById("approachingTokenDisplay");
const approachingRoomDisplay = document.getElementById("approachingRoomDisplay");
const refreshBtn = document.getElementById("refreshBtn");

// 2. State
let currentTokenId = null;

/**
 * Parses the token number from the URL or browser session storage.
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
 * Updates the 5-segment visual progress bar.
 * @param {number} activeStep - 1 through 5
 * @param {boolean} isCalling - Whether token is currently called
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
  } else {
    progressStatusText.textContent = "You're in line";
    progressStatusText.style.color = "#2563eb";
  }
}

/**
 * Main render function: Queries QueueService and populates the UI.
 */
function renderQueueStatus() {
  currentTokenId = getActiveTokenId();

  // Validate presence
  if (!currentTokenId) {
    showInvalidToken("No token number provided. Please enter your token from your clinic registration slip.");
    return;
  }

  // Fetch metrics from QueueService
  const info = window.QueueService.getTokenQueueInfo(currentTokenId);

  if (!info) {
    showInvalidToken(`Token #${currentTokenId} could not be found in today's active clinic queue. Please check your paper slip or ask at the reception desk.`);
    return;
  }

  // Token is valid: Show status view, hide invalid view
  queueStatusView.style.display = "block";
  invalidTokenView.classList.remove("visible");

  // 1. Hero Token Box
  tokenNumberDisplay.textContent = info.tokenId;
  tokenStatusText.textContent = info.statusLabel;

  if (info.status === "calling") {
    tokenStatusPill.className = "status-pill calling";
  } else {
    tokenStatusPill.className = "status-pill waiting";
  }

  // 2. Metrics (Patients Ahead & Estimated Waiting Time)
  patientsAheadDisplay.textContent = info.patientsAheadDisplay;
  waitTimeDisplay.textContent = info.waitMinutesOnly;
  waitUnitDisplay.textContent = info.waitUnit;

  // 3. 5-Segment Progress Bar
  renderProgressBar(info.progressStep, info.status === "calling");

  // 4. Populate Turn Approaching Screen
  approachingTokenDisplay.textContent = info.tokenId;
  approachingRoomDisplay.textContent = `Consultation ${info.room}`;

  // If token is already being called, update button text
  if (info.status === "calling") {
    viewTurnStatusBtn.querySelector("span:first-child").textContent = "Proceed to Room Now";
  } else {
    viewTurnStatusBtn.querySelector("span:first-child").textContent = "View Turn Status";
  }
}

/**
 * Displays the invalid token error card.
 * @param {string} message 
 */
function showInvalidToken(message) {
  queueStatusView.style.display = "none";
  invalidTokenView.classList.add("visible");
  invalidTokenDesc.textContent = message;
}

// 3. Event Listeners

// Open Turn Approaching view (Screen 4)
viewTurnStatusBtn.addEventListener("click", () => {
  turnApproachingView.classList.add("visible");
});

// Close Turn Approaching view and return to Queue Status
closeTurnStatusBtn.addEventListener("click", () => {
  turnApproachingView.classList.remove("visible");
});

// Manual refresh button
refreshBtn.addEventListener("click", () => {
  refreshBtn.innerHTML = "<span>↻ Updating...</span>";
  setTimeout(() => {
    renderQueueStatus();
    refreshBtn.innerHTML = '<span aria-hidden="true">↻</span> Check for updates';
  }, 300);
});

// Real-time synchronization:
// If another tab, the receptionist dashboard, or storage changes,
// this event automatically triggers and updates the patient screen!
window.addEventListener("storage", (event) => {
  if (event.key === "clinic_queue_state") {
    renderQueueStatus();
  }
});

window.addEventListener("clinic_queue_updated", () => {
  renderQueueStatus();
});

// Initial render on page load
document.addEventListener("DOMContentLoaded", renderQueueStatus);
