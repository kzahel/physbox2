import { Game } from "./engine/Game";
import { InputManager } from "./interaction/InputManager";
import { SettingsPane } from "./ui/SettingsPane";
import { Toolbar } from "./ui/Toolbar";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const game = new Game(canvas);
const input = new InputManager(game);
game.inputManager = input;
game.renderer.setInputManager(input);

new Toolbar(document.getElementById("toolbar")!, input);
new SettingsPane(document.getElementById("settings")!, game);

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
