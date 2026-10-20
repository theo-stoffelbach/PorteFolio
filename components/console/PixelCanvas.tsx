'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { createSurface, present, type Surface } from './pixel/engine';

interface PixelCanvasProps {
  width: number;
  height: number;
  // Dessin de la surface ; doit être mémoïsé par l'appelant (useCallback).
  paint: (s: Surface) => void;
  className?: string;
  style?: CSSProperties;
  // Variable CSS d'échelle : --px pour la console, --spx pour l'étagère.
  scale?: '--px' | '--spx';
}

// Canvas basse résolution affiché à l'échelle --px, en pixels nets.
export default function PixelCanvas({
  width,
  height,
  paint,
  className,
  style,
  scale = '--px',
}: PixelCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const surface = createSurface(width, height);
    paint(surface);
    present(surface, canvas);
  }, [width, height, paint]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      aria-hidden="true"
      className={className}
      style={{
        width: `calc(${width} * var(${scale}))`,
        height: `calc(${height} * var(${scale}))`,
        ...style,
      }}
    />
  );
}
