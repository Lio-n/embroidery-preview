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
export type StitchBlock = {
  vertices: Float32Array<ArrayBuffer>;
  colors: Uint8Array<ArrayBuffer>;
};

export type DesignMetrics = {
  boundingBox: {
    center: [number, number]; // [x,y]
    maxDimension: number;
  };
};

export type PromiseReadStitches = {
  blocks: StitchBlock[];
  colorGroup: ColorGroup[];
  filesDetails: FileDetails;
  designMetrics: DesignMetrics;
};
