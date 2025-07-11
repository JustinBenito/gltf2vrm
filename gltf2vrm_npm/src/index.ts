// Core GLTF to VRM conversion logic for npm package

export type VRMVersion = '1.0' | '0.x';

export interface ConvertGLTFToVRMOptions {
  gltf: any; // Output of THREE.GLTFLoader
  boneMap: Record<string, number>;
  blendShapeMap?: Record<string, number>;
  meta?: {
    name?: string;
    author?: string;
    licenseUrl?: string;
    avatarPermission?: string;
    [key: string]: any;
  };
  version?: VRMVersion;
}

const VRM_HUMANOID_BONES: { name: string; required: boolean }[] = [
  { name: 'hips', required: true }, { name: 'spine', required: true },
  { name: 'chest', required: false }, { name: 'upperChest', required: false },
  { name: 'neck', required: false }, { name: 'head', required: true },
  { name: 'leftEye', required: false }, { name: 'rightEye', required: false },
  { name: 'leftUpperArm', required: true }, { name: 'leftLowerArm', required: true },
  { name: 'leftHand', required: true }, { name: 'rightUpperArm', required: true },
  { name: 'rightLowerArm', required: true }, { name: 'rightHand', required: true },
  { name: 'leftUpperLeg', required: true }, { name: 'leftLowerLeg', required: true },
  { name: 'leftFoot', required: true }, { name: 'rightUpperLeg', required: true },
  { name: 'rightLowerLeg', required: true }, { name: 'rightFoot', required: true },
  { name: 'leftToes', required: false }, { name: 'rightToes', required: false },
  { name: 'leftShoulder', required: false }, { name: 'rightShoulder', required: false },
  { name: 'leftThumbMetacarpal', required: false }, { name: 'leftThumbProximal', required: false },
  { name: 'leftThumbDistal', required: false }, { name: 'leftIndexProximal', required: false },
  { name: 'leftIndexIntermediate', required: false }, { name: 'leftIndexDistal', required: false },
  { name: 'leftMiddleProximal', required: false }, { name: 'leftMiddleIntermediate', required: false },
  { name: 'leftMiddleDistal', required: false }, { name: 'leftRingProximal', required: false },
  { name: 'leftRingIntermediate', required: false }, { name: 'leftRingDistal', required: false },
  { name: 'leftLittleProximal', required: false }, { name: 'leftLittleIntermediate', required: false },
  { name: 'leftLittleDistal', required: false }, { name: 'rightThumbMetacarpal', required: false },
  { name: 'rightThumbProximal', required: false }, { name: 'rightThumbDistal', required: false },
  { name: 'rightIndexProximal', required: false }, { name: 'rightIndexIntermediate', required: false },
  { name: 'rightIndexDistal', required: false }, { name: 'rightMiddleProximal', required: false },
  { name: 'rightMiddleIntermediate', required: false }, { name: 'rightMiddleDistal', required: false },
  { name: 'rightRingProximal', required: false }, { name: 'rightRingIntermediate', required: false },
  { name: 'rightRingDistal', required: false }, { name: 'rightLittleProximal', required: false },
  { name: 'rightLittleIntermediate', required: false }, { name: 'rightLittleDistal', required: false }
];

function buildVRM1Extension(
  gltfJson: any,
  boneMap: Record<string, number>,
  blendShapeMap: Record<string, number> | undefined,
  meta: any
) {
  // Build humanBones
  const humanBones: Record<string, { node: number }> = {};
  for (const bone of VRM_HUMANOID_BONES) {
    const idx = boneMap[bone.name];
    if (bone.required && (idx === undefined || idx === null)) {
      throw new Error(`Required bone '${bone.name}' is not mapped.`);
    }
    if (idx !== undefined && idx !== null) {
      humanBones[bone.name] = { node: idx };
    }
  }
  // Build expressions (blendshapes)
  const presetExpressions: Record<string, any> = {};
  if (blendShapeMap && gltfJson.nodes) {
    Object.entries(blendShapeMap).forEach(([preset, morphIndex]) => {
      const meshNodeIndex = gltfJson.nodes.findIndex(
        (node: any) => node.mesh !== undefined && gltfJson.meshes[node.mesh]?.primitives?.[0].extras?.targetNames
      );
      if (meshNodeIndex !== -1) {
        presetExpressions[preset] = {
          morphTargetBinds: [{ node: meshNodeIndex, index: morphIndex, weight: 1.0 }],
          isBinary: false, overrideBlink: 'none', overrideLookAt: 'none', overrideMouth: 'none',
        };
      }
    });
  }
  return {
    specVersion: '1.0',
    meta: {
      name: meta?.name || 'Unnamed',
      version: '1.0',
      authors: [meta?.author || 'Unknown'],
      licenseUrl: meta?.licenseUrl || 'https://vrm.dev/licenses/1.0/',
      avatarPermission: meta?.avatarPermission || 'onlyAuthor',
      allowExcessivelyViolentUsage: false, allowExcessivelySexualUsage: false, commercialUsage: 'personalNonProfit',
      allowPoliticalOrReligiousUsage: false, allowAntisocialOrHateUsage: false, creditNotation: 'required',
      allowRedistribution: false, modification: 'prohibited',
    },
    humanoid: { humanBones },
    firstPerson: {},
    lookAt: {
      offsetFromHeadBone: [0, 0.06, 0], type: 'bone',
      rangeMapHorizontalInner: { inputMaxValue: 90.0, outputScale: 10.0 },
      rangeMapHorizontalOuter: { inputMaxValue: 90.0, outputScale: 10.0 },
      rangeMapVerticalDown: { inputMaxValue: 90.0, outputScale: 10.0 },
      rangeMapVerticalUp: { inputMaxValue: 90.0, outputScale: 10.0 },
    },
    expressions: { preset: presetExpressions, custom: {} },
  };
}

function buildVRM0Extension(
  gltfJson: any,
  boneMap: Record<string, number>,
  blendShapeMap: Record<string, number> | undefined,
  meta: any
) {
  // Build humanBones
  const humanBones: { bone: string; node: number }[] = [];
  for (const bone of VRM_HUMANOID_BONES) {
    const idx = boneMap[bone.name];
    if (bone.required && (idx === undefined || idx === null)) {
      throw new Error(`Required bone '${bone.name}' is not mapped.`);
    }
    if (idx !== undefined && idx !== null) {
      humanBones.push({ bone: bone.name, node: idx });
    }
  }
  // Build blendShapeMaster
  const blendShapeGroups: any[] = [];
  if (blendShapeMap && gltfJson.nodes) {
    Object.entries(blendShapeMap).forEach(([preset, morphIndex]) => {
      const meshIndex = gltfJson.nodes.findIndex(
        (node: any) => node.mesh !== undefined && gltfJson.meshes[node.mesh]?.primitives?.[0].extras?.targetNames
      );
      if (meshIndex !== -1) {
        blendShapeGroups.push({
          name: preset,
          presetName: preset,
          binds: [{ mesh: gltfJson.nodes[meshIndex].mesh, index: morphIndex, weight: 100 }],
          materialValues: [],
        });
      }
    });
  }
  return {
    exporterVersion: '1.0',
    specVersion: '0.0',
    meta: {
      title: meta?.name || 'Unnamed',
      version: '1.0',
      author: meta?.author || 'Unknown',
      licenseName: 'Other',
    },
    humanoid: { humanBones },
    firstPerson: {
      firstPersonBone: humanBones.find(b => b.bone === 'head')?.node ?? 0,
      meshAnnotations: [],
    },
    blendShapeMaster: { blendShapeGroups },
    secondaryAnimation: { boneGroups: [], colliderGroups: [] },
  };
}

function packGlb(json: any, buffer: ArrayBuffer | null): ArrayBuffer {
  const jsonString = JSON.stringify(json, (key, value) => (value === undefined || value === null) ? undefined : value);
  const jsonChunkData = new TextEncoder().encode(jsonString);
  const paddedJsonLength = Math.ceil(jsonChunkData.length / 4) * 4;
  const jsonPadding = paddedJsonLength - jsonChunkData.length;
  const jsonChunk = new Uint8Array(paddedJsonLength);
  jsonChunk.set(jsonChunkData);
  for (let i = 0; i < jsonPadding; i++) jsonChunk[jsonChunkData.length + i] = 0x20;
  const hasBuffer = buffer && buffer.byteLength > 0;
  let paddedBinLength = 0;
  let binChunk = null;
  if (hasBuffer) {
    const binPadding = (4 - (buffer!.byteLength % 4)) % 4;
    paddedBinLength = buffer!.byteLength + binPadding;
    binChunk = new Uint8Array(paddedBinLength);
    binChunk.set(new Uint8Array(buffer!));
  }
  const totalLength = 12 + (8 + paddedJsonLength) + (hasBuffer ? (8 + paddedBinLength) : 0);
  const outputBuffer = new ArrayBuffer(totalLength);
  const dataView = new DataView(outputBuffer);
  let offset = 0;
  dataView.setUint32(offset, 0x46546c67, true); offset += 4; // magic
  dataView.setUint32(offset, 2, true); offset += 4; // version
  dataView.setUint32(offset, totalLength, true); offset += 4; // length
  dataView.setUint32(offset, paddedJsonLength, true); offset += 4;
  dataView.setUint32(offset, 0x4e4f534a, true); offset += 4; // 'JSON'
  new Uint8Array(outputBuffer, offset).set(jsonChunk); offset += paddedJsonLength;
  if (hasBuffer) {
    dataView.setUint32(offset, paddedBinLength, true); offset += 4;
    dataView.setUint32(offset, 0x004e4942, true); offset += 4; // 'BIN'
    new Uint8Array(outputBuffer, offset).set(binChunk!);
  }
  return outputBuffer;
}

export function convertGLTFToVRM(options: ConvertGLTFToVRMOptions): ArrayBuffer {
  const { gltf, boneMap, blendShapeMap, meta, version = '1.0' } = options;
  if (!gltf) throw new Error('gltf is required');
  if (!boneMap) throw new Error('boneMap is required');
  // 1. Clone the GLTF JSON
  const gltfJson = JSON.parse(JSON.stringify(gltf.parser.json || gltf.parser.jsonContent || gltf.json || gltf));
  // 2. Extract BIN buffer if present
  let binBuffer: ArrayBuffer | null = null;
  if (gltf.parser && gltf.parser.bin) {
    binBuffer = gltf.parser.bin;
  } else if (gltf.buffers && gltf.buffers[0] && gltf.buffers[0].arrayBuffer) {
    binBuffer = gltf.buffers[0].arrayBuffer;
  } else if (gltf.buffers && gltf.buffers[0]) {
    binBuffer = gltf.buffers[0];
  }
  // 3. Build VRM extension
  if (version === '1.0') {
    if (!gltfJson.extensions) gltfJson.extensions = {};
    gltfJson.extensions.VRMC_vrm = buildVRM1Extension(gltfJson, boneMap, blendShapeMap, meta);
    if (!gltfJson.extensionsUsed) gltfJson.extensionsUsed = [];
    if (!gltfJson.extensionsUsed.includes('VRMC_vrm')) gltfJson.extensionsUsed.push('VRMC_vrm');
  } else {
    if (!gltfJson.extensions) gltfJson.extensions = {};
    gltfJson.extensions.VRM = buildVRM0Extension(gltfJson, boneMap, blendShapeMap, meta);
    if (!gltfJson.extensionsUsed) gltfJson.extensionsUsed = [];
    if (!gltfJson.extensionsUsed.includes('VRM')) gltfJson.extensionsUsed.push('VRM');
  }
  // 4. Pack as GLB
  return packGlb(gltfJson, binBuffer);
} 