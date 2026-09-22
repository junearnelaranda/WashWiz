"use strict";

(() => {
  const pageSize = 5;
  let currentPage = 1;
  let activeFilter = "all";
  const dialog = document.createElement("dialog");
  dialog.id = "customerPageDialog";
  dialog.className = "dashboard-dialog customer-dialog";
  dialog.setAttribute("aria-labelledby", "customerDialogTitle");
  document.body.append(dialog);

  const filterDialog = document.createElement("dialog");
  filterDialog.id = "customerFilterDialog";
  filterDialog.className = "dashboard-dialog customer-filter-dialog";
  filterDialog.setAttribute("aria-labelledby", "customerFilterTitle");
  document.body.append(filterDialog);

  function escapeText(value) {
    const span = document.createElement("span");
    span.textContent = String(value ?? "");
    return span.innerHTML;
  }

  function profileLabel(customer) {
    const labels = {
      "Maya Santos": "Registered App User",
      "Walk-in Customer": "Counter Order",
      "Noah Reyes": "VIP Tier"
    };
    return labels[customer.name] || (customer.count > 1 ? "Returning Customer" : "Standard Member");
  }

  function initials(name) {
    return supportInitials(name);
  }

  function customerCell(customer) {
    return `<div class="customer-cell"><span class="customer-initials" aria-hidden="true">${escapeText(initials(customer.name))}</span><div><strong>${escapeText(customer.name)}</strong><small>${escapeText(profileLabel(customer))}</small></div></div>`;
  }

  function matchingCustomers() {
    const query = byId("customerSearch").value.trim().toLowerCase();
    return customers().filter(customer => {
      const matchesQuery = `${customer.name} ${customer.contact} ${profileLabel(customer)}`.toLowerCase().includes(query);
      const matchesFilter = activeFilter === "all" ||
        (activeFilter === "repeat" && customer.count > 1) ||
        (activeFilter === "high-value" && customer.spend >= 300);
      return matchesQuery && matchesFilter;
    });
  }

  function renderPagination(totalPages) {
    const pages = [...new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1])]
      .filter(page => page > 0 && page <= totalPages)
      .sort((a, b) => a - b);
    let previous = 0;
    const buttons = pages.map(page => {
      const gap = page > previous + 1 ? '<span class="pagination-gap" aria-hidden="true">...</span>' : "";
      previous = page;
      return `${gap}<button type="button" data-customer-page="${page}" aria-label="Page ${page}" ${page === currentPage ? 'aria-current="page"' : ""}>${page}</button>`;
    }).join("");
    byId("customerPagination").innerHTML = `<button type="button" data-customer-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} aria-label="Previous page" title="Previous page">${dashboardIcon("chevron-left")}</button>${buttons}<button type="button" data-customer-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""} aria-label="Next page" title="Next page">${dashboardIcon("chevron-right")}</button>`;
  }

  window.renderCustomersPage = () => {
    const filtered = matchingCustomers();
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * pageSize;
    const visible = filtered.slice(start, start + pageSize);
    byId("customersTable").innerHTML = visible.length ? visible.map(customer => `
      <tr>
        <td>${customerCell(customer)}</td>
        <td class="customer-contact">${escapeText(customer.contact)}</td>
        <td><span class="customer-count">${customer.count}</span></td>
        <td class="customer-last">${escapeText(customer.last)}</td>
        <td class="customer-spend">${escapeText(money(customer.spend))}</td>
        <td><button class="customer-action" type="button" data-customer-profile="${escapeText(customer.name)}">See Details</button></td>
      </tr>`).join("") : `<tr><td class="customer-empty" colspan="6"><strong>${customers().length ? "No matching customers" : "No customers yet"}</strong><button class="customer-action" type="button" data-reset-customers>Clear filters</button></td></tr>`;
    byId("customerSummary").textContent = filtered.length ? `Showing ${start + 1}-${start + visible.length} of ${filtered.length} customers` : "Showing 0 customers";
    byId("customerStationStatus").textContent = `${machines.filter(machine => machine.status !== "maintenance").length}/${machines.length} washers active`;
    byId("customerFilterCount").textContent = activeFilter === "all" ? "" : "1";
    byId("customerFilterCount").classList.toggle("hidden", activeFilter === "all");
    renderPagination(totalPages);
  };

  function customerHistory(customer) {
    return state.bookings.filter(booking => booking.customer === customer.name).map(booking => `<li><span><strong>${escapeText(booking.machine)}</strong> / ${escapeText(booking.type)}<br>${escapeText(booking.time)}</span><span>${escapeText(money(booking.total))}</span></li>`).join("");
  }

  function openCustomerDetails(name) {
    const customer = customers().find(item => item.name === name);
    if (!customer) return;
    dialog.className = "dashboard-dialog customer-dialog";
    dialog.innerHTML = `<div class="dashboard-dialog-head"><h3 id="customerDialogTitle">Customer details</h3><button class="icon-btn" type="button" data-close-customer-dialog aria-label="Close dialog" title="Close">${dashboardIcon("x")}</button></div>
      <div class="customer-dialog-summary"><span class="customer-profile-badge">${escapeText(initials(customer.name))}</span><div class="customer-profile-copy"><strong>${escapeText(customer.name)}</strong><small>${escapeText(profileLabel(customer))} / ${escapeText(customer.contact)}</small></div></div>
      <div class="customer-detail-grid"><div class="customer-detail-stat"><span>Total bookings</span><strong>${customer.count}</strong></div><div class="customer-detail-stat"><span>Total spend</span><strong>${escapeText(money(customer.spend))}</strong></div><div class="customer-detail-stat"><span>Last visit</span><strong>${escapeText(customer.last)}</strong></div><div class="customer-detail-stat"><span>Contact</span><strong>${escapeText(customer.contact)}</strong></div></div>
      <h4 class="customer-history-title">Booking history</h4><ul class="customer-history">${customerHistory(customer) || '<li><span>No booking history yet.</span></li>'}</ul>
      <div class="customer-dialog-actions"><button class="customer-button" type="button" data-customer-message>${dashboardIcon("message-circle")}Open support</button></div>`;
    dialog.showModal();
  }

  function openFilterDialog() {
    const options = [
      ["all", "All customers", customers().length],
      ["repeat", "Repeat customers", customers().filter(customer => customer.count > 1).length],
      ["high-value", "High value / PHP 300+", customers().filter(customer => customer.spend >= 300).length]
    ];
    filterDialog.innerHTML = `<div class="dashboard-dialog-head"><h3 id="customerFilterTitle">Filter customers</h3><button class="icon-btn" type="button" data-close-filter-dialog aria-label="Close dialog" title="Close">${dashboardIcon("x")}</button></div><div class="customer-filter-options">${options.map(([value, label, count]) => `<button type="button" class="customer-filter-option ${value === activeFilter ? "active" : ""}" data-customer-filter="${value}"><span>${label}</span><span>${count}</span></button>`).join("")}</div>`;
    filterDialog.showModal();
  }

  function exportCustomers() {
    const rows = [["Customer Name", "Contact", "Total Bookings", "Last Visit", "Spend"], ...matchingCustomers().map(customer => [customer.name, customer.contact, customer.count, customer.last, money(customer.spend)])];
    const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "washwiz-customers.csv";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function closeMenu() {
    document.querySelector(".sidebar").classList.remove("open");
    byId("menuToggle").setAttribute("aria-expanded", "false");
  }

  byId("customerSearch").addEventListener("input", () => { currentPage = 1; window.renderCustomersPage(); });
  byId("customerFilterButton").addEventListener("click", openFilterDialog);
  byId("customerExportButton").addEventListener("click", exportCustomers);

  document.addEventListener("click", event => {
    const filter = event.target.closest("[data-customer-filter]");
    if (filter) {
      activeFilter = filter.dataset.customerFilter;
      currentPage = 1;
      filterDialog.close();
      window.renderCustomersPage();
    }
    const page = event.target.closest("[data-customer-page]");
    if (page && !page.disabled) {
      currentPage = Number(page.dataset.customerPage);
      window.renderCustomersPage();
      byId("customerPagination").querySelector('[aria-current="page"]').focus({ preventScroll: true });
    }
    const profile = event.target.closest("[data-customer-profile]");
    if (profile) openCustomerDetails(profile.dataset.customerProfile);
    if (event.target.closest("[data-reset-customers]")) {
      byId("customerSearch").value = "";
      activeFilter = "all";
      currentPage = 1;
      window.renderCustomersPage();
    }
    if (event.target.closest("[data-close-customer-dialog]")) dialog.close();
    if (event.target.closest("[data-close-filter-dialog]")) filterDialog.close();
    if (event.target.closest("[data-customer-message]")) {
      dialog.close();
      transitionRoute("support");
    }

    const action = event.target.closest("[data-dashboard-dialog]")?.dataset.dashboardDialog;
    if (action === "search") { setRoute("customers"); byId("customerSearch").focus(); }
    if (action === "alerts") {
      const serviceMachines = machines.filter(machine => machine.status === "maintenance");
      openCustomerDetails(customers()[0]?.name || "");
      if (serviceMachines.length) {
        dialog.innerHTML = `<div class="dashboard-dialog-head"><h3 id="customerDialogTitle">System alerts</h3><button class="icon-btn" type="button" data-close-customer-dialog aria-label="Close dialog" title="Close">${dashboardIcon("x")}</button></div>${serviceMachines.map(machine => `<div class="booking-alert">${dashboardIcon("triangle-alert")}<div><strong>${escapeText(machine.id)} / ${escapeText(machine.label)}</strong><small>${escapeText(machine.eta)}</small></div></div>`).join("")}`;
      }
    }
    if (action === "profile") {
      dialog.innerHTML = `<div class="dashboard-dialog-head"><h3 id="customerDialogTitle">Facility profile</h3><button class="icon-btn" type="button" data-close-customer-dialog aria-label="Close dialog" title="Close">${dashboardIcon("x")}</button></div>${window.WashWizSettings.profileMarkup()}`;
      dialog.showModal();
    }
    if (event.target.closest(".dashboard-menu-backdrop")) closeMenu();
    if (event.target.closest("#menuToggle, [data-route], [data-page-link], [data-dashboard-dialog]")) byId("menuToggle").setAttribute("aria-expanded", String(document.querySelector(".sidebar").classList.contains("open")));
  });

  [dialog, filterDialog].forEach(target => target.addEventListener("click", event => {
    if (event.target !== target) return;
    const bounds = target.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) target.close();
  }));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (dialog.open) { event.preventDefault(); dialog.close(); }
      if (filterDialog.open) { event.preventDefault(); filterDialog.close(); }
      closeMenu();
    }
  });
  byId("menuToggle").setAttribute("aria-expanded", "false");
  window.renderCustomersPage();
})();
