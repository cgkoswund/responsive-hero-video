import * as THREE from "three";
import gsap from "gsap";

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Objects
 */

//#region responsive plane

//video texture
const video = document.getElementById("video");
const videoTexture = new THREE.VideoTexture(video);
videoTexture.colorSpace = THREE.SRGBColorSpace;
video.addEventListener(
  "loadeddata",
  function () {
    onResize();
    video.play();
  },
  false
);

const responsivePlaneGeo = new THREE.PlaneGeometry(1, 1);
const responsivePlaneMat = new THREE.MeshBasicMaterial({
  color: "#d3d3d3", //darken a bit for clearer overlay (white)
  map: videoTexture,
});
const responsivePlaneMesh = new THREE.Mesh(
  responsivePlaneGeo,
  responsivePlaneMat
);
const responsivePlaneHinge = new THREE.Group();
responsivePlaneHinge.add(responsivePlaneMesh);
//#endregion

// Texture
const textureLoader = new THREE.TextureLoader();
const gradientTexture = textureLoader.load("textures/gradients/3.jpg");
gradientTexture.magFilter = THREE.NearestFilter;

// Material
const material = new THREE.MeshToonMaterial({
  color: "floralwhite",
  gradientMap: gradientTexture,
});

// Objects
const objectsDistance = 4;
const mesh1 = new THREE.Group();
// const mesh1 = new THREE.Mesh(new THREE.TorusGeometry(1, 0.4, 16, 60), material);
const mesh2 = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 32), material);
const mesh3 = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16),
  material
);

// mesh1.position.x = 2;
mesh2.position.x = -2;
mesh3.position.x = 2;

// mesh1.position.y = -objectsDistance * 0;
mesh2.position.y = -objectsDistance * 1;
mesh3.position.y = -objectsDistance * 2;

scene.add(/*mesh1,*/ mesh2, mesh3);

const sectionMeshes = [mesh1, mesh2, mesh3];

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 3);
directionalLight.position.set(1, 1, 0);
scene.add(directionalLight);

/**
 * Particles
 */
// Geometry
const particlesCount = 200;
const positions = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount; i++) {
  positions[i * 3 + 0] = (Math.random() - 0.5) * 10;
  positions[i * 3 + 1] =
    objectsDistance * 0.5 -
    Math.random() * objectsDistance * sectionMeshes.length;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);

// Material
const particlesMaterial = new THREE.PointsMaterial({
  color: "floralwhite",
  sizeAttenuation: true,
  size: 0.03,
});

// Points
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const onResize = () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  //#region plane resizing
  //update the plane
  const snugFitRatio = 1.892 * 2; //trial and error number to fit screen
  responsivePlaneMesh.scale.x = snugFitRatio * camera.aspect;
  responsivePlaneMesh.scale.y = snugFitRatio;

  //move parent to screen edge for edge "hinge" rotation
  responsivePlaneHinge.position.x = -snugFitRatio * camera.aspect * 0.5;
  responsivePlaneMesh.position.x = snugFitRatio * camera.aspect * 0.5;
  const textureAspect =
    videoTexture.image.videoWidth / videoTexture.image.videoHeight;

  //stretch video properly to match screen
  videoTexture.center.set(0.5, 0.5);
  const aspectMeta = textureAspect / camera.aspect;
  if (textureAspect <= camera.aspect) {
    videoTexture.repeat.x = 1;
    videoTexture.repeat.y = aspectMeta;
  } else {
    videoTexture.repeat.x = 1 / aspectMeta;
    videoTexture.repeat.y = 1;
  }
  videoTexture.needsUpdate = true;
  //#endregion

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
};

window.addEventListener("resize", onResize);

/**
 * Camera
 */
// Group
const cameraGroup = new THREE.Group();
scene.add(cameraGroup);

//#region add video to camera to exclude it from parallax effects
cameraGroup.add(responsivePlaneHinge);
//#endregion

// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.z = 6;
cameraGroup.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Scroll
 */
let scrollY = window.scrollY;
let currentSection = 0;
const content = document.body; //document.querySelector('section')
window.addEventListener("scroll", () => {
  scrollY = window.scrollY;
  responsivePlaneHinge.rotation.y = scrollY / 200;

  const newSection = Math.round(scrollY / sizes.height);

  if (newSection != currentSection) {
    currentSection = newSection;

    gsap.to(sectionMeshes[currentSection].rotation, {
      duration: 1.5,
      ease: "power2.inOut",
      x: "+=6",
      y: "+=3",
      z: "+=1.5",
    });
  }
});

/**
 * Cursor
 */
const cursor = {};
cursor.x = 0;
cursor.y = 0;

window.addEventListener("mousemove", (event) => {
  cursor.x = event.clientX / sizes.width - 0.5;
  cursor.y = event.clientY / sizes.height - 0.5;
});

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Animate camera
  camera.position.y = (-scrollY / sizes.height) * objectsDistance;

  const parallaxX = cursor.x * 0.5;
  const parallaxY = -cursor.y * 0.5;
  cameraGroup.position.x +=
    (parallaxX - cameraGroup.position.x) * 5 * deltaTime;
  cameraGroup.position.y +=
    (parallaxY - cameraGroup.position.y) * 5 * deltaTime;

  // Animate meshes
  for (const mesh of sectionMeshes) {
    mesh.rotation.x += deltaTime * 0.1;
    mesh.rotation.y += deltaTime * 0.12;
  }

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

onResize();
tick();
