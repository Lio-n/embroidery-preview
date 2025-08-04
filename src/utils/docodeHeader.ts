export type Header = {
  "+X": string;
  "+Y": string;
  "-X": string;
  "-Y": string;
  AX: string;
  AY: string;
  CO: string;
  LA: string;
  MX: string;
  MY: string;
  PD: string;
  ST: string;
};

export const decodeHeader = (buffer: ArrayBuffer): Header => {
  const header = new TextDecoder("ascii").decode(buffer.slice(0, 512));
  const lines = header.split("\r");

  const info: Record<string, string> = {};

  for (const line of lines) {
    const [key, ...rest] = line.split(":");
    if (!key || rest.length === 0) continue;
    const value = rest.join(":").trim();
    info[key.trim()] = value;
  }

  return info as Header;
};
