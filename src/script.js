import './style.css'
import * as dat from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import fireFliesVertexShader from "./shaders/fire-flies/vertex.glsl"
import fireFliesFragmentShader from "./shaders/fire-flies/fragment.glsl"
import portalVertexShader from "./shaders/portal/vertex.glsl"
import portalFragmentShader from "./shaders/portal/fragment.glsl"
/**
 * Base
 */
// Debug
const gui = new dat.GUI({
    width: 400
})
const debugObj = {
    backgroundColor:"#132025"
}
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Object
 */
// Texture
const bakedTexture = textureLoader.load('/baked.jpg')
bakedTexture.flipY = false
bakedTexture.encoding = THREE.sRGBEncoding

// Materials
const bakedMaterial = new THREE.MeshBasicMaterial({map:bakedTexture})
const poleLightMaterial = new THREE.MeshBasicMaterial({color:'#0BEBFF'})
const portalLightMaterial = new THREE.ShaderMaterial({
    vertexShader:portalVertexShader,
    fragmentShader:portalFragmentShader,
    uniforms:{
        uTime:{value:0},
        uColorStart:{ value : new THREE.Color("#0ad8eb")},
        uColorEnd:{ value : new THREE.Color('white')}
    }
})
gui.addColor(portalLightMaterial.uniforms.uColorStart,'value').name('uColorStart')
gui.addColor(portalLightMaterial.uniforms.uColorEnd,'value').name('uColorEnd')
gltfLoader.load(
    '/portal.glb',
    (gltf) => {
        const bakedMesh = gltf.scene.children.find( child => child.name ==='baked')
        const poleLightAMesh = gltf.scene.children.find( child => child.name ==='poleLightA')
        const poleLightBMesh = gltf.scene.children.find( child => child.name ==='poleLightB')
        const portalLightMesh = gltf.scene.children.find( child => child.name === 'portalLight')
        bakedMesh.material = bakedMaterial
        poleLightAMesh.material = poleLightMaterial
        poleLightBMesh.material = poleLightMaterial
        portalLightMesh.material = portalLightMaterial
        scene.add(gltf.scene)
    }
)
//FireFlies
const fireFliesGeometry = new THREE.BufferGeometry()
const fireFliesCount = 30
const posArr = new Float32Array(fireFliesCount * 3)
const scaleArr = new Float32Array(fireFliesCount)
for(let i=0;i<fireFliesCount;i++){
    const i3 = i * 3
    posArr[i3] = (Math.random() - 0.5) * 4
    posArr[i3 + 1] = Math.random() * 1.5
    posArr[i3 + 2] = (Math.random() - 0.5) * 4
    scaleArr[ i ] = Math.random()
}
fireFliesGeometry.setAttribute('position',new THREE.BufferAttribute(posArr,3))
fireFliesGeometry.setAttribute('aScale',new THREE.BufferAttribute(scaleArr,1))
const fireFliesmaterial = new THREE.ShaderMaterial({
    uniforms:{
        uPixelRatio: { value : Math.min(window.devicePixelRatio,2)},
        uSize:{ value : 100 },
        uTime:{ value : 0},
    },
    blending:THREE.AdditiveBlending,
    depthWrite:false,
    transparent:true,
    vertexShader:fireFliesVertexShader,
    fragmentShader:fireFliesFragmentShader, 
})
gui.add(fireFliesmaterial.uniforms.uSize,'value').min(0).max(500).name('fireFliesSize')
const fireFlies = new THREE.Points(fireFliesGeometry,fireFliesmaterial)
scene.add(fireFlies)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    fireFlies.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})
/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.set(3.036323224191408,2.8161359802160995,5.203159900811368)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enabled = false
debugObj.stopControls = () => {
    controls.enabled = false
    console.log(camera.position)
}
gui.add(debugObj,'stopControls')
gui.hide()
/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding
renderer.setClearColor(debugObj.backgroundColor)
gui.addColor(debugObj,'backgroundColor').onChange(() => renderer.setClearColor(debugObj.backgroundColor))
/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    //Update time
    fireFliesmaterial.uniforms.uTime.value = elapsedTime
    portalLightMaterial.uniforms.uTime.value = elapsedTime
    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()