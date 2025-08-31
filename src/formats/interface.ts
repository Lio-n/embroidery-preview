export interface Stitch_Block {
  stitches: Point[];
  isJump?: boolean;
  isTrim?: boolean;
  colorChange?: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface EmbThread {
  color: number;
}
