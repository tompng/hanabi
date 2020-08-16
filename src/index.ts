import * as THREE from 'three'
import hanabiUtilChunk from './shaders/util.vert'
import baseParamsChunk from './shaders/base_params.vert'
import blinkParamsChunk from './shaders/blink_params.vert'
import blinkParticleChunk from './shaders/particle_params.vert'
import { CurveStar, generateCurveStarGeometry } from './CurveStar'
import { PointStar, generatePointStarGeometry } from './PointStar'
import { ParticleTailStar, ParticleSplashStar, generateParticleStarGeometry } from './ParticleStar'
import { evenSpherePoints } from './util'
import { generateStarBaseAttributes, ShaderBaseParams, ShaderStopParams, ShaderBeeParams, ShaderParticleParams } from './attributes'
import { Capturer } from './capture'
import { Land } from './Land'
import { Water } from './Water'

const land = new Land({min: -1, max: 1, step: 32},{min: -1, max: 1, step: 32},0,(x,y)=>0.4 * (1-x**2-y**2) + 0.2 * (1-x)*(1+x)*(1-y)*(1+y)*Math.random())
const landAttrs = land.generateGeometryAttributes()
const landGeometry = new THREE.BufferGeometry()
landGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(landAttrs.positions), 3))
landGeometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(landAttrs.normals), 3))
const mesh = new THREE.Mesh(
  landGeometry,
  // new THREE.MeshPhongMaterial({ color: 'white' })
  // new THREE.MeshBasicMaterial({ color: 'white', side: THREE.DoubleSide })
  new THREE.ShaderMaterial({
    vertexShader: 'varying vec3 norm;void main(){norm=normalize(normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1);}',
    fragmentShader: 'varying vec3 norm;void main(){gl_FragColor=vec4(vec3(0.05+0.05*dot(normalize(norm),vec3(-0.7,0,0.7))), 1);}',
    side: THREE.DoubleSide
  })
)
mesh.position.x = -1
mesh.position.y = -0.5
mesh.position.z = 0
const mesh2 = mesh.clone()
mesh2.position.x = 8
mesh2.position.y = 8
mesh.scale.x = mesh.scale.y = mesh.scale.z = 0.8
mesh2.scale.x = mesh2.scale.y = mesh2.scale.z = 8
// mesh.scale.x = mesh.scale.y = mesh.scale.z = 0.2

// land.show()

THREE.ShaderChunk['hanabi_util'] = hanabiUtilChunk
THREE.ShaderChunk['base_params'] = baseParamsChunk
THREE.ShaderChunk['blink_params'] = blinkParamsChunk
THREE.ShaderChunk['particle_params'] = blinkParticleChunk

const renderer = new THREE.WebGLRenderer()
renderer.autoClear = false
// renderer.debug.checkShaderErrors = true
const width = 800
const height = 600
renderer.setSize(width, height)
const scene = new THREE.Scene()
const groundScene = new THREE.Scene()
const water = new Water(width, height)
const waterScene = new THREE.Scene()
waterScene.add(water.mesh)
groundScene.add(mesh)
groundScene.add(mesh2)
const camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 32)
camera.up.set(0, 0, 1)
camera.position.x = 0
camera.position.y = -2.5
;(camera as any).lookatZ = 1
renderer.domElement.onmousemove = e => {
  const r = 2.5
  const th = e.offsetX / 100
  camera.position.x = -r * Math.sin(th)
  camera.position.y = -r * Math.cos(th)
  camera.lookAt(0, 0, (camera as any).lookatZ = 4 * (1 - e.offsetY / renderer.domElement.offsetWidth) - 2)
}

camera.position.z = 0.2
camera.lookAt(0, 0, 1)
const canvas = renderer.domElement
document.body.appendChild(canvas)

type Updatable = { update: (t: number) => void }

const updatables: Updatable[] = []
const capturer = new Capturer(renderer, 800, 600)
let capturing = false
let captureCanvases = [...new Array(4)].map(() => document.createElement('canvas'))
const button = document.createElement('button')
button.textContent = 'capture'
document.body.appendChild(button)
button.onclick = () => {
  if (capturing) return
  captureCanvases.forEach(c => {
    document.body.appendChild(c)
    c.style.width = '200px'
    c.getContext('2d')?.clearRect(0, 0, c.width, c.height)
  })
  capturing = true
  let n = 0
  const timer = setInterval(() => {
    n++
    const msecs = [100, 1000, 2000, 4000]
    const i = msecs.findIndex(v => n == (v / 100))
    if (i === -1) return
    const msec = msecs[i]
    capturer.capture(captureCanvases[i], 1.5 * Math.pow(msec / 1000, 0.2))
    if (i === 3) {
      clearInterval(timer)
      capturing = false
      capturer.reset()
    }
  }, 100)
}

function animate() {
  const time = performance.now() / 1000
  updatables.forEach(h => h.update(time / 4 % 1))
  const skyColor = new THREE.Color('#222')
  function resetClearColor() {
    renderer.setClearColor(new THREE.Color('black'))
    renderer.setClearAlpha(0)
  }
  function render() {
    water.update(time, camera)
    const target = renderer.getRenderTarget()
    renderer.setRenderTarget(water.skyTarget)
    renderer.setClearColor(skyColor)
    renderer.clearColor()
    renderer.clearDepth()
    renderer.render(scene, water.camera)
    renderer.setRenderTarget(water.groundTarget)
    resetClearColor()
    renderer.clearColor()
    renderer.clearDepth()
    renderer.render(groundScene, water.camera)
    renderer.setRenderTarget(target)
    renderer.setClearColor(skyColor)
    renderer.clearColor()
    resetClearColor()
    renderer.render(groundScene, camera)
    renderer.render(waterScene, camera)
    renderer.render(scene, camera)
  }
  if (capturing) {
    capturer.add(render)
    capturer.copy(capturer.input.texture, null)
  } else {
    render()
  }
  requestAnimationFrame(animate)
}

const direction = evenSpherePoints(3, 0.5)
const attributes = generateStarBaseAttributes(direction.length)
const baseParams: ShaderBaseParams = {
  center: new THREE.Vector3(0, 0, 2),
  baseVelocity: new THREE.Vector3(0, 0, 0),
  speed: 4,
  friction: 4,
  duration: 0.8,
  speedRandomness: 0.1,
  frictionRandomness: 0.4,
  burnRateRandomness: 0.4
}
const stopParams: ShaderStopParams = {
  time: 0.4
}
const beeParams: ShaderBeeParams = {
  start: 0.1,
  decay: 16.0,
  speed: 8.0,
  decayRandomness: 0.2,
  speedRandomness: 0.2
}
const particleTailParams: ShaderParticleParams = {
  speed: 0.5,
  friction: 32,
  duration: 0.1,
  durationRandomness: 0.5
}
const particleSplashParams: ShaderParticleParams = {
  speed: 0.4,
  friction: 8,
  duration: 0.15
}
const color1 = [new THREE.Color('#884'), new THREE.Color('#f84'), new THREE.Color('white')]
const color2 = new THREE.Color('#a66')
const color3 = [new THREE.Color('white'), new THREE.Color('#faa'), new THREE.Color('black')]

const curveGeom = generateCurveStarGeometry(direction, attributes)
const pointGeom = generatePointStarGeometry(direction, attributes)
const particleGeom = generateParticleStarGeometry(direction, attributes, 64)

const cstar = new CurveStar(curveGeom, { base: baseParams, bee: beeParams, stop: stopParams, widthStart: 0.02, color: color1, widthEnd: 0.005, curveDelay: 0.1 })
scene.add(cstar.mesh)
updatables.push(cstar)

const pstar = new PointStar(pointGeom, { base: baseParams, bee: beeParams, stop: stopParams, color: color1, size: 0.02 })
scene.add(pstar.mesh)
updatables.push(pstar)

const pstar2 = new PointStar(pointGeom, { base: { ...baseParams, friction: 6, burnRateRandomness: 0.1, speedRandomness: 0, frictionRandomness: 0, speed: 6, duration: 0.4 }, color: color3, lastFlash: { duration: 0.1, color: new THREE.Color('white'), size: 0.04 }, size: 0.02 })
scene.add(pstar2.mesh)
updatables.push(pstar2)

const tstar = new ParticleTailStar(particleGeom, { base: baseParams, bee: beeParams, stop: stopParams, particle: particleTailParams, size: 0.007, color: color2 })
scene.add(tstar.mesh)
updatables.push(tstar)

const sstar = new ParticleSplashStar(particleGeom, { base: baseParams, bee: beeParams, stop: stopParams, particle: particleSplashParams, size: 0.005, color: color3 })
scene.add(sstar.mesh)
updatables.push(sstar)

animate()
