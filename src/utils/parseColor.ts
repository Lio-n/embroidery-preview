import * as THREE from "three/webgpu";

export const parseColor = (colorCount: number): THREE.Color[] => {
  const vector0 = new THREE.Vector3();
  const threeColors: THREE.Color[] = [];
  const palette = [];
  let colorRed = 1,
    colorGreen = 1,
    colorBlue = 1;
  // let aux_color: string = "";
  const index = 0;

  while (palette.length < colorCount + 1) {
    colorRed = Math.random();
    colorGreen = Math.random();
    colorBlue = Math.random();
    vector0.set(colorRed, colorGreen, colorBlue).normalize();
    palette.push(
      "#" + new THREE.Color(vector0.x, vector0.y, vector0.z).getHexString()
    );
  }

  for (let i = 0; i < palette.length; i++) {
    threeColors[i] = new THREE.Color(palette[i]);
    const p = threeColors[index % threeColors.length];
    colorRed = p.r;
    colorGreen = p.g;
    colorBlue = p.b;
  }
  // while (threeColors.length < colorCount + 1) {
  //   colorRed = Math.random();
  //   colorGreen = Math.random();
  //   colorBlue = Math.random();
  //   vector0.set(colorRed, colorGreen, colorBlue).normalize();
  //   aux_color =
  //     "#" + new THREE.Color(vector0.x, vector0.y, vector0.z).getHexString();

  //   threeColors.push(new THREE.Color(aux_color));
  // }

  return threeColors;
};
