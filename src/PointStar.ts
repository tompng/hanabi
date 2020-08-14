import * as THREE from 'three'
import type { N3D } from './util'
import vertexShader from './shaders/point_star.vert'
import fragmentShader from './shaders/point_star.frag'
import { StarBaseAttributes, setStarBaseAttributes, setStarBaseBlinkAttributes, ShaderBaseParams, ShaderBeeParams, ShaderBlinkParams, buildUniforms, ShaderStopParams } from './attributes'

type PointStarParams = {
  base: ShaderBaseParams
  color: THREE.Color | THREE.Color[]
  stop?: ShaderStopParams
  bee?: ShaderBeeParams
  blink?: ShaderBlinkParams
}

export class PointStar {
  time: { value: number }
  mesh: THREE.Points
  constructor(geom: THREE.BufferGeometry, { base, stop, bee, blink, color }: PointStarParams) {
    const uniforms = buildUniforms({ base, stop, bee, blink, color })
    this.time = uniforms.time
    const material = new THREE.ShaderMaterial({
      defines: { BLINK: !!blink, BEE: !!bee, STOP: !!stop, COLORS: Array.isArray(color) && color.length },
      uniforms: uniforms as any,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    this.mesh = new THREE.Points(geom, material)
  }
  update(time: number) {
    this.time.value = time
  }
}

export function generatePointStarGeometry(direction: N3D[], attrs: StarBaseAttributes, lineStep: number = 8) {
  const geometry = new THREE.BufferGeometry()
  const ds: number[] = []
  direction.forEach(p => ds.push(...p))
  setStarBaseAttributes(geometry, attrs)
  setStarBaseBlinkAttributes(geometry, attrs)
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * direction.length), 3))
  geometry.setAttribute('direction', new THREE.BufferAttribute(new Float32Array(ds), 3))
  geometry.boundingSphere = new THREE.Sphere(undefined, 4)
  return geometry
}
