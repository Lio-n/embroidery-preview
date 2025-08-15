// https://edutechwiki.unige.ch/en/Embroidery_format_XXX
export const MAP_BYTE = {
  COMMANDS: {
    FLAG: 0x7d,
    JUMP_CODE: 0x01,
    TRIM_CODE: 0x03,
    LONG_CODE: 0x80,
    COLOR_CHANGE_CODE: 0x08,
    END_CODE: 0x7f,
    TRIM: (b1: number, b2: number) => b1 === 0x7f && b2 === 0x03,
    JUMP: (b1: number, b2: number) => b1 === 0x7f && b2 === 1,
    COLOR_CHANGE: (b1: number, b2: number) =>
      b1 === 0x7f && b2 !== 0x17 && b2 !== 0x46 && b2 >= 8,
    END: (b1: number, b2: number) =>
      (b1 === 0x7f && b2 === 0x7f) || b2 === undefined,
    LONG: (b1: number) => b1 === 0x7e || b1 === 0x7d,
  },
  COLOR_COUNT: 0x27,
  PALETTE_OFFSET: 0xfc,
};
/* XXX Body - Command Table
    | Command      | B0   | B1   |
    | ------------ | ---- | ---- |
    | END          | 0x7F | 0x7F |
    | COLOR_CHANGE | 0x7F | 0x08 |
    | STOP         | 0x7F | 0x08 |
    | JUMP         | 0x7F | 0x01 |
    | TRIM         | 0x7F | 0x03 |
*/
