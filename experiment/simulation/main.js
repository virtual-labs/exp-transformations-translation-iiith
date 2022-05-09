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
let xyGrid = document.getElementById("xy-grid-cb");
let yzGrid = document.getElementById("yz-grid-cb");
let xzGrid = document.getElementById("xz-grid-cb");
let container = document.getElementById("canvas-main");
let modalAdd = document.getElementById("add-modal");
let modalEdit = document.getElementById("edit-modal");
let initial_pos = [3, 3, 3];
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
    
    arrowHelper = [];
let addModal = document.getElementById("add-modal");
let spanAddModal = document.getElementsByClassName("close")[1];

spanAddModal.onclick = function () {
    addModal.style.display = "none";
};
lockVertices.addEventListener("click", () => {
    if (lockVertices.checked) {
        lock = 1;  
        orbit.mouseButtons = {
            LEFT: MOUSE.PAN,
            MIDDLE: MOUSE.DOLLY,
            RIGHT: MOUSE.ROTATE,
        };
        orbit.target.set(0, 0, 0);
        orbit.dampingFactor = 0.05;
        orbit.enableDamping = true;
    } else {
        lock = 0;
        orbit.mouseButtons = {
            //  LEFT: MOUSE.PAN,
            MIDDLE: MOUSE.DOLLY,
            RIGHT: MOUSE.ROTATE,
        };
        orbit.target.set(0, 0, 0);
        orbit.dampingFactor = 0.05;
        orbit.enableDamping = true;
    }
});


xyGrid.addEventListener("click", () => {
    if (xyGrid.checked) {
        let grid = new THREE.GridHelper(size, divisions);
        let vector3 = new THREE.Vector3(0, 0, 1);
        grid.lookAt(vector3);
        xygrid.push(grid);
        scene.add(xygrid[0]);
    } 
    else {
        scene.remove(xygrid[0]);
        xygrid.pop();
    }
});
xzGrid.addEventListener("click", () => {
    if (xzGrid.checked) {
        let grid = new THREE.GridHelper(size, divisions);
        grid.geometry.rotateZ(PI / 2);
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
        let vector3 = new THREE.Vector3(0, 1, 0);
        grid.lookAt(vector3);
        yzgrid.push(grid);
        scene.add(yzgrid[0]);
    } else {
        scene.remove(yzgrid[0]);
        yzgrid.pop();
    }
});

let buttons = document.getElementsByTagName("button");
const size = 50;
const divisions = 25;
document.getElementById("add-shape-btn").onclick = function () {
    addModal.style.display = "block";
    modalbutton2.addEventListener("click", () => {
        let xcoord = document.getElementById("x1").value;
        let ycoord = document.getElementById("y1").value;
        let zcoord = document.getElementById("z1").value;
        noOfShapes++;
        if (document.getElementById("shape-add-dropdown").value === "Cube") {
            createCube(
                xcoord,
                ycoord,
                zcoord,
                shapes,
                scene,
                point,
                shapeVertex,
                dragX,
                dragY,
                dragz
            );
        }
        if (document.getElementById("shape-add-dropdown").value === "Tetrahedron") {
            createTetrahedron(
                xcoord,
                ycoord,
                zcoord,
                shapes,
                scene,
                point,
                shapeVertex,
                dragX,
                dragY,
                dragz
            );
        }
        if (document.getElementById("shape-add-dropdown").value === "Octahedron") {
            createOctahedron(
                xcoord,
                ycoord,
                zcoord,
                shapes,
                scene,
                point,
                shapeVertex,
                dragX,
                dragY,
                dragz
            );
        }
        if (
            document.getElementById("shape-add-dropdown").value === "Dodecahedron"
        ) {
            createDodecahedron(
                xcoord,
                ycoord,
                zcoord,
                shapes,
                scene,
                point,
                shapeVertex,
                dragX,
                dragY,
                dragz
            );
        }
        addModal.style.display = "none";
    });
};
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

document.addEventListener("dblclick", ondblclick, false);
// double click
function ondblclick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    let intersects = raycaster.intersectObjects(shapes);
    if (intersects.length > 0) {
        const geometry = new THREE.SphereGeometry(1, 32, 16);
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0xffffff })
        );
        line.position.set(
            intersects[0].object.position.x,
            intersects[0].object.position.y,
            intersects[0].object.position.z
        );
        scene.add(line);
        document.getElementById("delete-shape-btn").onclick = function () {
            scene.remove(line);
            for (let i = 0; i < intersects.length; i++) {
                scene.remove(intersects[i].object);
                noOfShapes--;
            }
        };

        document.getElementById("edit-shape-btn").onclick = function () {
            document.getElementById("edit-modal").style.display = "block";
            document
                .querySelector(".edit-button")
                .addEventListener("click", () => {
                    for (let i = 0; i < intersects.length; i++) {
                        scene.remove(intersects[i].object);
                        scene.remove(line);
                    }
                    let xcoord = document.getElementById("x").value;
                    let ycoord = document.getElementById("y").value;
                    let zcoord = document.getElementById("z").value;
                    noOfShapes++;
                    if (document.querySelector("select").value === "Cube") {
                        createCube(
                            xcoord,
                            ycoord,
                            zcoord,
                            shapes,
                            scene,
                            point,
                            shapeVertex,
                            dragX,
                            dragY,
                            dragz
                        );
                    }
                    if (document.querySelector("select").value === "Tetrahedron") {
                        createTetrahedron(
                            xcoord,
                            ycoord,
                            zcoord,
                            shapes,
                            scene,
                            point,
                            shapeVertex,
                            dragX,
                            dragY,
                            dragz
                        );
                    }
                    if (document.querySelector("select").value === "Octahedron") {
                        createOctahedron(
                            xcoord,
                            ycoord,
                            zcoord,
                            shapes,
                            scene,
                            point,
                            shapeVertex,
                            dragX,
                            dragY,
                            dragz
                        );
                    }
                    if (document.querySelector("select").value === "Dodecahedron") {
                        createDodecahedron(
                            xcoord,
                            ycoord,
                            zcoord,
                            shapes,
                            scene,
                            point,
                            shapeVertex,
                            dragX,
                            dragY,
                            dragz
                        );
                    }
                    document.getElementById("edit-modal").style.display = "none";
                });
        };
    }
}

spanEditModal.onclick = function () {
    modalEdit.style.display = "none";
};

document.addEventListener("pointermove", (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    mouse.x = (x / container.clientWidth) * 2 - 1;
    mouse.y = (y / container.clientHeight) * -2 + 1;
    if (mouse.x < 1 && mouse.x > -1 && mouse.y < 1 && mouse.y > -1) {
        raycaster.setFromCamera(mouse, camera);
        if (isDragging && lock === 0) {
            for (let i = 0; i < shapes.length; i++) {
                raycaster.ray.intersectPlane(plane, planeIntersect);
                shapes[i].geometry.vertices[0].set(
                    planeIntersect.x + shift.x,
                    planeIntersect.y + shift.y,
                    planeIntersect.z + shift.z
                );
                shapes[i].geometry.verticesNeedUpdate = true;
                shapeVertex[i].position.set(
                    planeIntersect.x + shift.x - dragX[i],
                    planeIntersect.y + shift.y - dragY[i],
                    planeIntersect.z + shift.z - dragz[i]
                );
            }
            raycaster.ray.intersectPlane(plane, planeIntersect);
        } else if (isDragging) {
            raycaster.ray.intersectPlane(plane, planeIntersect);
        }
    }
});


document.addEventListener("pointerdown", () => {
    switch (event.which) {
        case 1:
            const rect = renderer.domElement.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            mouse.x = (x / container.clientWidth) * 2 - 1;
            mouse.y = (y / container.clientHeight) * -2 + 1;
            pNormal.copy(camera.position).normalize();
            plane.setFromNormalAndCoplanarPoint(pNormal, scene.position);
            raycaster.setFromCamera(mouse, camera);
            raycaster.ray.intersectPlane(plane, planeIntersect);
            let position = new THREE.Vector3(
                shapeVertex
[0].position.x,
                shapeVertex
[0].position.y,
                shapeVertex
[0].position.z
            );
            shift.subVectors(position, planeIntersect);
            isDragging = true;
            dragObject = shapes[shapes.length - 1];
            break;
    }
});
document.addEventListener("pointerup", () => {
    isDragging = false;
    dragObject = null;
});
moveButton.addEventListener("click", () => {
    let x = parseFloat(document.getElementById("quantityx").value);
    let y = parseFloat(document.getElementById("quantityy").value);
    let z = parseFloat(document.getElementById("quantityz").value);
    let translate_M = new THREE.Matrix4();
    translate_M.makeTranslation(
        x - dotList[0].geometry.getAttribute("position").array[0],
        y - dotList[0].geometry.getAttribute("position").array[1],
        z - dotList[0].geometry.getAttribute("position").array[2]
    );
    dotList[0].geometry.applyMatrix4(translate_M);
    dotList[0].geometry.verticesNeedUpdate = true;
    trans_matrix.multiply(translate_M);
    initial_pos[0] = x;
    initial_pos[1] = y;
    initial_pos[2] = z;
});


function movePoint(e) {
    let target = e.target ? e.target : e.srcElement;

    let p = new THREE.Vector3(
        dotList[0].geometry.getAttribute("position").array[0],
        dotList[0].geometry.getAttribute("position").array[1],
        dotList[0].geometry.getAttribute("position").array[2]
    );
    let tx =
        initial_pos[0] +
        (target.value *
            (document.getElementById("finalx").value - initial_pos[0])) /
        target.max -
        p.x;
    let ty =
        initial_pos[1] +
        (target.value *
            (document.getElementById("finaly").value - initial_pos[1])) /
        target.max -
        p.y;
    let tz =
        initial_pos[2] +
        (target.value *
            (document.getElementById("finalz").value - initial_pos[2])) /
        target.max -
        p.z;

    let translate_M = new THREE.Matrix4();
    translate_M.makeTranslation(tx, ty, tz);
    dotList[0].geometry.applyMatrix4(translate_M);
    dotList[0].geometry.verticesNeedUpdate = true;
    trans_matrix.multiply(translate_M);
    if (target.value <= 0) {
        trans_matrix.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    }

    document.getElementById("quantityx").value =
        dotList[0].geometry.getAttribute("position").array[0];
    document.getElementById("quantityy").value =
        dotList[0].geometry.getAttribute("position").array[1];
    document.getElementById("quantityz").value =
        dotList[0].geometry.getAttribute("position").array[2];

    document.getElementById("matrix-00").value = trans_matrix.elements[0];
    document.getElementById("matrix-01").value = trans_matrix.elements[1];
    document.getElementById("matrix-02").value = trans_matrix.elements[2];
    document.getElementById("matrix-03").value = trans_matrix.elements[3];

    document.getElementById("matrix-10").value = trans_matrix.elements[4];
    document.getElementById("matrix-11").value = trans_matrix.elements[5];
    document.getElementById("matrix-12").value = trans_matrix.elements[6];
    document.getElementById("matrix-13").value = trans_matrix.elements[7];

    document.getElementById("matrix-20").value = trans_matrix.elements[8];
    document.getElementById("matrix-21").value = trans_matrix.elements[9];
    document.getElementById("matrix-22").value = trans_matrix.elements[10];
    document.getElementById("matrix-23").value = trans_matrix.elements[11];

    document.getElementById("matrix-30").value = trans_matrix.elements[12];
    document.getElementById("matrix-31").value = trans_matrix.elements[13];
    document.getElementById("matrix-32").value = trans_matrix.elements[14];
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
scene = new THREE.Scene();
scene.background = new THREE.Color(0x121212);
camera = new THREE.PerspectiveCamera(
    30,
    window.innerWidth / window.innerHeight,
    1,
    1000
);
let init = function () {
    camera.position.z = 5;
    camera.position.x = 2;
    camera.position.y = 2;
    const gridHelper = new THREE.GridHelper(size, divisions);
    const count = 1;
    let dir_x = new THREE.Vector3(1, 0, 0);
    let dir_y = new THREE.Vector3(0, 1, 0);
    let dir_z = new THREE.Vector3(0, 0, 1);
    let negdir_x = new THREE.Vector3(-1, 0, 0);
    let negdir_y = new THREE.Vector3(0, -1, 0);
    let negdir_z = new THREE.Vector3(0, 0, -1);

    const origin = new THREE.Vector3(0, 0, 0);
    const length = 10;
    arrowHelper[0] = new THREE.ArrowHelper(dir_x, origin, length, "red");
    arrowHelper[1] = new THREE.ArrowHelper(dir_y, origin, length, "yellow");
    arrowHelper[2] = new THREE.ArrowHelper(dir_z, origin, length, "blue");
    arrowHelper[3] = new THREE.ArrowHelper(negdir_x, origin, length, "red");
    arrowHelper[4] = new THREE.ArrowHelper(negdir_y, origin, length, "yellow");
    arrowHelper[5] = new THREE.ArrowHelper(negdir_z, origin, length, "blue");
    for (let i = 0; i < 6; i++) {
        scene.add(arrowHelper[i]);
    }
    let PointGeometry = dot(scene, dotList, initial_pos);
    renderer = new THREE.WebGLRenderer();
    let w = container.offsetWidth;
    let h = container.offsetHeight;
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);
    orbit = new OrbitControls(camera, renderer.domElement);
    orbit.mouseButtons = {
        MIDDLE: MOUSE.DOLLY,
        RIGHT: MOUSE.ROTATE,
    };
    orbit.target.set(0, 0, 0);
    orbit.enableDamping = true;
};
let mainLoop = function () {
    renderer.render(scene, camera);
    requestAnimationFrame(mainLoop);
};
init();
mainLoop();