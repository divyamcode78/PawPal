## PawPal

This app was created using https://getmocha.com.
Need help or want to join the community? Join our [Discord](https://discord.gg/shDEGBSe2d).

### Local development
```
npm install
npm run dev
```

### Backend / MongoDB
This project now uses an Express backend in the `server/` folder, with MongoDB for login and signup.

Create a `.env` file at the repo root with values like:
```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.example.mongodb.net/?retryWrites=true&w=majority
MONGO_DB_NAME=pawpal
JWT_SECRET=your-super-secret-jwt-key
MOCHA_USERS_SERVICE_API_URL=your-mocha-api-url
MOCHA_USERS_SERVICE_API_KEY=your-mocha-api-key
```

Install dependencies:
```bash
npm install
```

Run the frontend and backend separately:
- Frontend: `npm run dev` (served at `http://localhost:3000`)
- Backend: `npm run server:dev` (served at `http://localhost:4000`)

The frontend automatically proxies `/api/*` requests to the backend, so frontend code can call endpoints like `/api/auth/register`.

Auth endpoints:
- `POST /register`
  - Body: `{ "email": "you@example.com", "password": "P@ssw0rd!", "name": "Your Name" }`
  - Response: `{ user, token }`
- `POST /login`
  - Body: `{ "email": "you@example.com", "password": "P@ssw0rd!" }`
  - Response: `{ user, token }`
- `GET /me`
  - Header: `Authorization: Bearer <token>`
  - Response: authenticated user data

Example register request:
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"P@ssw0rd!","name":"You"}'
```

Example login request:
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"P@ssw0rd!"}'
```

Example auth request:
```bash
curl http://localhost:3000/me \
  -H "Authorization: Bearer <token>"
```

This repo also includes `.env` and `test.env` as example files. The old `migrations/` SQL files were part of the previous D1 setup and are not used by the MongoDB backend.

### Notes
- Frontend development: `npm run dev`
- Backend development: `npm run server:dev`
- MongoDB must be reachable from your local machine or deployment target.
