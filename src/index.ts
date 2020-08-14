import * as THREE from 'three'
import hanabiUtilChunk from './shaders/util.vert'
import baseParamsChunk from './shaders/base_params.vert'
import blinkParamsChunk from './shaders/blink_params.vert'
import blinkParticleChunk from './shaders/particle_params.vert'
import starVertexShader from './shaders/star.vert'
import starFragmentShader from './shaders/star.frag'
import { CurveStar, generateCurveStarGeometry } from './CurveStar'
import { PointStar, generatePointStarGeometry } from './PointStar'
import { ParticleTailStar, ParticleSplashStar, generateParticleStarGeometry } from './ParticleStar'
import { N3D, sphereRandom, evenSpherePoints } from './util'
import { createRenderTarget, Smoother } from './smoother'
import { generateStarBaseAttributes, ShaderBaseParams, ShaderStopParams, ShaderBeeParams, ShaderParticleParams } from './attributes'
import { Capturer } from './capture'

THREE.ShaderChunk['hanabi_util'] = hanabiUtilChunk
THREE.ShaderChunk['base_params'] = baseParamsChunk
THREE.ShaderChunk['blink_params'] = blinkParamsChunk
THREE.ShaderChunk['particle_params'] = blinkParticleChunk

const renderer = new THREE.WebGLRenderer()
const width = 800
const height = 600
renderer.setSize(width, height)
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 32)
camera.up.set(0, 0, 1)
camera.position.x = 0
camera.position.y = -2
camera.position.z = 1.75
camera.lookAt(0, 0, 1.75)
const camera2 = camera.clone()
camera2.position.z *= -1
camera2.lookAt(0, 0, -1.75)
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
    capturer.capture(captureCanvases[i], 4 * Math.pow(msec / 1000, 0.4))
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
  function render() { renderer.render(scene, camera) }
  if (capturing) {
    capturer.add(render)
    capturer.copy(capturer.input.texture, null)
  } else {
    render()
  }
  requestAnimationFrame(animate)
}
function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
const geometries = [...Array(32)].map(() => generateGeometry(64))

class Star {
  points: THREE.Points
  uniforms = {
    time: { value: 0 },
    velocity: { value: new THREE.Vector3(0, 0, 0) }
  }
  constructor([vx, vy, vz]: N3D) {
    const shader = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    })
    const v = 0.98 + 0.04 * Math.random()
    this.uniforms.velocity.value.x = vx * v
    this.uniforms.velocity.value.y = vy * v
    this.uniforms.velocity.value.z = vz * v
    this.points = new THREE.Points(sample(geometries), shader)
  }
  update(time: number) {
    this.uniforms.time.value = time
  }
}

function generateGeometry(size: number) {
  const positions: number[] = []
  const randoms: number[] = []
  const geometry = new THREE.BufferGeometry()
  for (let i = 0; i < size; i++) {
    positions.push(...sphereRandom())
    randoms.push(...sphereRandom())
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('random', new THREE.BufferAttribute(new Float32Array(randoms), 3))
  return geometry
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
const color3 = [new THREE.Color('white'), new THREE.Color('#44f')]

const curveGeom = generateCurveStarGeometry(direction, attributes)
const pointGeom = generatePointStarGeometry(direction, attributes)
const particleGeom = generateParticleStarGeometry(direction, attributes, 64)

const cstar = new CurveStar(curveGeom, { base: baseParams, bee: beeParams, stop: stopParams, widthStart: 0.02, color: color1, widthEnd: 0.005, curveDelay: 0.1 })
scene.add(cstar.mesh)
updatables.push(cstar)

const pstar = new PointStar(pointGeom, { base: baseParams, bee: beeParams, stop: stopParams, color: color1 })
scene.add(pstar.mesh)
updatables.push(pstar)

const tstar = new ParticleTailStar(particleGeom, { base: baseParams, bee: beeParams, stop: stopParams, particle: particleTailParams, size: 0.007, color: color2 })
scene.add(tstar.mesh)
updatables.push(tstar)

const sstar = new ParticleSplashStar(particleGeom, { base: baseParams, bee: beeParams, stop: stopParams, particle: particleSplashParams, size: 0.005, color: color3 })
scene.add(sstar.mesh)
updatables.push(sstar)

const points = evenSpherePoints(5, 0.5)
points.forEach(p => {
  // const star = new Star(p)
  // updatables.push(star)
  // scene.add(star.points)
})
animate()
