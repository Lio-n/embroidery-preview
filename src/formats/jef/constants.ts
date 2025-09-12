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
/* JEF Header
Type 	Bytes 	Value 	Description
`u32` 	4 	0x74 +8 * Color_Changes 	Offset into file where stitches begin.
`u32` 	4 	0x14 	Unknown.
`char` 	14 	"20180712082429" (example) 	Date
`char` 	1 	'm', 'n', 'o','p','q','r','s',t' 	Version letter. 12000: m, 11000: n, 10000v3: o, 10000 v2.2 p, 9000 q, mc350, r, mc200 s, mb4 t. Janome's software leaves this as 00 00 at times.
`u8` 	1 	0x20 	Unknown
`u32` 	4 	Color Count 	Color Count
`u32` 	4 	Points Length / 2 	Points Length /2. So 80 01 00 00 is 2 not 1.
`u32` 	4 	Hoop Used 	Hoop
`u32` 	16 	Extends 	Distances from center of hoop.
`u32` 	16 	Edge amount for hoop 	Distance from default 110 x 110 Hoop, or -1,-1,-1,-1 if does not fit.
`u32` 	16 	Edge amount for hoop 	Distance from default 50 x 50 Hoop, or -1,-1,-1,-1 if does not fit.
`u32` 	16 	Edge amount for hoop 	Distance from default 140 x 200 Hoop, or -1,-1,-1,-1 if does not fit.
`u32` 	16 	Edge amount for hoop 	Distance from custom hoop, or -1,-1,-1,-1 if does not fit.
`u32` 	4 * Color_Changes 	Magic Number Color Lookup 	List of colors changes.
`u32` 	4 * Color_Changes 	0x0D 	The values 0x0D, 0x0D, 0x0D, 0x0D repeated as many times as there are color changes. 
*/
