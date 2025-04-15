import { AuthClient } from "@dfinity/auth-client";
import { backend as backendActor } from "./backend";
import Chart from "chart.js/auto";

// Use local Internet Identity for development, mainnet for production
const IDENTITY_PROVIDER ="https://identity.ic0.app"


let authClient: AuthClient | null = null;
let backend = backendActor;
let currentUser: { principal: { toText: () => string }; username: string; role: any } | null = null;

// Initialize authentication and backend interaction
async function init() {
  try {
    authClient = await AuthClient.create();
    const isAuthenticated = await authClient.isAuthenticated();
    console.log("AuthClient initialized, isAuthenticated:", isAuthenticated);

    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get("invite");
    if (inviteToken && !isAuthenticated) {
      showInviteModal(inviteToken);
    } else if (isAuthenticated) {
      await loadCurrentUser();
      showAuthenticatedUI();
    } else {
      showLoginButton();
    }
  } catch (error) {
    console.error("Failed to initialize AuthClient:", error);
    showToast("Initialization failed", "error");
  }
}

// Show login button and handle login action
function showLoginButton() {
  const loginBtn = document.getElementById("loginBtn") as HTMLButtonElement;
  if (loginBtn) {
    loginBtn.style.display = "block";
    loginBtn.addEventListener("click", async () => {
      if (!authClient) {
        console.error("AuthClient is not initialized");
        showToast("Authentication error", "error");
        return;
      }
      console.log("Initiating login with provider:", IDENTITY_PROVIDER);
      try {
        await authClient.login({
          identityProvider: IDENTITY_PROVIDER,
          maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days
          onSuccess: () => {
            console.log("Login successful");
            loadCurrentUser().then(showAuthenticatedUI);
          },
          onError: (error) => {
            console.error("Login failed:", error);
            showToast("Login failed", "error");
          },
        });
      } catch (error) {
        console.error("Error during login:", error);
        showToast("Login error", "error");
      }
    });
  } else {
    console.error("Login button not found (#loginBtn)");
  }
}

// Load current user data
async function loadCurrentUser() {
  try {
    const users = await backend.getUsers();
    const principal = authClient?.getIdentity().getPrincipal().toText();
    currentUser = users.find((user: any) => user.principal.toText() === principal) || null;
    if (!currentUser) {
      console.warn("Current user not found");
      showToast("User not found", "error");
    }
  } catch (error) {
    console.error("Failed to load user:", error);
    showToast("Failed to load user", "error");
  }
}

// Show authenticated UI
function showAuthenticatedUI() {
  const loginBtn = document.getElementById("loginBtn");
  const userInfo = document.getElementById("userInfo");
  const username = document.getElementById("username");
  const userRole = document.getElementById("userRole");
  const userPrincipal = document.getElementById("userPrincipal");
  const logoutBtn = document.getElementById("logoutBtn");
  const app = document.getElementById("app");
  const adminPanel = document.getElementById("adminPanel");

  if (loginBtn) loginBtn.style.display = "none";
  if (userInfo) userInfo.style.display = "flex";
  if (username && currentUser) username.innerText = currentUser.username;
  if (userRole && currentUser) {
    userRole.innerText = "tag" in currentUser.role ? "Editor" : "Admin";
  }
  if (userPrincipal && currentUser) userPrincipal.innerText = currentUser.principal.toText();
  if (logoutBtn) logoutBtn.style.display = "inline-block";
  if (app) app.style.display = "block";
  if (adminPanel && currentUser && "tag" in currentUser.role === false) {
    adminPanel.style.display = "block";
  }

  handleLogout();
  setupThemeToggle();
  loadBudgetSummary();
  loadTransactions();
  loadBudgets();
  loadUsers();
  setupTransactionModal();
  setupBudgetForm();
  setupInviteUser();
  setupTransactionFilters();
  setupCategoryChart();
}

// Handle logout
function handleLogout() {
  const logoutBtn = document.getElementById("logoutBtn") as HTMLButtonElement;
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      if (authClient) {
        try {
          await authClient.logout();
          console.log("Logout successful");
          window.location.href = "/"; // Clear URL params
        } catch (error) {
          console.error("Error during logout:", error);
          showToast("Logout failed", "error");
        }
      }
    });
  }
}

// Load budget summary
async function loadBudgetSummary() {
  const summaryContent = document.getElementById("budgetSummaryContent");
  const loader = document.getElementById("budgetSummaryLoader");
  if (!summaryContent || !loader) return;

  try {
    loader.style.display = "block";
    const summaries = await backend.getBudgetSummary();
    summaryContent.innerHTML = "";
    summaries.forEach(([category, budget, spent, remaining]: [string, bigint, bigint, bigint]) => {
      const item = document.createElement("div");
      item.innerText = `${category}: Budget $${Number(budget) / 100}, Spent $${Number(spent) / 100}, Remaining $${Number(remaining) / 100}`;
      summaryContent.appendChild(item);
    });
  } catch (error) {
    console.error("Failed to load budget summary:", error);
    showToast("Failed to load summary", "error");
  } finally {
    loader.style.display = "none";
  }
}

// Load transactions
async function loadTransactions(
  filters: {
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    category?: string;
    paymentMethod?: string;
  } = {}
) {
  const transactionList = document.getElementById("transactionList");
  const loader = document.getElementById("transactionListLoader");
  if (!transactionList || !loader) return;

  try {
    loader.style.display = "block";
    const startTime = filters.startDate
      ? BigInt(new Date(filters.startDate).getTime() * 1000000)
      : null;
    const endTime = filters.endDate
      ? BigInt(new Date(filters.endDate).getTime() * 1000000)
      : null;
    const minAmount = filters.minAmount ? BigInt(Math.round(filters.minAmount * 100)) : null;
    const maxAmount = filters.maxAmount ? BigInt(Math.round(filters.maxAmount * 100)) : null;
    const category = filters.category || null;
    const paymentMethod = filters.paymentMethod || null;

    const transactions = await backend.getFilteredTransactions(
      startTime,
      endTime,
      minAmount,
      maxAmount,
      category,
      paymentMethod
    );
    transactionList.innerHTML = "";
    transactions.forEach(([id, tx]: [bigint, any]) => {
      const item = document.createElement("div");
      item.innerText = `ID: ${id}, Amount: $${Number(tx.amount) / 100}, Category: ${tx.category}, Date: ${new Date(Number(tx.date) / 1000000).toLocaleDateString()}`;
      const editBtn = document.createElement("button");
      editBtn.innerText = "Edit";
      editBtn.className = "button secondary small";
      editBtn.onclick = () => openTransactionModal(id, tx);
      item.appendChild(editBtn);
      transactionList.appendChild(item);
    });
  } catch (error) {
    console.error("Failed to load transactions:", error);
    showToast("Failed to load transactions", "error");
  } finally {
    loader.style.display = "none";
  }
}

// Load budgets
async function loadBudgets() {
  const budgetList = document.getElementById("budgetList");
  const loader = document.getElementById("budgetListLoader");
  if (!budgetList || !loader) return;

  try {
    loader.style.display = "block";
    const budgets = await backend.getBudgets();
    budgetList.innerHTML = "";
    budgets.forEach(([category, budget]: [string, any]) => {
      const item = document.createElement("div");
      item.innerText = `${category}: $${Number(budget.amount) / 100}`;
      if (currentUser && "tag" in currentUser.role === false) {
        const deleteBtn = document.createElement("button");
        deleteBtn.innerText = "Delete";
        deleteBtn.className = "button danger small";
        deleteBtn.onclick = () => confirmDeleteBudget(category);
        item.appendChild(deleteBtn);
      }
      budgetList.appendChild(item);
    });
    updateCategorySuggestions(budgets.map(([cat]: [string, any]) => cat));
  } catch (error) {
    console.error("Failed to load budgets:", error);
    showToast("Failed to load budgets", "error");
  } finally {
    loader.style.display = "none";
  }
}

// Load users (admin only)
async function loadUsers() {
  const userList = document.getElementById("userList");
  const loader = document.getElementById("userListLoader");
  if (!userList || !loader) return;

  try {
    loader.style.display = "block";
    const users = await backend.getUsers();
    userList.innerHTML = "";
    users.forEach((user: any) => {
      const li = document.createElement("li");
      li.innerText = `${user.username} (${"tag" in user.role ? "Editor" : "Admin"})`;
      if (currentUser && "tag" in currentUser.role === false && user.principal.toText() !== currentUser.principal.toText()) {
        const revokeBtn = document.createElement("button");
        revokeBtn.innerText = "Revoke Access";
        revokeBtn.className = "button danger small";
        revokeBtn.onclick = () => confirmRevokeAccess(user.principal);
        li.appendChild(revokeBtn);
      }
      userList.appendChild(li);
    });
  } catch (error) {
    console.error("Failed to load users:", error);
    showToast("Failed to load users", "error");
  } finally {
    loader.style.display = "none";
  }
}

// Setup transaction modal
function setupTransactionModal() {
  const modal = document.getElementById("transactionModal") as HTMLDivElement;
  const form = document.getElementById("transactionForm") as HTMLFormElement;
  const closeBtn = document.getElementById("closeTransactionModalBtn") as HTMLButtonElement;
  const addBtn = document.getElementById("addTransactionBtn") as HTMLButtonElement;

  if (addBtn) {
    addBtn.onclick = () => openTransactionModal();
  }

  if (closeBtn) {
    closeBtn.onclick = () => closeModal(modal);
  }

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const idInput = document.getElementById("transactionId") as HTMLInputElement;
      const dateInput = document.getElementById("transactionDate") as HTMLInputElement;
      const amountInput = document.getElementById("transactionAmount") as HTMLInputElement;
      const categoryInput = document.getElementById("transactionCategory") as HTMLInputElement;
      const paymentMethodInput = document.getElementById("transactionPaymentMethod") as HTMLInputElement;
      const notesInput = document.getElementById("transactionNotes") as HTMLTextAreaElement;

      const id = idInput.value ? BigInt(idInput.value) : null;
      const date = BigInt(new Date(dateInput.value).getTime() * 1000000);
      const amount = BigInt(Math.round(Number(amountInput.value) * 100));
      const category = categoryInput.value;
      const paymentMethod = paymentMethodInput.value;
      const notes = notesInput.value || null;

      try {
        if (id) {
          const result = await backend.updateTransaction(id, date, amount, category, paymentMethod, notes);
          if ("success" in result) {
            showToast("Transaction updated", "success");
            loadTransactions();
          } else {
            showToast("Failed to update transaction", "error");
          }
        } else {
          const result = await backend.addTransaction(date, amount, category, paymentMethod, notes);
          if ("success" in result) {
            showToast("Transaction added", "success");
            loadTransactions();
          } else {
            showToast("Failed to add transaction", "error");
          }
        }
        closeModal(modal);
      } catch (error) {
        console.error("Error saving transaction:", error);
        showToast("Error saving transaction", "error");
      }
    };
  }
}

// Open transaction modal
function openTransactionModal(id?: bigint, tx?: any) {
  const modal = document.getElementById("transactionModal") as HTMLDivElement;
  const overlay = document.getElementById("modalOverlay") as HTMLDivElement;
  const form = document.getElementById("transactionForm") as HTMLFormElement;
  const idInput = document.getElementById("transactionId") as HTMLInputElement;
  const dateInput = document.getElementById("transactionDate") as HTMLInputElement;
  const amountInput = document.getElementById("transactionAmount") as HTMLInputElement;
  const categoryInput = document.getElementById("transactionCategory") as HTMLInputElement;
  const paymentMethodInput = document.getElementById("transactionPaymentMethod") as HTMLInputElement;
  const notesInput = document.getElementById("transactionNotes") as HTMLTextAreaElement;

  form.reset();
  if (id && tx) {
    idInput.value = id.toString();
    dateInput.value = new Date(Number(tx.date) / 1000000).toISOString().split("T")[0];
    amountInput.value = (Number(tx.amount) / 100).toString();
    categoryInput.value = tx.category;
    paymentMethodInput.value = tx.paymentMethod;
    notesInput.value = tx.notes || "";
  } else {
    idInput.value = "";
    dateInput.value = new Date().toISOString().split("T")[0];
  }

  modal.style.display = "block";
  overlay.style.display = "block";
}

// Setup budget form
function setupBudgetForm() {
  const form = document.getElementById("budgetForm") as HTMLFormElement;
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const categoryInput = document.getElementById("budgetCategory") as HTMLInputElement;
      const amountInput = document.getElementById("budgetAmount") as HTMLInputElement;

      const category = categoryInput.value;
      const amount = BigInt(Math.round(Number(amountInput.value) * 100));

      try {
        const result = await backend.setBudget(category, amount);
        if ("success" in result) {
          showToast("Budget set", "success");
          loadBudgets();
          form.reset();
        } else {
          showToast("Failed to set budget", "error");
        }
      } catch (error) {
        console.error("Error setting budget:", error);
        showToast("Error setting budget", "error");
      }
    };
  }
}

// Setup invite user
function setupInviteUser() {
  const inviteBtn = document.getElementById("inviteUserBtn") as HTMLButtonElement;
  const linkDisplay = document.getElementById("inviteLinkDisplay") as HTMLDivElement;
  const linkElement = document.getElementById("inviteLink") as HTMLElement;
  const copyBtn = document.getElementById("copyInviteLinkBtn") as HTMLButtonElement;

  if (inviteBtn) {
    inviteBtn.onclick = async () => {
      try {
        const result = await backend.generateInviteLink();
        if ("success" in result) {
          const inviteLink = `${window.location.origin}?invite=${result.success}`;
          linkElement.innerText = inviteLink;
          linkDisplay.style.display = "block";
          showToast("Invite link generated", "success");
        } else {
          showToast("Failed to generate invite", "error");
        }
      } catch (error) {
        console.error("Error generating invite:", error);
        showToast("Error generating invite", "error");
      }
    };
  }

  if (copyBtn) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(linkElement.innerText);
      showToast("Link copied", "success");
    };
  }
}

// Show invite modal
function showInviteModal(token: string) {
  const modal = document.getElementById("acceptInviteModal") as HTMLDivElement;
  const overlay = document.getElementById("modalOverlay") as HTMLDivElement;
  const form = document.getElementById("acceptInviteForm") as HTMLFormElement;
  const tokenInput = document.getElementById("inviteToken") as HTMLInputElement;
  const errorElement = document.getElementById("inviteError") as HTMLParagraphElement;
  const closeBtn = document.getElementById("closeInviteModalBtn") as HTMLButtonElement;

  tokenInput.value = token;
  errorElement.style.display = "none";
  modal.style.display = "block";
  overlay.style.display = "block";

  if (closeBtn) {
    closeBtn.onclick = () => closeModal(modal);
  }

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById("inviteUsername") as HTMLInputElement;
      const username = usernameInput.value;

      try {
        const result = await backend.acceptInvite(token, username);
        if ("success" in result) {
          showToast("Registration successful", "success");
          closeModal(modal);
          if (authClient) {
            await authClient.login({
              identityProvider: IDENTITY_PROVIDER,
              onSuccess: () => loadCurrentUser().then(showAuthenticatedUI),
            });
          }
        } else {
          errorElement.innerText = getInviteErrorMessage(result);
          errorElement.style.display = "block";
        }
      } catch (error) {
        console.error("Error accepting invite:", error);
        showToast("Error accepting invite", "error");
      }
    };
  }
}

// Get invite error message
function getInviteErrorMessage(result: any): string {
  if ("shortUsername" in result) return "Username too short";
  if ("alreadyUsedToken" in result) return "Invite already used";
  if ("expiredToken" in result) return "Invite expired";
  if ("invalidToken" in result) return "Invalid invite";
  if ("alreadyRegistered" in result) return "Already registered";
  return "Unknown error";
}

// Setup transaction filters
function setupTransactionFilters() {
  const applyBtn = document.getElementById("applyFiltersBtn") as HTMLButtonElement;
  const clearBtn = document.getElementById("clearFiltersBtn") as HTMLButtonElement;
  const startDateInput = document.getElementById("filterStartDate") as HTMLInputElement;
  const endDateInput = document.getElementById("filterEndDate") as HTMLInputElement;
  const minAmountInput = document.getElementById("filterMinAmount") as HTMLInputElement;
  const maxAmountInput = document.getElementById("filterMaxAmount") as HTMLInputElement;
  const categoryInput = document.getElementById("filterCategory") as HTMLInputElement;
  const paymentMethodInput = document.getElementById("filterPaymentMethod") as HTMLInputElement;

  if (applyBtn) {
    applyBtn.onclick = () => {
      loadTransactions({
        startDate: startDateInput.value,
        endDate: endDateInput.value,
        minAmount: minAmountInput.value ? Number(minAmountInput.value) : undefined,
        maxAmount: maxAmountInput.value ? Number(maxAmountInput.value) : undefined,
        category: categoryInput.value || undefined,
        paymentMethod: paymentMethodInput.value || undefined,
      });
    };
  }

  if (clearBtn) {
    clearBtn.onclick = () => {
      startDateInput.value = "";
      endDateInput.value = "";
      minAmountInput.value = "";
      maxAmountInput.value = "";
      categoryInput.value = "";
      paymentMethodInput.value = "";
      loadTransactions();
    };
  }
}

// Setup category chart
function setupCategoryChart() {
  const canvas = document.getElementById("categoryChart") as HTMLCanvasElement;
  if (!canvas) return;

  backend.getBudgetSummary().then((summaries) => {
    const labels = summaries.map(([category]: [string, bigint, bigint, bigint]) => category);
    const data = summaries.map(([, , spent]: [string, bigint, bigint, bigint]) => Number(spent) / 100);

    new Chart(canvas, {
      type: "pie",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
          title: { display: true, text: "Spending by Category" },
        },
      },
    });
  }).catch((error) => {
    console.error("Failed to load chart data:", error);
    showToast("Failed to load chart", "error");
  });
}

// Update category suggestions
function updateCategorySuggestions(categories: string[]) {
  const datalist = document.getElementById("categorySuggestions") as HTMLDataListElement;
  const paymentDatalist = document.getElementById("paymentMethodSuggestions") as HTMLDataListElement;
  datalist.innerHTML = categories.map((cat) => `<option value="${cat}">`).join("");
  paymentDatalist.innerHTML = ["Cash", "Credit Card", "Debit Card", "Bank Transfer"].map(
    (method) => `<option value="${method}">`
  ).join("");
}

// Confirm delete budget
function confirmDeleteBudget(category: string) {
  showConfirmationModal(`Delete budget for ${category}?`, async () => {
    try {
      const result = await backend.deleteBudget(category);
      if ("success" in result) {
        showToast("Budget deleted", "success");
        loadBudgets();
      } else {
        showToast("Failed to delete budget", "error");
      }
    } catch (error) {
      console.error("Error deleting budget:", error);
      showToast("Error deleting budget", "error");
    }
  });
}

// Confirm revoke access
function confirmRevokeAccess(principal: any) {
  showConfirmationModal(`Revoke access for this user?`, async () => {
    try {
      const result = await backend.revokeAccess(principal);
      if ("success" in result) {
        showToast("Access revoked", "success");
        loadUsers();
      } else {
        showToast("Failed to revoke access", "error");
      }
    } catch (error) {
      console.error("Error revoking access:", error);
      showToast("Error revoking access", "error");
    }
  });
}

// Show confirmation modal
function showConfirmationModal(message: string, onConfirm: () => void) {
  const modal = document.getElementById("confirmationModal") as HTMLDivElement;
  const overlay = document.getElementById("modalOverlay") as HTMLDivElement;
  const messageElement = document.getElementById("confirmationMessage") as HTMLParagraphElement;
  const yesBtn = document.getElementById("confirmYesBtn") as HTMLButtonElement;
  const noBtn = document.getElementById("confirmNoBtn") as HTMLButtonElement;

  messageElement.innerText = message;
  modal.style.display = "block";
  overlay.style.display = "block";

  yesBtn.onclick = () => {
    onConfirm();
    closeModal(modal);
  };
  noBtn.onclick = () => closeModal(modal);
}

// Close modal
function closeModal(modal: HTMLElement) {
  const overlay = document.getElementById("modalOverlay") as HTMLDivElement;
  modal.style.display = "none";
  overlay.style.display = "none";
}

// Show toast notification
function showToast(message: string, type: "success" | "error") {
  const container = document.getElementById("toastContainer") as HTMLDivElement;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Setup theme toggle
function setupThemeToggle() {
  const toggleBtn = document.getElementById("themeToggleBtn") as HTMLButtonElement;
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      document.body.classList.toggle("light-theme");
      document.body.classList.toggle("dark-theme");
    };
  }
}

// Entry point
init().catch((error) => {
  console.error("Initialization failed:", error);
  showToast("App failed to start", "error");
});