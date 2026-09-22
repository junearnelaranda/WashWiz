"use strict";

(() => {
  const preferences = window.WashWizSettings;
  const escape = preferences.escape;
  let saved = preferences.load();
  let draft = structuredClone(saved);
  let photoVersion = 0;
  const tabs = [["profile", "Facility Profile", "user-round"], ["stores", "Franchises & Stores", "layout-dashboard"], ["branch", "Branch Details", "calendar-days"], ["security", "Security & Access", "circle-check"], ["notifications", "Notifications", "bell"]];
  const field = (label, id, type = "text", extra = "") => `<label>${label}<input id="${id}" name="${id}" type="${type}" ${extra}></label>`;
  byId("settings").innerHTML = `
    <div class="settings-tabs" role="tablist" aria-label="Settings sections">${tabs.map(([id, label, icon], index) => `<button id="settingsTab-${id}" type="button" role="tab" aria-controls="settingsPanel-${id}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" data-settings-tab="${id}">${dashboardIcon(icon)}${label}</button>`).join("")}</div>
    <form id="settingsForm" novalidate>
      <section class="settings-panel" id="settingsPanel-profile" role="tabpanel" aria-labelledby="settingsTab-profile">
        <div class="settings-section"><div class="settings-section-head"><h3>Facility Profile</h3><span class="status-pill success">Facility Account</span></div>
          <div class="settings-photo-row"><div id="settingsPhotoPreview" class="settings-photo" aria-label="Facility logo"></div>
            <div id="settingsPhotoDrop" class="settings-photo-drop"><div><strong>Facility logo</strong><small>JPG, PNG or WEBP. Maximum 5 MB.</small></div><div class="settings-actions"><button type="button" class="secondary-btn" id="settingsUpload">${dashboardIcon("upload")}Browse Files</button><button type="button" class="secondary-btn" id="settingsRemovePhoto">${dashboardIcon("x")}Remove</button></div><input type="file" id="settingsPhotoInput" accept="image/jpeg,image/png,image/webp" class="hidden" aria-label="Upload facility logo"></div>
          </div>
        </div>
        <div class="settings-section"><div class="settings-section-head"><h3>Facility Details</h3></div><div class="settings-fields">
          ${field("Facility name", "settingsFacilityName", "text", 'autocomplete="organization" maxlength="100" required')}
          ${field("Facility email", "settingsEmail", "email", 'autocomplete="email" maxlength="120" required')}
          ${field("Facility phone", "settingsPhone", "tel", 'autocomplete="tel" maxlength="30"')}
          ${field("Account type", "settingsRole", "text", 'value="Facility" readonly')}
          <label>Facility ID<div class="settings-copy-row"><input id="settingsAccountId" value="WW-FACILITY-001" readonly><button class="secondary-btn" id="settingsCopyId" type="button" title="Copy facility ID">Copy</button></div></label>
        </div></div>
      </section>
      <section class="settings-panel" id="settingsPanel-stores" role="tabpanel" aria-labelledby="settingsTab-stores" hidden>
        <div class="settings-section"><div class="settings-section-head"><div><h3>Franchise Stores</h3><p id="settingsStoreCount"></p></div><button type="button" id="settingsAddStore" class="primary-btn">${dashboardIcon("plus")}Register Store</button></div><div id="settingsStoreList" class="settings-store-list"></div></div>
      </section>
      <section class="settings-panel" id="settingsPanel-branch" role="tabpanel" aria-labelledby="settingsTab-branch" hidden>
        <div class="settings-section"><div class="settings-section-head"><h3>Branch Profile</h3><a class="secondary-btn" href="customer.html">Customer Portal${dashboardIcon("chevron-right")}</a></div>
          <label class="settings-store-select">Store profile<select id="settingsSelectedStore"></select></label><div class="settings-fields">
          ${field("Shop name", "settingsShopName", "text", 'maxlength="100" required')}
          ${field("Street address", "settingsAddress", "text", 'autocomplete="street-address" maxlength="200"')}
          ${field("Customer hotline", "settingsHotline", "tel", 'maxlength="30"')}
          ${field("Registered machines", "settingsMachines", "number", 'min="0" max="999" step="1" required')}
          ${field("Opening time", "settingsOpens", "time", 'required')}
          ${field("Closing time", "settingsCloses", "time", 'required')}
        </div></div>
      </section>
      <section class="settings-panel" id="settingsPanel-security" role="tabpanel" aria-labelledby="settingsTab-security" hidden>
        <div class="settings-section"><div class="settings-section-head"><h3>Security & Access</h3></div>
          <dl class="settings-access"><div><dt>Account type</dt><dd>Facility</dd></div><div><dt>Session</dt><dd>This browser</dd></div><div><dt>Access</dt><dd>Facility dashboard</dd></div></dl>
          <div class="settings-security-action"><div><strong>Current session</strong><small>Sign out of WashWiz on this browser.</small></div><button type="button" class="secondary-btn logout-btn" id="settingsSignOut">${dashboardIcon("log-out")}Sign Out</button></div>
        </div>
      </section>
      <section class="settings-panel" id="settingsPanel-notifications" role="tabpanel" aria-labelledby="settingsTab-notifications" hidden>
        <div class="settings-section"><div class="settings-section-head"><h3>Notification Indicators</h3></div>
          <label class="settings-toggle-row"><span><strong>Support inbox count</strong><small>Unresolved conversations in the sidebar.</small></span><input id="settingsSupportCount" type="checkbox" role="switch"></label>
          <label class="settings-toggle-row"><span><strong>System alert indicator</strong><small>Notification dot on the header bell.</small></span><input id="settingsAlerts" type="checkbox" role="switch"></label>
        </div>
      </section>
      <footer class="settings-save-bar"><p id="settingsSaveState" role="status"></p><div class="settings-actions"><button type="button" class="secondary-btn" id="settingsDiscard">Discard Changes</button><button type="submit" class="primary-btn" id="settingsSave">${dashboardIcon("circle-check")}Save Changes</button></div></footer>
    </form>
    <p id="settingsFeedback" class="settings-feedback" role="status" aria-live="polite"></p>`;

  const dialog = document.createElement("dialog");
  dialog.id = "settingsDialog";
  dialog.className = "dashboard-dialog settings-dialog";
  dialog.setAttribute("aria-labelledby", "settingsDialogTitle");
  document.body.append(dialog);
  const profileFields = { settingsFacilityName: "name", settingsEmail: "email", settingsPhone: "phone" };
  const storeFields = { settingsShopName: "name", settingsAddress: "address", settingsHotline: "hotline", settingsMachines: "machines", settingsOpens: "opens", settingsCloses: "closes" };
  const currentStore = () => draft.stores.find(store => store.id === draft.selectedStore);
  const dirty = () => JSON.stringify(draft) !== JSON.stringify(saved);
  function feedback(message, error = false) {
    byId("settingsFeedback").textContent = message;
    byId("settingsFeedback").classList.toggle("error", error);
  }
  function updateState() {
    byId("settingsSaveState").textContent = dirty() ? "Unsaved changes" : saved.savedAt ? `Saved on this browser at ${new Date(saved.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "No unsaved changes";
    byId("settingsDiscard").disabled = !dirty();
    byId("settingsSave").disabled = !dirty();
  }
  function showTab(id, focus = false) {
    document.querySelectorAll("[data-settings-tab]").forEach(button => {
      const active = button.dataset.settingsTab === id;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && focus) button.focus();
    });
    document.querySelectorAll(".settings-panel").forEach(panel => { panel.hidden = panel.id !== `settingsPanel-${id}`; });
  }
  function renderPhoto() {
    byId("settingsPhotoPreview").innerHTML = preferences.avatar(draft.profile);
    byId("settingsRemovePhoto").disabled = !draft.profile.photo;
  }
  function renderBranch() {
    byId("settingsSelectedStore").innerHTML = draft.stores.map(store => `<option value="${escape(store.id)}">${escape(store.name)}</option>`).join("");
    byId("settingsSelectedStore").value = draft.selectedStore;
    for (const [id, field] of Object.entries(storeFields)) byId(id).value = currentStore()[field];
  }
  function renderStores() {
    const active = draft.stores.filter(store => store.status === "Active").length;
    byId("settingsStoreCount").textContent = `${draft.stores.length} registered / ${active} active`;
    byId("settingsStoreList").innerHTML = draft.stores.map(store => `<article class="settings-store"><div class="settings-store-icon">${dashboardIcon("layout-dashboard")}</div><div class="settings-store-copy"><h4>${escape(store.name)}</h4><small>${escape(store.id)} / ${store.machines} machines</small><p>${escape(store.address || "No address added")}</p></div><span class="status-pill ${store.status === "Active" ? "success" : "warning"}">${store.status}</span><div class="settings-actions"><button type="button" class="secondary-btn" data-edit-store="${escape(store.id)}">Edit Details</button><button type="button" class="secondary-btn" data-toggle-store="${escape(store.id)}">${store.status === "Active" ? "Pause" : "Resume"}</button></div></article>`).join("");
  }
  function render() {
    byId("settingsForm").querySelectorAll("input").forEach(input => input.setCustomValidity(""));
    for (const [id, field] of Object.entries(profileFields)) byId(id).value = draft.profile[field];
    byId("settingsSupportCount").checked = draft.notifications.support;
    byId("settingsAlerts").checked = draft.notifications.alerts;
    renderPhoto(); renderBranch(); renderStores(); updateState();
  }
  function openDialog(title, content) {
    dialog.innerHTML = `<div class="dashboard-dialog-head"><h3 id="settingsDialogTitle">${title}</h3><button type="button" class="icon-btn" data-settings-close aria-label="Close dialog" title="Close">${dashboardIcon("x")}</button></div>${content}`;
    dialog.showModal();
  }
  function registerStore() {
    openDialog("Register Store", `<form id="settingsNewStoreForm" class="settings-fields">${field("Shop name", "newStoreName", "text", 'maxlength="100" required')}${field("Street address", "newStoreAddress", "text", 'maxlength="200"')}${field("Registered machines", "newStoreMachines", "number", 'min="0" max="999" step="1" value="0" required')}<button type="submit" class="primary-btn">${dashboardIcon("plus")}Add Store</button></form>`);
    byId("settingsNewStoreForm").addEventListener("submit", event => {
      event.preventDefault();
      const name = byId("newStoreName").value.trim();
      byId("newStoreName").setCustomValidity(name ? "" : "Enter a shop name.");
      if (!event.target.reportValidity()) return;
      const id = `WW-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      draft.stores.push({ id, name, address: byId("newStoreAddress").value.trim(), machines: Number(byId("newStoreMachines").value), hotline: "", opens: "07:00", closes: "22:00", status: "Active" });
      draft.selectedStore = id;
      renderBranch(); renderStores(); updateState(); dialog.close();
      feedback("Store added. Save changes to keep it.");
    });
    byId("newStoreName").addEventListener("input", event => event.target.setCustomValidity(""));
  }
  async function uploadPhoto(file) {
    if (!file) return;
    const version = ++photoVersion;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      feedback("Choose a JPG, PNG or WEBP image smaller than 5 MB.", true); return;
    }
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 256;
      const side = Math.min(bitmap.width, bitmap.height);
      canvas.getContext("2d").drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 256, 256);
      if (version !== photoVersion) return;
      draft.profile.photo = canvas.toDataURL("image/png");
      renderPhoto(); updateState(); feedback("Photo ready. Save changes to apply it.");
    } catch { feedback("This image could not be opened. Choose another file.", true); }
    finally { bitmap?.close(); byId("settingsPhotoInput").value = ""; }
  }
  byId("settingsForm").addEventListener("input", event => {
    const id = event.target.id;
    event.target.setCustomValidity?.("");
    if (profileFields[id]) { draft.profile[profileFields[id]] = event.target.value; renderPhoto(); }
    if (storeFields[id]) { currentStore()[storeFields[id]] = id === "settingsMachines" ? Number(event.target.value) : event.target.value; renderStores(); }
    if (id === "settingsSupportCount") draft.notifications.support = event.target.checked;
    if (id === "settingsAlerts") draft.notifications.alerts = event.target.checked;
    updateState();
  });
  byId("settingsSelectedStore").addEventListener("change", event => { draft.selectedStore = event.target.value; renderBranch(); updateState(); });
  byId("settingsForm").addEventListener("submit", event => {
    event.preventDefault();
    for (const id of ["settingsFacilityName", "settingsShopName"]) {
      byId(id).setCustomValidity(byId(id).value.trim() ? "" : "This field is required.");
    }
    const invalid = [...event.target.querySelectorAll("input")].find(input => !input.validity.valid);
    if (invalid) {
      showTab(invalid.closest(".settings-panel").id.replace("settingsPanel-", ""));
      invalid.reportValidity(); return;
    }
    const invalidStore = draft.stores.find(store => !store.name.trim() || !Number.isInteger(store.machines) || store.machines < 0 || store.machines > 999 || !/^\d{2}:\d{2}$/.test(store.opens) || !/^\d{2}:\d{2}$/.test(store.closes));
    if (invalidStore) {
      draft.selectedStore = invalidStore.id; renderBranch(); showTab("branch"); feedback("Complete the branch details before saving.", true); return;
    }
    for (const field of Object.values(profileFields)) draft.profile[field] = draft.profile[field].trim();
    try {
      saved = preferences.save(draft); draft = structuredClone(saved); render(); feedback("Settings saved on this browser.");
    } catch { feedback("Settings could not be saved. Check that browser storage is available.", true); }
  });
  byId("settingsDiscard").addEventListener("click", () => { photoVersion++; draft = structuredClone(saved); render(); feedback("Changes discarded."); });
  byId("settingsUpload").addEventListener("click", () => byId("settingsPhotoInput").click());
  byId("settingsPhotoInput").addEventListener("change", event => uploadPhoto(event.target.files[0]));
  byId("settingsRemovePhoto").addEventListener("click", () => { photoVersion++; draft.profile.photo = ""; renderPhoto(); updateState(); });
  byId("settingsPhotoDrop").addEventListener("dragover", event => { event.preventDefault(); event.currentTarget.classList.add("dragging"); });
  byId("settingsPhotoDrop").addEventListener("dragleave", event => event.currentTarget.classList.remove("dragging"));
  byId("settingsPhotoDrop").addEventListener("drop", event => { event.preventDefault(); event.currentTarget.classList.remove("dragging"); uploadPhoto(event.dataTransfer.files[0]); });
  byId("settingsCopyId").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(byId("settingsAccountId").value); feedback("Account ID copied."); }
    catch { byId("settingsAccountId").focus(); byId("settingsAccountId").select(); feedback("Account ID selected for copying."); }
  });
  byId("settingsSignOut").addEventListener("click", () => { photoVersion++; draft = structuredClone(saved); logOutFacility(); });
  byId("settingsAddStore").addEventListener("click", registerStore);
  document.addEventListener("click", event => {
    const target = event.target.closest('a[href], #logoutButton, .nav-book, #settingsSignOut');
    if (!target || !dirty() || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); event.stopImmediatePropagation();
    openDialog("Unsaved changes", '<p>Discard your changes before leaving Settings?</p><div class="settings-actions"><button type="button" class="secondary-btn" data-settings-close>Keep Editing</button><button type="button" class="primary-btn" id="settingsLeave">Discard & Continue</button></div>');
    byId("settingsLeave").addEventListener("click", () => { photoVersion++; draft = structuredClone(saved); render(); dialog.close(); target.click(); });
  }, true);
  function closeMenu() { document.querySelector(".sidebar").classList.remove("open"); byId("menuToggle").setAttribute("aria-expanded", "false"); }
  document.addEventListener("click", event => {
    const tab = event.target.closest("[data-settings-tab]");
    if (tab) showTab(tab.dataset.settingsTab);
    const edit = event.target.closest("[data-edit-store]");
    if (edit) { draft.selectedStore = edit.dataset.editStore; renderBranch(); showTab("branch", true); updateState(); }
    const toggle = event.target.closest("[data-toggle-store]");
    if (toggle) { const store = draft.stores.find(item => item.id === toggle.dataset.toggleStore); store.status = store.status === "Active" ? "Paused" : "Active"; renderStores(); updateState(); }
    if (event.target.closest("[data-settings-close]")) dialog.close();
    const action = event.target.closest("[data-dashboard-dialog]")?.dataset.dashboardDialog;
    if (action === "profile") openDialog("Facility profile", preferences.profileMarkup());
    if (action === "alerts") openDialog("System alerts", `<div class="dashboard-results">${machines.filter(machine => machine.status === "maintenance").map(machine => `<div class="dashboard-result"><strong>${escape(machine.id)}</strong><small>${escape(machine.eta)}</small></div>`).join("") || '<p>No service alerts.</p>'}</div>`);
    if (action === "search") {
      openDialog("Find a setting", '<label>Search settings<input id="settingsSearch" type="search" autocomplete="off"></label><div id="settingsSearchResults" class="dashboard-results"></div>');
      const search = () => {
        const term = byId("settingsSearch").value.trim().toLowerCase();
        const matches = tabs.filter(([id, label]) => `${id} ${label}`.toLowerCase().includes(term));
        byId("settingsSearchResults").innerHTML = matches.map(([id, label]) => `<button type="button" class="dashboard-result" data-settings-find="${id}">${label}</button>`).join("") || '<p class="dashboard-empty">No matching settings.</p>';
      };
      byId("settingsSearch").addEventListener("input", search); search(); byId("settingsSearch").focus();
    }
    const find = event.target.closest("[data-settings-find]");
    if (find) { dialog.close(); setRoute("settings"); showTab(find.dataset.settingsFind, true); }
    if (event.target.closest(".dashboard-menu-backdrop")) closeMenu();
    if (event.target.closest("#menuToggle, [data-route], [data-page-link]")) byId("menuToggle").setAttribute("aria-expanded", String(document.querySelector(".sidebar").classList.contains("open")));
  });
  document.querySelector(".settings-tabs").addEventListener("keydown", event => {
    const index = tabs.findIndex(([id]) => id === event.target.dataset.settingsTab);
    if (index < 0) return;
    const next = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
    if (next !== undefined) { event.preventDefault(); showTab(tabs[next][0], true); }
  });
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });
  window.addEventListener("beforeunload", event => { if (dirty()) { event.preventDefault(); event.returnValue = ""; } });
  byId("menuToggle").setAttribute("aria-expanded", "false");
  document.querySelector('[data-dashboard-dialog="search"]').title = "Search settings";
  render();
})();
