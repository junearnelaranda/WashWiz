const state = {
  route: document.body.dataset.page || "dashboard",
  selectedMachine: null,
  supplies: {},
  activeSupportThread: "juan-order",
  supportFilter: "all",
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

const supportThreads = [
  {
    id: "juan-order",
    customer: "Juan Dela Cruz",
    orderId: "LW7K4M9Q2X8R6P3",
    machine: "W-02",
    machineLabel: "Large Washer",
    status: "active",
    urgency: "Live Active",
    lastSeen: "2m ago",
    eta: "18 min left",
    total: 800,
    paid: true,
    tag: "Machine W-02",
    preview: "Great! Can I also request the hypoallergenic detergent?",
    messages: [
      { sender: "Admin", body: "Hello Juan! Your order is now being processed.", time: "10:14 AM" },
      { sender: "Customer", body: "Thank you. When will it be ready?", time: "10:16 AM" },
      { sender: "Admin", body: "Expected completion is August 30.", time: "10:17 AM" },
      { sender: "Customer", body: "Great! Can I also request the hypoallergenic detergent for the rinse cycle?", time: "10:20 AM" }
    ]
  },
  {
    id: "maria-order",
    customer: "Maria Santos",
    orderId: "LWM9Z0387B",
    machine: "D-01",
    machineLabel: "Large Dryer",
    status: "pending",
    urgency: "Action Required",
    lastSeen: "14m ago",
    eta: "Ready now",
    total: 420,
    paid: false,
    tag: "Machine D-01",
    preview: "Can I add fabric conditioner to my wash?",
    messages: [
      { sender: "Customer", body: "Can I add fabric conditioner to my wash?", time: "10:06 AM" }
    ]
  },
  {
    id: "carlos-order",
    customer: "Carlos Reyes",
    orderId: "LW4P8B102",
    machine: "W-03",
    machineLabel: "XLarge Washer",
    status: "active",
    urgency: "Cycle Finished",
    lastSeen: "1h ago",
    eta: "Cycle finished",
    total: 960,
    paid: true,
    tag: "Machine W-03",
    preview: "Is machine W-03 ready for pickup?",
    messages: [
      { sender: "Customer", body: "Is machine W-03 ready for pickup?", time: "9:32 AM" },
      { sender: "Admin", body: "It just finished. We are preparing your items now.", time: "9:38 AM" }
    ]
  },
  {
    id: "elena-order",
    customer: "Elena Ramos",
    orderId: "LW1B5Z099",
    machine: "D-02",
    machineLabel: "XLarge Dryer",
    status: "resolved",
    urgency: "Resolved",
    lastSeen: "2h ago",
    eta: "Completed",
    total: 500,
    paid: true,
    tag: "Completed",
    preview: "Payment of PHP 800 confirmed via GCash.",
    messages: [
      { sender: "Customer", body: "Payment of PHP 800 confirmed via GCash.", time: "8:20 AM" },
      { sender: "Admin", body: "Thanks Elena, your payment has been posted.", time: "8:24 AM" }
    ]
  }
];

const supportStorageKey = "washwizSupportThreads";
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

function logOutStaff() {
  sessionStorage.removeItem("washwizStaffLoggedIn");
  showLoadingBefore(() => {
    byId("app").classList.add("hidden");
    byId("auth").classList.remove("hidden");
    document.querySelector(".sidebar").classList.remove("open");
    setRoute("dashboard");
  }, 650);
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

function supportInitials(name) {
  return name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();
}

function activeSupportThread() {
  return supportThreads.find(thread => thread.id === state.activeSupportThread) || supportThreads[0];
}

function loadSupportThreads() {
  try {
    const storedThreads = JSON.parse(localStorage.getItem(supportStorageKey) || "[]");
    storedThreads.forEach(storedThread => {
      const thread = supportThreads.find(item => item.id === storedThread.id);
      if (thread) Object.assign(thread, storedThread);
    });
  } catch {
    localStorage.removeItem(supportStorageKey);
  }
}

function saveSupportThreads() {
  localStorage.setItem(supportStorageKey, JSON.stringify(supportThreads));
}

function filteredSupportThreads() {
  const term = byId("supportSearch")?.value?.trim().toLowerCase() || "";
  return supportThreads.filter(thread => {
    const matchesFilter = state.supportFilter === "all" || thread.status === state.supportFilter;
    const matchesSearch = [thread.customer, thread.orderId, thread.machine, thread.preview].join(" ").toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });
}

function renderSupportInbox() {
  const threads = filteredSupportThreads();
  byId("supportBadge").textContent = supportThreads.filter(thread => thread.status !== "resolved").length;
  byId("supportThreads").innerHTML = threads.length ? threads.map(thread => `
    <button class="support-thread ${thread.id === state.activeSupportThread ? "active" : ""}" type="button" data-support-thread="${thread.id}">
      <span class="support-avatar">${supportInitials(thread.customer)}</span>
      <span class="support-thread-main">
        <strong>${thread.customer}</strong>
        <small>#${thread.orderId}</small>
        <em>${thread.preview}</em>
        <span class="mini-chip">${thread.tag}</span>
      </span>
      <span class="support-thread-meta">
        <small>${thread.lastSeen}</small>
        <b class="${thread.status}">${thread.urgency}</b>
      </span>
    </button>
  `).join("") : `<p class="empty-state compact-empty">No matching chats.</p>`;
}

function renderSupportChat() {
  const thread = activeSupportThread();
  byId("supportCustomerName").textContent = thread.customer;
  byId("supportOrderLabel").textContent = `Regarding Order ${thread.orderId}`;
  byId("supportStatusLabel").textContent = thread.urgency;
  byId("supportStatusLabel").className = `status-pill ${thread.status === "resolved" ? "success" : thread.status === "pending" ? "warning" : "success"}`;
  byId("supportOrderStrip").innerHTML = `
    <div><span>Machine</span><strong>${thread.machine} ${thread.machineLabel}</strong></div>
    <div><span>Customer</span><strong>${thread.customer}</strong></div>
    <div><span>Revenue</span><strong>${money(thread.total)} ${thread.paid ? "(Paid)" : "(Unpaid)"}</strong></div>
    <div><span>Status</span><strong>${thread.eta}</strong></div>
  `;
  byId("supportMessages").innerHTML = thread.messages.map(message => `
    <div class="support-message ${message.sender === "Customer" ? "customer" : "admin"}">
      <span>${message.sender}</span>
      <p>${message.body}</p>
      <small>${message.time}</small>
    </div>
  `).join("");
  byId("resolveSupportThread").disabled = thread.status === "resolved";
  byId("resolveSupportThread").textContent = thread.status === "resolved" ? "Resolved" : "Mark Resolved";
}

function renderSupport() {
  renderSupportInbox();
  renderSupportChat();
}

function setSupportThread(threadId) {
  state.activeSupportThread = threadId;
  renderSupport();
}

function sendSupportReply(text) {
  const thread = activeSupportThread();
  thread.messages.push({ sender: "Admin", body: text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) });
  thread.preview = text;
  thread.lastSeen = "Just now";
  if (thread.status === "pending") {
    thread.status = "active";
    thread.urgency = "Live Active";
  }
  saveSupportThreads();
  renderSupport();
}

function resolveSupportThread() {
  const thread = activeSupportThread();
  thread.status = "resolved";
  thread.urgency = "Resolved";
  thread.preview = "Marked resolved by staff.";
  thread.lastSeen = "Just now";
  saveSupportThreads();
  renderSupport();
}

function setRoute(route) {
  state.route = route;
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("active-view", view.id === route));
  document.querySelectorAll(".nav-link").forEach(link => {
    const active = link.dataset.pageLink === route;
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
    support: ["Customer Inquiries", "WashWiz Staff Chat"],
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
  renderSupport();
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

  const supportThreadButton = event.target.closest("[data-support-thread]");
  if (supportThreadButton) setSupportThread(supportThreadButton.dataset.supportThread);

  const supportFilterButton = event.target.closest("[data-support-filter]");
  if (supportFilterButton) {
    state.supportFilter = supportFilterButton.dataset.supportFilter;
    document.querySelectorAll("[data-support-filter]").forEach(button => button.classList.toggle("active", button === supportFilterButton));
    renderSupportInbox();
  }

  const quickReplyButton = event.target.closest("[data-quick-reply]");
  if (quickReplyButton) {
    byId("supportReplyInput").value = quickReplyButton.dataset.quickReply;
    byId("supportReplyInput").focus();
  }
});

byId("loginForm").addEventListener("submit", event => {
  event.preventDefault();
  showLoadingBefore(() => {
    sessionStorage.setItem("washwizStaffLoggedIn", "true");
    setRoute(document.body.dataset.page || "dashboard");
    byId("auth").classList.add("hidden");
    byId("app").classList.remove("hidden");
  });
});
byId("registerForm").addEventListener("submit", event => {
  event.preventDefault();
  showLoadingBefore(() => {
    sessionStorage.setItem("washwizStaffLoggedIn", "true");
    setRoute(document.body.dataset.page || "dashboard");
    byId("auth").classList.add("hidden");
    byId("app").classList.remove("hidden");
  });
});
byId("continueSupplies").addEventListener("click", () => { renderSupplies(); setRoute("supplies"); });
byId("confirmBooking").addEventListener("click", confirmBooking);
byId("customerSearch").addEventListener("input", renderCustomers);
byId("supportSearch").addEventListener("input", renderSupportInbox);
byId("menuToggle").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("open"));
byId("logoutButton").addEventListener("click", logOutStaff);
byId("supportReplyForm").addEventListener("submit", event => {
  event.preventDefault();
  const input = byId("supportReplyInput");
  const body = input.value.trim();
  if (!body) return;
  sendSupportReply(body);
  input.value = "";
});
byId("resolveSupportThread").addEventListener("click", resolveSupportThread);
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeCustomerAccessModal();
});

loadSupportThreads();
renderAll();
setRoute(state.route);
const hasActiveStaffSession = sessionStorage.getItem("washwizStaffLoggedIn") === "true";
if (hasActiveStaffSession) {
  byId("auth").classList.add("hidden");
  byId("app").classList.remove("hidden");
  byId("loadingScreen")?.remove();
} else {
  window.setTimeout(() => {
    const loadingScreen = byId("loadingScreen");
    if (!loadingScreen) return;
    loadingScreen.classList.remove("is-title");
    loadingScreen.classList.add("is-black");
  }, 1300);
  window.setTimeout(finishLoading, 3200);
}
