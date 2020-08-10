import * as THREE from 'three'
import hanabiUtil from './shaders/util.vert'
import starVertexShader from './shaders/star.vert'
import starFragmentShader from './shaders/star.frag'
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

const stars: Star[] = []
function animate() {
  const time = performance.now() / 1000
  stars.forEach(h => h.update(time))
  renderer.render(scene, camera)
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
      depthTest: false,
      side: THREE.DoubleSide
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

function generateLineGeometry(size: number) {
  const geometry = new THREE.BufferGeometry()
  const positions: number[] = []
  for (let i = 0; i < size; i++) {
    const t = i / size
    const t2 = (i + 1) / size
    positions.push(t, -1, 0, t, +1, 0, t2, -1, 0, t, +1, 0, t2, +1, 0, t2, -1, 0)
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
  return geometry
}

THREE.InstancedBufferAttribute
THREE.ShaderChunk['hanabi_util'] = hanabiUtil
scene.add(
  new THREE.Mesh(generateLineGeometry(64), new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: `
    varying vec2 coord;
    void main(){
      float t = position.x;
      float u = position.y;
      vec3 pos = vec3(0.2 * t, sin(5.0*t), cos(5.0*t));
      vec3 dpos = vec3(0.2, 5.0*cos(5.0*t), -5.0*sin(5.0*t));
      vec3 gpos = (modelMatrix * vec4(pos, 1)).xyz;
      float width = (4.0 + 8.0 * t * (1.0 - t)) * (0.5 + t) * 0.3;
      vec3 n = normalize(cross(gpos - cameraPosition, dpos)) * width;
      coord = vec2(t, u);
      gl_Position = projectionMatrix * viewMatrix * vec4(gpos + 0.01 * u * n, 1);
    }
    `,
    fragmentShader: `
    varying vec2 coord;
    void main(){
      float alpha = max(coord.x * (1.0 - coord.x) * (1.0 - coord.y * coord.y) * 4.0 * 1.0 - 0.0, 0.2);
      gl_FragColor = vec4(alpha,0,0,1);
    }
    `,
    linewidth: 4,
    blending: THREE.AdditiveBlending,
    depthTest: false,
  }))
)

const points = evenSpherePoints(5, 0.5)
points.forEach(p => stars.push(new Star(p)))
stars.forEach(h => scene.add(h.points))
animate()