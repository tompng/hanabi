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

export const polyhedron20: N3D[] = []
function add(i: number, j: number, k: number) {
  const a = polyhedron12[i]
  const b = polyhedron12[j]
  const c = polyhedron12[k]
  const x = a[0] + b[0] + c[0]
  const y = a[1] + b[1] + c[1]
  const z = a[2] + b[2] + c[2]
  const r = Math.hypot(x, y, z)
  polyhedron20.push([x / r, y / r, z / r])
}
for (let i = 0; i < 5; i++) {
  const a = 2 + 2 * i
  const b = 2 + (i + 1) % 5 * 2
  const c = a + 1
  const d = b + 1
  add(a, b, 0)
  add(c, d, 1)
  add(a, b, 2 + (a + 5) % 10)
  add(c, d, 1 + (c + 4) % 10)
}
