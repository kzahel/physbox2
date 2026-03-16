import { Game } from "./engine/Game";
import { InputManager } from "./interaction/InputManager";
import { TiltGravity } from "./interaction/TiltGravity";
import { SettingsPane } from "./ui/SettingsPane";
import { Toolbar } from "./ui/Toolbar";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const game = new Game(canvas);
const input = new InputManager(game);
game.inputManager = input;
game.renderer.setInputManager(input);

new Toolbar(document.getElementById("toolbar")!, input);
new SettingsPane(document.getElementById("settings")!, game);

// Play/Pause button
const playPauseBtn = document.getElementById("play-pause")!;
const updatePlayPause = () => {
  playPauseBtn.textContent = game.paused ? "\u25B6" : "\u23F8";
};
playPauseBtn.addEventListener("click", () => {
  game.paused = !game.paused;
  updatePlayPause();
});
// Sync when paused via spacebar or settings pane
game.onPauseChange = updatePlayPause;

// Bottom tools
const bottomTools = document.getElementById("bottom-tools")!;
if (TiltGravity.isSupported()) {
  const tilt = new TiltGravity(game);
  const tiltBtn = document.createElement("button");
  tiltBtn.textContent = "Tilt Gravity";
  tiltBtn.addEventListener("click", async () => {
    const on = await tilt.toggle();
    tiltBtn.classList.toggle("active", on);
    tiltBtn.textContent = on ? "Tilt: ON" : "Tilt Gravity";
  });
  bottomTools.appendChild(tiltBtn);
}

// Mobile hamburger sidebar toggle
const hamburger = document.getElementById("hamburger")!;
const settings = document.getElementById("settings")!;
const overlay = document.getElementById("sidebar-overlay")!;

function toggleSidebar(open?: boolean) {
  const isOpen = open ?? !settings.classList.contains("open");
  settings.classList.toggle("open", isOpen);
  overlay.classList.toggle("open", isOpen);
}

hamburger.addEventListener("click", () => toggleSidebar());
overlay.addEventListener("click", () => toggleSidebar(false));

game.start();
