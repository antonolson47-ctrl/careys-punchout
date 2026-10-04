# Carey's Punchout

A Punch-Out!!-style boxing **and kickboxing** game for the browser, starring Carey.
Single self-contained HTML file. All art is drawn in code (pixel style) and all sound is procedural WebAudio, so there are no external assets.

**Play:** https://antonolson47-ctrl.github.io/careys-punchout/

Works on desktop (keyboard or mouse) and on phones (touch buttons, portrait or landscape; it re-lays out when you rotate). On iPhone, Share → *Add to Home Screen* runs it fullscreen.

## How it plays
- 8 opponents on a ladder (Minor → Major → World circuits). Progress is saved in `localStorage`.
- 3 rounds × 1:30. Win by **KO** (stays down for 10), **TKO** (3 knockdowns in one round) or the judges' **decision**.
- Watch for the **glint ✦** on a glove or foot: the attack lands about a third of a second later. Dodge, duck or block depending on the attack. Hit them while they recover, or interrupt a wind-up, and you earn **★ stars** for the Star Punch.
- **Hearts** are stamina. Blocked punches, getting hit, and kicks all cost hearts. At zero you're gassed for a moment.
- Faces take damage as the fight goes on: black eyes, swelling, cuts, fat lips and missing teeth. Blood and spit fly.
- Between rounds you get advice from Coach Gus in the corner. After a win there's a post-fight interview with the commentators Chet Ruckus and Barry "Big Daddy" Biggs.

## Controls (keyboard)
| Action | Keys |
|---|---|
| Left / right jab | J / K |
| Left / right hook | U / I |
| Left / right body | N / M |
| Uppercut | L or O |
| Leg kick / head kick / spinning roundhouse | Q / E / R |
| Star Punch | Space |
| Dodge left / right | ← / → (A / D) |
| Duck | ↓ (S) |
| Block (hold) | ↑ (W) or Shift |
| Pause | P / Esc |
| Mute | X |
| Get up after a knockdown | mash any key |

On touch screens, every action has an on-screen button. You can hold the dodge, duck and block buttons.

## Opponents
1. **Doug "The Couch" Mulligan**: out-of-shape fantasy-football dad. Slow, sloppy, very sweaty.
2. **Chad Brosworth**: gym bro who guards his face and has never done leg day.
3. **Nana Knuckles**: 103-year-old granny with lightning jabs, a deadly purse and flying dentures.
4. **Sir Reginald Crumpet III**: snooty aristocrat who fakes you out and stops for tea.
5. **LiveStream Kevin**: influencer who blinds you with his ring light and reads chat mid-round.
6. **Bjorn "The Glacier" Frostbeard**: giant Viking who shrugs off punches while he winds up.
7. **Dr. Molar Hurtz, D.D.S.**: creepy dentist with four-hit combos who collects your teeth.
8. **Cyber-Gary 3000** (champ): robot that learns your patterns and fires rocket fists and laser eyes.

## Development
`src/` holds the parts. `./build.sh` joins them into `CareysPunchout.html`, and `./make_pages.sh` assembles the Pages site (index.html, manifest, icons).
Tests use Playwright and live in `test/` (`npm i` there first):
- `node desktop.js`: desktop Chromium, keyboard play-through, round timer, decision and KO paths, interview, save, audio
- `node mobile.js iphone|pixel`: WebKit iPhone 13 / Chromium Pixel 7, real touch taps, portrait ↔ landscape rotation mid-fight, no scroll or zoom
- `node balance.js`: headless bot simulations vs all 8 opponents
