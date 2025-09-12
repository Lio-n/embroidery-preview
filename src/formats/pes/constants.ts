export const PEC_HEADER_SIZE = 512;

// https://edutechwiki.unige.ch/en/Embroidery_format_PEC
export const MAP_BYTE = {
  COMMANDS: {
    JUMP_FLAG: 0x10,
    TRIM_FLAG: 0x20,
    LONG_FLAG: 0x80,
    END_FLAG: 0xff,
    COLOR_CHANGE_FLAG: [0xfe, 0xb0],
    COLOR_CHANGE: (b1: number, b2: number) => b1 === 0xfe && b2 === 0xb0,
    END: (b1: number, b2: number) => (b1 === 0xff && b2 === 0x00) || b2 === undefined,
  },
  PEC_HEADER: {
    FIRST_SECTION: {
      LA: 0x13, // Number of colors minus one
      COLOR_COUNT: 0x30, // Number of colors minus one
    },
    SECOND_SECTION: {
      WIDTH: PEC_HEADER_SIZE + 8, // s16 in the doc says, 10 but is 8
      HEIGHT: PEC_HEADER_SIZE + 10, // s16 in the doc says, 12 but is 10
      "0x01E0": PEC_HEADER_SIZE + 12,
      "0x01B0": PEC_HEADER_SIZE + 14,
      "pec-stitch-list-subsection": PEC_HEADER_SIZE + 20,
    },
  },
};
