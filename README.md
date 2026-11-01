# The Pension Plan

**A golf holiday. No fixed return date.**

A bright, unhurried browser golf game set around Alabama’s Robert Trent Jones Golf Trail. Play five flags, meet a local, take a detour, or stay for another round. The opening is simply a holiday. A longer mystery is there for players who keep looking.

[Play](https://ryanlmelvin.github.io/golf-altrs/) · [Source](https://github.com/ryanlmelvin/golf-altrs)

This edition includes **11 destinations**, **33 optional local stories**, and an optional first story arc of **24 authored outings**. Its first three outings keep things ordinary. Golf and free travel continue after the arc’s conclusion; the authored story is finite, while the trip has no forced ending. The courses are original compact layouts, not recreations of the real courses.

## Play

Pull back from the ball and release. Finish five flags in any order. You can also tap a direction, set the power, and choose **Swing**. Keyboard controls and optional assistance are in the menu.

After the opening round, all 11 destinations are available from **Alabama**. The **19th hole** offers optional conversations. Local stories rotate as you play more rounds at a destination. Anything worth keeping goes in the notebook; source links accompany the real-place notes.

Follow reception’s occasional suggestions if you want to continue the story, or choose your own route. Later wagers require a strictly lower score. A loss leaves room for another try. There is no timer, required reading list, or deadline to go home.

## Run locally

Node.js 20 or newer. No dependencies or build step.

```sh
npm start
```

Open [localhost:4320](http://localhost:4320). The server also serves [the GitHub Pages subdirectory](http://localhost:4320/golf-altrs/) for local checks. Set `PORT` to use another port.

## Install and save

Open online once to cache the game. Compatible browsers offer **Install** or **Add to Home Screen**; on iPhone and iPad, use Safari’s Share menu. Installation controls depend on the browser.

Progress, rounds in play, discoveries, and settings stay in this browser on this device. Use **Menu → Save backup** and **Open backup** to transfer progress or keep a separate copy. Installed apps may have their own storage. Clearing website data removes local progress. Saves and caches are scoped to the project path, independently of other games on the same GitHub Pages domain.

Every game asset is local and cached for offline play. Source links open external reading only when selected. Updates wait until existing game windows close. Increment `VERSION` in `docs/sw.js` whenever shipped assets change.

## Publish on GitHub Pages

Everything needed to play is in `docs/`. Use **Settings → Pages → Deploy from a branch**, select **main** and **/docs**. Relative paths support the project URL without changes. This is a fully static PWA: no backend, account system, runtime dependencies, or paid service.

## Verify

```sh
npm run check
npm test
```

Checks cover JavaScript syntax, the offline asset list, golf physics and resumable rounds, progress rules, optional content references, and project-isolated caching. Browser checks should also cover the quiet opening, later discoveries, revisiting courses, touch and keyboard controls, save transfer, continued play after the story, and offline reload under `/golf-altrs/`.

| File | Purpose |
| --- | --- |
| `docs/app.js` | Interface, notebook, travel, and game flow |
| `docs/state.js` | Progress rules and save validation |
| `docs/journey.js` | The optional first arc, discoveries, and deductions |
| `docs/alabama.js` | Eleven destinations, locals, and 33 source-linked place notes |
| `docs/story.js` | Shared story endings, crowd details, and research sources |
| `docs/golf.js` | Canvas golf, course variations, finds, and terrain physics |
| `docs/sw.js` | Offline asset cache |
| `scripts/serve.mjs` | Local static preview |

<details>
<summary>Fiction and story context — contains spoilers</summary>

The game is alternate-universe satire. The Teachers’ Retirement System cabal, invented staff, planted documents, manipulated protests, and supernatural Robert Trent Jones are fictional. Ordinary retirement administration and the real Golf Trail investment supply the premise, not evidence for wrongdoing. The game is unaffiliated with RSA or the Robert Trent Jones Golf Trail.

Real environmental history and community folklore are distinguished from the invented plot. Anniston Army Depot cleanup and industrial PCB pollution are separate histories. Local ghost stories are identified as folklore, not proof of supernatural events. After the optional arc resolves, the player can keep traveling, replay courses, and collect remaining local stories.

</details>
