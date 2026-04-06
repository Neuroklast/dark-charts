import { MainGenre, Genre } from '@/types';

export const mainGenreMap: Record<MainGenre, Genre[]> = {
  'Gothic': [
    'Gothic Rock', 'Dark Wave', 'Post Punk', 'Deathrock', 'Cold Wave',
    'Ethereal Wave', 'Neoklassik', 'Neue Deutsche Todeskunst', 'Batcave',
    'Neofolk', 'Pagan Folk', 'Nordic Folk', 'Ritual Ambient'
  ],
  'Metal': [
    'Gothic Metal', 'Dark Metal', 'Symphonic Metal', 'Doom Metal',
    'Symphonic Black Metal', 'Atmospheric Black Metal', 'Death Doom', 'Pagan Metal'
  ],
  'Dark Electro': [
    'Electronic Body Music', 'Dark Electro', 'Electro Industrial', 'Aggrotech',
    'Future Pop', 'Industrial', 'Rhythmic Noise', 'Dark Synthpop', 'Harsh EBM'
  ],
  'Crossover': [
    'Industrial Metal', 'Neue Deutsche Härte', 'Mittelalter Rock', 'Darksynth',
    'Cybergoth', 'Death Industrial', 'Folk Metal', 'Dark Techno',
    'Industrial Techno', 'Darkstep', 'Crossbreed', 'Techstep', 'Neurofunk'
  ]
};
