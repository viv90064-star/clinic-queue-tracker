/**
 * Clinic Queue Tracking System - Unified Portal Controller
 * Author: Vivek Kumar (MSOT B.Tech CSE)
 * 
 * Purpose:
 * Unifies the Patient Portal and Receptionist Dashboard on a single page.
 * Manages mode switching, patient token lookups, status rendering,
 * staff authentication, queue progression, and real-time synchronization.
 */

// 1. Constants
const VALID_SAMPLE_TOKENS = ["021", "022", "023", "024", "025"];
const DEFAULT_DEMO_TOKEN = "025";

// 2. DOM Elements
// Wrapper & Tabs
const unifiedWrapper = document.getElementById("unifiedWrapper");
const tabPatient = document.getElementById("tabPatient");
const tabReception = document.getElementById("tabReception");
const patientViewSection = document.getElementById("patientViewSection");
const receptionViewSection = document.getElementById("receptionViewSection");
const headerLiveTicker = document.getElementById("headerLiveTicker");

// Patient Views
const patientLookupSubView = document.getElementById("patientLookupSubView");
const patientStatusSubView = document.getElementById("patientStatusSubView");
const tokenForm = document.getElementById("tokenForm");
const tokenInput = document.getElementById("tokenInput");
const errorAlert = document.getElementById("errorAlert");
const demoShortcutBtn = document.getElementById("demoShortcutBtn");

// Patient Status View Elements
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
const backToLookupBtn = document.getElementById("backToLookupBtn");
const refreshBtn = document.getElementById("refreshBtn");

// Turn Approaching Modal
const turnApproachingModal = document.getElementById("turnApproachingModal");
const closeTurnStatusBtn = document.getElementById("closeTurnStatusBtn");
const approachingTokenDisplay = document.getElementById("approachingTokenDisplay");
const approachingRoomDisplay = document.getElementById("approachingRoomDisplay");

// Reception Elements
const receptionAuthBox = document.getElementById("receptionAuthBox");
const receptionDashboardBox = document.getElementById("receptionDashboardBox");
const staffLoginForm = document.getElementById("staffLoginForm");
const staffEmailInput = document.getElementById("staffEmail");
const staffPasswordInput = document.getElementById("staffPassword");
const authErrorAlert = document.getElementById("authErrorAlert");
const autofillDemoBtn = document.getElementById("autofillDemoBtn");
const staffUserEmail = document.getElementById("staffUserEmail");
const signOutBtn = document.getElementById("signOutBtn");

const rcCurrentToken = document.getElementById("rcCurrentToken");
const rcNextToken = document.getElementById("rcNextToken");
const rcTotalWaiting = document.getElementById("rcTotalWaiting");
const rcWaitingBadge = document.getElementById("rcWaitingBadge");
const queueTableBody = document.getElementById("queueTableBody");
const receptionAlert = document.getElementById("receptionAlert");

const updateQueueBtn = document.getElementById("updateQueueBtn");
const resetDemoBtn = document.getElementById("resetDemoBtn");

// 3. Application State
let activeTab = "patient"; // "patient" | "reception"
let currentActiveToken = null;
let currentStaffUser = null;

// ==========================================================================
// 4. Mode / Tab Switching Logic
// ==========================================================================
function switchTab(tabName) {
  activeTab = tabName;

  if (tabName === "patient") {
    tabPatient.classList.add("active");
    tabPatient.setAttribute("aria-selected", "true");
    tabReception.classList.remove("active");
    tabReception.setAttribute("aria-selected", "false");

    patientViewSection.classList.add("active-view");
    receptionViewSection.classList.remove("active-view");

    unifiedWrapper.classList.remove("reception-expanded");
  } else {
    tabReception.classList.add("active");
    tabReception.setAttribute("aria-selected", "true");
    tabPatient.classList.remove("active");
    tabPatient.setAttribute("aria-selected", "false");

    receptionViewSection.classList.add("active-view");
    patientViewSection.classList.remove("active-view");

    unifiedWrapper.classList.add("reception-expanded");
  }

  updateLiveHeaderTicker();
}

// ==========================================================================
// 5. Header Live Ticker
// ==========================================================================
function updateLiveHeaderTicker() {
  if (!headerLiveTicker) return;
  const state = window.QueueService.getQueueState();
  const current = state.current_token || "021";
  const waiting = state.total_waiting;
  headerLiveTicker.innerHTML = `<span class="portal-pulse-dot"></span> Live Queue: Serving <strong>#${current}</strong> • ${waiting} waiting`;
}

// ==========================================================================
// 6. Patient Portal Controller
// ==========================================================================
function normalizeToken(rawInput) {
  const cleaned = (rawInput || "").trim();
  if (/^\d{1,2}$/.test(cleaned)) {
    return cleaned.padStart(3, "0");
  }
  return cleaned;
}

function showPatientError(msg) {
  errorAlert.textContent = msg;
  errorAlert.classList.add("visible");
  tokenInput.focus();
}

function clearPatientError() {
  errorAlert.textContent = "";
  errorAlert.classList.remove("visible");
}

function showPatientLookupView() {
  patientLookupSubView.classList.add("active-subview");
  patientStatusSubView.classList.remove("active-subview");
  clearPatientError();
  tokenInput.value = "";
  currentActiveToken = null;
  sessionStorage.removeItem("clinic_current_token");
}

function showPatientStatusView(tokenId) {
  currentActiveToken = tokenId;
  sessionStorage.setItem("clinic_current_token", tokenId);

  patientLookupSubView.classList.remove("active-subview");
  patientStatusSubView.classList.add("active-subview");

  renderPatientStatus();
}

function renderPatientProgressBar(activeStep, isCalling) {
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

function renderPatientStatus() {
  if (!currentActiveToken) return;

  const info = window.QueueService.getTokenQueueInfo(currentActiveToken);

  if (!info) {
    showPatientError(`Token #${currentActiveToken} could not be found in today's active clinic queue.`);
    showPatientLookupView();
    return;
  }

  // 1. Hero Token Card
  tokenNumberDisplay.textContent = info.tokenId;
  tokenStatusText.textContent = info.statusLabel;

  if (info.status === "calling") {
    tokenStatusPill.className = "status-pill calling";
  } else if (info.status === "completed") {
    tokenStatusPill.className = "status-pill";
    tokenStatusPill.style.backgroundColor = "#e2e8f0";
    tokenStatusPill.style.color = "#475569";
  } else {
    tokenStatusPill.className = "status-pill waiting";
  }

  // 2. Metrics
  patientsAheadDisplay.textContent = info.patientsAheadDisplay;
  waitTimeDisplay.textContent = info.waitMinutesOnly;
  waitUnitDisplay.textContent = info.waitUnit;

  // 3. Progress Bar
  renderPatientProgressBar(info.progressStep, info.status === "calling");

  // 4. Dynamic Inline Turn Alert Banner
  if (info.isYourTurn) {
    inlineTurnAlert.classList.add("visible");
    turnAlertIcon.textContent = "🎉";
    turnAlertTitle.textContent = "Now Being Called!";
    turnAlertMsg.textContent = `Token #${info.tokenId}: Please proceed immediately to ${info.room}.`;
  } else if (info.isTurnApproaching) {
    inlineTurnAlert.classList.add("visible");
    turnAlertIcon.textContent = "🔔";
    turnAlertTitle.textContent = "Your turn is approaching!";
    turnAlertMsg.textContent = `You are next in line. Please stay near ${info.room}.`;
  } else {
    inlineTurnAlert.classList.remove("visible");
  }

  // Update Modal Content
  if (approachingTokenDisplay) approachingTokenDisplay.textContent = info.tokenId;
  if (approachingRoomDisplay) approachingRoomDisplay.textContent = info.room;
}

function handleTokenSubmit(event) {
  event.preventDefault();
  clearPatientError();

  const normalized = normalizeToken(tokenInput.value);

  if (!normalized) {
    showPatientError("Please enter your token number from your registration slip.");
    return;
  }

  if (!/^\d+$/.test(normalized)) {
    showPatientError("Token numbers must only contain digits (e.g. 025).");
    return;
  }

  if (!VALID_SAMPLE_TOKENS.includes(normalized)) {
    showPatientError(`Token #${normalized} was not found. Today's pilot queue: 021, 022, 023, 024, 025.`);
    return;
  }

  showPatientStatusView(normalized);
}

// ==========================================================================
// 7. Receptionist Desk Controller
// ==========================================================================
function handleAuthChange(user) {
  currentStaffUser = user;

  if (user) {
    receptionAuthBox.style.display = "none";
    receptionDashboardBox.style.display = "block";
    staffUserEmail.textContent = user.email;
    signOutBtn.style.display = "inline-block";
    renderReceptionDashboard();
  } else {
    receptionAuthBox.style.display = "block";
    receptionDashboardBox.style.display = "none";
    staffUserEmail.textContent = "Not logged in";
    signOutBtn.style.display = "none";
  }
}

function showReceptionAlert(message, type = "success") {
  receptionAlert.textContent = message;
  receptionAlert.className = `alert-box visible ${type === "success" ? "status-pill calling" : "alert-error"}`;
  setTimeout(() => {
    receptionAlert.classList.remove("visible");
  }, 4000);
}

function renderReceptionDashboard() {
  const state = window.QueueService.getQueueState();

  // 1. Metric Cards
  rcCurrentToken.textContent = state.current_token || "---";
  rcNextToken.textContent = state.next_token || "None";
  rcTotalWaiting.textContent = String(state.total_waiting).padStart(2, "0");
  rcWaitingBadge.textContent = `${state.total_waiting} waiting`;

  // 2. Queue Table
  queueTableBody.innerHTML = "";
  const waitingTokens = state.tokens.filter(t => t.status === "waiting");

  if (waitingTokens.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="3" style="text-align: center; color: #64748b; padding: 24px;">
        🎉 All registered patients for today have been served.
      </td>
    `;
    queueTableBody.appendChild(emptyRow);
    return;
  }

  waitingTokens.forEach((token) => {
    const isNext = token.token_id === state.next_token;
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>
        <span class="table-token-number">${token.token_id}</span>
      </td>
      <td>
        <span class="table-status-pill ${isNext ? 'next' : 'waiting'}">
          ${isNext ? '• Next in line' : 'Waiting in area'}
        </span>
      </td>
      <td class="col-action">
        <button 
          type="button" 
          class="btn-call-patient" 
          data-token="${token.token_id}"
          title="Call token ${token.token_id} into ${state.doctor_room || 'Room 1'}"
        >
          Call Patient →
        </button>
      </td>
    `;
    queueTableBody.appendChild(row);
  });

  // Attach button listeners
  const callButtons = queueTableBody.querySelectorAll(".btn-call-patient");
  callButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tokenId = btn.getAttribute("data-token");
      callTokenAndSync(tokenId);
    });
  });
}

function callTokenAndSync(tokenId) {
  const result = window.QueueService.callPatient(tokenId);
  if (result.success) {
    showReceptionAlert(`Calling Token ${result.calledToken} in Consultation Room 1.`);
    renderReceptionDashboard();
    updateLiveHeaderTicker();
    if (currentActiveToken) {
      renderPatientStatus();
    }
  } else {
    showReceptionAlert(result.error || "Failed to call patient.", "error");
  }
}

async function handleStaffLogin(event) {
  event.preventDefault();
  authErrorAlert.textContent = "";
  authErrorAlert.classList.remove("visible");

  const email = staffEmailInput.value.trim();
  const password = staffPasswordInput.value.trim();

  if (!email || !password) {
    authErrorAlert.textContent = "Please enter both email and password.";
    authErrorAlert.classList.add("visible");
    return;
  }

  const submitBtn = document.getElementById("loginSubmitBtn");
  try {
    submitBtn.textContent = "Signing In...";
    submitBtn.disabled = true;

    const result = await window.FirebaseBridge.loginReceptionist(email, password);
    handleAuthChange(result.user);
    showReceptionAlert(`Welcome, ${result.user.email}! Queue dashboard ready.`);
  } catch (err) {
    authErrorAlert.textContent = err.message || "Failed to sign in. Please verify credentials.";
    authErrorAlert.classList.add("visible");
  } finally {
    submitBtn.textContent = "Sign In to Dashboard";
    submitBtn.disabled = false;
  }
}

async function handleStaffLogout() {
  try {
    await window.FirebaseBridge.logoutReceptionist();
    handleAuthChange(null);
  } catch (err) {
    console.error("Sign out error:", err);
  }
}

// ==========================================================================
// 8. Event Wiring & Initialization
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  // 1. Tab Switching Listeners
  tabPatient.addEventListener("click", () => switchTab("patient"));
  tabReception.addEventListener("click", () => switchTab("reception"));

  // 2. Patient Form Listeners
  tokenForm.addEventListener("submit", handleTokenSubmit);
  demoShortcutBtn.addEventListener("click", () => {
    tokenInput.value = DEFAULT_DEMO_TOKEN;
    clearPatientError();
    showPatientStatusView(DEFAULT_DEMO_TOKEN);
  });

  tokenInput.addEventListener("input", () => {
    if (errorAlert.classList.contains("visible")) {
      clearPatientError();
    }
  });

  backToLookupBtn.addEventListener("click", showPatientLookupView);

  refreshBtn.addEventListener("click", () => {
    refreshBtn.classList.add("spinning");
    renderPatientStatus();
    updateLiveHeaderTicker();
    setTimeout(() => refreshBtn.classList.remove("spinning"), 600);
  });

  // 3. Turn Status Modal Listeners
  viewTurnStatusBtn.addEventListener("click", () => {
    turnApproachingModal.classList.add("visible");
  });

  closeTurnStatusBtn.addEventListener("click", () => {
    turnApproachingModal.classList.remove("visible");
  });

  // 4. Reception Listeners
  staffLoginForm.addEventListener("submit", handleStaffLogin);
  signOutBtn.addEventListener("click", handleStaffLogout);

  autofillDemoBtn.addEventListener("click", () => {
    staffEmailInput.value = "reception@clinic.com";
    staffPasswordInput.value = "clinic123";
    authErrorAlert.classList.remove("visible");
  });

  updateQueueBtn.addEventListener("click", () => {
    callTokenAndSync(null); // Calls next in line
  });

  resetDemoBtn.addEventListener("click", () => {
    window.QueueService.resetQueueState();
    showReceptionAlert("Queue reset to initial demo state (021 calling, 022–025 waiting).");
    renderReceptionDashboard();
    updateLiveHeaderTicker();
    if (currentActiveToken) {
      renderPatientStatus();
    }
  });

  // 5. Cross-View & Cross-Tab Real-time Synchronization
  window.addEventListener("clinic_queue_updated", () => {
    updateLiveHeaderTicker();
    if (activeTab === "reception" && currentStaffUser) {
      renderReceptionDashboard();
    }
    if (currentActiveToken) {
      renderPatientStatus();
    }
  });

  window.addEventListener("storage", (e) => {
    if (e.key === "clinic_queue_state") {
      updateLiveHeaderTicker();
      if (currentStaffUser) renderReceptionDashboard();
      if (currentActiveToken) renderPatientStatus();
    }
  });

  // 6. Connect Firebase Auth Observer
  if (window.FirebaseBridge) {
    window.FirebaseBridge.initializeFirebase().then(() => {
      window.FirebaseBridge.observeAuthState(handleAuthChange);
    });
  }

  // 7. Initial URL / Query Parameters Handling
  const urlParams = new URLSearchParams(window.location.search);
  const tokenParam = urlParams.get("token");
  const tabParam = urlParams.get("tab");
  const hash = window.location.hash;

  if (tabParam === "reception" || hash === "#reception") {
    switchTab("reception");
  } else {
    switchTab("patient");
  }

  if (tokenParam) {
    const cleanToken = normalizeToken(tokenParam);
    if (VALID_SAMPLE_TOKENS.includes(cleanToken)) {
      showPatientStatusView(cleanToken);
    }
  } else {
    // Check if there was a saved token in session
    const savedToken = sessionStorage.getItem("clinic_current_token");
    if (savedToken && VALID_SAMPLE_TOKENS.includes(savedToken)) {
      showPatientStatusView(savedToken);
    }
  }

  updateLiveHeaderTicker();
});
