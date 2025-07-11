// Example: Convert a loaded GLTF to VRM using gltf-to-vrm
// This example assumes you have installed 'three' and 'gltf-to-vrm' and are running in a browser or Node.js with appropriate setup.
// If running locally in this repo, use: import { convertGLTFToVRM } from '../src';
// If using as an installed package, use: import { convertGLTFToVRM } from 'gltf-to-vrm';

import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'; // Uncomment if available in your environment
// import { convertGLTFToVRM } from 'gltf-to-vrm'; // Uncomment if installed as a package
// import { convertGLTFToVRM } from '../src'; // Uncomment for local development

// 1. Load a GLB file using THREE.GLTFLoader
// const loader = new GLTFLoader();
// loader.load('path/to/model.glb', (gltf) => {
//   // 2. Prepare a bone map (VRM bone name -> GLTF node index)
//   // You must inspect your GLTF to know the correct indices
//   const boneMap = {
//     hips: 5,
//     spine: 6,
//     head: 10,
//     leftUpperArm: 15,
//     rightUpperArm: 20,
//     // ... map all required bones
//   };
//
//   // 3. Optionally, prepare a blendShape map (VRM expression -> morph target index)
//   const blendShapeMap = {
//     happy: 0,
//     sad: 1,
//     // ...
//   };
//
//   // 4. Optionally, provide VRM meta information
//   const meta = {
//     name: 'My VRM Model',
//     author: 'Your Name',
//   };
//
//   // 5. Convert to VRM (1.0 or 0.x)
//   const vrmBuffer = convertGLTFToVRM({
//     gltf,
//     boneMap,
//     blendShapeMap,
//     meta,
//     version: '1.0', // or '0.x'
//   });
//
//   // 6. Use the VRM buffer (save to file, upload, or load with three-vrm)
//   // Example: Download in browser
//   const blob = new Blob([vrmBuffer], { type: 'model/gltf-binary' });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement('a');
//   a.href = url;
//   a.download = 'model.vrm';
//   document.body.appendChild(a);
//   a.click();
//   document.body.removeChild(a);
//   URL.revokeObjectURL(url);
//
//   // Or: pass vrmBuffer to THREE.VRM.from() if using three-vrm
// }); 