"use strict";
import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js";
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/controls/OrbitControls.js";
import { MOUSE } from "https://unpkg.com/three@0.128.0/build/three.module.js";
import {
  createCube,
  createDodecahedron,
  createOctahedron,
  createTetrahedron,
} from "./shapes.js";
import { dot } from "./point.js";

const moveButton = document.getElementById("move-button");
const modalbutton1 = document.querySelector(".edit-button");
const modalbutton2 = document.querySelector(".add-button");
let lockVertices = document.getElementById("lock-vertices-cb");
let lockZoom = document.getElementById("lock-zoom-cb");
let lockRotate = document.getElementById("lock-rotate-cb");

let xyGrid = document.getElementById("xy-grid-cb");
let yzGrid = document.getElementById("yz-grid-cb");
let xzGrid = document.getElementById("xz-grid-cb");
let container = document.getElementById("canvas-main");
let modalAdd = document.getElementById("add-modal");
let modalEdit = document.getElementById("edit-modal");

var finalX = parseFloat(document.getElementById("finalx").value);
var finalY = parseFloat(document.getElementById("finaly").value);
var finalZ = parseFloat(document.getElementById("finalz").value);

let initial_pos = [0, 0, 0];
let spanEditModal = document.getElementsByClassName("close")[0];
let slider = document.getElementById("slider");
slider.addEventListener("input", movePoint);
slider.max = 1000;
slider.min = 0;
slider.step = 1;

let final_pos = [
  parseFloat(document.getElementById("finalx").value),
  parseFloat(document.getElementById("finaly").value),
  parseFloat(document.getElementById("finalz").value),
];

let trans_matrix = new THREE.Matrix4();
trans_matrix.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

let shapeCount = [0, 0, 0, 0];

let frames = 1000;
let scene,
  PI = 3.141592653589793,
  camera,
  renderer,
  orbit,
  shapes = [],
  xygrid = [],
  yzgrid = [],
  xzgrid = [],
  dragX = [],
  dragY = [],
  dragZ = [],
  lock = 0,
  dir = [],
  shapeList = [],
  arrowHelper = [],
  point = [],
  shapeVertex = [],
  size = 20,
  divisions = 20,
  mouse = new THREE.Vector2(),
  raycaster = new THREE.Raycaster(),
  plane = new THREE.Plane(),
  pNormal = new THREE.Vector3(0, 1, 0);
let addModal = document.getElementById("add-modal");
let spanAddModal = document.getElementsByClassName("close")[1];

spanAddModal.onclick = function () {
  addModal.style.display = "none";
};

// Lock checkbox handlers
lockVertices.addEventListener("click", updateMouseButtons);
lockZoom.addEventListener("click", updateMouseButtons);
lockRotate.addEventListener("click", updateMouseButtons);

function updateMouseButtons() {
  let leftMouse = MOUSE.PAN; // Default behavior (panning with left mouse)
  let middleMouse = MOUSE.DOLLY; // Default behavior (zooming with middle mouse)
  let rightMouse = MOUSE.ROTATE; // Default behavior (rotation with right mouse)

  // If lockVertices is checked, disable LEFT (no panning)
  if (lockVertices.checked) {
    leftMouse = null; // Disable left mouse button (no panning)
  }

  // If lockZoom is checked, prevent MIDDLE (no zooming)
  if (lockZoom.checked) {
    middleMouse = null; // Disable middle mouse button (no zooming)
    orbit.enableZoom = false; // Disable zoom functionality
  } else {
    orbit.enableZoom = true; // Enable zoom if lockZoom is unchecked
  }

  // If lockRotate is checked, disable RIGHT (no rotating)
  if (lockRotate.checked) {
    rightMouse = null; // Disable right mouse button (no rotating)
  }

  // Update the mouse buttons based on the checkbox states
  orbit.mouseButtons = {
    LEFT: leftMouse,
    MIDDLE: middleMouse,
    RIGHT: rightMouse,
  };

  // Ensure smooth damping and set target
  orbit.target.set(0, 0, 0);
  orbit.dampingFactor = 0.05;
  orbit.enableDamping = true;

  // Force an update on the controls
  orbit.update();
}

xyGrid.addEventListener("click", () => {
  if (xyGrid.checked) {
    let grid = new THREE.GridHelper(size, divisions);
    let vector3 = new THREE.Vector3(0, 1, 0);
    grid.lookAt(vector3);
    xygrid.push(grid);
    scene.add(xygrid[0]);
  } else {
    scene.remove(xygrid[0]);
    xygrid.pop();
  }
});
xzGrid.addEventListener("click", () => {
  if (xzGrid.checked) {
    let grid = new THREE.GridHelper(size, divisions);
    let vector3 = new THREE.Vector3(0, 0, 1);
    grid.lookAt(vector3);
    xzgrid.push(grid);
    scene.add(xzgrid[0]);
  } else {
    scene.remove(xzgrid[0]);
    xzgrid.pop();
  }
});
yzGrid.addEventListener("click", () => {
  if (yzGrid.checked) {
    let grid = new THREE.GridHelper(size, divisions);
    grid.geometry.rotateZ(PI / 2);
    yzgrid.push(grid);
    scene.add(yzgrid[0]);
  } else {
    scene.remove(yzgrid[0]);
    yzgrid.pop();
  }
});

function updateShapeList(shapeList) {
  const shapeListDiv = document.getElementById("shape-list");
  shapeListDiv.innerHTML = ""; // Clear previous list

  const ul = document.createElement("ul");

  shapeList.forEach((shape) => {
    const li = document.createElement("li");
    const isSelected = shapes.find(s => s.userData.id === shape.id)?.userData.selected;

    li.innerHTML = `
      <div class="shape-info">
        <span class="shape-id">${shape.id}</span>
        <span class="coordinates">(${shape.x.toFixed(2)}, ${shape.y.toFixed(2)}, ${shape.z.toFixed(2)})</span>
      </div>
      <div class="button-group">
        <button class="select-btn ${isSelected ? 'shape-selected' : ''}" data-name="${shape.id}">
          ${isSelected ? 'Selected' : 'Select'}
        </button>
      </div>
    `;
    ul.appendChild(li);
  });

  shapeListDiv.appendChild(ul);

  // Attach event listeners for Select buttons
  document.querySelectorAll(".select-btn").forEach((button) => {
    button.addEventListener("click", handleSelect, false);
  });
}

// Shape selection handler
function handleSelect(event) {
  const shapeId = event.target.dataset.name;
  const selectedShape = shapes.find(shape => shape.name === shapeId.split('-')[0] && shape.userData.id === shapeId);
  
  if (selectedShape) {
    // Deselect all shapes
    shapes.forEach(shape => {
      shape.userData.selected = false;
      if (shape.userData.outline) {
        shape.remove(shape.userData.outline);
        shape.userData.outline = null;
      }
    });

    // Select the clicked shape
    selectedShape.userData.selected = true;
    
    // Create outline based on shape type
    let outlineGeometry;
    switch(selectedShape.name) {
      case 'Cube':
        outlineGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        break;
      case 'Tetrahedron':
        outlineGeometry = new THREE.TetrahedronGeometry(1.2);
        break;
      case 'Octahedron':
        outlineGeometry = new THREE.OctahedronGeometry(1.2);
        break;
      case 'Dodecahedron':
        outlineGeometry = new THREE.DodecahedronGeometry(1.2);
        break;
      default:
        outlineGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    }
    
    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.5
    });
    
    const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
    selectedShape.add(outline);
    selectedShape.userData.outline = outline;

    // Update edit modal with shape's current position and type
    document.getElementById('x').value = selectedShape.position.x;
    document.getElementById('y').value = selectedShape.position.y;
    document.getElementById('z').value = selectedShape.position.z;
    document.getElementById('current-shape-type').textContent = selectedShape.name;

    // Update result coordinates display
    const resultCoords = document.getElementById('result-coordinates');
    if (resultCoords) {
      resultCoords.textContent = `Result: (${selectedShape.position.x.toFixed(2)}, ${selectedShape.position.y.toFixed(2)}, ${selectedShape.position.z.toFixed(2)})`;
    }

    // Update button state
    const selectBtn = event.target;
    selectBtn.classList.add('shape-selected');
    selectBtn.textContent = 'Selected';
  }
}

function handleDelete(shape, line, coordsArray) {
  // Remove the selected shape and line from the scene
  shapeList = shapeList.filter(
    (s) =>
      !(s.x == coordsArray[0] && s.y == coordsArray[1] && s.z == coordsArray[2])
  );

  shapes = shapes.filter(
    (s) =>
      !(
        s.position.x == coordsArray[0] &&
        s.position.y == coordsArray[1] &&
        s.position.z == coordsArray[2]
      )
  );
  scene.remove(line);
  scene.remove(shape);

  // Remove the shape from the shapeList based on coordinates

  updateShapeList(shapeList);
  console.log(`Shape deleted.`);
}

function handleEdit(shape, line, coordsArray) {
  const editModal = document.getElementById("edit-modal");
  editModal.style.display = "block";

  // Fill the modal fields with the current values of the shape
  const shapeTypeSelect = document.querySelector("select");
  document.getElementById("x").value = shape.position.x;
  document.getElementById("y").value = shape.position.y;
  document.getElementById("z").value = shape.position.z;
  shapeTypeSelect.value = shape.name; // Assuming shape.name holds the current shape type

  // Use a single event listener to handle edit confirmation
  const modalEditButton = document.querySelector(".edit-button");

  // Remove any previous listener to avoid duplication
  modalEditButton.removeEventListener("click", handleEditConfirmation);

  // Add the event listener
  modalEditButton.addEventListener("click", handleEditConfirmation);

  function handleEditConfirmation() {
    // Get new coordinates from the modal inputs
    const xcoord = parseFloat(document.getElementById("x").value);
    const ycoord = parseFloat(document.getElementById("y").value);
    const zcoord = parseFloat(document.getElementById("z").value);
    const shapeType = shapeTypeSelect.value;

    // Validate the new coordinates
    if (isNaN(xcoord) || isNaN(ycoord) || isNaN(zcoord)) {
      console.error("Invalid coordinate input");
      return;
    }

    // Remove the current shape and selection line from the scene
    scene.remove(line); // Remove selection line
    scene.remove(shape); // Remove the shape from the scene

    // Remove the current shape from shapeList
    shapeList = shapeList.filter(
      (s) =>
        !(
          s.x == coordsArray[0] &&
          s.y == coordsArray[1] &&
          s.z == coordsArray[2]
        )
    );

    shapes = shapes.filter(
      (s) =>
        !(
          s.position.x == coordsArray[0] &&
          s.position.y == coordsArray[1] &&
          s.position.z == coordsArray[2]
        )
    );

    // Create a new shape based on the selected type
    const createShape = {
      Cube: createCube,
      Tetrahedron: createTetrahedron,
      Octahedron: createOctahedron,
      Dodecahedron: createDodecahedron,
    }[shapeType];

    if (createShape) {
      createShape(
        xcoord,
        ycoord,
        zcoord,
        shapes,
        shapeList,
        shapeCount,
        scene,
        point,
        shapeVertex,
        dragX,
        dragY,
        dragZ
      );
    } else {
      console.error("Invalid shape type");
      return;
    }

    // Update shapeList and the UI
    noOfShapes++;
    updateShapeList(shapeList);

    // Close the modal after saving the shape
    editModal.style.display = "none";

    // After edit confirmation, remove the event listener to avoid duplication on next clicks
    modalEditButton.removeEventListener("click", handleEditConfirmation);
  }
}

let buttons = document.getElementsByTagName("button");

// Since each time the modal opened, a new listener was attached, the listener count grew.
// Even though each listener would only trigger once when clicked, multiple listeners meant that the shape-creation code was triggered multiple times, once for each listener.
// The Issue in Simple Terms:
// Each click on the "Add Shape" button opened the modal and added another listener to the "Confirm" button.
// So, if you opened the modal multiple times, multiple event listeners were stacked on top of each other.
// When you clicked the "Confirm" button, all those listeners were triggered, causing the shape to be added multiple times.
// Why Did the Shape Add Multiple Times?
// Each time you clicked the "Confirm" button inside the modal:

// If there were 3 listeners, it would run the shape creation code 3 times.
// Even though the listener itself triggers only once per click, multiple listeners were there, so the same action was executed multiple times.
document.getElementById("add-shape-btn").onclick = function () {
  addModal.style.display = "block";
};

// Shape add button handler
document.querySelector('.add-button').addEventListener('click', function() {
  const shapeType = document.getElementById('shape-add-dropdown').value;
  const x = parseFloat(document.getElementById('x1').value);
  const y = parseFloat(document.getElementById('y1').value);
  const z = parseFloat(document.getElementById('z1').value);

  // Validate coordinates
  if (isNaN(x) || isNaN(y) || isNaN(z)) {
    alert('Please enter valid numeric coordinates');
    return;
  }

  let shapeCreated = false;
  switch(shapeType) {
    case 'Cube':
      shapeCreated = createCube(x, y, z, shapes, shapeList, shapeCount, scene, point, shapeVertex, dragX, dragY, dragZ);
      break;
    case 'Octahedron':
      shapeCreated = createOctahedron(x, y, z, shapes, shapeList, shapeCount, scene, point, shapeVertex, dragX, dragY, dragZ);
      break;
    case 'Tetrahedron':
      shapeCreated = createTetrahedron(x, y, z, shapes, shapeList, shapeCount, scene, point, shapeVertex, dragX, dragY, dragZ);
      break;
  }

  if (shapeCreated) {
    updateShapeList(shapeList);
    addModal.style.display = "none";
  } else {
    alert('Failed to create shape. Please check the coordinates.');
  }
});

let planeIntersect = new THREE.Vector3();
let pIntersect = new THREE.Vector3();
let shift = new THREE.Vector3();
let isDragging = false;
let dragObject;
let dotList = [];
let noOfShapes = 0;

spanEditModal.onclick = function () {
  modalEdit.style.display = "none";
};

// Apply Translation function
function applyTranslation() {
  // Check if any shape is selected
  const selectedShape = shapes.find(shape => shape.userData.selected);
  if (!selectedShape) {
    alert('Select a shape first');
    return;
  }

  // Update transformation matrix
  trans_matrix.set(
    1, 0, 0, final_pos[0],
    0, 1, 0, final_pos[1],
    0, 0, 1, final_pos[2],
    0, 0, 0, 1
  );

  console.log('Translation Matrix Updated:');
  console.log('Translation Vector:', final_pos);
  console.log('Matrix Elements:', trans_matrix.elements);

  // Show the matrix display and result coordinates
  document.getElementById('matrix-display').style.display = 'block';
  document.getElementById('result-coordinates').style.display = 'block';

  // Update matrix input fields
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const element = document.getElementById(`matrix-${i}${j}`);
      if (element) {
        element.value = trans_matrix.elements[i * 4 + j].toFixed(2);
      }
    }
  }
}

// Add event listeners for Apply Scaling and Apply Translation buttons

document
  .getElementById("translation-form")
  .addEventListener("submit", applyTranslation);
  
let prev_x = 0;
let prev_y = 0;
let prev_z = 0;

function movePoint(e) {
  const sliderValue = parseFloat(e.target.value) / 1000;
  
  // Only move selected shapes
  shapes.forEach((shape, index) => {
    if (shape.userData.selected) {
      // Create a transformation matrix for the current translation
      const translationMatrix = new THREE.Matrix4();
      translationMatrix.set(
        1, 0, 0, final_pos[0] * sliderValue,
        0, 1, 0, final_pos[1] * sliderValue,
        0, 0, 1, final_pos[2] * sliderValue,
        0, 0, 0, 1
      );

      console.log('Current Slider Value:', sliderValue);
      console.log('Current Translation Matrix:', translationMatrix.elements);

      // Get the original position
      const originalPosition = new THREE.Vector3(dragX[index], dragY[index], dragZ[index]);
      console.log('Original Position:', originalPosition);
      
      // Create a position vector with homogeneous coordinates
      const positionVector = new THREE.Vector4(
        originalPosition.x,
        originalPosition.y,
        originalPosition.z,
        1
      );

      // Apply the transformation matrix
      positionVector.applyMatrix4(translationMatrix);
      console.log('Transformed Position:', positionVector);

      // Update shape position with the transformed coordinates
      shape.position.set(positionVector.x, positionVector.y, positionVector.z);
      
      // Update shape list
      shapeList[index].x = positionVector.x;
      shapeList[index].y = positionVector.y;
      shapeList[index].z = positionVector.z;

      // Update result coordinates display
      const resultCoords = document.getElementById('result-coordinates');
      if (resultCoords) {
        resultCoords.textContent = `Result: (${positionVector.x.toFixed(2)}, ${positionVector.y.toFixed(2)}, ${positionVector.z.toFixed(2)})`;
      }

      // Update matrix display with current transformation
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const element = document.getElementById(`matrix-${i}${j}`);
          if (element) {
            element.value = translationMatrix.elements[i * 4 + j].toFixed(2);
          }
        }
      }
    }
  });
  
  // Update shape list display
  updateShapeList(shapeList);
}

function createLabel(text, position) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 64;
  context.font = 'Bold 40px Arial';
  context.fillStyle = 'white';
  context.fillText(text, 0, 40);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(2, 0.5, 1);
  return sprite;
}

// Instructions toggle handlers
const toggleInstructions = document.getElementById("toggle-instructions");
const procedureMessage = document.getElementById("procedure-message");

// Function to show the instructions overlay
const showInstructions = () => {
  procedureMessage.style.display = "block";
};

// Function to hide the instructions overlay
const hideInstructions = (event) => {
  // Close if click is outside the overlay or if it's the toggle button again
  if (
    !procedureMessage.contains(event.target) &&
    event.target !== toggleInstructions
  ) {
    procedureMessage.style.display = "none";
  }
};

// Attach event listeners
toggleInstructions.addEventListener("click", (event) => {
  // Toggle the visibility of the overlay
  if (procedureMessage.style.display === "block") {
    procedureMessage.style.display = "none";
  } else {
    showInstructions();
  }
  event.stopPropagation(); // Prevent immediate closure after clicking the button
});

document.addEventListener("click", hideInstructions);

// Prevent closing the overlay when clicking inside it
procedureMessage.addEventListener("click", (event) => {
  event.stopPropagation(); // Prevent the click inside from closing the overlay
});

let init = function () {
  // Initialize arrays
  shapes = [];
  shapeList = [];
  point = [];
  shapeVertex = [];
  dragX = [];
  dragY = [];
  dragZ = [];
  arrowHelper = [];
  xygrid = [];
  yzgrid = [];
  xzgrid = [];
  dir = [];
  shapeCount = [0, 0, 0, 0];

scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);
  
camera = new THREE.PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight,
  1,
  1000
);
  camera.position.set(25, 25, 25);
  camera.lookAt(10, 10, 5);

  // Create grid helper but don't add it to scene by default
  const gridHelper = new THREE.GridHelper(size, divisions);
  // scene.add(gridHelper); // Commented out to hide grid by default

  // Initialize translation values
  final_pos = [3, 2, 1]; // Updated default values
  document.getElementById("finalx").value = final_pos[0];
  document.getElementById("finaly").value = final_pos[1];
  document.getElementById("finalz").value = final_pos[2];

  // Initialize transformation matrix with default values
  trans_matrix.set(
    1, 0, 0, final_pos[0],
    0, 1, 0, final_pos[1],
    0, 0, 1, final_pos[2],
    0, 0, 0, 1
  );

  dir = [
    new THREE.Vector3(1, 0, 0), // +X
    new THREE.Vector3(0, 1, 0), // +Y
    new THREE.Vector3(0, 0, 1), // +Z
    new THREE.Vector3(-1, 0, 0), // -X
    new THREE.Vector3(0, -1, 0), // -Y
    new THREE.Vector3(0, 0, -1), // -Z
  ];

  const labels = ["+X", "+Y", "+Z", "-X", "-Y", "-Z"];
  const origin = new THREE.Vector3(0, 0, 0);
  const length = 10;

  for (let i = 0; i < 6; i++) {
    let color;
    if (i === 0 || i === 3) {
      color = "red";
    } else if (i === 1 || i === 4) {
      color = "yellow";
    } else {
      color = "blue";
    }

    arrowHelper[i] = new THREE.ArrowHelper(dir[i], origin, length, color);
    scene.add(arrowHelper[i]);

    const labelPosition = dir[i].clone().multiplyScalar(length + 1);
    const label = createLabel(labels[i], labelPosition);
    scene.add(label);
  }

  // Create initial shapes with proper number conversion
  const cube = createCube(
    0,
    0,
    0,
    shapes,
    shapeList,
    shapeCount,
    scene,
    point,
    shapeVertex,
    dragX,
    dragY,
    dragZ
  );
  if (!cube) {
    console.error('Failed to create cube');
  }

  const tetrahedron = createTetrahedron(
    4,
    5,
    2,
    shapes,
    shapeList,
    shapeCount,
    scene,
    point,
    shapeVertex,
    dragX,
    dragY,
    dragZ
  );
  if (!tetrahedron) {
    console.error('Failed to create tetrahedron');
  }

  const octahedron = createOctahedron(
    7,
    5,
    -5,
    shapes,
    shapeList,
    shapeCount,
    scene,
    point,
    shapeVertex,
    dragX,
    dragY,
    dragZ
  );
  if (!octahedron) {
    console.error('Failed to create octahedron');
  }

  updateShapeList(shapeList);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  let w = container.offsetWidth;
  let h = container.offsetHeight;
  renderer.setSize(w, 0.83 * h);
  container.appendChild(renderer.domElement);

  orbit = new OrbitControls(camera, renderer.domElement);
  orbit.mouseButtons = {
    LEFT: MOUSE.PAN,
    MIDDLE: MOUSE.DOLLY,
    RIGHT: MOUSE.ROTATE,
  };
  orbit.target.set(0, 0, 0);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.05;
};

let mainLoop = function () {
  requestAnimationFrame(mainLoop);
  orbit.update();
  renderer.render(scene, camera);
};

init();
mainLoop();

// Add shape button click handler
window.addShape = function() {
  modalAdd.style.display = "block";
};

// Edit shape button click handler
window.editShape = function() {
  // Check if any shape is selected
  const selectedShape = shapes.find(shape => shape.userData.selected);
  if (!selectedShape) {
    alert('Select a shape first');
    return;
  }
  
  modalEdit.style.display = "block";
};

// Delete shape button click handler
window.deleteShape = function() {
  const selectedShape = shapes.find(shape => shape.userData.selected);
  if (selectedShape) {
    const index = shapes.indexOf(selectedShape);
    scene.remove(selectedShape);
    shapes.splice(index, 1);
    shapeList.splice(index, 1);
    updateShapeList(shapeList);
  }
};

// Translation form submit handler
document.getElementById('translation-form').addEventListener('submit', function(e) {
  e.preventDefault();
  final_pos = [
    parseFloat(document.getElementById("finalx").value),
    parseFloat(document.getElementById("finaly").value),
    parseFloat(document.getElementById("finalz").value)
  ];
  applyTranslation();
});

// Reset all button click handler
document.getElementById('reset-all-btn').addEventListener('click', function() {
  window.location.reload();
});

// Modal close button handlers
document.querySelectorAll('.close').forEach(button => {
  button.addEventListener('click', function() {
    modalAdd.style.display = "none";
    modalEdit.style.display = "none";
  });
});

// Close modals when clicking outside
window.addEventListener('click', function(event) {
  if (event.target === modalAdd) {
    modalAdd.style.display = "none";
  }
  if (event.target === modalEdit) {
    modalEdit.style.display = "none";
  }
});

// Shape edit button handler
document.querySelector('.edit-button').addEventListener('click', function() {
  const selectedShape = shapes.find(shape => shape.userData.selected);
  if (selectedShape) {
    const x = parseFloat(document.getElementById('x').value);
    const y = parseFloat(document.getElementById('y').value);
    const z = parseFloat(document.getElementById('z').value);

    selectedShape.position.set(x, y, z);
    const index = shapes.indexOf(selectedShape);
    shapeList[index].x = x;
    shapeList[index].y = y;
    shapeList[index].z = z;

    updateShapeList(shapeList);
    modalEdit.style.display = "none";
  }
});

// Window resize handler
window.addEventListener('resize', function() {
  const width = container.offsetWidth;
  const height = container.offsetHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, 0.83 * height);
});

// Matrix input field handlers
const matrixInputs = document.querySelectorAll('input[id^="matrix-"]');
matrixInputs.forEach(input => {
  input.addEventListener('change', function() {
    const [row, col] = this.id.split('-').slice(1).map(Number);
    const index = row * 4 + col;
    trans_matrix.elements[index] = parseFloat(this.value);
  });
});

// Translation vector input field handlers
const translationInputs = ['finalx', 'finaly', 'finalz'].map(id => document.getElementById(id));
translationInputs.forEach(input => {
  input.addEventListener('change', function() {
    const index = ['finalx', 'finaly', 'finalz'].indexOf(this.id);
    final_pos[index] = parseFloat(this.value);
    applyTranslation();
  });
});

// Update the grid event listeners to start unchecked
xyGrid.checked = false;
yzGrid.checked = false;
xzGrid.checked = false;
