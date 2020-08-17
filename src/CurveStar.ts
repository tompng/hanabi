import * as THREE from 'three'
import type { N3D } from './util'
import vertexShader from './shaders/curve_star.vert'
import fragmentShader from './shaders/curve_star.frag'
import { setStarBaseAttributes, StarBaseAttributes, ShaderBeeParams, ShaderStopParams, buildUniforms, ShaderBaseParams, timeRangeMax } from './attributes'

const lineAttributes: Record<number, THREE.BufferAttribute | undefined> = {}

type CurveStarParams = {
  base: ShaderBaseParams
  color: THREE.Color | THREE.Color[]
  stop?: ShaderStopParams
  bee?: ShaderBeeParams
  widthStart: number
  widthEnd: number
  curveDelay: number
}
export class CurveStar {
  time: { value: number }
  mesh: THREE.Mesh
  constructor(geometry: THREE.BufferGeometry, public params: CurveStarParams) {
    const { base, color, stop, bee, widthStart, widthEnd, curveDelay } = params
    const uniforms = {
      ...buildUniforms({ base, color, stop, bee }),
      widthStart: { value: widthStart },
      widthEnd: { value: widthEnd },
      curveDelay: { value: curveDelay }
    }
    this.time = uniforms.time
    const material = new THREE.ShaderMaterial({
      defines: { BEE: !!bee, STOP: !!stop, COLORS: Array.isArray(color) && color.length },
      uniforms: uniforms as any,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(geometry, material)
  }
  update(time: number) {
    this.time.value = time
    const { curveDelay, base, stop } = this.params
    const t = stop ? Math.min(stop.time, base.duration) : base.duration
    this.mesh.visible = 0 <= time && time <= curveDelay + timeRangeMax(t, base.burnRateRandomness || 0)
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

export function generateCurveStarGeometry(direction: N3D[], attrs: StarBaseAttributes, lineStep: number = 8) {
  const geometry = new THREE.InstancedBufferGeometry()
  const ds: number[] = []
  direction.forEach(p => ds.push(...p))
  geometry.setAttribute('position', generateLineAttributes(lineStep))
  setStarBaseAttributes(geometry, attrs)
  geometry.setAttribute('direction', new THREE.InstancedBufferAttribute(new Float32Array(ds), 3))
  return geometry
}
