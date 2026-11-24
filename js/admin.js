"use strict";

// WashWiz admin site: every shop, machine, booking, facility account and chat, updating live.
(() => {
  const db = window.WashWizDB;
  const esc = db.escape;
  const $ = id => document.getElementById(id);
  const peso = value => `PHP ${Number(value || 0).toLocaleString("en-PH")}`;
  const todayISO = () => new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);

  const D = { shops: [], machines: [], bookings: [], staff: [], threads: [], messages: [] };
  const ui = { view: "overview", shop: "all", status: "all", search: "", thread: null, openShop: null };
  let me = null;

  function toast(text, bad = false) {
    const node = $("adminToast");
    node.textContent = text;
    node.className = `admin-toast show${bad ? " bad" : ""}`;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { node.className = "admin-toast"; }, 3000);
  }
  const fail = error => { toast(db.errorText(error), true); return false; };
  const shopName = id => D.shops.find(shop => shop.id === id)?.name || id || "No shop";
  const statusPill = status => {
    const kind = ["Active", "active", "available", "Completed", "Paid", "Ready for Pickup", "resolved"].includes(status) ? "ok"
      : ["Paused", "pending", "occupied", "Requested", "In Cycle", "Drying", "Processing"].includes(status) ? "warn"
      : ["disabled", "maintenance", "Cancelled"].includes(status) ? "bad" : "";
    return `<span class="pill ${kind}">${esc(status)}</span>`;
  };

  // ---------- data ----------
  async function load() {
    const [shops, machines, bookings, staff, threads] = await Promise.all([
      db.client.from("shops").select("*").order("sort_order"),
      db.client.from("machines").select("*").order("sort_order"),
      db.client.from("bookings").select("*").order("created_at", { ascending: false }).limit(1000),
      db.client.from("staff").select("*").order("created_at", { ascending: false }),
      db.client.from("support_threads").select("*").order("updated_at", { ascending: false })
    ]);
    const error = shops.error || machines.error || bookings.error || staff.error || threads.error;
    if (error) return fail(error);
    const ids = threads.data.map(thread => thread.id);
    const messages = ids.length ? await db.client.from("support_messages").select("*").in("thread_id", ids).order("id") : { data: [] };
    Object.assign(D, { shops: shops.data, machines: machines.data, bookings: bookings.data, staff: staff.data, threads: threads.data, messages: messages.data || [] });
    render();
    return true;
  }

  // Don't redraw under someone's fingers: wait until they leave the field.
  let pending = false;
  function render() {
    const active = document.activeElement;
    if (active && $("adminView").contains(active) && /INPUT|TEXTAREA/.test(active.tagName)) { pending = true; return; }
    pending = false;
    const open = D.threads.filter(thread => thread.status !== "resolved").length;
    $("adminChatBadge").textContent = open;
    $("adminChatBadge").classList.toggle("hidden", !open);
    ({ overview, shops: shopsView, bookings: bookingsView, facilities, chats })[ui.view]();
  }
  $("adminView").addEventListener("focusout", () => setTimeout(() => { if (pending) render(); }, 60));

  function setTitle(title, subtitle) { $("adminTitle").textContent = title; $("adminSubtitle").textContent = subtitle; }

  // ---------- views ----------
  function overview() {
    setTitle("Overview", "Every laundry shop on WashWiz");
    const counted = D.bookings.filter(booking => booking.status !== "Cancelled");
    const today = counted.filter(booking => booking.booking_date === todayISO());
    const facilities = D.staff.filter(account => account.role !== "admin");
    const card = (label, value, note) => `<article class="admin-card"><div class="label">${label}</div><div class="value">${esc(value)}</div><div class="note">${esc(note)}</div></article>`;
    const perShop = D.shops.map(shop => {
      const rows = counted.filter(booking => booking.shop_id === shop.id);
      const machines = D.machines.filter(machine => machine.shop_id === shop.id);
      return `<tr><td><strong>${esc(shop.name)}</strong><small>${esc(shop.address || "")}</small></td><td>${statusPill(shop.status)}</td>
        <td>${machines.filter(m => m.status === "available").length} / ${machines.length} free</td>
        <td>${rows.filter(b => b.booking_date === todayISO()).length}</td><td>${rows.length}</td><td>${peso(rows.reduce((sum, b) => sum + Number(b.total), 0))}</td></tr>`;
    }).join("");
    $("adminView").innerHTML = `<div class="admin-stats">
        ${card("Shops", D.shops.length, `${D.shops.filter(s => s.status === "Active").length} open to customers`)}
        ${card("Facility accounts", facilities.length, `${facilities.filter(a => a.status === "active").length} active`)}
        ${card("Bookings today", today.length, `${peso(today.reduce((sum, b) => sum + Number(b.total), 0))} today`)}
        ${card("Total revenue", peso(counted.reduce((sum, b) => sum + Number(b.total), 0)), `${counted.length} bookings, all shops`)}
      </div>
      <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Shop</th><th>Status</th><th>Machines</th><th>Today</th><th>Bookings</th><th>Revenue</th></tr></thead>
      <tbody>${perShop || '<tr><td colspan="6" class="empty">No shops yet. Shops appear when a laundry owner registers on the Facility login.</td></tr>'}</tbody></table></div>`;
  }

  function shopsView() {
    setTitle("Shops & machines", "Pause a shop to hide it from customers");
    const rows = D.shops.map(shop => {
      const machines = D.machines.filter(machine => machine.shop_id === shop.id);
      const owner = D.staff.find(account => account.shop_id === shop.id);
      const services = Array.isArray(shop.services) ? shop.services : [];
      const open = ui.openShop === shop.id;
      return `<tr><td><strong>${esc(shop.name)}</strong><small>${esc([shop.address, shop.area].filter(Boolean).join(", "))}</small></td>
        <td>${esc(owner?.email || "-")}</td><td>${statusPill(shop.status)}</td>
        <td>${services.length ? services.map(s => `${esc(s.name)} <small style="display:inline">${peso(s.price)}</small>`).join("<br>") : '<small>None yet</small>'}</td>
        <td><button class="btn sm" type="button" data-open-shop="${esc(shop.id)}">${machines.length} machines ${open ? "&#9650;" : "&#9660;"}</button></td>
        <td><button class="btn sm ${shop.status === "Active" ? "danger" : "primary"}" type="button" data-shop-status="${shop.status === "Active" ? "Paused" : "Active"}" data-shop="${esc(shop.id)}">${shop.status === "Active" ? "Pause" : "Open"}</button></td></tr>
        ${open ? `<tr><td colspan="6"><table class="admin-table"><thead><tr><th>Machine</th><th>Size</th><th>Price</th><th>Status</th><th>Shown to customers</th></tr></thead><tbody>
          ${machines.map(m => `<tr><td><strong>${esc(m.id)}</strong><small>${esc(m.label)} / ${esc(m.type)}</small></td><td>${esc((db.SIZES.find(([v]) => v === m.size) || [0, m.size])[1])}</td><td>${peso(m.price)}</td><td>${statusPill(m.status)}</td><td>${esc(m.eta)}</td></tr>`).join("") || '<tr><td colspan="5" class="empty">This shop has not added machines yet.</td></tr>'}
        </tbody></table></td></tr>` : ""}`;
    }).join("");
    $("adminView").innerHTML = `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Shop</th><th>Owner</th><th>Status</th><th>Services &amp; prices</th><th>Machines</th><th></th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" class="empty">No shops yet.</td></tr>'}</tbody></table></div>`;
  }

  function bookingsView() {
    setTitle("All bookings", "Every booking across all shops");
    const term = ui.search.toLowerCase();
    const list = D.bookings.filter(b => (ui.shop === "all" || b.shop_id === ui.shop) && (ui.status === "all" || b.status === ui.status)
      && `${b.id} ${b.customer} ${b.contact} ${b.service || ""} ${b.machine}`.toLowerCase().includes(term));
    const statuses = [...new Set([...db.STATUSES, ...D.bookings.map(b => b.status)])];
    $("adminView").innerHTML = `<div class="admin-toolbar">
        <input id="adminSearch" type="search" placeholder="Search order, customer, machine" value="${esc(ui.search)}">
        <select id="adminShopFilter"><option value="all">All shops</option>${D.shops.map(s => `<option value="${esc(s.id)}" ${ui.shop === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select>
        <select id="adminStatusFilter"><option value="all">All statuses</option>${statuses.map(s => `<option ${ui.status === s ? "selected" : ""}>${esc(s)}</option>`).join("")}</select>
      </div>
      <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Order</th><th>Shop</th><th>Customer</th><th>Service</th><th>Drop-off</th><th>Machine</th><th>Status</th><th>Total</th></tr></thead><tbody>
      ${list.slice(0, 300).map(b => `<tr><td><strong>${esc(b.id)}</strong><small>${b.source === "walk-in" ? "Walk-in" : "Online"}</small></td><td>${esc(shopName(b.shop_id))}</td>
        <td>${esc(b.customer)}<small>${esc(b.contact)}</small></td><td>${esc(b.service || b.type || "-")}</td><td>${esc(db.bookingTime(b))}</td><td>${esc(b.machine)}</td>
        <td><select data-booking-status="${esc(b.id)}">${statuses.map(s => `<option ${s === b.status ? "selected" : ""}>${esc(s)}</option>`).join("")}</select></td><td>${peso(b.total)}</td></tr>`).join("")
        || '<tr><td colspan="8" class="empty">No bookings match.</td></tr>'}
      </tbody></table></div>`;
  }

  function facilities() {
    setTitle("Facility accounts", "Laundry shop owners who use WashWiz");
    const rows = D.staff.map(account => `<tr><td><strong>${esc(account.email || "-")}</strong><small>Joined ${esc(new Date(account.created_at).toLocaleDateString("en-PH"))}</small></td>
      <td>${account.role === "admin" ? '<span class="pill">Admin</span>' : "Facility"}</td><td>${account.role === "admin" ? "All shops" : esc(shopName(account.shop_id))}</td><td>${statusPill(account.status)}</td>
      <td>${account.user_id === me.id || account.role === "admin" ? "" : account.status === "active"
        ? `<button class="btn sm danger" type="button" data-account-status="disabled" data-account="${esc(account.user_id)}">Turn off</button>`
        : `<button class="btn sm primary" type="button" data-account-status="active" data-account="${esc(account.user_id)}">Turn on</button>`}</td></tr>`).join("");
    $("adminView").innerHTML = `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Account</th><th>Type</th><th>Shop</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5" class="empty">No accounts yet.</td></tr>'}</tbody></table></div>
      <p class="note" style="color:var(--muted)">Turning a facility off also pauses its shop, so customers can't book there. Turning it back on reopens the shop.</p>`;
  }

  function chats() {
    setTitle("Chats", "Customer conversations across all shops");
    const thread = D.threads.find(t => t.id === ui.thread) || D.threads[0];
    ui.thread = thread?.id || null;
    const msgs = thread ? D.messages.filter(m => m.thread_id === thread.id) : [];
    $("adminView").innerHTML = `<div class="admin-chat"><div>${D.threads.map(t => `<button class="thread ${t.id === ui.thread ? "active" : ""}" type="button" data-thread="${esc(t.id)}">
        <strong>${esc(t.customer)}</strong> ${statusPill(t.status)}<small>${esc(shopName(t.shop_id))} / ${esc(t.order_id)}</small><small>${esc(t.preview)}</small></button>`).join("") || '<p class="empty">No chats yet.</p>'}</div>
      <div class="admin-card">${thread ? `<strong>${esc(thread.customer)}</strong><small style="display:block;color:var(--muted)">${esc(shopName(thread.shop_id))} / Order ${esc(thread.order_id)}</small>
        <div class="messages" id="adminMessages">${msgs.map(m => `<div class="msg ${m.sender === "Admin" ? "me" : ""}">${esc(m.body)}<small>${m.sender === "Admin" ? "Shop / WashWiz" : "Customer"} / ${esc(db.clock(m.created_at))}</small></div>`).join("")}</div>
        <form class="composer" id="adminReply"><input id="adminReplyInput" maxlength="2000" placeholder="Reply as WashWiz support"><button class="btn primary" type="submit">Send</button></form>`
        : '<p class="empty">Pick a conversation.</p>'}</div></div>`;
    const box = $("adminMessages");
    if (box) box.scrollTop = box.scrollHeight;
  }

  // ---------- actions ----------
  document.addEventListener("click", async event => {
    const nav = event.target.closest("[data-admin-view]");
    if (nav) {
      ui.view = nav.dataset.adminView;
      document.querySelectorAll("[data-admin-view]").forEach(button => button.classList.toggle("active", button === nav));
      render();
    }
    const openShop = event.target.closest("[data-open-shop]");
    if (openShop) { ui.openShop = ui.openShop === openShop.dataset.openShop ? null : openShop.dataset.openShop; render(); }
    const shopButton = event.target.closest("[data-shop-status]");
    if (shopButton) {
      shopButton.disabled = true;
      const { error } = await db.client.from("shops").update({ status: shopButton.dataset.shopStatus }).eq("id", shopButton.dataset.shop);
      if (error) { shopButton.disabled = false; fail(error); } else toast(shopButton.dataset.shopStatus === "Active" ? "Shop is open to customers." : "Shop paused and hidden from customers.");
    }
    const accountButton = event.target.closest("[data-account-status]");
    if (accountButton) {
      accountButton.disabled = true;
      const status = accountButton.dataset.accountStatus;
      const { data: account, error } = await db.client.from("staff").update({ status }).eq("user_id", accountButton.dataset.account).select().single();
      if (error) { accountButton.disabled = false; fail(error); return; }
      if (account?.shop_id) await db.client.from("shops").update({ status: status === "active" ? "Active" : "Paused" }).eq("id", account.shop_id);
      toast(status === "active" ? "Facility turned on and its shop reopened." : "Facility turned off and its shop paused.");
    }
    const thread = event.target.closest("[data-thread]");
    if (thread) { ui.thread = thread.dataset.thread; render(); }
  });

  document.addEventListener("change", async event => {
    if (event.target.id === "adminShopFilter") { ui.shop = event.target.value; render(); }
    if (event.target.id === "adminStatusFilter") { ui.status = event.target.value; render(); }
    const booking = event.target.closest("[data-booking-status]");
    if (booking) {
      const { error } = await db.client.from("bookings").update({ status: booking.value }).eq("id", booking.dataset.bookingStatus);
      if (error) fail(error); else toast(`Order ${booking.dataset.bookingStatus} set to ${booking.value}.`);
    }
  });
  document.addEventListener("input", event => {
    if (event.target.id === "adminSearch") { ui.search = event.target.value; const pos = event.target.selectionStart; bookingsView(); $("adminSearch").focus(); $("adminSearch").setSelectionRange(pos, pos); }
  });
  document.addEventListener("submit", async event => {
    if (event.target.id !== "adminReply") return;
    event.preventDefault();
    const input = $("adminReplyInput");
    const body = input.value.trim();
    if (!body || !ui.thread) return;
    const { error } = await db.client.from("support_messages").insert({ thread_id: ui.thread, sender: "Admin", body });
    if (error) { fail(error); return; }
    await db.client.from("support_threads").update({ preview: body, status: "active", urgency: "Live Active", updated_at: new Date().toISOString() }).eq("id", ui.thread);
    input.value = "";
    input.blur();
  });

  $("adminSignOut").addEventListener("click", async () => {
    await db.client.auth.signOut();
    location.replace("staff-login.html");
  });

  // ---------- start: admins only ----------
  (async () => {
    const { data: { session } } = await db.client.auth.getSession();
    if (!session) { location.replace("staff-login.html"); return; }
    const { data: staff } = await db.client.from("staff").select("role,status").eq("user_id", session.user.id).maybeSingle();
    if (!staff || staff.role !== "admin" || staff.status !== "active") { await db.client.auth.signOut(); location.replace("staff-login.html"); return; }
    me = session.user;
    $("adminEmail").textContent = me.email;
    $("adminApp").classList.remove("hidden");
    await load();
    const refresh = db.debounce(load, 300);
    const channel = db.client.channel("admin-all");
    ["shops", "machines", "bookings", "staff", "support_threads", "support_messages"].forEach(table =>
      channel.on("postgres_changes", { event: "*", schema: "public", table }, refresh));
    channel.subscribe();
  })();
})();
