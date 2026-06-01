export const RESTORED_ASSET_MANIFEST_VERSION = "restored-asset-manifest-001";

export const RESTORED_AUDIO_ROLES = Object.freeze([
  "bgm",
  "sfx",
  "voice",
  "ambience"
]);

export const RESTORED_IMAGE_ROLES = Object.freeze([
  "character",
  "partner",
  "item",
  "background",
  "ui",
  "city",
  "casino",
  "phone",
  "race",
  "skill",
  "skin",
  "stadium",
  "preview",
  "reference"
]);

export const RESTORED_ASSET_STATUSES = Object.freeze([
  "active",
  "available",
  "planned",
  "source-only",
  "needs-review",
  "intake-staged",
  "legacy-active",
  "legacy-available",
  "legacy-reference"
]);
const RESTORED_INBOX_ASSET_PREFIX = ["assets", "inbox", ""].join("/");

export const RESTORED_ALLOWED_EXTENSIONS = Object.freeze({
  audio: Object.freeze([".mp3", ".ogg", ".wav"]),
  image: Object.freeze([".png", ".jpg", ".jpeg", ".webp", ".svg"])
});

export const RESTORED_ASSET_MANIFEST = Object.freeze([
  {
    id: "audio:bgm:reclaim-2-5:0",
    type: "audio",
    role: "bgm",
    path: "assets/audio/ost/reclaim-2.5/bgm_0.mp3",
    source: "dis-site reclaim-2.5",
    sourceRef: "assets/audio/ost/VENDOR.md",
    status: "legacy-active"
  },
  {
    id: "audio:bgm:reclaim-2-5:1",
    type: "audio",
    role: "bgm",
    path: "assets/audio/ost/reclaim-2.5/bgm_1.mp3",
    source: "dis-site reclaim-2.5",
    sourceRef: "assets/audio/ost/VENDOR.md",
    status: "legacy-available"
  },
  {
    id: "audio:bgm:reclaim-2-5:2",
    type: "audio",
    role: "bgm",
    path: "assets/audio/ost/reclaim-2.5/bgm_2.mp3",
    source: "dis-site reclaim-2.5",
    sourceRef: "assets/audio/ost/VENDOR.md",
    status: "legacy-available"
  },
  { id: "audio:bgm:singularity-race:squid-wake", type: "audio", role: "bgm", path: "assets/restored/audio/singularity-race/bgm/squid-wake.mp3", source: "user-provided local mp3 for Singularity Race private prototype", status: "active", collection: "singularity-race" },
  { id: "audio:bgm:singularity-race:modern-future-world", type: "audio", role: "bgm", path: "assets/restored/audio/singularity-race/bgm/modern-future-world.mp3", source: "user-provided local mp3 for Singularity Race launcher/lobby playlist", status: "active", collection: "singularity-race" },
  { id: "audio:bgm:singularity-race:atlas-futuristic", type: "audio", role: "bgm", path: "assets/restored/audio/singularity-race/bgm/atlas-futuristic.mp3", source: "user-provided local mp3 for Singularity Race launcher/lobby playlist", status: "active", collection: "singularity-race" },
  { id: "audio:bgm:singularity-race:dont-stop-me", type: "audio", role: "bgm", path: "assets/restored/audio/singularity-race/bgm/dont-stop-me.mp3", source: "user-provided local mp3 for Singularity Race private prototype", status: "active", collection: "singularity-race" },
  { id: "audio:bgm:singularity-race:tjie-she-pen", type: "audio", role: "bgm", path: "assets/restored/audio/singularity-race/bgm/tjie-she-pen.mp3", source: "user-provided local mp3 for Singularity Race private prototype", status: "active", collection: "singularity-race" },
  { id: "audio:sfx:singularity-race:countdown-bell", type: "audio", role: "sfx", path: "assets/restored/audio/singularity-race/sfx/countdown-bell.mp3", source: "user-provided local mp3 for Singularity Race 10-second countdown cue", status: "active", collection: "singularity-race" },
  { id: "audio:sfx:singularity-race:attack-swipe", type: "audio", role: "sfx", path: "assets/restored/audio/singularity-race/sfx/attack-swipe.mp3", source: "generated locally with ffmpeg for Singularity Race attack feedback", status: "active", collection: "singularity-race" },
  { id: "audio:sfx:singularity-race:item-pickup", type: "audio", role: "sfx", path: "assets/restored/audio/singularity-race/sfx/item-pickup.mp3", source: "generated locally with ffmpeg for Singularity Race item pickup feedback", status: "active", collection: "singularity-race" },
  { id: "audio:sfx:singularity-race:item-use", type: "audio", role: "sfx", path: "assets/restored/audio/singularity-race/sfx/item-use.mp3", source: "generated locally with ffmpeg for Singularity Race item use feedback", status: "active", collection: "singularity-race" },
  { id: "audio:sfx:singularity-race:item-hit", type: "audio", role: "sfx", path: "assets/restored/audio/singularity-race/sfx/item-hit.mp3", source: "generated locally with ffmpeg for Singularity Race item hit feedback", status: "active", collection: "singularity-race" },
  { id: "audio:sfx:singularity-race:skill-use", type: "audio", role: "sfx", path: "assets/restored/audio/singularity-race/sfx/skill-use.mp3", source: "generated locally with ffmpeg for Singularity Race skill feedback", status: "active", collection: "singularity-race" },
  { id: "audio:sfx:singularity-race:winner-finish", type: "audio", role: "sfx", path: "assets/restored/audio/singularity-race/sfx/winner-finish.mp3", source: "user-provided local mp3 for Singularity Race winner finish cue", status: "active", collection: "singularity-race" },
  { id: "audio:sfx:singularity-race:podium-applause", type: "audio", role: "sfx", path: "assets/restored/audio/singularity-race/sfx/podium-applause.mp3", source: "user-provided local mp3 for Singularity Race podium applause", status: "active", collection: "singularity-race" },
  { id: "audio:sfx:singularity-race:ui-tap", type: "audio", role: "sfx", path: "assets/restored/audio/singularity-race/sfx/ui-tap.mp3", source: "generated locally with ffmpeg for Singularity Race UI tap feedback", status: "active", collection: "singularity-race" },
  { id: "audio:sfx:singularity-race:ui-confirm", type: "audio", role: "sfx", path: "assets/restored/audio/singularity-race/sfx/ui-confirm.mp3", source: "generated locally with ffmpeg for Singularity Race UI confirm feedback", status: "active", collection: "singularity-race" },
  { id: "audio:sfx:singularity-race:ui-toggle", type: "audio", role: "sfx", path: "assets/restored/audio/singularity-race/sfx/ui-toggle.mp3", source: "generated locally with ffmpeg for Singularity Race UI toggle feedback", status: "active", collection: "singularity-race" },
  { id: "audio:sfx:singularity-race:ui-deny", type: "audio", role: "sfx", path: "assets/restored/audio/singularity-race/sfx/ui-deny.mp3", source: "generated locally with ffmpeg for Singularity Race blocked UI feedback", status: "active", collection: "singularity-race" },
  {
    id: "image:reference:tank:abrams-style-2d",
    type: "image",
    role: "reference",
    path: "assets/abrams_style_tank_2d.svg",
    source: "local generated reference",
    status: "legacy-reference"
  },
  {
    id: "image:preview:tank:abrams-style-2d",
    type: "image",
    role: "preview",
    path: "assets/abrams_style_tank_2d_preview.png",
    source: "local generated preview",
    status: "legacy-reference"
  },
  {
    id: "image:reference:tank:abrams-style-topview",
    type: "image",
    role: "reference",
    path: "assets/abrams_style_tank_topview.svg",
    source: "local generated reference",
    status: "legacy-reference"
  },
  {
    id: "image:preview:tank:abrams-style-topview",
    type: "image",
    role: "preview",
    path: "assets/abrams_style_tank_topview_preview.png",
    source: "local generated preview",
    status: "legacy-reference"
  },
  { id: "image:race:singularity-race:launcher-banner", type: "image", role: "race", path: "assets/singularity-race/banner-qorud.png", source: "user-provided desktop banner for Singularity Race launcher", status: "active", collection: "singularity-race" },
  {
    id: "image:race:singularity-race:narration-intro-1",
    type: "image",
    role: "race",
    path: "assets/singularity-race/narration/intro-1.png",
    source: "user-provided chroma-key frame, locally processed", status: "active",
    collection: "singularity-race"
  },
  {
    id: "image:race:singularity-race:narration-intro-2",
    type: "image",
    role: "race",
    path: "assets/singularity-race/narration/intro-2.png",
    source: "user-provided chroma-key frame, locally processed", status: "active",
    collection: "singularity-race"
  },
  {
    id: "image:race:singularity-race:narration-intro-3",
    type: "image",
    role: "race",
    path: "assets/singularity-race/narration/intro-3.png",
    source: "user-provided chroma-key frame, locally processed", status: "active",
    collection: "singularity-race"
  },
  {
    id: "image:race:singularity-race:narration-intro-4",
    type: "image",
    role: "race",
    path: "assets/singularity-race/narration/intro-4.png",
    source: "user-provided chroma-key frame, locally processed", status: "active",
    collection: "singularity-race"
  }
]);

function getExtension(assetPath) {
  const normalized = assetPath.toLowerCase();
  const dotIndex = normalized.lastIndexOf(".");
  return dotIndex === -1 ? "" : normalized.slice(dotIndex);
}

export function getRestoredAssetById(assetId) {
  return RESTORED_ASSET_MANIFEST.find((asset) => asset.id === assetId) || null;
}

export function listRestoredAssetsByType(type) {
  return RESTORED_ASSET_MANIFEST.filter((asset) => asset.type === type);
}

export function listRestoredAssetsByRole(role) {
  return RESTORED_ASSET_MANIFEST.filter((asset) => asset.role === role);
}

export function listRestoredAssetsByCollection(collection) {
  return RESTORED_ASSET_MANIFEST.filter((asset) => asset.collection === collection);
}

export function validateRestoredAssetManifest(manifest = RESTORED_ASSET_MANIFEST) {
  const errors = [];
  const seenIds = new Set();

  for (const asset of manifest) {
    if (!asset.id || typeof asset.id !== "string") {
      errors.push("Asset is missing a string id.");
      continue;
    }

    if (seenIds.has(asset.id)) {
      errors.push(`Duplicate asset id: ${asset.id}`);
    }
    seenIds.add(asset.id);

    if (!/^[a-z0-9]+(:[a-z0-9-]+)+$/.test(asset.id)) {
      errors.push(`${asset.id} must use lowercase colon-separated id parts.`);
    }

    const allowedExtensions = RESTORED_ALLOWED_EXTENSIONS[asset.type];
    if (!allowedExtensions) {
      errors.push(`${asset.id} has unsupported type: ${asset.type}`);
      continue;
    }

    const allowedRoles = asset.type === "audio" ? RESTORED_AUDIO_ROLES : RESTORED_IMAGE_ROLES;
    if (!allowedRoles.includes(asset.role)) {
      errors.push(`${asset.id} has unsupported ${asset.type} role: ${asset.role}`);
    }

    if (!asset.path || typeof asset.path !== "string") {
      errors.push(`${asset.id} is missing a string path.`);
      continue;
    }

    if (!asset.path.startsWith("assets/")) {
      errors.push(`${asset.id} path must stay under assets/: ${asset.path}`);
    }

    if (asset.path.startsWith(RESTORED_INBOX_ASSET_PREFIX)) {
      errors.push(`${asset.id} must not point at the raw inbox: ${asset.path}`);
    }

    if (!asset.source) {
      errors.push(`${asset.id} is missing source metadata.`);
    }

    if (!RESTORED_ASSET_STATUSES.includes(asset.status)) {
      errors.push(`${asset.id} has unsupported status: ${asset.status}`);
    }

    if (asset.collection && !/^[a-z0-9-]+$/.test(asset.collection)) {
      errors.push(`${asset.id} has invalid collection: ${asset.collection}`);
    }

    const extension = getExtension(asset.path);
    if (!allowedExtensions.includes(extension)) {
      errors.push(`${asset.id} has invalid extension ${extension} for ${asset.type}.`);
    }
  }

  return errors;
}
