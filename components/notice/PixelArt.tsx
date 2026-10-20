import type { CSSProperties } from 'react';

interface PixelArtProps {
  /** Une chaîne par ligne ; chaque caractère est un pixel logique. */
  rows: readonly string[];
  /** Couleur de chaque caractère (valeur CSS, variables acceptées). Caractère absent = transparent. */
  palette: Readonly<Record<string, string>>;
  /** Taille d'un pixel logique (longueur CSS). */
  pixel?: string;
  className?: string;
  /** Nom accessible ; sans titre, le dessin est décoratif et masqué aux lecteurs d'écran. */
  title?: string;
}

interface Run {
  x: number;
  y: number;
  width: number;
  fill: string;
}

// Regroupe les pixels voisins de même couleur pour limiter le nombre de <rect>.
function toRuns(rows: readonly string[], palette: PixelArtProps['palette']): Run[] {
  const runs: Run[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const char = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === char) end += 1;
      const fill = palette[char];
      if (fill) runs.push({ x, y, width: end - x, fill });
      x = end;
    }
  });
  return runs;
}

/** Dessin en pixel art rendu en SVG net (aucune image à charger). */
export default function PixelArt({
  rows,
  palette,
  pixel = '4px',
  className,
  title,
}: PixelArtProps) {
  const width = Math.max(0, ...rows.map((row) => row.length));
  const height = rows.length;
  const size: CSSProperties = {
    width: `calc(${width} * ${pixel})`,
    height: `calc(${height} * ${pixel})`,
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      className={className}
      style={size}
      focusable="false"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {toRuns(rows, palette).map((run) => (
        <rect
          key={`${run.x}-${run.y}`}
          x={run.x}
          y={run.y}
          width={run.width}
          height={1}
          style={{ fill: run.fill }}
        />
      ))}
    </svg>
  );
}
