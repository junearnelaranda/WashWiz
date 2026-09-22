"use strict";

window.WashWizSettings = (() => {
  const key = "washwizSettings";
  const defaults = () => ({
    profile: { name: "Bluewater Laundry", email: "facility@bluewater.test", phone: "", photo: "" },
    notifications: { support: true, alerts: true },
    stores: [{ id: "WW-001", name: "Bluewater Laundry", address: "", hotline: "", opens: "07:00", closes: "22:00", machines: 7, status: "Active" }],
    selectedStore: "WW-001",
    savedAt: ""
  });
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const validPhoto = photo => typeof photo === "string" && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(photo);
  function load() {
    const result = defaults();
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (!saved || typeof saved !== "object") return result;
      if (typeof saved.profile?.name === "string") result.profile.name = saved.profile.name;
      else if (typeof saved.profile?.firstName === "string" || typeof saved.profile?.lastName === "string") {
        result.profile.name = [saved.profile.firstName, saved.profile.lastName].filter(Boolean).join(" ");
      }
      for (const field of ["email", "phone"]) {
        if (typeof saved.profile?.[field] === "string") result.profile[field] = saved.profile[field];
      }
      if (validPhoto(saved.profile?.photo)) result.profile.photo = saved.profile.photo;
      for (const field of ["support", "alerts"]) {
        if (typeof saved.notifications?.[field] === "boolean") result.notifications[field] = saved.notifications[field];
      }
      if (Array.isArray(saved.stores)) {
        const stores = saved.stores.filter(store => store && ["id", "name", "address", "hotline", "opens", "closes"].every(field => typeof store[field] === "string") && Number.isInteger(store.machines) && store.machines >= 0 && ["Active", "Paused"].includes(store.status));
        if (stores.length) result.stores = stores;
      }
      if (result.stores.some(store => store.id === saved.selectedStore)) result.selectedStore = saved.selectedStore;
      else result.selectedStore = result.stores[0].id;
      if (typeof saved.savedAt === "string" && Number.isFinite(Date.parse(saved.savedAt))) result.savedAt = saved.savedAt;
    } catch { /* Unavailable or invalid browser storage uses the standard facility. */ }
    return result;
  }
  const initials = profile => profile.name.split(/\s+/).filter(Boolean).map(part => part[0]).join("").slice(0, 2).toUpperCase() || "BW";
  function avatar(profile) {
    return validPhoto(profile.photo) ? `<img class="facility-profile-photo" src="${profile.photo}" alt="">` : escape(initials(profile));
  }
  function apply() {
    const data = load();
    document.querySelectorAll(".topbar .avatar, .dashboard-facility .facility-initials").forEach(node => { node.innerHTML = avatar(data.profile); });
    const facilityProfile = document.querySelector(".dashboard-facility");
    if (facilityProfile) {
      facilityProfile.setAttribute("aria-label", "View facility profile");
      facilityProfile.querySelector("strong").textContent = data.profile.name;
    }
    document.body.classList.toggle("hide-support-count", !data.notifications.support);
    document.body.classList.toggle("hide-alert-indicator", !data.notifications.alerts);
  }
  function profileMarkup() {
    const { profile } = load();
    return `<div class="dashboard-profile"><span class="facility-initials">${avatar(profile)}</span><div><strong>${escape(profile.name)}</strong><small>Facility account</small></div></div><dl class="dashboard-profile-details"><div><dt>Email</dt><dd>${escape(profile.email)}</dd></div><div><dt>Access</dt><dd>Facility dashboard</dd></div></dl>`;
  }
  function save(data) {
    const next = { ...data, savedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(next));
    apply();
    return next;
  }
  window.addEventListener("storage", event => { if (event.key === key || event.key === null) apply(); });
  return { load, save, escape, initials, avatar, apply, profileMarkup };
})();
