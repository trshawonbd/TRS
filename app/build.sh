#!/usr/bin/env bash
# Builds docs/index.html (served by GitHub Pages) from app/src.
set -euo pipefail
cd "$(dirname "$0")"
OUT=../docs/index.html
{
  cat <<'HEAD'
<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>দেশি ডায়েট থালা</title>
<meta name="description" content="পরিবারের জন্য সহজ ও স্বাস্থ্যকর রেসিপি, আজকের রান্না, বাজারের তালিকা আর নোটিফিকেশন।">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="icons/apple-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="দেশি থালা">
<style>body{margin:0}img{max-width:100%}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>
HEAD
  cat src/head.html
  echo '</head>'
  echo '<body>'
  cat src/body.html
  echo '<script src="vendor/supabase-2.45.4.js"></script>'
  echo '<script>'
  cat src/data.js src/methods.js src/world.js src/more.js src/art.js src/player.js src/main.js src/family.js
  echo '</script>'
  echo '</body>'
  echo '</html>'
} > "$OUT"
echo "built $OUT ($(wc -c < "$OUT") bytes)"
