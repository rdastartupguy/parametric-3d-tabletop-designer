import 'bootstrap';
import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

import generator from "blobshape";


import materialJson from "./material.json";


/**
 * Selects specific elements from the DOM using their IDs.
 * @constant {Element} Logo - The element with the ID 'logo'.
 * @constant {Element} sketchLogo - The element with the ID 'sketchLogo'.
 * @constant {Element} threeLogo - The element with the ID 'threeLogo'.
 * @constant {Element} complexitysliderImg - The element with the ID 'complexitysliderImg'.
 * @constant {Element} designsliderImg - The element with the ID 'designsliderImg'.
 * @constant {Element} randomsliderImg - The element with the ID 'randomsliderImg'.
 */
let Logo = document.querySelector('#logo');
let sketchLogo = document.querySelector('#sketchLogo');
let threeLogo = document.querySelector('#threeLogo');
let complexitysliderImg = document.querySelector('#complexitysliderImg');
let designsliderImg = document.querySelector('#designsliderImg');
let randomsliderImg = document.querySelector('#randomsliderImg');

let randomslider = document.getElementById('randomslider');

let complexityslider = document.getElementById('complexityslider');

/**
 * Set the 'src' attribute of the specified logo element to the provided image path.
 * @param {string} path - The path to the image file.
 * @returns None
 */
Logo.setAttribute("src", "./assets/logo.png");

sketchLogo.setAttribute("src", "./assets/sketch.png");
threeLogo.setAttribute("src", "./assets/three.png");
complexitysliderImg.setAttribute("src", "./assets/nodes.png");
designsliderImg.setAttribute("src", "./assets/clean.png");
randomsliderImg.setAttribute("src", "./assets/dice.png");

let settings = {
  size: 100, growth: 8, edges: 20, seed: 44060
}

let mapTextures = new Map();
let selectTextures;


let glbModel, pivot;

/**
 * Iterates over each material object in the "material" array of the materialJson object.
 * For each material object, it renders the materials and maps the texture ID to the rendered materials.
 * @param {Object} materialJson - The JSON object containing the materials.
 * @param {Map} mapTextures - The map to store the texture ID and rendered materials.
 * @returns None
 */
materialJson["material"].forEach((value) => {
  mapTextures.set(value.id, renderMaterials(value));
});



// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene();


const gltfLoader = new GLTFLoader();

loadGlbModel();

/**
 * Loads a GLB model using the GLTF loader.
 * @returns None
 */
function loadGlbModel() {
  gltfLoader.load(
    // resource URL
    './unilegs.glb',
    // called when the resource is loaded
    function (gltf) {
      glbModel = gltf.scene;
      glbModel.position.set(0, -7, 0)
      glbModel.castShadow = true;
      glbModel.traverse( function ( child ) {
        child.castShadow = true;
      } );
      scene.add(glbModel);
    },
    // called while loading is progressing
    function (xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    // called when loading has errors
    function (error) { }
  );
}

// instantiate a loader
const loader = new SVGLoader();

/**
 * Retrieves the 'Wood_Herringbone_Tiles_003_SD' texture from the mapTextures map.
 * @returns The texture associated with the key 'Wood_Herringbone_Tiles_003_SD'.
 */
selectTextures = mapTextures.get('Wood_Herringbone_Tiles_003_SD');



/**
 * Generates a 3D shape from an SVG path using Three.js library.
 * @param {Object} settings - The settings object for generating the shape.
 * @param {Function} generator - The generator function that creates the shape.
 * @param {Object} loader - The loader object for parsing the SVG data.
 * @param {Object} selectTextures - The textures to apply to the mesh.
 * @param {Object} scene - The Three.js scene to add the shape to.
 * @returns None
 */
async function loadSvgImage() {

  const { path, seedValue } = generator(settings);
  if (!settings.seed) {
    settings.seed = seedValue;
  }

  const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100%" id="blobSvg"><path d="${path}" fill="#00FF00"/></svg>`;



  const svgData = await loader.parse(svg);

  const paths = svgData.paths;
  const group = new THREE.Group();

  for (let i = 0; i < paths.length; i++) {

    const path = paths[i];



    const shapes = SVGLoader.createShapes(path);

    for (let j = 0; j < shapes.length; j++) {

      const shape = shapes[j];
      const geom = new THREE.ExtrudeGeometry(shape, {
        steps:1,
        depth: 1,
      });
      // const geometry = new THREE.ShapeGeometry( shape );
      const mesh = new THREE.Mesh(geom, selectTextures);
      mesh.castShadow = true;
      group.add(mesh);

    }

  }


  group.traverse((child) => {
    console.log(child)
    const bbox = new THREE.Box3().setFromObject(child);
    const vec = new THREE.Vector3();
    bbox.getCenter(vec);
    if (child.isMesh) {
      const material = child.material;
      child.position.set(vec.x, vec.y, vec.z);
      if (child.geometry) {
        child.geometry.translate(-vec.x, -vec.y, -vec.z);
      }

    } else {
      child.position.set(vec.x, vec.y, vec.z);
      child.traverse((child) => {
        if (child.isMesh) {
          child.geometry.translate(-vec.x, -vec.y, -vec.z);
        }
      });
      child.position.set(0, 0, 0);
    }
  });

  group.scale.set(0.8, 0.8, 0.8);
  group.rotation.set(1.57, 0, 0)
  pivot = new THREE.Group();
  pivot.name = "svgShape";
  pivot.position.set(0, 11, 0);
  pivot.add(group)
  pivot.castShadow = true;
  scene.add(pivot);


}

loadSvgImage();

/**
 * Renders materials for a 3D object using the provided textures.
 * @param {Object} textures - An object containing paths to different texture maps.
 * @returns {THREE.MeshStandardMaterial} - A material with the specified textures applied.
 */
function renderMaterials(textures) {
  let colormap = new THREE.TextureLoader().load(textures.colormap);
  colormap.wrapS = THREE.RepeatWrapping;
  colormap.wrapT = THREE.RepeatWrapping;
  colormap.repeat.set(textures.repeat, textures.repeat);
  
  let normalmap = new THREE.TextureLoader().load(textures.normalmap);
 
  let roughnessmap = new THREE.TextureLoader().load(textures.roughnessmap);
 
  let ambientmap = new THREE.TextureLoader().load(textures.ambientmap);

  return new THREE.MeshStandardMaterial({
    map: colormap,
    aoMap: ambientmap,
    normalMap: normalmap,
    roughnessMap: roughnessmap,
    side: THREE.DoubleSide
  })

}



texturesPickerClick();

/**
 * Handles the click event for selecting textures from a list and updating the material of the selected texture.
 * @returns None
 */
function texturesPickerClick() {
  let texturelist = document.querySelector("#texturelist");
  let textureList = materialJson['material'];
  texturelist.innerHTML = "";
  let i=0;
  textureList.forEach((value) => {
    let nodeli = document.createElement("li");
    nodeli.classList.add("colorclick");
    nodeli.id = "material_" + value.id;
    nodeli.setAttribute("data-id", value.id);
   
    let imgNode, textNode;

    if(i==0){
      nodeli.classList.add("active");
    }

    imgNode = document.createElement("img");
    imgNode.src = value.colormap;
    textNode = document.createElement("label");
    textNode.innerHTML = value.name;

    nodeli.appendChild(imgNode);
    nodeli.appendChild(textNode);
    texturelist.appendChild(nodeli);
    nodeli.removeEventListener("click", () => { });
    nodeli.addEventListener("click", function (e) {
      let parents = e.target.parentElement;
      let Did = parents.getAttribute("data-id");
      document.querySelectorAll(".colorclick").forEach((ele)=> {
        ele.classList.remove('active');
      });

      parents.classList.add('active');
    
     
      selectTextures = mapTextures.get(Did);

      pivot.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = true;
          object.material.dispose();
          object.material = selectTextures;
          object.material.needsUpdate = true;
        }

      });
    });
    i++;
  });
}



/**
 * Event listener for input changes on the random slider element.
 * Updates the growth setting based on the slider value, removes the pivot from the scene,
 * and reloads the SVG image.
 * @param {Event} event - The input event that triggered the listener.
 * @returns None
 */
randomslider.addEventListener('input', function (event) {
  settings.growth = parseInt(event.target.value);
  scene.remove(pivot);
  loadSvgImage();
});

complexityslider.addEventListener('input', function (event) {
  settings.edges = parseInt(event.target.value);
  scene.remove(pivot);
  loadSvgImage();
});



/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth * 0.6,
  height: window.innerHeight
}

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth * 0.6
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
/**
 * Creates a new Perspective Camera with the given parameters and adds it to the scene.
 * @param {number} 45 - The field of view in degrees.
 * @param {number} sizes.width / sizes.height - The aspect ratio.
 * @param {number} 0.1 - The near clipping plane.
 * @param {number} 10000 - The far clipping plane.
 * @returns None
 */
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 10000)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 150
scene.add(camera)

// Controls
/**
 * Initializes and configures OrbitControls for camera manipulation in a 3D scene.
 * @param {THREE.Camera} camera - The camera object to be controlled.
 * @param {HTMLCanvasElement} canvas - The canvas element for user input.
 * @returns {THREE.OrbitControls} The configured OrbitControls object.
 */
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.5;
controls.enableZoom = true;
controls.enableRotate = true;
controls.enablePan = false;
controls.minDistance = 50;
controls.maxDistance = 250;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas, alpha: true, antialias: true
});
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/* HDR */
/**
 * Loads an HDR environment map and sets it as the scene's environment.
 * @param {string} path - The path to the HDR environment map file.
 * @returns None
 */
function hdrimapLoader(path) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileCubemapShader();

  let rgbeloader = new RGBELoader();
  rgbeloader.load(path, (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
  });
}

hdrimapLoader("./hdr/brown_photostudio_01_1k.hdr");

/**
 * Animate
 */

const tick = () => {

  // Update Orbital Controls
  controls.update()

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()