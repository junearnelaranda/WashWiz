const db = window.WashWizDB;
const esc = db.escape;

const state = {
  route: document.body.dataset.page || "dashboard",
  selectedMachine: null,
  supplies: {},
  activeSupportThread: null,
  supportFilter: "all",
  bookings: [] // live from Supabase
};

// Live from Supabase (see "Live data" at the bottom of this file).
const machines = [];
const facility = { user: null, staff: null, shop: null, shops: [] };

const supplies = [
  { id: "detergent", name: "Eco-Friendly Detergent", desc: "Plant-based, low-suds formula", price: 45 },
  { id: "softener", name: "Fabric Softener", desc: "Fresh finish for mixed loads", price: 35 },
  { id: "bleach", name: "Color-Safe Bleach", desc: "Brightens without harsh fading", price: 40 },
  { id: "sheets", name: "Anti-Static Dryer Sheets", desc: "Reduces cling for dry cycles", price: 25 }
];

const supportThreads = []; // live from Supabase

const supportStorageKey = "washwizSupportThreads";
const facilityRouteLoadingKey = "washwizFacilityRouteLoading";
const facilityPageFiles = new Set(["dashboard.html", "bookings.html", "details.html", "revenue.html", "support.html", "settings.html"]);
const facilityPageRoutes = {
  "dashboard.html": "dashboard",
  "bookings.html": "bookings",
  "details.html": "customers",
  "revenue.html": "revenue",
  "support.html": "support",
  "settings.html": "settings"
};
const money = value => `PHP ${value.toLocaleString("en-PH")}`;
const byId = id => document.getElementById(id);
const statusLabel = status => status === "maintenance" ? "Service" : status.replace(/\b\w/g, char => char.toUpperCase());
const sizeName = size => (window.WashWizDB.SIZES.find(([value]) => value === size) || [size, size || ""])[1];
const statusClass = value => value.toLowerCase().includes("complete") || value.toLowerCase().includes("paid") ? "available" : value.toLowerCase().includes("service") || value.toLowerCase().includes("maintenance") ? "maintenance" : "occupied";
let loadingTransitionActive = false;

function finishLoading() {
  const loadingScreen = byId("loadingScreen");
  if (!loadingScreen) return;
  loadingScreen.classList.add("is-done");
  loadingTransitionActive = false;
}

function setLoadingMode(mode) {
  const loadingScreen = byId("loadingScreen");
  if (!loadingScreen) return null;
  loadingScreen.classList.remove("is-title");
  loadingScreen.classList.remove("is-black");
  loadingScreen.classList.remove("is-brand");
  loadingScreen.classList.remove("is-washer");
  loadingScreen.classList.remove("is-skeleton");
  loadingScreen.classList.add(mode);
  loadingScreen.classList.remove("is-done");
  return loadingScreen;
}

function showLoadingBefore(callback, options = {}) {
  const { delay = 520, finish = true, mode = "is-washer" } = options;
  const loadingScreen = setLoadingMode(mode);
  if (!loadingScreen) {
    callback();
    return;
  }
  if (loadingTransitionActive) return;
  loadingTransitionActive = true;
  window.setTimeout(() => {
    callback();
    if (finish) window.setTimeout(finishLoading, 180);
  }, delay);
}

function showWasherRouteBefore(callback, delay = 720) {
  showLoadingBefore(callback, { delay, finish: false, mode: "is-washer" });
}

async function logOutFacility() {
  sessionStorage.removeItem("washwizFacilityLoggedIn");
  stopLiveUpdates();
  await db.client.auth.signOut();
  showLoadingBefore(() => {
    byId("app").classList.add("hidden");
    byId("auth").classList.remove("hidden");
    document.querySelector(".sidebar").classList.remove("open");
    setRoute("dashboard");
  }, { delay: 520, mode: "is-washer" });
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
  const latest = state.bookings.find(booking => booking.customer === customerName);
  const orderId = latest?.id || "-";
  const link = new URL(`customer.html#verify-${orderId}`, location.href).href;
  byId("customerAccessCustomer").textContent = `${customerName} - customer order portal access`;
  byId("customerAccessOrderId").textContent = orderId;
  byId("customerAccessCopyId").dataset.copy = orderId;
  byId("customerAccessCopyLink").dataset.copy = link;
  byId("customerAccessModal").classList.remove("hidden");
}

function closeCustomerAccessModal() {
  byId("customerAccessModal").classList.add("hidden");
}

function supportInitials(name) {
  return name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();
}

function activeSupportThread() {
  return supportThreads.find(thread => thread.id === state.activeSupportThread) || supportThreads[0] || null;
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
    <button class="support-thread ${thread.id === activeSupportThread()?.id ? "active" : ""}" type="button" data-support-thread="${esc(thread.id)}">
      <span class="support-avatar">${esc(supportInitials(thread.customer))}</span>
      <span class="support-thread-main">
        <strong>${esc(thread.customer)}</strong>
        <small>#${esc(thread.orderId)}</small>
        <em>${esc(thread.preview)}</em>
        <span class="mini-chip">${esc(thread.tag)}</span>
      </span>
      <span class="support-thread-meta">
        <small>${esc(thread.lastSeen)}</small>
        <b class="${esc(thread.status)}">${esc(thread.urgency)}</b>
      </span>
    </button>
  `).join("") : `<p class="empty-state compact-empty">No matching chats.</p>`;
}

function renderSupportChat() {
  const thread = activeSupportThread();
  const hasThread = Boolean(thread);
  byId("supportReplyInput").disabled = !hasThread;
  byId("supportReplyForm").querySelector("button").disabled = !hasThread;
  if (!thread) {
    byId("supportCustomerName").textContent = "No conversations yet";
    byId("supportOrderLabel").textContent = "Customers can message you from their order page.";
    byId("supportStatusLabel").textContent = "Waiting";
    byId("supportStatusLabel").className = "status-pill warning";
    byId("supportOrderStrip").innerHTML = "";
    byId("supportMessages").innerHTML = "";
    byId("resolveSupportThread").disabled = true;
    return;
  }
  state.activeSupportThread = thread.id;
  byId("supportCustomerName").textContent = thread.customer;
  byId("supportOrderLabel").textContent = `Regarding Order ${thread.orderId}`;
  byId("supportStatusLabel").textContent = thread.urgency;
  byId("supportStatusLabel").className = `status-pill ${thread.status === "pending" ? "warning" : "success"}`;
  const booking = state.bookings.find(item => item.id.toUpperCase() === String(thread.orderId).toUpperCase());
  byId("supportOrderStrip").innerHTML = `
    <div><span>Machine</span><strong>${esc(booking?.machine || thread.machine)} ${esc(thread.machineLabel)}</strong></div>
    <div><span>Customer</span><strong>${esc(thread.customer)}</strong></div>
    <div><span>Total</span><strong>${esc(money(booking?.total ?? thread.total))}</strong></div>
    <div><span>Status</span><strong>${esc(booking?.status || thread.eta)}</strong></div>
  `;
  byId("supportMessages").innerHTML = thread.messages.map(message => `
    <div class="support-message ${message.sender === "Customer" ? "customer" : "admin"}">
      <span>${message.sender === "Customer" ? "Customer" : "Facility"}</span>
      <p>${esc(message.body)}</p>
      <small>${esc(message.time)}</small>
    </div>
  `).join("");
  const box = byId("supportMessages");
  box.scrollTop = box.scrollHeight;
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

async function sendSupportReply(text) {
  const thread = activeSupportThread();
  if (!thread) return;
  const { error } = await db.client.from("support_messages").insert({ thread_id: thread.id, sender: "Admin", body: text });
  if (error) { alert(db.errorText(error)); return; }
  await db.client.from("support_threads").update({ preview: text, status: "active", urgency: "Live Active", updated_at: new Date().toISOString() }).eq("id", thread.id);
}

async function resolveSupportThread() {
  const thread = activeSupportThread();
  if (!thread) return;
  const { error } = await db.client.from("support_threads").update({ status: "resolved", urgency: "Resolved", preview: "Marked resolved by the facility.", updated_at: new Date().toISOString() }).eq("id", thread.id);
  if (error) alert(db.errorText(error));
}

function setRoute(route) {
  state.route = route;
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("active-view", view.id === route));
  document.querySelectorAll(".nav-link").forEach(link => {
    const active = link.dataset.pageLink === route;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  const titles = {
    dashboard: ["Today", "Dashboard"],
    machines: ["Booking flow", "Select Machine"],
    supplies: ["Booking flow", "Wash Supplies"],
    confirmed: ["Success", "Booking Confirmed"],
    bookings: ["Operations", "Bookings Management"],
    customers: ["Relationships", "Customers"],
    support: ["Customer Inquiries", "WashWiz Facility Support"],
    revenue: ["Analytics", "Revenue & Analytics"],
    settings: ["Preferences", "Facility Settings"]
  };
  byId("routeEyebrow").textContent = titles[route][0];
  byId("routeTitle").textContent = titles[route][1];
  document.querySelector(".sidebar").classList.remove("open");
}

function transitionRoute(route, beforeRoute) {
  if (!route) return;
  beforeRoute?.();
  setRoute(route);
}

function facilityPageName(url) {
  return url.pathname.split("/").filter(Boolean).pop() || "index.html";
}

function isFacilityPageLink(link) {
  const target = new URL(link.getAttribute("href"), location.href);
  return target.origin === location.origin && facilityPageFiles.has(facilityPageName(target));
}

function handleFacilityPageNavigation(event) {
  const link = event.target.closest("a[href]");
  if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (link.target && link.target !== "_self") return false;
  if (!isFacilityPageLink(link)) return false;

  const target = new URL(link.getAttribute("href"), location.href);
  const currentPage = facilityPageName(new URL(location.href));
  const isSamePage = target.pathname === location.pathname || facilityPageName(target) === currentPage;

  event.preventDefault();
  if (isSamePage) {
    transitionRoute(link.dataset.pageLink || facilityPageRoutes[facilityPageName(target)]);
    return true;
  }

  sessionStorage.setItem(facilityRouteLoadingKey, "true");
  showWasherRouteBefore(() => {
    location.href = target.href;
  });
  return true;
}

function machineCard(machine, selectable = false) {
  const disabled = machine.status !== "available";
  const selected = state.selectedMachine?.id === machine.id;
  const dashboardCard = !selectable && document.body.dataset.page === "dashboard";
  const statusDetails = {
    available: ["circle-check", "Ready for use", "Ready to load"],
    occupied: ["circle-alert", machine.type === "dryer" ? "Drying Cycle" : "Cycle in progress", "Occupied"],
    maintenance: ["triangle-alert", "Maintenance", "Under service"]
  };
  const [statusIcon, statusTitle, statusNote] = statusDetails[machine.status];
  const dashboardControls = dashboardCard ? `
      <div class="dashboard-quick-status" aria-label="Quick status for ${machine.id}">
        <div class="dashboard-quick-status-head"><span>Quick status</span><small>Tap to set</small></div>
        <div class="dashboard-status-options" role="group" aria-label="Set ${machine.id} status">
          <button type="button" class="${machine.status === "available" ? "active available" : ""}" data-machine-status="available" data-machine-id="${machine.id}">Avail</button>
          <button type="button" class="${machine.status === "occupied" ? "active occupied" : ""}" data-machine-status="occupied" data-machine-id="${machine.id}">In Use</button>
          <button type="button" class="${machine.status === "maintenance" ? "active maintenance" : ""}" data-machine-status="maintenance" data-machine-id="${machine.id}">Service</button>
        </div>
      </div>` : "";
  const dashboardActions = dashboardCard ? `
        <span class="dashboard-machine-actions">
          <button type="button" data-edit-machine="${machine.id}" aria-label="Edit ${machine.id}" title="Edit machine"><span aria-hidden="true">&#9998;</span></button>
          <button type="button" data-delete-machine="${machine.id}" aria-label="Remove ${machine.id}" title="Remove machine"><span aria-hidden="true">&#128465;</span></button>
        </span>` : "";
  return `
    <article class="machine-card clay ${machine.status} ${selected ? "selected" : ""}" ${dashboardCard ? `data-dashboard-machine-id="${machine.id}" tabindex="-1"` : ""}>
      <div class="machine-top">
        <span class="machine-id">${esc(machine.id)}</span>
        <span class="badge ${machine.status}">${statusLabel(machine.status)}</span>
      </div>
      ${dashboardCard ? `<div class="dashboard-machine-state">
        <span class="machine-state-icon">${dashboardIcon(statusIcon)}</span>
        <span class="machine-state-copy"><strong>${statusTitle}</strong><small>${statusNote}</small></span>
      </div>` : '<div class="machine-visual"></div>'}
      ${dashboardControls}
      <p><span class="dashboard-machine-details"><strong>${esc(machine.label)}</strong><br><span>${esc(sizeName(machine.size))}${machine.load ? ` / ${esc(machine.load)}` : ""} / ${esc(money(machine.price))}</span><span>${esc(machine.eta)}</span></span>${dashboardActions}</p>
      ${selectable ? `<button class="select-btn" data-machine="${machine.id}" ${disabled ? "disabled" : ""} aria-label="${disabled ? `${machine.id} unavailable` : `Select ${machine.id} for ${money(machine.price)}`}">${disabled ? "Unavailable" : selected ? "Selected" : `Select - ${money(machine.price)}`}</button>` : ""}
    </article>
  `;
}

function renderMachines(target, filter, selectable) {
  const list = machines.filter(machine => filter === "all" || machine.type === filter || machine.size === filter);
  const cards = list.map(machine => machineCard(machine, selectable)).join("");
  const addCard = target === "dashboardMachines" && !selectable ? `
    <button class="dashboard-add-machine" type="button" data-add-machine aria-label="Add a new machine">
      <span class="dashboard-add-machine-icon" aria-hidden="true">+</span>
      <strong>+ Add New Machine</strong>
      <small>Register washer or dryer<br>to the floor</small>
    </button>` : "";
  byId(target).innerHTML = cards + addCard;
}

function todayISO() {
  return new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10); // Asia/Manila
}

function countedBookings() {
  return state.bookings.filter(booking => booking.status !== "Cancelled");
}

function renderMetrics() {
  const available = machines.filter(machine => machine.status === "available").length;
  const occupied = machines.filter(machine => machine.status === "occupied").length;
  const service = machines.filter(machine => machine.status === "maintenance").length;
  const today = countedBookings().filter(booking => booking.date === todayISO());
  const todayRevenue = today.reduce((sum, booking) => sum + booking.total, 0);
  const allRevenue = countedBookings().reduce((sum, booking) => sum + booking.total, 0);
  const averageTicket = countedBookings().length ? Math.round(allRevenue / countedBookings().length) : 0;
  const open = state.bookings.filter(booking => !db.DONE.includes(booking.status) && booking.status !== "Paid").length;
  const metrics = [
    ["Total Machines", machines.length, service ? `${service} under service` : "All machines in service", "up", "4,18 16,12 27,15 39,7 52,10"],
    ["Available", available, "Ready for walk-ins", "up", "4,19 15,15 27,16 39,10 52,5"],
    ["Active Cycles", occupied, "Currently running", "down", "4,7 16,11 27,9 39,15 52,18"],
    ["Today's Revenue", money(todayRevenue), `${today.length} bookings today / ${open} open`, "up", "4,18 16,16 27,12 39,13 52,6"]
  ];
  byId("metrics").innerHTML = metrics.map(([label, value, note, trend, sparkline]) => `
    <article class="metric clay trend-${trend}">
      <div class="metric-head">
        <span>${label}</span>
        <svg class="metric-sparkline" viewBox="0 0 56 24" aria-hidden="true">
          <polyline points="${sparkline}"></polyline>
        </svg>
      </div>
      <b>${esc(value)}</b>
      <p>${esc(note)}</p>
    </article>
  `).join("");
  byId("revenueMetrics").innerHTML = [
    ["Total Revenue", money(allRevenue), "All bookings, excluding cancelled"],
    ["Average Ticket Size", money(averageTicket), "Per booking"],
    ["Total Transactions", countedBookings().length, `${state.bookings.filter(booking => booking.source === "walk-in").length} walk-ins`],
    ["Active Customers", customers().length, "Unique customer names"]
  ].map(([label, value, note]) => `<article class="metric clay revenue-metric up"><span>${label}</span><b>${esc(value)}</b><p>${esc(note)}</p></article>`).join("");
}

function supplyRevenue() {
  return Math.round(state.bookings.reduce((sum, booking) => sum + booking.total, 0) * .26);
}

function customers() {
  const map = new Map();
  // New bookings are prepended, so the first record has the latest contact and visit.
  state.bookings.forEach(booking => {
    const current = map.get(booking.customer) || { name: booking.customer, contact: booking.contact, count: 0, spend: 0, last: booking.time };
    current.count += 1;
    current.spend += booking.total;
    map.set(booking.customer, current);
  });
  return [...map.values()];
}

function renderTables() {
  if (typeof window.renderBookingsPage === "function") {
    window.renderBookingsPage();
  } else {
    byId("bookingsTable").innerHTML = state.bookings.length ? state.bookings.map(booking => `
      <tr>
        <td data-label="Customer"><strong>${esc(booking.customer)}</strong><br><small>${esc(booking.contact)}</small></td>
        <td data-label="Machine">${esc(booking.machine)}<br><small>${esc(booking.type)}</small></td>
        <td data-label="Status"><span class="badge ${statusClass(booking.status)}">${esc(booking.status)}</span></td>
        <td data-label="Time">${esc(booking.time)}</td>
        <td data-label="Total">${money(booking.total)}</td>
      </tr>
    `).join("") : `<tr><td class="empty-state" colspan="5"><strong>No bookings yet</strong><br><small>New paid bookings will appear here as soon as they are confirmed.</small></td></tr>`;
  }
  renderCustomers();
  renderTransactions();
}

function renderTransactions() {
  const rows = countedBookings();
  byId("transactionsTable").innerHTML = rows.length ? rows.map(booking => `
    <tr>
      <td data-label="Date & Time"><strong>${booking.date === todayISO() ? "Today" : esc(booking.time.split(",")[0])}</strong><br><small>${esc(booking.time)}</small></td>
      <td data-label="Customer / Machine"><strong>${esc(booking.customer)}</strong><br><span class="mini-chip">${esc(booking.machine)}</span></td>
      <td data-label="Payment Method"><span class="payment-pill">${booking.source === "walk-in" ? "Cash desk" : "Pay at shop"}</span></td>
      <td data-label="Amount"><strong>${money(booking.total)}</strong></td>
    </tr>
  `).join("") : `<tr><td class="empty-state" colspan="4"><strong>No transactions yet</strong></td></tr>`;
}

function renderCustomers() {
  if (typeof window.renderCustomersPage === "function") {
    window.renderCustomersPage();
    return;
  }
  const term = byId("customerSearch")?.value?.toLowerCase() || "";
  const rows = customers()
    .filter(customer => customer.name.toLowerCase().includes(term) || customer.contact.toLowerCase().includes(term))
    .map(customer => `<tr><td data-label="Customer Name"><strong>${esc(customer.name)}</strong></td><td data-label="Contact">${esc(customer.contact)}</td><td data-label="Total Bookings">${customer.count}</td><td data-label="Last Visit">${esc(customer.last)}</td><td data-label="Spend">${money(customer.spend)}</td><td data-label="Action"><button class="secondary-btn compact table-action" type="button" data-customer-details="${esc(customer.name)}">See Details</button></td></tr>`);
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
  const days = [];
  for (let offset = 6; offset >= 0; offset--) {
    const date = new Date(Date.now() + 8 * 3600e3 - offset * 86400e3).toISOString().slice(0, 10);
    const label = new Intl.DateTimeFormat("en-PH", { weekday: "short" }).format(new Date(`${date}T00:00:00`));
    days.push([label, countedBookings().filter(booking => booking.date === date).reduce((sum, booking) => sum + booking.total, 0)]);
  }
  const peak = Math.max(1, ...days.map(([, value]) => value));
  byId("barChart").innerHTML = days.map(([day, value]) => `<div class="bar" style="height:${Math.max(4, Math.round(value / peak * 150))}px" title="${esc(money(value))}"><span>${day}</span></div>`).join("");
  const share = list => list.length ? Math.round(list.filter(machine => machine.status === "occupied").length / list.length * 100) : 0;
  const usage = [
    ["Washers in use", share(machines.filter(machine => machine.type === "washer"))],
    ["Dryers in use", share(machines.filter(machine => machine.type === "dryer"))],
    ["Machines available", machines.length ? Math.round(machines.filter(machine => machine.status === "available").length / machines.length * 100) : 0],
    ["Under service", machines.length ? Math.round(machines.filter(machine => machine.status === "maintenance").length / machines.length * 100) : 0]
  ];
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

async function confirmBooking() {
  if (!state.selectedMachine) {
    transitionRoute("machines");
    byId("selectedMachineMeta").textContent = "Select an available machine before continuing.";
    byId("selectedMachineMeta").classList.add("form-note", "error");
    return;
  }
  const name = byId("customerName").value.trim() || "Walk-in Customer";
  const contact = byId("customerContact").value.trim() || "Cash desk";
  const machine = state.selectedMachine;
  const extras = supplies.filter(item => state.supplies[item.id]).map(item => `${item.name} x${state.supplies[item.id]}`).join(", ");
  const total = orderTotal();
  const now = new Date();
  const button = byId("confirmBooking");
  button.disabled = true;
  const { error } = await db.client.from("bookings").insert({
    shop_id: facility.shop.id,
    facility: facility.shop.name,
    facility_address: facility.shop.address,
    customer: name,
    contact,
    type: machine.type === "washer" ? "Washer" : "Dryer",
    machine: machine.id,
    status: machine.type === "washer" ? "In Cycle" : "Drying",
    source: "walk-in",
    booking_date: todayISO(),
    booking_time: now.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" }),
    notes: extras,
    total
  });
  button.disabled = false;
  if (error) { alert(db.errorText(error)); return; }
  await setMachineStatus(machine.id, "occupied", `In use / ${name.split(" ")[0]}`);
  byId("confirmTitle").textContent = `${machine.id} is reserved for ${name}`;
  byId("confirmDetails").textContent = `${machine.type === "washer" ? "Washer" : "Dryer"} booking at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Total collected: ${money(total)}.`;
  state.selectedMachine = null;
  byId("continueSupplies").disabled = true;
  byId("selectedMachineTitle").textContent = "Choose a machine";
  byId("selectedMachineMeta").textContent = "Available washers and dryers are ready to book.";
  byId("selectedMachineMeta").classList.remove("form-note", "error");
  transitionRoute("confirmed");
}

async function setMachineStatus(id, status, eta) {
  if (!id || id === "Unassigned") return;
  const { error } = await db.client.from("machines").update({ status, eta }).eq("shop_id", facility.shop.id).eq("id", id);
  if (error) alert(db.errorText(error));
}

// Change a booking's status (and keep its machine in step): used by the bookings page.
async function updateBooking(booking, patch) {
  const { error } = await db.client.from("bookings").update(patch).eq("id", booking.id);
  if (error) { alert(db.errorText(error)); return false; }
  const status = patch.status || booking.status;
  const machine = patch.machine || booking.machine;
  if (patch.machine && booking.machine !== patch.machine) await setMachineStatus(booking.machine, "available", "Ready now");
  if (db.BUSY.includes(status)) await setMachineStatus(machine, "occupied", `In use / ${booking.customer.split(" ")[0]}`);
  if (db.DONE.includes(status) || status === "Paid") await setMachineStatus(machine, "available", "Ready now");
  return true;
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
  if (handleFacilityPageNavigation(event)) return;

  const routeButton = event.target.closest("[data-route]");
  if (routeButton) transitionRoute(routeButton.dataset.route);

  const authTab = event.target.closest("[data-auth-tab]");
  if (authTab) {
    document.querySelectorAll("[data-auth-tab]").forEach(tab => tab.classList.toggle("active", tab === authTab));
    byId("loginForm").classList.toggle("hidden", authTab.dataset.authTab !== "login");
    byId("registerForm").classList.toggle("hidden", authTab.dataset.authTab !== "register");
  }

  const filterButton = event.target.closest("#machineFilter button, #bookingMachineFilter button");
  if (filterButton) {
    const group = filterButton.parentElement;
    group.querySelectorAll("button").forEach(button => {
      button.classList.toggle("active", button === filterButton);
      button.setAttribute("aria-pressed", String(button === filterButton));
    });
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

function authMessage(text, isError = false) {
  const node = byId("authMessage");
  node.textContent = text;
  node.classList.toggle("error", isError);
}

byId("loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  authMessage("Signing in...");
  const { error } = await db.client.auth.signInWithPassword({
    email: byId("facilityLoginEmail").value.trim(),
    password: byId("facilityLoginPassword").value
  });
  button.disabled = false;
  if (error) { authMessage(db.errorText(error), true); return; }
  authMessage("");
  enterFacility();
});
byId("registerForm").addEventListener("submit", async event => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  authMessage("Creating your facility...");
  const { data, error } = await db.client.auth.signUp({
    email: byId("facilityEmail").value.trim(),
    password: byId("facilityPassword").value,
    options: { data: { facility_name: byId("facilityName").value.trim() } }
  });
  button.disabled = false;
  if (error) { authMessage(db.errorText(error), true); return; }
  if (!data.session) {
    authMessage("Check your email to confirm your account, then log in.");
    document.querySelector('[data-auth-tab="login"]').click();
    return;
  }
  enterFacility();
});
byId("continueSupplies").addEventListener("click", () => {
  transitionRoute("supplies", renderSupplies);
});
byId("confirmBooking").addEventListener("click", confirmBooking);
byId("customerSearch").addEventListener("input", renderCustomers);
byId("supportSearch").addEventListener("input", renderSupportInbox);
byId("menuToggle").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("open"));
byId("logoutButton").addEventListener("click", logOutFacility);
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

// ---------- Live data (Supabase) ----------
let liveChannel = null;

function stopLiveUpdates() {
  if (liveChannel) db.client.removeChannel(liveChannel);
  liveChannel = null;
}

async function loadShopData() {
  const shopId = facility.shop.id;
  const [shopRes, machineRes, bookingRes, threadRes] = await Promise.all([
    db.client.from("shops").select("*").order("sort_order"),
    db.client.from("machines").select("*").eq("shop_id", shopId).order("sort_order"),
    db.client.from("bookings").select("*").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(500),
    db.client.from("support_threads").select("*").eq("shop_id", shopId).order("updated_at", { ascending: false })
  ]);
  const failed = shopRes.error || machineRes.error || bookingRes.error || threadRes.error;
  if (failed) { console.error(failed); return; }
  facility.shops = shopRes.data;
  facility.shop = shopRes.data.find(shop => shop.id === shopId) || facility.shop;
  const threadIds = threadRes.data.map(thread => thread.id);
  const messageRes = threadIds.length
    ? await db.client.from("support_messages").select("*").in("thread_id", threadIds).order("id")
    : { data: [] };
  db.replaceAll(machines, machineRes.data.map(machine => ({ ...machine, load: machine.load || "" })));
  db.replaceAll(state.bookings, bookingRes.data.map(db.toBooking));
  db.replaceAll(supportThreads, threadRes.data.map(thread => db.toThread(thread, (messageRes.data || []).filter(message => message.thread_id === thread.id))));
  window.WashWizCurrentShop = facility.shop;
  window.WashWizSettings.apply();
  if (state.selectedMachine) state.selectedMachine = machines.find(machine => machine.id === state.selectedMachine.id && machine.status === "available") || null;
  renderAll();
  document.dispatchEvent(new CustomEvent("washwiz:data"));
}

function startLiveUpdates() {
  stopLiveUpdates();
  const refresh = db.debounce(loadShopData, 250);
  const shopFilter = `shop_id=eq.${facility.shop.id}`;
  liveChannel = db.client.channel(`facility-${facility.shop.id}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: shopFilter }, refresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "machines", filter: shopFilter }, refresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "support_threads", filter: shopFilter }, refresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "support_messages" }, refresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "shops" }, refresh)
    .subscribe();
}

// Sign-in is real now: check the Supabase session, the staff row and the shop before showing the dashboard.
async function enterFacility() {
  const { data: { session } } = await db.client.auth.getSession();
  if (!session) {
    sessionStorage.removeItem("washwizFacilityLoggedIn");
    byId("app").classList.add("hidden");
    byId("auth").classList.remove("hidden");
    finishLoading();
    return false;
  }
  facility.user = session.user;
  const staffRes = await db.client.from("staff").select("*").eq("user_id", session.user.id).maybeSingle();
  facility.staff = staffRes.data;
  const shopsRes = await db.client.from("shops").select("*").order("sort_order");
  facility.shops = shopsRes.data || [];
  const shopId = facility.staff?.shop_id;
  const problem = !facility.staff ? "This account is not a WashWiz facility."
    : facility.staff.role === "admin" ? "Admin accounts sign in on the WashWiz staff login, not here."
    : facility.staff.status === "disabled" ? "This facility account is turned off. Contact WashWiz support."
    : !shopId ? "No shop is linked to this account. Register your laundry shop with the Register tab."
    : "";
  if (problem) {
    await db.client.auth.signOut();
    sessionStorage.removeItem("washwizFacilityLoggedIn");
    byId("app").classList.add("hidden");
    byId("auth").classList.remove("hidden");
    authMessage(problem, true);
    finishLoading();
    return false;
  }
  facility.shop = facility.shops.find(shop => shop.id === shopId) || { id: shopId, name: "", address: "" };
  sessionStorage.setItem("washwizFacilityLoggedIn", "true");
  await loadShopData();
  startLiveUpdates();
  setRoute(document.body.dataset.page || "dashboard");
  byId("auth").classList.add("hidden");
  byId("app").classList.remove("hidden");
  finishLoading();
  return true;
}

renderAll();
setRoute(state.route);
const shouldDelayForLandingLoader = new URLSearchParams(location.search).get("loader") === "washer";
// Start once every script on the page has run, so page scripts (settings, bookings...) hear the first data load.
const startFacility = () => window.setTimeout(() => {
  sessionStorage.removeItem(facilityRouteLoadingKey);
  enterFacility();
}, shouldDelayForLandingLoader ? 780 : 0);
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startFacility);
else startFacility();
