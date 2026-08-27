const sessionOrder = {
  id: "LW7K4M9Q2X8R6P3",
  customer: "Juan Dela Cruz",
  date: "August 25, 2026",
  service: "Custom Printing Service",
  quantity: "10",
  total: "PHP 3,500.00",
  expectedCompletion: "August 30, 2026",
  status: "Processing",
  paymentHistory: [
    { date: "August 20, 2026", method: "GCash", amount: "PHP 2,000.00", status: "Paid" }
  ],
  tracking: [
    { label: "Order Received", state: "complete" },
    { label: "Confirmed", state: "complete" },
    { label: "Processing", state: "current" },
    { label: "Ready", state: "upcoming" },
    { label: "Completed", state: "upcoming" }
  ]
};

const sessionState = {
  customerTab: "overview",
  chatMessages: [
    { sender: "Admin", body: "Hello Juan! Your order is now being processed." },
    { sender: "Customer", body: "Thank you. When will it be ready?" },
    { sender: "Admin", body: "Expected completion is August 30." }
  ]
};

const sessionById = id => document.getElementById(id);

function requestedOrderId() {
  return new URLSearchParams(window.location.search).get("orderId") || sessionOrder.id;
}

function renderSessionOrder() {
  const orderId = requestedOrderId().toUpperCase();
  sessionById("sessionOrderId").textContent = orderId;
  sessionById("chatOrderLabel").textContent = `Regarding Order ${orderId}`;

  sessionById("orderDetailsGrid").innerHTML = [
    ["Order ID", orderId],
    ["Customer", sessionOrder.customer],
    ["Order Date", sessionOrder.date],
    ["Service", sessionOrder.service],
    ["Quantity", sessionOrder.quantity],
    ["Total", sessionOrder.total],
    ["Expected Completion", sessionOrder.expectedCompletion]
  ].map(([label, value]) => `<div class="detail-item"><span>${label}</span><strong>${value}</strong></div>`).join("");

  sessionById("trackingTimeline").innerHTML = sessionOrder.tracking.map(step => `
    <div class="tracking-step ${step.state}">
      <span>${step.state === "complete" ? "OK" : ""}</span>
      <strong>${step.label}</strong>
    </div>
  `).join("");
  sessionById("trackingEmpty").classList.toggle("hidden", sessionOrder.tracking.length > 0);

  sessionById("paymentSummary").innerHTML = [
    ["Total Amount", "PHP 3,500.00"],
    ["Amount Paid", "PHP 2,000.00"],
    ["Remaining Balance", "PHP 1,500.00"],
    ["Payment Status", `<span class="status-pill warning">Partially Paid</span>`]
  ].map(([label, value]) => `<div class="detail-item"><span>${label}</span><strong>${value}</strong></div>`).join("");

  sessionById("paymentHistory").innerHTML = sessionOrder.paymentHistory.map(payment => `
    <div class="payment-row">
      <div><strong>${payment.date}</strong><span>${payment.method}</span></div>
      <div><strong>${payment.amount}</strong><span class="status-pill success">${payment.status}</span></div>
    </div>
  `).join("");
  sessionById("paymentEmpty").classList.toggle("hidden", sessionOrder.paymentHistory.length > 0);

  renderSessionChat();
}

function renderSessionChat() {
  sessionById("chatMessages").innerHTML = sessionState.chatMessages.map(message => `
    <div class="chat-message ${message.sender === "Customer" ? "customer" : "admin"}">
      <span>${message.sender}</span>
      <p>${message.body}</p>
    </div>
  `).join("");
  sessionById("chatEmpty").classList.toggle("hidden", sessionState.chatMessages.length > 0);
}

function setSessionTab(tab) {
  sessionState.customerTab = tab;
  document.querySelectorAll("[data-customer-tab]").forEach(button => {
    button.classList.toggle("active", button.dataset.customerTab === tab);
  });
  document.querySelectorAll(".customer-tab-panel").forEach(panel => {
    panel.classList.toggle("active-customer-tab", panel.id === `customer${tab[0].toUpperCase()}${tab.slice(1)}`);
  });
}

document.querySelectorAll("[data-customer-tab]").forEach(button => {
  button.addEventListener("click", () => setSessionTab(button.dataset.customerTab));
});

sessionById("chatForm").addEventListener("submit", event => {
  event.preventDefault();
  const input = sessionById("chatInput");
  const body = input.value.trim();
  if (!body) return;
  sessionState.chatMessages.push({ sender: "Customer", body });
  input.value = "";
  renderSessionChat();
});

renderSessionOrder();
