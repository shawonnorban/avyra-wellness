# Building `next-build.zip`

The frontend is served from the compiled `.next` directory, never from `src/`.
Bengali copy, CSS, colours and every `NEXT_PUBLIC_*` value are baked into the
JavaScript bundle at build time, so **a `git pull` on the server updates the
source and changes nothing a visitor sees.**

The build also cannot be run on the server: cPanel caps the account at 4 GB and
`next build` is killed part-way through. So it is built here and the result is
shipped as `next-build.zip`, which is tracked in git — the server gets it with
the same `git pull` as the source.

---

## 1. Stop the dev server

`next dev` and `next build` write to the same `.next` directory. Leaving dev
running gives a build with development chunks mixed in.

```powershell
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like "*avyra-frontend*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

## 2. Build from scratch

```bash
cd C:/wamp64/www/avyra-wellness/avyra-frontend
rm -rf .next
npm run build
```

`rm -rf` matters: `next build` does not remove chunks belonging to routes that
no longer exist, and a stale one shipped alongside a new manifest is served to
browsers as a mixed version.

## 3. Check the build before shipping it

```bash
cat .next/BUILD_ID                                # must differ from last time
grep -rl 'localhost:8000' .next/static | wc -l    # must be 0
ls .next/dev 2>/dev/null | wc -l                  # must be 0
```

`npm run build` sets `NODE_ENV=production`, so it reads `.env.production`.

> **The trap:** Next loads `.env.local` *ahead of* `.env.production`. The local
> file here is deliberately named `.env.development.local` — that suffix is
> ignored during a production build. Renaming it to `.env.local` silently bakes
> `localhost:8000` into the production bundle, and the live site then calls an
> API that only exists on this machine. That is what the `grep` above catches.

When the change was to visible copy, check the string itself:

```bash
grep -rl 'সারা বাংলাদেশে ডেলিভারি ফ্রি' .next/static | wc -l   # expect > 0
```

## 4. Zip it

```powershell
Set-Location C:\wamp64\www\avyra-wellness\avyra-frontend
Remove-Item ..\next-build.zip -Force -ErrorAction SilentlyContinue
Compress-Archive -Path .next -DestinationPath ..\next-build.zip -CompressionLevel Optimal
```

`-Path .next` (the directory, not `.next\*`) so the archive contains `.next/` at
its root and extracts straight into `avyra-frontend/`. Expect roughly 5–6 MB.

## 5. Commit and push

```bash
cd C:/wamp64/www/avyra-wellness
git add next-build.zip
git commit -m "chore: rebuild the frontend"
git push origin main
```

---

## On the server

```bash
cd ~/avyra-wellness && git pull
cd avyra-frontend
rm -rf .next
unzip -q ../next-build.zip
chmod -R u+rwX,go+rX .next
cat .next/BUILD_ID          # must match step 3
```

Then **cPanel → Setup Node.js App → RESTART**.

None of those lines is optional:

| Step | What skipping it looks like |
|---|---|
| `rm -rf .next` | old chunks survive; browsers get a mixed version |
| `chmod` | a Windows zip carries no Unix permissions — 503, or 404 on every static file |
| RESTART | Passenger keeps serving the old process |

---

## When a rebuild is needed

| Changed | Server needs |
|---|---|
| PHP, routes, migrations, settings | `git pull`, plus `config:cache` if `.env` changed |
| **Any `.tsx`, `.ts` or `.css`** | `git pull` **+ new `.next` + RESTART** |

One character of frontend source is enough. There is no partial update.
