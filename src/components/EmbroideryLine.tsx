import { Line } from "three";

export const EmbroideryLine = ({ line }: { line: Line }) => {
  // primitive : allows injecting pure Three.js objects
  return line ? <primitive object={line} /> : null;
};
