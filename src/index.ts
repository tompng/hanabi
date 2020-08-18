import * as THREE from 'three'
import hanabiUtilChunk from './shaders/util.vert'
import baseParamsChunk from './shaders/base_params.vert'
import blinkParamsChunk from './shaders/blink_params.vert'
import blinkParticleChunk from './shaders/particle_params.vert'
import { CurveStar, generateCurveStarGeometry } from './CurveStar'
import { PointStar, generatePointStarGeometry } from './PointStar'
import { ParticleTailStar, ParticleSplashStar, generateParticleStarGeometry } from './ParticleStar'
import { N3D, evenSpherePoints, randomRotatePoints, peakTime } from './util'
import { generateStarBaseAttributes, ShaderBaseParams, ShaderStopParams, ShaderBeeParams, ShaderParticleParams, starStops } from './attributes'
import { Capturer } from './capture'
import { Land } from './Land'
import { Water } from './Water'
import { skyMesh } from './sky'
import { Fireworks } from './fireworks'
const land = new Land({min: -1, max: 1, step: 256},{min: -1, max: 1, step: 256},0,(x,y)=>
  (8*(1-x)*(1+x)*(1-y)*(1+y)*(1+Math.sin(8*x+4*y)+Math.sin(2*x-7*y+1)+Math.sin(9*x+11*y+2)+Math.sin(13*x-12*y+3)-6/(1+4*(x**2+y**2))+2*x)-1) / 128
)
const landAttrs = land.generateGeometryAttributes()
const landGeometry = new THREE.BufferGeometry()
landGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(landAttrs.positions), 3))
landGeometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(landAttrs.normals), 3))
const landUniforms = {
  color: { value: new THREE.Color('black') }
}
const mesh = new THREE.Mesh(
  landGeometry,
  // new THREE.MeshPhongMaterial({ color: 'white' })
  // new THREE.MeshBasicMaterial({ color: 'white', side: THREE.DoubleSide })
  new THREE.ShaderMaterial({
    uniforms: landUniforms,
    vertexShader: `
      varying vec3 norm;
      varying vec3 gpos;
      void main(){
        norm=normalize(normal);
        gpos=(modelMatrix * vec4(position, 1)).xyz;
        gl_Position=projectionMatrix*viewMatrix*vec4(gpos,1);
      }
    `,
    fragmentShader: `
      varying vec3 norm;
      varying vec3 gpos;
      uniform vec3 color;
      const vec3 fireworksPosition = vec3(0, 0, 100);
      const float z2 = fireworksPosition.z * fireworksPosition.z;
      void main(){
        if(gpos.z<0.0)discard;
        vec3 lvec = fireworksPosition - gpos;
        float l2 = dot(lvec, lvec);
        lvec /= sqrt(l2);
        vec3 n = normalize(norm);
        gl_FragColor=vec4(vec3(0.05+0.05*n.z), 1);
        if (gl_FrontFacing) gl_FragColor.rgb += color * max(dot(n, lvec) * 1.2 - 0.2, 0.0) / (1.0 + l2 / z2);
      }`,
    side: THREE.DoubleSide
  })
)
mesh.position.x = 0
mesh.position.y = 0
mesh.position.z = 0
mesh.scale.x = mesh.scale.y = mesh.scale.z = 256.0

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
scene.add(skyMesh)
const fireworks = new Fireworks(scene)
const groundScene = new THREE.Scene()
const water = new Water(width, height)
const waterScene = new THREE.Scene()
waterScene.add(water.mesh)
groundScene.add(mesh)
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2048)
camera.up.set(0, 0, 1)
camera.position.x = 0
const cameraR = 150
camera.position.y = -cameraR
;(camera as any).lookatZ = 40
renderer.domElement.onmousemove = e => {
  const r = cameraR
  const th = e.offsetX / 100
  camera.position.x = -r * Math.sin(th)
  camera.position.y = -r * Math.cos(th)
  camera.position.z = 160 * (1 - e.offsetY / renderer.domElement.offsetHeight) + 1
  camera.lookAt(0, 0, (camera as any).lookatZ)
}

camera.position.z = 1
camera.lookAt(0, 0, (camera as any).lookatZ)
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

let timeWas = performance.now() / 1000
function animate() {
  const time = performance.now() / 1000
  
  if (Math.floor(timeWas / 0.2) !== Math.floor(time / 0.2)) {
    if (Math.random() < 0.1) add(time)
  }
  timeWas = time

  fireworks.update(time)
  const brightness = fireworks.brightness()
  const ll = 0.001
  landUniforms.color.value = new THREE.Color(brightness.r * ll, brightness.g * ll, brightness.b * ll)

  function render() {
    water.update(time, camera)
    const target = renderer.getRenderTarget()
    renderer.setRenderTarget(water.skyTarget)
    renderer.clearColor()
    renderer.clearDepth()
    renderer.render(scene, water.camera)
    renderer.setRenderTarget(water.groundTarget)
    renderer.clearColor()
    renderer.clearDepth()
    renderer.render(groundScene, water.camera)
    renderer.setRenderTarget(target)
    renderer.clearColor()
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


const singleAttr = generateStarBaseAttributes(1)
const singleDir: N3D[] = [[0, 0, 0]]

const particleTailParams: ShaderParticleParams = {
  speed: 1,
  friction: 16,
  duration: 0.8,
  durationRandomness: 0.5
}

const direction = evenSpherePoints(3, 0.5)
randomRotatePoints(direction)
const attributes = generateStarBaseAttributes(direction.length)

const stopParams: ShaderStopParams = {
  time: 1.6
}
const beeParams: ShaderBeeParams = {
  start: 0.8,
  decay: 4.0,
  speed: 32.0,
  decayRandomness: 0.2,
  speedRandomness: 0.2
}

const particleSplashParams: ShaderParticleParams = {
  speed: 12,
  friction: 8,
  duration: 0.8
}
const color1 = [new THREE.Color('#884'), new THREE.Color('#f84'), new THREE.Color('white')]
const color2 = new THREE.Color('#a66')
const color3 = [new THREE.Color('white'), new THREE.Color('#faa')]

function add(time: number) {
  const curveGeom = generateCurveStarGeometry(direction, attributes)
  const pointGeom = generatePointStarGeometry(direction, attributes)
  const particleGeom = generateParticleStarGeometry(direction, attributes, 64)

  const rndpos = () => 20 * (Math.floor(Math.random() * 3) - 1)
  const bulletBaseParams: ShaderBaseParams = {
    center: new THREE.Vector3(rndpos(), rndpos(), 0),
    baseVelocity: new THREE.Vector3(16 * Math.random() - 8, 16 * Math.random() - 8, 50 + 20 * Math.random()),
    speed: 0,
    friction: 0.5,
    duration: 100
  }
  const pt = peakTime(60, 0.5)
  const stop = starStops(singleDir, singleAttr, bulletBaseParams, null, pt)[0]

  const bullet = new ParticleTailStar(generateParticleStarGeometry(singleDir, singleAttr, 64), { base: bulletBaseParams, stop: { time: pt }, particle: particleTailParams, color: new THREE.Color(0.1,0.1,0.1), size: 0.2 })
  fireworks.add({ star: bullet, startTime: time })

  const baseParams: ShaderBaseParams = {
    center: new THREE.Vector3(...stop.p),
    baseVelocity: new THREE.Vector3(...stop.v),
    speed: 20,
    friction: 1,
    duration: 4.0,
    speedRandomness: 0.1,
    frictionRandomness: 0.4,
    burnRateRandomness: 0.4
  }

  const cstar = new CurveStar(curveGeom, { base: baseParams, bee: beeParams, stop: stopParams, widthStart: 0.5, color: color1, widthEnd: 0.1, curveFriction: particleTailParams.friction, curveDelay: 0.4 }, direction.length)
  const pstar = new PointStar(pointGeom, { base: baseParams, bee: beeParams, stop: stopParams, color: color1, size: 0.8 })
  const pstar2 = new PointStar(pointGeom, { base: { ...baseParams, friction: 1, burnRateRandomness: 0.1, speedRandomness: 0, frictionRandomness: 0, speed: 30, duration: 2 }, color: color3, lastFlash: { duration: 0.4, color: new THREE.Color('white'), size: 0.2 }, size: 0.8 })
  const tstar = new ParticleTailStar(particleGeom, { base: baseParams, bee: beeParams, stop: stopParams, particle: particleTailParams, size: 0.2, color: color2 })
  const sstar = new ParticleSplashStar(particleGeom, { base: baseParams, bee: beeParams, stop: stopParams, particle: particleSplashParams, size: 0.2, color: color3 })
  fireworks.add({ star: cstar, startTime: time + pt })
  fireworks.add({ star: pstar, startTime: time + pt })
  fireworks.add({ star: pstar2, startTime: time + pt })
  fireworks.add({ star: tstar, startTime: time + pt })
  fireworks.add({ star: sstar, startTime: time + pt })
}
animate()
