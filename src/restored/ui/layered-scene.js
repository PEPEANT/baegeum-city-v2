// Reusable "layered scene" builder.
//
// A scene is a stack of image layers (back -> front) plus a content slot where
// the game places the live character (skin) and its name label. Background /
// title / podium are art; the character is NOT baked into the art -- the code
// drops it on top, anchored to the podium.
//
// Two kinds of layer:
//   - cover  : full-bleed background, scaled to cover the scene box.
//   - placed : a positioned sprite (e.g. title banner, podium) rendered as an
//              <img> with a width + corner offsets, keeping its own aspect.
//
// Asset/folder convention: assets/singularity-race/scenes/README.md
//
// Framework-free. The consuming page injects its asset resolver
// resolveRestoredAssetPath(id, fallbackPath).

export const LAYERED_SCENE_VERSION = "layered-scene-003";

// Back -> front. A scene may omit any layer it does not use.
export const SCENE_LAYER_ORDER = Object.freeze([
  "background",
  "lights",
  "title",
  "podium"
]);

// Scene registry. Each layer maps to a manifest asset id with a fallback path.
// `placement: "cover"` (default) is a full-bleed background. Otherwise placement
// is { left/right/top/bottom, width, transform } as CSS strings.
//
// podiumAnchor is where the character's FEET land, as percentages of the scene
// box. The content slot is bottom-anchored there: raise `bottom` if the
// character sinks into the podium, lower it if it floats above.
export const LAYERED_SCENES = Object.freeze({
  "race-prep": Object.freeze({
    aspectRatio: "1535 / 1024",
    podiumAnchor: Object.freeze({ left: "50%", bottom: "49%" }),
    layers: Object.freeze({
      background: {
        assetId: "image:race:singularity-race:scene-race-prep-background",
        fallback: "./assets/singularity-race/scenes/race-prep/background.png",
        placement: "cover"
      },
      title: {
        assetId: "image:race:singularity-race:scene-race-prep-title",
        fallback: "./assets/singularity-race/scenes/race-prep/title.png",
        placement: { top: "6.4%", left: "50%", width: "45%", transform: "translateX(-50%)" }
      },
      podium: {
        assetId: "image:race:singularity-race:scene-race-prep-podium",
        fallback: "./assets/singularity-race/scenes/race-prep/podium.png",
        placement: { bottom: "24%", left: "50%", width: "104%", transform: "translateX(-50%)" }
      }
    })
  })
});

export function getLayeredScene(sceneName) {
  return LAYERED_SCENES[sceneName] || null;
}

// Canonical CSS for the stack. Inject once per page (or copy into <style>).
export const LAYERED_SCENE_CSS = `
.scene-stack {
  position: relative;
  width: 100%;
  aspect-ratio: var(--scene-aspect, 1535 / 1024);
  overflow: hidden;
}
.scene-stack .scene-layer {
  position: absolute;
  pointer-events: none;
  image-rendering: pixelated;
}
.scene-stack .scene-layer--cover {
  inset: 0;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}
.scene-stack img.scene-layer--placed {
  height: auto;
  object-fit: contain;
}
.scene-stack .scene-content {
  position: absolute;
  z-index: 1;
  transform: translateX(-50%);
  display: grid;
  justify-items: center;
  gap: 6px;
  text-align: center;
}
`;

const PLACEMENT_KEYS = ["left", "right", "top", "bottom", "width", "height", "transform"];

function orderedLayerEntries(layers) {
  const named = SCENE_LAYER_ORDER
    .filter((name) => layers[name])
    .map((name) => [name, layers[name]]);
  const extras = Object.keys(layers)
    .filter((name) => !SCENE_LAYER_ORDER.includes(name))
    .map((name) => [name, layers[name]]);
  return named.concat(extras);
}

// Builds the layer stack inside `host` and returns the content slot element
// (where the caller appends the character image + name label).
//
//   const slot = buildLayeredScene(heroEl, "race-prep", { resolveAssetPath });
//
// Re-running on the same host swaps layers in place but keeps the content slot
// (so live nodes inside it survive a re-render).
export function buildLayeredScene(host, sceneNameOrDef, options = {}) {
  if (!host) throw new Error("buildLayeredScene: host element is required");

  const scene =
    typeof sceneNameOrDef === "string" ? getLayeredScene(sceneNameOrDef) : sceneNameOrDef;
  if (!scene) throw new Error(`buildLayeredScene: unknown scene "${sceneNameOrDef}"`);

  const doc = options.document || host.ownerDocument || globalThis.document;
  const resolve =
    typeof options.resolveAssetPath === "function"
      ? options.resolveAssetPath
      : (_id, fallback) => fallback || "";

  host.classList.add("scene-stack");
  if (scene.aspectRatio) host.style.setProperty("--scene-aspect", scene.aspectRatio);

  host.querySelectorAll(":scope > .scene-layer").forEach((node) => node.remove());

  for (const [name, layer] of orderedLayerEntries(scene.layers || {})) {
    const url = resolve(layer.assetId, layer.fallback);
    if (!url) continue;

    const placement = layer.placement;
    if (!placement || placement === "cover") {
      const el = doc.createElement("div");
      el.className = "scene-layer scene-layer--cover";
      el.dataset.layer = name;
      el.style.backgroundImage = `url("${url}")`;
      host.appendChild(el);
    } else {
      const img = doc.createElement("img");
      img.className = "scene-layer scene-layer--placed";
      img.dataset.layer = name;
      img.alt = "";
      img.src = url;
      for (const key of PLACEMENT_KEYS) {
        if (placement[key] != null) img.style[key] = placement[key];
      }
      host.appendChild(img);
    }
  }

  let content = host.querySelector(":scope > .scene-content");
  if (!content) {
    content = doc.createElement("div");
    content.className = "scene-content";
    host.appendChild(content);
  } else {
    host.appendChild(content); // keep it above the freshly added layers
  }

  const anchor = scene.podiumAnchor || {};
  content.style.left = anchor.left || "50%";
  content.style.bottom = anchor.bottom || "12%";

  return content;
}
