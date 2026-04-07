# Node Backend

This folder now runs a small Express API that matches the frontend admin/data routes.

## Run

```bash
npm install
npm run dev
```

The server starts on `http://127.0.0.1:8080` by default.

## Endpoints

- `GET /health`
- `GET /admin/:collection`
- `GET /admin/:collection/:id`
- `POST /admin/:collection`
- `PUT /admin/:collection/:id`
- `DELETE /admin/:collection/:id`
- `GET /admin/users/admins`
- `PUT /admin/faculty/:facultyId/assign-subject`
- `PUT /admin/faculty/:facultyId/assign-event`
- `POST /admin/faculty/message-student`
- `PUT /admin/schedules/:scheduleId/reassign`
- `GET /student/discipline-records`

## Storage

Data is stored in `data/db.json` as a simple JSON file so the API works without a separate database.

## Deployment

This backend is a long-running Express server, so it should be deployed to a Node host such as Render, Railway, Fly.io, or a VPS. It is not a good fit for Netlify functions.

Render web service settings:

- Service type: Web Service (not Static Site)
- Root directory: `backend/`
- Build command: `npm install`
- Start command: `npm start`
- Environment variable: `PORT` is optional; Render sets it automatically

If Render shows `Publish directory node index.js does not exist`, the service was created as a Static Site or has a publish directory configured incorrectly. Recreate it as a Web Service, or deploy using the repository `render.yaml` blueprint.

Important:

- The API writes to `data/db.json`, so the host should provide persistent disk storage if you want changes to survive restarts.
- After deployment, set the frontend `VITE_API_BASE_URL` to the deployed backend URL instead of `http://127.0.0.1:8080`.
