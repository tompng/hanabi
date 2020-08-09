import * as THREE from 'three'
import vertexShader from './shader.vert'
import fragmentShader from './shader.frag'
import { N3D, sphereRandom, evenSpherePoints } from './util'
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

class Hana {
  points: THREE.Points
  uniforms = {
    time: { value: 0 },
    velocity: { value: new THREE.Vector3(0, 0, 0) }
  }
  constructor([vx, vy, vz]: N3D) {
    const shader = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      side: THREE.DoubleSide,
    })
    const v = 0.98 + 0.04 * Math.random()
    this.uniforms.velocity.value.x = vx * v
    this.uniforms.velocity.value.y = vy * v
    this.uniforms.velocity.value.z = vz * v
    this.points = new THREE.Points(sample(geometries), shader)
  }
  update(time: number) {
    this.uniforms.time.value = time / 4 % 1
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

const points = evenSpherePoints(5, 0.5)
points.forEach(p => hanaList.push(new Hana(p)))
hanaList.forEach(h => scene.add(h.points))
;(window as any).hanaList = hanaList
animate()