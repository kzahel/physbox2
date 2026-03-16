import type { Game } from "../engine/Game";
import { deleteScene, listScenes, loadScene, saveScene } from "../engine/SceneStore";

export class SettingsPane {
  private scenesListEl!: HTMLElement;
  private game: Game;

  constructor(container: HTMLElement, game: Game) {
    this.game = game;

    container.innerHTML = `
      <div class="section-title">Simulation</div>
      <label>Gravity <input type="range" id="s-gravity" min="-30" max="10" step="0.5" value="${game.gravity}"></label>
      <label>Speed <input type="range" id="s-speed" min="0" max="3" step="0.1" value="${game.timeScale}"></label>
      <label>Solver Iters <input type="range" id="s-iters" min="1" max="20" step="1" value="${game.positionIterations}"></label>

      <div class="section-title">Actions</div>
      <label><button id="s-clear">Clear Dynamic</button></label>
      <label><button id="s-reset">Reset Scene</button></label>
      <label><button id="s-pause">${game.paused ? "Play" : "Pause"}</button></label>
      <label><button id="s-fullscreen">Fullscreen</button></label>

      <div class="section-title">Scenes</div>
      <div class="scene-save-row">
        <input type="text" id="s-scene-name" placeholder="Scene name" maxlength="40" />
        <button id="s-save">Save</button>
      </div>
      <div id="s-scenes-list" class="scenes-list"></div>

      <div id="stats"></div>
    `;

    const gravSlider = container.querySelector<HTMLInputElement>("#s-gravity")!;
    gravSlider.addEventListener("input", () => game.setGravity(parseFloat(gravSlider.value)));

    const speedSlider = container.querySelector<HTMLInputElement>("#s-speed")!;
    speedSlider.addEventListener("input", () => {
      game.timeScale = parseFloat(speedSlider.value);
    });

    const itersSlider = container.querySelector<HTMLInputElement>("#s-iters")!;
    itersSlider.addEventListener("input", () => {
      const v = parseInt(itersSlider.value);
      game.positionIterations = v;
      game.velocityIterations = Math.max(v * 2, 4);
    });

    container.querySelector("#s-clear")!.addEventListener("click", () => game.clearDynamic());
    container.querySelector("#s-reset")!.addEventListener("click", () => game.reset());

    const pauseBtn = container.querySelector<HTMLButtonElement>("#s-pause")!;
    pauseBtn.addEventListener("click", () => {
      game.paused = !game.paused;
    });
    const prevOnPause = game.onPauseChange;
    game.onPauseChange = () => {
      prevOnPause?.();
      pauseBtn.textContent = game.paused ? "Play" : "Pause";
    };

    const fsBtn = container.querySelector<HTMLButtonElement>("#s-fullscreen")!;
    fsBtn.addEventListener("click", () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    });
    document.addEventListener("fullscreenchange", () => {
      fsBtn.textContent = document.fullscreenElement ? "Exit Fullscreen" : "Fullscreen";
    });

    // Scene save/load
    const nameInput = container.querySelector<HTMLInputElement>("#s-scene-name")!;
    const saveBtn = container.querySelector<HTMLButtonElement>("#s-save")!;
    this.scenesListEl = container.querySelector("#s-scenes-list")!;

    saveBtn.addEventListener("click", async () => {
      const name = nameInput.value.trim();
      if (!name) return;
      await saveScene(name, game);
      nameInput.value = "";
      this.refreshScenesList();
    });

    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveBtn.click();
      e.stopPropagation(); // prevent WASD camera pan while typing
    });
    nameInput.addEventListener("keyup", (e) => e.stopPropagation());

    this.refreshScenesList();

    // Stats update
    const statsEl = container.querySelector("#stats")!;
    setInterval(() => {
      statsEl.textContent = `FPS: ${game.fps} | Bodies: ${game.bodyCount}`;
    }, 500);
  }

  private async refreshScenesList() {
    const scenes = await listScenes();
    if (scenes.length === 0) {
      this.scenesListEl.innerHTML = '<div class="scenes-empty">No saved scenes</div>';
      return;
    }

    this.scenesListEl.innerHTML = scenes
      .map(
        (s) => `
      <div class="scene-item" data-name="${s.name.replace(/"/g, "&quot;")}">
        <span class="scene-name">${s.name}</span>
        <div class="scene-actions">
          <button class="scene-load" title="Load">&#9654;</button>
          <button class="scene-delete" title="Delete">&times;</button>
        </div>
      </div>
    `,
      )
      .join("");

    this.scenesListEl.querySelectorAll(".scene-load").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const item = (e.target as HTMLElement).closest(".scene-item") as HTMLElement;
        const name = item.dataset.name!;
        await loadScene(name, this.game);
      });
    });

    this.scenesListEl.querySelectorAll(".scene-delete").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const item = (e.target as HTMLElement).closest(".scene-item") as HTMLElement;
        const name = item.dataset.name!;
        await deleteScene(name);
        this.refreshScenesList();
      });
    });
  }
}
