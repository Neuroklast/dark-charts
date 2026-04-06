export function calculateExpertPoints(rank: number, reputationScore: number): number {
  let basePoints = 0;
  if (rank === 1) basePoints = 10;
  else if (rank === 2) basePoints = 8;
  else if (rank === 3) basePoints = 6;
  else if (rank === 4) basePoints = 4;
  else if (rank === 5) basePoints = 2;
  else if (rank >= 6 && rank <= 10) basePoints = 1;

  return basePoints * reputationScore;
}
