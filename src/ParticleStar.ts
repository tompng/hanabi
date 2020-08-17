import * as THREE from 'three'
import type { N3D } from './util'
import tailVertexShader from './shaders/particle_tail.vert'
import splashVertexShader from './shaders/particle_splash.vert'
import fragmentShader from './shaders/point_star.frag'
import { StarBaseAttributes, setStarBaseAttributes, generateStarParticleAttributes, setStarParticleAttributes, ShaderBaseParams, ShaderBeeParams, ShaderBlinkParams, ShaderStopParams, ShaderParticleParams, buildUniforms, timeRangeMin, timeRangeMax } from './attributes'

type ParticleTailStarParams = {
  base: ShaderBaseParams
  color: THREE.Color | THREE.Color[]
  bee?: ShaderBeeParams
  blink?: ShaderBlinkParams
  stop?: ShaderStopParams
  particle: ShaderParticleParams
  size: number
}

export class ParticleTailStar {
  time: { value: number }
  mesh: THREE.Points
  constructor(geom: THREE.BufferGeometry, public params: ParticleTailStarParams) {
    const { base, color, bee, stop, blink, particle, size } = params
    const uniforms = { ...buildUniforms({ base, color, bee, blink, stop, particle }), size: { value: size } }
    this.time = uniforms.time
    const material = new THREE.ShaderMaterial({
      defines: { BLINK: !!blink, BEE: !!bee, STOP: !!stop, COLORS: Array.isArray(color) && color.length },
      uniforms: uniforms as any,
      vertexShader: tailVertexShader,
      fragmentShader,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    this.mesh = new THREE.Points(geom, material)
  }
  update(time: number) {
    this.time.value = time
    const { base, stop, particle } = this.params
    const t = stop ? Math.min(stop.time, base.duration) : base.duration
    const maxLife = particle.duration * (1 + 0.5 * (particle.durationRandomness || 0))
    this.mesh.visible = 0 <= time && time <= timeRangeMax(t, base.burnRateRandomness || 0) + maxLife
  }
}

type ParticleSplashStarParams = {
  base: ShaderBaseParams
  color: THREE.Color | THREE.Color[]
  bee?: ShaderBeeParams
  blink?: ShaderBlinkParams
  stop: ShaderStopParams
  particle: ShaderParticleParams
  size: number
}
export class ParticleSplashStar {
  time: { value: number }
  mesh: THREE.Points
  constructor(geom: THREE.BufferGeometry, public params: ParticleSplashStarParams & { stop: ShaderStopParams }) {
    const { base, color, bee, blink, particle, stop, size } = params
    const uniforms = {... buildUniforms({ base, color, bee, blink, stop, particle }), size: { value: size } }
    this.time = uniforms.time
    const material = new THREE.ShaderMaterial({
      defines: { BLINK: !!blink, BEE: !!bee, STOP: true, COLORS: Array.isArray(color) && color.length },
      uniforms: uniforms as any,
      vertexShader: splashVertexShader,
      fragmentShader,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    this.mesh = new THREE.Points(geom, material)
  }
  update(time: number) {
    this.time.value = time
    const { base, stop, particle } = this.params
    const t0 = timeRangeMin(stop.time, base.burnRateRandomness || 0)
    const t1 = timeRangeMax(stop.time, base.burnRateRandomness || 0)
    const maxLife = particle.duration * (1 + 0.5 * (particle.durationRandomness || 0))
    this.mesh.visible = t0 <= time && time <= t1 + maxLife
  }
}

export function generateParticleStarGeometry(direction: N3D[], attrs: StarBaseAttributes, particles: number = 64) {
  const geometry = new THREE.BufferGeometry()
  const ds: number[] = []
  direction.forEach(p => {
    for (let i = 0; i < particles; i++) ds.push(...p)
  })
  setStarBaseAttributes(geometry, attrs, particles)
  const pattrs = generateStarParticleAttributes(particles * direction.length)
  setStarParticleAttributes(geometry, pattrs)
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * particles * direction.length), 3))
  geometry.setAttribute('direction', new THREE.BufferAttribute(new Float32Array(ds), 3))
  geometry.boundingSphere = new THREE.Sphere(undefined, 4)
  return geometry
}
