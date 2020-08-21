import * as THREE from 'three'
import hanabiUtilChunk from './shaders/util.vert'
import baseParamsChunk from './shaders/base_params.vert'
import blinkParamsChunk from './shaders/blink_params.vert'
import blinkParticleChunk from './shaders/particle_params.vert'
import { CurveStar } from './CurveStar'
import { PointStar } from './PointStar'
import { ParticleTailStar, ParticleSplashStar } from './ParticleStar'
import { N3D, evenSpherePoints, peakTime } from './util'
import { generateStarBaseAttributes, ShaderBaseParams, ShaderStopParams, ShaderBeeParams, ShaderParticleParams, starStops } from './attributes'
import { Capturer } from './capture'
import { Land } from './Land'
import { Water } from './Water'
import { skyMesh } from './sky'
import { Fireworks, addHanabi } from './fireworks'
import { Camera } from './camera'
import { audioContext, setAudioListener, toggleMute, playPyu, playBang } from './sound'

const soundButton = document.querySelector<HTMLElement>('.sound')!
soundButton.onclick = () => {
  const muted = toggleMute()
  soundButton.classList.remove('sound-on', 'sound-off')
  soundButton.classList.add(muted ? 'sound-off' : 'sound-on')
}
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
const scene = new THREE.Scene()
scene.add(skyMesh)
const fireworks = new Fireworks(scene)
const groundScene = new THREE.Scene()
const water = new Water(innerWidth, innerHeight)
const waterScene = new THREE.Scene()
waterScene.add(water.mesh)
groundScene.add(mesh)
const camera = new Camera(innerWidth, innerHeight)
const cameraR = 80
camera.position.x = -cameraR
camera.position.z = 1
camera.verticalAngle = 0.2
const move = { from: { x: camera.position.x, y: camera.position.y }, to: { x: camera.position.x, y: camera.position.y }, time: 0 }
const lscale = 256
let currentPointerId: null | number = null
renderer.domElement.addEventListener('pointerdown', e => {
  currentPointerId = e.pointerId
  const startX = e.pageX
  const startY = e.pageY
  e.preventDefault()
  const startHAngle = camera.horizontalAngle
  const startVAngle = camera.verticalAngle
  let maxMove = 0
  const time = performance.now()
  function pointermove(e: PointerEvent) {
    e.preventDefault()
    if (e.pointerId !== currentPointerId) return
    const dx = e.pageX - startX
    const dy = e.pageY - startY
    maxMove = Math.max(maxMove, Math.abs(dx), Math.abs(dy))
    if (maxMove < 4) return
    const scale = camera.fov / renderer.domElement.offsetHeight * Math.PI / 180
    camera.horizontalAngle = startHAngle + dx * scale
    camera.verticalAngle = Math.min(Math.max(-Math.PI / 3, startVAngle + dy * scale), Math.PI / 3)
  }
  function pointerup(e: PointerEvent) {
    window.removeEventListener('pointermove', pointermove)
    window.removeEventListener('pointerup', pointerup)
    if (e.pointerId !== currentPointerId) return
    if (maxMove >= 4 || performance.now() - time > 500) return
    const el = renderer.domElement
    const rx = (e.pageX - el.offsetLeft) / el.offsetWidth
    const ry = (e.pageY - el.offsetTop) / el.offsetHeight
    const view = camera.viewAt(rx, ry)
    const maxXYDistance = 40
    const p = land.intersect(
      {
        x: camera.position.x / lscale,
        y: camera.position.y / lscale,
        z: camera.position.z / lscale
      },
      view
    )
    if (p) {
      const dx = p.x * lscale - camera.position.x
      const dy = p.y * lscale - camera.position.y
      const r = Math.hypot(dx, dy)
      const l = Math.min(maxXYDistance / r, 1)
      move.to = {
        x: Math.min(Math.max(-lscale, camera.position.x + l * dx), lscale),
        y: Math.min(Math.max(-lscale, camera.position.y + l * dy), lscale)
      }
      move.from = { x: camera.position.x, y: camera.position.y }
      move.time = performance.now() / 1000
    }
  }
  window.addEventListener('pointermove', pointermove)
  window.addEventListener('pointerup', pointerup)
})


const canvas = renderer.domElement
canvas.style.touchAction = 'none'
canvas.style.position = 'fixed'
canvas.style.left = '0'
canvas.style.top = '0'
canvas.style.width = '100%'
canvas.style.height = '100%'
document.body.appendChild(canvas)
let resizeTimer: number | null = null
function doResize() {
  resizeTimer = null
  const size = new THREE.Vector2()
  renderer.getSize(size)
  const width = window.innerWidth
  const height = window.innerHeight
  if (size.x === width && size.y === height) return
  renderer.setSize(width, height)
  camera.width = width
  camera.height = height
  camera.update()
  water.resize(width, height, camera.fov)
}
function resized() {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(doResize, 100)
}
window.addEventListener('orientationchange', resized)
window.addEventListener('resize', resized)
doResize()

let capturer: Capturer | null = null
let captureCanvases = [...new Array(4)].map(() => document.createElement('canvas'))
const button = document.createElement('button')
button.textContent = 'capture'
document.body.appendChild(button)
button.onclick = () => {
  if (capturer) return
  capturer = new Capturer(renderer, window.innerWidth, window.innerHeight)
  captureCanvases.forEach((c, i) => {
    c.style.cssText = `position:fixed;top:0;`
    c.style.left = (i % 2 * 50) + '%'
    c.style.top = (Math.floor(i / 2) * 50) + '%'
    document.body.appendChild(c)
    c.style.width = innerWidth / 2 + 'px'
    c.style.height = innerHeight / 2 + 'px'
    c.getContext('2d')?.clearRect(0, 0, c.width, c.height)
  })
  let n = 0
  const timer = setInterval(() => {
    n++
    const msecs = [100, 1000, 2000, 4000]
    const i = msecs.findIndex(v => n == (v / 100))
    if (i === -1) return
    capturer?.capture(captureCanvases[i], 1)
    if (i === 3) {
      clearInterval(timer)
      capturer?.dispose()
      capturer = null
    }
  }, 100)
}

let timeWas = performance.now() / 1000
function animate() {
  const time = performance.now() / 1000
  let mt = Math.min(Math.max(0, (time - move.time) / 2), 1)
  mt = mt * mt * (3 - 2 * mt)
  camera.position.x = move.from.x * (1 - mt) + mt * move.to.x
  camera.position.y = move.from.y * (1 - mt) + mt * move.to.y
  camera.position.z = Math.max(0, lscale * land.maxZAt(camera.position.x / lscale, camera.position.y / lscale)) + 1

  camera.update()
  setAudioListener(camera.listenerPosition())
  if (Math.floor(timeWas / 0.2) !== Math.floor(time / 0.2)) {
    if (Math.random() < 0.1) addHanabi(fireworks, { bang: playBang, pyu: playPyu }, time)
  }
  timeWas = time

  fireworks.update(time, camera.pointPixels)
  const brightness = fireworks.brightness()
  const ll = 0.0002
  landUniforms.color.value = new THREE.Color(brightness.r * ll, brightness.g * ll, brightness.b * ll)

  function render() {
    water.update(time)
    const target = renderer.getRenderTarget()
    renderer.setRenderTarget(water.skyTarget)
    renderer.clearColor()
    renderer.clearDepth()
    renderer.render(scene, camera.waterCamera)
    renderer.setRenderTarget(water.groundTarget)
    renderer.clearColor()
    renderer.clearDepth()
    renderer.render(groundScene, camera.waterCamera)
    renderer.setRenderTarget(target)
    renderer.clearColor()
    renderer.render(groundScene, camera.mainCamera)
    renderer.render(waterScene, camera.mainCamera)
    renderer.render(scene, camera.mainCamera)
  }
  if (capturer) {
    capturer.add(render)
    capturer.copy(capturer.input.texture, null)
  } else {
    render()
  }
  requestAnimationFrame(animate)
}

animate()
