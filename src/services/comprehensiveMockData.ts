import { Track, MainGenre, Genre } from '@/types';

const generateTrackData = (
  id: string,
  rank: number,
  artist: string,
  title: string,
  genres: Genre[],
  chartType: 'fan' | 'expert' | 'streaming',
  album: string,
  releaseDate: string,
  label: string,
  fanScore: number,
  expertScore: number,
  streamingScore: number,
  votes: number
): Track => ({
  id,
  rank,
  artist,
  title,
  genres,
  movement: rank > 1 ? Math.floor(Math.random() * 5) - 2 : 0,
  previousRank: rank > 1 ? rank + (Math.floor(Math.random() * 3) - 1) : undefined,
  chartType,
  fanScore,
  expertScore,
  streamingScore,
  albumArt: `https://picsum.photos/seed/${id}/400/400`,
  spotifyUri: `spotify:track:${id}`,
  votes,
  album,
  releaseDate,
  label,
  appleMusicUrl: `https://music.apple.com/${id}`,
  amazonMusicUrl: `https://music.amazon.com/${id}`,
  youtubeUrl: `https://youtube.com/watch?v=${id}`
});

export const OVERALL_FAN_CHARTS: Track[] = [
  generateTrackData('of1', 1, 'Rammstein', 'Deutschland', ['Neue Deutsche Härte', 'Industrial Metal', 'Pagan Metal'], 'fan', 'Rammstein', '2019-03-28', 'Universal Music', 98, 95, 92, 2847),
  generateTrackData('of2', 2, 'Lacrimosa', 'Kalte Nacht', ['Gothic Metal', 'Symphonic Metal', 'Dark Wave'], 'fan', 'Testimonium', '2017-08-11', 'Hall of Sermon', 95, 93, 88, 2634),
  generateTrackData('of3', 3, 'VNV Nation', 'Illusion', ['Future Pop', 'Electronic Body Music', 'Dark Electro'], 'fan', 'Noire', '2018-10-12', 'Anachron Sounds', 93, 91, 85, 2521),
];

export const OVERALL_EXPERT_CHARTS: Track[] = [
  generateTrackData('oe1', 1, 'Covenant', 'Ritual Noise', ['Electronic Body Music', 'Future Pop', 'Dark Electro'], 'expert', 'The Blinding Dark', '2016-09-16', 'Dependent Records', 96, 98, 89, 1876),
  generateTrackData('oe2', 2, 'Deine Lakaien', 'Return', ['Dark Wave', 'Gothic Rock', 'Neue Deutsche Todeskunst'], 'expert', 'Indicator', '2010-09-24', 'Chrom Records', 94, 96, 86, 1743),
  generateTrackData('oe3', 3, 'Blutengel', 'Erlösung', ['Dark Electro', 'Gothic Rock', 'Future Pop'], 'expert', 'Erlösung', '2016-02-26', 'Out of Line', 92, 95, 84, 1698),
];

export const OVERALL_STREAMING_CHARTS: Track[] = [
  generateTrackData('os1', 1, 'Ghost', 'Square Hammer', ['Doom Metal', 'Gothic Metal', 'Dark Metal'], 'streaming', 'Popestar', '2016-09-16', 'Loma Vista', 94, 92, 98, 3421),
  generateTrackData('os2', 2, 'Type O Negative', 'Black No. 1', ['Gothic Metal', 'Doom Metal', 'Dark Metal'], 'streaming', 'Bloody Kisses', '1993-08-17', 'Roadrunner', 93, 91, 96, 3298),
  generateTrackData('os3', 3, 'Sisters of Mercy', 'Temple of Love', ['Gothic Rock', 'Post Punk', 'Dark Wave'], 'streaming', 'Some Girls Wander by Mistake', '1992-01-01', 'Merciful Release', 91, 90, 95, 3156),
];

export const GOTHIC_FAN_CHARTS: Track[] = [
  generateTrackData('gf1', 1, 'The Sisters of Mercy', 'Lucretia My Reflection', ['Gothic Rock', 'Post Punk', 'Dark Wave'], 'fan', 'Floodland', '1987-11-13', 'Merciful Release', 97, 94, 89, 1834),
  generateTrackData('gf2', 2, 'Bauhaus', 'Bela Lugosi\'s Dead', ['Gothic Rock', 'Post Punk', 'Batcave'], 'fan', 'In the Flat Field', '1979-08-06', '4AD', 96, 96, 87, 1765),
  generateTrackData('gf3', 3, 'The Cure', 'A Forest', ['Gothic Rock', 'Dark Wave', 'Post Punk'], 'fan', 'Seventeen Seconds', '1980-04-22', 'Fiction Records', 95, 93, 91, 1698),
  generateTrackData('gf4', 4, 'Joy Division', 'She\'s Lost Control', ['Post Punk', 'Gothic Rock', 'Dark Wave'], 'fan', 'Unknown Pleasures', '1979-06-15', 'Factory Records', 94, 95, 88, 1632),
  generateTrackData('gf5', 5, 'Siouxsie and the Banshees', 'Cities in Dust', ['Gothic Rock', 'Post Punk', 'Dark Wave'], 'fan', 'Tinderbox', '1985-10-07', 'Polydor', 93, 92, 86, 1587),
  generateTrackData('gf6', 6, 'Fields of the Nephilim', 'Moonchild', ['Gothic Rock', 'Dark Wave', 'Post Punk'], 'fan', 'The Nephilim', '1988-09-05', 'Situation Two', 92, 91, 84, 1534),
  generateTrackData('gf7', 7, 'Christian Death', 'Spiritual Cramp', ['Deathrock', 'Gothic Rock', 'Post Punk'], 'fan', 'Only Theatre of Pain', '1982-03-24', 'Frontier Records', 91, 90, 82, 1489),
  generateTrackData('gf8', 8, 'Alien Sex Fiend', 'Ignore the Machine', ['Gothic Rock', 'Batcave', 'Industrial'], 'fan', 'Acid Bath', '1984-05-11', 'Anagram Records', 90, 88, 80, 1445),
  generateTrackData('gf9', 9, 'The Mission', 'Tower of Strength', ['Gothic Rock', 'Dark Wave', 'Post Punk'], 'fan', 'Children', '1988-02-20', 'Mercury Records', 89, 89, 85, 1402),
  generateTrackData('gf10', 10, 'Dead Can Dance', 'The Host of Seraphim', ['Ethereal Wave', 'Dark Wave', 'Neoklassik'], 'fan', 'The Serpent\'s Egg', '1988-10-24', '4AD', 88, 94, 83, 1367),
];

export const GOTHIC_EXPERT_CHARTS: Track[] = [
  generateTrackData('ge1', 1, 'Cocteau Twins', 'Heaven or Las Vegas', ['Ethereal Wave', 'Dark Wave', 'Gothic Rock'], 'expert', 'Heaven or Las Vegas', '1990-09-17', '4AD', 92, 98, 87, 1543),
  generateTrackData('ge2', 2, 'Clan of Xymox', 'A Day', ['Dark Wave', 'Gothic Rock', 'Cold Wave'], 'expert', 'Medusa', '1986-11-01', '4AD', 91, 97, 85, 1487),
  generateTrackData('ge3', 3, 'The Frozen Autumn', 'Oblivion', ['Dark Wave', 'Ethereal Wave', 'Cold Wave'], 'expert', 'Emotional Screening Device', '2007-06-01', 'Equilibrium Music', 90, 96, 83, 1432),
  generateTrackData('ge4', 4, 'Sopor Aeternus', 'Dead Souls', ['Neue Deutsche Todeskunst', 'Dark Wave', 'Gothic Rock'], 'expert', 'Dead Lovers\' Sarabande', '1999-11-29', 'Apocalyptic Vision', 89, 95, 81, 1398),
  generateTrackData('ge5', 5, 'London After Midnight', 'Kiss', ['Gothic Rock', 'Dark Wave', 'Deathrock'], 'expert', 'Psycho Magnet', '1996-10-15', 'Metropolis Records', 88, 94, 79, 1354),
  generateTrackData('ge6', 6, 'Diary of Dreams', 'The Curse', ['Dark Wave', 'Gothic Rock', 'Industrial'], 'expert', 'Nigredo', '2004-05-24', 'Accession Records', 87, 93, 77, 1310),
  generateTrackData('ge7', 7, 'Lycia', 'Anywhere But Here', ['Dark Wave', 'Ethereal Wave', 'Gothic Rock'], 'expert', 'Cold', '1996-02-13', 'Projekt Records', 86, 92, 75, 1267),
  generateTrackData('ge8', 8, 'The Wake', 'Pale Spectre', ['Gothic Rock', 'Post Punk', 'Dark Wave'], 'expert', 'Harmony', '1982-01-01', 'Factory Records', 85, 91, 73, 1223),
  generateTrackData('ge9', 9, 'Skeletal Family', 'Promised Land', ['Gothic Rock', 'Post Punk', 'Batcave'], 'expert', 'Futile Combat', '1984-03-01', 'Red Rhino Records', 84, 90, 71, 1189),
  generateTrackData('ge10', 10, 'Xmal Deutschland', 'Incubus Succubus II', ['Gothic Rock', 'Dark Wave', 'Post Punk'], 'expert', 'Tocsin', '1984-04-20', '4AD', 83, 89, 69, 1145),
];

export const GOTHIC_STREAMING_CHARTS: Track[] = [
  generateTrackData('gs1', 1, 'Lebanon Hanover', 'Gallowdance', ['Cold Wave', 'Dark Wave', 'Post Punk'], 'streaming', 'Why Not Just Be Solo', '2012-11-16', 'Fabrika Records', 88, 90, 97, 2876),
  generateTrackData('gs2', 2, 'She Past Away', 'Rituel', ['Cold Wave', 'Dark Wave', 'Post Punk'], 'streaming', 'Narin Yalnizlik', '2015-02-20', 'Fabrika Records', 87, 89, 96, 2743),
  generateTrackData('gs3', 3, 'Twin Tribes', 'Shadows', ['Dark Wave', 'Cold Wave', 'Post Punk'], 'streaming', 'Shadows', '2018-10-31', 'Negative Gain', 86, 88, 95, 2698),
  generateTrackData('gs4', 4, 'Molchat Doma', 'Судно', ['Cold Wave', 'Post Punk', 'Dark Wave'], 'streaming', 'Этажи', '2018-11-09', 'Detriti Records', 85, 87, 94, 2654),
  generateTrackData('gs5', 5, 'Boy Harsher', 'Pain', ['Dark Wave', 'Industrial', 'Electro Industrial'], 'streaming', 'Careful', '2019-02-01', 'Nude Club Records', 84, 86, 93, 2612),
  generateTrackData('gs6', 6, 'Drab Majesty', 'Not Just a Name', ['Dark Wave', 'Ethereal Wave', 'Cold Wave'], 'streaming', 'The Demonstration', '2017-01-20', 'Dais Records', 83, 85, 92, 2567),
  generateTrackData('gs7', 7, 'Traitrs', 'Rites and Rituals', ['Post Punk', 'Dark Wave', 'Cold Wave'], 'streaming', 'Butcher\'s Coin', '2016-10-28', 'Negative Gain', 82, 84, 91, 2523),
  generateTrackData('gs8', 8, 'Actors', 'Post Traumatic Love', ['Dark Wave', 'Post Punk', 'Cold Wave'], 'streaming', 'It Will Come to You', '2018-03-16', 'Artoffact Records', 81, 83, 90, 2489),
  generateTrackData('gs9', 9, 'Linea Aspera', 'Eviction', ['Dark Wave', 'Cold Wave', 'Dark Synthpop'], 'streaming', 'Linea Aspera', '2011-10-01', 'Dark Entries', 80, 82, 89, 2445),
  generateTrackData('gs10', 10, 'Lebanon Hanover', 'Saddest Smile', ['Cold Wave', 'Dark Wave', 'Post Punk'], 'streaming', 'The World Is Getting Colder', '2013-11-29', 'Fabrika Records', 79, 81, 88, 2401),
];

export const METAL_FAN_CHARTS: Track[] = [
  generateTrackData('mf1', 1, 'Paradise Lost', 'As I Die', ['Gothic Metal', 'Doom Metal', 'Death Doom'], 'fan', 'Shades of God', '1992-07-13', 'Music for Nations', 97, 95, 90, 1923),
  generateTrackData('mf2', 2, 'My Dying Bride', 'The Cry of Mankind', ['Gothic Metal', 'Death Doom', 'Doom Metal'], 'fan', 'The Angel and the Dark River', '1995-10-16', 'Peaceville Records', 96, 94, 88, 1876),
  generateTrackData('mf3', 3, 'Anathema', 'Sleepless', ['Gothic Metal', 'Doom Metal', 'Dark Metal'], 'fan', 'Judgement', '1999-06-21', 'Music for Nations', 95, 93, 86, 1832),
  generateTrackData('mf4', 4, 'Moonspell', 'Full Moon Madness', ['Gothic Metal', 'Dark Metal', 'Doom Metal'], 'fan', 'Irreligious', '1996-04-08', 'Century Media', 94, 92, 84, 1789),
  generateTrackData('mf5', 5, 'Theatre of Tragedy', 'Velvet Darkness They Fear', ['Gothic Metal', 'Doom Metal', 'Symphonic Metal'], 'fan', 'Velvet Darkness They Fear', '1996-08-26', 'Massacre Records', 93, 91, 82, 1745),
  generateTrackData('mf6', 6, 'Tristania', 'Widow\'s Weeds', ['Gothic Metal', 'Symphonic Metal', 'Doom Metal'], 'fan', 'Widow\'s Weeds', '1998-02-09', 'Napalm Records', 92, 90, 80, 1702),
  generateTrackData('mf7', 7, 'The Gathering', 'Strange Machines', ['Gothic Metal', 'Dark Metal', 'Doom Metal'], 'fan', 'Mandylion', '1995-08-22', 'Century Media', 91, 89, 78, 1658),
  generateTrackData('mf8', 8, 'Katatonia', 'My Twin', ['Gothic Metal', 'Doom Metal', 'Dark Metal'], 'fan', 'The Great Cold Distance', '2006-03-13', 'Peaceville Records', 90, 88, 85, 1615),
  generateTrackData('mf9', 9, 'Draconian', 'The Cry of Silence', ['Gothic Metal', 'Death Doom', 'Doom Metal'], 'fan', 'Arcane Rain Fell', '2005-08-15', 'Napalm Records', 89, 87, 76, 1571),
  generateTrackData('mf10', 10, 'Sentenced', 'Killing Me Killing You', ['Gothic Metal', 'Dark Metal', 'Doom Metal'], 'fan', 'Down', '1996-11-04', 'Century Media', 88, 86, 74, 1528),
];

export const METAL_EXPERT_CHARTS: Track[] = [
  generateTrackData('me1', 1, 'Empyrium', 'The Shepherd and the Maiden Ghost', ['Doom Metal', 'Neofolk', 'Dark Metal'], 'expert', 'Songs of Moors & Misty Fields', '1997-10-01', 'Prophecy Productions', 90, 98, 83, 1487),
  generateTrackData('me2', 2, 'Saturnus', 'Paradise Belongs to You', ['Death Doom', 'Gothic Metal', 'Doom Metal'], 'expert', 'Paradise Belongs to You', '1996-05-01', 'Euphonious Records', 89, 97, 81, 1443),
  generateTrackData('me3', 3, 'Swallow the Sun', 'The Giant', ['Death Doom', 'Gothic Metal', 'Doom Metal'], 'expert', 'New Moon', '2009-11-04', 'Spinefarm Records', 88, 96, 79, 1398),
  generateTrackData('me4', 4, 'Doomraiser', 'Darkness', ['Doom Metal', 'Dark Metal', 'Pagan Metal'], 'expert', 'Lords of Mercy', '2009-01-01', 'Aural Music', 87, 95, 77, 1354),
  generateTrackData('me5', 5, 'Agalloch', 'In the Shadow of Our Pale Companion', ['Atmospheric Black Metal', 'Doom Metal', 'Neofolk'], 'expert', 'The Mantle', '2002-08-13', 'The End Records', 86, 94, 88, 1310),
  generateTrackData('me6', 6, 'Primordial', 'Empire Falls', ['Pagan Metal', 'Folk Metal', 'Doom Metal'], 'expert', 'To the Nameless Dead', '2007-11-16', 'Metal Blade', 85, 93, 75, 1267),
  generateTrackData('me7', 7, 'Novembers Doom', 'Twilight Innocence', ['Death Doom', 'Gothic Metal', 'Doom Metal'], 'expert', 'The Pale Haunt Departure', '2005-03-22', 'The End Records', 84, 92, 73, 1223),
  generateTrackData('me8', 8, 'Shape of Despair', 'Fallen', ['Doom Metal', 'Death Doom', 'Atmospheric Black Metal'], 'expert', 'Shades of...', '2000-04-10', 'Spikefarm Records', 83, 91, 71, 1189),
  generateTrackData('me9', 9, 'Woods of Ypres', 'I Was Buried in Mount Pleasant Cemetery', ['Gothic Metal', 'Doom Metal', 'Dark Metal'], 'expert', 'Woods 5: Grey Skies & Electric Light', '2012-01-31', 'Earache Records', 82, 90, 69, 1145),
  generateTrackData('me10', 10, 'October Tide', 'Coffin Birth', ['Death Doom', 'Doom Metal', 'Gothic Metal'], 'expert', 'Tunnel of No Light', '2013-03-18', 'Pulverised Records', 81, 89, 67, 1101),
];

export const METAL_STREAMING_CHARTS: Track[] = [
  generateTrackData('ms1', 1, 'Opeth', 'Windowpane', ['Death Doom', 'Doom Metal', 'Dark Metal'], 'streaming', 'Damnation', '2003-04-22', 'Music for Nations', 91, 93, 98, 3234),
  generateTrackData('ms2', 2, 'In Flames', 'December Flower', ['Dark Metal', 'Gothic Metal', 'Doom Metal'], 'streaming', 'The Jester Race', '1996-02-20', 'Nuclear Blast', 90, 92, 97, 3187),
  generateTrackData('ms3', 3, 'Dark Tranquillity', 'Punish My Heaven', ['Dark Metal', 'Gothic Metal', 'Doom Metal'], 'streaming', 'The Gallery', '1995-11-27', 'Osmose Productions', 89, 91, 96, 3145),
  generateTrackData('ms4', 4, 'At the Gates', 'Blinded by Fear', ['Dark Metal', 'Gothic Metal', 'Doom Metal'], 'streaming', 'Slaughter of the Soul', '1995-11-14', 'Earache Records', 88, 90, 95, 3098),
  generateTrackData('ms5', 5, 'Insomnium', 'While We Sleep', ['Doom Metal', 'Dark Metal', 'Gothic Metal'], 'streaming', 'One for Sorrow', '2011-10-12', 'Century Media', 87, 89, 94, 3054),
  generateTrackData('ms6', 6, 'Amorphis', 'Black Winter Day', ['Folk Metal', 'Doom Metal', 'Pagan Metal'], 'streaming', 'Tales from the Thousand Lakes', '1994-07-05', 'Relapse Records', 86, 88, 93, 3012),
  generateTrackData('ms7', 7, 'Novembre', 'Cloudbusting', ['Death Doom', 'Gothic Metal', 'Doom Metal'], 'streaming', 'Novembrine Waltz', '2001-02-19', 'Peaceville Records', 85, 87, 92, 2967),
  generateTrackData('ms8', 8, 'Be\'lakor', 'Countless Skies', ['Doom Metal', 'Dark Metal', 'Gothic Metal'], 'streaming', 'Of Breath and Bone', '2012-06-01', 'Kolony Records', 84, 86, 91, 2923),
  generateTrackData('ms9', 9, 'Omnium Gatherum', 'The Unknowing', ['Dark Metal', 'Gothic Metal', 'Doom Metal'], 'streaming', 'New World Shadows', '2011-02-04', 'Lifeforce Records', 83, 85, 90, 2889),
  generateTrackData('ms10', 10, 'Daylight Dies', 'A Subtle Violence', ['Doom Metal', 'Gothic Metal', 'Dark Metal'], 'streaming', 'Dismantling Devotion', '2006-02-06', 'Candlelight Records', 82, 84, 89, 2845),
];

export const DARK_ELECTRO_FAN_CHARTS: Track[] = [
  generateTrackData('def1', 1, 'Front 242', 'Headhunter', ['Electronic Body Music', 'Industrial', 'Electro Industrial'], 'fan', 'Front by Front', '1988-09-01', 'Wax Trax!', 98, 96, 91, 1987),
  generateTrackData('def2', 2, 'Nitzer Ebb', 'Join in the Chant', ['Electronic Body Music', 'Industrial', 'Electro Industrial'], 'fan', 'That Total Age', '1987-06-29', 'Mute Records', 97, 95, 89, 1943),
  generateTrackData('def3', 3, 'Wumpscut', 'Soylent Green', ['Dark Electro', 'Aggrotech', 'Industrial'], 'fan', 'Embryodead', '1997-01-27', 'Metropolis Records', 96, 94, 87, 1898),
  generateTrackData('def4', 4, 'Hocico', 'Poltergeist', ['Aggrotech', 'Dark Electro', 'Harsh EBM'], 'fan', 'Signos de Aberracion', '2002-10-01', 'Out of Line', 95, 93, 85, 1854),
  generateTrackData('def5', 5, 'Suicide Commando', 'Hellraiser', ['Aggrotech', 'Dark Electro', 'Harsh EBM'], 'fan', 'Mindstrip', '2000-09-25', 'Out of Line', 94, 92, 83, 1810),
  generateTrackData('def6', 6, 'Combichrist', 'Get Your Body Beat', ['Aggrotech', 'Industrial', 'Harsh EBM'], 'fan', 'What the Fuck is Wrong with You People?', '2005-05-30', 'Out of Line', 93, 91, 81, 1767),
  generateTrackData('def7', 7, 'Aesthetic Perfection', 'Antibody', ['Future Pop', 'Dark Electro', 'Electronic Body Music'], 'fan', 'A Violent Emotion', '2008-03-25', 'Out of Line', 92, 90, 79, 1723),
  generateTrackData('def8', 8, 'Skinny Puppy', 'Worlock', ['Industrial', 'Electro Industrial', 'Dark Electro'], 'fan', 'Rabies', '1989-11-21', 'Nettwerk', 91, 89, 87, 1679),
  generateTrackData('def9', 9, 'KMFDM', 'A Drug Against War', ['Industrial', 'Electronic Body Music', 'Industrial Metal'], 'fan', 'Angst', '1993-10-12', 'Wax Trax!', 90, 88, 77, 1635),
  generateTrackData('def10', 10, 'And One', 'Krieger', ['Dark Synthpop', 'Electronic Body Music', 'Future Pop'], 'fan', '9.9.99 9 Uhr', '1998-09-28', 'Virgin Records', 89, 87, 75, 1592),
];

export const DARK_ELECTRO_EXPERT_CHARTS: Track[] = [
  generateTrackData('dee1', 1, 'Dive', 'Final Report', ['Dark Electro', 'Industrial', 'Electronic Body Music'], 'expert', 'Concrete Rage', '1991-01-01', 'KK Records', 91, 98, 84, 1534),
  generateTrackData('dee2', 2, 'à;GRUMH...', 'Flesh', ['Dark Electro', 'Industrial', 'Rhythmic Noise'], 'expert', 'à;GRUMH...', '1991-01-01', 'Machinery Records', 90, 97, 82, 1489),
  generateTrackData('dee3', 3, 'Stin Scatzor', 'Extreme Tension', ['Rhythmic Noise', 'Dark Electro', 'Industrial'], 'expert', 'Extreme Tension', '1993-01-01', 'Machinery Records', 89, 96, 80, 1445),
  generateTrackData('dee4', 4, 'Haus Arafna', 'Flüstern & Schweigen', ['Dark Electro', 'Industrial', 'Rhythmic Noise'], 'expert', 'Butterfly', '1999-01-01', 'Aufnahme + Wiedergabe', 88, 95, 78, 1401),
  generateTrackData('dee5', 5, 'P·A·L', 'Control', ['Dark Electro', 'Industrial', 'Electronic Body Music'], 'expert', 'Industrial Anthems', '1992-01-01', 'Animalized Records', 87, 94, 76, 1358),
  generateTrackData('dee6', 6, 'Winterkälte', 'Eisheilige Nacht', ['Dark Electro', 'Industrial', 'Rhythmic Noise'], 'expert', 'Eisheilige Nacht', '1999-01-01', 'Ant-Zen', 86, 93, 74, 1314),
  generateTrackData('dee7', 7, 'Feindflug', 'Roter Schnee', ['Dark Electro', 'Rhythmic Noise', 'Industrial'], 'expert', 'Hirnschlacht', '2005-02-21', 'Infacted Recordings', 85, 92, 72, 1271),
  generateTrackData('dee8', 8, 'Asche', 'Krieger', ['Dark Electro', 'Aggrotech', 'Industrial'], 'expert', 'Asche', '1998-01-01', 'Praxis Dr. Bearmann', 84, 91, 70, 1227),
  generateTrackData('dee9', 9, 'This Morn\' Omina', 'Serpent', ['Rhythmic Noise', 'Dark Electro', 'Industrial'], 'expert', 'The Drake Equation', '2007-09-24', 'Ant-Zen', 83, 90, 68, 1184),
  generateTrackData('dee10', 10, 'Sonar', 'Cold', ['Dark Electro', 'Industrial', 'Electronic Body Music'], 'expert', 'Steelwork', '1995-01-01', 'Zoth Ommog', 82, 89, 66, 1140),
];

export const DARK_ELECTRO_STREAMING_CHARTS: Track[] = [
  generateTrackData('des1', 1, 'Perturbator', 'Future Club', ['Darksynth', 'Dark Electro', 'Industrial'], 'streaming', 'Dangerous Days', '2014-07-28', 'Blood Music', 89, 91, 98, 3421),
  generateTrackData('des2', 2, 'Carpenter Brut', 'Turbo Killer', ['Darksynth', 'Dark Electro', 'Industrial'], 'streaming', 'Trilogy', '2015-03-23', 'No Quarter Productions', 88, 90, 97, 3376),
  generateTrackData('des3', 3, 'Gost', 'Arise', ['Darksynth', 'Dark Electro', 'Industrial'], 'streaming', 'Behemoth', '2015-12-25', 'Blood Music', 87, 89, 96, 3334),
  generateTrackData('des4', 4, 'Dan Terminus', 'The Wrath of Code', ['Darksynth', 'Dark Electro', 'Cybergoth'], 'streaming', 'The Wrath of Code', '2014-02-14', 'Blood Music', 86, 88, 95, 3289),
  generateTrackData('des5', 5, 'Mega Drive', 'Dataline', ['Darksynth', 'Dark Electro', 'Cybergoth'], 'streaming', '198XAD', '2014-11-21', 'Self-released', 85, 87, 94, 3245),
  generateTrackData('des6', 6, 'GosT', 'Master', ['Darksynth', 'Dark Electro', 'Aggrotech'], 'streaming', 'Non Paradisi', '2016-11-25', 'Blood Music', 84, 86, 93, 3201),
  generateTrackData('des7', 7, 'Lazerhawk', 'Overdrive', ['Darksynth', 'Dark Synthpop', 'Dark Electro'], 'streaming', 'Redline', '2010-06-15', 'Self-released', 83, 85, 92, 3158),
  generateTrackData('des8', 8, 'Dance with the Dead', 'Diabolic', ['Darksynth', 'Dark Electro', 'Industrial'], 'streaming', 'Out of Body', '2015-12-04', 'Self-released', 82, 84, 91, 3114),
  generateTrackData('des9', 9, 'Volkor X', 'This Means War', ['Darksynth', 'Dark Electro', 'Industrial'], 'streaming', 'This Means War', '2017-09-01', 'Self-released', 81, 83, 90, 3071),
  generateTrackData('des10', 10, 'Magic Sword', 'In the Face of Evil', ['Darksynth', 'Dark Electro', 'Dark Synthpop'], 'streaming', 'Volume 1', '2015-05-05', 'Self-released', 80, 82, 89, 3027),
];

export const CROSSOVER_FAN_CHARTS: Track[] = [
  generateTrackData('cf1', 1, 'Oomph!', 'Augen auf!', ['Neue Deutsche Härte', 'Industrial Metal', 'Electronic Body Music'], 'fan', 'Wahrheit oder Pflicht', '2004-05-17', 'Gun Records', 97, 94, 90, 1876),
  generateTrackData('cf2', 2, 'Eisbrecher', 'Verrückt', ['Neue Deutsche Härte', 'Industrial Metal', 'Dark Electro'], 'fan', 'Eisbrecher', '2004-01-12', 'ZYX Music', 96, 93, 88, 1832),
  generateTrackData('cf3', 3, 'Megaherz', 'Gott sein', ['Neue Deutsche Härte', 'Industrial Metal', 'Dark Metal'], 'fan', 'Kopfschuss', '1998-08-24', 'ZYX Music', 95, 92, 86, 1789),
  generateTrackData('cf4', 4, 'Ministry', 'Jesus Built My Hotrod', ['Industrial Metal', 'Industrial', 'Electro Industrial'], 'fan', 'Psalm 69', '1992-07-14', 'Sire Records', 94, 91, 84, 1745),
  generateTrackData('cf5', 5, 'Nine Inch Nails', 'March of the Pigs', ['Industrial Metal', 'Industrial', 'Electro Industrial'], 'fan', 'The Downward Spiral', '1994-03-08', 'Nothing Records', 93, 95, 92, 1702),
  generateTrackData('cf6', 6, 'Fear Factory', 'Replica', ['Industrial Metal', 'Electro Industrial', 'Dark Metal'], 'fan', 'Demanufacture', '1995-06-13', 'Roadrunner', 92, 90, 82, 1658),
  generateTrackData('cf7', 7, 'Static-X', 'Push It', ['Industrial Metal', 'Electronic Body Music', 'Electro Industrial'], 'fan', 'Wisconsin Death Trip', '1999-03-08', 'Warner Bros', 91, 89, 88, 1615),
  generateTrackData('cf8', 8, 'Raubtier', 'Achtung Panzer', ['Neue Deutsche Härte', 'Industrial Metal', 'Dark Metal'], 'fan', 'Det finns bara krig', '2009-03-25', 'Ninetone Records', 90, 88, 80, 1571),
  generateTrackData('cf9', 9, 'Turmion Kätilöt', 'Tirehtööri', ['Industrial Metal', 'Electronic Body Music', 'Aggrotech'], 'fan', 'Hoitovirhe', '2006-04-19', 'Osasto-A', 89, 87, 78, 1528),
  generateTrackData('cf10', 10, 'Gothminister', 'Monsters', ['Industrial Metal', 'Gothic Metal', 'Dark Electro'], 'fan', 'Empire of Dark Salvation', '2005-06-13', 'Drakkar Records', 88, 86, 76, 1484),
];

export const CROSSOVER_EXPERT_CHARTS: Track[] = [
  generateTrackData('ce1', 1, 'Godflesh', 'Like Rats', ['Industrial Metal', 'Death Industrial', 'Doom Metal'], 'expert', 'Streetcleaner', '1989-11-13', 'Earache Records', 90, 98, 83, 1445),
  generateTrackData('ce2', 2, 'Pitchshifter', 'Genius', ['Industrial Metal', 'Electronic Body Music', 'Electro Industrial'], 'expert', 'www.pitchshifter.com', '1998-03-02', 'Geffen Records', 89, 97, 81, 1401),
  generateTrackData('ce3', 3, 'Strapping Young Lad', 'Love?', ['Industrial Metal', 'Dark Metal', 'Doom Metal'], 'expert', 'City', '1997-02-11', 'Century Media', 88, 96, 79, 1358),
  generateTrackData('ce4', 4, 'The Kovenant', 'Mirror\'s Paradise', ['Industrial Metal', 'Symphonic Black Metal', 'Electronic Body Music'], 'expert', 'Animatronic', '1999-11-16', 'Nuclear Blast', 87, 95, 77, 1314),
  generateTrackData('ce5', 5, 'Red Harvest', 'Hole in Me', ['Industrial Metal', 'Dark Metal', 'Electronic Body Music'], 'expert', 'New World Rage Music', '2001-11-12', 'Season of Mist', 86, 94, 75, 1271),
  generateTrackData('ce6', 6, 'Dødheimsgard', 'Traces of Reality', ['Industrial Metal', 'Symphonic Black Metal', 'Dark Metal'], 'expert', '666 International', '1999-06-11', 'Moonfog Productions', 85, 93, 73, 1227),
  generateTrackData('ce7', 7, 'Thorns', 'Stellar Master Elite', ['Industrial Metal', 'Symphonic Black Metal', 'Dark Metal'], 'expert', 'Thorns', '2001-05-21', 'Moonfog Productions', 84, 92, 71, 1184),
  generateTrackData('ce8', 8, 'Treponem Pal', 'Excess & Overdrive', ['Industrial Metal', 'Industrial', 'Dark Metal'], 'expert', 'Excess & Overdrive', '1993-01-01', 'Roadrunner', 83, 91, 69, 1140),
  generateTrackData('ce9', 9, 'Samael', 'Rain', ['Industrial Metal', 'Symphonic Black Metal', 'Dark Metal'], 'expert', 'Passage', '1996-09-16', 'Century Media', 82, 90, 67, 1097),
  generateTrackData('ce10', 10, 'Aborym', 'Fire Walk with Us', ['Industrial Metal', 'Symphonic Black Metal', 'Dark Metal'], 'expert', 'Fire Walk with Us', '2001-09-24', 'Scarlet Records', 81, 89, 65, 1053),
];

export const CROSSOVER_STREAMING_CHARTS: Track[] = [
  generateTrackData('cs1', 1, 'Heilung', 'Krigsgaldr', ['Neofolk', 'Ritual Ambient', 'Pagan Folk'], 'streaming', 'Ofnir', '2015-03-10', 'Season of Mist', 88, 90, 98, 3298),
  generateTrackData('cs2', 2, 'Wardruna', 'Helvegen', ['Neofolk', 'Nordic Folk', 'Pagan Folk'], 'streaming', 'Yggdrasil', '2013-03-15', 'Indie Recordings', 87, 89, 97, 3254),
  generateTrackData('cs3', 3, 'Faun', 'Federkleid', ['Neofolk', 'Mittelalter Rock', 'Pagan Folk'], 'streaming', 'Von den Elben', '2013-05-24', 'Curzweyhl', 86, 88, 96, 3212),
  generateTrackData('cs4', 4, 'Eluveitie', 'Inis Mona', ['Folk Metal', 'Pagan Metal', 'Melodic Death Metal'], 'streaming', 'Slania', '2008-02-15', 'Nuclear Blast', 85, 87, 95, 3167),
  generateTrackData('cs5', 5, 'Corvus Corax', 'In Taberna', ['Mittelalter Rock', 'Neofolk', 'Pagan Folk'], 'streaming', 'Cantus Buranus', '2005-10-17', 'Pica Music', 84, 86, 94, 3124),
  generateTrackData('cs6', 6, 'Saltatio Mortis', 'Wo sind die Clowns', ['Mittelalter Rock', 'Folk Metal', 'Neofolk'], 'streaming', 'Wer Wind sät', '2009-08-21', 'Napalm Records', 83, 85, 93, 3081),
  generateTrackData('cs7', 7, 'Subway to Sally', 'Veitstanz', ['Mittelalter Rock', 'Folk Metal', 'Gothic Metal'], 'streaming', 'Herzblut', '2001-09-17', 'Nuclear Blast', 82, 84, 92, 3037),
  generateTrackData('cs8', 8, 'Omnia', 'Wolf Love', ['Neofolk', 'Pagan Folk', 'Nordic Folk'], 'streaming', 'Musick and Poëtree', '2006-01-01', 'PaganScum Records', 81, 83, 91, 2994),
  generateTrackData('cs9', 9, 'In Extremo', 'Herr Mannelig', ['Mittelalter Rock', 'Folk Metal', 'Neofolk'], 'streaming', 'Verehrt und angespien', '1999-09-13', 'Mercury Records', 80, 82, 90, 2951),
  generateTrackData('cs10', 10, 'Schandmaul', 'Dein Anblick', ['Mittelalter Rock', 'Folk Metal', 'Neofolk'], 'streaming', 'Wie Pech und Schwefel', '2004-09-27', 'Drakkar Records', 79, 81, 89, 2907),
];

export const getAllChartData = () => ({
  overall: {
    fan: OVERALL_FAN_CHARTS,
    expert: OVERALL_EXPERT_CHARTS,
    streaming: OVERALL_STREAMING_CHARTS,
  },
  gothic: {
    fan: GOTHIC_FAN_CHARTS,
    expert: GOTHIC_EXPERT_CHARTS,
    streaming: GOTHIC_STREAMING_CHARTS,
  },
  metal: {
    fan: METAL_FAN_CHARTS,
    expert: METAL_EXPERT_CHARTS,
    streaming: METAL_STREAMING_CHARTS,
  },
  'dark-electro': {
    fan: DARK_ELECTRO_FAN_CHARTS,
    expert: DARK_ELECTRO_EXPERT_CHARTS,
    streaming: DARK_ELECTRO_STREAMING_CHARTS,
  },
  crossover: {
    fan: CROSSOVER_FAN_CHARTS,
    expert: CROSSOVER_EXPERT_CHARTS,
    streaming: CROSSOVER_STREAMING_CHARTS,
  },
});
