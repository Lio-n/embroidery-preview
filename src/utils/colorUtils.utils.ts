export const colorFloatToUint8 = (
  color: [number, number, number]
): [number, number, number] => {
  return [
    Math.round(color[0] * 255),
    Math.round(color[1] * 255),
    Math.round(color[2] * 255),
  ];
};

export const colorUint8ToFloat = (
  color: [number, number, number]
): [number, number, number] => {
  return [color[0] / 255, color[1] / 255, color[2] / 255];
};
