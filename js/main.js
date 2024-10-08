import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { gsap, ScrollTrigger, Draggable, MotionPathPlugin } from "gsap/all";
import GUI from 'lil-gui';

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

// Crear la escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfefefe);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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
const ambientLight = new THREE.AmbientLight(0xfefefe, 0.5);  // Luz ambiental
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xfefefe, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

const pointLightOne = new THREE.PointLight(0xdde3e6, 1);
const pointLightTwo = new THREE.PointLight(0xdde3e6, 1);
const pointLightThree = new THREE.PointLight(0xdde3e6, 1);

const crystalSideMaterial = new THREE.MeshPhysicalMaterial({
    side: THREE.DoubleSide,
    backsideThickness:-1,
    thickness:-1,
    anisotropicBlur:0.02,
    metalness: 1,
    roughness: 0,
    envMapIntensity: 1,
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
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// Escena
const sceneOne = new THREE.Scene();
sceneOne.background = new THREE.Color(0xfefefe);  // Fondo blanco
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

gui.add(cube.material, 'thickness');
gui.add(cube.material, 'metalness');
gui.add(cube.material, 'roughness');


// ESCENA DOS
const sceneTwo = new THREE.Scene();
sceneTwo.background = new THREE.Color(0xfefefe);
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