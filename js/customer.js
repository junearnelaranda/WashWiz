const db = window.WashWizDB;
const esc = db.escape;

// Live from Supabase: active shops, their machines, and each shop's own services and prices.
const laundryShops = [];
let selectedShop = null;
let expandedShopId = null;

const customerById = id => document.getElementById(id);
const shopServices = shop => (Array.isArray(shop?.services) ? shop.services : []);
const selectedService = () => {
  const index = document.querySelector('input[name="bookingService"]:checked')?.value;
  return shopServices(selectedShop)[Number(index)] || null;
};

function setCustomerSection(sectionId) {
  document.querySelectorAll("[data-customer-section]").forEach(button => {
    const active = button.dataset.customerSection === sectionId;
    button.classList.toggle("active", active);
    button.classList.toggle("primary-btn", active);
    button.classList.toggle("secondary-btn", !active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll(".customer-section").forEach(section => {
    section.classList.toggle("active-customer-section", section.id === sectionId);
  });
}

function setMessage(id, type, text) {
  const message = customerById(id);
  message.className = `verification-message ${type}`;
  message.textContent = text;
}

const sizeLabel = size => (db.SIZES.find(([value]) => value === size) || [size, size || ""])[1];

function machineStatusLabel(status) {
  return status === "available" ? "Available" : status === "occupied" ? "Occupied" : "Maintenance";
}

function renderShopResults() {
  const query = customerById("shopSearch").value.trim().toLowerCase();
  const matches = laundryShops.filter(shop => `${shop.name} ${shop.address} ${shop.area}`.toLowerCase().includes(query));
  if (!laundryShops.length) {
    customerById("shopResultsSummary").textContent = "Loading shops...";
  }
  customerById("shopResultsSummary").textContent = `${matches.length} ${matches.length === 1 ? "shop" : "shops"} found`;
  customerById("shopResults").innerHTML = matches.length ? matches.map(shop => {
    const counts = shop.machines.reduce((result, machine) => {
      result[machine.status] = (result[machine.status] || 0) + 1;
      return result;
    }, {});
    const expanded = expandedShopId === shop.id;
    const prices = shopServices(shop).map(item => Number(item.price)).filter(Number.isFinite);
    return `<article class="shop-result-card ${selectedShop?.id === shop.id ? "selected" : ""}">
      <header class="shop-card-head">
        <span class="shop-card-mark" aria-hidden="true">${esc(shop.name.charAt(0))}</span>
        <div><h3>${esc(shop.name)}</h3><p>${esc(shop.address)}${shop.area ? `, ${esc(shop.area)}` : ""}</p></div>
        ${shop.distance ? `<span class="shop-distance">${esc(shop.distance)}</span>` : ""}
      </header>
      <div class="shop-meta">${shop.hours ? `<span class="shop-open"><i class="machine-status-dot available"></i>${esc(shop.hours)}</span>` : ""}<span>${shop.machines.length} machines</span><span>${prices.length ? `Services from PHP ${Math.min(...prices).toLocaleString("en-PH")}` : "No services listed yet"}</span></div>
      <div class="shop-availability" aria-label="Machine availability">
        <span class="available"><b>${counts.available || 0}</b> Available</span>
        <span class="occupied"><b>${counts.occupied || 0}</b> Occupied</span>
        <span class="maintenance"><b>${counts.maintenance || 0}</b> Maintenance</span>
      </div>
      <div class="shop-card-actions">
        <button class="secondary-btn compact" type="button" data-view-machines="${esc(shop.id)}" aria-expanded="${expanded}">${expanded ? "Hide machines" : "View machines"}</button>
        <button class="primary-btn compact" type="button" data-book-shop="${esc(shop.id)}">${selectedShop?.id === shop.id ? "Book here" : "Choose shop"}</button>
      </div>
      ${expanded ? `<div class="shop-machine-list">
        <div class="machine-list-heading"><strong>Live machine status</strong><small>Updates automatically</small></div>
        ${shop.machines.length ? shop.machines.map(machine => `<div class="customer-machine-row">
          <span class="machine-type-mark ${machine.type === "dryer" ? "dryer" : "washer"}" aria-hidden="true">${machine.type === "dryer" ? "D" : "W"}</span>
          <div><strong>${esc(machine.id)} · ${esc(machine.label)}</strong><small>${esc(sizeLabel(machine.size))}${machine.load ? ` / ${esc(machine.load)}` : ""} / PHP ${Number(machine.price).toLocaleString("en-PH")}</small></div>
          <div class="customer-machine-state ${esc(machine.status)}"><span><i class="machine-status-dot ${esc(machine.status)}"></i>${machineStatusLabel(machine.status)}</span><small>${esc(machine.eta)}</small></div>
        </div>`).join("") : '<p class="dashboard-empty">No machines listed yet.</p>'}
      </div>` : ""}
    </article>`;
  }).join("") : `<div class="shop-empty"><strong>No shops match your search</strong><p>Try a shop name, street, or nearby area.</p><button class="secondary-btn compact" type="button" data-clear-shop-search>Clear search</button></div>`;
}

function renderServiceOptions() {
  const picker = customerById("bookingServicePicker");
  const current = document.querySelector('input[name="bookingService"]:checked')?.value || "0";
  const list = shopServices(selectedShop);
  picker.innerHTML = `<legend>Choose a service</legend>` + (list.length ? list.map((item, index) => `<label class="booking-service-option">
      <input type="radio" name="bookingService" value="${index}" ${String(index) === current || (index === 0 && Number(current) >= list.length) ? "checked" : ""}>
      <span class="booking-service-check" aria-hidden="true"></span>
      <span><strong>${esc(item.name)}</strong>${item.desc ? `<small>${esc(item.desc)}</small>` : ""}</span>
      <b>PHP ${Number(item.price).toLocaleString("en-PH")}</b>
    </label>`).join("") : `<p class="dashboard-empty">${selectedShop ? "This shop has not listed its services and prices yet." : "Choose a shop first."}</p>`);
  picker.querySelectorAll('input[name="bookingService"]').forEach(input => input.addEventListener("change", updateBookingSummary));
  document.querySelector(".customer-booking-submit").disabled = !list.length;
}

function chooseShop(shopId, openBooking = false) {
  selectedShop = laundryShops.find(shop => shop.id === shopId) || laundryShops[0] || null;
  customerById("selectedBookingShop").textContent = selectedShop?.name || "Choose a shop";
  customerById("selectedBookingAddress").textContent = selectedShop?.address || "";
  customerById("bookingSummaryShop").textContent = selectedShop?.name || "-";
  renderServiceOptions();
  updateBookingSummary();
  renderShopResults();
  if (openBooking) {
    setCustomerSection("bookService");
    customerById("bookService").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function formatBookingDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" })
    .format(new Date(`${value}T00:00:00`));
}

function updateBookingSummary() {
  const service = selectedService();
  const date = customerById("bookingDate").value;
  const time = customerById("bookingTime").value;
  customerById("bookingSummaryService").textContent = service ? service.name : "-";
  customerById("bookingSummaryTotal").textContent = service ? `PHP ${Number(service.price).toLocaleString("en-PH")}` : "-";
  customerById("bookingSummarySchedule").textContent = date && time
    ? `${formatBookingDate(date)} at ${time}`
    : date
      ? `${formatBookingDate(date)} - choose a time`
      : "Choose a date and time";
}

function configureBookingDate() {
  const dateInput = customerById("bookingDate");
  const today = new Date();
  const maximum = new Date(today);
  maximum.setDate(maximum.getDate() + 30);
  const inputDate = date => {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
  };
  dateInput.min = inputDate(today);
  dateInput.max = inputDate(maximum);
}

document.querySelectorAll("[data-customer-section]").forEach(button => {
  button.addEventListener("click", () => setCustomerSection(button.dataset.customerSection));
});

customerById("shopSearch").addEventListener("input", renderShopResults);
customerById("shopResults").addEventListener("click", event => {
  const machineButton = event.target.closest("[data-view-machines]");
  if (machineButton) {
    expandedShopId = expandedShopId === machineButton.dataset.viewMachines ? null : machineButton.dataset.viewMachines;
    renderShopResults();
    return;
  }
  const bookingButton = event.target.closest("[data-book-shop]");
  if (bookingButton) chooseShop(bookingButton.dataset.bookShop, true);
  if (event.target.closest("[data-clear-shop-search]")) {
    customerById("shopSearch").value = "";
    renderShopResults();
    customerById("shopSearch").focus();
  }
});
customerById("changeBookingShop").addEventListener("click", () => {
  setCustomerSection("findShop");
  customerById("shopSearch").focus();
});

customerById("bookingDate").addEventListener("change", updateBookingSummary);
customerById("bookingTime").addEventListener("change", updateBookingSummary);

customerById("customerBookingForm").addEventListener("submit", async event => {
  event.preventDefault();
  const submitButton = event.submitter;
  const name = customerById("bookingName").value.trim();
  const service = selectedService();
  if (!selectedShop || !service) {
    setMessage("bookingMessage", "error", "Choose a shop and one of its services first.");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Sending request...";
  customerById("bookingConfirmation").classList.add("hidden");
  setMessage("bookingMessage", "loading", "Saving your booking request...");

  const { data: id, error } = await db.client.rpc("create_booking", {
    p_shop_id: selectedShop.id,
    p_facility: selectedShop.name,
    p_facility_address: selectedShop.address,
    p_customer: name,
    p_contact: customerById("bookingContact").value.trim(),
    p_service: service.name,
    p_date: customerById("bookingDate").value,
    p_time: customerById("bookingTime").value,
    p_notes: customerById("bookingNotes").value.trim()
  });
  submitButton.disabled = false;
  submitButton.textContent = "Request Booking";
  if (error) {
    setMessage("bookingMessage", "error", db.errorText(error));
    return;
  }

  setMessage("bookingMessage", "success", `Thanks, ${name}. ${selectedShop.name} will confirm your request.`);
  customerById("bookingConfirmationId").textContent = id;
  customerById("bookingConfirmation").classList.remove("hidden");
  customerById("customerOrderId").value = id;
  customerById("customerFullName").value = name;
  event.target.reset();
  configureBookingDate();
  renderServiceOptions();
  updateBookingSummary();
  customerById("bookingConfirmation").scrollIntoView({ behavior: "smooth", block: "nearest" });
});

customerById("verifyNewBooking").addEventListener("click", () => {
  setCustomerSection("verifyOrder");
  customerById("customerOrderId").focus();
});

customerById("customerVerificationForm").addEventListener("submit", async event => {
  event.preventDefault();
  const orderId = customerById("customerOrderId").value.trim().toUpperCase();
  const fullName = customerById("customerFullName").value.trim();
  const button = customerById("customerVerifyButton");

  button.disabled = true;
  button.textContent = "Verifying...";
  setMessage("customerVerificationMessage", "loading", "Checking order...");
  const { data, error } = await db.client.rpc("get_booking", { p_id: orderId, p_name: fullName });
  button.disabled = false;
  button.textContent = "Verify Order";

  if (error) {
    setMessage("customerVerificationMessage", "error", db.errorText(error));
    return;
  }
  if (!data) {
    setMessage("customerVerificationMessage", "error", "Order ID or full name is incorrect.");
    return;
  }
  // The order page needs the name to read the order; keep it in this tab only, never in the URL.
  try { sessionStorage.setItem("washwizOrderSession", JSON.stringify({ id: data.id, name: fullName })); } catch { /* storage unavailable */ }
  setMessage("customerVerificationMessage", "success", "Order verified. Opening your booking...");
  window.setTimeout(() => {
    window.location.href = `session.html?orderId=${encodeURIComponent(data.id)}`;
  }, 300);
});

// ---------- Live data ----------
async function loadShops() {
  const [shopRes, machineRes] = await Promise.all([
    db.client.from("shops").select("*").eq("status", "Active").order("sort_order"),
    db.client.from("machines").select("*").order("sort_order")
  ]);
  if (shopRes.error || machineRes.error) {
    customerById("shopResultsSummary").textContent = "Could not load shops. Check your connection and refresh.";
    return;
  }
  db.replaceAll(laundryShops, shopRes.data.map(shop => ({ ...shop, machines: machineRes.data.filter(machine => machine.shop_id === shop.id) })));
  const keep = selectedShop && laundryShops.find(shop => shop.id === selectedShop.id);
  if (keep) {
    selectedShop = keep;
    renderServiceOptions();
    updateBookingSummary();
    renderShopResults();
  } else {
    chooseShop(laundryShops[0]?.id);
  }
}

const refreshShops = db.debounce(loadShops, 250);
db.client.channel("customer-shops")
  .on("postgres_changes", { event: "*", schema: "public", table: "machines" }, refreshShops)
  .on("postgres_changes", { event: "*", schema: "public", table: "shops" }, refreshShops)
  .subscribe();

// A shared link like customer.html#verify-WW-XXXXXXXX opens Verify Order with the code filled in.
const sharedOrder = location.hash.match(/^#verify-(.+)$/);
if (sharedOrder) {
  customerById("customerOrderId").value = decodeURIComponent(sharedOrder[1]);
  setCustomerSection("verifyOrder");
}

configureBookingDate();
renderServiceOptions();
updateBookingSummary();
renderShopResults();
loadShops();
