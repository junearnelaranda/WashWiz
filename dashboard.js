"use strict";

(() => {
  const dialog = document.createElement("dialog");
  dialog.className = "dashboard-dialog";
  dialog.setAttribute("aria-labelledby", "dashboardDialogTitle");
  document.body.append(dialog);
  let editingMachineId = null;

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

  function statusEta(status) {
    if (status === "available") return "Ready now";
    if (status === "maintenance") return "Service needed";
    return "In use";
  }

  function machineForm(machine) {
    const editing = Boolean(machine);
    editingMachineId = machine?.id || null;
    const value = (field, fallback = "") => machine?.[field] || fallback;
    dialog.innerHTML = `<div class="dashboard-dialog-head"><h3 id="dashboardDialogTitle">${editing ? `Edit ${machine.id}` : "Add new machine"}</h3><button class="icon-btn" type="button" data-dashboard-close aria-label="Close dialog" title="Close">${dashboardIcon("x")}</button></div>
      <form id="dashboardMachineForm" class="dashboard-machine-form">
        <label>Machine code<input name="id" required maxlength="12" value="${value("id")}" placeholder="e.g. W-05"></label>
        <label>Machine name<input name="label" required maxlength="40" value="${value("label")}" placeholder="e.g. Standard Washer"></label>
        <div class="dashboard-form-row">
          <label>Type<select name="type"><option value="washer" ${value("type", "washer") === "washer" ? "selected" : ""}>Washer</option><option value="dryer" ${value("type") === "dryer" ? "selected" : ""}>Dryer</option></select></label>
          <label>Capacity<input name="load" required maxlength="16" value="${value("load")}" placeholder="e.g. 30 lb"></label>
        </div>
        <div class="dashboard-form-row">
          <label>Rate (PHP)<input name="price" required min="0" step="5" type="number" value="${value("price", 120)}"></label>
          <label>Status<select name="status"><option value="available" ${value("status", "available") === "available" ? "selected" : ""}>Available</option><option value="occupied" ${value("status") === "occupied" ? "selected" : ""}>In use</option><option value="maintenance" ${value("status") === "maintenance" ? "selected" : ""}>Service</option></select></label>
        </div>
        <div class="dashboard-form-actions"><button class="secondary-btn compact" type="button" data-dashboard-close>Cancel</button><button class="primary-btn compact" type="submit">${editing ? "Save changes" : "Add machine"}</button></div>
      </form>`;
    dialog.showModal();
    dialog.querySelector("input[name=id]").focus();
  }

  function removeMachine(machine) {
    editingMachineId = machine.id;
    dialog.innerHTML = `<div class="dashboard-dialog-head"><h3 id="dashboardDialogTitle">Remove ${machine.id}?</h3><button class="icon-btn" type="button" data-dashboard-close aria-label="Close dialog" title="Close">${dashboardIcon("x")}</button></div>
      <p class="dashboard-empty">This will remove <strong>${machine.label}</strong> from the floor list.</p>
      <div class="dashboard-form-actions"><button class="secondary-btn compact" type="button" data-dashboard-close>Cancel</button><button class="primary-btn compact dashboard-danger" type="button" data-confirm-delete>Remove machine</button></div>`;
    dialog.showModal();
  }

  function refreshDashboardMachines() {
    renderAll();
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

    const statusButton = event.target.closest("[data-machine-status]");
    if (statusButton) {
      const machine = machines.find(item => item.id === statusButton.dataset.machineId);
      if (machine) {
        machine.status = statusButton.dataset.machineStatus;
        machine.eta = statusEta(machine.status);
        refreshDashboardMachines();
      }
    }
    if (event.target.closest("[data-add-machine]")) machineForm();
    const editButton = event.target.closest("[data-edit-machine]");
    if (editButton) machineForm(machines.find(item => item.id === editButton.dataset.editMachine));
    const deleteButton = event.target.closest("[data-delete-machine]");
    if (deleteButton) removeMachine(machines.find(item => item.id === deleteButton.dataset.deleteMachine));
    if (event.target.closest("[data-confirm-delete]")) {
      const index = machines.findIndex(item => item.id === editingMachineId);
      if (index !== -1) machines.splice(index, 1);
      dialog.close();
      refreshDashboardMachines();
    }
  });

  dialog.addEventListener("submit", event => {
    if (event.target.id !== "dashboardMachineForm") return;
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.target));
    const id = values.id.trim().toUpperCase();
    const duplicate = machines.find(item => item.id === id && item.id !== editingMachineId);
    if (!id || duplicate) {
      event.target.querySelector("input[name=id]").setCustomValidity(duplicate ? "Machine code already exists." : "Enter a machine code.");
      event.target.querySelector("input[name=id]").reportValidity();
      return;
    }
    const machine = { id, label: values.label.trim(), type: values.type, load: values.load.trim(), price: Number(values.price), status: values.status, eta: statusEta(values.status), size: "large" };
    const index = machines.findIndex(item => item.id === editingMachineId);
    if (index === -1) machines.push(machine);
    else machines[index] = { ...machines[index], ...machine };
    dialog.close();
    refreshDashboardMachines();
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
