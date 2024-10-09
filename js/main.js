import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { gsap, ScrollTrigger, Draggable, MotionPathPlugin } from "gsap/all";
import GUI from 'lil-gui';
import { iridescenceIOR } from 'three/webgpu';

gsap.registerPlugin(ScrollTrigger, Draggable, MotionPathPlugin); 

const gui = new GUI;

// Crear el LoadingManager
const loadingManager = new THREE.LoadingManager();

loadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
    document.getElementById('loading-screen').style.display = 'flex';
};

loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
    const progress = (itemsLoaded / itemsTotal) * 100;
    document.getElementById('loading-bar-progress').style.width = progress + '%';
};

loadingManager.onLoad = function () {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.display = 'none';
    loadingScreen.remove();
};

loadingManager.onError = function (url) {
    console.error('Error al cargar ' + url);
};

const clock = new THREE.Clock();

const backgroundObject = {
    color: 0xfefefe,
};
const ambientLightObject = {
    color: 0xfefefe,
    intensity: 0.5,
}
const lightObject = {
    color: 0xfefefe,
    alternativeColor: 0xdde3e6,
    intensity: 1,
}

// Crear la escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(backgroundObject.color);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const windowHalfX = window.innerWidth / 2; // Usamos const porque este valor no cambiará
const windowHalfY = window.innerHeight / 2;
camera.position.z = 7;
// Crear un CubeCamera para las reflexiones
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
    format: THREE.RGBFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter
});
const cubeCamera = new THREE.CubeCamera(0.1, 10, cubeRenderTarget);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Raycaster para la detección del mouse
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Iluminación
const ambientLight = new THREE.AmbientLight(ambientLightObject.color, ambientLightObject.intensity);  // Luz ambiental
scene.add(ambientLight);

const pointLight = new THREE.PointLight(lightObject.color, lightObject.intensity);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

const pointLightOne = new THREE.PointLight(lightObject.alternativeColor, lightObject.intensity);
const pointLightTwo = new THREE.PointLight(lightObject.alternativeColor, lightObject.intensity);
const pointLightThree = new THREE.PointLight(lightObject.alternativeColor, lightObject.intensity);

const crystalSideMaterial = new THREE.MeshPhysicalMaterial({
    transparent: true,
    opacity: 0.5,
    transmission: 0,
    thickness: -1,
    roughness: 0,
    metalness: 1,
    anisotropy: 1,
    ior: 0,
    reflectivity: 0,
    iridescenceIOR: 0,
    sheen: 1, // Simular efectos de dispersión de luz
    sheenColor: new THREE.Color(lightObject.color), // Efecto prismático con un color inicial
    envMapIntensity: 1,
    side: THREE.DoubleSide,
}); 

const exrLoader = new EXRLoader(loadingManager);
exrLoader.load('hdr/shot-panoramic-composition-empty-interior-2.exr', function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    
    // Establecer la textura de entorno para la escena
    sceneOne.environment = texture;
    sceneOne.background = texture;

    // También puedes aplicarlo como un mapa de entorno en el cubo cristalino para reflejos
    crystalSideMaterial.envMap = texture;
    crystalSideMaterial.needsUpdate = true;
},
undefined,
function (error) {
    console.error('Error al cargar la textura EXR', error);
});

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});


// Escena
const sceneOne = new THREE.Scene();
sceneOne.background = new THREE.Color(backgroundObject.color);  // Fondo blanco
// Iluminación
pointLightOne.position.set(-5, 5, 5);
pointLightTwo.position.set(0, 5, 5);
pointLightThree.position.set(5, 5, 5);
sceneOne.add(ambientLight);
sceneOne.add(pointLightOne);
sceneOne.add(pointLightTwo);
sceneOne.add(pointLightThree);

// Geometría del cubo
const cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
const cube = new THREE.Mesh(cubeGeometry, crystalSideMaterial);
sceneOne.add(cube);

gui.add(cube.material, 'transparent');
gui.add(cube.material, 'opacity', 0, 1, 0.1);
gui.add(cube.material, 'transmission', 0, 1, 0.1);
gui.add(cube.material, 'thickness', -1, 1, 0.1);
gui.add(cube.material, 'roughness', 0, 1, 0.1);
gui.add(cube.material, 'metalness', 0, 1, 0.1);
gui.add(cube.material, 'anisotropy', -1, 1, 0.1);
gui.add(cube.material, 'ior', 1, 2.333, 0.001);
gui.add(cube.material, 'reflectivity', 0, 1, 0.1);
gui.add(cube.material, 'iridescenceIOR', 1, 2.333, 0.001);
gui.add(cube.material, 'sheen', 0, 1, 0.1);

gsap.to(cube.rotation, {
    scrollTrigger: {
      trigger: ".scroll-container",
      start: "top top",
      end: "bottom bottom",
      scrub: true
    },
    x: 6.28, // Rotate cube along X axis (one full rotation)
    y: 6.28, // Rotate cube along Y axis (one full rotation)
});

// ESCENA DOS
const sceneTwo = new THREE.Scene();
sceneTwo.background = new THREE.Color(backgroundObject.color);
// Iluminación
sceneTwo.add(ambientLight);
sceneTwo.add(pointLightOne);
sceneTwo.add(pointLightTwo);
sceneTwo.add(pointLightThree);


// Tamaño original del cubo y la esfera
const originalScalePercentage = 100;
const hoverScalePercentage = 25;
const originalScaleValue = 1;
const hoverScaleValue = originalScaleValue + ((originalScaleValue*hoverScalePercentage) / originalScalePercentage);
const originalScale = new THREE.Vector3(originalScaleValue, originalScaleValue, originalScaleValue);
const hoverScale = new THREE.Vector3(hoverScaleValue, hoverScaleValue, hoverScaleValue);
let targetScale = originalScale.clone(); // Inicialmente, el objetivo es el tamaño original
// Variables para la transición
let currentScene = sceneOne;  // Inicialmente mostrar sceneOne
let currentCamera = camera;
let transitionActive = false;
let transitionProgress = 0;
// Controles de la cámara
const controls = new OrbitControls(currentCamera, renderer.domElement);
controls.enableZoom = false;  
controls.enableDamping = true;  // Suaviza el movimiento
controls.dampingFactor = 0.1;
let cameraAnimationActive = false;
let cameraStartPosition = new THREE.Vector3();
let cameraEndPosition = new THREE.Vector3();
let cameraAnimationProgress = 0;
// MOUSE ACTION
let isMouseOverCube = false;
// Evento de mousemove para detectar la posición del mouse
function onMouseMove(event) {
    // Convertir las coordenadas del mouse a coordenadas normalizadas (-1 a 1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
// Agregar el evento de mousemove
window.addEventListener('mousemove', onMouseMove, false);
// Detectar el clic en el texto 'Start'
window.addEventListener('click', (event) => {
    // Convertir las coordenadas del mouse a coordenadas normalizadas (-1 a 1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Usar el raycaster para detectar la intersección con el texto en la sceneOne
    raycaster.setFromCamera(mouse, currentCamera);
    //const intersects = raycaster.intersectObject(textMesh);  // Asegúrate de referenciar correctamente el 'textMesh'

    // if (intersects.length > 0 && currentScene === sceneOne) {
    //     // Si el texto 'Start' es clicado en la sceneOne, iniciar la transición a sceneTwo
    //     transitionActive = true;
    //     transitionProgress = 0; // Reiniciar el progreso de la transición
        
    //     // Iniciar la animación de la cámara
    //     cameraAnimationActive = true;
    //     cameraAnimationProgress = 0;
    //     cameraStartPosition.copy(currentCamera.position);
    //     cameraEndPosition.copy(cube.position);
    //     cameraEndPosition.z += 2; // Ajustar para detenerse justo delante del cubo
    
    // }
});
// Función de easing para suavizar la transición
function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
// Listen for mouse movement
let target = new THREE.Vector3();
let mouseX = 0, mouseY = 0; // Usamos let porque los valores se actualizarán
let speed = 0.02; // 0.02
document.addEventListener('mousemove', onDocumentMouseMove, false);
function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) / windowHalfX;
    mouseY = (event.clientY - windowHalfY) / windowHalfY;
}

let isMousePressed = false;
let previousMouseX = 0;
let previousMouseY = 0;
// Evento de mousedown para detectar cuando el mouse se presiona
window.addEventListener('mousedown', (event) => {
    isMousePressed = true;
    controls.enabled = false;  // Desactivar los controles de la cámara
    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
});
// Evento de mouseup para detectar cuando el mouse se suelta
window.addEventListener('mouseup', () => {
    isMousePressed = false;
    controls.enabled = true;  // Reactivar los controles de la cámara
});
// Evento de mousemove para rotar el cubo al mover el mouse mientras está presionado
window.addEventListener('mousemove', (event) => {
    if (isMousePressed) {
        const deltaX = event.clientX - previousMouseX;
        const deltaY = event.clientY - previousMouseY;

        // Ajustar la sensibilidad de la rotación
        const rotationSpeed = 0.005;
        
        // Aplicar la rotación del cubo
        cube.rotation.y += deltaX * rotationSpeed;
        cube.rotation.x += deltaY * rotationSpeed;

        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
    }
});


// Renderizado
function animate() {
    requestAnimationFrame(animate);

    // Actualizar controles
    controls.update();

    // Si estamos en sceneOne, realizar animaciones específicas
    if (currentScene === sceneOne) {
        // Actualizar la cámara cúbica para las reflexiones dinámicas
        cube.visible = false; // Evitar que el cubo se refleje a sí mismo
        cubeCamera.update(renderer, sceneOne);
        cube.visible = true;

        // Actualizar el raycaster
        raycaster.setFromCamera(mouse, currentCamera);

        // Detectar la intersección con el cubo
        const intersects = raycaster.intersectObject(cube);

        let factor = intersects.length > 0 ? 1 : 0;
        factor = easeInOut(factor);

        // Ajustar la escala del cubo y la esfera
        const sphereScaleFactor = 0.9;
        
        cube.scale.lerp(targetScale, 0.1);
        

        // Rotación del cubo
        if (factor === 1) {
            const mousePos = new THREE.Vector3(mouse.x, mouse.y, 0).unproject(currentCamera);
            const direction = mousePos.sub(cube.position).normalize();

            const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
            cube.quaternion.slerp(targetQuaternion, 0.1);
        } else {
            // cube.rotation.x = rotationAmplitudeX * Math.sin(Date.now() * rotationSpeedX);
            // cube.rotation.y = rotationAmplitudeY * Math.sin(Date.now() * rotationSpeedY);
            // cube.rotation.z = rotationAmplitudeZ * Math.sin(Date.now() * rotationSpeedZ);

            // cube.rotation.x += (originalRotation.x - cube.rotation.x) * easingFactor;
            // cube.rotation.y += (originalRotation.y - cube.rotation.y) * easingFactor;
            // cube.rotation.z += (originalRotation.z - cube.rotation.z) * easingFactor;
        }

        // Rotación de la esfera
        //sphere.rotation.y += 0.01;

        
        // Animación de la cámara hacia adelante
        if (cameraAnimationActive) {
            // *** Modificación ***
            // Rotar el cubo continuamente alrededor del eje Y
            cube.rotation.y += 0.1; // Ajusta la velocidad de rotación según tus preferencias

            cameraAnimationProgress += 0.02; // Ajustar la velocidad de la animación

            // Interpolación suave de la posición de la cámara
            currentCamera.position.lerpVectors(
                cameraStartPosition,
                cameraEndPosition,
                cameraAnimationProgress
            );

            // Efecto de desvanecimiento sincronizado con el movimiento de la cámara
            renderer.domElement.style.opacity = 1 - cameraAnimationProgress;

            // Actualizar el objetivo de los controles para mantener el enfoque en el cubo
            controls.target.lerp(cube.position, 0.1);

            // Cuando la animación esté completa, iniciar la transición
            if (cameraAnimationProgress >= 1) {
                cameraAnimationActive = false;
                // Iniciar la transición de escena
                transitionActive = true;
                transitionProgress = 0;
            }
        }
    }

    // Si la transición está activa, ejecutar la animación de la transición
    if (transitionActive) {
        transitionProgress += 0.02; // Ajustar la velocidad de la transición

        // Aquí podrías agregar efectos adicionales durante la transición
        // Efecto de desvanecimiento (fade out)
        renderer.domElement.style.opacity = 1 - transitionProgress;

        // Cuando la transición esté completa, cambiar de escena
        if (transitionProgress >= 1) {
            transitionActive = false;
            loadNewScene();
        }
    }
    renderer.render(currentScene, currentCamera);
}

animate();

// Girar el cubo suavemente
function rotateCube(direction) {
    const elapsedTime = clock.getElapsedTime();
    const rotationPI = elapsedTime * Math.PI * 2;

    const rotationAngle = Math.PI / 2; // Girar 90 grados
    const duration = 500; // Duración de la rotación en milisegundos
    const startRotation = cube.rotation.y;
    const endRotation = direction === 'next' ? startRotation + rotationAngle : startRotation - rotationAngle;

    let startTime = null;
    function rotate(time) {
        if (!startTime) startTime = time;
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        cube.rotation.y = startRotation + progress * (endRotation - startRotation); //rotationPI

        if (progress < 1) {
            requestAnimationFrame(rotate);
        }
    }
    requestAnimationFrame(rotate);
}