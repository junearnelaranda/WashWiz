"use strict";

(() => {
  const pageSize = 8;
  let currentPage = 1;
  let activeStatus = "all";
  let selectedBooking = null;
  const dialog = document.createElement("dialog");
  dialog.id = "bookingDialog";
  dialog.className = "dashboard-dialog booking-dialog";
  dialog.setAttribute("aria-labelledby", "bookingDialogTitle");
  document.body.append(dialog);

  function text(value) {
    const span = document.createElement("span");
    span.textContent = String(value ?? "");
    return span.innerHTML;
  }

  function statusBadge(status) {
    const classes = { Requested: "requested", "In Cycle": "in-cycle", Drying: "drying", Completed: "completed", Paid: "paid" };
    return `<span class="booking-status ${classes[status] || ""}">${text(status)}</span>`;
  }

  function customerCell(booking) {
    return `<div class="booking-customer"><span class="booking-initials" aria-hidden="true">${text(supportInitials(booking.customer))}</span><div><strong>${text(booking.customer)}</strong><small>${text(booking.contact)}</small></div></div>`;
  }

  function renderPagination(totalPages) {
    const visiblePages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    let previous = 0;
    const numbers = [...visiblePages].filter(page => page > 0 && page <= totalPages).sort((a, b) => a - b).map(page => {
      const gap = page > previous + 1 ? '<span class="pagination-gap" aria-hidden="true">...</span>' : "";
      previous = page;
      return `${gap}<button type="button" data-booking-page="${page}" aria-label="Page ${page}" ${page === currentPage ? 'aria-current="page"' : ""}>${page}</button>`;
    }).join("");
    byId("bookingPagination").innerHTML = `<button type="button" data-booking-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} aria-label="Previous page" title="Previous page">${dashboardIcon("chevron-left")}</button>${numbers}<button type="button" data-booking-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""} aria-label="Next page" title="Next page">${dashboardIcon("chevron-right")}</button>`;
  }

  window.renderBookingsPage = () => {
    const query = byId("bookingSearch").value.trim().toLowerCase();
    const searched = state.bookings.map((booking, index) => ({ booking, index })).filter(({ booking }) =>
      [booking.customer, booking.contact, booking.facility, booking.machine, booking.type, booking.status, booking.time].join(" ").toLowerCase().includes(query)
    );
    document.querySelectorAll("[data-booking-status]").forEach(button => {
      const status = button.dataset.bookingStatus;
      const count = status === "all" ? searched.length : searched.filter(({ booking }) => booking.status === status).length;
      button.querySelector("[data-booking-count]").textContent = `(${count})`;
      button.classList.toggle("active", status === activeStatus);
      button.setAttribute("aria-pressed", String(status === activeStatus));
      if (status === "Paid") button.classList.toggle("hidden", !state.bookings.some(booking => booking.status === "Paid") && activeStatus !== "Paid");
    });
    const filtered = searched.filter(({ booking }) => activeStatus === "all" || booking.status === activeStatus);
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * pageSize;
    const visible = filtered.slice(start, start + pageSize);
    byId("bookingsTable").innerHTML = visible.length ? visible.map(({ booking, index }) => `
      <tr>
        <td>${customerCell(booking)}</td>
        <td><span class="booking-machine">${text(booking.machine)}</span><small>${text(booking.type)}</small></td>
        <td>${statusBadge(booking.status)}</td>
        <td class="booking-time">${text(booking.time)}</td>
        <td class="booking-total">${text(money(booking.total))}</td>
        <td><div class="booking-row-actions"><button class="booking-action" type="button" data-booking-details="${index}">Details</button><button class="booking-action icon-only" type="button" data-booking-receipt="${index}" aria-label="Booking receipt" title="Receipt">${dashboardIcon("receipt-text")}</button></div></td>
      </tr>`).join("") : `<tr><td class="booking-empty" colspan="6"><strong>${state.bookings.length ? "No matching bookings" : "No bookings yet"}</strong>${query || activeStatus !== "all" ? '<button class="booking-action" type="button" data-reset-bookings>Clear filters</button>' : '<button class="booking-action" type="button" data-route="machines">New Booking</button>'}</td></tr>`;
    byId("bookingSummary").textContent = filtered.length ? `Showing ${start + 1}-${start + visible.length} of ${filtered.length} bookings` : "Showing 0 bookings";
    byId("bookingHubStatus").textContent = `${machines.filter(machine => machine.status !== "maintenance").length} units online`;
    renderPagination(totalPages);
  };

  function openDialog(title, content, receipt = false) {
    dialog.innerHTML = `<div class="dashboard-dialog-head"><h3 id="bookingDialogTitle">${title}</h3><button class="icon-btn" type="button" data-close-booking-dialog aria-label="Close dialog" title="Close">${dashboardIcon("x")}</button></div>${content}`;
    document.body.classList.toggle("booking-receipt-print", receipt);
    if (!dialog.open) dialog.showModal();
  }

  function openBooking(index, receipt) {
    selectedBooking = state.bookings[index];
    if (!selectedBooking) return;
    const booking = selectedBooking;
    const machine = machines.find(item => item.id === booking.machine);
    openDialog(receipt ? "Booking receipt" : "Booking details", `
      <div class="booking-dialog-summary">${customerCell(booking)}${statusBadge(booking.status)}</div>
      <dl class="booking-record">
        <div><dt>Facility</dt><dd>${text(booking.facility || "Bluewater Laundry")}</dd></div>
        <div><dt>Machine</dt><dd>${text(booking.machine)} / ${text(machine?.label || booking.type)}</dd></div>
        ${machine ? `<div><dt>Capacity</dt><dd>${text(machine.load)}</dd></div>` : ""}
        <div><dt>Booking time</dt><dd>${text(booking.time)}</dd></div>
        ${booking.id ? `<div><dt>Reference</dt><dd>${text(booking.id)}</dd></div>` : ""}
        ${booking.notes ? `<div><dt>Customer notes</dt><dd>${text(booking.notes)}</dd></div>` : ""}
        <div class="receipt-total"><dt>Total</dt><dd>${text(money(booking.total))}</dd></div>
      </dl>
      <div class="booking-dialog-actions">${receipt ? `<button class="booking-action" type="button" data-download-booking>${dashboardIcon("download")}Download</button><button class="booking-action" type="button" data-print-booking>${dashboardIcon("printer")}Print</button>` : `<button class="booking-action" type="button" data-booking-receipt="${index}">${dashboardIcon("receipt-text")}Receipt</button>`}</div>`, receipt);
  }

  function downloadReceipt() {
    if (!selectedBooking) return;
    const booking = selectedBooking;
    const receipt = ["WashWiz - Booking Receipt", booking.facility || "Bluewater Laundry", "", `Customer: ${booking.customer}`, `Contact: ${booking.contact}`, `Machine: ${booking.machine} (${booking.type})`, `Status: ${booking.status}`, `Time: ${booking.time}`, "", `Total: ${money(booking.total)}`].join("\r\n");
    const url = URL.createObjectURL(new Blob([receipt], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${booking.machine}-receipt.txt`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function closeMenu() {
    document.querySelector(".sidebar").classList.remove("open");
    byId("menuToggle").setAttribute("aria-expanded", "false");
  }

  byId("bookingSearch").addEventListener("input", () => { currentPage = 1; window.renderBookingsPage(); });
  document.addEventListener("click", event => {
    const filter = event.target.closest("[data-booking-status]");
    if (filter) { activeStatus = filter.dataset.bookingStatus; currentPage = 1; window.renderBookingsPage(); }
    if (event.target.closest("[data-reset-bookings]")) {
      byId("bookingSearch").value = "";
      activeStatus = "all";
      currentPage = 1;
      window.renderBookingsPage();
    }
    const pageButton = event.target.closest("[data-booking-page]");
    if (pageButton && !pageButton.disabled) {
      currentPage = Number(pageButton.dataset.bookingPage);
      window.renderBookingsPage();
      byId("bookingPagination").querySelector('[aria-current="page"]').focus({ preventScroll: true });
    }
    const details = event.target.closest("[data-booking-details]");
    if (details) openBooking(Number(details.dataset.bookingDetails), false);
    const receipt = event.target.closest("[data-booking-receipt]");
    if (receipt) openBooking(Number(receipt.dataset.bookingReceipt), true);
    if (event.target.closest("[data-close-booking-dialog]")) dialog.close();
    if (event.target.closest("[data-download-booking]")) downloadReceipt();
    if (event.target.closest("[data-print-booking]")) window.print();

    const action = event.target.closest("[data-dashboard-dialog]")?.dataset.dashboardDialog;
    if (action === "search") { setRoute("bookings"); byId("bookingSearch").focus(); }
    if (action === "alerts") {
      const alerts = machines.filter(machine => machine.status === "maintenance");
      openDialog("System alerts", alerts.map(machine => `<div class="booking-alert">${dashboardIcon("triangle-alert")}<div><strong>${text(machine.id)} / ${text(machine.label)}</strong><small>${text(machine.eta)}</small></div></div>`).join("") || '<p class="dashboard-empty">No service alerts.</p>');
    }
    if (action === "profile") openDialog("Facility profile", window.WashWizSettings.profileMarkup());
    if (event.target.closest(".dashboard-menu-backdrop")) closeMenu();
    if (event.target.closest("#menuToggle, [data-route], [data-page-link], [data-dashboard-dialog]")) {
      byId("menuToggle").setAttribute("aria-expanded", String(document.querySelector(".sidebar").classList.contains("open")));
    }
  });
  dialog.addEventListener("close", () => document.body.classList.remove("booking-receipt-print"));
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (dialog.open) { event.preventDefault(); dialog.close(); }
      closeMenu();
    }
  });
  byId("menuToggle").setAttribute("aria-expanded", "false");
  window.renderBookingsPage();
})();
