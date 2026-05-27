# Restored Image Assets

Use these folders by gameplay role:

- `characters/`: shared character illustrations that can appear in multiple systems.
- `partners/`: relationship and partner-specific portraits or event art.
- `items/`: inventory, gifts, shop goods, and ownership icons.
- `backgrounds/`: rooms, phone wallpapers, and scene backplates.
- `ui/`: interface-only icons, buttons, badges, frames, and app art.
- `city/`: buildings, district thumbnails, travel images, and place art.
- `casino/`: tables, cards, chips, slot art, and gambling venue images.
- `phone/`: phone app surfaces and notification art.
- `singularity-race/`: race-specific characters, skill icons, skins, stadium art, and race UI.

Character packs should prefer this shape:

```text
characters/<character-id>/
  portrait/
  fullbody/
  chibi/
  emotion/
  cutscene/
```

Bug guards:

- Use lowercase kebab-case paths.
- Do not put raw screenshots or reference-only art here; use `../source/references/`.
- Do not reference files directly from HTML or JS. Register an asset id first.
