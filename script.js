let lightOn = false;

const button = document.getElementById("toggleBtn");
const status = document.getElementById("status");

button.addEventListener("click", () => {
  lightOn = !lightOn;

  if (lightOn) {
    button.textContent = "Turn Light OFF";
    status.textContent = "Light is ON";
    status.style.color = "green";
  } else {
    button.textContent = "Turn Light ON";
    status.textContent = "Light is OFF";
    status.style.color = "red";
  }
});
