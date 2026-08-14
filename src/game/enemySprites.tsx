// Hand-drawn pixel-art SVG sprites for enemies, keyed by the same
// Japanese names used in ENEMY_SEQUENCE (see battle.ts).

interface EnemySpriteProps {
  size: number
  className?: string
}

function GoblinSprite({ size, className }: EnemySpriteProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} shapeRendering="crispEdges" className={className} aria-hidden="true">
      <path fill="#17232B" fillOpacity=".28" d="M5 22h14v1H5z" />
      <path fill="#21323B" d="M1 6h5v2h1v6H5v2H3v-2H2v-2H1zm17 0h5v6h-1v2h-1v2h-2v-2h-2V8h1z" />
      <path fill="#6DA53B" d="M2 7h4v5H4v2H3v-3H2zm16 0h4v4h-1v3h-1v-2h-2z" />
      <path fill="#93C94B" d="M3 8h3v2H4v1H3zm15 0h3v2h-3z" />
      <path fill="#21323B" d="M7 3h10v1h2v2h1v9h-1v2h-2v1H7v-1H5v-2H4V6h1V4h2z" />
      <path fill="#77B33F" d="M7 4h10v1h2v10h-2v2H7v-1H6v-2H5V7h1V5h1z" />
      <path fill="#A2D65A" d="M7 5h8v1h2v2H7v2H6V7h1z" />
      <path fill="#568B34" d="M17 7h2v8h-2v2h-4v-2h2v-1h2z" />
      <path fill="#355C32" d="M7 8h4v1H7zm6 0h4v1h-4z" />
      <path fill="#FFF5D6" d="M8 9h3v3H8zm5 0h3v3h-3z" />
      <path fill="#21323B" d="M9 10h2v2H9zm4 0h2v2h-2z" />
      <path fill="#FFFFFF" d="M9 10h1v1H9zm4 0h1v1h-1z" />
      <path fill="#568B34" d="M11 11h2v2h1v1h-4v-1h1z" />
      <path fill="#E58461" d="M6 12h2v1H6zm10 0h2v1h-2z" />
      <path fill="#21323B" d="M8 14h8v2h-1v1H9v-1H8z" />
      <path fill="#FFF5D6" d="M9 14h2v2h-1v-1H9zm4 0h2v1h-1v1h-1z" />
      <path fill="#B94A4A" d="M11 15h2v1h-2z" />
      <path fill="#21323B" d="M5 17h4v5H6v-1H4v-3h1zm10 0h4v1h1v3h-2v1h-3z" />
      <path fill="#6DA53B" d="M5 18h3v3H6v-1H5zm11 0h3v2h-1v1h-2z" />
      <path fill="#21323B" d="M8 17h8v1h1v5h-4v-1h-2v1H7v-5h1z" />
      <path fill="#A83B55" d="M9 18h6v1h1v3h-3v-1h-2v1H8v-3h1z" />
      <path fill="#D45A68" d="M9 18h3v1H9z" />
      <path fill="#5C3A2A" d="M8 20h8v1H8z" />
      <path fill="#F1BE49" d="M11 20h2v1h-2z" />
      <path fill="#21323B" d="M7 22h5v2H6v-1h1zm5 0h5v1h1v1h-6z" />
      <path fill="#674634" d="M8 22h3v1H8zm5 0h3v1h-3z" />
    </svg>
  )
}

function OgreSprite({ size, className }: EnemySpriteProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} shapeRendering="crispEdges" className={className} aria-hidden="true">
      <path fill="#17232B" fillOpacity=".28" d="M3 22h18v1H3z" />
      <path fill="#26343B" d="M4 2h4v4H6v1H4zm12 0h4v5h-2V6h-2z" />
      <path fill="#F4D58B" d="M5 2h2v3H5zm12 0h2v4h-2z" />
      <path fill="#FFF0BA" d="M5 2h1v2H5zm12 0h1v2h-1z" />
      <path fill="#26343B" d="M2 7h4V5h2V4h8v1h2v2h4v7h-2v2h-3v2H7v-2H4v-2H2z" />
      <path fill="#B9683F" d="M3 8h3v5H5v2H4v-2H3zm15 0h3v5h-1v2h-1v-2h-1z" />
      <path fill="#D8874C" d="M6 6h2V5h8v1h2v9h-2v2H8v-1H6z" />
      <path fill="#F0A85C" d="M8 6h7v1h2v3H7V8h1z" />
      <path fill="#AA573A" d="M16 8h2v7h-2v2h-4v-2h2v-1h2z" />
      <path fill="#6F3B31" d="M7 8h4v1H7zm6 0h4v1h-4z" />
      <path fill="#FFF7DF" d="M8 9h3v3H8zm5 0h3v3h-3z" />
      <path fill="#26343B" d="M9 10h2v2H9zm4 0h2v2h-2z" />
      <path fill="#FFFFFF" d="M9 10h1v1H9zm4 0h1v1h-1z" />
      <path fill="#8F4A35" d="M10 11h4v3h-1v1h-2v-1h-1z" />
      <path fill="#6F3B31" d="M10 13h1v1h-1zm3 0h1v1h-1z" />
      <path fill="#8F4A35" d="M6 12h1v1H6zm11 0h1v1h-1z" />
      <path fill="#26343B" d="M8 15h8v2h-1v1H9v-1H8z" />
      <path fill="#FFF0BA" d="M8 15h2v3H9v-1H8zm6 0h2v2h-1v1h-1z" />
      <path fill="#D75C57" d="M10 16h4v1h-4z" />
      <path fill="#26343B" d="M4 16h5v2h6v-2h5v1h2v5h-1v2h-5v-2h-1v2H9v-2H8v2H3v-2H2v-5h2z" />
      <path fill="#C97745" d="M4 17h4v4H7v2H4v-2H3v-3h1zm12 0h4v1h1v3h-1v2h-3v-2h-1z" />
      <path fill="#E59750" d="M4 17h3v2H4zm13 0h3v2h-3z" />
      <path fill="#8F4A35" d="M4 20h1v1H4zm2 0h1v1H6zm11 0h1v1h-1zm2 0h1v1h-1z" />
      <path fill="#D8874C" d="M9 18h6v4h-1v1h-4v-1H9z" />
      <path fill="#654333" d="M8 19h8v2H8z" />
      <path fill="#E9B84B" d="M11 19h3v2h-3z" />
      <path fill="#4776A8" d="M9 21h6v2h-1v1h-4v-1H9z" />
      <path fill="#70A7D6" d="M10 21h2v2h-2z" />
      <path fill="#26343B" d="M4 23h6v1H3v-1zm10 0h6v1h-7v-1z" />
    </svg>
  )
}

function DragonSprite({ size, className }: EnemySpriteProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} shapeRendering="crispEdges" className={className} aria-hidden="true">
      <path fill="#17232B" fillOpacity=".28" d="M6 29h20v2H6z" />
      <path fill="#252E3B" d="M21 22h4v1h3v2h2v4h-2v1h-5v-2h4v-1h-3v-1h-5z" />
      <path fill="#B93E3E" d="M21 23h4v1h3v2h1v2h-2v-1h-3v-1h-4z" />
      <path fill="#EF6351" d="M25 24h2v1h-2z" />
      <path fill="#252E3B" d="M3 7h7v3h2v10H9v-2H7v-2H5v-2H3v-2H1V8h2zm19 0h7v1h2v4h-2v2h-2v2h-2v2h-3V10h2z" />
      <path fill="#8F3F60" d="M3 8h6v3h2v6H9v-2H7v-2H5v-2H3zm20 0h6v3h-2v2h-2v2h-2v2h-2v-6h2z" />
      <path fill="#C0526E" d="M4 9h4v2H6v1H4zm20 0h4v2h-2v1h-2z" />
      <path fill="#E36A78" d="M4 9h2v1H4zm22 0h2v1h-2z" />
      <path fill="#65364F" d="M8 11h1v4H8zm15 0h1v4h-1z" />
      <path fill="#252E3B" d="M9 2h5v5h-3V5H9zm9 0h5v3h-2v2h-3z" />
      <path fill="#F3C96B" d="M10 2h3v4h-1V4h-2zm9 0h3v2h-2v2h-1z" />
      <path fill="#FFF0A6" d="M10 2h2v1h-2zm9 0h2v1h-2z" />
      <path fill="#252E3B" d="M12 5h8v1h2v2h2v8h-2v3h-2v2h-8v-2h-2v-3H8V8h2V6h2z" />
      <path fill="#D64743" d="M12 6h8v1h2v2h1v7h-2v3h-2v1h-6v-2h-2v-3H9V9h2V7h1z" />
      <path fill="#F06450" d="M12 7h7v1h2v3h-9v2h-2V9h2z" />
      <path fill="#A8323B" d="M20 9h2v7h-2v2h-2v2h-3v-2h2v-2h2v-2h1z" />
      <path fill="#8E2F38" d="M11 10h5v1h-5zm6 0h5v1h-5z" />
      <path fill="#FFF5CF" d="M12 11h4v4h-4zm5 0h4v4h-4z" />
      <path fill="#252E3B" d="M14 12h2v3h-2zm3 0h2v3h-2z" />
      <path fill="#FFFFFF" d="M14 12h1v1h-1zm3 0h1v1h-1z" />
      <path fill="#E95648" d="M11 15h10v3h-2v2h-6v-2h-2z" />
      <path fill="#F47A5A" d="M12 15h7v1h-7z" />
      <path fill="#762B34" d="M13 16h2v1h-2zm4 0h2v1h-2z" />
      <path fill="#252E3B" d="M13 18h7v2h-1v1h-5v-1h-1z" />
      <path fill="#FFF0C2" d="M14 18h2v2h-1v-1h-1zm4 0h2v1h-1v1h-1z" />
      <path fill="#D85362" d="M16 19h2v1h-2z" />
      <path fill="#252E3B" d="M11 20h10v2h2v7h-2v2h-4v-2h-2v2h-4v-2H9v-7h2z" />
      <path fill="#C53A3F" d="M12 20h8v2h2v6h-2v2h-3v-2h-2v2h-3v-2h-2v-6h2z" />
      <path fill="#E65448" d="M12 21h3v7h-3v-1h-1v-5h1z" />
      <path fill="#E9A93F" d="M15 21h3v1h1v6h-1v1h-3z" />
      <path fill="#F7CA58" d="M15 21h2v7h-2z" />
      <path fill="#B97735" d="M15 23h4v1h-4zm0 3h4v1h-4z" />
      <path fill="#252E3B" d="M8 21h4v5H9v1H6v-3h2zm12 0h4v3h2v3h-3v-1h-3z" />
      <path fill="#D64743" d="M9 22h2v3H9v1H7v-1h1v-2h1zm12 0h2v2h2v2h-2v-1h-2z" />
      <path fill="#FFF0C2" d="M6 26h1v1H6zm2 0h1v1H8zm15 0h1v1h-1zm2 0h1v1h-1z" />
      <path fill="#252E3B" d="M9 28h6v3H8v-2h1zm8 0h6v1h1v2h-7z" />
      <path fill="#A8323B" d="M10 28h4v2H9v-1h1zm8 0h4v1h1v1h-5z" />
      <path fill="#FFF0C2" d="M8 30h2v1H8zm3 0h2v1h-2zm9 0h2v1h-2zm3 0h1v1h-1z" />
    </svg>
  )
}

export const ENEMY_SPRITES: Record<string, (props: EnemySpriteProps) => JSX.Element> = {
  ゴブリン: GoblinSprite,
  オーガ: OgreSprite,
  ドラゴン: DragonSprite,
}

export const DEFAULT_ENEMY_SPRITE = GoblinSprite
