const lightsContainer = document.getElementById("lightsContainer");
const API_URL = "https://lighting-backend-vtj8.onrender.com";

// Fetch lights from backend
async function fetchLights() {
  const res = await fetch(`${API_URL}/lights`);
  const lights = await res.json();
  renderLights(lights);
}

// Render lights with buttons
function renderLights(lights) {
  lightsContainer.innerHTML = ""; // Clear previous
  lights.forEach(light => {
    const div = document.createElement("div");
    div.className = "light";

    div.innerHTML = `
      <span>${light.name}: ${light.status ? "ON" : "OFF"}</span>
      <button onclick="toggleLight(${light.id})">Toggle</button>
    `;
    lightsContainer.appendChild(div);
  });
}

// Toggle light status
async function toggleLight(id) {
  const res = await fetch(`${API_URL}/lights/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });
  const updatedLight = await res.json();
  fetchLights(); // Refresh lights
}

// Initial load
fetchLights();
