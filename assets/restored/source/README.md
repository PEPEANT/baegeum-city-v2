# Restored Source Assets

This area keeps files that help production but should not be loaded by gameplay UI.

- `original/`: high-resolution masters, layered exports, or uncompressed originals.
- `generated/`: AI-generated source outputs before runtime compression or cropping.
- `references/`: reference-only screenshots and mood images.
- `human/`: raw human-provided source files after inbox review.
- `github/`: reference material copied only after license review.
- `screenshots/`: local capture evidence for visual QA.

Promotion rule:

`source/` files are not active runtime assets. Create a compressed/cropped runtime copy under `audio/` or `images/`, then register that copy in the manifest.
