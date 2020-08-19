import * as THREE from 'three'
import type { N3D } from './util'
import tailVertexShader from './shaders/particle_tail.vert'
import splashVertexShader from './shaders/particle_splash.vert'
import fragmentShader from './shaders/point_star.frag'
import { StarBaseAttributes, setStarBaseAttributes, generateStarParticleAttributes, setStarParticleAttributes, ShaderBaseParams, ShaderBeeParams, ShaderBlinkParams, ShaderStopParams, ShaderParticleParams, buildUniforms, timeRangeMin, timeRangeMax, colorAt, colorMult, BrightnessZero, generateEmptyPositionAttribute, generateBufferAttribute3D, generateStarBaseAttributes } from './attributes'

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
  pointPixels = { value: 0 }
  mesh: THREE.Points
  brightness = BrightnessZero
  count: number
  endTime: number
  maxPDuration: number
  material: THREE.ShaderMaterial
  constructor(direction: N3D[], numParticles: number, public params: ParticleTailStarParams) {
    this.count = direction.length * numParticles
    const geom = generateParticleStarGeometry(direction, numParticles)
    const { base, color, bee, stop, blink, particle, size } = params
    const uniforms = { ...buildUniforms({ base, color, bee, blink, stop, particle }), size: { value: size }, pointPixels: this.pointPixels }
    this.time = uniforms.time
    this.material = new THREE.ShaderMaterial({
      defines: { BLINK: !!blink, BEE: !!bee, STOP: !!stop, COLORS: Array.isArray(color) && color.length },
      uniforms: uniforms as any,
      vertexShader: tailVertexShader,
      fragmentShader,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    this.mesh = new THREE.Points(geom, this.material)
    this.maxPDuration = particle.duration * (1 + 0.5 * (particle.durationRandomness || 0))
    this.endTime = timeRangeMax(stop ? Math.min(stop.time, base.duration) : base.duration, base.burnRateRandomness || 0) + this.maxPDuration
  }
  update(time: number, pointPixels: number) {
    this.time.value = time
    this.pointPixels.value = pointPixels
    const { base, stop, color, size } = this.params
    const maxDuration = timeRangeMax(base.duration, base.burnRateRandomness || 0) + this.maxPDuration
    this.mesh.visible = 0 <= time && time <= this.endTime
    if (!this.mesh.visible) {
      this.brightness = BrightnessZero
      return
    }
    this.brightness = colorAt(color, time / maxDuration)
    const scale = size ** 2 * this.count
    this.brightness.r *= scale
    this.brightness.g *= scale
    this.brightness.b *= scale
    if (stop) {
      const s0 = timeRangeMin(stop.time, base.burnRateRandomness || 0)
      const s1 = timeRangeMax(stop.time, base.burnRateRandomness || 0) + this.maxPDuration
      if (s0 < time) {
        const s = (s1 - time) / (s1 - s0)
        this.brightness.r *= s
        this.brightness.g *= s
        this.brightness.b *= s
      }
    }
  }
  dispose() {
    this.material.dispose()
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
  pointPixels = { value: 0 }
  mesh: THREE.Points
  brightness = BrightnessZero
  count: number
  endTime: number
  maxLife: number
  material: THREE.ShaderMaterial
  constructor(direction: N3D[], numParticles: number, public params: ParticleSplashStarParams & { stop: ShaderStopParams }) {
    this.count = direction.length * numParticles
    const geom = generateParticleStarGeometry(direction, numParticles)
    const { base, color, bee, blink, particle, stop, size } = params
    const uniforms = {... buildUniforms({ base, color, bee, blink, stop, particle }), size: { value: size }, pointPixels: this.pointPixels }
    this.time = uniforms.time
    this.material = new THREE.ShaderMaterial({
      defines: { BLINK: !!blink, BEE: !!bee, STOP: true, COLORS: Array.isArray(color) && color.length },
      uniforms: uniforms as any,
      vertexShader: splashVertexShader,
      fragmentShader,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    this.mesh = new THREE.Points(geom, this.material)
    this.maxLife = particle.duration * (1 + 0.5 * (particle.durationRandomness || 0))
    this.endTime = timeRangeMax(stop.time, base.burnRateRandomness || 0) + this.maxLife
  }
  update(time: number, pointPixels: number) {
    this.time.value = time
    this.pointPixels.value = pointPixels
    const { base, stop, particle, color, size } = this.params
    const t0 = timeRangeMin(stop.time, base.burnRateRandomness || 0)
    this.mesh.visible = t0 <= time && time <= this.endTime
    if (!this.mesh.visible) {
      this.brightness = BrightnessZero
      return
    }
    const phase = (time - t0) / (this.endTime - t0)
    this.brightness = colorAt(color, phase)
    let scale = size ** 2 * this.count
    if (stop) {
      const s0 = timeRangeMin(stop.time, base.burnRateRandomness || 0)
      const s1 = timeRangeMax(stop.time, base.burnRateRandomness || 0)
      if (time < s1) scale *= (time - s0) / (s1 - s0)
    }
    this.brightness.r *= scale
    this.brightness.g *= scale
    this.brightness.b *= scale
  }
  dispose() {
    this.material.dispose()
  }
}

export function generateParticleStarGeometry(direction: N3D[], particles: number = 64) {
  const geometry = new THREE.BufferGeometry()
  const attrs = generateStarBaseAttributes(direction.length)
  setStarBaseAttributes(geometry, attrs, particles)
  const pattrs = generateStarParticleAttributes(particles * direction.length)
  setStarParticleAttributes(geometry, pattrs)
  geometry.setAttribute('position', generateEmptyPositionAttribute(particles * direction.length))
  geometry.setAttribute('direction', generateBufferAttribute3D(direction, particles))
  geometry.boundingSphere = new THREE.Sphere(undefined, 1024)
  return geometry
}
