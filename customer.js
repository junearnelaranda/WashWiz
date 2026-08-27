const mockCustomerOrder = {
  id: "LW7K4M9Q2X8R6P3",
  status: "Processing",
  expectedCompletion: "August 30, 2026"
};

const customerById = id => document.getElementById(id);

function setCustomerSection(sectionId) {
  document.querySelectorAll("[data-customer-section]").forEach(button => {
    const active = button.dataset.customerSection === sectionId;
    button.classList.toggle("active", active);
    button.classList.toggle("primary-btn", active);
    button.classList.toggle("secondary-btn", !active);
  });
  document.querySelectorAll(".customer-section").forEach(section => {
    section.classList.toggle("active-customer-section", section.id === sectionId);
  });
}

function setMessage(id, type, text) {
  const message = customerById(id);
  message.className = `verification-message ${type}`;
  message.textContent = text;
}

document.querySelectorAll("[data-customer-section]").forEach(button => {
  button.addEventListener("click", () => setCustomerSection(button.dataset.customerSection));
});

customerById("customerBookingForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = customerById("bookingName").value.trim();
  const service = customerById("bookingService").value.trim();
  const time = customerById("bookingTime").value.trim();

  setMessage("bookingMessage", "loading", "Sending booking request...");
  window.setTimeout(() => {
    setMessage("bookingMessage", "success", `${name}, your ${service} booking request for ${time} has been received.`);
    event.target.reset();
  }, 650);
});

customerById("customerVerificationForm").addEventListener("submit", event => {
  event.preventDefault();
  const orderId = customerById("customerOrderId").value.trim().toUpperCase();
  const fullName = customerById("customerFullName").value.trim();
  const button = customerById("customerVerifyButton");

  button.disabled = true;
  button.textContent = "Verifying...";
  setMessage("customerVerificationMessage", "loading", "Checking order...");

  window.setTimeout(() => {
    button.disabled = false;
    button.textContent = "Verify Order";

    if (orderId === mockCustomerOrder.id && fullName.length > 1) {
      setMessage(
        "customerVerificationMessage",
        "success",
        `Order verified. Status: ${mockCustomerOrder.status}. Expected completion: ${mockCustomerOrder.expectedCompletion}.`
      );
      return;
    }

    setMessage("customerVerificationMessage", "error", "Order ID or full name is incorrect.");
  }, 700);
});
