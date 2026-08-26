# Moving to a new host

Written for the current setup: cPanel shared hosting, LiteSpeed, Laravel on
`api.avyrabd.com`, Next.js under **Setup Node.js App** on `avyrabd.com`, MySQL,
deployed by `git pull` from a **public** GitHub repository.

Work through it in order. Nothing here is reversible in a hurry once DNS moves,
so the old host stays untouched until the last step.

---

## 0. What a `git clone` does *not* give you

These are the things a migration loses, and each one is silent — the site comes
up and looks fine until someone tries to use it.

| Missing | Where it lives | Consequence if forgotten |
|---|---|---|
| `avyra-backend/.env` | gitignored | app will not boot |
| **`APP_KEY`** | inside `.env` | every session invalid; encrypted values unreadable |
| **Uploaded images** | `avyra-backend/storage/app/public` | every product photo, campaign slide and banner 404s |
| The database | MySQL | everything |
| `public/storage` symlink | gitignored | images 404 even when the files are there |
| Cron job | cPanel | courier sync and Facebook retries silently stop |
| Steadfast webhook URL | registered *at Steadfast* | courier statuses stop arriving |

Settings — Meta CAPI pixel and token, courier keys, delivery charges, policies —
live in the `settings` **table**, so they travel with the database dump. They are
not in `.env`.

---

## 1. Take stock of the old host

```bash
# On the OLD server
cd ~/avyra-wellness/avyra-backend

php -v                      # note the version — the app needs PHP 8.4+
php artisan --version
cat .env                    # copy this somewhere safe, offline
crontab -l                  # note the schedule:run line, if it exists
php artisan about | head -30
```

Also write down, from cPanel:

- the subdomain and its **document root** (must end in `/public`)
- the Node.js app entry: application root, application URL, startup file
- the MySQL database name, user, and host

---

## 2. Back up everything

```bash
# On the OLD server
cd ~

# Database — the whole thing, in one file
mysqldump -u DBUSER -p --single-transaction --routines DBNAME > avyra-db.sql

# Uploads. This is the one people forget.
tar -czf avyra-uploads.tar.gz -C ~/avyra-wellness/avyra-backend/storage/app public

# The env file, separately and privately
cp ~/avyra-wellness/avyra-backend/.env ~/avyra-env-backup.txt

ls -lh avyra-db.sql avyra-uploads.tar.gz
```

Download all three to your own machine before touching anything else.

> The repository is **public**. Never commit `.env`, the dump, or the uploads
> archive to get them across. Use the cPanel file manager or `scp`.

---

## 3. Prepare the new host

Check first that it offers:

- **PHP 8.4+** with `gd` (WebP), `pdo_mysql`, `mbstring`, `zip`, `fileinfo`
- **Node 20+** with a way to run a persistent app (Passenger, or plain `node`)
- **MySQL 8** — or MariaDB 10.6+
- shell access and cron

Then:

1. Create the database, user, and grant.
2. Point the main domain at the Next.js app.
3. Create the API subdomain with its document root ending in
   **`avyra-wellness/avyra-backend/public`**.

> The document root is the whole security story. If it points at
> `avyra-backend/` instead of `avyra-backend/public/`, then `.env` — database
> password, API tokens — is downloadable over the web.

---

## 4. Put the code and data in place

```bash
# On the NEW server
cd ~
git clone https://github.com/shawonnorban/avyra-wellness.git
cd avyra-wellness/avyra-backend

composer install --no-dev --optimize-autoloader

# The env file you saved in step 2, edited for the new host
nano .env
```

What must change in `.env`, and what must not:

| Key | Action |
|---|---|
| `APP_KEY` | **carry over unchanged** — a new one invalidates every session |
| `DB_HOST` `DB_DATABASE` `DB_USERNAME` `DB_PASSWORD` | new values |
| `APP_URL` | the new API URL |
| `FRONTEND_URL` | the new storefront URL |
| `SESSION_DOMAIN` | `.yourdomain.com` — leading dot, shared by both hosts |
| `SANCTUM_STATEFUL_DOMAINS` | the storefront host, no scheme |
| `CORS_ALLOWED_ORIGINS` | the storefront origin, with scheme |
| `APP_DEBUG` | **`false`** — a debug error page prints the database password |
| `APP_ENV` | `production` |
| `FILESYSTEM_DISK` | `public` |

> The API and the storefront must share a registrable domain — `avyrabd.com` and
> `api.avyrabd.com`. Sanctum authenticates with a **cookie**, and a cookie cannot
> be shared across unrelated domains. Putting the API on a different domain means
> nobody can log in to the admin.

Restore the data:

```bash
mysql -u DBUSER -p DBNAME < ~/avyra-db.sql

tar -xzf ~/avyra-uploads.tar.gz -C ~/avyra-wellness/avyra-backend/storage/app
php artisan storage:link

chmod -R u+rwX,go+rX storage bootstrap/cache
php artisan migrate --force        # expect "Nothing to migrate" on a same-version move
php artisan config:cache && php artisan route:cache
```

> `config/database.php` pins `'engine' => 'InnoDB'`. Do not remove it. Some
> shared hosts default to MyISAM, which caps index keys at 1000 bytes and
> **silently drops foreign keys** — the schema appears to import cleanly and the
> relationships are simply not there.

---

## 5. The frontend, and the step that catches everyone

**If either domain changed, the frontend must be rebuilt.** `NEXT_PUBLIC_API_URL`
is compiled into the JavaScript at build time, not read at runtime — the bundle
in `next-build.zip` still points at the old API. Copying it across gives a site
that renders and then fails every request.

On your own machine:

```bash
cd avyra-frontend
nano .env.production          # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SITE_URL

rm -rf .next && npm run build
grep -rl 'OLD-API-HOST' .next/static | wc -l    # must be 0

# then commit next-build.zip — see docs/frontend-build.md
```

On the new server:

```bash
cd ~/avyra-wellness/avyra-frontend
npm ci --omit=dev
rm -rf .next && unzip -q ../next-build.zip
chmod -R u+rwX,go+rX .next
```

Register the app in cPanel → Setup Node.js App (application root
`avyra-wellness/avyra-frontend`, startup file `server.js`), then **Restart**.

> Do not try to run `next build` on shared hosting. cPanel caps the account at
> 4 GB and the build is killed part-way, leaving a `.next` that half exists.

---

## 6. The cron job

```
* * * * * cd ~/avyra-wellness/avyra-backend && php artisan schedule:run >> /dev/null 2>&1
```

Without it, `courier:sync` never runs — courier statuses only arrive if the
webhook fires and nothing catches what it misses — and `fb:retry-events` never
retries, so a conversion Meta rejected once is owed forever.

Confirm with `php artisan schedule:list`.

---

## 7. Test before DNS moves

Point your own machine at the new server first, so real customers keep hitting
the old one. Add to your local hosts file:

```
NEW.SERVER.IP  avyrabd.com
NEW.SERVER.IP  api.avyrabd.com
```

Then check, in this order:

```bash
php artisan fb:doctor            # credentials found, recent orders listed
php artisan orders:explain-totals
```

In the browser:

1. `/avyravitalplus` loads, slider images appear — proves uploads and
   `storage:link` survived.
2. Place a test order end to end.
3. `/admin` — log in. **This is the Sanctum cookie test**; a failure here means
   `SESSION_DOMAIN` or `SANCTUM_STATEFUL_DOMAINS` is wrong.
4. Change that order's status to Hold, with a remark.
5. `php artisan fb:doctor` again — the new order shows `Sent: Lead`.
6. Upload an image in the admin — proves the disk is writable and linked.

Remove the hosts entries afterwards.

---

## 8. Move DNS

Lower the TTL to 300 seconds **at least a day before**, so a mistake can be
undone in minutes rather than hours.

Then repoint both records, and issue SSL on the new host — the storefront and API
must both be HTTPS or the session cookie will not be sent.

---

## 9. After the switch

- Update the **Steadfast webhook URL** to the new `api.…/api/webhooks/courier/steadfast`.
  The bearer token is in the database and does not change.
- If the domain changed, redo **Meta domain verification** and check the GTM
  container's Pixel tag still matches `fb:doctor`'s pixel id.
- Watch `storage/logs/laravel.log` for a day.
- **Keep the old host running for a week.** DNS caches, and the old server is the
  only copy of anything that turns out to have been missed.

---

## Things that are easy to get wrong

- Rebuilding the frontend is **not optional** when a domain changes.
- `APP_KEY` must be the old one.
- `storage/app/public` is not in git.
- Document root must end in `/public`.
- `APP_DEBUG=false` in production.
- The API must stay on a subdomain of the storefront's domain.
- Never put `.env` in the repository — it is public.
