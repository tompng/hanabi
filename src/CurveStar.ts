import * as THREE from 'three'
import { evenSpherePoints } from './util'
import vertexShader from './shaders/curve_star.vert'
import fragmentShader from './shaders/curve_star.frag'

const lineAttributes: Record<number, THREE.BufferAttribute | undefined> = {}

export class CurveStar {
  uniforms = {
    time: { value: 0 },
    color: { value: new THREE.Color('#642') },
    center: { value: new THREE.Vector3(0, 0, 2) },
    baseVelocity: { value: new THREE.Vector3(0, 0, 0) },
    velocityScale: { value: 4.0 },
    friction: { value: 4 },
    widthStart: { value: 0.02 },
    widthEnd: { value: 0.005 },
    duration: { value: 0.6 },
    curveDelay: { value: 0.1 }
  }
  mesh: THREE.Mesh
  constructor() {
    this.mesh = new THREE.Mesh(generateLineGeometry(2), new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }))
  }
  update(time: number) {
    this.uniforms.time.value = time
  }
}

function generateLineAttributes(step: number) {
  let attr = lineAttributes[step]
  if (attr) return attr
  const positions: number[] = []
  for (let i = 0; i < step; i++) {
    const t = i / step
    const t2 = (i + 1) / step
    positions.push(t, -1, 0, t, +1, 0, t2, -1, 0, t, +1, 0, t2, +1, 0, t2, -1, 0)
  }
  attr = new THREE.BufferAttribute(new Float32Array(positions), 3)
  lineAttributes[step] = attr
  return attr
}

function generateLineGeometry(countStep: number, lineStep: number = 8) {
  const geometry = new THREE.InstancedBufferGeometry()
  const velocities: number[] = []
  evenSpherePoints(countStep, 0.5).forEach(p => velocities.push(...p))
  geometry.setAttribute('position', generateLineAttributes(lineStep))
  geometry.setAttribute('velocity', new THREE.InstancedBufferAttribute(new Float32Array(velocities), 3))
  return geometry
}
