/**
 * Clinic Queue Tracking System - Feature 3: Receptionist Dashboard
 * Author: Vivek Kumar (MSOT B.Tech CSE)
 * 
 * Purpose:
 * Controls the receptionist queue dashboard.
 * Requires authentication before showing controls or updating queue.
 * Displays current token, next token, waiting tokens list.
 * Advances queue when "Call Patient" or "Update Queue" is triggered.
 */

// 1. DOM Elements
const authModal = document.getElementById("authModal");
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

// 2. Authentication State Management
let currentStaffUser = null;

/**
 * Updates UI based on staff login state.
 * @param {object|null} user 
 */
function handleAuthChange(user) {
  currentStaffUser = user;

  if (user) {
    // Authenticated: Hide login modal, show user details
    authModal.classList.remove("visible");
    staffUserEmail.textContent = user.email;
    signOutBtn.style.display = "inline-block";
    renderDashboard();
  } else {
    // Not Authenticated: Lock dashboard behind auth modal
    authModal.classList.add("visible");
    staffUserEmail.textContent = "Not logged in";
    signOutBtn.style.display = "none";
  }
}

/**
 * Displays a temporary status feedback alert on the dashboard.
 * @param {string} message 
 * @param {"success"|"error"} [type="success"]
 */
function showDashboardAlert(message, type = "success") {
  receptionAlert.textContent = message;
  receptionAlert.className = `alert-box visible ${type === "success" ? "status-pill calling" : "alert-error"}`;
  setTimeout(() => {
    receptionAlert.classList.remove("visible");
  }, 4000);
}

/**
 * Renders the dashboard metrics and table from QueueService.
 */
function renderDashboard() {
  const state = window.QueueService.getQueueState();

  // 1. Update 3 Top Metric Cards (Sketch 3)
  rcCurrentToken.textContent = state.current_token || "---";
  rcNextToken.textContent = state.next_token || "None";
  rcTotalWaiting.textContent = String(state.total_waiting).padStart(2, "0");
  rcWaitingBadge.textContent = `${state.total_waiting} waiting`;

  // 2. Update Patient Queue Table
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

  // Populate table rows matching wireframe Sketch 3
  waitingTokens.forEach((token) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <span class="token-cell-number">${token.token_id}</span>
      </td>
      <td>
        <span class="status-pill waiting">
          <span class="status-dot"></span>
          Waiting
        </span>
      </td>
      <td style="text-align: right;">
        <button type="button" class="btn-call-patient" data-token="${token.token_id}">
          <span>Call Patient</span>
          <span aria-hidden="true">→</span>
        </button>
      </td>
    `;
    queueTableBody.appendChild(row);
  });
}

// 3. Event Listeners & Actions

// Login form submission
staffLoginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authErrorAlert.textContent = "";
  authErrorAlert.classList.remove("visible");

  const email = staffEmailInput.value.trim();
  const password = staffPasswordInput.value.trim();

  if (!email || !password) {
    authErrorAlert.textContent = "Please enter both staff email and password.";
    authErrorAlert.classList.add("visible");
    return;
  }

  try {
    const result = await window.FirebaseBridge.loginReceptionist(email, password);
    handleAuthChange(result.user);
  } catch (err) {
    authErrorAlert.textContent = err.message || "Authentication failed.";
    authErrorAlert.classList.add("visible");
  }
});

// Quick-fill demo credentials
autofillDemoBtn.addEventListener("click", () => {
  staffEmailInput.value = "reception@clinic.com";
  staffPasswordInput.value = "clinic123";
  authErrorAlert.classList.remove("visible");
});

// Sign out button
signOutBtn.addEventListener("click", async () => {
  await window.FirebaseBridge.logoutReceptionist();
  handleAuthChange(null);
});

// Table delegate: "Call Patient →" button clicks
queueTableBody.addEventListener("click", (e) => {
  const callBtn = e.target.closest(".btn-call-patient");
  if (!callBtn) return;

  const tokenId = callBtn.getAttribute("data-token");
  if (!tokenId) return;

  const result = window.QueueService.callPatient(tokenId);
  if (result.success) {
    showDashboardAlert(`📢 Now calling Token #${result.calledToken}. Next in line is Token #${result.nextToken}.`);
    renderDashboard();
  } else {
    showDashboardAlert(result.error, "error");
  }
});

// Bottom bar: "Update Queue" button
updateQueueBtn.addEventListener("click", () => {
  const result = window.QueueService.callPatient();
  if (result.success) {
    showDashboardAlert(`📢 Queue updated! Now calling Token #${result.calledToken}.`);
    renderDashboard();
  } else {
    showDashboardAlert(result.error || "No waiting patients to call.", "error");
  }
});

// Reset demo queue button
resetDemoBtn.addEventListener("click", () => {
  if (confirm("Reset queue back to initial demo state (Token 021 calling, 022-025 waiting)?")) {
    window.QueueService.resetQueueState();
    showDashboardAlert("🔄 Demo queue state reset successfully.");
    renderDashboard();
  }
});

// Cross-tab sync: Listen for queue updates
window.addEventListener("storage", (e) => {
  if (e.key === "clinic_queue_state" && currentStaffUser) {
    renderDashboard();
  }
});

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
  await window.FirebaseBridge.initializeFirebase();
  window.FirebaseBridge.observeAuthState(handleAuthChange);
});
