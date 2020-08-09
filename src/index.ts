import * as THREE from 'three'
import vertexShader from './shader.vert'
import fragmentShader from './shader.frag'

/*
v' = -g-a(v-w)
v=w+(k*exp(-a*t)-g)/a
v=w+(g/a+(v0-w))*exp(-a*t)-g/a
x=(w-g/a)t-(g+a(v0-w))/aa*(exp(-a*t)-1)
*/

const renderer = new THREE.WebGLRenderer()
const width = 800
const height = 600
renderer.setSize(width, height)
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 32)
camera.position.x = 0
camera.position.y = -2
camera.position.z = 0
camera.lookAt(0, 0, 0)
const canvas = renderer.domElement
document.body.appendChild(canvas)

const hanaList: Hana[] = []
function animate() {
  const time = performance.now() / 1000
  hanaList.forEach(h => h.update(time))
  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}
function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
const geometries = [...Array(32)].map(() => generateGeometry(64))
const uniforms = {
  time: { value: 0 }
}

class Hana {
  points: THREE.Points
  uniforms = {
    time: { value: 0 },
    velocity: { value: new THREE.Vector3(...sphereSurfaceRandom()) }
  }
  constructor() {
    const shader = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      side: THREE.DoubleSide,
    })
    this.points = new THREE.Points(sample(geometries), shader)
  }
  update(time: number) {
    this.uniforms.time.value = time / 4 % 1
  }
}
function sphereRandom() {
  while (true) {
    const x = 2 * Math.random() - 1
    const y = 2 * Math.random() - 1
    const z = 2 * Math.random() - 1
    if (x * x + y * y + z * z < 1) return [x, y, z]
  }
}
function sphereSurfaceRandom() {
  const [x, y, z] = sphereRandom()
  const r = Math.hypot(x, y, z)
  return [x / r, y / r, z / r]
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

for(let i=0;i<512; i++) {
  hanaList.push(new Hana())
}
hanaList.forEach(h => scene.add(h.points))
;(window as any).hanaList = hanaList
animate()