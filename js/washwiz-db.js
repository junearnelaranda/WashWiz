"use strict";

// WashWiz <-> Supabase: one shared client and the mapping between database rows and the shapes the pages use.
// The anon key is public by design; Row Level Security in the database decides what each visitor can read or change.
window.WashWizDB = (() => {
  const SUPABASE_URL = "https://wvvmdyyklxzpiealkdco.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2dm1keXlrbHh6cGllYWxrZGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNzA0NzQsImV4cCI6MjExMDc0NjQ3NH0.UTu8RvWCSmK7TynZPjDIAeiPmj_SRfFx8Mw6K6lZ5CM";
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const BUSY = ["Processing", "In Cycle", "Drying"];
  const DONE = ["Ready for Pickup", "Completed", "Cancelled"];
  const STATUSES = ["Requested", "Confirmed", "Processing", "In Cycle", "Drying", "Ready for Pickup", "Completed", "Paid", "Cancelled"];
  const SIZES = [["small", "Small"], ["medium", "Medium"], ["large", "Large"], ["xl", "XLarge"]];

  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const errorText = error => (error && (error.message || error.error_description)) || "Something went wrong. Please try again.";

  function bookingTime(row) {
    if (!row.booking_date) return row.booking_time || "";
    const day = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(new Date(`${row.booking_date}T00:00:00`));
    return row.booking_time ? `${day}, ${row.booking_time}` : day;
  }

  // Database booking row -> the booking shape app.js already uses.
  function toBooking(row) {
    return {
      id: row.id,
      shopId: row.shop_id,
      facility: row.facility,
      customer: row.customer,
      contact: row.contact || "",
      machine: row.machine || "Unassigned",
      type: row.service || row.type || "Laundry service",
      service: row.service,
      status: row.status || "Requested",
      source: row.source,
      date: row.booking_date,
      time: bookingTime(row),
      notes: row.notes || "",
      total: Number(row.total) || 0,
      createdAt: row.created_at
    };
  }

  function lastSeen(ts) {
    const seconds = (Date.now() - new Date(ts)) / 1000;
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Date(ts).toLocaleDateString("en-PH");
  }
  const clock = ts => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  function toThread(row, messages) {
    return {
      id: row.id,
      customer: row.customer,
      orderId: row.order_id,
      machine: row.machine,
      machineLabel: row.machine_label,
      status: row.status,
      urgency: row.urgency,
      lastSeen: lastSeen(row.updated_at),
      eta: row.eta,
      total: Number(row.total) || 0,
      paid: row.paid,
      tag: row.tag,
      preview: row.preview,
      messages: messages.map(m => ({ sender: m.sender, body: m.body, time: clock(m.created_at) }))
    };
  }

  // Re-run `fn` at most once per `ms` while realtime events arrive in bursts.
  function debounce(fn, ms = 250) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
  }

  // Replace an array's contents in place (pages hold references to these arrays).
  function replaceAll(target, items) {
    target.splice(0, target.length, ...items);
  }

  return { client, BUSY, DONE, STATUSES, SIZES, escape, errorText, toBooking, toThread, bookingTime, debounce, replaceAll, clock };
})();
