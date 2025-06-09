"use strict";
import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js";
import { createMaterials } from "./materials.js";

// Create materials once at module level
const materials = createMaterials();

export const createCube = function (
  x,
  y,
  z,
  shapes,
  shapeList,
  shapeCount,
  scene,
  point,
  shapeVertex,
  dragX,
  dragY,
  dragZ
) {
  // Debug check for input parameters
  if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
    console.error('Invalid position coordinates:', { x, y, z });
    return null;
  }
  if (!Array.isArray(shapes) || !Array.isArray(shapeList) || !Array.isArray(shapeCount)) {
    console.error('Invalid array parameters:', { shapes, shapeList, shapeCount });
    return null;
  }
  if (!scene || !Array.isArray(point) || !Array.isArray(shapeVertex)) {
    console.error('Invalid scene or array parameters:', { scene, point, shapeVertex });
    return null;
  }
  if (!Array.isArray(dragX) || !Array.isArray(dragY) || !Array.isArray(dragZ)) {
    console.error('Invalid drag arrays:', { dragX, dragY, dragZ });
    return null;
  }

  let geometry, material, cub;

  try {
    console.log('Creating geometry...');
    // Create a BufferGeometry
    geometry = new THREE.BufferGeometry();
    if (!geometry) {
      throw new Error('Failed to create geometry');
    }
    console.log('Geometry created:', geometry);

    // Create position attribute
    console.log('Creating position attribute...');
    const positions = new Float32Array([
      -0.5, -0.5, -0.5,
       0.5, -0.5, -0.5,
       0.5,  0.5, -0.5,
      -0.5,  0.5, -0.5,
      -0.5, -0.5,  0.5,
       0.5, -0.5,  0.5,
       0.5,  0.5,  0.5,
      -0.5,  0.5,  0.5,
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.attributes.position.needsUpdate = true;

    // Create index attribute
    console.log('Creating index attribute...');
    const indices = new Uint16Array([
      0, 1, 2, 0, 2, 3, // front
      4, 5, 6, 4, 6, 7, // back
      0, 4, 7, 0, 7, 3, // left
      1, 5, 6, 1, 6, 2, // right
      0, 1, 5, 0, 5, 4, // bottom
      3, 2, 6, 3, 6, 7  // top
    ]);
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.index.needsUpdate = true;

    // Compute normals
    console.log('Computing vertex normals...');
    geometry.computeVertexNormals();
    geometry.attributes.normal.needsUpdate = true;

    // Compute bounding volumes
    console.log('Computing bounding volumes...');
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();

    console.log('Geometry attributes:', geometry.attributes);

    console.log('Getting material...');
    material = materials.cubeShader;
    if (!material) {
      throw new Error('Failed to get material');
    }
    console.log('Material:', material);

    console.log('Creating mesh...');
    cub = new THREE.Mesh(geometry, material);
    if (!cub) {
      throw new Error('Failed to create mesh');
    }
    console.log('Mesh created:', cub);

    console.log('Setting position...');
    cub.position.set(x, y, z);
    console.log('Position set');

    cub.name = "Cube";
    cub.userData.id = `Cube-${shapeCount[0]}`;
    cub.userData.selected = false;
    
    console.log('Adding to scene...');
    scene.add(cub);
    shapes.push(cub);
    console.log('Added to scene and shapes array');

    // Add to shapeList
    shapeList.push({
      id: cub.userData.id,
      x: parseInt(x, 10),
      y: parseInt(y, 10),
      z: parseInt(z, 10),
    });
    shapeCount[0]++;

    try {
      console.log('Creating edges...');
      const edgesGeometry = new THREE.EdgesGeometry(geometry);
      const edgesMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 2,
      });
      const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      cub.add(edges);
      console.log('Edges added');
    } catch (edgeError) {
      console.error('Error creating edges:', edgeError);
    }

    try {
      console.log('Creating vertices...');
      const positions = geometry.attributes.position;
      console.log('Position attribute found:', positions);
      
      // Create vertices at each position
      for (let i = 0; i < positions.count; i++) {
        const vertex = new THREE.Vector3();
        vertex.fromBufferAttribute(positions, i);
        
        // Create a small sphere at each vertex
        const sphereGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        
        // Position the sphere at the vertex
        sphere.position.copy(vertex);
        cub.add(sphere);
        
        // Add to points array
        point.push(sphere);
        
        if (i === 0) {
          shapeVertex.push(sphere);
        }
      }
      console.log('Vertices created');
    } catch (vertexError) {
      console.error('Error creating vertices:', vertexError);
      console.error('Geometry details:', {
        hasAttributes: geometry.attributes ? 'yes' : 'no',
        hasPosition: geometry.attributes && geometry.attributes.position ? 'yes' : 'no',
        geometryType: geometry.type,
        geometry: geometry
      });
    }

    // Store initial position for dragging
    dragX.push(x);
    dragY.push(y);
    dragZ.push(z);

    return cub;
  } catch (error) {
    console.error('Error creating cube:', error);
    console.error('Error details:', {
      geometry: geometry ? 'created' : 'failed',
      material: material ? 'created' : 'failed',
      cub: cub ? 'created' : 'failed',
      scene: scene ? 'valid' : 'invalid',
      shapes: shapes ? 'valid' : 'invalid'
    });
    return null;
  }
};

export const createDodecahedron = function (
  x,
  y,
  z,
  shapes,
  shapeList,
  shapeCount,
  scene,
  point,
  shapeVertex,
  dragX,
  dragY,
  dragZ
) {
  // Debug check for input parameters
  if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
    console.error('Invalid position coordinates:', { x, y, z });
    return null;
  }
  if (!Array.isArray(shapes) || !Array.isArray(shapeList) || !Array.isArray(shapeCount)) {
    console.error('Invalid array parameters:', { shapes, shapeList, shapeCount });
    return null;
  }
  if (!scene || !Array.isArray(point) || !Array.isArray(shapeVertex)) {
    console.error('Invalid scene or array parameters:', { scene, point, shapeVertex });
    return null;
  }
  if (!Array.isArray(dragX) || !Array.isArray(dragY) || !Array.isArray(dragZ)) {
    console.error('Invalid drag arrays:', { dragX, dragY, dragZ });
    return null;
  }

  let geometry, material, cub;

  try {
    console.log('Creating dodecahedron geometry...');
    // Create geometry with explicit parameters
    geometry = new THREE.DodecahedronGeometry(1, 0);
    if (!geometry) {
      throw new Error('Failed to create geometry');
    }
    console.log('Geometry created:', geometry);

    // Ensure geometry has position attribute
    if (!geometry.attributes.position) {
      throw new Error('Geometry missing position attribute');
    }

    // Create normal attribute
    console.log('Creating normal attribute...');
    const positions = geometry.attributes.position;
    const normals = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const length = Math.sqrt(x * x + y * y + z * z);
      normals[i * 3] = x / length;
      normals[i * 3 + 1] = y / length;
      normals[i * 3 + 2] = z / length;
    }
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

    // Compute bounding volumes
    console.log('Computing bounding volumes...');
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();

    console.log('Getting material...');
    material = materials.cubeShader;
    if (!material) {
      throw new Error('Failed to get material');
    }
    console.log('Material:', material);

    console.log('Creating mesh...');
    cub = new THREE.Mesh(geometry, material);
    if (!cub) {
      throw new Error('Failed to create mesh');
    }
    console.log('Mesh created:', cub);
    
    console.log('Setting position...');
    cub.position.set(x, y, z);
    console.log('Position set');

    cub.name = "Dodecahedron";
    cub.userData.id = `Dodecahedron-${shapeCount[1]}`;
    cub.userData.selected = false;
    
    console.log('Adding to scene...');
    scene.add(cub);
    shapes.push(cub);
    console.log('Added to scene and shapes array');

    // Add to shapeList
    shapeList.push({
      id: cub.userData.id,
      x: parseInt(x, 10),
      y: parseInt(y, 10),
      z: parseInt(z, 10),
    });
    shapeCount[1]++;

    try {
      console.log('Creating edges...');
      const edgesGeometry = new THREE.EdgesGeometry(geometry);
      const edgesMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 2,
      });
      const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      cub.add(edges);
      console.log('Edges added');
    } catch (edgeError) {
      console.error('Error creating edges:', edgeError);
    }

    try {
      console.log('Creating vertices...');
      const positions = geometry.attributes.position;
      console.log('Position attribute found:', positions);
      
      // Create vertices at each position
      for (let i = 0; i < positions.count; i++) {
        const vertex = new THREE.Vector3();
        vertex.fromBufferAttribute(positions, i);
        
        // Create a small sphere at each vertex
        const sphereGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        
        // Position the sphere at the vertex
        sphere.position.copy(vertex);
        cub.add(sphere);
        
        // Add to points array
        point.push(sphere);
        
        if (i === 0) {
          shapeVertex.push(sphere);
        }
      }
      console.log('Vertices created');
    } catch (vertexError) {
      console.error('Error creating vertices:', vertexError);
      console.error('Geometry details:', {
        hasAttributes: geometry.attributes ? 'yes' : 'no',
        hasPosition: geometry.attributes && geometry.attributes.position ? 'yes' : 'no',
        geometryType: geometry.type,
        geometry: geometry
      });
    }

    // Store initial position for dragging
    dragX.push(x);
    dragY.push(y);
    dragZ.push(z);

    return cub;
  } catch (error) {
    console.error('Error creating dodecahedron:', error);
    console.error('Error details:', {
      geometry: geometry ? 'created' : 'failed',
      material: material ? 'created' : 'failed',
      cub: cub ? 'created' : 'failed',
      scene: scene ? 'valid' : 'invalid',
      shapes: shapes ? 'valid' : 'invalid'
    });
    return null;
  }
};

export const createOctahedron = function (
  x,
  y,
  z,
  shapes,
  shapeList,
  shapeCount,
  scene,
  point,
  shapeVertex,
  dragX,
  dragY,
  dragZ
) {
  // Debug check for input parameters
  if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
    console.error('Invalid position coordinates:', { x, y, z });
    return null;
  }
  if (!Array.isArray(shapes) || !Array.isArray(shapeList) || !Array.isArray(shapeCount)) {
    console.error('Invalid array parameters:', { shapes, shapeList, shapeCount });
    return null;
  }
  if (!scene || !Array.isArray(point) || !Array.isArray(shapeVertex)) {
    console.error('Invalid scene or array parameters:', { scene, point, shapeVertex });
    return null;
  }
  if (!Array.isArray(dragX) || !Array.isArray(dragY) || !Array.isArray(dragZ)) {
    console.error('Invalid drag arrays:', { dragX, dragY, dragZ });
    return null;
  }

  let geometry, material, cub;

  try {
    console.log('Creating octahedron geometry...');
    // Create a BufferGeometry
    geometry = new THREE.BufferGeometry();
    if (!geometry) {
      throw new Error('Failed to create geometry');
    }
    console.log('Geometry created:', geometry);

    // Create position attribute
    console.log('Creating position attribute...');
    const positions = new Float32Array([
      1, 0, 0,
      -1, 0, 0,
      0, 1, 0,
      0, -1, 0,
      0, 0, 1,
      0, 0, -1
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.attributes.position.needsUpdate = true;

    // Create index attribute
    console.log('Creating index attribute...');
    const indices = new Uint16Array([
      0, 2, 4,
      0, 4, 3,
      0, 3, 5,
      0, 5, 2,
      1, 2, 5,
      1, 5, 3,
      1, 3, 4,
      1, 4, 2
    ]);
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.index.needsUpdate = true;

    // Compute normals
    console.log('Computing vertex normals...');
    geometry.computeVertexNormals();
    geometry.attributes.normal.needsUpdate = true;

    // Compute bounding volumes
    console.log('Computing bounding volumes...');
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();

    console.log('Geometry attributes:', geometry.attributes);

    console.log('Getting material...');
    material = materials.cubeShader;
    if (!material) {
      throw new Error('Failed to get material');
    }
    console.log('Material:', material);

    console.log('Creating mesh...');
    cub = new THREE.Mesh(geometry, material);
    if (!cub) {
      throw new Error('Failed to create mesh');
    }
    console.log('Mesh created:', cub);
    
    console.log('Setting position...');
    cub.position.set(x, y, z);
    console.log('Position set');

    cub.name = "Octahedron";
    cub.userData.id = `Octahedron-${shapeCount[2]}`;
    cub.userData.selected = false;
    
    console.log('Adding to scene...');
    scene.add(cub);
    shapes.push(cub);
    console.log('Added to scene and shapes array');

    shapeList.push({
      id: cub.userData.id,
      x: parseInt(x, 10),
      y: parseInt(y, 10),
      z: parseInt(z, 10),
    });
    shapeCount[2]++;

    try {
      console.log('Creating edges...');
      const edgesGeometry = new THREE.EdgesGeometry(geometry);
      const edgesMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 2,
      });
      const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      cub.add(edges);
      console.log('Edges added');
    } catch (edgeError) {
      console.error('Error creating edges:', edgeError);
    }

    try {
      console.log('Creating vertices...');
      const positions = geometry.attributes.position;
      console.log('Position attribute found:', positions);
      
      // Create vertices at each position
      for (let i = 0; i < positions.count; i++) {
        const vertex = new THREE.Vector3();
        vertex.fromBufferAttribute(positions, i);
        
        // Create a small sphere at each vertex
        const sphereGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        
        // Position the sphere at the vertex
        sphere.position.copy(vertex);
        cub.add(sphere);
        
        // Add to points array
        point.push(sphere);
        
        if (i === 0) {
          shapeVertex.push(sphere);
        }
      }
      console.log('Vertices created');
    } catch (vertexError) {
      console.error('Error creating vertices:', vertexError);
      console.error('Geometry details:', {
        hasAttributes: geometry.attributes ? 'yes' : 'no',
        hasPosition: geometry.attributes && geometry.attributes.position ? 'yes' : 'no',
        geometryType: geometry.type,
        geometry: geometry
      });
    }

    dragX.push(x);
    dragY.push(y);
    dragZ.push(z);

    return cub;
  } catch (error) {
    console.error('Error creating octahedron:', error);
    console.error('Error details:', {
      geometry: geometry ? 'created' : 'failed',
      material: material ? 'created' : 'failed',
      cub: cub ? 'created' : 'failed',
      scene: scene ? 'valid' : 'invalid',
      shapes: shapes ? 'valid' : 'invalid'
    });
    return null;
  }
};

export const createTetrahedron = function (
  x,
  y,
  z,
  shapes,
  shapeList,
  shapeCount,
  scene,
  point,
  shapeVertex,
  dragX,
  dragY,
  dragZ
) {
  // Debug check for input parameters
  if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
    console.error('Invalid position coordinates:', { x, y, z });
    return null;
  }
  if (!Array.isArray(shapes) || !Array.isArray(shapeList) || !Array.isArray(shapeCount)) {
    console.error('Invalid array parameters:', { shapes, shapeList, shapeCount });
    return null;
  }
  if (!scene || !Array.isArray(point) || !Array.isArray(shapeVertex)) {
    console.error('Invalid scene or array parameters:', { scene, point, shapeVertex });
    return null;
  }
  if (!Array.isArray(dragX) || !Array.isArray(dragY) || !Array.isArray(dragZ)) {
    console.error('Invalid drag arrays:', { dragX, dragY, dragZ });
    return null;
  }

  let geometry, material, cub;

  try {
    console.log('Creating tetrahedron geometry...');
    // Create a BufferGeometry
    geometry = new THREE.BufferGeometry();
    if (!geometry) {
      throw new Error('Failed to create geometry');
    }
    console.log('Geometry created:', geometry);

    // Create position attribute
    console.log('Creating position attribute...');
    const positions = new Float32Array([
      1, 1, 1,
      -1, -1, 1,
      -1, 1, -1,
      1, -1, -1
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.attributes.position.needsUpdate = true;

    // Create index attribute
    console.log('Creating index attribute...');
    const indices = new Uint16Array([
      0, 1, 2,
      0, 2, 3,
      0, 3, 1,
      1, 3, 2
    ]);
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.index.needsUpdate = true;

    // Compute normals
    console.log('Computing vertex normals...');
    geometry.computeVertexNormals();
    geometry.attributes.normal.needsUpdate = true;

    // Compute bounding volumes
    console.log('Computing bounding volumes...');
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();

    console.log('Geometry attributes:', geometry.attributes);

    console.log('Getting material...');
    material = materials.cubeShader;
    if (!material) {
      throw new Error('Failed to get material');
    }
    console.log('Material:', material);

    console.log('Creating mesh...');
    cub = new THREE.Mesh(geometry, material);
    if (!cub) {
      throw new Error('Failed to create mesh');
    }
    console.log('Mesh created:', cub);
    
    console.log('Setting position...');
    cub.position.set(x, y, z);
    console.log('Position set');

    cub.name = "Tetrahedron";
    cub.userData.id = `Tetrahedron-${shapeCount[3]}`;
    cub.userData.selected = false;
    
    console.log('Adding to scene...');
    scene.add(cub);
    shapes.push(cub);
    console.log('Added to scene and shapes array');

    shapeList.push({
      id: cub.userData.id,
      x: parseInt(x, 10),
      y: parseInt(y, 10),
      z: parseInt(z, 10),
    });
    shapeCount[3]++;

    try {
      console.log('Creating edges...');
      const edgesGeometry = new THREE.EdgesGeometry(geometry);
      const edgesMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 2,
      });
      const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      cub.add(edges);
      console.log('Edges added');
    } catch (edgeError) {
      console.error('Error creating edges:', edgeError);
    }

    try {
      console.log('Creating vertices...');
      const positions = geometry.attributes.position;
      console.log('Position attribute found:', positions);
      
      // Create vertices at each position
      for (let i = 0; i < positions.count; i++) {
        const vertex = new THREE.Vector3();
        vertex.fromBufferAttribute(positions, i);
        
        // Create a small sphere at each vertex
        const sphereGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        
        // Position the sphere at the vertex
        sphere.position.copy(vertex);
        cub.add(sphere);
        
        // Add to points array
        point.push(sphere);
        
        if (i === 0) {
          shapeVertex.push(sphere);
        }
      }
      console.log('Vertices created');
    } catch (vertexError) {
      console.error('Error creating vertices:', vertexError);
      console.error('Geometry details:', {
        hasAttributes: geometry.attributes ? 'yes' : 'no',
        hasPosition: geometry.attributes && geometry.attributes.position ? 'yes' : 'no',
        geometryType: geometry.type,
        geometry: geometry
      });
    }

    dragX.push(x);
    dragY.push(y);
    dragZ.push(z);

    return cub;
  } catch (error) {
    console.error('Error creating tetrahedron:', error);
    console.error('Error details:', {
      geometry: geometry ? 'created' : 'failed',
      material: material ? 'created' : 'failed',
      cub: cub ? 'created' : 'failed',
      scene: scene ? 'valid' : 'invalid',
      shapes: shapes ? 'valid' : 'invalid'
    });
    return null;
  }
}; 