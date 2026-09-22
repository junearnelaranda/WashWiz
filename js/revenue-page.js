"use strict";

(() => {
  const dialog = document.createElement("dialog");
  dialog.className = "dashboard-dialog";
  dialog.setAttribute("aria-labelledby", "revenueDialogTitle");
  document.body.append(dialog);

  const closeMenu = () => {
    document.querySelector(".sidebar")?.classList.remove("open");
    document.getElementById("menuToggle")?.setAttribute("aria-expanded", "false");
  };

  function csvValue(value) { return `"${String(value).replaceAll('"', '""')}"`; }

  function exportRevenue() {
    const rows = [["Date & Time", "Customer", "Machine", "Payment Method", "Amount"]];
    const methods = ["Visa **** 4242", "Apple Pay", "Cash", "Mastercard **** 8891"];
    state.bookings.forEach((booking, index) => rows.push([`Today ${booking.time}`, booking.customer, booking.machine, methods[index % methods.length], money(booking.total)]));
    const blob = new Blob([rows.map(row => row.map(csvValue).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "washwiz-revenue.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    const status = document.getElementById("revenueStationStatus");
    if (status) status.textContent = "Exported just now";
  }

  function openPeriodMenu() {
    dialog.innerHTML = `<div class="dashboard-dialog-head"><h3 id="revenueDialogTitle">Revenue period</h3><button class="icon-btn" type="button" data-revenue-dialog-close aria-label="Close dialog" title="Close">${dashboardIcon("x")}</button></div><p class="modal-subtitle">Choose the reporting window for this view.</p><div class="revenue-period-menu"><button type="button" data-revenue-period="Last 7 Days">Last 7 Days</button><button type="button" data-revenue-period="Last 30 Days">Last 30 Days</button><button type="button" data-revenue-period="Last 90 Days">Last 90 Days</button></div>`;
    dialog.showModal();
  }

  function openDialog(mode) {
    const titles = { search: "Search transactions", alerts: "System alerts", profile: "Facility profile" };
    if (!titles[mode]) return;
    const content = mode === "search"
      ? '<label for="revenueSearchDialog">Customer or machine<input id="revenueSearchDialog" type="search" placeholder="Search transactions" autocomplete="off"></label><p class="dashboard-empty">Use the transaction ledger below to review payment records.</p>'
      : mode === "alerts"
        ? '<div class="dashboard-results"><p class="dashboard-empty">Revenue data is up to date.</p><p class="dashboard-empty">No payment exceptions reported.</p></div>'
        : window.WashWizSettings.profileMarkup();
    dialog.innerHTML = `<div class="dashboard-dialog-head"><h3 id="revenueDialogTitle">${titles[mode]}</h3><button class="icon-btn" type="button" data-revenue-dialog-close aria-label="Close dialog" title="Close">${dashboardIcon("x")}</button></div>${content}`;
    dialog.showModal();
    document.getElementById("revenueSearchDialog")?.focus();
  }

  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-dashboard-dialog]");
    if (trigger) openDialog(trigger.dataset.dashboardDialog);
    if (event.target.closest("[data-revenue-dialog-close]")) dialog.close();
    if (event.target.closest("#revenueExportButton")) exportRevenue();
    if (event.target.closest("#revenuePeriodButton")) openPeriodMenu();
    const period = event.target.closest("[data-revenue-period]");
    if (period) {
      document.getElementById("revenuePeriodLabel").textContent = period.dataset.revenuePeriod;
      document.getElementById("revenuePeriodButton").setAttribute("aria-expanded", "false");
      dialog.close();
    }
    if (event.target.closest("#revenueViewAllButton")) document.querySelector(".revenue-register")?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (event.target.closest(".dashboard-menu-backdrop")) closeMenu();
    if (event.target.closest("#menuToggle, [data-route], [data-page-link]")) {
      document.getElementById("menuToggle")?.setAttribute("aria-expanded", String(document.querySelector(".sidebar")?.classList.contains("open")));
    }
  });

  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (dialog.open) { event.preventDefault(); dialog.close(); }
    closeMenu();
  });
  document.getElementById("menuToggle")?.setAttribute("aria-expanded", "false");
})();
