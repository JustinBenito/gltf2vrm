# GLTF to VRM Converter

## Overview

This project provides a browser-based tool for converting GLTF 2.0 (.glb) models into VRM format, supporting both VRM 1.0 and VRM 0.x specifications. The converter is designed for ease of use, requiring no installation or command-line interaction. Users can upload a GLB file, map bones and blend shapes, enter metadata, and export a VRM file ready for use in VRM-compatible applications.

## Features

- Convert GLTF 2.0 (.glb) models to VRM 1.0 and VRM 0.x formats
- Interactive wizard for step-by-step conversion
- Bone mapping UI for VRM humanoid compatibility
- Blend shape (expression) mapping for facial animation
- Metadata entry (model name, author, license, permissions)
- Log output for process transparency and error reporting
- No server-side processing; all conversion is done in the browser

## Supported VRM Versions

- **VRM 1.0**: Modern VRM format, compatible with latest VRM viewers and applications (e.g., Pixiv/three-vrm v1+, UniVRM 1.x)
- **VRM 0.x**: Legacy VRM format, compatible with older viewers and applications (e.g., VRoid Studio, UniVRM 0.x)

## How to Use

### 1. Setup

- Clone or download this repository.
- Open `index.html` in a modern web browser (no build step required).

### 2. Usage Steps

1. **Upload Model**: Click "Select .glb File" and choose your GLTF 2.0 binary file.
2. **Enter Metadata**: Fill in model name, author, and select license and permissions.
3. **Map Bones**: Assign your model's bones to VRM humanoid bones using the dropdowns. All required bones must be mapped for a valid VRM export.
4. **Map Expressions**: Assign blend shapes (morph targets) to standard VRM expressions if available.
5. **Export**: Click either "Convert & Download (VRM 1.0)" or "Convert & Download (VRM 0.x)" to export your model in the desired VRM format.
6. **Download**: The converted VRM file will be automatically downloaded.

### 3. File Structure

- `index.html` - Main HTML file containing the UI and logic for the converter
- `script.js` - JavaScript logic for parsing, mapping, and exporting models
- `styles.css` - Stylesheet for the UI

## Browser Compatibility

- Tested on latest versions of Firefox ( Zen ) only :)
- Requires support for modern JavaScript (ES6+)
- No server or backend required

## Known Limitations

- Only GLB (binary GLTF 2.0) files are supported as input
- The tool assumes a single skinned mesh and skeleton per model
- All required VRM humanoid bones must be mapped for a valid export
- Some advanced VRM features (e.g., spring bones, lookAt, custom expressions) are not fully supported
- The exported VRM may require further adjustment in VRM editors for better results.

## License

This project is provided under the GPL 3.0 License. See the LICENSE file for details.

## Contributing

Create an issue or solve an issue from the issues tab.

Peace ✌️
