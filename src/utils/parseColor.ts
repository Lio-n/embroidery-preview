import * as THREE from "three";

// Fix this, color numbers should use numbers between 0-255
export const parseColor = (colorCount: number): THREE.Color[] => {
  const vector0 = new THREE.Vector3();
  const threeColors: THREE.Color[] = [];
  const palette = [];
  let colorRed = 1,
    colorGreen = 1,
    colorBlue = 1;
  let aux_color: string = "";
  const index = 0;

  while (palette.length < colorCount + 1) {
    colorRed = Math.floor(Math.random() * (255 - 0 + 1)) + 0;
    colorGreen = Math.floor(Math.random() * (255 - 0 + 1)) + 0;
    colorBlue = Math.floor(Math.random() * (255 - 0 + 1)) + 0;

    vector0.set(colorRed, colorGreen, colorBlue).normalize();
    aux_color =
      "#" + new THREE.Color(vector0.x, vector0.y, vector0.z).getHexString();
    palette.push(aux_color);
  }

  for (let i = 0; i < palette.length; i++) {
    threeColors[i] = new THREE.Color(palette[i]);
    const p = threeColors[index % threeColors.length];
    colorRed = p.r;
    colorGreen = p.g;
    colorBlue = p.b;
  }

  console.log({ threeColors });

  return threeColors;
};
