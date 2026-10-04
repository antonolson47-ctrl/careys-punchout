#!/bin/bash
# Assemble the GitHub Pages site into ../careys-punchout-pages
set -e
cd "$(dirname "$0")"; ./build.sh
OUT=../careys-punchout-pages; mkdir -p $OUT
sed 's#<!--PWA-LINKS-->#<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png"><link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png"><link rel="manifest" href="manifest.webmanifest">#' CareysPunchout.html > $OUT/index.html
grep -q 'manifest.webmanifest' $OUT/index.html
(cd test && node icons.js ../$OUT)
cat > $OUT/manifest.webmanifest <<'MAN'
{
  "name": "Carey's Punchout",
  "short_name": "Punchout",
  "description": "A Punch-Out!!-style boxing & kickboxing game starring Carey.",
  "start_url": "./",
  "scope": "./",
  "display": "fullscreen",
  "orientation": "any",
  "background_color": "#0b0412",
  "theme_color": "#14061f",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
MAN
touch $OUT/.nojekyll
rm -rf $OUT/src $OUT/test $OUT/screenshots; mkdir -p $OUT/src $OUT/test $OUT/screenshots
cp src/* $OUT/src/; cp build.sh make_pages.sh $OUT/; cp test/*.js test/package.json $OUT/test/; cp screenshots/*.png $OUT/screenshots/
cp CareysPunchout.html $OUT/CareysPunchout.html
cp README.md $OUT/README.md; printf 'node_modules/\n' > $OUT/.gitignore
echo "pages assembled in $OUT"
