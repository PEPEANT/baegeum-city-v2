export const SIMULACRA_WORLD_GAME_MODULE_CONTRACT_VERSION = "2026-05-28.1";

export const SIMULACRA_GAME_MODULE_STATUS = Object.freeze({
  ACTIVE: "active",
  CANDIDATE: "candidate",
  REFERENCE: "reference"
});

export const SIMULACRA_WORLD_COMMON_MODULES = Object.freeze([
  Object.freeze({ moduleId: "choice-system", label: "choice system" }),
  Object.freeze({ moduleId: "smartphone-ui", label: "smartphone UI" }),
  Object.freeze({ moduleId: "job-system", label: "job system" }),
  Object.freeze({ moduleId: "money-dpay-ledger", label: "money and DPay ledger" }),
  Object.freeze({ moduleId: "npc-affinity", label: "NPC affinity" }),
  Object.freeze({ moduleId: "stock-market", label: "stock market" }),
  Object.freeze({ moduleId: "save-system", label: "save system" }),
  Object.freeze({ moduleId: "chat-channel", label: "chat channel" }),
  Object.freeze({ moduleId: "asset-registry", label: "asset registry" }),
  Object.freeze({ moduleId: "online-room-admin", label: "online room admin" })
]);

export const SIMULACRA_WORLD_GAME_MODULES = Object.freeze([
  Object.freeze({
    gameId: "singularity-race",
    title: "Singularity Race",
    koreanTitle: "특이점레이스",
    status: SIMULACRA_GAME_MODULE_STATUS.ACTIVE,
    role: "derived-game",
    source: "singularity-race.html and src/restored/games",
    ownedSystems: Object.freeze([
      "race-loop",
      "runner-input",
      "track-camera",
      "combat-skill",
      "checkpoint-finish",
      "marathon-server-authority"
    ]),
    commonModules: Object.freeze([
      "save-system",
      "chat-channel",
      "asset-registry",
      "online-room-admin"
    ]),
    notes: "First active derived game. Keep runtime migration incremental."
  }),
  Object.freeze({
    gameId: "drawing-world",
    title: "Drawing World",
    koreanTitle: "드로잉월드",
    status: SIMULACRA_GAME_MODULE_STATUS.CANDIDATE,
    role: "derived-game-candidate",
    source: "PEPEANT/-drawing-world",
    ownedSystems: Object.freeze([
      "drawing-loop",
      "canvas-tools",
      "skin-card-reference",
      "social-drawing-flow"
    ]),
    commonModules: Object.freeze([
      "smartphone-ui",
      "asset-registry",
      "chat-channel",
      "save-system"
    ]),
    notes: "Second candidate. Reference skin tone and drawing flow before importing code."
  }),
  Object.freeze({
    gameId: "iron-line-ops",
    title: "Iron Line Ops Reference",
    koreanTitle: "아이언라인 운영 참고",
    status: SIMULACRA_GAME_MODULE_STATUS.REFERENCE,
    role: "ops-reference",
    source: "PEPEANT/Iron-Line---2D-Tank-Prototype",
    ownedSystems: Object.freeze([]),
    commonModules: Object.freeze([
      "online-room-admin",
      "chat-channel"
    ]),
    allowedReferences: Object.freeze([
      "room-list",
      "spectator-management",
      "admin-camera",
      "host-controls"
    ]),
    forbiddenImports: Object.freeze([
      "tank-combat-loop",
      "commander-ai",
      "tactical-combat-ui"
    ]),
    notes: "Reference only. Do not promote tank gameplay into the common engine."
  })
]);

export function listSimulacraCommonModuleIds() {
  return Object.freeze(SIMULACRA_WORLD_COMMON_MODULES.map((module) => module.moduleId));
}

export function listSimulacraGameModules() {
  return SIMULACRA_WORLD_GAME_MODULES;
}

export function getSimulacraGameModule(gameId) {
  return SIMULACRA_WORLD_GAME_MODULES.find((module) => module.gameId === gameId) || null;
}

export function validateSimulacraWorldGameModuleContract() {
  const errors = [];
  const commonModuleIds = new Set(listSimulacraCommonModuleIds());
  const gameIds = new Set();

  for (const requiredModuleId of [
    "choice-system",
    "smartphone-ui",
    "job-system",
    "money-dpay-ledger",
    "npc-affinity",
    "stock-market",
    "save-system",
    "chat-channel",
    "asset-registry",
    "online-room-admin"
  ]) {
    if (!commonModuleIds.has(requiredModuleId)) {
      errors.push(`missing common module: ${requiredModuleId}`);
    }
  }

  for (const module of SIMULACRA_WORLD_GAME_MODULES) {
    if (!module.gameId) errors.push("game module requires gameId");
    if (gameIds.has(module.gameId)) errors.push(`duplicate gameId: ${module.gameId}`);
    gameIds.add(module.gameId);
    if (!Object.values(SIMULACRA_GAME_MODULE_STATUS).includes(module.status)) {
      errors.push(`${module.gameId} has invalid status: ${module.status}`);
    }
    for (const moduleId of module.commonModules || []) {
      if (!commonModuleIds.has(moduleId)) {
        errors.push(`${module.gameId} consumes unknown common module: ${moduleId}`);
      }
    }
  }

  const [firstModule] = SIMULACRA_WORLD_GAME_MODULES;
  const singularityRace = getSimulacraGameModule("singularity-race");
  const drawingWorld = getSimulacraGameModule("drawing-world");
  const ironLineOps = getSimulacraGameModule("iron-line-ops");

  if (!singularityRace || firstModule?.gameId !== "singularity-race") {
    errors.push("Singularity Race must stay the first registered derived game.");
  } else if (singularityRace.status !== SIMULACRA_GAME_MODULE_STATUS.ACTIVE) {
    errors.push("Singularity Race must stay active.");
  }

  if (!drawingWorld || drawingWorld.status !== SIMULACRA_GAME_MODULE_STATUS.CANDIDATE) {
    errors.push("Drawing World must stay a candidate until a migration slice is approved.");
  }

  if (!ironLineOps || ironLineOps.status !== SIMULACRA_GAME_MODULE_STATUS.REFERENCE) {
    errors.push("Iron Line must stay reference-only.");
  } else {
    if (ironLineOps.role !== "ops-reference") {
      errors.push("Iron Line reference must not become a derived game role.");
    }
    if (!ironLineOps.forbiddenImports?.includes("tank-combat-loop")) {
      errors.push("Iron Line reference must explicitly block tank combat imports.");
    }
  }

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors)
  });
}
