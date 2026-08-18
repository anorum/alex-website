// Shared string-grid pixel-art helper for the overworld.
// Slight overdraw (1.05) hides subpixel seams between rects.

export function pixelRects(pixels: string[], palette: Record<string, string>) {
  const rects = [];
  for (let y = 0; y < pixels.length; y++) {
    for (let x = 0; x < pixels[y].length; x++) {
      const color = palette[pixels[y][x]];
      if (color) {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1.05" height="1.05" fill={color} />);
      }
    }
  }
  return rects;
}

export function gridCols(pixels: string[]): number {
  return Math.max(...pixels.map((r) => r.length));
}
