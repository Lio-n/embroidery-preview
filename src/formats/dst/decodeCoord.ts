export type DECODE_COORD = {
  x: number;
  y: number;
  jump: boolean;
  color_stop: boolean;
};

export const decodeCoord = (
  byte1: number,
  byte2: number,
  byte3: number
): DECODE_COORD => {
  const cmd = byte1 | (byte2 << 8) | (byte3 << 16); // Compact the 3 bytes into a single number
  let x = 0,
    y = 0,
    jump = false,
    color_stop = false;
  const bit = (bit: number) => cmd & (1 << bit); // Check if a bit is active

  if (bit(23)) y += 1;
  if (bit(22)) y -= 1;
  if (bit(21)) y += 9;
  if (bit(20)) y -= 9;
  if (bit(19)) x -= 9;
  if (bit(18)) x += 9;
  if (bit(17)) x -= 1;
  if (bit(16)) x += 1;

  if (bit(15)) y += 3;
  if (bit(14)) y -= 3;
  if (bit(13)) y += 27;
  if (bit(12)) y -= 27;
  if (bit(11)) x -= 27;
  if (bit(10)) x += 27;
  if (bit(9)) x -= 3;
  if (bit(8)) x += 3;

  if (bit(7)) jump = true;
  if (bit(6)) color_stop = true;
  if (bit(5)) y += 81;
  if (bit(4)) y -= 81;
  if (bit(3)) x -= 81;
  if (bit(2)) x += 81;

  return { x, y, jump, color_stop };
};
