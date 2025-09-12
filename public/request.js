document.getElementById("requestForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(`${BASE_URL}/request-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, phone, password })
    });

    const data = await response.json();
    document.getElementById("message").innerText = data.message || "Request submitted!";
  } catch (err) {
    document.getElementById("message").innerText = "Error: " + err.message;
  }
});
