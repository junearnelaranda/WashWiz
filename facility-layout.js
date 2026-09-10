"use strict";

const requestedFacilityPage = document.body.dataset.page || "dashboard";
const hasFacilitySession = sessionStorage.getItem("washwizFacilityLoggedIn") === "true";
const initialFacilityLoader = "none";
const initialFacilityLoaderClass = "is-done";

function dashboardIcon(name) {
  return `<span class="dashboard-icon icon-${name}" aria-hidden="true"></span>`;
}

const hasNeumorphicFacilityTheme = ["dashboard", "bookings", "customers", "support", "revenue", "settings"].includes(requestedFacilityPage);
const dashboardNavIcon = name => hasNeumorphicFacilityTheme ? dashboardIcon(name) : "";

if (requestedFacilityPage !== "dashboard" && !hasFacilitySession) {
  location.replace(new URL("index.html", location.href));
}

const facilityPageMarkup = `
<div id="loadingScreen" class="loading-screen ${initialFacilityLoaderClass}" data-initial-loader="${initialFacilityLoader}" role="status" aria-live="polite" aria-label="Loading screen">
      <span class="intro-white-wipe" aria-hidden="true"></span>
      <div class="loading-title-card">
        <img class="intro-title-image" src="intro.png" alt="The Lord Of The Rinse. A Smart Laundry System.">
      </div>
      <img class="splash-logo" src="logo-transparent.png" alt="WashWiz wizard washing machine logo">
      <div class="splash-brand">
        <strong>WashWiz.</strong>
        <span>Smart laundry operations for bookings, supplies, and shop performance.</span>
      </div>
      <div class="loader-machine loading-washer" aria-hidden="true">
        <div class="loader-panel">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="loader-door">
          <div class="loader-glass">
            <div class="loader-spin">
              <span class="loader-water"></span>
              <span class="loader-foam foam-one"></span>
              <span class="loader-foam foam-two"></span>
              <span class="loader-foam foam-three"></span>
              <span class="loader-bubble bubble-one"></span>
              <span class="loader-bubble bubble-two"></span>
              <span class="loader-bubble bubble-three"></span>
              <span class="loader-bubble bubble-four"></span>
              <span class="cloth cloth-one"></span>
              <span class="cloth cloth-two"></span>
              <span class="cloth cloth-three"></span>
              <span class="cloth cloth-four"></span>
            </div>
          </div>
        </div>
      </div>
      <div class="route-skeleton" aria-hidden="true">
        <aside class="route-skeleton-rail">
          <span class="skeleton-token skeleton-logo"></span>
          <span class="skeleton-token skeleton-line wide"></span>
          <span class="skeleton-token skeleton-button"></span>
          <span class="skeleton-token skeleton-nav"></span>
          <span class="skeleton-token skeleton-nav"></span>
          <span class="skeleton-token skeleton-nav short"></span>
          <span class="skeleton-token skeleton-nav"></span>
        </aside>
        <section class="route-skeleton-main">
          <div class="route-skeleton-top">
            <span class="skeleton-token skeleton-heading"></span>
            <span class="skeleton-token skeleton-circle"></span>
            <span class="skeleton-token skeleton-circle"></span>
          </div>
          <div class="route-skeleton-grid">
            <span class="skeleton-token skeleton-card"></span>
            <span class="skeleton-token skeleton-card"></span>
            <span class="skeleton-token skeleton-card"></span>
            <span class="skeleton-token skeleton-card"></span>
          </div>
          <span class="skeleton-token skeleton-panel"></span>
        </section>
      </div>
    </div>

    <div id="auth" class="auth-screen">
      <section class="auth-card clay">
        <div class="auth-brand"><img src="logo-transparent.png" alt="WashWiz logo"><div class="portal-brand"><strong>WashWiz</strong></div></div>
        <div class="tabs" role="tablist" aria-label="Authentication">
          <button class="tab active" data-auth-tab="login">Login</button>
          <button class="tab" data-auth-tab="register">Register</button>
        </div>

        <form id="loginForm" class="auth-form">
          <label>Facility email<input id="facilityLoginEmail" type="email" value="facility@bluewater.test" required></label>
          <label>Password<input type="password" value="washwiz" required></label>
          <button class="primary-btn" type="submit">Enter Facility Dashboard</button>
        </form>

        <form id="registerForm" class="auth-form hidden">
          <label>Facility name<input id="facilityName" type="text" value="Bluewater Laundry" required></label>
          <label>Facility email<input id="facilityEmail" type="email" value="facility@bluewater.test" required></label>
          <label>Password<input type="password" value="washwiz" required></label>
          <button class="primary-btn" type="submit">Create Facility</button>
        </form>

        <a class="secondary-btn portal-link" href="customer.html">Customer Page</a>
      </section>
    </div>
    <div id="app" class="app-shell hidden">
      <aside class="sidebar clay">
        <div class="logo-mark logo-image"><img src="logo-transparent.png" alt="WashWiz logo"></div>
        <div>
          <strong>WashWiz</strong>
        </div>
          <button class="primary-btn nav-book" data-route="machines">${hasNeumorphicFacilityTheme ? dashboardIcon("plus") : '<span aria-hidden="true">+</span>'} New Booking</button>
          <nav>
          <a class="nav-link active" href="index.html" data-page-link="dashboard" aria-current="page">${dashboardNavIcon("layout-dashboard")}Dashboard</a>
          <a class="nav-link" href="bookings.html" data-page-link="bookings">${dashboardNavIcon("calendar-days")}Bookings</a>
          <a class="nav-link" href="details.html" data-page-link="customers">${dashboardNavIcon("users")}Customers</a>
          <a class="nav-link" href="revenue.html" data-page-link="revenue">${dashboardNavIcon("dollar-sign")}Revenue</a>
          <a class="nav-link live-support-link" href="support.html" data-page-link="support">${dashboardNavIcon("message-circle")}Live Support <span id="supportBadge">3</span></a>
          <a class="nav-link" href="settings.html" data-page-link="settings">${dashboardNavIcon("settings")}Settings</a>
        </nav>
        ${["dashboard", "settings"].includes(requestedFacilityPage) ? `
        <button class="dashboard-facility" type="button" data-dashboard-dialog="profile" aria-label="View Bluewater Laundry's profile" title="Facility profile">
          <span class="facility-initials">BW</span>
          <span class="facility-copy"><strong>Bluewater Laundry</strong><small>Facility account</small></span>
          ${dashboardIcon("user-round")}
        </button>` : ""}
        ${requestedFacilityPage === "bookings" ? `
        <div class="bookings-hub">
          <span class="hub-initials">BW</span>
          <div><strong>Bluewater Hub</strong><small id="bookingHubStatus">Units online</small></div>
        </div>` : ""}
        ${requestedFacilityPage === "customers" ? `
        <div class="customers-station">
          <div><span>Station Status</span><strong class="station-online">Online</strong></div>
          <small id="customerStationStatus">Checking machines</small>
        </div>` : ""}
        ${requestedFacilityPage === "support" ? `
        <div class="support-station">
          <div><span>Kiosk Server</span><strong class="station-online">Online</strong></div>
          <small>Customer chat is connected</small>
        </div>` : ""}
        ${requestedFacilityPage === "revenue" ? `
        <div class="revenue-station">
          <div><span>Reports</span><strong class="station-online">Synced</strong></div>
          <small id="revenueStationStatus">Updated just now</small>
        </div>` : ""}
      </aside>
      ${hasNeumorphicFacilityTheme ? '<button class="dashboard-menu-backdrop" type="button" tabindex="-1" aria-label="Close navigation"></button>' : ""}

      <main class="main">
        <header class="topbar">
          <button class="icon-btn mobile-menu" id="menuToggle" aria-label="Toggle menu" title="Navigation">${hasNeumorphicFacilityTheme ? dashboardIcon("menu") : '<span aria-hidden="true">=</span>'}</button>
          <div>
            <p class="eyebrow" id="routeEyebrow">Today</p>
            <h2 id="routeTitle">Dashboard</h2>
          </div>
          <div class="top-actions">
            <button class="icon-btn" aria-label="Search" title="${requestedFacilityPage === "customers" ? "Search customers" : requestedFacilityPage === "bookings" ? "Search bookings" : requestedFacilityPage === "support" ? "Search chats" : requestedFacilityPage === "revenue" ? "Search transactions" : "Search machines"}" data-dashboard-dialog="search">${hasNeumorphicFacilityTheme ? dashboardIcon("search") : '<span aria-hidden="true">S</span>'}</button>
            <button class="icon-btn dashboard-alert-button" aria-label="Notifications" title="System alerts" data-dashboard-dialog="alerts">${hasNeumorphicFacilityTheme ? dashboardIcon("bell") : '<span aria-hidden="true">!</span>'}</button>
            <button class="avatar" aria-label="Facility profile" title="Facility profile" data-dashboard-dialog="profile">${hasNeumorphicFacilityTheme ? "BW" : "BW"}</button>
            <button class="secondary-btn compact logout-btn" type="button" id="logoutButton">${hasNeumorphicFacilityTheme ? dashboardIcon("log-out") : ""}Log Out</button>
          </div>
        </header>

        <section id="settings" class="view"></section>
        <section id="dashboard" class="view active-view">
          <div class="metrics-grid" id="metrics"></div>
          <div class="section-head">
            <div>
              <p class="eyebrow">Live floor</p>
              <h3>Machine Status</h3>
            </div>
            <div class="segmented" id="machineFilter">
              <button class="active" data-filter="all" aria-pressed="true">All</button>
              <button data-filter="washer" aria-pressed="false">Washers</button>
              <button data-filter="dryer" aria-pressed="false">Dryers</button>
            </div>
          </div>
          <div class="machine-grid" id="dashboardMachines"></div>
        </section>

        <section id="machines" class="view">
          <div class="booking-layout">
            <div>
              <div class="section-head">
                <div>
                  <p class="eyebrow">Step 1</p>
                  <h3>Select Machine</h3>
                </div>
                <div class="segmented" id="bookingMachineFilter">
                  <button class="active" data-filter="all">All</button>
                  <button data-filter="small">Small</button>
                  <button data-filter="large">Large</button>
                  <button data-filter="xl">XLarge</button>
                </div>
              </div>
              <div class="machine-grid" id="bookingMachines"></div>
            </div>
            <aside class="summary clay">
              <p class="eyebrow">Current booking</p>
              <h3 id="selectedMachineTitle">Choose a machine</h3>
              <p id="selectedMachineMeta">Available washers and dryers are ready to book.</p>
              <label>Customer name<input id="customerName" type="text" placeholder="Walk-in Customer"></label>
              <label>Contact<input id="customerContact" type="text" placeholder="0917 555 0123"></label>
              <button class="primary-btn" id="continueSupplies" disabled>Continue</button>
            </aside>
          </div>
        </section>

        <section id="supplies" class="view">
          <div class="booking-layout">
            <div>
              <p class="eyebrow">Step 2</p>
              <h3>Enhance Your Wash</h3>
              <div class="supplies-list" id="suppliesList"></div>
            </div>
            <aside class="summary clay">
              <p class="eyebrow">Order summary</p>
              <div id="orderSummary"></div>
              <button class="primary-btn" id="confirmBooking">Confirm & Pay</button>
            </aside>
          </div>
        </section>

        <section id="confirmed" class="view">
          <div class="confirm-card clay">
            <div class="success-orb">OK</div>
            <p class="eyebrow">Booking confirmed</p>
            <h3 id="confirmTitle">Machine booked</h3>
            <p id="confirmDetails"></p>
            <div class="confirm-actions">
              <button class="primary-btn" data-route="machines">New Booking</button>
              <a class="secondary-btn" href="index.html">Back to Dashboard</a>
            </div>
          </div>
        </section>

        <section id="bookings" class="view">
          ${requestedFacilityPage === "bookings" ? `
          <div class="bookings-toolbar">
            <label class="bookings-search">
              ${dashboardIcon("search")}
              <input id="bookingSearch" type="search" aria-label="Search bookings" placeholder="Search booking, customer, machine..." autocomplete="off">
            </label>
            <div class="bookings-filters" role="group" aria-label="Booking status">
              <button type="button" class="active" data-booking-status="all" aria-pressed="true">All <span data-booking-count="all">(0)</span></button>
              <button type="button" data-booking-status="In Cycle" aria-pressed="false">In Cycle <span data-booking-count="In Cycle">(0)</span></button>
              <button type="button" data-booking-status="Drying" aria-pressed="false">Drying <span data-booking-count="Drying">(0)</span></button>
              <button type="button" data-booking-status="Completed" aria-pressed="false">Completed <span data-booking-count="Completed">(0)</span></button>
              <button type="button" class="hidden" data-booking-status="Paid" aria-pressed="false">Paid <span data-booking-count="Paid">(0)</span></button>
            </div>
          </div>
          <div class="bookings-register">
            <div class="bookings-table-scroll" role="region" aria-label="Bookings" tabindex="0">
              <table class="bookings-table" aria-label="Bookings register">
                <thead><tr><th scope="col">Customer</th><th scope="col">Machine</th><th scope="col">Status</th><th scope="col">Time</th><th scope="col">Total</th><th scope="col">Actions</th></tr></thead>
                <tbody id="bookingsTable"></tbody>
              </table>
            </div>
            <footer class="bookings-footer">
              <p id="bookingSummary" role="status"></p>
              <nav id="bookingPagination" class="booking-pagination" aria-label="Bookings pagination"></nav>
            </footer>
          </div>` : `
          <div class="table-card clay">
            <table>
              <thead><tr><th>Customer</th><th>Machine</th><th>Status</th><th>Time</th><th>Total</th></tr></thead>
              <tbody id="bookingsTable"></tbody>
            </table>
          </div>`}
        </section>

        <section id="customers" class="view">
          ${requestedFacilityPage === "customers" ? `
          <div class="customers-toolbar">
            <label class="customers-search">
              ${dashboardIcon("search")}
              <input id="customerSearch" type="search" aria-label="Search customers" placeholder="Search customers..." autocomplete="off">
            </label>
            <div class="customers-tools">
              <button class="customer-button" id="customerFilterButton" type="button" aria-haspopup="dialog">${dashboardIcon("funnel")}Filter <span id="customerFilterCount" class="hidden"></span></button>
              <button class="customer-button" id="customerExportButton" type="button" title="Export filtered customers as CSV">${dashboardIcon("upload")}Export</button>
            </div>
          </div>
          <div class="customers-register">
            <div class="customers-table-scroll" role="region" aria-label="Customer records" tabindex="0">
              <table class="customers-table" aria-label="Customers">
                <thead><tr><th scope="col">Customer Name</th><th scope="col">Contact</th><th scope="col">Total Bookings</th><th scope="col">Last Visit</th><th scope="col">Spend</th><th scope="col">Action</th></tr></thead>
                <tbody id="customersTable"></tbody>
              </table>
            </div>
            <footer class="customers-footer">
              <p id="customerSummary" role="status"></p>
              <nav id="customerPagination" class="customer-pagination" aria-label="Customer pagination"></nav>
            </footer>
          </div>` : `
          <div class="section-head page-tools">
            <input id="customerSearch" class="search-input" type="search" placeholder="Search customers">
          </div>
          <div class="table-card clay">
            <table>
              <thead><tr><th>Customer Name</th><th>Contact</th><th>Total Bookings</th><th>Last Visit</th><th>Spend</th><th>Action</th></tr></thead>
              <tbody id="customersTable"></tbody>
            </table>
          </div>`}
        </section>

        <section id="support" class="view">
          <div class="support-layout">
            <aside class="support-inbox clay">
              <input id="supportSearch" class="search-input" type="search" placeholder="Search chats">
              <div class="segmented support-filters" id="supportFilter">
                <button class="active" type="button" data-support-filter="all">All</button>
                <button type="button" data-support-filter="active">Active</button>
                <button type="button" data-support-filter="pending">Pending</button>
              </div>
              <div class="support-thread-list" id="supportThreads"></div>
            </aside>

            <article class="support-chat clay">
              <header class="support-chat-head">
                <div>
                  <p class="eyebrow">Order Support</p>
                  <h3 id="supportCustomerName">Customer Chat</h3>
                  <p id="supportOrderLabel"></p>
                </div>
                <span class="status-pill success" id="supportStatusLabel">Live Active</span>
              </header>

              <div class="support-order-strip" id="supportOrderStrip"></div>
              <div class="support-messages" id="supportMessages"></div>

              <div class="quick-replies" id="quickReplies" aria-label="Quick replies">
                <button type="button" data-quick-reply="Your wash is now in progress.">Wash in progress</button>
                <button type="button" data-quick-reply="We added your detergent preference to the order.">Preference noted</button>
                <button type="button" data-quick-reply="Your order is ready for pickup.">Ready for pickup</button>
              </div>

              <form id="supportReplyForm" class="support-composer">
                <input id="supportReplyInput" type="text" placeholder="Reply to customer">
                <button class="primary-btn compact" type="submit">Send</button>
              </form>
              <button class="secondary-btn compact support-resolve" type="button" id="resolveSupportThread">Mark Resolved</button>
            </article>
          </div>
        </section>

        <section id="revenue" class="view">
          <div class="section-head revenue-toolbar">
            <div>
              <p class="eyebrow">Revenue & Analytics</p>
              <h3>Overview of shop performance and machine utilization.</h3>
            </div>
            <div class="revenue-actions">
              <button class="secondary-btn compact revenue-export" id="revenueExportButton" type="button">${dashboardIcon("download")}Export</button>
              <button class="secondary-btn compact revenue-period" id="revenuePeriodButton" type="button" aria-haspopup="dialog" aria-expanded="false"><span id="revenuePeriodLabel">Last 30 Days</span>${dashboardIcon("chevron-right")}</button>
            </div>
          </div>
          <div class="metrics-grid" id="revenueMetrics"></div>
          <div class="analytics-grid">
            <div class="chart-card clay">
              <div class="section-head tight">
                <h3>Weekly Revenue</h3>
                <button class="icon-btn mini" type="button" aria-label="Weekly revenue options" title="Weekly revenue options">...</button>
              </div>
              <div class="bar-chart" id="barChart"></div>
            </div>
            <div class="chart-card clay">
              <div class="section-head tight">
                <h3>Usage by Type</h3>
                <button class="icon-btn mini" type="button" aria-label="Usage options" title="Usage options">...</button>
              </div>
              <div class="usage-list" id="usageList"></div>
            </div>
          </div>
          <div class="section-head transactions-head">
            <div>
              <p class="eyebrow">Ledger</p>
              <h3>Recent Transactions</h3>
            </div>
            <button class="secondary-btn compact" id="revenueViewAllButton" type="button">View All</button>
          </div>
          <div class="table-card clay revenue-register">
            <div class="revenue-table-scroll" role="region" aria-label="Recent transactions" tabindex="0">
              <table>
                <thead><tr><th>Date & Time</th><th>Customer / Machine</th><th>Payment Method</th><th>Amount</th></tr></thead>
                <tbody id="transactionsTable"></tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>

    <div id="customerAccessModal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="customerAccessTitle">
      <div class="modal-backdrop" data-close-modal></div>
      <article class="customer-access-card modal-card clay">
        <button class="icon-btn modal-close" type="button" data-close-modal aria-label="Close customer access details">x</button>
        <div>
          <p class="eyebrow">Customer Access</p>
          <h3 id="customerAccessTitle">Share Order Verification</h3>
          <p class="modal-subtitle" id="customerAccessCustomer">Customer order portal access</p>
        </div>
        <div class="admin-access-body">
          <div class="admin-order-id">
            <span>Order ID</span>
            <strong>LW7K4M9Q2X8R6P3</strong>
          </div>
          <div class="qr-placeholder" aria-label="QR code placeholder">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Scan to view customer order</p>
        </div>
        <div class="access-actions">
          <button class="secondary-btn compact" type="button" data-copy="LW7K4M9Q2X8R6P3">Copy Order ID</button>
          <button class="secondary-btn compact" type="button" data-copy="https://example.com/verify/LW7K4M9Q2X8R6P3">Copy Link</button>
          <button class="primary-btn compact" type="button" data-print-qr>Print QR</button>
        </div>
        <p class="access-message" aria-live="polite"></p>
      </article>
    </div>
`;

document.body.insertAdjacentHTML("afterbegin", facilityPageMarkup);
window.WashWizSettings.apply();
