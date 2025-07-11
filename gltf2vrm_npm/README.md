# gltf-to-vrm

Convert loaded GLTF models to VRM 0.x or 1.0 in memory (browser or Node.js). This package allows you to convert a loaded GLTF (from THREE.GLTFLoader or similar) to a VRM file buffer, with custom bone and blendshape mapping, and output a VRM GLB ready for use with three-vrm, UniVRM, and other tools.

## Installation

```
npm install gltf2vrm
```

You must also have `three` installed as a peer dependency.

## Usage

```js
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { convertGLTFToVRM } from 'gltf2vrm';

const loader = new GLTFLoader();
loader.load('path/to/model.glb', (gltf) => {
  const boneMap = {
    hips: 5,
    spine: 6,
    head: 10,
    leftUpperArm: 15,
    rightUpperArm: 20,
    // ... map all required bones
  };
  const blendShapeMap = {
    happy: 0,
    sad: 1,
    // ...
  };
  const meta = {
    name: 'My VRM Model',
    author: 'Your Name',
  };
  const vrmBuffer = convertGLTFToVRM({
    gltf,
    boneMap,
    blendShapeMap,
    meta,
    version: '1.0', // or '0.x'
  });
  // Use vrmBuffer (save, upload, or load with three-vrm)
});
```

See `examples/convert-gltf-to-vrm.ts` for a more detailed example. Uncomment and adapt the imports as needed for your environment.

## API Reference

### `convertGLTFToVRM(options): ArrayBuffer`

**Options:**

- `gltf` (required): The loaded GLTF object (output of `THREE.GLTFLoader`)
- `boneMap` (required): Object mapping VRM bone names to GLTF node indices
- `blendShapeMap` (optional): Object mapping VRM expression names to morph target indices
- `meta` (optional): Object with VRM metadata fields (name, author, etc.)
- `version` (optional): `'1.0'` (default) or `'0.x'`

**Returns:**

- `ArrayBuffer` containing the VRM GLB

## Supported VRM Versions

- VRM 1.0 (`VRMC_vrm` extension)
- VRM 0.x (`VRM` extension)

## Requirements

- `three` (peer dependency)
- Modern JavaScript environment (ES2019+)
- For Node.js: polyfills for `TextEncoder`/`TextDecoder` if not available

## Limitations

- You must provide a valid bone map for your GLTF model
- Only GLB (binary GLTF 2.0) input is supported
- Some advanced VRM features (spring bones, lookAt, custom expressions) are not fully supported
- The output VRM may require further adjustment in VRM editors for best results

## License

GPL 3.0 License. See LICENSE for details.
