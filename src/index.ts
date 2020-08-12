import * as THREE from 'three'
import hanabiUtil from './shaders/util.vert'
import starVertexShader from './shaders/star.vert'
import starFragmentShader from './shaders/star.frag'
import { CurveStar } from './CurveStar'
import { PointStar } from './PointStar'
import { N3D, sphereRandom, evenSpherePoints } from './util'
import { createRenderTarget, Smoother } from './smoother'
import { generateStarBaseAttributes } from './attributes'

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
const renderTarget = createRenderTarget(256)
const renderTarget2 = createRenderTarget(256)
const smoother = new Smoother(renderer)
const waveUniforms = { map: { value: renderTarget2.texture }, time: { value: 0 } }
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(),
  new THREE.ShaderMaterial({
    uniforms: waveUniforms,
    vertexShader: `
      varying vec2 gpos;
      void main() {
        gpos = position.xy * 16.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(gpos, 0, 1);
      }
    `,
    fragmentShader: `
    varying vec2 gpos;
    uniform sampler2D map;
    uniform float time;
      void main() {
        vec2 gp = gpos * 0.7;
        vec2 coord = vec2(gl_FragCoord.x / 800.0, 1.0 - gl_FragCoord.y / 600.0);
        coord.x += 0.002 * (
        +sin(gp.x * 70.0 + gp.y * 51.3 - time * 1.2)
        +sin(gp.y * 83.0 - gp.x * 45.2 - time * 1.4)
        +sin(gp.x * 67.0 + gp.y * 35.3 - time * 1.3)
        +sin(gp.y * 91.3 - gp.x * 28.2 + time * 1.5)
        +sin(gp.y * 21.3 - gp.x * 88.2 + time * 1.6)
        +sin(gp.y * 81.3 - gp.x * 18.2 + time * 1.6));
        gl_FragColor = texture2D(map, coord) * 0.4;
      }
    `,
    side: THREE.DoubleSide
  })
)
scene.add(plane)
function animate() {
  const time = performance.now() / 1000
  updatables.forEach(h => h.update(time / 4 % 1))
  // renderer.setRenderTarget(renderTarget)
  // renderer.render(scene, camera2)
  // renderer.setRenderTarget(null)
  // smoother.smooth(renderTarget.texture, renderTarget2, 1 / 256)
  // smoother.smooth(renderTarget2.texture, renderTarget, 1 / 256*1.5)
  // smoother.smooth(renderTarget.texture, renderTarget2, 1 / 256*3)
  // plane.visible = true
  // waveUniforms.time.value = time * 0.5;
  renderer.render(scene, camera)
  // plane.visible = false
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

THREE.ShaderChunk['hanabi_util'] = hanabiUtil
const direction = evenSpherePoints(2, 0.5)
const attributes = generateStarBaseAttributes(direction.length)

const cstar = new CurveStar(direction, attributes)
scene.add(cstar.mesh)
updatables.push(cstar)

const pstar = new PointStar(direction, attributes)
scene.add(pstar.mesh)
updatables.push(pstar)

const points = evenSpherePoints(5, 0.5)
points.forEach(p => {
  const star = new Star(p)
  updatables.push(star)
  scene.add(star.points)
})
animate()
