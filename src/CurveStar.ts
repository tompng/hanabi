import * as THREE from 'three'
import type { N3D } from './util'
import vertexShader from './shaders/curve_star.vert'
import fragmentShader from './shaders/curve_star.frag'
import { setStarBaseAttributes, StarBaseAttributes } from './attributes'

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
  constructor(direction: N3D[], attrs: StarBaseAttributes) {
    const material = new THREE.ShaderMaterial({
      defines: { BEE: true },
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(generateGeometry(direction, attrs), material)
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

function generateGeometry(direction: N3D[], attrs: StarBaseAttributes, lineStep: number = 8) {
  const geometry = new THREE.InstancedBufferGeometry()
  const ds: number[] = []
  direction.forEach(p => ds.push(...p))
  geometry.setAttribute('position', generateLineAttributes(lineStep))
  setStarBaseAttributes(geometry, attrs)
  geometry.setAttribute('direction', new THREE.InstancedBufferAttribute(new Float32Array(ds), 3))
  return geometry
}
