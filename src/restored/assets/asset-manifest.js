export const RESTORED_ASSET_MANIFEST_VERSION = "restored-asset-manifest-001";

export const RESTORED_AUDIO_ROLES = Object.freeze([
  "bgm",
  "sfx",
  "voice",
  "ambience"
]);

export const RESTORED_IMAGE_ROLES = Object.freeze([
  "partner",
  "item",
  "background",
  "ui",
  "city",
  "casino",
  "phone",
  "preview",
  "reference"
]);

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

    const extension = getExtension(asset.path);
    if (!allowedExtensions.includes(extension)) {
      errors.push(`${asset.id} has invalid extension ${extension} for ${asset.type}.`);
    }
  }

  return errors;
}
