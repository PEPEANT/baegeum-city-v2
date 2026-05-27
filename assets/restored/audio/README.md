# Restored Audio Assets

Use these folders by audio behavior:

- `bgm/`: looping or long-form background music.
- `sfx/`: short one-shot interface and game sounds.
- `voice/`: spoken character or narrator lines.
- `ambience/`: location beds such as city, room, casino, rain, or stadium crowd.
- `singularity-race/`: feature-owned audio for the race, split again by `bgm`, `sfx`, `voice`, and `ambience`.

Bug guards:

- Do not autoplay audio from new files. Runtime controls should decide when playback starts.
- Keep large source masters in `../source/original/`, then promote compressed runtime copies here.
- Register promoted files in `src/restored/assets/asset-manifest.js` before using them.
