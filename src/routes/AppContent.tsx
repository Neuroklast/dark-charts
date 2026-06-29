/**
 * @deprecated Migrated to Next.js App Router.
 * Route pages live under app/(main)/ and app/admin/.
 * Shared layout: app/(main)/_components/MainLayoutClient.tsx
 * Chart state: app/(main)/_components/ChartShellClient.tsx
 *
 * Run the App Router app with: npx next dev
 */
export default function AppContent() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-lg text-center space-y-4">
        <h1 className="font-display text-2xl uppercase text-foreground">AppContent Deprecated</h1>
        <p className="font-ui text-sm text-muted-foreground">
          This monolithic view router has been split into Next.js App Router pages under{' '}
          <code className="text-primary">app/</code>. Use <code className="text-primary">npx next dev</code>{' '}
          to run the application.
        </p>
      </div>
    </div>
  );
}