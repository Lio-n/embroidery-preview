export const parseDatetime = (str: string): Date => {
  // Parse date string in format AAAAMMDDHHMMSS
  const year = parseInt(str.slice(0, 4), 10);
  const month = parseInt(str.slice(4, 6), 10) - 1; // JS uses 0-11 for months
  const day = parseInt(str.slice(6, 8), 10);
  const hour = parseInt(str.slice(8, 10), 10);
  const minute = parseInt(str.slice(10, 12), 10);
  const second = parseInt(str.slice(12, 14), 10);

  return new Date(year, month, day, hour, minute, second);
};
