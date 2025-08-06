# Embroidery Preview

Interactive viewer for **DST embroidery files** using **React**, **Three.js**, and **Zustand**.

## Features

- **Load and visualize** DST embroidery files.
- 3D rendering of stitches and color blocks.
- Supports multiple color groups as defined by the DST file.
- Control tools:
  - **DrawRange**: Animate stitches sequentially.
  - **ColorGroup**: Edit colors for each color group/color-stop.
- Automatic calculation of embroidery design width and height.
- Visual separation of blocks and machine jumps.

## Installation

```bash
git clone https://github.com/youruser/embroidery-preview.git
cd embroidery-preview
npm install
npm run dev
```

## Usage

1. **Upload a DST file** using the interface.
2. View the embroidery design in 3D.
3. Use the range and color controls to explore and customize the design.

## Main Structure

- `src/components/EmbroideryViewer.tsx`: Renders the 3D canvas and stitch lines.
- `src/components/ColorGroup.tsx`: Controls and displays color groups.
- `src/components/DrawRange.tsx`: Controls the visible stitch range.
- `src/utils/parseDST.ts`: Main DST parser, generates geometries and color groups.
- `src/stores/embroiderySource.store.ts`: Global Zustand store for geometries, colors, and file details.

## Technical Notes

- Each stitch block is represented as an independent geometry.
- Colors are assigned according to color changes (`color_stop`) defined in the DST file.
- The design's width and height are automatically calculated from the minimum and maximum stitch coordinates.

## Future Implementations

- **Multi-format embroidery file reader:**  
  Support for additional formats such as PES, EXP, JEF, HUS, and more.
- **File conversion:**  
  Convert between embroidery formats, e.g. DST to EXP, PES to DST, etc.
- **Export and download:**  
  Allow users to export or download converted embroidery files.

## Credits

- [Three.js](https://threejs.org/)
- [React](https://react.dev/)
- [Zustand](https://zustand-demo.pmnd.rs/)
