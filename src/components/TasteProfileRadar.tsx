import { useMemo } from 'react';
import { Genre } from '@/types';

interface TasteProfileRadarProps {
  genreScores: Record<Genre, number>;
  size?: number;
}

export function TasteProfileRadar({ genreScores, size = 400 }: TasteProfileRadarProps) {
  const { points, labels, maxScore } = useMemo(() => {
    const entries = Object.entries(genreScores)
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const angleStep = (2 * Math.PI) / Math.max(entries.length, 3);
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size / 2) * 0.7;
    const max = Math.max(...entries.map(([_, score]) => score), 1);

    const pts = entries.map(([genre, score], index) => {
      const angle = index * angleStep - Math.PI / 2;
      const distance = (score / max) * radius;
      return {
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        angle,
        score
      };
    });

    const lbls = entries.map(([genre, score], index) => {
      const angle = index * angleStep - Math.PI / 2;
      const labelDistance = radius + 30;
      return {
        genre,
        score,
        x: centerX + Math.cos(angle) * labelDistance,
        y: centerY + Math.sin(angle) * labelDistance,
        angle
      };
    });

    return { points: pts, labels: lbls, maxScore: max };
  }, [genreScores, size]);

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <p className="font-ui text-xs text-muted-foreground uppercase tracking-widest">
          No Genre Data
        </p>
      </div>
    );
  }

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = (size / 2) * 0.7;

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="w-full h-auto">
      {gridLevels.map((level, i) => (
        <circle
          key={i}
          cx={centerX}
          cy={centerY}
          r={radius * level}
          fill="none"
          stroke="var(--border)"
          strokeWidth="1"
          opacity={0.3}
        />
      ))}

      {labels.map((label, i) => {
        const angle = label.angle;
        const x2 = centerX + Math.cos(angle) * radius;
        const y2 = centerY + Math.sin(angle) * radius;
        return (
          <line
            key={i}
            x1={centerX}
            y1={centerY}
            x2={x2}
            y2={y2}
            stroke="var(--border)"
            strokeWidth="1"
            opacity={0.2}
          />
        );
      })}

      <path
        d={pathData}
        fill="oklch(54.1% 0.281 293.009 / 0.2)"
        stroke="oklch(54.1% 0.281 293.009)"
        strokeWidth="2"
      />

      {points.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r={4}
          fill="oklch(54.1% 0.281 293.009)"
          stroke="var(--background)"
          strokeWidth="2"
        />
      ))}

      {labels.map((label, i) => {
        const textAnchor =
          Math.abs(label.x - centerX) < 5 ? 'middle' :
          label.x > centerX ? 'start' : 'end';

        const dy = label.y < centerY ? -5 : label.y > centerY ? 15 : 5;

        return (
          <text
            key={i}
            x={label.x}
            y={label.y + dy}
            textAnchor={textAnchor}
            className="font-ui text-[9px] font-semibold uppercase tracking-wider fill-foreground"
          >
            {label.genre.length > 12 ? label.genre.substring(0, 10) + '...' : label.genre}
          </text>
        );
      })}
    </svg>
  );
}
