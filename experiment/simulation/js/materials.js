"use strict";
import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js";

function vertexShader() {
    return `varying vec3 vUv; 
      
                  void main() {
                    vUv = position; 
      
                    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * modelViewPosition; 
                  }`;
}

function fragmentShader() {
    return `uniform vec3 colorA; 
                    uniform vec3 colorB; 
                    varying vec3 vUv;
      
                    void main() {
                  gl_FragColor = vec4(mix(colorA, colorB, vUv.z), 1.0);
                    }`;
}

export function createMaterials() {
    try {
        // Create a basic material with proper initialization
        const cubeShader = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });

        // Ensure the material is properly initialized
        cubeShader.needsUpdate = true;

        return {
            cubeShader,
        };
    } catch (error) {
        console.error('Error creating materials:', error);
        // Return a basic material as fallback
        const fallbackMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            side: THREE.DoubleSide
        });
        fallbackMaterial.needsUpdate = true;
        return {
            cubeShader: fallbackMaterial
        };
    }
}
