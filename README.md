# GAMEtime 🎮

A retro game-room for tracking your backlog, hosted as a static site.
The library is edited **offline** with a small Python CLI; the website just
displays it. Sibling of [TVmine](../TVmine), reborn for games.

**Live:** https://elpajarito.github.io/GameTime/

## The site

Three divisions, one screen — the camera pans between them.

- **Landing** — a big modern TV that fills the screen. Hit power and it wakes
  into a **4×3 channel grid**: the games you're playing are channels, every
  empty slot is a Wii-style tile hissing with its own TV static. Click a
  channel and it plays full screen with its progress.
- **To Play** (`◀ TO PLAY`) — your backlog as a **tornado**. Four counter-
  rotating rings of cover art projected through a real pitched camera, so size
  and depth always agree. Drag to spin, scroll to rise through it, hover to
  freeze, click a cover to inspect. Ring placement reshuffles every visit.
- **Played** (`PLAYED ▶`) — a **Game·Dex** that flips open: the selected game
  on the left page, every beaten game on the right with **pixel-heart ratings**
  (score 0–10 → 5 hearts).

Everywhere: live search, a collapsible filter dock (sort, length, platform,
genre), synthesized retro sound effects (`♪` to mute), a scanline toggle
(`CRT`), and **time to beat** from IGDB on every game — hours as the headline,
with "≈ N nights at 2h a night" in the detail view. Esc always goes home.
Games without cover art get a procedurally painted pixel poster, and a game
you're playing never shows a score — no verdict until the credits roll.

## Managing the library

`library.json` is the source of truth. `gametime.py` edits it and regenerates
`data.js` (which the site reads). Never edit `data.js` by hand.

One-time setup — register a free app at <https://dev.twitch.tv/console/apps>
(IGDB is run by Twitch; OAuth redirect `http://localhost`, type *Confidential*),
then save the credentials:

```
# .igdb_auth   (gitignored — never commit this)
client_id=YOUR_CLIENT_ID
client_secret=YOUR_CLIENT_SECRET
```

The tool fetches and caches its own access token in `.igdb_token`.

```sh
./gametime.py add "Hollow Knight"                  # search IGDB and pick from the list
./gametime.py add "Silksong" --status toplay
./gametime.py update silksong --status playing --progress 6.5
./gametime.py update silksong --score 9            # scoring moves it to Played
./gametime.py remove silksong
./gametime.py list
./gametime.py regen                                # rebuild data.js
./gametime.py check                                # scan for duplicates
./gametime.py covers                               # re-download all cover art
```

`add` searches IGDB, lists every match for you to choose from, downloads the
cover into `covers/`, and fills in year, genres, platforms, synopsis and
time-to-beat. `--first` takes the best-known match without asking; `--year 2005`
disambiguates remakes. Statuses: `playing` · `toplay` · `played`.

## Running it locally

```sh
./serve.py          # http://<your-lan-ip>:8734/  — reachable from your phone
./serve.py 9000     # another port
```

`serve.py` refuses to serve dotfiles, so your Twitch credentials never leave
the machine. Plain `python3 -m http.server` would hand them out — don't use it.

## Files

| file | role |
|---|---|
| `index.html` `styles.css` `app.js` | the site |
| `library.json` | your library (source of truth) |
| `data.js` | generated from `library.json` — do not edit |
| `covers/` | downloaded box art |
| `gametime.py` | offline library tool (stdlib only, Python 3.8+) |
| `serve.py` | local/LAN dev server that hides dotfiles |
| `.igdb_auth` `.igdb_token` | credentials — **gitignored, never commit** |
