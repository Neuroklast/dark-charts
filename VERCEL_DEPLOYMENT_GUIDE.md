# Vercel Deployment Guide

This document outlines the final deployment configuration for Dark Charts on Vercel.

## Prerequisites

Before deploying, ensure you have:

1. A Vercel account
2. A PostgreSQL database (recommended: Vercel Postgres or Supabase)
3. Required environment variables configured in Vercel

## Environment Variables

Configure these environment variables in your Vercel project settings:

```bash
DATABASE_URL="postgresql://user:password@host:port/database"
NODE_ENV="production"
```

Optional variables (for OAuth and external services):
```bash
SPOTIFY_CLIENT_ID="your-spotify-client-id"
SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"
GITHUB_TOKEN="your-github-token"
```

## Deployment Architecture

### 1. API Structure (`/api`)

Serverless functions handle backend logic:
- `/api/charts.ts` - Chart data retrieval
- `/api/vote.ts` - Voting functionality  
- `/api/releases.ts` - Release data management

Each function:
- Uses the Prisma singleton to prevent connection exhaustion
- Handles CORS for cross-origin requests
- Includes comprehensive error handling
- Disconnects from database in `finally` blocks

### 2. Frontend (`/dist`)

Static React application built with Vite:
- Single Page Application (SPA)
- Client-side routing handled by rewrites in `vercel.json`
- All routes serve `index.html` except `/api/*`

### 3. Database Layer

Prisma ORM with singleton pattern:
- Location: `src/backend/lib/prisma.ts`
- Prevents connection pool exhaustion in serverless environment
- Automatically generates types from schema
- Runs `prisma generate` during build process

## Build Process

The `package.json` build script executes:

```bash
prisma generate && tsc -b --noCheck && vite build
```

Steps:
1. **`prisma generate`** - Generates Prisma Client from schema
2. **`tsc -b --noCheck`** - TypeScript compilation (type checking disabled for speed)
3. **`vite build`** - Bundles frontend application

The `postinstall` script also runs `prisma generate` to ensure the client is available after npm install.

## Routing Configuration (`vercel.json`)

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/node@3.0.0"
    }
  }
}
```

- API routes (`/api/*`) map to serverless functions
- All other routes serve the SPA's `index.html` for client-side routing
- Functions use Node.js runtime version 3.0.0

## Database Migrations

### Initial Setup

1. Push schema to database:
```bash
npx prisma db push
```

2. Generate Prisma Client:
```bash
npx prisma generate
```

### Production Migrations

For production deployments, use Prisma Migrate:

```bash
npx prisma migrate deploy
```

This should be run in a separate step before deploying the application, or as part of a build hook.

## Deployment Steps

### Via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Link project:
```bash
vercel link
```

3. Deploy to production:
```bash
vercel --prod
```

### Via GitHub Integration

1. Connect repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Push to main branch - automatic deployment triggers

## Monitoring

### Database Connections

Monitor Prisma connection pool usage in serverless environment:
- Check Vercel function logs for connection errors
- Review database provider's connection metrics
- Adjust `connection_limit` in `DATABASE_URL` if needed

### Function Performance

Vercel provides:
- Execution time metrics
- Error rates
- Invocation counts
- Memory usage

Access via: Vercel Dashboard → Project → Analytics

## Troubleshooting

### Prisma Client Not Generated

**Solution:** Ensure `postinstall` script runs:
```bash
npm run postinstall
```

### Database Connection Errors

**Solutions:**
1. Verify `DATABASE_URL` environment variable
2. Check database is accessible from Vercel's network
3. Ensure connection pool isn't exhausted
4. Review Prisma singleton implementation

### Build Failures

**Solutions:**
1. Check TypeScript errors (even with `--noCheck`, some errors may prevent build)
2. Verify all dependencies are in `package.json`
3. Review build logs in Vercel dashboard

### API CORS Errors

**Solution:** Verify CORS headers in API functions:
```typescript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
```

## Performance Optimization

### Cold Starts

Serverless functions have cold start latency. To minimize:
1. Keep function bundle sizes small
2. Use lazy loading for heavy dependencies
3. Consider warming functions with scheduled pings

### Database Queries

Optimize with:
1. Proper indexes on frequently queried fields
2. `select` to fetch only needed fields
3. Pagination for large result sets
4. Database query caching where appropriate

### Frontend Caching

Configure cache headers for static assets in `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## Security Considerations

1. **Environment Variables:** Never commit secrets to repository
2. **API Authentication:** Implement proper auth for voting and mutations
3. **Rate Limiting:** Consider adding rate limiting to API endpoints
4. **Input Validation:** All API endpoints validate inputs
5. **SQL Injection:** Prisma protects against SQL injection by default

## Next Steps

After deployment:

1. Test all API endpoints
2. Verify database connectivity
3. Check frontend routing
4. Monitor error logs
5. Set up domain (if using custom domain)
6. Configure SSL certificate (automatic with Vercel)
7. Enable Web Analytics in Vercel dashboard

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vite Documentation](https://vitejs.dev)
