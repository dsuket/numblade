// Pixel-art sprite data for enemies. `rows` holds only the left half of
// each row (mirrored by PixelSprite) so every monster stays symmetric.
// Shared color roles keep the enemies feeling like one cast:
//   O = outline, B = body, S = shade, E = eyes, T = teeth/horn/tusk
export interface EnemySprite {
  rows: string[]
  palette: Record<string, string>
}

const OUTLINE = '#050a14'
const BONE = '#f4f7ff'

export const ENEMY_SPRITES: Record<string, EnemySprite> = {
  ゴブリン: {
    rows: [
      '....OB',
      '...OBB',
      '..OBBB',
      '.OBBBB',
      'OBBBBB',
      'OBBEBB',
      'OBBBBB',
      '.OSBBB',
      '.OBBBB',
      '..OBBB',
      '....OB',
      '.OBB..',
    ],
    palette: { O: OUTLINE, B: '#5fbf4f', S: '#2f7a2a', E: '#ffd166' },
  },
  オーガ: {
    rows: [
      '....OB',
      '...OBB',
      '..OBBB',
      '.OBBBB',
      'OBBBBB',
      'OBBEBB',
      'OBBBBB',
      '.OSBBB',
      '.TBBBB',
      '..OBBB',
      '....OB',
      '.OBB..',
    ],
    palette: { O: OUTLINE, B: '#c96a3b', S: '#7a3d1f', E: '#ff4d6d', T: BONE },
  },
  ドラゴン: {
    rows: [
      '......TB',
      '.....OBB',
      '....OBBB',
      '...OBBBB',
      '..OBBBBB',
      '.WOBBEBB',
      'WWOBBBBB',
      'WWOSBBBB',
      '.WOBBBBB',
      '..OBBBBB',
      '...OBBBB',
      '....OBBB',
      '.....OBB',
    ],
    palette: { O: OUTLINE, B: '#7c4dd6', S: '#4a2f8a', E: '#ff4d6d', W: '#a78bfa', T: BONE },
  },
}

export const DEFAULT_ENEMY_SPRITE = ENEMY_SPRITES['ゴブリン']
