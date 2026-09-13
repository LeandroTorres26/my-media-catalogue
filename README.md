# My Media Catalogue

A personal catalogue for tracking movies, TV shows, anime and documentaries — what
you're watching, where you stopped, and what you thought of it.

Built as a full-stack Next.js application with TMDB integration for metadata and an
LLM fallback for the gaps TMDB doesn't cover.

## Features

**Catalogue**

- Track media across four categories: movies, TV shows, anime and documentaries
- Five watch statuses: watching, on hold, completed, dropped, planning
- Season and episode progress for serialized media
- Half-star rating, genres, synopsis and release year
- Expandable cards showing full details

**Finding things**

- Debounced search by title
- Filter by category
- Nine sort options — alphabetical, date added, last modified, release year, rating

**Filling the form**

- **TMDB search** auto-fills title, poster, synopsis, genres and release year
- **AI generation** for genres, synopsis and release year when TMDB falls short

**Accounts**

- Email/password authentication, each user with their own private catalogue

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, Turbopack in dev) |
| UI | React 19, Tailwind CSS 4, daisyUI 5 |
| Language | TypeScript (strict) |
| Client state | Zustand 5 |
| Database | MongoDB with Mongoose 8 |
| Auth | NextAuth.js 4 (credentials + JWT), bcrypt |
| Testing | Vitest |
| External APIs | TMDB, and any OpenAI-compatible LLM provider |

## Architecture notes

A few decisions that aren't obvious from the file tree.

### Client state and server state are separated

Zustand holds only UI state — filters, modal visibility, which media is being edited.
Server data is fetched per request rather than being mirrored into a global store
beyond its immediate use. Keeping the two apart is what lets the store stay small and
fully unit-testable without React.

### The media form uses `useReducer`, not `useState`

The form's fields depend on each other: season and episode only exist for serialized
categories that are still in progress, and the rating only applies once you've started
watching. With scattered `useState` setters, every transition that invalidates progress
has to remember to clear it. A reducer puts that rule next to the transition, so it
can't be forgotten:

```ts
case "setStatus":
  return clearProgressIfHidden({ ...state, status: action.status });
```

### The AI layer is provider-agnostic

Gemini, Groq and a locally-hosted Ollama all speak the same chat-completions protocol,
so the integration is plain `fetch` against a configurable base URL — no vendor SDK.
Switching providers or models is an environment variable, not a code change:

```bash
AI_PROVIDER=gemini   # or groq, or ollama for offline development
AI_MODEL=gemini-flash-latest
```

The layer requests JSON mode for structured output and retries transient upstream
failures (429, 503) with exponential backoff.

### TMDB is the source of truth; the LLM is not

TMDB is queried first because it returns *facts* — the official synopsis, the exact
release date, the real poster. An LLM asked to recall the same information about a
niche title will fabricate it convincingly, which is worse than returning nothing.

The AI's remaining job is the one thing TMDB structurally cannot do: TMDB's entire TV
taxonomy is sixteen broad genres, so an anime comes back as *"Animation, Action &
Adventure, Sci-Fi & Fantasy"* with no room for `shounen`, `mecha` or `isekai`.
Suggesting those is classification over a synopsis the app already has — which is what
language models are actually good at.

## Getting started

### Prerequisites

- Node.js 18.18 or newer
- Yarn 1.x (the repo pins it via `packageManager`)
- A MongoDB database — local or Atlas
- A [TMDB API key](https://www.themoviedb.org/settings/api)
- An API key for one LLM provider (see below)

### Install

```bash
yarn install
```

### Environment

Create `.env.local` in the project root:

```bash
# Database
MONGODB_URI=mongodb+srv://...

# Auth — any long random string
NEXTAUTH_SECRET=...

# TMDB
TMDB_API_KEY=...

# AI provider — pick one
AI_PROVIDER=gemini              # gemini | groq | ollama
AI_MODEL=gemini-flash-latest    # a model id valid for that provider
GOOGLE_API_KEY=...              # required when AI_PROVIDER=gemini
GROQ_API_KEY=...                # required when AI_PROVIDER=groq
```

For offline development, set `AI_PROVIDER=ollama` and point `AI_MODEL` at a model you
have pulled locally. Ollama is development-only — a serverless deployment has no local
model to reach.

### Run

```bash
yarn dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | What it does |
| --- | --- |
| `yarn dev` | Development server with Turbopack |
| `yarn build` | Production build |
| `yarn start` | Serve the production build |
| `yarn lint` | ESLint |
| `yarn test` | Vitest in watch mode |
| `yarn test:run` | Vitest once, for CI |

## Testing

The catalogue store is covered by unit tests that run without React or a DOM — the
store is plain JavaScript, so the tests drive it directly and assert on the resulting
state. They cover query-string building, the loading lifecycle, and both failure paths
of the fetch.

```bash
yarn test:run
```

## API routes

| Route | Purpose |
| --- | --- |
| `POST /api/user/register` | Create an account |
| `POST /api/user/login` | Verify credentials |
| `/api/auth/[...nextauth]` | NextAuth session handling |
| `GET /api/user/medias` | The signed-in user's catalogue, filtered and sorted |
| `POST /api/media` | Create a media entry |
| `GET PATCH DELETE /api/media/[id]` | Read, update or delete one entry |
| `GET /api/search` | Search TMDB |
| `POST /api/generate` | Generate genres, synopsis or release year |

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
