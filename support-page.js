"use strict";

(() => {
  const dialog = document.createElement("dialog");
  dialog.className = "dashboard-dialog";
  dialog.setAttribute("aria-labelledby", "supportDialogTitle");
  document.body.append(dialog);

  const closeMenu = () => {
    document.querySelector(".sidebar")?.classList.remove("open");
    document.getElementById("menuToggle")?.setAttribute("aria-expanded", "false");
  };

  function openDialog(mode) {
    const titles = { search: "Search chats", alerts: "System alerts", profile: "Facility profile" };
    if (!titles[mode]) return;
    const content = mode === "search"
      ? '<label for="supportDialogSearch">Customer, order, or machine<input id="supportDialogSearch" type="search" placeholder="Search chats" autocomplete="off"></label><p class="dashboard-empty">Use the inbox search to filter conversations.</p>'
      : mode === "alerts"
        ? '<div class="dashboard-results"><p class="dashboard-empty">Support inbox is connected.</p><p class="dashboard-empty">Review the active conversations in the inbox.</p></div>'
        : window.WashWizSettings.profileMarkup();
    dialog.innerHTML = `<div class="dashboard-dialog-head"><h3 id="supportDialogTitle">${titles[mode]}</h3><button class="icon-btn" type="button" data-support-dialog-close aria-label="Close dialog" title="Close">${dashboardIcon("x")}</button></div>${content}`;
    dialog.showModal();
    if (mode === "search") {
      const search = document.getElementById("supportDialogSearch");
      search.addEventListener("input", () => {
        const inboxSearch = document.getElementById("supportSearch");
        inboxSearch.value = search.value;
        inboxSearch.dispatchEvent(new Event("input", { bubbles: true }));
      });
      search.focus();
    }
  }

  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-dashboard-dialog]");
    if (trigger) openDialog(trigger.dataset.dashboardDialog);
    if (event.target.closest("[data-support-dialog-close]")) dialog.close();
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
