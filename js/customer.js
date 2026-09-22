const mockCustomerOrder = {
  id: "LW7K4M9Q2X8R6P3",
  customer: "Juan Dela Cruz",
  status: "Processing",
  expectedCompletion: "August 30, 2026"
};

const customerBookingStorageKey = "washwizCustomerBookings";
const bookingServices = {
  "wash-fold": { name: "Wash & Fold", price: 199 },
  "wash-dry-fold": { name: "Wash, Dry & Fold", price: 299 },
  express: { name: "Express Service", price: 399 }
};

const laundryShops = [
  {
    id: "bluewater",
    name: "Bluewater Laundry",
    address: "14 Mabini Street, Poblacion",
    area: "Makati",
    distance: "1.2 km",
    hours: "Open until 9:00 PM",
    machines: [
      { id: "W-01", name: "Small Washer", load: "10 lb", status: "available", detail: "Ready now" },
      { id: "W-02", name: "Large Washer", load: "30 lb", status: "occupied", detail: "18 min left" },
      { id: "W-03", name: "XL Washer", load: "60 lb", status: "available", detail: "Ready now" },
      { id: "D-01", name: "Large Dryer", load: "30 lb", status: "available", detail: "Ready now" },
      { id: "D-02", name: "XL Dryer", load: "60 lb", status: "maintenance", detail: "Under service" }
    ]
  },
  {
    id: "spin-city",
    name: "Spin City Laundry Hub",
    address: "82 Jupiter Street, Bel-Air",
    area: "Makati",
    distance: "2.4 km",
    hours: "Open 24 hours",
    machines: [
      { id: "W-11", name: "Standard Washer", load: "20 lb", status: "available", detail: "Ready now" },
      { id: "W-12", name: "Standard Washer", load: "20 lb", status: "occupied", detail: "9 min left" },
      { id: "D-11", name: "Quick Dryer", load: "20 lb", status: "available", detail: "Ready now" },
      { id: "D-12", name: "Quick Dryer", load: "20 lb", status: "occupied", detail: "24 min left" }
    ]
  },
  {
    id: "fresh-fold",
    name: "Fresh & Fold Express",
    address: "5 Kalayaan Avenue, Pinagkaisahan",
    area: "Taguig",
    distance: "3.1 km",
    hours: "Open until 10:00 PM",
    machines: [
      { id: "W-21", name: "Standard Washer", load: "20 lb", status: "available", detail: "Ready now" },
      { id: "W-22", name: "Large Washer", load: "35 lb", status: "available", detail: "Ready now" },
      { id: "W-23", name: "Large Washer", load: "35 lb", status: "occupied", detail: "32 min left" },
      { id: "D-21", name: "Standard Dryer", load: "20 lb", status: "available", detail: "Ready now" },
      { id: "D-22", name: "Large Dryer", load: "35 lb", status: "available", detail: "Ready now" },
      { id: "D-23", name: "Large Dryer", load: "35 lb", status: "maintenance", detail: "Under service" }
    ]
  }
];

let selectedShop = laundryShops[0];
let expandedShopId = null;

const customerById = id => document.getElementById(id);
const selectedService = () => bookingServices[document.querySelector('input[name="bookingService"]:checked')?.value] || bookingServices["wash-fold"];

function readCustomerBookings() {
  try {
    const bookings = JSON.parse(localStorage.getItem(customerBookingStorageKey) || "[]");
    return Array.isArray(bookings) ? bookings : [];
  } catch {
    return [];
  }
}

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

function machineStatusLabel(status) {
  return status === "available" ? "Available" : status === "occupied" ? "Occupied" : "Maintenance";
}

function renderShopResults() {
  const query = customerById("shopSearch").value.trim().toLowerCase();
  const matches = laundryShops.filter(shop => `${shop.name} ${shop.address} ${shop.area}`.toLowerCase().includes(query));
  customerById("shopResultsSummary").textContent = `${matches.length} ${matches.length === 1 ? "shop" : "shops"} found`;
  customerById("shopResults").innerHTML = matches.length ? matches.map(shop => {
    const counts = shop.machines.reduce((result, machine) => {
      result[machine.status] = (result[machine.status] || 0) + 1;
      return result;
    }, {});
    const expanded = expandedShopId === shop.id;
    return `<article class="shop-result-card ${selectedShop.id === shop.id ? "selected" : ""}">
      <header class="shop-card-head">
        <span class="shop-card-mark" aria-hidden="true">${shop.name.charAt(0)}</span>
        <div><h3>${shop.name}</h3><p>${shop.address}</p></div>
        <span class="shop-distance">${shop.distance}</span>
      </header>
      <div class="shop-meta"><span class="shop-open"><i class="machine-status-dot available"></i>${shop.hours}</span><span>${shop.machines.length} machines</span></div>
      <div class="shop-availability" aria-label="Machine availability">
        <span class="available"><b>${counts.available || 0}</b> Available</span>
        <span class="occupied"><b>${counts.occupied || 0}</b> Occupied</span>
        <span class="maintenance"><b>${counts.maintenance || 0}</b> Maintenance</span>
      </div>
      <div class="shop-card-actions">
        <button class="secondary-btn compact" type="button" data-view-machines="${shop.id}" aria-expanded="${expanded}">${expanded ? "Hide machines" : "View machines"}</button>
        <button class="primary-btn compact" type="button" data-book-shop="${shop.id}">${selectedShop.id === shop.id ? "Book here" : "Choose shop"}</button>
      </div>
      ${expanded ? `<div class="shop-machine-list">
        <div class="machine-list-heading"><strong>Live machine status</strong><small>Updated just now</small></div>
        ${shop.machines.map(machine => `<div class="customer-machine-row">
          <span class="machine-type-mark ${machine.id.startsWith("D") ? "dryer" : "washer"}" aria-hidden="true">${machine.id.startsWith("D") ? "D" : "W"}</span>
          <div><strong>${machine.id} · ${machine.name}</strong><small>${machine.load} capacity</small></div>
          <div class="customer-machine-state ${machine.status}"><span><i class="machine-status-dot ${machine.status}"></i>${machineStatusLabel(machine.status)}</span><small>${machine.detail}</small></div>
        </div>`).join("")}
      </div>` : ""}
    </article>`;
  }).join("") : `<div class="shop-empty"><strong>No shops match your search</strong><p>Try a shop name, street, or nearby area.</p><button class="secondary-btn compact" type="button" data-clear-shop-search>Clear search</button></div>`;
}

function chooseShop(shopId, openBooking = false) {
  selectedShop = laundryShops.find(shop => shop.id === shopId) || laundryShops[0];
  customerById("selectedBookingShop").textContent = selectedShop.name;
  customerById("selectedBookingAddress").textContent = selectedShop.address;
  customerById("bookingSummaryShop").textContent = selectedShop.name;
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
  customerById("bookingSummaryService").textContent = service.name;
  customerById("bookingSummaryTotal").textContent = `PHP ${service.price.toLocaleString("en-PH")}`;
  customerById("bookingSummarySchedule").textContent = date && time
    ? `${formatBookingDate(date)} at ${time}`
    : date
      ? `${formatBookingDate(date)} - choose a time`
      : "Choose a date and time";
}

function makeBookingId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const values = new Uint8Array(8);
  if (window.crypto?.getRandomValues) window.crypto.getRandomValues(values);
  else values.forEach((_, index) => { values[index] = Math.floor(Math.random() * 256); });
  return `WW-${Array.from(values, value => alphabet[value % alphabet.length]).join("")}`;
}

function saveBooking(booking) {
  const bookings = readCustomerBookings();
  bookings.unshift(booking);
  localStorage.setItem(customerBookingStorageKey, JSON.stringify(bookings.slice(0, 50)));
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

document.querySelectorAll('input[name="bookingService"]').forEach(input => {
  input.addEventListener("change", updateBookingSummary);
});
customerById("bookingDate").addEventListener("change", updateBookingSummary);
customerById("bookingTime").addEventListener("change", updateBookingSummary);

customerById("customerBookingForm").addEventListener("submit", event => {
  event.preventDefault();
  const submitButton = event.submitter;
  const name = customerById("bookingName").value.trim();
  const contact = customerById("bookingContact").value.trim();
  const service = selectedService();
  const date = customerById("bookingDate").value;
  const time = customerById("bookingTime").value;
  const notes = customerById("bookingNotes").value.trim();

  submitButton.disabled = true;
  submitButton.textContent = "Sending request...";
  customerById("bookingConfirmation").classList.add("hidden");
  setMessage("bookingMessage", "loading", "Saving your booking request...");

  window.setTimeout(() => {
    const id = makeBookingId();
    saveBooking({
      id,
      facilityId: selectedShop.id,
      facility: selectedShop.name,
      facilityAddress: selectedShop.address,
      customer: name,
      contact,
      service: service.name,
      type: service.name,
      status: "Requested",
      date,
      time,
      notes,
      total: service.price,
      machine: "Unassigned",
      createdAt: new Date().toISOString()
    });

    setMessage("bookingMessage", "success", `Thanks, ${name}. Your request is ready for facility confirmation.`);
    customerById("bookingConfirmationId").textContent = id;
    customerById("bookingConfirmation").classList.remove("hidden");
    customerById("customerOrderId").value = id;
    customerById("customerFullName").value = name;
    submitButton.disabled = false;
    submitButton.textContent = "Request Booking";
    event.target.reset();
    configureBookingDate();
    updateBookingSummary();
    customerById("bookingConfirmation").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 500);
});

customerById("verifyNewBooking").addEventListener("click", () => {
  setCustomerSection("verifyOrder");
  customerById("customerOrderId").focus();
});

customerById("customerVerificationForm").addEventListener("submit", event => {
  event.preventDefault();
  const orderId = customerById("customerOrderId").value.trim().toUpperCase();
  const fullName = customerById("customerFullName").value.trim();
  const button = customerById("customerVerifyButton");
  const storedOrder = readCustomerBookings().find(order => order.id.toUpperCase() === orderId);
  const customerName = storedOrder?.customer || mockCustomerOrder.customer;
  const validId = storedOrder || orderId === mockCustomerOrder.id;
  const validName = customerName.localeCompare(fullName, undefined, { sensitivity: "base" }) === 0;

  button.disabled = true;
  button.textContent = "Verifying...";
  setMessage("customerVerificationMessage", "loading", "Checking order...");

  window.setTimeout(() => {
    button.disabled = false;
    button.textContent = "Verify Order";

    if (validId && validName) {
      setMessage("customerVerificationMessage", "success", "Order verified. Opening your booking...");
      window.setTimeout(() => {
        window.location.href = `session.html?orderId=${encodeURIComponent(orderId)}`;
      }, 450);
      return;
    }

    setMessage("customerVerificationMessage", "error", "Order ID or full name is incorrect.");
  }, 600);
});

configureBookingDate();
updateBookingSummary();
renderShopResults();
