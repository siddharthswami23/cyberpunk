import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader";
import GUI from 'lil-gui';
import gsap from 'gsap'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

camera.position.z = 4;

let canvas = document.querySelector("#canvas");

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true,alpha:true });

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

let model;
new RGBELoader().load("https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/rogland_moonlit_night_1k.hdr", (texture) => {
  const envMap = pmremGenerator.fromEquirectangular(texture).texture;
  scene.environment = envMap;
  // scene.background = envMap;
  texture.dispose();
  pmremGenerator.dispose();

  const loader = new GLTFLoader();
  loader.load(
    "./DamagedHelmet.gltf", // Replace with the path to your GLTF model
    function (gltf) {
      model = gltf.scene;
      scene.add(gltf.scene);
      model.scale.set(1.2, 1.4, 1); // Set initial scale for the model
      // // Add GUI controls for model
      // const gui = new GUI();
      // const modelFolder = gui.addFolder('Model');
      // modelFolder.add(model.scale, 'x', 0, 5).name('Width').listen();
      // modelFolder.add(model.scale, 'y', 0, 5).name('Height').listen();
      // modelFolder.add(model.scale, 'z', 0, 5).name('Scale').listen();
      // modelFolder.open();
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );
});

window.addEventListener("mousemove",(e)=>{
    const rotationX = (e.clientX/window.innerWidth - 0.5)* (Math.PI * 0.3);
    const rotationY = (e.clientY/window.innerHeight - 0.5)* (Math.PI * 0.3);
    // model.rotation.x = rotationY;
    // model.rotation.y = rotationX;
    gsap.to(model.rotation,{
      x:rotationY,
      y:rotationX,
      duration:0.5,
      ease:"power2.out"
    })
})

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth,window.innerHeight);
});

document.body.appendChild(renderer.domElement);

// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true; // Enable damping (inertia)
// controls.dampingFactor = 0.25; // Damping factor

// Post-processing setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.0015; // Adjust the amount of RGB shift
composer.addPass(rgbShiftPass);

function animate() {
  window.requestAnimationFrame(animate);
  // controls.update(); // Update controls
  composer.render(); // Use composer instead of renderer
}
animate();
