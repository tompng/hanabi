import type { N3D } from './util'
const sqrt2 = Math.sqrt(2)
const sqrt3 = Math.sqrt(3)
export const polyhedron4: N3D[] = [
  [0, 0, 1],
  [2 * sqrt2 / 3, 0, -1/3],
  [-sqrt2 / 3, +sqrt2 / sqrt3, -1/3],
  [-sqrt2 / 3, -sqrt2 / sqrt3, -1/3],
]

export const polyhedron6: N3D[] = [
  [-1, 0, 0],
  [+1, 0, 0],
  [0, -1, 0],
  [0, +1, 0],
  [0, 0, -1],
  [0, 0, +1]
]

export const polyhedron8: N3D[] = [
  [-1, -1, -1],
  [-1, -1, +1],
  [-1, +1, -1],
  [-1, +1, +1],
  [+1, -1, -1],
  [+1, -1, +1],
  [+1, +1, -1],
  [+1, +1, +1],
].map(p => p.map(v => v / sqrt3) as N3D)

const th = Math.PI / 5
const raxis = 1 / Math.sin(th) / 2
const h = Math.sqrt(1 - raxis ** 2)
const r = 1 / h / 2
export const polyhedron12: N3D[] = [[1, 0, 0], [-1, 0, 0]]
for (let i = 0; i < 5; i++) {
  const c = Math.cos(2 * th * i)
  const s = Math.sin(2 * th * i)
  const x = 1 - h / r
  const y = raxis * c / r
  const z = raxis * s / r
  polyhedron12.push([x, y, z], [-x, -y, -z])
}

