import { HomeChartsView } from './_components/HomeChartsView';

export default function HomePage() {
  return (
    <main id="main-content" className="w-full px-4 md:px-8 py-8">
      <div className="mx-auto max-w-5xl">
        <HomeChartsView />
      </div>
    </main>
  );
}