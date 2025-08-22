export const PEC_HEADER_SIZE = 512;

// https://edutechwiki.unige.ch/en/Embroidery_format_DST
export const MAP_BYTE = {
  COMMANDS: {
    END: (b1: number, b2: number, b3: number) =>
      b1 === 0x00 && b2 === 0x00 && b3 === 0xf3,
  },
};
/* DST Body - Command Table
    | Command      | B0   | B1   | B2   |
    | ------------ | ---- | ---- | ---- |
    | END          | 0x00 | 0x00 | 0xf3 |
    | COLOR_CHANGE | 0x7F | 0x08 | 0x08 |
    | STOP         | 0x7F | 0x08 | 0x08 |
    | JUMP         | 0x7F | 0x01 | 0x08 |
    | TRIM         | 0x7F | 0x03 | 0x08 |
*/
// The DST file is just a collection of stitch start and end points on a piece of fabric.
// What I did in my DST loader is simulate that machine… and instead of thread, i draw quads with a texture of a small piece of thread on them, so when they are combined side by side it looks like the embroidery.
