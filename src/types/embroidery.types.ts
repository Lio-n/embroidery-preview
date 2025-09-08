import type { BufferGeometry, BufferGeometryEventMap, Line, Material, NormalBufferAttributes, Object3DEventMap } from "three";

export type SuportFormats = "pes" | "xxx" | "exp" | "dst" | "jef";

export type FileDetails = {
  name: string;
  extension: string;
  color_changes: number;
  date?: string;
  stitches: number;
  width: number;
  height: number;
  jumps: number;
  size: number;
  version?: string;
};
export type ColorGroup = {
  index: number;
  start: number;
  count: number;
  color: [number, number, number]; // RGB
};
export type ThreeBlock = {
  vertices: Float32Array<ArrayBuffer>;
  colors: Uint8Array<ArrayBuffer>;
};

type Size = {
  x: { max: number; min: number };
  y: { max: number; min: number };
};

export type DesignMetrics = {
  boundingBox: {
    center: [number, number]; // [x,y]
    maxDimension: number;
    size: Size;
  };
};

export type OutputStitchGeometry = {
  blocks: ThreeBlock[];
  colorGroup: ColorGroup[];
  filesDetails: FileDetails;
  designMetrics: DesignMetrics;
};

export type OutpusReaderFormats = OutputStitchGeometry & {
  lines: Line<BufferGeometry<NormalBufferAttributes, BufferGeometryEventMap>, Material | Material[], Object3DEventMap>[];
};

export enum COMMAND {
  STITCH = "STITCH",
  JUMP = "JUMP",
  COLOR_CHANGE = "COLOR_CHANGE",
  END = "END",
  TRIM = "TRIM",
}

export enum FORMAT_EMBROIDERY {
  DST = "DST",
  JEF = "JEF",
  PES = "PES",
  XXX = "XXX",
  EXP = "EXP",
}

export interface StitchBlock {
  stitches: Point[];
  isJump: boolean;
  isTrim: boolean;
  isColorChange: boolean;
}
export interface Stitch {
  x: number;
  y: number;
  command: COMMAND;
}

export interface Point {
  x: number;
  y: number;
}

export type DecodedBytes = Point & Pick<StitchBlock, "isJump" | "isColorChange">;
