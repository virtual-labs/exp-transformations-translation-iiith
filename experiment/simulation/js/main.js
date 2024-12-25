"use strict";
import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js";
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/controls/OrbitControls.js";
import { MOUSE } from "https://unpkg.com/three@0.128.0/build/three.module.js";
import {
  createCube,
  createDodecahedron,
  createOctahedron,
  createTetrahedron,
} from "./js/shapes.js";
import { dot } from "./js/point.js";

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
let initial_pos = [3, 4, -2];
let spanEditModal = document.getElementsByClassName("close")[0];
let slider = document.getElementById("slider");
slider.addEventListener("input", movePoint);
document.getElementById("slider").max =
  document.getElementById("finalx").value - initial_pos[0];
document.getElementById("slider").min = 0;
slider.step =
  (document.getElementById("slider").max -
    document.getElementById("slider").min) /
  document.getElementById("frames").value;

let final_pos = [
  parseFloat(document.getElementById("finalx").value),
  parseFloat(document.getElementById("finaly").value),
  parseFloat(document.getElementById("finalz").value),
];

let trans_matrix = new THREE.Matrix4();
trans_matrix.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

let shapeCount = [0, 0, 0, 0];

let frames = document.getElementById("frames").value;
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
  dragz = [],
  lock = 0,
  dir = [],
  shapeList = [],
  arrowHelper = [];
let addModal = document.getElementById("add-modal");
let spanAddModal = document.getElementsByClassName("close")[1];

spanAddModal.onclick = function () {
  addModal.style.display = "none";
};

lockVertices.addEventListener("click", updateMouseButtons);
lockZoom.addEventListener("click", updateMouseButtons);
lockRotate.addEventListener("click", updateMouseButtons);

function updateMouseButtons() {
  let leftMouse = MOUSE.PAN; // Default behavior (panning with left mouse)
  let middleMouse = MOUSE.PAN; // Set middle mouse to MOUSE.PAN but it will do nothing
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
    // grid.lookAt(vector3);
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

    li.innerHTML = `
      <div class="shape-info">
        <span class="shape-id">${shape.id}</span>
        <span class="coordinates">(${shape.x}, ${shape.y}, ${shape.z})</span>
      </div>
      <div class="button-group">
        <button class="select-btn" 
                data-name="${shape.id}" 
                data-coordinates="${shape.x},${shape.y},${shape.z}">
          Select
        </button>
        
      </div>
    `;
    ul.appendChild(li);
  });

  shapeListDiv.appendChild(ul);

  // Attach event listeners for Select, Edit, and Delete buttons
  document.querySelectorAll(".select-btn").forEach((button) => {
    button.addEventListener("click", handleSelect, false);
  });

  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", handleEdit, false);
  });

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", handleDelete, false);
  });
}

function handleSelect(event) {
  const shapeName = event.target.getAttribute("data-name");
  const shapeCoordinates = event.target.getAttribute("data-coordinates");

  // Validate the selected shape data
  if (!shapeName || !shapeCoordinates) {
    console.error("Missing shape name or coordinates");
    return;
  }

  console.log(`Shape Selected: ${shapeName}`);
  console.log(`Coordinates: ${shapeCoordinates}`);

  // Safely parse coordinates
  let coordsArray;
  try {
    coordsArray = shapeCoordinates
      .replace(/[()]/g, "")
      .split(",")
      .map((coord) => parseFloat(coord.trim()));

    if (coordsArray.length !== 3 || coordsArray.some(isNaN)) {
      throw new Error("Invalid coordinate format");
    }
  } catch (error) {
    console.error("Error parsing coordinates:", error);
    return;
  }

  const shapePosition = new THREE.Vector3(
    coordsArray[0],
    coordsArray[1],
    coordsArray[2]
  );

  // Find the shape in the shapeList based on its coordinates
  const shape = shapes.find(
    (s) =>
      s.position.x == coordsArray[0] &&
      s.position.y == coordsArray[1] &&
      s.position.z == coordsArray[2]
  );

  if (!shape) {
    console.log("Shape not found in shapes.");
    return;
  }

  // Handle selection and deselection of shapes
  const existingLine = scene.getObjectByName("selection-line");

  if (existingLine && existingLine.position.equals(shapePosition)) {
    scene.remove(existingLine);
    console.log("Deselected the shape.");
    return;
  }

  // Remove existing selection line
  if (existingLine) {
    scene.remove(existingLine);
  }

  // Create a new selection line
  const geometry = new THREE.SphereGeometry(1, 32, 16);
  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );
  line.position.set(shapePosition.x, shapePosition.y, shapePosition.z);
  line.name = "selection-line"; // Add a name for easy identification
  scene.add(line);
  console.log("Selection line created at shape's position.");

  // Get delete and edit buttons
  const deleteButton = document.getElementById("delete-shape-btn");
  const editButton = document.getElementById("edit-shape-btn");

  // Clear previous event listeners before setting them again
  deleteButton.onclick = () => handleDelete(shape, line, coordsArray);
  editButton.onclick = () => handleEdit(shape, line, coordsArray);
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
        dragz
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
const size = 100; //during run time we can assign the size and divisions
const divisions = 25;

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

  // First, remove any existing event listener before adding a new one
  modalbutton2.removeEventListener("click", handleShapeAddition);

  // Add the event listener for the modal button
  modalbutton2.addEventListener("click", handleShapeAddition);
};

// Function to handle shape addition
function handleShapeAddition() {
  let xcoord = document.getElementById("x1").value;
  let ycoord = document.getElementById("y1").value;
  let zcoord = document.getElementById("z1").value;
  noOfShapes++;

  const shapeType = document.getElementById("shape-add-dropdown").value;

  if (shapeType === "Cube") {
    createCube(
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
      dragz
    );
  } else if (shapeType === "Tetrahedron") {
    createTetrahedron(
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
      dragz
    );
  } else if (shapeType === "Octahedron") {
    createOctahedron(
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
      dragz
    );
  } else if (shapeType === "Dodecahedron") {
    createDodecahedron(
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
      dragz
    );
  }
  updateShapeList(shapeList); // Update the UI
  addModal.style.display = "none";
}

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let plane = new THREE.Plane();
let pNormal = new THREE.Vector3(0, 1, 0);

let planeIntersect = new THREE.Vector3();
let pIntersect = new THREE.Vector3();
let shift = new THREE.Vector3();
let isDragging = false;
let dragObject;
let point = [];
let shapeVertex = [];
let dotList = [];
let noOfShapes = 0;

// function ondblclick(event) {
//   console.log("double click");
//   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
//   console.log(mouse.x, mouse.y);
//   console.log(camera.position);
//   console.log(shapes[0].position);
//   // Assuming `shapes` is an array of THREE.Mesh objects or any other THREE.Object3D derived objects
//   shapes.forEach((obj) => {
//     if (obj instanceof THREE.Object3D) {
//       obj.updateMatrixWorld();
//     }
//   });
//   raycaster.near = 0.1;
//   raycaster.far = 1000;

// // camera.lookAt([mouse.x, mouse.y, 0]);
// camera.updateMatrixWorld();
//   raycaster.setFromCamera(mouse, camera);
//   // Remove previous event listeners to prevent multiple bindings
//   //    document.getElementById("delete-shape-btn").onclick = null;
//   //    document.getElementById("edit-shape-btn").onclick = null;

//   let intersects = raycaster.intersectObjects(scene.children, false);
//   if (intersects.length > 0) {
//     console.log(intersects[0].point);
//   }

//   // Check if there's already a selection line
//   const existingLine = scene.getObjectByName("selection-line");

//   if (intersects.length > 0) {
//     // If a line already exists and it's at the same position, remove it (deselect)
//     if (
//       existingLine &&
//       existingLine.position.equals(intersects[0].object.position)
//     ) {
//       scene.remove(existingLine);
//       return;
//     }

//     // Remove any existing selection line first
//     if (existingLine) {
//       scene.remove(existingLine);
//     }

//     // Create new selection line
//     const geometry = new THREE.SphereGeometry(1, 32, 16);
//     const edges = new THREE.EdgesGeometry(geometry);
//     const line = new THREE.LineSegments(
//       edges,
//       new THREE.LineBasicMaterial({ color: 0xffffff })
//     );
//     line.position.set(
//       intersects[0].object.position.x,
//       intersects[0].object.position.y,
//       intersects[0].object.position.z
//     );
//     line.name = "selection-line"; // Add a name for easy identification
//     scene.add(line);

//     document.getElementById("delete-shape-btn").onclick = function () {
//       scene.remove(line);
//       for (let i = 0; i < intersects.length; i++) {
//         scene.remove(intersects[i].object);
//         noOfShapes--;
//       }
//     };

//     document.getElementById("edit-shape-btn").onclick = function () {
//       document.getElementById("edit-modal").style.display = "block";
//       document.querySelector(".edit-button").addEventListener("click", () => {
//         for (let i = 0; i < intersects.length; i++) {
//           scene.remove(intersects[i].object);
//           scene.remove(line);
//         }
//         let xcoord = document.getElementById("x").value;
//         let ycoord = document.getElementById("y").value;
//         let zcoord = document.getElementById("z").value;
//         noOfShapes++;
//         if (document.querySelector("select").value === "Cube") {
//           createCube(
//             xcoord,
//             ycoord,
//             zcoord,
//             shapes,
//             shapeList,
//             shapeCount,
//             scene,
//             point,
//             shapeVertex,
//             dragX,
//             dragY,
//             dragz
//           );
//         }
//         if (document.querySelector("select").value === "Tetrahedron") {
//           createTetrahedron(
//             xcoord,
//             ycoord,
//             zcoord,
//             shapes,
//             shapeList,
//             shapeCount,
//             scene,
//             point,
//             shapeVertex,
//             dragX,
//             dragY,
//             dragz
//           );
//         }
//         if (document.querySelector("select").value === "Octahedron") {
//           createOctahedron(
//             xcoord,
//             ycoord,
//             zcoord,
//             shapes,
//             shapeList,
//             shapeCount,
//             scene,
//             point,
//             shapeVertex,
//             dragX,
//             dragY,
//             dragz
//           );
//         }
//         if (document.querySelector("select").value === "Dodecahedron") {
//           createDodecahedron(
//             xcoord,
//             ycoord,
//             zcoord,
//             shapes,
//             shapeList,
//             shapeCount,
//             scene,
//             point,
//             shapeVertex,
//             dragX,
//             dragY,
//             dragz
//           );
//         }
//         document.getElementById("edit-modal").style.display = "none";
//       });
//     };
//   }
// }

spanEditModal.onclick = function () {
  modalEdit.style.display = "none";
};

// document.addEventListener("pointermove", (event) => {
//     const rect = renderer.domElement.getBoundingClientRect();
//     const x = event.clientX - rect.left;
//     const y = event.clientY - rect.top;

//     mouse.x = (x / container.clientWidth) * 2 - 1;
//     mouse.y = (y / container.clientHeight) * -2 + 1;
//     if (mouse.x < 1 && mouse.x > -1 && mouse.y < 1 && mouse.y > -1) {
//         raycaster.setFromCamera(mouse, camera);
//         if (isDragging && lock === 0) {
//             for (let i = 0; i < shapes.length; i++) {
//                 raycaster.ray.intersectPlane(plane, planeIntersect);
//                 shapes[i].geometry.vertices[0].set(
//                     planeIntersect.x + shift.x,
//                     planeIntersect.y + shift.y,
//                     planeIntersect.z + shift.z
//                 );
//                 shapes[i].geometry.verticesNeedUpdate = true;
//                 shapeVertex[i].position.set(
//                     planeIntersect.x + shift.x - dragX[i],
//                     planeIntersect.y + shift.y - dragY[i],
//                     planeIntersect.z + shift.z - dragz[i]
//                 );
//             }
//             raycaster.ray.intersectPlane(plane, planeIntersect);
//         } else if (isDragging) {
//             raycaster.ray.intersectPlane(plane, planeIntersect);
//         }
//     }
// });

// document.addEventListener("pointerdown", () => {
//     switch (event.which) {
//         case 1:
//             const rect = renderer.domElement.getBoundingClientRect();
//             const x = event.clientX - rect.left;
//             const y = event.clientY - rect.top;

//             mouse.x = (x / container.clientWidth) * 2 - 1;
//             mouse.y = (y / container.clientHeight) * -2 + 1;
//             pNormal.copy(camera.position).normalize();
//             plane.setFromNormalAndCoplanarPoint(pNormal, scene.position);
//             raycaster.setFromCamera(mouse, camera);
//             raycaster.ray.intersectPlane(plane, planeIntersect);
//             let position = new THREE.Vector3(
//                 shapeVertex
// [0].position.x,
//                 shapeVertex
// [0].position.y,
//                 shapeVertex
// [0].position.z
//             );
//             shift.subVectors(position, planeIntersect);
//             isDragging = true;
//             dragObject = shapes[shapes.length - 1];
//             break;
//     }
// });

// document.addEventListener("pointerup", () => {
//     isDragging = false;
//     dragObject = null;
// });

// moveButton.addEventListener("click", () => {
//     let x = parseFloat(document.getElementById("quantityx").value);
//     let y = parseFloat(document.getElementById("quantityy").value);
//     let z = parseFloat(document.getElementById("quantityz").value);
//     let translate_M = new THREE.Matrix4();
//     translate_M.makeTranslation(
//         x - dotList[0].geometry.getAttribute("position").array[0],
//         y - dotList[0].geometry.getAttribute("position").array[1],
//         z - dotList[0].geometry.getAttribute("position").array[2]
//     );
//     dotList[0].geometry.applyMatrix4(translate_M);
//     dotList[0].geometry.verticesNeedUpdate = true;
//     trans_matrix.multiply(translate_M);
//     initial_pos[0] = x;
//     initial_pos[1] = y;
//     initial_pos[2] = z;
// });

let prev_x = 0;
let prev_y = 0;
let prev_z = 0;

function movePoint(e) {
  var target = e.target || e.srcElement;

  // Get target values directly from input
  let tx = parseFloat(document.getElementById("finalx").value);
  let ty = parseFloat(document.getElementById("finaly").value);
  let tz = parseFloat(document.getElementById("finalz").value);

  // Calculate translation based on slider value
  let translationScale = target.value / target.max;
  let curr_x = tx * translationScale - prev_x;
  let curr_y = ty * translationScale - prev_y;
  let curr_z = tz * translationScale - prev_z;

  // Create translation matrix
  prev_x += curr_x;
  prev_y += curr_y;
  prev_z += curr_z;
  let translate_M = new THREE.Matrix4().makeTranslation(curr_x, curr_y, curr_z);

  // Apply translation to all shapes
  shapes.forEach((shape) => {
    shape.geometry.applyMatrix4(translate_M);

    // Update geometry attributes
    if (shape.geometry.isBufferGeometry) {
      shape.geometry.attributes.position.needsUpdate = true;
      shape.geometry.computeBoundingBox();
      shape.geometry.computeVertexNormals();
    }

    // Update edges
    shape.traverse((child) => {
      if (child.isLineSegments) {
        child.geometry.applyMatrix4(translate_M);
        if (child.geometry.isBufferGeometry) {
          child.geometry.attributes.position.needsUpdate = true;
        }
      }
    });
  });

  // Update dot
  // dotList[0].geometry.applyMatrix4(translate_M);
  // if (dotList[0].geometry.isBufferGeometry) {
  //   dotList[0].geometry.attributes.position.needsUpdate = true;
  // }

  trans_matrix.multiply(translate_M);

  // Reset transformation matrix if needed
  if (target.value <= 0) {
    trans_matrix.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }

  // Update UI elements with new position values
  // document.getElementById("quantityx").value =
  //   dotList[0].geometry.getAttribute("position").array[0];
  // document.getElementById("quantityy").value =
  //   dotList[0].geometry.getAttribute("position").array[1];
  // document.getElementById("quantityz").value =
  //   dotList[0].geometry.getAttribute("position").array[2];

  document.getElementById("matrix-00").value = trans_matrix.elements[0];
  document.getElementById("matrix-01").value = trans_matrix.elements[1];
  document.getElementById("matrix-02").value = trans_matrix.elements[2];
  document.getElementById("matrix-03").value = trans_matrix.elements[12];

  document.getElementById("matrix-10").value = trans_matrix.elements[4];
  document.getElementById("matrix-11").value = trans_matrix.elements[5];
  document.getElementById("matrix-12").value = trans_matrix.elements[6];
  document.getElementById("matrix-13").value = trans_matrix.elements[13];

  document.getElementById("matrix-20").value = trans_matrix.elements[8];
  document.getElementById("matrix-21").value = trans_matrix.elements[9];
  document.getElementById("matrix-22").value = trans_matrix.elements[10];
  document.getElementById("matrix-23").value = trans_matrix.elements[14];

  document.getElementById("matrix-30").value = trans_matrix.elements[3];
  document.getElementById("matrix-31").value = trans_matrix.elements[7];
  document.getElementById("matrix-32").value = trans_matrix.elements[11];
  document.getElementById("matrix-33").value = trans_matrix.elements[15];
}

document.getElementById("finalx").onchange = function () {
  let new_value = document.getElementById("finalx").value; // new value
  let old_position = dotList[0].geometry.getAttribute("position").array[0];
  let new_position =
    initial_pos[0] +
    ((old_position - initial_pos[0]) * (new_value - initial_pos[0])) /
      (final_pos[0] - initial_pos[0]);
  let translate_M = new THREE.Matrix4();
  translate_M.makeTranslation(new_position - old_position, 0, 0);
  dotList[0].geometry.applyMatrix4(translate_M);
  dotList[0].geometry.verticesNeedUpdate = true;

  document.getElementById("quantityx").value =
    dotList[0].geometry.getAttribute("position").array[0];
  final_pos[0] = new_value;
};

document.getElementById("finaly").onchange = function () {
  let new_value = document.getElementById("finaly").value; // new value
  let old_position = dotList[0].geometry.getAttribute("position").array[1];
  let new_position =
    initial_pos[1] +
    ((old_position - initial_pos[1]) * (new_value - initial_pos[1])) /
      (final_pos[1] - initial_pos[1]);

  let translate_M = new THREE.Matrix4();
  translate_M.makeTranslation(0, new_position - old_position, 0);
  dotList[0].geometry.applyMatrix4(translate_M);
  dotList[0].geometry.verticesNeedUpdate = true;

  document.getElementById("quantityy").value =
    dotList[0].geometry.getAttribute("position").array[1];
  final_pos[1] = new_value;
};

document.getElementById("finalz").onchange = function () {
  let new_value = document.getElementById("finalz").value; // new value
  let old_position = dotList[0].geometry.getAttribute("position").array[2];
  let new_position =
    initial_pos[2] +
    ((old_position - initial_pos[2]) * (new_value - initial_pos[2])) /
      (final_pos[2] - initial_pos[2]);

  let translate_M = new THREE.Matrix4();
  translate_M.makeTranslation(0, 0, new_position - old_position);
  dotList[0].geometry.applyMatrix4(translate_M);
  dotList[0].geometry.verticesNeedUpdate = true;

  document.getElementById("quantityz").value =
    dotList[0].geometry.getAttribute("position").array[2];
  final_pos[2] = new_value;
};

document.getElementById("frames").onchange = function () {
  let new_value = document.getElementById("frames").value; // new value
  let cur_pos = new Array();
  for (let i = 0; i < 3; i++) {
    cur_pos[i] = dotList[0].geometry.getAttribute("position").array[i];
  }

  document.getElementById("quantityx").value =
    initial_pos[0] +
    parseFloat(((cur_pos[0] - initial_pos[0]) * frames) / new_value);
  document.getElementById("quantityy").value =
    initial_pos[1] +
    parseFloat(((cur_pos[1] - initial_pos[1]) * frames) / new_value);
  document.getElementById("quantityz").value =
    initial_pos[2] +
    parseFloat(((cur_pos[2] - initial_pos[2]) * frames) / new_value);

  let translate_M = new THREE.Matrix4();
  translate_M.makeTranslation(
    document.getElementById("quantityx").value - cur_pos[0],
    document.getElementById("quantityy").value - cur_pos[1],
    document.getElementById("quantityz").value - cur_pos[2]
  );
  dotList[0].geometry.applyMatrix4(translate_M);
  dotList[0].geometry.verticesNeedUpdate = true;

  slider.step =
    (document.getElementById("slider").max -
      document.getElementById("slider").min) /
    document.getElementById("frames").value;
  let no_of_frames = frames * (slider.value / slider.max);
  slider.value =
    document.getElementById("slider").max * (no_of_frames / new_value);
  frames = new_value;
};










function createLabel(text, direction, length) {
  const fontLoader = new THREE.FontLoader();
  let labelMesh;

  fontLoader.load(
    "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
    function (font) {
      const geometry = new THREE.TextGeometry(text, {
        font: font,
        size: 0.6,
        height: 0.1,
      });
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      labelMesh = new THREE.Mesh(geometry, material);

      // Position the label at the end of the arrow (tip of the arrow)
      const labelPosition = direction.clone().multiplyScalar(length);
      labelMesh.position.copy(labelPosition);
      scene.add(labelMesh);
    }
  );

  return labelMesh;
}

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




scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);
camera = new THREE.PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight,
  1,
  1000
);
let init = function () {
  camera.position.set(25, 25, 25); // Set camera position behind and above the origin

  camera.lookAt(10, 10, 5); // Make the camera focus on the center (origin) of the scene

  // const light = new THREE.DirectionalLight(0xffffff, 3);
  // light.position.set(1, 1, 1).normalize();
  // scene.add(light);

  const gridHelper = new THREE.GridHelper(size, divisions);
  const count = 1;
  const arrowHelper = [];
  const dir = [
    new THREE.Vector3(1, 0, 0), // +X
    new THREE.Vector3(0, 1, 0), // +Y
    new THREE.Vector3(0, 0, 1), // +Z
    new THREE.Vector3(-1, 0, 0), // -X
    new THREE.Vector3(0, -1, 0), // -Y
    new THREE.Vector3(0, 0, -1), // -Z
  ];

  const labels = ["+X", "+Y", "+Z", "-X", "-Y", "-Z"]; // Labels for each axis
  const origin = new THREE.Vector3(0, 0, 0);
  const length = 10;

  // Loop through the axes
  for (let i = 0; i < 6; i++) {
    // Determine color based on the direction
    let color;
    if (i === 0 || i === 3) {
      color = "red"; // +X and -X axes
    } else if (i === 1 || i === 4) {
      color = "yellow"; // +Y and -Y axes
    } else {
      color = "blue"; // +Z and -Z axes
    }

    // Create the arrow helper for the current direction and color
    arrowHelper[i] = new THREE.ArrowHelper(dir[i], origin, length, color);
    scene.add(arrowHelper[i]);

    // Create label for each axis and position it at the tip of the arrow
    const label = createLabel(labels[i], dir[i], length);
    scene.add(label);
  }

  // Create 4 cubes at different positions
  createCube(
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
    dragz
  );

  createTetrahedron(
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
    dragz
  );

  // createDodecahedron(
  //   0,
  //   0,
  //   6,
  //   shapes,
  //   shapeList,
  //   shapeCount,
  //   scene,
  //   point,
  //   shapeVertex,
  //   dragX,
  //   dragY,
  //   dragz
  // );

  createOctahedron(
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
    dragz
  );
  updateShapeList(shapeList); // Update the UI

  // let PointGeometry = dot(scene, dotList, initial_pos);
  renderer = new THREE.WebGLRenderer();
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
};

let mainLoop = function () {
  orbit.update(); // Important for damping
  camera.updateMatrixWorld();
  renderer.render(scene, camera);
  requestAnimationFrame(mainLoop);
};
init();
mainLoop();
