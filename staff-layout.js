"use strict";

const requestedStaffPage = document.body.dataset.page || "dashboard";
const hasStaffSession = sessionStorage.getItem("washwizStaffLoggedIn") === "true";

if (requestedStaffPage !== "dashboard" && !hasStaffSession) {
  location.replace(new URL("index.html", location.href));
}

const staffPageMarkup = `
<div id="loadingScreen" class="loading-screen is-title" role="status" aria-live="polite" aria-label="Loading screen">
      <span class="intro-white-wipe" aria-hidden="true"></span>
      <div class="loading-title-card">
        <img class="intro-title-image" src="intro.png" alt="The Lord Of The Rinse. A Smart Laundry System.">
      </div>
      <img class="splash-logo" src="tempLogo.png" alt="WashWiz wizard washing machine logo">
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
    </div>

    <div id="auth" class="auth-screen">
      <section class="auth-card clay">
        <div class="tabs" role="tablist" aria-label="Authentication">
          <button class="tab active" data-auth-tab="login">Login</button>
          <button class="tab" data-auth-tab="register">Register</button>
        </div>

        <form id="loginForm" class="auth-form">
          <label>Email<input type="email" value="manager@washwiz.test" required></label>
          <label>Password<input type="password" value="washwiz" required></label>
          <button class="primary-btn" type="submit">Enter Dashboard</button>
        </form>

        <form id="registerForm" class="auth-form hidden">
          <label>Facility name<input type="text" value="Bluewater Laundry" required></label>
          <label>Owner email<input type="email" value="owner@bluewater.test" required></label>
          <label>Password<input type="password" value="washwiz" required></label>
          <button class="primary-btn" type="submit">Create Facility</button>
        </form>

        <a class="secondary-btn portal-link" href="customer.html">Customer Page</a>
      </section>
    </div>
    <div id="app" class="app-shell hidden">
      <aside class="sidebar clay">
        <div class="logo-mark logo-image"><img src="tempLogo.png" alt="WashWiz logo"></div>
        <div>
          <strong>WashWiz</strong>
          <small>Bluewater Laundry</small>
        </div>
          <button class="primary-btn nav-book" data-route="machines"><span aria-hidden="true">+</span> New Booking</button>
          <nav>
          <a class="nav-link active" href="index.html" data-page-link="dashboard" aria-current="page">Dashboard</a>
          <a class="nav-link" href="bookings.html" data-page-link="bookings">Bookings</a>
          <a class="nav-link" href="details.html" data-page-link="customers">Customers</a>
          <a class="nav-link" href="revenue.html" data-page-link="revenue">Revenue</a>
          <a class="nav-link live-support-link" href="support.html" data-page-link="support">Live Support <span id="supportBadge">3</span></a>
        </nav>
      </aside>

      <main class="main">
        <header class="topbar">
          <button class="icon-btn mobile-menu" id="menuToggle" aria-label="Toggle menu"><span aria-hidden="true">=</span></button>
          <div>
            <p class="eyebrow" id="routeEyebrow">Today</p>
            <h2 id="routeTitle">Dashboard</h2>
          </div>
          <div class="top-actions">
            <button class="icon-btn" aria-label="Search"><span aria-hidden="true">S</span></button>
            <button class="icon-btn" aria-label="Notifications"><span aria-hidden="true">!</span></button>
            <button class="avatar" aria-label="Operator profile">AM</button>
            <button class="secondary-btn compact logout-btn" type="button" id="logoutButton">Log Out</button>
          </div>
        </header>

        <section id="dashboard" class="view active-view">
          <div class="metrics-grid" id="metrics"></div>
          <div class="section-head">
            <div>
              <p class="eyebrow">Live floor</p>
              <h3>Machine Status</h3>
            </div>
            <div class="segmented" id="machineFilter">
              <button class="active" data-filter="all">All</button>
              <button data-filter="washer">Washers</button>
              <button data-filter="dryer">Dryers</button>
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
          <div class="table-card clay">
            <table>
              <thead><tr><th>Customer</th><th>Machine</th><th>Status</th><th>Time</th><th>Total</th></tr></thead>
              <tbody id="bookingsTable"></tbody>
            </table>
          </div>
        </section>

        <section id="customers" class="view">
          <div class="section-head page-tools">
            <input id="customerSearch" class="search-input" type="search" placeholder="Search customers">
          </div>
          <div class="table-card clay">
            <table>
              <thead><tr><th>Customer Name</th><th>Contact</th><th>Total Bookings</th><th>Last Visit</th><th>Spend</th><th>Action</th></tr></thead>
              <tbody id="customersTable"></tbody>
            </table>
          </div>
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
              <button class="secondary-btn compact" type="button">Export</button>
              <button class="secondary-btn compact" type="button">Last 30 Days</button>
            </div>
          </div>
          <div class="metrics-grid" id="revenueMetrics"></div>
          <div class="analytics-grid">
            <div class="chart-card clay">
              <div class="section-head tight">
                <h3>Weekly Revenue</h3>
                <button class="icon-btn mini" type="button" aria-label="Weekly revenue options">...</button>
              </div>
              <div class="bar-chart" id="barChart"></div>
            </div>
            <div class="chart-card clay">
              <div class="section-head tight">
                <h3>Usage by Type</h3>
                <button class="icon-btn mini" type="button" aria-label="Usage options">...</button>
              </div>
              <div class="usage-list" id="usageList"></div>
            </div>
          </div>
          <div class="section-head transactions-head">
            <div>
              <p class="eyebrow">Ledger</p>
              <h3>Recent Transactions</h3>
            </div>
            <button class="secondary-btn compact" type="button">View All</button>
          </div>
          <div class="table-card clay">
            <table>
              <thead><tr><th>Date & Time</th><th>Customer / Machine</th><th>Payment Method</th><th>Amount</th></tr></thead>
              <tbody id="transactionsTable"></tbody>
            </table>
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

document.body.insertAdjacentHTML("afterbegin", staffPageMarkup);
