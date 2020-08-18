export type N3D = [number, number, number]

export function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function sphereRandom(): N3D {
  while (true) {
    const x = 2 * Math.random() - 1
    const y = 2 * Math.random() - 1
    const z = 2 * Math.random() - 1
    if (x * x + y * y + z * z < 1) return [x, y, z]
  }
}

export function sphereSurfaceRandom(): N3D {
  const [x, y, z] = sphereRandom()
  const r = Math.hypot(x, y, z)
  return [x / r, y / r, z / r]
}

export function evenSpherePoints(step: number, randomness: number = 0) { // N = 20 * step ** 2
  const th = Math.PI / 5
  const raxis = 1 / Math.sin(th) / 2
  const h = Math.sqrt(1 - raxis ** 2)
  const r = 1 / h / 2
  const coords: N3D[] = []
  for (let i = 0; i < 5; i++) {
    const c = Math.cos(2 * th * i)
    const s = Math.sin(2 * th * i)
    coords.push([r - h, raxis * c, raxis * s])
  }
  const rcoords = coords.map(([x, y, z]) => [-x, -y, -z] as N3D)
  const edge: N3D = [r, 0, 0]
  const redge: N3D = [-r, 0, 0]
  const points: N3D[] = []
  function addTriangle([ax, ay, az]: N3D, [bx, by, bz]: N3D, [cx, cy, cz]: N3D) {
    let n = 2 * step - 1
    for (let j = 0; j < step; j++) {
      for (let i = 0; i < n - 2 * j; i++) {
        let s = Math.random() 
        let t = Math.random()
        if (s + t > 1) {
          s = 1 - s
          t = 1 - t
        }
        s = (1 / 3 * (1 - randomness) + s * randomness + (i - i % 2) / 2) / step
        t = (1 / 3 * (1 - randomness) + t * randomness) / step
        if (i % 2 == 0) {
          t += j / step
        } else {
          t = (j + 1) / step - t
        }
        points.push([
          ax + (bx - ax) * s + (cx - ax) * t,
          ay + (by - ay) * s + (cy - ay) * t,
          az + (bz - az) * s + (cz - az) * t
        ])
      }
    }
  }
  for (let i = 0; i < 5; i++) {
    addTriangle(edge, coords[i], coords[(i + 1) % 5])
      addTriangle(redge, rcoords[i], rcoords[(i + 1) % 5])
      addTriangle(coords[i], rcoords[(i + 2) % 5], rcoords[(i + 3) % 5])
      addTriangle(rcoords[i], coords[(i + 2) % 5], coords[(i + 3) % 5])
  }
  points.forEach(p => {
    const [x, y, z] = p
    const r = Math.hypot(x, y, z)
    p[0] = x / r
    p[1] = y / r
    p[2] = z / r
  })
  return points
}

export function randomRotatePoints(points: N3D[]) {
  const th1 = 2 * Math.PI * Math.random()
  const th2 = 2 * Math.PI * Math.random()
  const th3 = 2 * Math.PI * Math.random()
  const c1 = Math.cos(th1), s1 = Math.sin(th1)
  const c2 = Math.cos(th2), s2 = Math.sin(th2)
  const c3 = Math.cos(th3), s3 = Math.sin(th3)
  points.forEach(p => {
    const [x, y, z] = p
    const x1 = x * c1 - y * s1
    const y1 = x * s1 + y * c1
    const y2 = y1 * c2 - z * s2
    const z2 = y1 * s2 + z * c2
    const z3 = z2 * c3 - x1 * s3
    const x3 = z2 * s3 + x1 * c3
    p[0] = x3
    p[1] = y2
    p[2] = z3
  })
}

/*
v' = -g-a(v-w)
v = w+(k*exp(-a*t)-g)/a
v = w+(g/a+(v0-w))*exp(-a*t)-g/a
x = (w-g/a)t-(g+a(v0-w))/aa*(exp(-a*t)-1)
*/
export const wind: N3D = [1, 0, 0]
export const gravity = -9.8;
export function velocityAt([vx, vy, vz]: N3D, k: number, t: number): N3D {
  const e = Math.exp(-k * t)
  const [wx, wy, wz] = wind
  return [
    wx + (vx - wx) * e,
    wy + (vy - wy) * e,
    wz + gravity / k + (vz - wz - gravity / k) * e
  ]
}

export function peakTime(vz: number, k: number): number {
  const wz = wind[2]
  const e = -(wz + gravity / k) / (vz - wz - gravity / k)
  const t = -Math.log(e) / k
  return t
}

export function positionAt([vx, vy, vz]: N3D, k: number, t: number): N3D {
  const e = Math.exp(-k * t)
  const [wx, wy, wz] = wind
  return [
    wx * t - (vx - wx) * (e - 1) / k,
    wy * t - (vy - wy) * (e - 1) / k,
    (wz + gravity / k) * t - (vz - wz - gravity / k) * (e - 1) / k
  ]
}

export function beePositionAt(k: number, t: number) {
  return (1.0 - (k * t + 1.0) * Math.exp(-k * t)) / k;
}

export function beeVelocityAt(k: number, t: number) {
  return k * t * Math.exp(-k * t);
}

export function spiralPositionAt(k: number, w: number, t: number) {
  const e = Math.exp(-k * t)
  return {
    x: (1 - (k * t + 1) * e * Math.cos(w * t)) / k,
    y: w * e * Math.sin(w * t) / k
  }
}

export function spiralVelocityAt(k: number, w: number, t: number) {
  const e = Math.exp(-k * t)
  return {
    x: (k - w * w / k) * t * e * Math.cos(w * t),
    y: -2 * w * t * e * Math.sin(w * t)
  }
}
