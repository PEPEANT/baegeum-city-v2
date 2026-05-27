import {
  SIMULACRA_GAME_MODULE_STATUS,
  SIMULACRA_WORLD_COMMON_MODULES,
  listSimulacraGameModules,
  getSimulacraGameModule,
  validateSimulacraWorldGameModuleContract
} from "./simulacra-world-game-module-contract.js";

export const SIMULACRA_WORLD_SHELL_VERSION = "2026-05-28.1";
export const SIMULACRA_WORLD_SHELL_ID = "simulacra-world";

const STATUS_LABELS = Object.freeze({
  [SIMULACRA_GAME_MODULE_STATUS.ACTIVE]: "ready",
  [SIMULACRA_GAME_MODULE_STATUS.CANDIDATE]: "candidate",
  [SIMULACRA_GAME_MODULE_STATUS.REFERENCE]: "reference"
});

const ACTIVE_GAME_ROUTES = Object.freeze({
  "singularity-race": "singularity-race.html?devOnline=1"
});

function summarizeGameModule(module) {
  const launchable = module.status === SIMULACRA_GAME_MODULE_STATUS.ACTIVE && module.role === "derived-game";
  return Object.freeze({
    gameId: module.gameId,
    title: module.title,
    koreanTitle: module.koreanTitle,
    status: module.status,
    statusLabel: STATUS_LABELS[module.status] || "unknown",
    role: module.role,
    launchable,
    commonModules: Object.freeze([...(module.commonModules || [])]),
    ownedSystems: Object.freeze([...(module.ownedSystems || [])])
  });
}

export function createSimulacraWorldShellSnapshot(options = {}) {
  const currentGameId = options.currentGameId || "singularity-race";
  const games = Object.freeze(listSimulacraGameModules().map(summarizeGameModule));
  const currentGame = games.find((game) => game.gameId === currentGameId) || null;

  return Object.freeze({
    shellId: SIMULACRA_WORLD_SHELL_ID,
    title: "Simulacra World",
    koreanTitle: "시뮬라크월드",
    version: SIMULACRA_WORLD_SHELL_VERSION,
    currentGameId: currentGame?.gameId || null,
    currentGame,
    commonModules: Object.freeze(SIMULACRA_WORLD_COMMON_MODULES.map((module) => Object.freeze({ ...module }))),
    games,
    launchableGameIds: Object.freeze(games.filter((game) => game.launchable).map((game) => game.gameId)),
    candidateGameIds: Object.freeze(games.filter((game) => game.status === SIMULACRA_GAME_MODULE_STATUS.CANDIDATE).map((game) => game.gameId)),
    referenceGameIds: Object.freeze(games.filter((game) => game.status === SIMULACRA_GAME_MODULE_STATUS.REFERENCE).map((game) => game.gameId)),
    mode: "registry-diagnostic"
  });
}

export function createSimulacraWorldGameLaunch(gameId) {
  const module = getSimulacraGameModule(gameId);
  if (!module) {
    return Object.freeze({ ok: false, gameId, reason: "unknown-game" });
  }
  if (module.status !== SIMULACRA_GAME_MODULE_STATUS.ACTIVE || module.role !== "derived-game") {
    return Object.freeze({ ok: false, gameId, reason: `${module.status}-not-launchable` });
  }
  const href = ACTIVE_GAME_ROUTES[gameId];
  if (!href) {
    return Object.freeze({ ok: false, gameId, reason: "route-not-configured" });
  }
  return Object.freeze({
    ok: true,
    gameId,
    title: module.title,
    href,
    reason: "active-derived-game"
  });
}

export function validateSimulacraWorldShellContract() {
  const errors = [];
  const registryValidation = validateSimulacraWorldGameModuleContract();
  if (!registryValidation.ok) errors.push(...registryValidation.errors);

  const snapshot = createSimulacraWorldShellSnapshot();
  const singularityLaunch = createSimulacraWorldGameLaunch("singularity-race");
  const drawingLaunch = createSimulacraWorldGameLaunch("drawing-world");
  const ironLineLaunch = createSimulacraWorldGameLaunch("iron-line-ops");

  if (snapshot.shellId !== SIMULACRA_WORLD_SHELL_ID) errors.push("shell id mismatch");
  if (snapshot.currentGameId !== "singularity-race") errors.push("default current game must be Singularity Race");
  if (snapshot.launchableGameIds.length !== 1 || snapshot.launchableGameIds[0] !== "singularity-race") {
    errors.push("only Singularity Race should be launchable in this slice");
  }
  if (!snapshot.candidateGameIds.includes("drawing-world")) errors.push("Drawing World must appear as candidate");
  if (!snapshot.referenceGameIds.includes("iron-line-ops")) errors.push("Iron Line must appear as reference");
  if (!singularityLaunch.ok || !singularityLaunch.href.includes("singularity-race.html")) {
    errors.push("Singularity Race launch route must be configured");
  }
  if (drawingLaunch.ok) errors.push("Drawing World candidate must not launch yet");
  if (ironLineLaunch.ok) errors.push("Iron Line reference must not launch");

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors)
  });
}
