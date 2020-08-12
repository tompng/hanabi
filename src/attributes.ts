import { N3D, sphereSurfaceRandom } from './util'

function randomCrosses([nx, ny, nz]: N3D): [N3D, N3D] {
  let [ax, ay, az] = sphereSurfaceRandom()
  const dot = ax * nx + ay * ny + az * nz
  ax -= dot * nx
  ay -= dot * ny
  az -= dot * nz
  const r = Math.hypot(ax, ay, az)
  ax /= r
  ay /= r
  az /= r
  const bx = ay * nz - ny * az
  const by = az * nx - nz * ax
  const bz = ax * ny - nx * ay
  return [[ax, ay, az], [bx, by, bz]]
}

export function generateStarBaseAttributes(size: number) {
  const burnRateRandoms: number[] = []
  const speedRandoms: number[] = []
  const frictionRandoms: number[] = []
  const beeStartRandoms: number[] = []
  const beeDirections: N3D[] = []
  const beeSpeedRandoms: number[] = []
  const beeDecayRandoms: number[] = []
  const beeSpiralFreqRandoms: number[] = []
  const beeSpiralAxisAlphas: N3D[] = []
  const beeSpiralAxisBetas: N3D[] = []
  for (let i = 0; i < size; i++) {
    const beeDirection: N3D = sphereSurfaceRandom()
    const [beeSpiralAxisAlpha, beeSpiralAxisBeta] = randomCrosses(beeDirection)
    burnRateRandoms.push(Math.random())
    speedRandoms.push(Math.random())
    frictionRandoms.push(Math.random())
    beeStartRandoms.push(Math.random())
    beeSpeedRandoms.push(Math.random())
    beeDecayRandoms.push(Math.random())
    beeSpiralFreqRandoms.push(Math.random())
    beeDirections.push(beeDirection)
    beeSpiralAxisAlphas.push(beeSpiralAxisAlpha)
    beeSpiralAxisBetas.push(beeSpiralAxisBeta)
  }
  return {
    burnRateRandoms,
    speedRandoms,
    frictionRandoms,
    beeStartRandoms,
    beeDirections,
    beeSpeedRandoms,
    beeDecayRandoms,
    beeSpiralFreqRandoms,
    beeSpiralAxisAlphas,
    beeSpiralAxisBetas
  }
}

export function generateStarParticleAttributes(size: number) {
  const blinkStartRandoms: number[] = []
  const blinkPhase: number[] = []
  const blinkRateRandoms: number[] = []
  const particleDirections: N3D[] = []
  const particlePhaseRandoms: number[] = []
  const particleSpeedRandoms: number[] = []
  const particleFrictionRandoms: number[] = []
  const particleDurationRandoms: number[] = []
  for (let i = 0; i < size; i++) {
    blinkStartRandoms.push(Math.random())
    blinkPhase.push(Math.random())
    blinkRateRandoms.push(Math.random())
    particleDirections.push(sphereSurfaceRandom())
    particlePhaseRandoms.push(Math.random())
    particleSpeedRandoms.push(Math.random())
    particleFrictionRandoms.push(Math.random())
    particleDurationRandoms.push(Math.random())
  }
  return {
    blinkPhase,
    blinkStartRandoms,
    blinkRateRandoms,
    particlePhaseRandoms,
    particleDirections,
    particleSpeedRandoms,
    particleFrictionRandoms,
    particleDurationRandoms
  }
}
