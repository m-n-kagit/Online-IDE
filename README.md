# Online IDE

A browser-based IDE powered by StackBlitz WebContainer, with a Node/Express backend that stores editor sessions and file snapshots in MongoDB.

The frontend runs the project workspace inside the browser. The backend manages persistent sessions with cookie-based authentication and stores the latest file tree/content for each session.

## Features

- Browser-based Node.js runtime using WebContainer
- Monaco code editor with tabbed files and auto-save
- Interactive terminal powered by xterm.js
- File tree with create file, create folder, delete, open, and edit actions
- Live preview for the WebContainer dev server
- Resizable IDE layout
- Backend-managed sessions with HTTP-only cookies
- MongoDB session persistence using `SessionModel` and `FileModel`
- Session restore on app boot
- Full file snapshot saving when files are edited or file tree changes

## Project Structure

```text
.
+-- backend/
|   +-- controller/
|   |   +-- sessioncontroller.ts
|   +-- middleware/
|   |   +-- session_auth.ts
|   +-- routes/
|   |   +-- session.routes.ts
|   +-- schema/
|   |   +-- File.models.ts
|   |   +-- Session.models.ts
|   +-- utils/
|   |   +-- generateToken.ts
|   +-- server.ts
|   +-- .env
+-- webcontainer-ide/
    +-- src/
    |   +-- editor/
    |   +-- session/
    |   +-- store/
    |   +-- ui/
    |   +-- webcontainer/
    +-- index.html
    +-- package.json
```

## How Session Persistence Works

When the IDE starts, the frontend calls `GET /sessions/current` with cookies enabled. If a valid session cookie exists, the backend retrieves the session and its saved files from MongoDB. The frontend then mounts those files into the WebContainer filesystem.

If no valid session exists, the frontend calls `POST /sessions`. The backend creates a new session, signs a JWT session token, stores the session in MongoDB, and sends the token as an HTTP-only cookie.

When a file is edited, created, or deleted, the frontend exports the current WebContainer file tree and sends it to:

```http
PUT /sessions/:sessionId/files
```

The backend validates the cookie, verifies the session, deletes the previous file snapshot for that session, and inserts the latest files into MongoDB. This means the latest content for each file path is stored without duplicate copies for the same session/path.

## Backend API

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/sessions` | Create a new session and set session cookie |
| `GET` | `/sessions/current` | Restore the current cookie-authenticated session |
| `GET` | `/sessions/:sessionId` | Retrieve a specific session if the cookie matches |
| `PUT` | `/sessions/:sessionId/files` | Save/update files for the session |
| `DELETE` | `/sessions/:sessionId` | Delete the session and its files |
| `GET` | `/health` | Backend health check |

## Database Schemas

### SessionModel

```ts
{
  sessionId: string;
  tokenId: string;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### FileModel

```ts
{
  sessionId: string;
  name: string;
  path: string;
  type: "file" | "directory";
  content: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}
```

`FileModel` uses a unique index on `{ sessionId, path }`, so one session stores one latest version of each file path.

## Prerequisites

- Node.js 18+
- npm or pnpm
- A modern browser with SharedArrayBuffer support
- MongoDB Atlas or a local MongoDB server

For WebContainer to work in production, the frontend must be served with these headers:

```text
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

## Environment Variables

Create or update `backend/.env`:

```env
ACCESS_TOKEN_SECRET=your_secret_here
ACCESS_TOKEN_EXPIRY=1d
MONGODB_URI=mongodb+srv://username:password@cluster-url/database-name
CLIENT_ORIGIN=http://localhost:5173
PORT=3000
```

For the frontend, optionally create `webcontainer-ide/.env`:

```env
VITE_BACKEND_URL=http://localhost:3000
```

If `VITE_BACKEND_URL` is not set, the frontend defaults to `http://localhost:3000`.

## Running Locally

### Start Backend

```bash
cd backend
npm install
npm run dev
```

The backend runs on `http://localhost:3000` by default.

### Start Frontend

```bash
cd webcontainer-ide
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` by default.

## Frontend Session Flow

Important frontend files:

- `src/session/sessionApi.ts` handles backend session requests.
- `src/webcontainer/init.ts` restores or creates a session during boot.
- `src/webcontainer/sessionPersistence.ts` exports WebContainer files and saves snapshots.
- `src/editor/Editor.tsx` triggers save after editor changes.
- `src/ui/FileTree.tsx` triggers save after file/folder create and delete actions.

## Backend Session Flow

Important backend files:

- `server.ts` configures Express, CORS, cookies, MongoDB, and routes.
- `routes/session.routes.ts` defines session endpoints.
- `controller/sessioncontroller.ts` creates, retrieves, saves, and deletes sessions.
- `middleware/session_auth.ts` validates the session cookie/JWT.
- `schema/Session.models.ts` stores session metadata.
- `schema/File.models.ts` stores file snapshots.
- `utils/generateToken.ts` signs session tokens.

## Usage

1. Start the backend.
2. Start the frontend.
3. Open the IDE in the browser.
4. The app restores an existing session cookie or creates a new session.
5. Edit files in Monaco Editor.
6. File content is saved to MongoDB through the backend session API.
7. Reload the page to restore the saved session and files.

## Deployment Notes

Frontend hosting must include COOP/COEP headers for WebContainer support. The included Netlify headers can be used for static frontend deployment.

The backend should be deployed separately with these environment variables configured:

- `ACCESS_TOKEN_SECRET`
- `ACCESS_TOKEN_EXPIRY`
- `MONGODB_URI`
- `CLIENT_ORIGIN`
- `PORT`

When the frontend and backend are on different domains, keep CORS credentials enabled on the backend and use `credentials: "include"` from the frontend.

## Current Limitations

- File persistence saves a full session snapshot instead of patching a single file.
- Sessions are cookie-based, so browser cookie settings affect restore behavior.
- WebContainer cannot access the user's local filesystem directly.
- WebContainer networking still follows browser CORS rules.
- MongoDB must run outside the WebContainer, either locally for the backend or through Atlas.

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- WebContainer API
- Monaco Editor
- xterm.js
- Zustand
- TailwindCSS
- Radix UI
- lucide-react

### Backend

- Node.js
- Express
- TypeScript
- Mongoose
- MongoDB / MongoDB Atlas
- JSON Web Tokens
- cookie-parser
- cors
