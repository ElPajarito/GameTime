# GAMEtime 🎮

A SNES-era retro game room for tracking your games, hosted as a static site.
The library is edited **offline** with a small CLI tool; the website just
displays it. Sibling of [TVmine](../TVmine), reborn as a game room.

## The room

Open `index.html` in a browser (or serve the folder with `python3 -m http.server`).
Everything is one room; the camera pans between three divisions:

- **Landing** — POV pixel hands holding a giant SNES controller under a
  **huge modern flatscreen**. **SELECT = To Play**, **START = Played**;
  pressing one plays a button-press animation and pans the camera. Hit the
  TV's power button and a cable snakes down and plugs into the controller,
  a **Wii disc** spins in and slides into the Wii beside the TV, and the
  screen tunes into whatever you're currently **playing** (with hours-played
  progress vs its quest length). The cable stays plugged in and follows the
  controller as it sways.
- **To Play** (pan left) — your backlog **races down a Mode 7 highway** and
  parks in a neat front-row lineup. Click a game to inspect.
- **Played** (pan right) — a **Game·Dex** on a desk; tap it and a pixel hand
  flips it open: left screen shows the selected game, right grid lists every
  beaten game with **pixel-heart ratings** (score 0–10 → 5 hearts).

Everywhere: CRT scanlines live **only inside the TV glass** (toggle with
`CRT`), synthesized **retro sound effects** (mute with `♪`), live **search**,
a **vertical filter dock** (sort, quest length, platform, genre), and
**time to beat** (rush / main / 100%) from IGDB on every game.
Esc always goes back; ←/→ pan the room. Covers download at 2x resolution
(`./gametime.py covers` re-fetches them all); games without art get a
procedurally painted pixel poster. Playing games never show a score —
no verdict until the credits roll.

## Managing the library

`library.json` is the source of truth. `gametime.py` edits it and regenerates
`data.js` (which the site reads). Never edit `data.js` by hand.

One-time setup — register a (free) app at
<https://dev.twitch.tv/console/apps> (IGDB is run by Twitch; OAuth redirect
`http://localhost`, type *Confidential*), then save the credentials:

```
# .igdb_auth
client_id=YOUR_CLIENT_ID
client_secret=YOUR_CLIENT_SECRET
```

The tool fetches and caches its own access token in `.igdb_token`.

Everyday use:

```sh
./gametime.py add "Chrono Trigger" --score 9.5
./gametime.py add "Silksong" --status toplay
./gametime.py add "Resident Evil 4" --year 2005 --status playing --progress 6.5
./gametime.py update chrono-trigger --score 10       # stamps today's date
./gametime.py update silksong --status playing --progress 2
./gametime.py remove chrono-trigger
./gametime.py list
./gametime.py regen        # rebuild data.js from library.json
./gametime.py check        # scan the library for duplicate entries
```

`add` searches IGDB, lets you pick the right match, downloads the cover into
`covers/`, and fills in year/genres/platforms/synopsis/time-to-beat
automatically. `--first` takes the best-known match without asking;
`--year 2005` disambiguates remakes. Statuses: `playing` · `toplay` · `played`.
Progress is hours played (`--progress 12.5`).

**Scoring implies played** — `add "Hades" --score 9` goes straight into
Played, and scoring an existing entry moves it there and stamps today's date.
An explicit `--status` always wins.

**Duplicate protection** — `add` refuses anything already in the library
(matched by IGDB id or title) and points you at `update`; `--again` overrides.
`./gametime.py check` audits the whole library.

## Files

| file | role |
|---|---|
| `index.html` `styles.css` `app.js` | the game room |
| `library.json` | your library (source of truth) |
| `data.js` | generated from `library.json` — do not edit |
| `covers/` | downloaded box art |
| `gametime.py` | offline library tool (stdlib only, Python 3.8+) |
| `.igdb_auth` | Twitch/IGDB credentials — **do not commit** |
| `.igdb_token` | cached access token — **do not commit** |

## Publishing

Push the folder to a GitHub repo, then Settings → Pages → deploy from the
main branch root. `.igdb_auth` and `.igdb_token` are already in `.gitignore`.
