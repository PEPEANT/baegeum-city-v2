# Restored Runtime Assets

This folder is the promoted runtime asset area for the restored build.

Raw files from the human start in `assets/inbox/`. Move files here only after source, role, and manifest id are clear.

Primary branches:

- `audio/`: BGM, SFX, voice, and ambience files.
- `images/`: runtime-safe illustrations, UI art, character art, and feature art.
- `source/`: original or reference material that should not be loaded by runtime UI.
- `manifests/`: batch notes and generated manifest fragments before they are merged into `src/restored/assets/asset-manifest.js`.

Runtime code should use asset ids from `src/restored/assets/asset-manifest.js`, not direct paths into this folder.
