// Convert a number to a signed 8-bit integer
export const signed8 = (n: number): number => (n & 0x80 ? n - 0x100 : n);
