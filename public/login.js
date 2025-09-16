const form = document.getElementById("loginForm");
const message = document.getElementById("message");
const passwordInput = document.getElementById("password");
const showPasswordBtn = document.getElementById("showPassword");

// Show password while holding the button
showPasswordBtn.addEventListener("mousedown", () => {
  passwordInput.type = "text";
});

showPasswordBtn.addEventListener("mouseup", () => {
  passwordInput.type = "password";
});

showPasswordBtn.addEventListener("mouseleave", () => {
  passwordInput.type = "password"; // hide if mouse leaves button
});

// Handle form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = passwordInput.value;

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (data.success) {
    window.location.href = "/dashboard.html";
    message.textContent = "Login successful!";
    message.style.color = "green";
  } else {
    message.textContent = data.message;
    message.style.color = "red";
  }
});
