# Dark Charts API Documentation

This directory contains serverless function handlers for the Dark Charts API, designed for deployment on Vercel.

## API Endpoints

### Charts API (`/api/charts`)

Fetch chart data by type.

**Method:** `GET`

**Query Parameters:**
- `type` (required): Chart type - `fan`, `expert`, or `streaming`
- `limit` (optional): Number of results (1-100, default: 10)

**Example:**
```
GET /api/charts?type=fan&limit=10
```

**Response:**
```json
{
  "success": true,
  "chartType": "fan",
  "entries": [...],
  "count": 10
}
```

---

### Voting API (`/api/vote`)

Submit a vote for a release.

**Method:** `POST`

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (if authentication is implemented)

**Request Body:**
```json
{
  "fanId": "string",
  "releaseId": "string",
  "credits": number,
  "votes": number
}
```

**Response:**
```json
{
  "success": true,
  "vote": {...},
  "remainingCredits": number
}
```

---

### Releases API (`/api/releases`)

Fetch release data.

**Method:** `GET`

**Query Parameters:**
- `id` (optional): Specific release ID
- `limit` (optional): Number of results (1-100, default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Example:**
```
GET /api/releases?limit=20&offset=0
GET /api/releases?id=release-id
```

**Response (list):**
```json
{
  "success": true,
  "releases": [...],
  "pagination": {
    "total": number,
    "limit": number,
    "offset": number,
    "hasMore": boolean
  }
}
```

**Response (single):**
```json
{
  "success": true,
  "release": {...}
}
```

---

## Architecture

### Prisma Singleton

All API endpoints use the Prisma client singleton located at `src/backend/lib/prisma.ts`. This prevents database connection exhaustion in the serverless environment by reusing connections across function invocations.

### CORS Headers

All endpoints include CORS headers to allow cross-origin requests from the frontend application.

### Error Handling

All endpoints include comprehensive error handling with appropriate HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `404`: Not Found
- `405`: Method Not Allowed
- `500`: Internal Server Error

### Database Disconnection

Each handler explicitly disconnects from the database in a `finally` block to prevent connection leaks.

## Development

The API handlers are TypeScript files that export a default function compatible with Vercel's serverless function format.

## Deployment

These endpoints are automatically deployed as Vercel serverless functions when the project is deployed. The `vercel.json` configuration handles routing:

- `/api/*` routes to the serverless functions
- All other routes serve the static frontend (`index.html`)
