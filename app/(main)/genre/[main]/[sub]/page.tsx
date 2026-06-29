'use client';

import { notFound } from 'next/navigation';
import { use } from 'react';
import { slugToMainGenre, slugToSubGenre } from '@/lib/routes';
import { GenrePageClient } from '../../../_components/GenrePageClient';

interface SubGenrePageProps {
  params: Promise<{ main: string; sub: string }>;
}

export default function SubGenrePage({ params }: SubGenrePageProps) {
  const { main, sub } = use(params);
  const mainGenre = slugToMainGenre(main);

  if (!mainGenre) {
    notFound();
  }

  const subGenre = slugToSubGenre(sub, mainGenre);
  if (!subGenre) {
    notFound();
  }

  return <GenrePageClient mainGenre={mainGenre} subGenre={subGenre} />;
}