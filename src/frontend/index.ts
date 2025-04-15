import { AuthClient } from "@dfinity/auth-client";
import { backend } from "declarations/backend";

// Define constants for canister ID and Identity Provider URL
const CANISTER_ID = "your-backend-canister-id";
const IDENTITY_PROVIDER = "https://identity.ic0.app";

// Initialize the AuthClient globally
let authClient = null;
let backend = null;

// Initialize authentication and backend interaction
async function init() {
  authClient = await AuthClient.create();
  if (await authClient.isAuthenticated()) {
    showAuthenticatedUI();
  } else {
    showLoginButton();
  }
}

// Show login button and handle login action
function showLoginButton() {
  const loginBtn = document.getElementById("loginBtn");
  loginBtn.style.display = "block";
  loginBtn.addEventListener("click", async () => {
    await authClient.login({
      identityProvider: IDENTITY_PROVIDER,
      onSuccess: async () => {
        showAuthenticatedUI();
      },
    });
  });
}

// Show the UI elements for authenticated users
function showAuthenticatedUI() {
  document.getElementById("logoutBtn").style.display = "block";
  document.getElementById("app").style.display = "block";
  loadUserData();
}

// Load user data from the backend
async function loadUserData() {
  try {
    const userData = await backend.fetchUserData();
    displayUserData(userData);
  } catch (error) {
    console.error("Failed to fetch user data:", error);
  }
}

// Display user data on the UI
function displayUserData(userData) {
  document.getElementById("username").innerText = userData.username;
  document.getElementById("userInfo").style.display = "block";
}

// Handle user logout
function handleLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", async () => {
    await authClient.logout();
    window.location.reload();
  });
}

// Load transaction data from the backend
async function loadTransactions() {
  try {
    const transactions = await backend.getTransactions();
    renderTransactions(transactions);
  } catch (error) {
    console.error("Failed to load transactions:", error);
  }
}

// Render transactions to the UI
function renderTransactions(transactions) {
  const transactionsContainer = document.getElementById("transactions");
  transactions.forEach((transaction) => {
    const transactionElement = document.createElement("div");
    transactionElement.innerText = `Transaction: ${transaction.amount} - ${transaction.date}`;
    transactionsContainer.appendChild(transactionElement);
  });
}

// Load budget data from the backend
async function loadBudgets() {
  try {
    const budgets = await backend.getBudgets();
    renderBudgets(budgets);
  } catch (error) {
    console.error("Failed to load budgets:", error);
  }
}

// Render budgets to the UI
function renderBudgets(budgets) {
  const budgetsContainer = document.getElementById("budgets");
  budgets.forEach((budget) => {
    const budgetElement = document.createElement("div");
    budgetElement.innerText = `Budget: ${budget.amount} - ${budget.category}`;
    budgetsContainer.appendChild(budgetElement);
  });
}

// Entry point: Initialize the application
init().catch(console.error);
