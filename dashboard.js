"use strict";

(() => {
  const dialog = document.createElement("dialog");
  dialog.className = "dashboard-dialog";
  dialog.setAttribute("aria-labelledby", "dashboardDialogTitle");
  document.body.append(dialog);

  function closeMenu() {
    document.querySelector(".sidebar").classList.remove("open");
    byId("menuToggle").setAttribute("aria-expanded", "false");
  }

  function machineResult(machine) {
    return `<button class="dashboard-result" type="button" data-find-machine="${machine.id}">
      <span><strong>${machine.id} / ${machine.label}</strong><small>${machine.load} capacity / ${machine.eta}</small></span>
      <span class="badge ${machine.status}">${statusLabel(machine.status)}</span>
    </button>`;
  }

  function renderSearch() {
    const query = byId("dashboardMachineSearch").value.trim().toLowerCase();
    const matches = machines.filter(machine =>
      `${machine.id} ${machine.label} ${machine.status} ${statusLabel(machine.status)}`.toLowerCase().includes(query)
    );
    byId("dashboardSearchResults").innerHTML = matches.map(machineResult).join("") || '<p class="dashboard-empty">No matching machines.</p>';
  }

  function openDialog(mode) {
    const titles = { search: "Search machines", alerts: "System alerts", profile: "Facility profile" };
    if (!titles[mode]) return;
    let content = "";
    if (mode === "search") {
      content = '<label for="dashboardMachineSearch">Machine name or status<input id="dashboardMachineSearch" type="search" placeholder="Search machines" autocomplete="off" autofocus></label><div id="dashboardSearchResults" class="dashboard-results" aria-live="polite"></div>';
    } else if (mode === "alerts") {
      const serviceMachines = machines.filter(machine => machine.status === "maintenance");
      content = `<div class="dashboard-results">${serviceMachines.map(machineResult).join("") || '<p class="dashboard-empty">No service alerts.</p>'}</div>`;
    } else {
      content = window.WashWizSettings.profileMarkup();
    }
    dialog.innerHTML = `<div class="dashboard-dialog-head"><h3 id="dashboardDialogTitle">${titles[mode]}</h3><button class="icon-btn" type="button" data-dashboard-close aria-label="Close dialog" title="Close">${dashboardIcon("x")}</button></div>${content}`;
    if (mode === "search") {
      byId("dashboardMachineSearch").addEventListener("input", renderSearch);
      renderSearch();
    }
    dialog.showModal();
    if (mode === "search") byId("dashboardMachineSearch").focus();
  }

  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-dashboard-dialog]");
    if (trigger) openDialog(trigger.dataset.dashboardDialog);
    if (event.target.closest("[data-dashboard-close]")) dialog.close();
    if (event.target.closest(".dashboard-menu-backdrop")) closeMenu();

    const result = event.target.closest("[data-find-machine]");
    if (result) {
      dialog.close();
      setRoute("dashboard");
      document.querySelector('#machineFilter [data-filter="all"]').click();
      const card = document.querySelector(`[data-dashboard-machine-id="${result.dataset.findMachine}"]`);
      card.focus({ preventScroll: true });
      card.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }
    if (event.target.closest("#menuToggle, [data-route], [data-page-link]")) {
      byId("menuToggle").setAttribute("aria-expanded", String(document.querySelector(".sidebar").classList.contains("open")));
    }
  });

  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (dialog.open) {
        event.preventDefault();
        dialog.close();
      }
      closeMenu();
    }
  });
  byId("menuToggle").setAttribute("aria-expanded", "false");
})();
