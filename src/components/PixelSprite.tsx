interface PixelSpriteProps {
  // Each string is the left half of a row; '.' means empty, any other
  // character is a palette key. Rows are mirrored horizontally to draw
  // a symmetrical sprite from half the data.
  rows: string[]
  palette: Record<string, string>
  size: number
  className?: string
}

function mirrorRow(halfRow: string): string {
  return halfRow + [...halfRow].reverse().join('')
}

export default function PixelSprite({ rows, palette, size, className }: PixelSpriteProps) {
  const mirroredRows = rows.map(mirrorRow)
  const width = mirroredRows[0]?.length ?? 0
  const height = mirroredRows.length

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      {mirroredRows.flatMap((row, y) =>
        [...row].map((cell, x) =>
          cell === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={palette[cell]} />,
        ),
      )}
    </svg>
  )
}
