# Go-PKL Student

Mobile-first frontend for students (intern role) of the Go-PKL platform.
Consumes the same backend API as the main web app (via Vite proxy in dev).

## Stack
Vite + React + TypeScript + Tailwind CSS v4

## Dev Setup

### Prerequisites
- Run `npm install` in **both** `gopkl/` and `gopkl-student/` folders.
- Backend `.env` must be present in `gopkl/` (copy from `.env.example` and configure `DATABASE_URL`, `JWT_SECRET`, etc.).
- Database must be migrated: `npx prisma migrate deploy` (run from `gopkl/`).

### Single-command dev

```bash
npm run dev:all
```

This starts both servers in one terminal:
- **Backend** (Express + Prisma): `http://localhost:3000`
- **Mobile dev server** (Vite): `http://localhost:5174`

The mobile app proxies `/api` and `/uploads` to the backend automatically.

### Ports
| Service | Port |
|---------|------|
| Backend API | :3000 |
| Web frontend (if running) | :5173 |
| Mobile frontend | :5174 |

### GPS Testing on a Phone
Geolocation requires a secure context (HTTPS). For device testing:

```bash
ngrok http 5174
```

Then open the ngrok URL on your phone. The Vite proxy will still forward to your local backend.

## Progress
- [x] Scaffold & design tokens
- [x] Login & auth
- [ ] Bottom navigation
- [ ] Absensi GPS
- [ ] Logbook
- [ ] Perizinan
- [ ] Profile & settings
- [ ] PWA installable