const form = document.getElementById("loginForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (data.success) {
    // Redirect to main dashboard (we can make this next)
    window.location.href = "/index.html"; // redirect to dashboard
    message.textContent = "Login successful!";
    message.style.color = "green";
  } else {
    message.textContent = data.message;
    message.style.color = "red";
  }
});

