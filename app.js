const state = {
  route: "dashboard",
  customerTab: "overview",
  selectedMachine: null,
  supplies: {},
  verificationState: "default",
  chatMessages: [
    { sender: "Admin", body: "Hello Juan! Your order is now being processed." },
    { sender: "Customer", body: "Thank you. When will it be ready?" },
    { sender: "Admin", body: "Expected completion is August 30." }
  ],
  bookings: [
    { customer: "Maya Santos", contact: "0917 202 0144", machine: "W-02", type: "Washer", status: "In Cycle", time: "10:20 AM", total: 295 },
    { customer: "Walk-in Customer", contact: "Cash desk", machine: "D-02", type: "Dryer", status: "Drying", time: "10:42 AM", total: 165 },
    { customer: "Noah Reyes", contact: "0998 551 7730", machine: "W-03", type: "Washer", status: "In Cycle", time: "11:05 AM", total: 340 }
  ]
};

const machines = [
  { id: "W-01", type: "washer", size: "small", label: "Small Washer", load: "10 lb", price: 120, status: "available", eta: "Ready now" },
  { id: "W-02", type: "washer", size: "large", label: "Large Washer", load: "30 lb", price: 190, status: "occupied", eta: "18 min left" },
  { id: "W-03", type: "washer", size: "xl", label: "XLarge Washer", load: "60 lb", price: 260, status: "occupied", eta: "31 min left" },
  { id: "W-04", type: "washer", size: "large", label: "Large Washer", load: "30 lb", price: 190, status: "maintenance", eta: "Service needed" },
  { id: "D-01", type: "dryer", size: "large", label: "Large Dryer", load: "30 lb", price: 145, status: "available", eta: "Ready now" },
  { id: "D-02", type: "dryer", size: "xl", label: "XLarge Dryer", load: "60 lb", price: 210, status: "occupied", eta: "12 min left" },
  { id: "D-14", type: "dryer", size: "small", label: "Quick Dryer", load: "10 lb", price: 95, status: "available", eta: "Ready now" }
];

const supplies = [
  { id: "detergent", name: "Eco-Friendly Detergent", desc: "Plant-based, low-suds formula", price: 45 },
  { id: "softener", name: "Fabric Softener", desc: "Fresh finish for mixed loads", price: 35 },
  { id: "bleach", name: "Color-Safe Bleach", desc: "Brightens without harsh fading", price: 40 },
  { id: "sheets", name: "Anti-Static Dryer Sheets", desc: "Reduces cling for dry cycles", price: 25 }
];

const mockOrder = {
  id: "LW7K4M9Q2X8R6P3",
  customer: "Juan Dela Cruz",
  date: "August 25, 2026",
  service: "Custom Printing Service",
  quantity: "10",
  total: "PHP 3,500.00",
  expectedCompletion: "August 30, 2026",
  status: "Processing",
  amountPaid: 2000,
  totalAmount: 3500,
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

const money = value => `PHP ${value.toLocaleString("en-PH")}`;
const byId = id => document.getElementById(id);
const statusLabel = status => status === "maintenance" ? "Service" : status.replace(/\b\w/g, char => char.toUpperCase());
const statusClass = value => value.toLowerCase().includes("complete") || value.toLowerCase().includes("paid") ? "available" : value.toLowerCase().includes("service") || value.toLowerCase().includes("maintenance") ? "maintenance" : "occupied";

function finishLoading() {
  const loadingScreen = byId("loadingScreen");
  if (!loadingScreen) return;
  loadingScreen.classList.add("is-done");
}

function showLoadingBefore(callback, delay = 1100) {
  const loadingScreen = byId("loadingScreen");
  if (!loadingScreen) {
    callback();
    return;
  }
  loadingScreen.classList.remove("is-title");
  loadingScreen.classList.remove("is-black");
  loadingScreen.classList.remove("is-brand");
  loadingScreen.classList.add("is-washer");
  loadingScreen.classList.remove("is-done");
  window.setTimeout(() => {
    callback();
    window.setTimeout(finishLoading, 180);
  }, delay);
}

function showCustomerPortal(view = "verify") {
  byId("auth").classList.add("hidden");
  byId("app").classList.add("hidden");
  byId("customerPortal").classList.remove("hidden");
  byId("verificationPage").classList.toggle("active-customer-view", view === "verify");
  byId("customerOrderPage").classList.toggle("active-customer-view", view === "order");
}

function showAuthScreen() {
  byId("customerPortal").classList.add("hidden");
  byId("app").classList.add("hidden");
  byId("auth").classList.remove("hidden");
}

function renderCustomerPortal() {
  byId("orderDetailsGrid").innerHTML = [
    ["Order ID", mockOrder.id],
    ["Customer", mockOrder.customer],
    ["Order Date", mockOrder.date],
    ["Service", mockOrder.service],
    ["Quantity", mockOrder.quantity],
    ["Total", mockOrder.total],
    ["Expected Completion", mockOrder.expectedCompletion]
  ].map(([label, value]) => `<div class="detail-item"><span>${label}</span><strong>${value}</strong></div>`).join("");

  byId("trackingTimeline").innerHTML = mockOrder.tracking.map(step => `
    <div class="tracking-step ${step.state}">
      <span>${step.state === "complete" ? "OK" : step.state === "current" ? "" : ""}</span>
      <strong>${step.label}</strong>
    </div>
  `).join("");
  byId("trackingEmpty").classList.toggle("hidden", mockOrder.tracking.length > 0);

  byId("paymentSummary").innerHTML = [
    ["Total Amount", "PHP 3,500.00"],
    ["Amount Paid", "PHP 2,000.00"],
    ["Remaining Balance", "PHP 1,500.00"],
    ["Payment Status", `<span class="status-pill warning">Partially Paid</span>`]
  ].map(([label, value]) => `<div class="detail-item"><span>${label}</span><strong>${value}</strong></div>`).join("");
  byId("paymentHistory").innerHTML = mockOrder.paymentHistory.map(payment => `
    <div class="payment-row">
      <div><strong>${payment.date}</strong><span>${payment.method}</span></div>
      <div><strong>${payment.amount}</strong><span class="status-pill success">${payment.status}</span></div>
    </div>
  `).join("");
  byId("paymentEmpty").classList.toggle("hidden", mockOrder.paymentHistory.length > 0);

  renderChatMessages();
}

function renderChatMessages() {
  byId("chatMessages").innerHTML = state.chatMessages.map(message => `
    <div class="chat-message ${message.sender === "Customer" ? "customer" : "admin"}">
      <span>${message.sender}</span>
      <p>${message.body}</p>
    </div>
  `).join("");
  byId("chatEmpty").classList.toggle("hidden", state.chatMessages.length > 0);
}

function setCustomerTab(tab) {
  state.customerTab = tab;
  document.querySelectorAll("[data-customer-tab]").forEach(button => button.classList.toggle("active", button.dataset.customerTab === tab));
  document.querySelectorAll(".customer-tab-panel").forEach(panel => panel.classList.toggle("active-customer-tab", panel.id === `customer${tab[0].toUpperCase()}${tab.slice(1)}`));
}

function setVerificationMessage(type, text) {
  const message = byId("verificationMessage");
  message.className = `verification-message ${type}`;
  message.textContent = text;
}

function showAccessMessage(source, text) {
  const card = source?.closest(".customer-access-card");
  const message = card?.querySelector(".access-message");
  if (!message) return;
  message.textContent = text;
  window.setTimeout(() => { message.textContent = ""; }, 1800);
}

function copyMockValue(value, source) {
  const done = () => {
    showAccessMessage(source, "Copied to clipboard.");
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(value).then(done).catch(done);
  } else {
    done();
  }
}

function openCustomerAccessModal(customerName) {
  byId("customerAccessCustomer").textContent = `${customerName} - customer order portal access`;
  byId("customerAccessModal").classList.remove("hidden");
}

function closeCustomerAccessModal() {
  byId("customerAccessModal").classList.add("hidden");
}

function setRoute(route) {
  state.route = route;
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("active-view", view.id === route));
  document.querySelectorAll(".nav-link").forEach(link => {
    const active = link.dataset.route === route;
    link.classList.toggle("active", active);
    link.toggleAttribute("aria-current", active);
  });
  const titles = {
    dashboard: ["Today", "WashWiz Dashboard"],
    machines: ["Booking flow", "Select Machine"],
    supplies: ["Booking flow", "Wash Supplies"],
    confirmed: ["Success", "Booking Confirmed"],
    bookings: ["Operations", "Bookings Management"],
    customers: ["Relationships", "Customers"],
    revenue: ["Analytics", "Revenue & Analytics"]
  };
  byId("routeEyebrow").textContent = titles[route][0];
  byId("routeTitle").textContent = titles[route][1];
  document.querySelector(".sidebar").classList.remove("open");
}

function machineCard(machine, selectable = false) {
  const disabled = machine.status !== "available";
  const selected = state.selectedMachine?.id === machine.id;
  return `
    <article class="machine-card clay ${machine.status} ${selected ? "selected" : ""}">
      <div class="machine-top">
        <span class="machine-id">${machine.id}</span>
        <span class="badge ${machine.status}">${statusLabel(machine.status)}</span>
      </div>
      <div class="machine-visual"></div>
      <p><strong>${machine.label}</strong><br><span>${machine.load} capacity</span><span>${machine.eta}</span></p>
      ${selectable ? `<button class="select-btn" data-machine="${machine.id}" ${disabled ? "disabled" : ""} aria-label="${disabled ? `${machine.id} unavailable` : `Select ${machine.id} for ${money(machine.price)}`}">${disabled ? "Unavailable" : selected ? "Selected" : `Select - ${money(machine.price)}`}</button>` : ""}
    </article>
  `;
}

function renderMachines(target, filter, selectable) {
  const list = machines.filter(machine => filter === "all" || machine.type === filter || machine.size === filter);
  byId(target).innerHTML = list.map(machine => machineCard(machine, selectable)).join("");
}

function renderMetrics() {
  const available = machines.filter(machine => machine.status === "available").length;
  const occupied = machines.filter(machine => machine.status === "occupied").length;
  const revenue = state.bookings.reduce((sum, booking) => sum + booking.total, 0);
  const averageTicket = state.bookings.length ? Math.round(revenue / state.bookings.length) : 0;
  const metrics = [
    ["Total Machines", machines.length, "2 service zones online"],
    ["Available", available, "Ready for walk-ins"],
    ["Active Cycles", occupied, "Average 21 minutes left"],
    ["Today's Revenue", money(revenue), "From confirmed bookings"]
  ];
  byId("metrics").innerHTML = metrics.map(([label, value, note]) => `<article class="metric clay"><span>${label}</span><b>${value}</b><p>${note}</p></article>`).join("");
  byId("revenueMetrics").innerHTML = [
    ["Monthly Total", money(revenue), "+12.5% vs last month"],
    ["Average Ticket Size", money(averageTicket), "+3.2% vs last month"],
    ["Total Transactions", state.bookings.length, "-1.4% vs last month"],
    ["Active Customers", customers().length, "+8.1% vs last month"]
  ].map(([label, value, note], index) => `<article class="metric clay revenue-metric ${note.startsWith("-") ? "down" : "up"}"><span>${label}</span><b>${value}</b><p>${note}</p></article>`).join("");
}

function supplyRevenue() {
  return Math.round(state.bookings.reduce((sum, booking) => sum + booking.total, 0) * .26);
}

function customers() {
  const map = new Map();
  state.bookings.forEach(booking => {
    const current = map.get(booking.customer) || { name: booking.customer, contact: booking.contact, count: 0, spend: 0, last: booking.time };
    current.count += 1;
    current.spend += booking.total;
    current.last = booking.time;
    map.set(booking.customer, current);
  });
  return [...map.values()];
}

function renderTables() {
  byId("bookingsTable").innerHTML = state.bookings.length ? state.bookings.map(booking => `
    <tr>
      <td data-label="Customer"><strong>${booking.customer}</strong><br><small>${booking.contact}</small></td>
      <td data-label="Machine">${booking.machine}<br><small>${booking.type}</small></td>
      <td data-label="Status"><span class="badge ${statusClass(booking.status)}">${booking.status}</span></td>
      <td data-label="Time">${booking.time}</td>
      <td data-label="Total">${money(booking.total)}</td>
    </tr>
  `).join("") : `<tr><td class="empty-state" colspan="5"><strong>No bookings yet</strong><br><small>New paid bookings will appear here as soon as they are confirmed.</small></td></tr>`;
  renderCustomers();
  renderTransactions();
}

function renderTransactions() {
  const methods = ["Visa **** 4242", "Apple Pay", "Cash", "Mastercard **** 8891"];
  byId("transactionsTable").innerHTML = state.bookings.map((booking, index) => `
    <tr>
      <td data-label="Date & Time"><strong>Today</strong><br><small>${booking.time}</small></td>
      <td data-label="Customer / Machine"><strong>${booking.customer}</strong><br><span class="mini-chip">${booking.machine}</span></td>
      <td data-label="Payment Method"><span class="payment-pill">${methods[index % methods.length]}</span></td>
      <td data-label="Amount"><strong>${money(booking.total)}</strong></td>
    </tr>
  `).join("");
}

function renderCustomers() {
  const term = byId("customerSearch")?.value?.toLowerCase() || "";
  const rows = customers()
    .filter(customer => customer.name.toLowerCase().includes(term) || customer.contact.toLowerCase().includes(term))
    .map(customer => `<tr><td data-label="Customer Name"><strong>${customer.name}</strong></td><td data-label="Contact">${customer.contact}</td><td data-label="Total Bookings">${customer.count}</td><td data-label="Last Visit">${customer.last}</td><td data-label="Spend">${money(customer.spend)}</td><td data-label="Action"><button class="secondary-btn compact table-action" type="button" data-customer-details="${customer.name}">See Details</button></td></tr>`);
  byId("customersTable").innerHTML = rows.length ? rows.join("") : `<tr><td class="empty-state" colspan="6"><strong>No matching customers</strong><br><small>Try another name or contact number.</small></td></tr>`;
}

function renderSupplies() {
  byId("suppliesList").innerHTML = supplies.map(item => `
    <article class="supply-item clay">
      <div class="supply-icon"></div>
      <div><strong>${item.name}</strong><p>${item.desc} - ${money(item.price)}</p></div>
      <div class="stepper">
        <button data-supply="${item.id}" data-delta="-1" ${(state.supplies[item.id] || 0) === 0 ? "disabled" : ""} aria-label="Remove ${item.name}">-</button>
        <strong aria-label="${state.supplies[item.id] || 0} selected">${state.supplies[item.id] || 0}</strong>
        <button data-supply="${item.id}" data-delta="1" aria-label="Add ${item.name}">+</button>
      </div>
    </article>
  `).join("");
  renderOrderSummary();
}

function orderTotal() {
  const base = state.selectedMachine?.price || 0;
  return supplies.reduce((sum, item) => sum + ((state.supplies[item.id] || 0) * item.price), base);
}

function renderOrderSummary() {
  const machine = state.selectedMachine;
  const rows = [`<div class="row"><span>${machine?.id || "Machine"}</span><strong>${money(machine?.price || 0)}</strong></div>`];
  supplies.forEach(item => {
    const qty = state.supplies[item.id] || 0;
    if (qty) rows.push(`<div class="row"><span>${item.name} x${qty}</span><strong>${money(item.price * qty)}</strong></div>`);
  });
  rows.push(`<hr><div class="row"><span>Total</span><strong>${money(orderTotal())}</strong></div>`);
  byId("orderSummary").innerHTML = rows.join("");
}

function renderCharts() {
  const days = [["Mon", 520], ["Tue", 680], ["Wed", 610], ["Thu", 820], ["Fri", 960], ["Sat", 1240], ["Sun", 1040]];
  byId("barChart").innerHTML = days.map(([day, value]) => `<div class="bar" style="height:${value / 13}px"><span>${day}</span></div>`).join("");
  const usage = [["Washers", 72], ["Dryers", 54], ["XLarge Machines", 38], ["Supply Attach", 46]];
  byId("usageList").innerHTML = usage.map(([label, value]) => `
    <div class="usage-row">
      <div class="row"><strong>${label}</strong><span>${value}%</span></div>
      <div class="usage-track"><div class="usage-fill" style="width:${value}%"></div></div>
    </div>
  `).join("");
}

function chooseMachine(id) {
  state.selectedMachine = machines.find(machine => machine.id === id);
  state.supplies = {};
  byId("selectedMachineTitle").textContent = `${state.selectedMachine.id} selected`;
  byId("selectedMachineMeta").textContent = `${state.selectedMachine.label}, ${state.selectedMachine.load}, base rate ${money(state.selectedMachine.price)}.`;
  byId("continueSupplies").disabled = false;
  document.querySelectorAll(".select-btn").forEach(btn => {
    const machine = machines.find(item => item.id === btn.dataset.machine);
    btn.textContent = btn.dataset.machine === id ? "Selected" : `Select - ${money(machine.price)}`;
  });
  renderMachines("bookingMachines", document.querySelector("#bookingMachineFilter .active").dataset.filter, true);
}

function confirmBooking() {
  if (!state.selectedMachine) {
    setRoute("machines");
    byId("selectedMachineMeta").textContent = "Select an available machine before continuing.";
    byId("selectedMachineMeta").classList.add("form-note", "error");
    return;
  }
  const name = byId("customerName").value.trim() || "Walk-in Customer";
  const contact = byId("customerContact").value.trim() || "Cash desk";
  const machine = state.selectedMachine;
  const booking = {
    customer: name,
    contact,
    machine: machine.id,
    type: machine.type === "washer" ? "Washer" : "Dryer",
    status: "Paid",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    total: orderTotal()
  };
  state.bookings.unshift(booking);
  byId("confirmTitle").textContent = `${machine.id} is reserved for ${name}`;
  byId("confirmDetails").textContent = `${booking.type} booking paid at ${booking.time}. Total collected: ${money(booking.total)}.`;
  state.selectedMachine = null;
  byId("continueSupplies").disabled = true;
  byId("selectedMachineTitle").textContent = "Choose a machine";
  byId("selectedMachineMeta").textContent = "Available washers and dryers are ready to book.";
  byId("selectedMachineMeta").classList.remove("form-note", "error");
  renderAll();
  setRoute("confirmed");
}

function renderAll() {
  renderMetrics();
  renderMachines("dashboardMachines", document.querySelector("#machineFilter .active").dataset.filter, false);
  renderMachines("bookingMachines", document.querySelector("#bookingMachineFilter .active").dataset.filter, true);
  renderSupplies();
  renderTables();
  renderCharts();
}

document.addEventListener("click", event => {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) setRoute(routeButton.dataset.route);

  const authTab = event.target.closest("[data-auth-tab]");
  if (authTab) {
    document.querySelectorAll("[data-auth-tab]").forEach(tab => tab.classList.toggle("active", tab === authTab));
    byId("loginForm").classList.toggle("hidden", authTab.dataset.authTab !== "login");
    byId("registerForm").classList.toggle("hidden", authTab.dataset.authTab !== "register");
  }

  const filterButton = event.target.closest("#machineFilter button, #bookingMachineFilter button");
  if (filterButton) {
    const group = filterButton.parentElement;
    group.querySelectorAll("button").forEach(button => button.classList.toggle("active", button === filterButton));
    renderMachines(group.id === "machineFilter" ? "dashboardMachines" : "bookingMachines", filterButton.dataset.filter, group.id !== "machineFilter");
  }

  const selectButton = event.target.closest("[data-machine]");
  if (selectButton) chooseMachine(selectButton.dataset.machine);

  const supplyButton = event.target.closest("[data-supply]");
  if (supplyButton) {
    const id = supplyButton.dataset.supply;
    state.supplies[id] = Math.max(0, (state.supplies[id] || 0) + Number(supplyButton.dataset.delta));
    renderSupplies();
  }

  const customerDetailsButton = event.target.closest("[data-customer-details]");
  if (customerDetailsButton) openCustomerAccessModal(customerDetailsButton.dataset.customerDetails);

  const closeModalButton = event.target.closest("[data-close-modal]");
  if (closeModalButton) closeCustomerAccessModal();

  const copyButton = event.target.closest("[data-copy]");
  if (copyButton) copyMockValue(copyButton.dataset.copy, copyButton);

  const printButton = event.target.closest("[data-print-qr]");
  if (printButton) showAccessMessage(printButton, "Print preview is mocked for now.");
});

byId("loginForm").addEventListener("submit", event => {
  event.preventDefault();
  showLoadingBefore(() => {
    byId("auth").classList.add("hidden");
    byId("app").classList.remove("hidden");
  });
});
byId("registerForm").addEventListener("submit", event => {
  event.preventDefault();
  showLoadingBefore(() => {
    byId("auth").classList.add("hidden");
    byId("app").classList.remove("hidden");
  });
});
byId("continueSupplies").addEventListener("click", () => { renderSupplies(); setRoute("supplies"); });
byId("confirmBooking").addEventListener("click", confirmBooking);
byId("customerSearch").addEventListener("input", renderCustomers);
byId("menuToggle").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("open"));
byId("openVerification")?.addEventListener("click", () => showCustomerPortal("verify"));
byId("backToAuth").addEventListener("click", showAuthScreen);
byId("verificationForm").addEventListener("submit", event => {
  event.preventDefault();
  const orderId = byId("verifyOrderId").value.trim();
  const fullName = byId("verifyFullName").value.trim();
  if (!orderId || !fullName) {
    setVerificationMessage("error", "Please enter your Order ID and full name.");
    return;
  }
  byId("verifyButton").disabled = true;
  byId("verifyButton").textContent = "Verifying...";
  setVerificationMessage("loading", "Verifying...");
  window.setTimeout(() => {
    byId("verifyButton").disabled = false;
    byId("verifyButton").textContent = "VERIFY";
    if (orderId.toUpperCase() === mockOrder.id && fullName.length > 1) {
      setVerificationMessage("success", "Verification Successful. Access Granted.");
      window.setTimeout(() => {
        showLoadingBefore(() => {
          showCustomerPortal("order");
          setCustomerTab("overview");
        });
      }, 500);
    } else {
      setVerificationMessage("error", "Order ID or Full Name is incorrect.");
    }
  }, 700);
});
document.querySelectorAll("[data-customer-tab]").forEach(button => {
  button.addEventListener("click", () => setCustomerTab(button.dataset.customerTab));
});
byId("chatForm").addEventListener("submit", event => {
  event.preventDefault();
  const input = byId("chatInput");
  const body = input.value.trim();
  if (!body) return;
  state.chatMessages.push({ sender: "Customer", body });
  input.value = "";
  renderChatMessages();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeCustomerAccessModal();
});

renderAll();
renderCustomerPortal();
window.setTimeout(() => {
  const loadingScreen = byId("loadingScreen");
  if (!loadingScreen) return;
  loadingScreen.classList.remove("is-title");
  loadingScreen.classList.add("is-black");
}, 1300);
window.setTimeout(finishLoading, 3200);
