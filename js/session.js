"use strict";

// Customer order page: reads the real order from Supabase and updates live when the facility changes it.
const db = window.WashWizDB;
const esc = db.escape;
const sessionById = id => document.getElementById(id);

const sessionState = { customerTab: "overview", order: null, chatMessages: [], updatedAt: null };

function requestedOrderId() {
  return (new URLSearchParams(window.location.search).get("orderId") || "").trim().toUpperCase();
}

// The customer verified with order ID + full name on customer.html; the name is kept in this tab only.
function orderAccess() {
  try {
    const saved = JSON.parse(sessionStorage.getItem("washwizOrderSession") || "null");
    if (saved && saved.id && saved.id.toUpperCase() === requestedOrderId()) return saved;
  } catch { /* storage unavailable */ }
  return null;
}

function goVerify() {
  window.location.replace(`customer.html#verify-${encodeURIComponent(requestedOrderId())}`);
}

const STEPS = [
  { label: "Booking Requested", statuses: ["Requested"] },
  { label: "Confirmed", statuses: ["Confirmed"] },
  { label: "In Service", statuses: ["Processing", "In Cycle", "Drying"] },
  { label: "Ready for Pickup", statuses: ["Ready for Pickup"] },
  { label: "Completed", statuses: ["Completed", "Paid"] }
];

const STATUS_TEXT = {
  Requested: "Your request is waiting for the shop to confirm it.",
  Confirmed: "The shop confirmed your booking. See you at drop-off!",
  Processing: "The shop is working on your laundry.",
  "In Cycle": "Your laundry is washing now.",
  Drying: "Your laundry is drying now.",
  "Ready for Pickup": "Your laundry is ready for pickup.",
  Completed: "Your order is complete. Thank you!",
  Paid: "Your order is paid and complete. Thank you!",
  Cancelled: "This booking was cancelled. Message the shop if this is a mistake."
};

const longDate = value => new Intl.DateTimeFormat("en-PH", { month: "long", day: "numeric", year: "numeric" }).format(new Date(value));

function renderSessionOrder() {
  const order = sessionState.order;
  if (!order) return;
  const stepIndex = STEPS.findIndex(step => step.statuses.includes(order.status));
  const peso = value => `PHP ${Number(value || 0).toLocaleString("en-PH")}`;
  const paid = ["Paid", "Completed"].includes(order.status);

  sessionById("sessionOrderId").textContent = order.id;
  sessionById("chatOrderLabel").textContent = `Regarding Order ${order.id}`;
  sessionById("orderStatusBadge").textContent = "Verified Booking";
  sessionById("overviewStatus").textContent = order.status;
  sessionById("trackingStatusText").textContent = STATUS_TEXT[order.status] || `Status: ${order.status}`;
  sessionById("trackingUpdated").textContent = new Date(order.updated_at || order.created_at).toLocaleString("en-PH", { month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });

  const scheduled = order.booking_date ? `${longDate(`${order.booking_date}T00:00:00`)}${order.booking_time ? ` at ${order.booking_time}` : ""}` : "-";
  sessionById("orderDetailsGrid").innerHTML = [
    ["Order ID", order.id],
    ["Customer", order.customer],
    ["Order Date", longDate(order.created_at)],
    ["Laundry Shop", order.facility],
    ["Service", order.service || order.type || "-"],
    ["Total", peso(order.total)],
    ["Scheduled Drop-off", scheduled],
    ["Machine", order.machine || "Unassigned"],
    ["Special Instructions", order.notes || "None"]
  ].map(([label, value]) => `<div class="detail-item"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("");

  sessionById("trackingTimeline").innerHTML = order.status === "Cancelled"
    ? `<div class="tracking-step current"><span></span><strong>Cancelled</strong></div>`
    : STEPS.map((step, index) => {
      const state = index < stepIndex || (index === stepIndex && index === STEPS.length - 1) ? "complete" : index === stepIndex ? "current" : "upcoming";
      return `<div class="tracking-step ${state}"><span>${state === "complete" ? "OK" : ""}</span><strong>${step.label}</strong></div>`;
    }).join("");
  sessionById("trackingEmpty").classList.add("hidden");

  sessionById("paymentSummary").innerHTML = [
    ["Total Amount", peso(order.total)],
    ["Amount Paid", paid ? peso(order.total) : "PHP 0"],
    ["Remaining Balance", paid ? "PHP 0" : peso(order.total)],
    ["Payment Status", `<span class="status-pill ${paid ? "success" : "warning"}">${paid ? "Paid" : "Pay at the shop"}</span>`]
  ].map(([label, value]) => `<div class="detail-item"><span>${label}</span><strong>${label === "Payment Status" ? value : esc(value)}</strong></div>`).join("");
  sessionById("paymentProgressBar").style.width = paid ? "100%" : "0%";
  sessionById("paymentCaption").textContent = `${paid ? peso(order.total) : "PHP 0"} / ${peso(order.total)} paid`;
  sessionById("paymentHistory").innerHTML = paid
    ? `<div class="payment-row"><div><strong>${esc(longDate(order.updated_at || order.created_at))}</strong><span>At the shop</span></div><div><strong>${esc(peso(order.total))}</strong><span class="status-pill success">Paid</span></div></div>`
    : "";
  sessionById("paymentEmpty").classList.toggle("hidden", paid);

  renderSessionChat();
}

function renderSessionChat() {
  const box = sessionById("chatMessages");
  box.innerHTML = sessionState.chatMessages.map(message => `
    <div class="chat-message ${message.sender === "Customer" ? "customer" : "admin"}">
      <span>${message.sender === "Customer" ? "You" : "Shop"}</span>
      <p>${esc(message.body)}</p>
    </div>
  `).join("");
  sessionById("chatEmpty").classList.toggle("hidden", sessionState.chatMessages.length > 0);
  box.scrollTop = box.scrollHeight;
}

async function loadOrder() {
  const access = orderAccess();
  if (!access) { goVerify(); return false; }
  const [booking, messages] = await Promise.all([
    db.client.rpc("get_booking", { p_id: access.id, p_name: access.name }),
    db.client.rpc("get_order_messages", { p_id: access.id, p_name: access.name })
  ]);
  if (booking.error) { sessionById("trackingStatusText").textContent = db.errorText(booking.error); return false; }
  if (!booking.data) { goVerify(); return false; }
  sessionState.order = booking.data;
  sessionState.chatMessages = messages.data || [];
  renderSessionOrder();
  return true;
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

sessionById("chatForm").addEventListener("submit", async event => {
  event.preventDefault();
  const input = sessionById("chatInput");
  const body = input.value.trim();
  const access = orderAccess();
  if (!body || !access) return;
  const button = event.submitter;
  if (button) button.disabled = true;
  const { error } = await db.client.rpc("send_order_message", { p_id: access.id, p_name: access.name, p_body: body });
  if (button) button.disabled = false;
  if (error) { alert(db.errorText(error)); return; }
  input.value = "";
  loadOrder(); // the live update will also arrive; this makes your own message appear instantly
});

sessionById("sessionLogout").addEventListener("click", () => {
  try { sessionStorage.removeItem("washwizOrderSession"); } catch { /* storage unavailable */ }
  window.location.href = "customer.html";
});

sessionById("sessionOrderId").textContent = requestedOrderId() || "-";
sessionById("trackingStatusText").textContent = "Loading your order...";
loadOrder().then(ok => {
  if (!ok) return;
  // The database broadcasts "changed" on order:<ID> whenever this booking or its chat changes.
  const refresh = db.debounce(loadOrder, 200);
  db.client.channel(`order:${requestedOrderId()}`)
    .on("broadcast", { event: "changed" }, refresh)
    .subscribe();
});
