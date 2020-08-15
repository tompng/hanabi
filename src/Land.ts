type AxisInfo = { min: number; max: number; step: number }
type Vert = Record<'i' | 'j' | 'x' | 'y' | 'z' | 'nx' | 'ny' | 'nz', number>
function normalize([nx, ny, nz]: [number, number, number]) {
  const nr = Math.hypot(nx, ny, nz)
  return [nx / nr, ny / nr, nz / nr] as const
}
function norm(a: Vert, b: Vert, c: Vert) {
  return normalize([
    (b.y - a.y) * (c.z - a.z) - (b.z - a.z) * (c.y - a.y),
    (b.z - a.z) * (c.x - a.x) - (b.x - a.x) * (c.z - a.z),
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
  ])
}

type Triangle = {
  a: Vert
  b: Vert
  c: Vert
  ab?: Vert
  bc?: Vert
  ca?: Vert
}

export class Land {
  baseTriangles: Triangle[] = []
  constructor(public xaxis: AxisInfo, public yaxis: AxisInfo, public zmin: number, public zfunc: (x: number, y: number) => number) {
    this.generateBaseTriangles()
  }
  generateBaseTriangles() {
    const { xaxis, yaxis, zmin, zfunc } = this
    const vertices: Vert[][] = [...new Array(xaxis.step + 1)].map((_, i) => {
      return [...new Array(yaxis.step + 1)].map((_, j) => {
        const x = i == 0 ? xaxis.min : i == xaxis.step ? xaxis.max : xaxis.min + (xaxis.max - xaxis.min) * (i + 0.1 + 0.8 * Math.random()) / (xaxis.step + 1)
        const y = j == 0 ? yaxis.min : j == yaxis.step ? yaxis.max : yaxis.min + (yaxis.max - yaxis.min) * (j + 0.1 + 0.8 * Math.random()) / (yaxis.step + 1)
        return { i, j, x, y, z: zfunc(x, y), nx: 0, ny: 0, nz: 0 }
      })
    })
    const dirs = [[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]] as const
    for (let i = 0; i <= xaxis.step; i++) {
      for (let j = 0; j <= yaxis.step; j++) {
        const va = vertices[i][j]
        let sumnx = 0, sumny = 0, sumnz = 0
        dirs.forEach(([di1, dj1], k) => {
          const [di2, dj2] = dirs[(k + 1) % 8]
          const vb = vertices[i + di1]?.[j + dj1]
          const vc = vertices[i + di2]?.[j + dj2]
          if (!vb || !vc) return
          const [nx, ny, nz] = norm(va, vb, vc)
          sumnx += nx
          sumny += ny
          sumnz += nz
        })
        const [nx, ny, nz] = normalize([sumnx, sumny, sumnz])
        va.nx = nx
        va.ny = ny
        va.nz = nz
      }
    }
    const triangles: Triangle[] = []
    const tpairs = new Map<string, Vert>()
    const tpkey = (a: Vert, b: Vert) => [a.i, a.j, b.i, b.j].join('-')
    const addTriangle = (a: Vert, b: Vert, c: Vert) => {
      if (a.z < zmin && b.z < zmin && c.z < zmin) return
      tpairs.set(tpkey(a, b), c)
      tpairs.set(tpkey(b, c), a)
      tpairs.set(tpkey(c, a), b)
      this.baseTriangles.push({ a, b, c })
    }
    for (let i = 0; i < xaxis.step; i++) {
      for (let j = 0; j < yaxis.step; j++) {
        const v00 = vertices[i][j]
        const v10 = vertices[i + 1][j]
        const v01 = vertices[i][j + 1]
        const v11 = vertices[i + 1][j + 1]
        const l1 = Math.hypot(v10.x - v01.x, v10.y - v01.y)
        const l2 = Math.hypot(v00.x - v11.x, v00.y - v11.y)
        if (l1 < l2) {
          addTriangle(v00, v10, v01)
          addTriangle(v01, v10, v11)
        } else {
          addTriangle(v00, v10, v11)
          addTriangle(v00, v11, v01)
        }
      }
    }
    this.baseTriangles.forEach(t => {
      t.ab = tpairs.get(tpkey(t.b, t.a))
      t.bc = tpairs.get(tpkey(t.c, t.b))
      t.ca = tpairs.get(tpkey(t.a, t.c))
    })
  }
  generateDetailedTriangles() {
    type P = [number, number]
    const output: [P, P, P][] = []
    const t = 0.8
    const s = (1 + t) / 2
    function f(a: Vert, b: Vert, c: Vert, bc?: Vert) {
      const ux = (a.x + b.x + c.x) / 3 * (1 - t)
      const uy = (a.y + b.y + c.y) / 3 * (1 - t)
      if (!bc) {
        const a2 = { x: a.x * s + (1 - s) * b.x, y: a.y * s + (1 - s) * b.y }
        const b2 = { x: b.x * s + (1 - s) * a.x, y: b.y * s + (1 - s) * a.y }
        output.push([[a.x, a.y], [a.x * t + ux, a.y * t + uy], [a2.x, a2.y]])
        output.push([[a2.x, a2.y], [a.x * t + ux, a.y * t + uy], [b.x * t + ux, b.y * t + uy]])
        output.push([[a2.x, a2.y], [b.x * t + ux, b.y * t + uy], [b2.x, b2.y]])
        output.push([[b2.x, b2.y], [b.x * t + ux, b.y * t + uy], [b.x, b.y]])
      } else {
        const vx = (a.x + b.x + bc.x) / 3 * (1 - t)
        const vy = (a.y + b.y + bc.y) / 3 * (1 - t)
        output.push([[a.x * t + ux, a.y * t + uy], [b.x * t + ux, b.y * t + uy], [b.x * t + vx, b.y * t + vy]])
        output.push([[b.x, b.y], [b.x * t + vx, b.y * t + vy], [b.x * t + ux, b.y * t + uy]])
      }
    }
    this.baseTriangles.forEach(({ a, b, c, ab, bc, ca }) => {
      const sx = (a.x + b.x + c.x) / 3 * (1 - t)
      const sy = (a.y + b.y + c.y) / 3 * (1 - t)
      output.push([[a.x * t + sx, a.y * t + sy], [b.x * t + sx, b.y * t + sy], [c.x * t + sx, c.y * t + sy]])
      f(a, b, c, ab)
      f(b, c, a, bc)
      f(c, a, b, ca)
    })
    return output
  }
  show() {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = canvas.height = 2048
    ctx.scale(4, 4)
    this.generateDetailedTriangles().forEach(([a, b, c]) => {
      ctx.beginPath()
      ctx.moveTo(...a)
      ctx.lineTo(...b)
      ctx.lineTo(...c)
      ctx.lineJoin = 'round'
      ctx.closePath()
      ctx.globalAlpha = 0.2
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.stroke()
    })
    document.body.appendChild(canvas)
  }
}

