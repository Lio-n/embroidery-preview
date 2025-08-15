// https://edutechwiki.unige.ch/en/Embroidery_format_EXP
export const MAP_BYTE = {
  COMMANDS: {
    FLAG: 0x80,
    JUMP_CODE: 0x04,
    TOP_CODE: 0x01,
    TRIM_CODE: 0x02,
    COLOR_CHANGE_CODE: 0x01,
    END_CODE: 0x80,
  },
};
/* EXP Body - Command Table
    | Command      | B0   | B1   |
    | ------------ | ---- | ---- |
    | END          | 0x80 | 0x80 |
    | COLOR_CHANGE | 0x80 | 0x01 |
    | STOP         | 0x80 | 0x01 |
    | JUMP         | 0x80 | 0x04 |
    | TRIM         | 0x80 | 0x02 |
*/
