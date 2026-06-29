# Agent Workflow

## Mandatory CI loop

After every change, run until green:

1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm test`
4. `npm run build`

## Documentation maintenance

At session end, verify accuracy of:

- `README.md`
- `DEPLOYMENT.md`
- `INTEGRATION-SUMMARY.md`
- `.env.example`
- `AGENTS.md`

## Package manager

npm only. Use `npm ci` in CI.