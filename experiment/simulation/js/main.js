import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js";
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/controls/OrbitControls.js";
import { MOUSE } from "https://unpkg.com/three@0.128.0/build/three.module.js";
import {
    createCube,
    createDodecahedron,
    createOctahedron,
    createTetrahedron,
} from "./js/shapes.js";
import { Dot } from "./js/point.js";

const move_button = document.getElementById("move-button");
const modalbutton1 = document.querySelector(".buttonisprimary");
const modalbutton2 = document.querySelector(".buttonissecondary");
let lock_vertices = document.getElementById("lock-vertices-cb");
let xy_grid = document.getElementById("xy-grid-cb");
let yz_grid = document.getElementById("yz-grid-cb");
let xz_grid = document.getElementById("xz-grid-cb");
let container = document.getElementById("canvas-main");
let modal_add = document.getElementById("add-modal");
let modal_edit = document.getElementById("edit-modal");
let initial_pos = [3, 3, 3];
let span_edit_modal = document.getElementsByClassName("close")[0];
var slider = document.getElementById("slider");
slider.addEventListener("input", movePoint);
document.getElementById("slider").max =
    document.getElementById("finalx").value - initial_pos[0];
document.getElementById("slider").min = 0;
slider.step =
    (document.getElementById("slider").max -
        document.getElementById("slider").min) /
    document.getElementById("frames").value;

let final_pos = [
    document.getElementById("finalx").value,
    document.getElementById("finaly").value,
    document.getElementById("finalz").value,
];

let trans_matrix = new THREE.Matrix4();
trans_matrix.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);

let frames = document.getElementById("frames").value;
let deletebutton = document.getElementById("deletebutton");
let scene,
    camera,
    renderer,
    orbit,
    shapes = [],
    grid1 = [],
    grid2 = [],
    grid3 = [],
    dragx = [],
    dragy = [],
    dragz = [],
    lock = 0,
    dir = [],
    two_plane,
    two_geometry,
    first_time = 1,
    is_2D = 0,
    arrowHelper = [];

// Modal controls for Add Shape Button
let addModal = document.getElementById("add-modal");
let span_add_modal = document.getElementsByClassName("close")[1];

span_add_modal.onclick = function() {
    addModal.style.display = "none";
};


// Modal controls for Add Camera Button

// Section of Checkboxes
// --------------------------------------------------------------------------------------------------
// 2D

// lock vertices
lock_vertices.addEventListener("click", () => {
    if (lock_vertices.checked) {
        lock = 1;
        //console.log("hello");
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


// XY Grid
xy_grid.addEventListener("click", () => {
    if (xy_grid.checked) {
        var grid = new THREE.GridHelper(size, divisions);
        var vector3 = new THREE.Vector3(0, 0, 1);
        grid.lookAt(vector3);
        grid1.push(grid);
        scene.add(grid1[0]);
    } //
    else {
        scene.remove(grid1[0]);
        grid1.pop();
    }
});
// XZ Grid
xz_grid.addEventListener("click", () => {
    if (xz_grid.checked) {
        var grid = new THREE.GridHelper(size, divisions);
        grid.geometry.rotateZ(Math.PI / 2);
        grid3.push(grid);
        scene.add(grid3[0]);
    } else {
        scene.remove(grid3[0]);
        grid3.pop();
        //
    }
});
// YZ Grid
yz_grid.addEventListener("click", () => {
    if (yz_grid.checked) {
        var grid = new THREE.GridHelper(size, divisions);
        var vector3 = new THREE.Vector3(0, 1, 0);
        grid.lookAt(vector3);
        grid2.push(grid);
        scene.add(grid2[0]);
    } else {
        scene.remove(grid2[0]);
        grid2.pop();
        //
    }
});

// Section of Buttons
// --------------------------------------------------------------------------------------------------

let buttons = document.getElementsByTagName("button");
const size = 50;
const divisions = 25;
document.getElementById("add-shape-btn").onclick = function() {
    addModal.style.display = "block";
    modalbutton2.addEventListener("click", () => {
        let xcoord = document.getElementById("x1").value;
        let ycoord = document.getElementById("y1").value;
        let zcoord = document.getElementById("z1").value;
        // alert(document.getElementById("hi").value);
        no_of_shapes++;
        // console.log(document.getElementById("shape-add-dropdown").value);
        if (document.getElementById("shape-add-dropdown").value === "Cube") {
            createCube(
                xcoord,
                ycoord,
                zcoord,
                shapes,
                scene,
                point,
                shapevertex,
                dragx,
                dragy,
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
                shapevertex,
                dragx,
                dragy,
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
                shapevertex,
                dragx,
                dragy,
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
                shapevertex,
                dragx,
                dragy,
                dragz
            );
        }
        //  con = 1;
        addModal.style.display = "none";
    });
};

// Section of mouse control functions
// --------------------------------------------------------------------------------------------------

let raycaster = new THREE.Raycaster();
let raycaster1 = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let plane = new THREE.Plane();
let pNormal = new THREE.Vector3(0, 1, 0); // plane's normal

let planeIntersect = new THREE.Vector3(); // point of intersection with the plane
let pIntersect = new THREE.Vector3(); // point of intersection with an object (plane's point)
let shift = new THREE.Vector3(); // distance between position of an object and points of intersection with the object
let isDragging = false;
let dragObject;
let point = [];
let shapevertex = [];
let dot_list = [];
let no_of_shapes = 0;

document.addEventListener("dblclick", ondblclick, false);
// double click
function ondblclick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster1.setFromCamera(mouse, camera);
    let intersects = raycaster1.intersectObjects(shapes);
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
        document.getElementById("delete-shape-btn").onclick = function() {
            scene.remove(line);
            for (let i = 0; i < intersects.length; i++) {
                scene.remove(intersects[i].object);
                no_of_shapes--;
                // console.log(no_of_shapes);
            }
        };

        document.getElementById("edit-shape-btn").onclick = function() {
            document.getElementById("edit-modal").style.display = "block";
            document
                .querySelector(".buttonisprimary")
                .addEventListener("click", () => {
                    for (let i = 0; i < intersects.length; i++) {
                        scene.remove(intersects[i].object);
                        scene.remove(line);
                    }
                    var xcoord = document.getElementById("x").value;
                    var ycoord = document.getElementById("y").value;
                    var zcoord = document.getElementById("z").value;
                    // alert(document.querySelector("select").value);
                    no_of_shapes++;
                    if (document.querySelector("select").value === "Cube") {
                        createCube(
                            xcoord,
                            ycoord,
                            zcoord,
                            shapes,
                            scene,
                            point,
                            shapevertex,
                            dragx,
                            dragy,
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
                            shapevertex,
                            dragx,
                            dragy,
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
                            shapevertex,
                            dragx,
                            dragy,
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
                            shapevertex,
                            dragx,
                            dragy,
                            dragz
                        );
                    }
                    document.getElementById("edit-modal").style.display = "none";
                });
        };
    }
}

span_edit_modal.onclick = function() {
    modal_edit.style.display = "none";
};
// mouse drag

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
                shapevertex[i].position.set(
                    planeIntersect.x + shift.x - dragx[i],
                    planeIntersect.y + shift.y - dragy[i],
                    planeIntersect.z + shift.z - dragz[i]
                );
            }
            raycaster.ray.intersectPlane(plane, planeIntersect);
        } else if (isDragging) {
            raycaster.ray.intersectPlane(plane, planeIntersect);
        }
    }
});

// mouse click

document.addEventListener("pointerdown", () => {
    switch (event.which) {
        case 1:
            //  Left mouse button pressed
            const rect = renderer.domElement.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            mouse.x = (x / container.clientWidth) * 2 - 1;
            mouse.y = (y / container.clientHeight) * -2 + 1;
            pNormal.copy(camera.position).normalize();
            plane.setFromNormalAndCoplanarPoint(pNormal, scene.position);
            raycaster.setFromCamera(mouse, camera);
            raycaster.ray.intersectPlane(plane, planeIntersect);
            // shift.subVectors(dot_list[0].geometry.getAttribute('position').array, planeIntersect);
            let position = new THREE.Vector3(
                shapevertex[0].position.x,
                shapevertex[0].position.y,
                shapevertex[0].position.z
            );
            // position.x = shapevertex[0].position.x;
            // position.y = shapevertex[0].position.y;
            // position.z =  shapevertex[0].position.z;

            // console.log(position)
            shift.subVectors(position, planeIntersect);
            isDragging = true;
            dragObject = shapes[shapes.length - 1];
            break;
    }
});
// mouse release
document.addEventListener("pointerup", () => {
    isDragging = false;
    dragObject = null;
});

move_button.addEventListener("click", () => {
    let x = document.getElementById("quantityx").value;
    let y = document.getElementById("quantityy").value;
    let z = document.getElementById("quantityz").value;
    //console.log(dot_list[0].geometry.getAttribute('position').array[0]);
    // console.log(x, y, z);
    let translate_M = new THREE.Matrix4();
    translate_M.makeTranslation(
        x - dot_list[0].geometry.getAttribute("position").array[0],
        y - dot_list[0].geometry.getAttribute("position").array[1],
        z - dot_list[0].geometry.getAttribute("position").array[2]
    );
    // console.log(translate_M);
    dot_list[0].geometry.applyMatrix4(translate_M);
    dot_list[0].geometry.verticesNeedUpdate = true;
    trans_matrix.multiply(translate_M);
    initial_pos[0] = x;
    initial_pos[1] = y;
    initial_pos[2] = z;
    // console.log(dot_list[0].geometry.getAttribute('position').array[0], dot_list[0].geometry.getAttribute('position').array[1], dot_list[0].geometry.getAttribute('position').array[2]);
});

// Slider Implementation
// ---------------------------------------------------------------------------------------
function movePoint(e) {
    var target = e.target ? e.target : e.srcElement;

    let p = new THREE.Vector3(
        dot_list[0].geometry.getAttribute("position").array[0],
        dot_list[0].geometry.getAttribute("position").array[1],
        dot_list[0].geometry.getAttribute("position").array[2]
    );
    // console.log(p);
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
    // console.log(translate_M);
    dot_list[0].geometry.applyMatrix4(translate_M);
    dot_list[0].geometry.verticesNeedUpdate = true;
    // console.log(dot_list[0].geometry.getAttribute('position').array[0]);

    trans_matrix.multiply(translate_M);
    // console.log(tx,ty,tz);

    // if target.value is 0, then trans_matrix is identity
    if (target.value <= 0) {
        trans_matrix.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    }

    document.getElementById("quantityx").value =
        dot_list[0].geometry.getAttribute("position").array[0];
    document.getElementById("quantityy").value =
        dot_list[0].geometry.getAttribute("position").array[1];
    document.getElementById("quantityz").value =
        dot_list[0].geometry.getAttribute("position").array[2];

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

document.getElementById("finalx").onchange = function() {
    // let slider_value = document.getElementById("slider").value;
    // console.log(slider_value);
    let new_value = document.getElementById("finalx").value; // new value
    let old_position = dot_list[0].geometry.getAttribute("position").array[0];
    let new_position =
        initial_pos[0] +
        ((old_position - initial_pos[0]) * (new_value - initial_pos[0])) /
        (final_pos[0] - initial_pos[0]);
    let translate_M = new THREE.Matrix4();
    translate_M.makeTranslation(new_position - old_position, 0, 0);
    dot_list[0].geometry.applyMatrix4(translate_M);
    dot_list[0].geometry.verticesNeedUpdate = true;

    document.getElementById("quantityx").value =
        dot_list[0].geometry.getAttribute("position").array[0];
    final_pos[0] = new_value;
    // document.getElementById("slider").value = slider_value;
};
document.getElementById("finaly").onchange = function() {
    let new_value = document.getElementById("finaly").value; // new value
    let old_position = dot_list[0].geometry.getAttribute("position").array[1];
    let new_position =
        initial_pos[1] +
        ((old_position - initial_pos[1]) * (new_value - initial_pos[1])) /
        (final_pos[1] - initial_pos[1]);

    let translate_M = new THREE.Matrix4();
    translate_M.makeTranslation(0, new_position - old_position, 0);
    dot_list[0].geometry.applyMatrix4(translate_M);
    dot_list[0].geometry.verticesNeedUpdate = true;

    document.getElementById("quantityy").value =
        dot_list[0].geometry.getAttribute("position").array[1];
    final_pos[1] = new_value;
};
document.getElementById("finalz").onchange = function() {
    let new_value = document.getElementById("finalz").value; // new value
    let old_position = dot_list[0].geometry.getAttribute("position").array[2];
    let new_position =
        initial_pos[2] +
        ((old_position - initial_pos[2]) * (new_value - initial_pos[2])) /
        (final_pos[2] - initial_pos[2]);

    let translate_M = new THREE.Matrix4();
    translate_M.makeTranslation(0, 0, new_position - old_position);
    dot_list[0].geometry.applyMatrix4(translate_M);
    dot_list[0].geometry.verticesNeedUpdate = true;

    document.getElementById("quantityz").value =
        dot_list[0].geometry.getAttribute("position").array[2];
    final_pos[2] = new_value;
};
document.getElementById("frames").onchange = function() {
    let new_value = document.getElementById("frames").value; // new value
    let cur_pos = new Array();
    for (let i = 0; i < 3; i++) {
        cur_pos[i] = dot_list[0].geometry.getAttribute("position").array[i];
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
    dot_list[0].geometry.applyMatrix4(translate_M);
    dot_list[0].geometry.verticesNeedUpdate = true;

    slider.step =
        (document.getElementById("slider").max -
            document.getElementById("slider").min) /
        document.getElementById("frames").value;
    let no_of_frames = frames * (slider.value / slider.max);
    slider.value =
        document.getElementById("slider").max * (no_of_frames / new_value);
    //  document.getElementById("slider").value =  * (new_value/frames)
    frames = new_value;
};
// --------------------------------------------------------------------------------------------------

// Creating scene
scene = new THREE.Scene();
scene.background = new THREE.Color(0x121212);
camera = new THREE.PerspectiveCamera(
    30,
    window.innerWidth / window.innerHeight,
    1,
    1000
);

// Main Function
// --------------------------------------------------------------------------------------------------
let init = function() {
    camera.position.z = 5;
    camera.position.x = 2;
    camera.position.y = 2;
    const gridHelper = new THREE.GridHelper(size, divisions);
    const count = 1;
    dir[0] = new THREE.Vector3(1, 0, 0);
    dir[1] = new THREE.Vector3(0, 1, 0);
    dir[2] = new THREE.Vector3(0, 0, 1);
    dir[3] = new THREE.Vector3(-1, 0, 0);
    dir[4] = new THREE.Vector3(0, -1, 0);
    dir[5] = new THREE.Vector3(0, 0, -1);
    //dir1.normalize();
    const origin = new THREE.Vector3(0, 0, 0);
    const length = 10;
    arrowHelper[0] = new THREE.ArrowHelper(dir[0], origin, length, "red");
    arrowHelper[1] = new THREE.ArrowHelper(dir[1], origin, length, "yellow");
    arrowHelper[2] = new THREE.ArrowHelper(dir[2], origin, length, "blue");
    arrowHelper[3] = new THREE.ArrowHelper(dir[3], origin, length, "red");
    arrowHelper[4] = new THREE.ArrowHelper(dir[4], origin, length, "yellow");
    arrowHelper[5] = new THREE.ArrowHelper(dir[5], origin, length, "blue");
    for (let i = 0; i < 6; i++) {
        scene.add(arrowHelper[i]);
    }
    let PointGeometry = Dot(scene, dot_list, initial_pos);
    renderer = new THREE.WebGLRenderer();
    let w = container.offsetWidth;
    let h = container.offsetHeight;
    // console.log(w, h);
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
let mainLoop = function() {
    renderer.render(scene, camera);
    requestAnimationFrame(mainLoop);
};
init();
mainLoop();