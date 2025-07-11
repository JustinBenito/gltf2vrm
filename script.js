document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let gltfJson = null;
    let gltfBuffer = null;
    let originalFileName = 'model.glb';

    // --- DOM ELEMENTS ---
    const fileInput = document.getElementById('file-upload');
    const fileNameDisplay = document.getElementById('file-name');
    const statusLog = document.getElementById('status-log');
    const wizardSteps = document.querySelectorAll('.wizard-step');
    const nextBtn2 = document.getElementById('next-to-step-2');
    const prevBtn1 = document.getElementById('prev-to-step-1');
    const nextBtn3 = document.getElementById('next-to-step-3');
    const prevBtn2 = document.getElementById('prev-to-step-2');
    const nextBtn4 = document.getElementById('next-to-step-4');
    const prevBtn3 = document.getElementById('prev-to-step-3');
    const convertBtn = document.getElementById('convert-and-download');
    const convertBtnVrm0 = document.getElementById('convert-and-download-vrm0');
    const boneMappingGrid = document.getElementById('bone-mapping-grid');
    const expressionMappingGrid = document.getElementById('expression-mapping-grid');

    // --- CONSTANTS ---
    const VRM_HUMANOID_BONES = [
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
    const VRM_PRESET_EXPRESSIONS = ['happy', 'sad', 'angry', 'relaxed', 'surprised', 'aa', 'ii', 'uu', 'ee', 'oo', 'blink', 'blinkLeft', 'blinkRight', 'neutral'];

    // --- ATTACH EVENT LISTENERS ---
    nextBtn2.addEventListener('click', () => goToStep(2));
    prevBtn1.addEventListener('click', () => goToStep(1));
    nextBtn3.addEventListener('click', () => goToStep(3));
    prevBtn2.addEventListener('click', () => goToStep(2));
    nextBtn4.addEventListener('click', () => goToStep(4));
    prevBtn3.addEventListener('click', () => goToStep(3));
    convertBtn.addEventListener('click', convertAndDownload);
    convertBtnVrm0.addEventListener('click', convertAndDownloadVrm0);
    fileInput.addEventListener('change', handleFileSelect);

    // --- FUNCTION DEFINITIONS ---

    function log(message, isError = false) {
        const logEntry = document.createElement('div');
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        if (isError) logEntry.style.color = 'var(--error-color)';
        statusLog.appendChild(logEntry);
        statusLog.scrollTop = statusLog.scrollHeight;
    }

    function goToStep(step) {
        wizardSteps.forEach(s => s.classList.remove('active'));
        document.getElementById(`step-${step}`).classList.add('active');
    }

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.glb')) {
            log('Error: Please upload a .glb file.', true);
            return;
        }
        originalFileName = file.name;
        fileNameDisplay.textContent = file.name;
        log(`Selected file: ${file.name}`);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                parseGlb(e.target.result);
                nextBtn2.disabled = false;
                log('GLB file parsed successfully.');
            } catch (error) {
                log(`Error parsing GLB: ${error.message}`, true);
                console.error(error);
                nextBtn2.disabled = true;
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function parseGlb(arrayBuffer) {
        const dataView = new DataView(arrayBuffer);
        if (dataView.getUint32(0, true) !== 0x46546C67) throw new Error('Not a valid GLB file.');
        if (dataView.getUint32(4, true) !== 2) throw new Error('Only GLB version 2 is supported.');
        let chunkOffset = 12;
        const jsonChunkLength = dataView.getUint32(chunkOffset, true);
        if (dataView.getUint32(chunkOffset + 4, true) !== 0x4E4F534A) throw new Error('First chunk is not JSON.');
        const jsonChunkData = new Uint8Array(arrayBuffer, chunkOffset + 8, jsonChunkLength);
        gltfJson = JSON.parse(new TextDecoder('utf-8').decode(jsonChunkData));
        chunkOffset += 8 + jsonChunkLength;
        if (chunkOffset < dataView.byteLength) {
            const binChunkLength = dataView.getUint32(chunkOffset, true);
            if (dataView.getUint32(chunkOffset + 4, true) !== 0x004E4942) throw new Error('Expected BIN chunk after JSON.');
            gltfBuffer = arrayBuffer.slice(chunkOffset + 8, chunkOffset + 8 + binChunkLength);
        } else {
            gltfBuffer = null;
        }
        populateUIFromGltf();
    }

    function populateUIFromGltf() {
        if (!gltfJson) return;
        
        let nodeNames = {};
        const jointIndices = new Set();
        if (gltfJson.skins) {
            gltfJson.skins.forEach(skin => skin.joints.forEach(jointIndex => jointIndices.add(jointIndex)));
        } else {
            log("Warning: No skins found in GLTF. The model may not be rigged.", true);
        }

        if (gltfJson.nodes) {
            if (jointIndices.size > 0) {
                jointIndices.forEach(index => {
                    nodeNames[index] = gltfJson.nodes[index].name || `Node ${index}`;
                });
                log(`Found ${jointIndices.size} bones from skins to map.`);
            } else {
                gltfJson.nodes.forEach((node, index) => {
                    nodeNames[index] = node.name || `Node ${index}`;
                });
                log(`No skins found. Listing all ${Object.keys(nodeNames).length} nodes as potential bones.`);
            }
        }

        boneMappingGrid.innerHTML = '';
        VRM_HUMANOID_BONES.forEach(bone => {
            const item = document.createElement('div');
            item.className = 'bone-mapping-item';
            const label = document.createElement('label');
            label.htmlFor = `bone-${bone.name}`;
            label.textContent = bone.name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            if (bone.required) label.classList.add('required-field');
            const select = document.createElement('select');
            select.id = `bone-${bone.name}`;
            select.dataset.vrmBone = bone.name;
            select.innerHTML = `<option value="">--- Not Assigned ---</option>` +
                Object.entries(nodeNames).map(([index, name]) => `<option value="${index}">${name}</option>`).join('');
            item.append(label, select);
            boneMappingGrid.appendChild(item);
        });

        let morphTargetNames = [];
        if (gltfJson.meshes) {
            for (const mesh of gltfJson.meshes) {
                if (mesh.primitives?.[0].extras?.targetNames) {
                    morphTargetNames = mesh.primitives[0].extras.targetNames;
                    log(`Found ${morphTargetNames.length} morph targets: ${morphTargetNames.join(', ')}`);
                    break;
                }
            }
        }
        if (morphTargetNames.length === 0) log('No morph targets (blend shapes) found.');
        expressionMappingGrid.innerHTML = '';
        VRM_PRESET_EXPRESSIONS.forEach(preset => {
            const item = document.createElement('div');
            item.className = 'expression-mapping-item';
            const label = document.createElement('label');
            label.htmlFor = `expr-${preset}`;
            label.textContent = preset.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const select = document.createElement('select');
            select.id = `expr-${preset}`;
            select.dataset.vrmExpression = preset;
            select.innerHTML = `<option value="">--- Not Assigned ---</option>` +
                morphTargetNames.map((name, index) => `<option value="${index}">${name}</option>`).join('');
            item.append(label, select);
            expressionMappingGrid.appendChild(item);
        });
    }

    // --- VRM 0.x EXTENSION BUILDER ---
    function buildVrm0Extension() {
        const humanBones = [];
        boneMappingGrid.querySelectorAll('select').forEach(select => {
            if (select.value) {
                humanBones.push({ bone: select.dataset.vrmBone, node: parseInt(select.value, 10) });
            }
        });
        for (const bone of VRM_HUMANOID_BONES) {
            if (bone.required && !humanBones.find(b => b.bone === bone.name)) throw new Error(`Required bone "${bone.name}" is not assigned.`);
        }
        // VRM 0.x blendShapeMaster
        const blendShapeGroups = [];
        expressionMappingGrid.querySelectorAll('select').forEach(select => {
            if (select.value) {
                const presetName = select.dataset.vrmExpression;
                const morphIndex = parseInt(select.value, 10);
                let meshIndex = -1;
                if (gltfJson.nodes) {
                    meshIndex = gltfJson.nodes.findIndex(node => node.mesh !== undefined && gltfJson.meshes[node.mesh]?.primitives?.[0].extras?.targetNames);
                }
                if (meshIndex === -1) return;
                blendShapeGroups.push({
                    name: presetName,
                    presetName: presetName,
                    binds: [{ mesh: gltfJson.nodes[meshIndex].mesh, index: morphIndex, weight: 100 }],
                    materialValues: [],
                });
            }
        });
        return {
            exporterVersion: "1.0",
            specVersion: "0.0",
            meta: {
                title: document.getElementById('meta-name').value || 'Unnamed',
                version: "1.0",
                author: document.getElementById('meta-author').value || 'Unknown',
                licenseName: "Other",
                // VRM 0.x meta fields can be expanded as needed
            },
            humanoid: {
                humanBones,
                // optional: armStretch, legStretch, upperArmTwist, lowerArmTwist, upperLegTwist, lowerLegTwist, feetSpacing, hasTranslationDoF
            },
            firstPerson: {
                firstPersonBone: humanBones.find(b => b.bone === 'head')?.node ?? 0,
                meshAnnotations: [],
            },
            blendShapeMaster: {
                blendShapeGroups
            },
            secondaryAnimation: {
                boneGroups: [],
                colliderGroups: []
            },
            // VRM 0.x does not have lookAt or expressions
        };
    }

    // --- VRM 0.x EXPORT FUNCTION ---
    async function convertAndDownloadVrm0() {
        try {
            log('Starting VRM 0.x conversion process...');
            const newGltfJson = JSON.parse(JSON.stringify(gltfJson));
            // 1. Build the VRM 0.x extension metadata
            const vrm0Ext = buildVrm0Extension();
            log('VRM 0.x metadata extension built.');
            // 2. Scene graph/skeleton logic: similar to VRM 1.0, but VRM 0.x is more forgiving
            if (newGltfJson.skins?.length > 0) {
                const hipsBone = vrm0Ext.humanoid.humanBones.find(b => b.bone === 'hips');
                if (!hipsBone) throw new Error("The 'Hips' bone is required but not mapped. Cannot process skeleton.");
                // Find skeleton root as in VRM 1.0
                const nodeParents = {};
                newGltfJson.nodes.forEach((node, parentIndex) => {
                    if (node.children) node.children.forEach(childIndex => nodeParents[childIndex] = parentIndex);
                });
                let skeletonRootNodeIndex = hipsBone.node;
                while(nodeParents[skeletonRootNodeIndex] !== undefined) {
                    skeletonRootNodeIndex = nodeParents[skeletonRootNodeIndex];
                }
                newGltfJson.skins.forEach(skin => { skin.skeleton = skeletonRootNodeIndex; });
                // Rebuild scene root nodes
                const childNodes = new Set();
                newGltfJson.nodes.forEach(node => {
                    if (node.children) node.children.forEach(childIndex => childNodes.add(childIndex));
                });
                const newSceneNodes = newGltfJson.nodes
                    .map((_, index) => index)
                    .filter(index => !childNodes.has(index));
                const sceneIndex = newGltfJson.scene || 0;
                newGltfJson.scenes[sceneIndex].nodes = newSceneNodes;
                log(`VRM 0.x: Restructured scene ${sceneIndex}. Final root nodes: [${newSceneNodes.join(', ')}]`);
            } else {
                log('Warning: No skins found in the GLTF. The output may not be a valid animatable avatar.', true);
            }
            // 3. Add the VRM 0.x extension
            if (!newGltfJson.extensions) newGltfJson.extensions = {};
            newGltfJson.extensions.VRM = vrm0Ext;
            if (!newGltfJson.extensionsUsed) newGltfJson.extensionsUsed = [];
            if (!newGltfJson.extensionsUsed.includes('VRM')) newGltfJson.extensionsUsed.push('VRM');
            log('Added VRM 0.x extension to GLTF.');
            // 4. Repack the GLB file
            const outputGlb = packGlb(newGltfJson, gltfBuffer);
            log('Repacked data into new GLB file.');
            // 5. Trigger download
            const blob = new Blob([outputGlb], { type: 'model/gltf-binary' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${originalFileName.replace(/\.glb$/i, '')}_vrm0.vrm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            log('VRM 0.x conversion complete! Your VRM file has been downloaded.');
        } catch (error) {
            log(`VRM 0.x conversion failed: ${error.message}`, true);
            console.error(error);
        }
    }
    
    function packGlb(json, buffer) {
        // Ensure there are no empty properties that can cause issues
        const jsonString = JSON.stringify(json, (key, value) => (value === undefined || value === null) ? undefined : value);
        const jsonChunkData = new TextEncoder().encode(jsonString);
        const paddedJsonLength = Math.ceil(jsonChunkData.length / 4) * 4;
        const jsonPadding = paddedJsonLength - jsonChunkData.length;
        const jsonChunk = new Uint8Array(paddedJsonLength);
        jsonChunk.set(jsonChunkData);
        // Pad with spaces (0x20) as per GLB spec
        for (let i = 0; i < jsonPadding; i++) jsonChunk[jsonChunkData.length + i] = 0x20; 

        const hasBuffer = buffer && buffer.byteLength > 0;
        let paddedBinLength = 0;
        let binChunk = null;
        if (hasBuffer) {
            const binPadding = (4 - (buffer.byteLength % 4)) % 4;
            paddedBinLength = buffer.byteLength + binPadding;
            binChunk = new Uint8Array(paddedBinLength);
            binChunk.set(new Uint8Array(buffer));
            // Pad with zeros (0x00)
        }

        const totalLength = 12 + (8 + paddedJsonLength) + (hasBuffer ? (8 + paddedBinLength) : 0);
        const outputBuffer = new ArrayBuffer(totalLength);
        const dataView = new DataView(outputBuffer);
        let offset = 0;
        
        // Header
        dataView.setUint32(offset, 0x46546C67, true); offset += 4; // magic
        dataView.setUint32(offset, 2, true); offset += 4; // version
        dataView.setUint32(offset, totalLength, true); offset += 4; // length

        // JSON Chunk
        dataView.setUint32(offset, paddedJsonLength, true); offset += 4;
        dataView.setUint32(offset, 0x4E4F534A, true); offset += 4; // chunkType 'JSON'
        new Uint8Array(outputBuffer, offset).set(jsonChunk);
        offset += paddedJsonLength;
        
        // BIN Chunk
        if (hasBuffer) {
            dataView.setUint32(offset, paddedBinLength, true); offset += 4;
            dataView.setUint32(offset, 0x004E4942, true); offset += 4; // chunkType 'BIN'
            new Uint8Array(outputBuffer, offset).set(binChunk);
        }
        
        return outputBuffer;
    }

    function buildVrmExtension() {
        const humanBones = {};
        boneMappingGrid.querySelectorAll('select').forEach(select => {
            if (select.value) humanBones[select.dataset.vrmBone] = { node: parseInt(select.value, 10) };
        });
        for (const bone of VRM_HUMANOID_BONES) {
            if (bone.required && !humanBones[bone.name]) throw new Error(`Required bone "${bone.name}" is not assigned.`);
        }
        const presetExpressions = {};
        expressionMappingGrid.querySelectorAll('select').forEach(select => {
            if (select.value) {
                const presetName = select.dataset.vrmExpression;
                const morphIndex = parseInt(select.value, 10);
                let meshNodeIndex = -1;
                if (gltfJson.nodes) {
                    meshNodeIndex = gltfJson.nodes.findIndex(node => node.mesh !== undefined && gltfJson.meshes[node.mesh]?.primitives?.[0].extras?.targetNames);
                }
                if (meshNodeIndex === -1) {
                    log(`Warning: Could not find a mesh node for expression ${presetName}. Skipping.`, true);
                    return;
                }
                presetExpressions[presetName] = {
                    morphTargetBinds: [{ node: meshNodeIndex, index: morphIndex, weight: 1.0 }],
                    isBinary: false, overrideBlink: 'none', overrideLookAt: 'none', overrideMouth: 'none',
                };
            }
        });

        const vrmExt = {
            specVersion: "1.0",
            meta: {
                name: document.getElementById('meta-name').value || 'Unnamed',
                version: "1.0",
                authors: [document.getElementById('meta-author').value || 'Unknown'],
                licenseUrl: document.getElementById('meta-license').value,
                avatarPermission: document.getElementById('meta-avatarPermission').value,
                allowExcessivelyViolentUsage: false, allowExcessivelySexualUsage: false, 
                commercialUsage: "personalNonProfit", // FIX: Use a valid default
                allowPoliticalOrReligiousUsage: false, allowAntisocialOrHateUsage: false, creditNotation: "required",
                allowRedistribution: false, modification: "prohibited",
            },
            humanoid: { humanBones },
            firstPerson: {
                // meshAnnotations will be removed later if empty
            },
            lookAt: {
                offsetFromHeadBone: [0, 0.06, 0], type: "bone",
                rangeMapHorizontalInner: { inputMaxValue: 90.0, outputScale: 10.0 },
                rangeMapHorizontalOuter: { inputMaxValue: 90.0, outputScale: 10.0 },
                rangeMapVerticalDown: { inputMaxValue: 90.0, outputScale: 10.0 },
                rangeMapVerticalUp: { inputMaxValue: 90.0, outputScale: 10.0 },
            },
            expressions: { preset: presetExpressions, custom: {} }
        };

        // Omit firstPerson.meshAnnotations if it's not defined or empty.
        if (!vrmExt.firstPerson.meshAnnotations || vrmExt.firstPerson.meshAnnotations.length === 0) {
            delete vrmExt.firstPerson.meshAnnotations;
        }

        return vrmExt;
    }

    async function convertAndDownload() {
        try {
            log('Starting conversion process...');
            // Create a deep copy to avoid modifying the original state
            const newGltfJson = JSON.parse(JSON.stringify(gltfJson));
            
            // 1. Build the VRM extension metadata
            const vrmExt = buildVrmExtension();
            log('VRM metadata extension built.');

            // --- [START] SCENE GRAPH AND SKELETON RESTRUCTURING (THE CRITICAL FIX) ---
            if (newGltfJson.skins?.length > 0) {
                const hipsNodeIndex = vrmExt.humanoid.humanBones.hips?.node;
                if (hipsNodeIndex === undefined) {
                    throw new Error("The 'Hips' bone is required but not mapped. Cannot process skeleton.");
                }

                // Create a map of each node to its parent
                const nodeParents = {};
                newGltfJson.nodes.forEach((node, parentIndex) => {
                    if (node.children) {
                        node.children.forEach(childIndex => nodeParents[childIndex] = parentIndex);
                    }
                });

                // Find the true root of the skeleton by walking up from the hips bone
                let skeletonRootNodeIndex = hipsNodeIndex;
                while(nodeParents[skeletonRootNodeIndex] !== undefined) {
                    skeletonRootNodeIndex = nodeParents[skeletonRootNodeIndex];
                }
                log(`Determined skeleton root node: ${skeletonRootNodeIndex} (${newGltfJson.nodes[skeletonRootNodeIndex].name || 'unnamed'})`);
                
                // Update all skins to point to this single, correct skeleton root
                newGltfJson.skins.forEach((skin, i) => {
                    skin.skeleton = skeletonRootNodeIndex;
                    log(`Updated skin ${i} to use skeleton root ${skeletonRootNodeIndex}.`);
                });
                
                // Rebuild the main scene to be clean and valid for VRM
                const sceneIndex = newGltfJson.scene || 0;
                const scene = newGltfJson.scenes[sceneIndex];
                
                // Get all nodes that are children of another node
                const childNodes = new Set();
                newGltfJson.nodes.forEach(node => {
                    if (node.children) node.children.forEach(childIndex => childNodes.add(childIndex));
                });
                
                // The new scene should only contain root nodes (nodes that are not a child of any other node)
                const newSceneNodes = newGltfJson.nodes
                    .map((_, index) => index)
                    .filter(index => !childNodes.has(index));
                    
                scene.nodes = newSceneNodes;
                log(`Restructured scene ${sceneIndex}. Final root nodes: [${scene.nodes.join(', ')}]`);

            } else {
                log('Warning: No skins found in the GLTF. The output may not be a valid animatable avatar.', true);
            }
            // --- [END] SCENE GRAPH AND SKELETON RESTRUCTURING ---

            // 3. Add the VRM extension to the GLTF JSON
            if (!newGltfJson.extensions) newGltfJson.extensions = {};
            newGltfJson.extensions.VRMC_vrm = vrmExt;
            
            // FIX: Safely add 'VRMC_vrm' to extensionsUsed without removing others
            if (!newGltfJson.extensionsUsed) newGltfJson.extensionsUsed = [];
            if (!newGltfJson.extensionsUsed.includes('VRMC_vrm')) {
                newGltfJson.extensionsUsed.push('VRMC_vrm');
            }
            log('Added VRMC_vrm extension to GLTF.');

            // 4. Repack the GLB file
            const outputGlb = packGlb(newGltfJson, gltfBuffer);
            log('Repacked data into new GLB file.');

            // 5. Trigger download
            const blob = new Blob([outputGlb], { type: 'model/gltf-binary' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${originalFileName.replace(/\.glb$/i, '')}.vrm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            log('Conversion complete! Your VRM file has been downloaded.');
        } catch (error) {
            log(`Conversion failed: ${error.message}`, true);
            console.error(error);
        }
    }
});