#!/bin/bash
# Concatenate src parts into the single self-contained CareysPunchout.html
cd "$(dirname "$0")"
cat src/00_head.html src/10_core.js src/15_audio.js src/18_music.js src/25_art_env.js src/26_art_carey.js src/27_art_opp.js src/28_art_cast.js src/30_roster.js src/40_fight.js src/50_scenes.js src/85_touch.js src/90_main.js src/99_tail.html > CareysPunchout.html
echo "built CareysPunchout.html ($(wc -c < CareysPunchout.html) bytes)"
