# Focus List: deploy, cloud sync, and scaling guide

This guide gets Focus List online for free, with accounts so users keep their data when they
switch phone, browser or computer. Allow about 45 minutes the first time.

## What you are setting up

| Piece | Service | Free plan covers | Why |
|---|---|---|---|
| Website (HTML, JS, videos, music) | **Cloudflare Pages** | No bandwidth limit for static files | Netlify's free plan is about 15 GB/month (300 credits at 20 credits per GB), which runs out after a few thousand visits |
| Accounts + synced data | **Supabase** | 50,000 monthly sign-in users, 500 MB database, 5 GB/month download, unlimited requests | Firebase's free plan stops at 20,000 saves/day and about 3,000 daily users |
| Sign-in emails (optional) | **Brevo** (or Resend) | Brevo: 300 emails/day | Supabase's built-in email sends only 2 emails per hour |

Users who never sign in still get everything. Their data stays in their browser, and the account
screen lets them download and restore a backup file.

---

## 1. Put the site on Cloudflare Pages (free, unlimited bandwidth)

1. Push this repository to GitHub (it is already a git repo).
2. Go to <https://dash.cloudflare.com>, then **Workers & Pages → Create → Pages → Connect to Git**,
   and pick the repository.
3. Build settings:
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: **`AssetViewer`**
4. Click **Save and Deploy**. You get a URL like `https://focus-list.pages.dev`.
   Under **Custom domains** you can add your own domain for free.

The `AssetViewer/_headers` file is picked up automatically. It adds caching and security headers.

**Staying on Netlify?** Set the publish directory to `AssetViewer`. The same `_headers` file
works there. Watch the bandwidth meter: the free plan's credits run out quickly at scale.

> One file per site must stay under 25 MB on Cloudflare Pages. All current files are well below
> that; the largest motivation video is about 4 MB.

---

## 2. Create the Supabase project (accounts + data)

1. Sign up at <https://supabase.com>. Then click **New project** and pick a region close to most
   of your users (for India: **Mumbai, ap-south-1**). Save the database password somewhere safe.
2. Open **SQL Editor → New query**, paste the whole of [`supabase/schema.sql`](supabase/schema.sql),
   and click **Run**. You should see "Success. No rows returned".
3. Open **Project Settings → API** and copy:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon public** key
4. Put both into [`AssetViewer/supabase-config.js`](AssetViewer/supabase-config.js):

   ```js
   window.FL_SUPABASE = {
     url: 'https://xxxx.supabase.co',
     anonKey: 'eyJhbGciOi...',
     enableGoogle: true,
     enableEmail: true,
     enableUsername: true
   };
   ```

   Both values are meant to be public. The data is protected by the database rules in
   `schema.sql`: the tables can't be read directly, and every function checks who is asking.
   **Never** put the `service_role` key in this file.
5. Commit and push. Cloudflare redeploys automatically.

At this point **username + secret key** accounts already work. The next two steps add Google and
email sign-in.

### 2a. Allow your site address

**Authentication → URL Configuration**:
- **Site URL**: `https://your-site.pages.dev` (or your own domain)
- **Redirect URLs**: add `https://your-site.pages.dev/**`. If you have a custom domain, also add
  `https://yourdomain.com/**`.

### 2b. Google sign-in (free, recommended: the easiest option for users)

1. Go to <https://console.cloud.google.com>, create a project, then
   **APIs & Services → OAuth consent screen**: choose External, enter the app name, your support email
   and your domain, then **Publish app**.
2. **Credentials → Create credentials → OAuth client ID → Web application**:
   - Authorized JavaScript origins: `https://your-site.pages.dev`
   - Authorized redirect URI: `https://xxxx.supabase.co/auth/v1/callback`
     (copy the exact value from Supabase → Authentication → Providers → Google)
3. Paste the **Client ID** and **Client secret** into
   Supabase → **Authentication → Providers → Google**, and turn it on.

### 2c. Email sign-in with a 6-digit code (no passwords)

1. **Authentication → Providers → Email**: make sure it is enabled.
2. **Authentication → Email Templates → Magic Link**: add the code so people can type it on the
   same phone (some email apps open links in a different browser). Example body:

   ```html
   <h2>Your Focus List sign-in code</h2>
   <p style="font-size:28px;letter-spacing:4px"><strong>{{ .Token }}</strong></p>
   <p>Or tap: <a href="{{ .ConfirmationURL }}">Sign in to Focus List</a></p>
   <p>If you didn't ask for this, ignore this email.</p>
   ```
3. **Set up custom SMTP before launch.** Supabase's built-in sender is limited to
   **2 emails per hour for the whole project**, so it's only for testing.
   - Create a free **Brevo** account (300 emails/day), verify your sender address or domain, and
     open **SMTP & API** to get the SMTP login.
   - In Supabase, go to **Project Settings → Authentication → SMTP Settings**, enable custom SMTP,
     and fill in host `smtp-relay.brevo.com`, port `587`, and your login and key.
   - Then go to **Authentication → Rate Limits** and raise "emails per hour" to match your provider.

If you'd rather not deal with email at all, set `enableEmail: false`. Google plus
username/secret key still covers everyone.

---

## 3. How many users can this handle for free?

| Limit | Free amount | What it means for Focus List |
|---|---|---|
| Website traffic (Cloudflare Pages) | No limit | Fine for 1 lakh+ visitors. |
| Sign-in accounts (Supabase Auth) | 50,000 monthly active | Google/email users. **Username accounts don't count here**: they live in the database only. |
| Database size | 500 MB | One account is usually 5–30 KB, so roughly 20,000–60,000 active accounts. |
| Download traffic (Supabase) | 5 GB / month | The tightest limit. A daily user costs roughly 0.5–1.5 MB/month, so about 5,000–10,000 people using sync every day. |

Honest summary:
- **Up to about 5,000–10,000 daily users with sync: ₹0.**
- **50,000–1,00,000 active users with sync:** move Supabase to **Pro ($25/month, about ₹2,100)**.
  Pro includes 100,000 monthly users, 8 GB database and 250 GB download traffic. The website itself
  stays free on Cloudflare.
- Users who don't sign in cost nothing, at any scale.

Watch usage in **Supabase → Project Settings → Usage**. You get emails before limits are hit.

Notes:
- Free Supabase projects **pause after 7 days with no activity**. A live app with users never
  pauses. If it does, click **Restore** in the dashboard.
- The free plan has **no automatic backups**. Pro includes daily backups. Remind users about the
  "Download backup" button, which works with or without an account.

---

## 4. How sync works (for future you)

- All pages still save to the browser's `localStorage`, exactly as before. `sync.js` watches the
  data keys (tasks, habits, goals, available hours, celebrations, timer settings, theme, ambience
  volumes) and uploads one snapshot per account.
- When two devices change things at the same time, it merges **item by item**: tasks and habits by
  id, habit check-marks by date. Both devices' changes survive, and deleted items stay deleted.
  The server uses a version number, so one device can never silently overwrite another.
- Signing in on a device that already has data **merges** it into the account; nothing is
  thrown away.
- Sync runs about 2.5 s after an edit, when the app is opened or brought back to the front, every
  5 minutes while open, and once more when the tab is hidden or closed.
- The data limit is 1.5 MB per account (thousands of tasks).
- Username accounts: the key is stored only as a bcrypt hash. 10 wrong keys in a row lock the
  account for 15 minutes. **A lost key can't be recovered.** The app makes users save it when the
  account is created.

### Adding a new feature that stores data

If a new page saves to `localStorage` under a new key, add that key (or its prefix) to
`TRACKED_EXACT` / `TRACKED_PREFIX` at the top of `AssetViewer/sync.js`. Otherwise it won't sync.
If the page can redraw itself, listen for `storage` events and set `window.__flLiveSync = true`.
Otherwise sync reloads the page when new data arrives.

---

## 5. Testing locally

```bash
python dev-server.py
```

Then open <http://localhost:5173/>. This is a static server with caching off, so edits show
immediately.

```bash
python dev-server.py 5174 --mock-sync
```

This fakes the Supabase functions in memory (username accounts only). Open
<http://localhost:5174/> and <http://127.0.0.1:5174/> side by side: they have separate storage,
so they behave like two devices on one account.

---

## 6. Releasing updates

1. Edit files in `AssetViewer/`, then commit and push. Cloudflare redeploys in about a minute.
2. If you changed HTML/JS/CSS, bump `VERSION` in `AssetViewer/sw.js` (e.g. `fl-v2` to `fl-v3`).
   The service worker loads fresh files whenever the user is online, but bumping the version also
   clears old offline copies.
3. If you change `supabase/schema.sql`, run it again in the SQL editor. It's safe to re-run.

## 7. Housekeeping you may want to do

- `AssetViewer/assets/optimized/` holds the compressed media now used by the site:
  - background video: 8 MB → 1 MB
  - cover thumbnails: 13 MB → 1.6 MB
  - ambience music: 17 MB → 7.5 MB

  The originals (`background-video.mp4.mp4`, `cover page/`, `ambience music/`) are no longer
  loaded by any page. Keep them as source files, or delete them to make deploys smaller.
- `background-music.html` is an empty page and `background-music.js` isn't used by any page.
- The git index has Replit's internal files staged (`AssetViewer/.local/state/replit/...`,
  `AssetViewer/.replit`). Unstage them before committing:
  `git rm -r --cached AssetViewer/.local`. Then add `AssetViewer/.local/` to `.gitignore`.
