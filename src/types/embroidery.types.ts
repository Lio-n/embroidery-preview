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
  vertices: number[];
  colors: number[];
};
export type PromiseReadStitches = {
  blocks: StitchBlock[];
  colorGroup: ColorGroup[];
  file_details: FileDetails;
};
