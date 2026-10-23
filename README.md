# LearnLoop

A full-stack learning platform built with **HTML, CSS, vanilla JavaScript, Express, MongoDB, and Vercel**.

LearnLoop is designed around small, repeatable learning sessions:

- Browse a focused course catalog
- Create a student account
- Enroll in a course
- Read short lessons
- Mark lessons complete
- Track progress from a personal dashboard
- Create and publish courses from an instructor studio

The project is intentionally built without a frontend framework so the HTML, CSS, JavaScript, API, and database layers are all visible and easy to study.

---

## Live demo

Add your deployed URLs here after following the deployment guide:

- Frontend: `https://YOUR-FRONTEND-PROJECT.vercel.app`
- Backend: `https://YOUR-BACKEND-PROJECT.vercel.app`

---

## Features

### Public site

- Editorial landing page
- Responsive course catalog
- Search, category filters, and level filters
- Course detail pages with outcomes, requirements, and curriculum
- Login and registration pages
- Custom 404 page

### Student experience

- JWT authentication with an httpOnly cookie
- Free course enrollment
- Protected lesson player
- Previous/next lesson navigation
- Mark lessons complete or undo completion
- Progress saved in MongoDB
- Resume the last opened lesson
- Dashboard with:
  - Courses in library
  - Lessons completed
  - Minutes learned
  - Average progress
  - Continue-learning card
  - Recommended courses
- Logout from the dashboard

### Instructor experience

- Instructor-only Studio
- Private Studio access code after login
- Create draft courses
- Add lessons with multi-paragraph content
- Delete lessons
- Publish and unpublish courses
- Delete courses
- Preview draft and published courses
- Course and student counts

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, vanilla JavaScript ES modules |
| Backend | Node.js, Express 4 |
| Database | MongoDB Atlas with Mongoose |
| Authentication | bcryptjs, JSON Web Tokens, httpOnly cookies |
| Validation | Zod |
| Security | Helmet, rate-limited auth routes, SameSite cookies |
| Deployment | Vercel (separate frontend and backend projects) |

---

## Project structure

```text
learnloop/
├── frontend/
│   ├── index.html
│   ├── courses.html
│   ├── course.html
│   ├── learn.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── studio.html
│   ├── 404.html
│   ├── vercel.json
│   ├── css/
│   │   ├── style.css
│   │   ├── auth.css
│   │   ├── courses.css
│   │   ├── course.css
│   │   ├── learn.css
│   │   ├── dashboard.css
│   │   └── studio.css
│   └── js/
│       ├── api.js
│       ├── auth.js
│       ├── course-card.js
│       ├── courses.js
│       ├── course.js
│       ├── dashboard.js
│       ├── learn.js
│       ├── main.js
│       ├── studio.js
│       └── ui.js
├── backend/
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   ├── .env.example
│   ├── src/
│   │   ├── app.js
│   │   ├── db.js
│   │   ├── seed.js
│   │   ├── data/
│   │   │   └── courses.js
│   │   ├── lib/
│   │   │   ├── api-error.js
│   │   │   ├── progress.js
│   │   │   ├── search.js
│   │   │   ├── serialize.js
│   │   │   └── slugify.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── validate.js
│   │   ├── models/
│   │   │   ├── Course.js
│   │   │   ├── Enrollment.js
│   │   │   └── User.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── courses.js
│   │       ├── enrollments.js
│   │       ├── instructor.js
│   │       └── stats.js
│   └── test/
│       ├── auth.test.js
│       ├── courses.test.js
│       ├── lib.test.js
│       ├── models.test.js
│       ├── routes.test.js
│       └── run.js
├── .gitignore
└── README.md
```

---

## Local development

### Prerequisites

- Node.js 20 or newer
- npm
- A free MongoDB Atlas account
- VS Code (recommended)
- Git

### 1. Install the backend

```powershell
cd learnloop\backend
npm install
```

### 2. Create a MongoDB Atlas cluster

1. Create a free **M0** cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user with a strong password.
3. Under **Network Access**, add `0.0.0.0/0` for Vercel deployment.
4. Copy the connection string.

### 3. Create `backend/.env`

Copy `.env.example`:

```powershell
copy .env.example .env
```

Then fill in:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/learnloop?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
INSTRUCTOR_ACCESS_CODE=replace-with-a-private-studio-code
PORT=3000
```

`INSTRUCTOR_ACCESS_CODE` is a second, private code required after an instructor logs in. It is separate from the instructor account password.

Generate a secret:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Never commit `.env`. It is already ignored.

### 4. Seed the database

```powershell
npm run seed
```

This creates:

- 6 published courses
- 31 lessons
- 3 demo enrollments
- A student account
- An instructor account

> The seed script rebuilds courses and enrollments. It will remove existing courses and enrollment progress. Do not run it repeatedly on a production database with real users.

If your database is already seeded and you only need the instructor profile updated to **Anas Manzoor**, run:

```powershell
npm run update-instructor
```

### 5. Start the development server

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

The Express server serves the frontend locally, so the frontend and API share one origin.

---

## Demo accounts

After running `npm run seed`:

```text
Student
email:    student@learnloop.dev
password: Student123!

Instructor
name:     Anas Manzoor
email:    instructor@learnloop.dev
password: Teach123!
Studio access code: TeachStudio2026!
```

The login page includes one-click demo buttons.

The instructor demo does not go straight into the Studio. After login, it asks for `INSTRUCTOR_ACCESS_CODE`. The development fallback is `TeachStudio2026!`; set a private value in `.env` and in Vercel.

> Change or remove these accounts before using the project publicly.

---

## Scripts

Run from `backend/`:

| Command | Description |
|---|---|
| `npm run dev` | Start Express with `node --watch` |
| `npm start` | Start Express normally |
| `npm run seed` | Seed MongoDB with demo data |
| `npm run update-instructor` | Rename the existing instructor profile without resetting data |
| `npm test` | Run the backend test suite |

---

## API overview

### Public

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/courses` | List and filter published courses |
| `GET` | `/api/courses/:slug` | Course detail and curriculum |
| `GET` | `/api/stats` | Public course and learner stats |

Catalog query parameters:

```text
?search=javascript
?category=Backend
?level=Intermediate
```

### Authentication

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a student account |
| `POST` | `/api/auth/login` | Log in |
| `POST` | `/api/auth/logout` | Clear the auth cookie |
| `GET` | `/api/auth/me` | Return the current user or `null` |

### Student

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/courses/:slug/learn` | Protected lesson content |
| `POST` | `/api/courses/:id/enroll` | Enroll in a course |
| `GET` | `/api/enrollments/me` | Dashboard enrollments and progress |
| `PATCH` | `/api/enrollments/:courseId` | Save the last opened lesson |
| `PUT` | `/api/enrollments/:courseId/lessons/:lessonId` | Mark a lesson complete or incomplete |

### Instructor

All instructor routes require an instructor account **and** an unlocked Studio session.

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/instructor/access` | Check whether the Studio is unlocked |
| `POST` | `/api/instructor/access` | Verify the private access code |
| `POST` | `/api/instructor/lock` | Clear the Studio access cookie |
| `GET` | `/api/instructor/courses` | List owned courses and student counts |
| `POST` | `/api/instructor/courses` | Create a draft course |
| `PATCH` | `/api/instructor/courses/:id` | Publish or unpublish |
| `POST` | `/api/instructor/courses/:id/lessons` | Add a lesson |
| `DELETE` | `/api/instructor/courses/:id/lessons/:lessonId` | Delete a lesson |
| `DELETE` | `/api/instructor/courses/:id` | Delete a course and its enrollments |

---

## Data model

### User

- `name`
- `email` — unique, lowercased
- `passwordHash` — excluded from queries by default
- `role` — `student` or `instructor`
- `headline`

### Course

- `title`, `slug`, `tagline`, `description`
- `category`, `level`, `price`, `accent`
- `outcomes`, `requirements`
- `lessons[]` — embedded documents with title, summary, duration, content
- `instructor`
- `published`
- `rating`, `reviewCount`

### Enrollment

- `user`
- `course`
- `completedLessons[]`
- `lastLessonId`

A unique compound index on `{ user, course }` prevents duplicate enrollments.

---

## How progress is calculated

For each course and enrollment:

```text
completed lessons / total lessons → percentage
sum of completed lesson durations → minutes learned
```

Progress is computed on the server and returned with the course data.

---

## Deployment to Vercel

Vercel deploys the frontend and backend as **two projects from the same repository**.

Why two projects?

- `frontend/` is a static site.
- `backend/` is an Express app running as a Vercel Function.
- A rewrite on the frontend proxies `/api` to the backend, keeping cookies first-party.

This avoids CORS and keeps the browser using the same origin.

### Step 1 — Push to GitHub

```powershell
cd learnloop
git init
git add .
git commit -m "feat: complete LearnLoop"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/learnloop.git
git push -u origin main
```

### Step 2 — Deploy the backend

1. Open [vercel.com/new](https://vercel.com/new).
2. Import the repository.
3. Set **Root Directory** to `backend`.
4. Leave the framework preset as **Express** if detected. Otherwise choose **Other**.
5. Add environment variables:

```text
MONGODB_URI=your Atlas connection string
JWT_SECRET=your long random secret
INSTRUCTOR_ACCESS_CODE=your private Studio code
```

6. Deploy.
7. Open:

```text
https://YOUR-BACKEND-PROJECT.vercel.app/api/health
```

Expected:

```json
{
  "ok": true,
  "service": "learnloop-api",
  "time": "..."
}
```

Vercel detects `backend/server.js` and exports the Express app as a serverless function. The server does not call `app.listen()` when `VERCEL` is present.

### Step 3 — Configure MongoDB Atlas

In Atlas:

1. Go to **Network Access**.
2. Add `0.0.0.0/0`.

Vercel Functions do not expose one fixed outbound IP by default. For a stricter production setup, use a static egress IP or private networking.

### Step 4 — Point the frontend at the backend

Open:

```text
frontend/vercel.json
```

Replace:

```text
https://YOUR-BACKEND-PROJECT.vercel.app
```

with your real backend deployment URL.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR-BACKEND-PROJECT.vercel.app/api/:path*"
    }
  ]
}
```

Commit and push the change.

### Step 5 — Deploy the frontend

1. Open [vercel.com/new](https://vercel.com/new).
2. Import the same repository.
3. Set **Root Directory** to `frontend`.
4. Choose **Other** as the framework.
5. No build command is required.
6. Deploy.

### Step 6 — Verify production

Open the frontend URL:

```text
https://YOUR-FRONTEND-PROJECT.vercel.app
```

Check:

- Landing page loads
- `/courses.html` loads
- `/api/health` returns JSON through the rewrite
- Registration works
- Login sets a cookie
- Dashboard loads
- Enrolling and completing a lesson works
- Instructor login opens `/studio.html`
- Creating a course and adding a lesson works

### Why the rewrite matters

```text
Browser
  │  fetch("/api/courses")
  ▼
Frontend domain
  │  Vercel rewrite
  ▼
Backend domain /api/courses
  │
  ▼
MongoDB Atlas
```

Because the browser sees `/api` on the frontend domain:

- No CORS configuration is needed
- Cookies stay first-party
- `SameSite=Lax` continues to work
- The frontend code does not need an API base URL

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes in production | Secret used to sign auth tokens |
| `INSTRUCTOR_ACCESS_CODE` | Yes in production | Private code required to unlock the Studio |
| `PORT` | No | Local server port, defaults to `3000` |

Vercel sets `NODE_ENV=production` and `VERCEL=1` automatically.

---

## Security notes

This is a learning project, but it already includes several production-minded choices:

- Passwords hashed with bcrypt
- JWT stored in an httpOnly cookie
- Secure cookies in production
- SameSite=Lax
- Auth rate limiting
- Zod request validation
- Helmet security headers
- Central error handler
- Server-side role guards
- Extra instructor Studio access code with a separate 8-hour httpOnly cookie
- Escaped API data before rendering
- No secrets committed to Git

Before using this publicly:

- Change the demo passwords or remove the demo accounts
- Set a strong, unique `INSTRUCTOR_ACCESS_CODE`
- Use a strong, unique `JWT_SECRET`
- Review Atlas network access
- Add a distributed rate limiter for multi-instance deployments
- Add a CSRF strategy if you introduce cross-site forms
- Add backups and monitoring
- Add payment handling before charging for courses

All seed courses are currently free. The `price` field exists for future payment integration, but no payment provider is implemented.

---

## Troubleshooting

### `503` — The database is not configured

`MONGODB_URI` is missing.

```text
Add MONGODB_URI to backend/.env locally,
and to the backend Vercel project's environment variables.
```

### `MongoServerSelectionError`

- Check the Atlas connection string
- Check the database user's password
- Check Atlas Network Access
- Confirm the cluster is running

### `401` after logging in on Vercel

- Confirm `frontend/vercel.json` points at the correct backend URL
- Confirm all API calls use `/api/...`
- Make sure the frontend rewrite is deployed
- Check that the backend is using HTTPS
- Check the browser Network tab for `Set-Cookie`

### `404` on `/api/...` in production

The rewrite is missing or still contains the placeholder URL.

Update `frontend/vercel.json`, commit, and redeploy the frontend.

### `JWT_SECRET is not configured`

Add `JWT_SECRET` to the backend Vercel project and redeploy.

### `INSTRUCTOR_ACCESS_CODE is not configured`

Add `INSTRUCTOR_ACCESS_CODE` to `backend/.env` locally and to the backend Vercel project, then restart/redeploy.

### The Studio keeps asking for the access code

- Check the code against `INSTRUCTOR_ACCESS_CODE`.
- Studio access expires after 8 hours.
- Logging out clears it.
- Wrong codes are limited to 10 attempts per 15 minutes.

### `EADDRINUSE` locally

Port `3000` is already in use. Change `PORT` in `backend/.env` or stop the other process.

### Seed data is gone

`npm run seed` rebuilds courses and enrollments. Do not run it on a database with real user progress unless that is intentional.

---

## Tests

```powershell
cd learnloop\backend
npm test
```

The test suite covers:

- Mongoose schemas and seed data
- JWT signing and cookie options
- Auth middleware and role guards
- Zod validation
- Progress calculations
- Course serialization
- Slug generation
- Public API guards
- Instructor route protection

---

## Future improvements

- Course reviews and ratings
- Certificates
- Video lessons
- Rich text or Markdown lesson editor
- Course editing form
- Instructor analytics
- Email notifications
- Password reset
- Refresh tokens and session management
- Stripe checkout for paid courses
- Search pagination
- Social sharing cards
- Automated end-to-end tests with Playwright

---

## Built with

- HTML
- CSS
- JavaScript
- Node.js
- Express
- MongoDB
- Mongoose
- Vercel

Built as a student project for learning full-stack development.
