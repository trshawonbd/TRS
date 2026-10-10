# দেশি ডায়েট থালা (Deshi Diet Thala)

A family meal-planning web app (installable PWA): 115 healthy, easy, halal recipes, a spin-the-wheel picker,
shared favourites, "today's dish", have/need ingredient checks, a shared shopping list and push notifications.

- Source: `app/src/*` (English and Bangla, switch in the Family tab or on the sign-in screen): `data.js` recipes, `data-bn.js` Bangla recipe text, `art.js` illustrations, `player.js` step-by-step video, `app.js` app logic. Build with `./app/build.sh`, which writes `docs/index.html`.
- Hosting: GitHub Pages from the `docs/` folder.
- Backend: Supabase project `deshi-diet-thala` (auth, database with row-level security, realtime,
  and the `notify` edge function that stores messages and sends web push).

## One-time setup (owner)

1. **GitHub Pages**: repo Settings → Pages → Source "Deploy from a branch" → pick this branch and the `/docs` folder.
   The app is then at `https://trshawonbd.github.io/TRS/`.
2. **Supabase → Authentication → URL Configuration**: Site URL = the Pages URL above; add it to Redirect URLs.
3. **Supabase → Authentication → Sign In / Providers → Email**: turn **Confirm email** off
   (the built-in mailer only delivers to project team members), or add your own SMTP.
4. Optional: enable **Google** (needs a Google Cloud OAuth client) and **Phone** (needs Twilio or similar).

## Phone install

- Android (Chrome): open the URL → menu → "Install app". Chrome creates a real installed app (WebAPK) with notifications.
- iPhone (iOS 16.4+): Safari → Share → "Add to Home Screen", open it from the home screen, then turn on notifications
  in the Family tab.
