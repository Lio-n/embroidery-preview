// https://edutechwiki.unige.ch/en/Embroidery_format_JEF
export const MAP_BYTE = {
  COMMANDS: {
    FLAG: 0x80,
    JUMP_FLAG: 0x02,
    TOP_FLAG: 0x01,
    TRIM_FLAG: 0x02,
    LONG_FLAG: 0x80,
    COLOR_CHANGE_FLAG: 0x01,
    END_FLAG: 0x10,
  },
  COLOR_COUNT: 0x18,
  OFFSET_STITCH: 0x00,
  COLOR_TABLE: 0x74,
};
/* JEF Body - Command Table
    | Command      | B0   | B1   |
    | ------------ | ---- | ---- |
    | END          | 0x80 | 0x10 |
    | COLOR_CHANGE | 0x80 | 0x01 |
    | STOP         | 0x80 | 0x01 |
    | JUMP         | 0x80 | 0x02 |
    | TRIM         | 0x80 | 0x02 |
*/
