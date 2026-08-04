You are setting up a fresh full-stack e-commerce project called "Avyra" with a
decoupled architecture: Laravel (backend API) + Next.js (frontend, App Router).

Do this step by step, running each command and verifying success before
moving to the next step. If any command fails, stop, show me the exact
error, and suggest a fix before continuing.

### Environment check
1. Check installed versions and report them: `php -v`, `composer -v`,
   `mysql --version`, `node -v`, `npm -v`.
   - Required: PHP >= 8.2, Composer 2.x, Node >= 18, MySQL installed and running.
   - If anything is missing or below the required version, tell me the exact
     install command for my OS instead of proceeding.

### Step 1 — Create Laravel backend
2. In the current directory, run:
   `composer create-project laravel/laravel avyra-backend`
3. `cd avyra-backend`
4. Create a MySQL database named `avyra_db` with charset `utf8mb4`.
5. Update the `.env` file with:
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=avyra_db
   DB_USERNAME=root
   DB_PASSWORD= (ask me for the password, do not guess it)
6. Run `php artisan key:generate`.
7. Install Sanctum for API authentication: `php artisan install:api`.
8. Install these additional packages:
   - `composer require intervention/image` (for product image handling)
   - `composer require maatwebsite/excel` (for reports/exports)
9. Configure `config/cors.php`:
   - `paths` => `['api/*', 'sanctum/csrf-cookie']`
   - `allowed_origins` => `['http://localhost:3000']`
   - `supports_credentials` => `true`
10. Run `php artisan migrate` to confirm the DB connection works (default
    Laravel migrations only, for now).
11. Start the server in the background and confirm it responds:
    `php artisan serve` → check `http://localhost:8000`.

### Step 2 — Create Next.js frontend
12. Go back to the parent directory (outside avyra-backend).
13. Run:
    `npx create-next-app@latest avyra-frontend --typescript --eslint --tailwind --src-dir --app --import-alias "@/*"`
14. `cd avyra-frontend`
15. Initialize shadcn/ui: `npx shadcn@latest init` (choose defaults, Tailwind CSS variables: yes).
16. Install these packages:
    `npm install lucide-react framer-motion embla-carousel-react @tanstack/react-query zustand react-hook-form zod @hookform/resolvers date-fns sonner axios`
17. In `tailwind.config.ts`, set the font family to:
    fontFamily: {
      sans: ['Rethink Sans', 'system-ui', 'sans-serif'],
    }
18. Create `.env.local` with:
    NEXT_PUBLIC_API_URL=http://localhost:8000/api
19. Create a basic `src/lib/api.ts` file with an axios instance pre-configured
    to use `process.env.NEXT_PUBLIC_API_URL`, `withCredentials: true`.
20. Start the dev server and confirm it responds:
    `npm run dev` → check `http://localhost:3000`.

### Final verification
21. Summarize what was installed, list the two project folders created
    (avyra-backend, avyra-frontend), confirm both servers can start
    successfully, and list any manual steps I still need to do (e.g.
    entering my MySQL password, confirming ports are free).

Do NOT scaffold any database tables, models, or migrations beyond the
Laravel defaults yet — that will be a separate task after this setup
is confirmed working.
```

## PROMPT END

---

### ব্যবহারের নিয়ম
1. VS Code-এ **Copilot Chat** খুলুন, মোড **Agent** সিলেক্ট করুন (শুধু "Ask" মোডে থাকলে এটা কমান্ড রান করতে পারবে না)।
2. যে ফোল্ডারে backend আর frontend দুটো প্রজেক্ট বানাতে চান, সেই প্যারেন্ট ফোল্ডার VS Code-এ ওপেন করুন।
3. উপরের প্রম্পটটা পুরোটা পেস্ট করে এন্টার দিন।
4. মাঝে মাঝে MySQL পাসওয়ার্ড বা কনফার্মেশন চাইতে পারে — সেগুলো দিয়ে দিন।
5. শেষে "Final verification" অংশে Copilot একটা সামারি দেবে — সেটা মিলিয়ে নিশ্চিত হবেন দুটো সার্ভারই ঠিকমতো চলছে।

ইনস্টলেশন শেষ হলে জানাবেন — তারপর migrations + models বানানো শুরু করবো।
