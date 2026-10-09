#!/usr/bin/env bash
# Builds docs/index.html (served by GitHub Pages) from app/src.
set -euo pipefail
cd "$(dirname "$0")"
OUT=../docs/index.html
{
  cat <<'HEAD'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Deshi Diet Thala</title>
<meta name="description" content="Healthy, easy home recipes for the family: today's dish, a shared shopping list and notifications.">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="icons/apple-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#1F5C3D">
<script>try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}</script>
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Deshi Thala">
<style>body{margin:0}img{max-width:100%}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}</style>
HEAD
  cat src/head.html
  echo '</head>'
  echo '<body>'
  cat src/body.html
  echo '<script src="vendor/supabase-2.45.4.js"></script>'
  echo '<script>'
  cat src/data.js src/data-bn.js src/art.js src/steps.js src/journey.js src/player.js src/app.js
  echo; echo 'start();'
  echo '</script>'
  echo '</body>'
  echo '</html>'
} > "$OUT"
echo "built $OUT ($(wc -c < "$OUT") bytes)"
