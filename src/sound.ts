import { sample } from './util'

export const audioContext: AudioContext | undefined = (() => {
  try {
    if (window.AudioContext) return new window.AudioContext()
    return new (window as any).webkitAudioContext()
  } catch (e) {}
})()

export function waveToDataURL(wave: number[] | Float32Array) {
  const f = (n: number) => '%' + (n >> 4).toString(16) + (n & 0xf).toString(16)
  const f2 = (n: number) => f(n & 0xff) + f(n >> 8)
  const f4 = (n: number) => f2(n & 0xffff) + f2(n >> 16)
  const wdata: string[] = []
  wave.forEach((v: number) => {
    v = Math.round(0x8000 * v);
    wdata.push(f2(v > 0x7fff ? 0x7fff : v < -0x7fff ? 0x8000 : v < 0 ? v + 0x10000 : v))
  })
  return 'data:audio/wav,' + [
    'RIFF',
    f4(wave.length * 2 + 32),
    'WAVEfmt%20',
    f4(16),
    f4(0x10001),
    f4(44100),
    f4(88200),
    f4(0x100004),
    'data',
    f4(wave.length * 2),
    wdata.join('')
  ].join('')
}

function createPeriodicBang(length: number) {
  console.log('b')
  const waveData = new Float32Array(length)
  const f = 0.0005
  const ex1 = Math.exp(-1 / 44100 / f)
  const ex2 = ex1 ** 2
  const ex3 = ex1 ** 3
  let s1 = 0, s2 = 0, s3 = 0
  for(let i = 0; i < length; i++) {
    const w = waveData[i] = (2 * Math.random() - 1) * Math.exp(-i / 8000)
    // s1 = s1 * ex1 + w
    // s2 = s3 * ex2 + w
    // s3 = s3 * ex3 + w
  }
  s1 /= (1 - Math.pow(ex1, length))
  s2 /= (1 - Math.pow(ex2, length))
  s3 /= (1 - Math.pow(ex3, length))
  for (let i = 0; i < length; i++) {
    const w = waveData[i]
    s1 = s1 * ex1 + w
    s2 = s3 * ex2 + w
    s3 = s3 * ex3 + w
    waveData[i] = s1 - 4 * s2 + 3 * s3//s1 - s2//4 * s2 + 3 * s3
  }
  console.log(waveData)
  return waveData
}
console.log('a')

function createPeriodicWave(w: number, hz: number, length: number = 44100 * 5) {
  const waveData = new Float32Array(length)
  const th = 2 * Math.PI * hz / 44100
  const ex = Math.exp(-w * hz / 44100 / 2)
  const ac = ex * Math.cos(th)
  const as = ex * Math.sin(th)
  const bc = ex * ac
  const bs = ex * as
  const cc = ex * bc
  const cs = ex * bs
  const scale = Math.sqrt(hz * w)
  let ar = 0, ai = 0
  let br = 0, bi = 0
  let cr = 0, ci = 0
  for(let i = 0; i < length; i++) {
    const r = waveData[i] = 2 * Math.random() - 1
    const _ar = ar
    ar = _ar * ac - ai * as + r
    ai = ai * ac + _ar * as
    const _br = br
    br = _br * bc - bi * bs + r
    bi = bi * bc + _br * bs
    const _cr = cr
    cr = _cr * cc - ci * cs + r
    ci = ci * cc + _cr * cs
  }
  const cosn = Math.cos(length * th)
  const sinn = Math.sin(length * th)
  const acn = Math.pow(ex, length) * cosn
  const asn = Math.pow(ex, length) * sinn
  const bcn = Math.pow(ex, 2 * length) * cosn
  const bsn = Math.pow(ex, 2 * length) * sinn
  const ccn = Math.pow(ex, 3 * length) * cosn
  const csn = Math.pow(ex, 3 * length) * sinn
  const _ar = ar, raa = (1 - acn) ** 2 + asn ** 2
  ar = (_ar * (1 - acn) - ai * asn) / raa
  ai = (ai * (1 - acn) + _ar * asn) / raa
  const _br = br, rbb = (1 - bcn) ** 2 + bsn ** 2
  br = (_br * (1 - bcn) - bi * bsn) / rbb
  bi = (bi * (1 - bcn) + _br * bsn) / rbb
  const _cr = cr, rcc = (1 - ccn) ** 2 + csn ** 2
  cr = (_cr * (1 - ccn) - ci * csn) / rcc
  ci = (ci * (1 - ccn) + _cr * csn) / rcc
  for (let i = 0; i < length; i++) {
    const r = waveData[i]
    const _ar = ar
    ar = _ar * ac - ai * as + r
    ai = ai * ac + _ar * as
    const _br = br
    br = _br * bc - bi * bs + r
    bi = bi * bc + _br * bs
    const _cr = cr
    cr = _cr * cc - ci * cs + r
    ci = ci * cc + _cr * cs
    waveData[i] = (2 * br - ar - cr) * scale
  }
  return waveData
}

function waveScale(wave: Float32Array, length: number, volume: (i: number) => number) {
  const wlen = wave.length
  const output = new Float32Array(length)
  for (let i = 0; i < length; i++) output[i] = volume(i) * wave[i % wlen]
  return output
}

function wavePickScale(wave: Float32Array, length: number, pick: (i: number) => number, volume: (i: number) => number) {
  const wlen = wave.length
  const output = new Float32Array(length)
  function at(i: number) {
    i -= Math.floor(i / wlen) * wlen
    const j = Math.floor(i)
    const t = i - j
    const a = wave[j]
    const b = wave[(j + 1) % wlen]
    const da = (b - wave[(j + wlen - 1) % wlen]) / 2
    const db = (wave[(j + 2) % wlen] - a) / 2
    return a + (b - a) * (3 - 2 * t) * t ** 2 + da * t * (t - 1) ** 2 + db * (t - 1) * t ** 2
  }
  for (let i = 0; i < length; i++) output[i] = volume(i) * at(pick(i))
  return output
}
function normalizeWave(wave: Float32Array) {
  let max = 0
  wave.forEach(v => max = Math.max(max, Math.abs(v)))
  wave.forEach((v, i) => wave[i] = v / max)
  return wave
}

function createPyuSound() {
  const wave = createPeriodicWave(0.1 + 0.05 * Math.random(), 3000, 20000)
  const length = 44100 * 4
  function pick(i: number) {
    const t = i / length
    return (t + 0.2 * t * (1 - t)) * length
  }
  function volume(i: number) {
    const t = i / length
    return t * (1 - t) ** 2
  }
  return normalizeWave(wavePickScale(wave, length, pick, volume))
}

function createBangSound() {
  const wave = createPeriodicBang(44100 * 3)
  const a = normalizeWave(waveScale(wave, 44100 * 3, i => Math.min(Math.exp(-i / 10000))))
  const b = normalizeWave(wavePickScale(wave, 44100 * 3, i => i / 8, i => Math.min(i / 8000, Math.exp(-i / 20000))))
  return a.map((v, i) => v + b[i])
}

const bangSounds = [...new Array(4)].map(() => createAudioBufferFloatArray(createBangSound()))
const pyuSounds = [...new Array(2)].map(() => createAudioBufferFloatArray(createPyuSound()))

function createAudioBufferFloatArray(wave: Float32Array) {
  if (!audioContext) return
  const buffer = audioContext.createBuffer(1, wave.length, 44100)
  const cdata = buffer.getChannelData(0)
  wave.forEach((w, i) => cdata[i] = w)
  return buffer
}

const listenerPosition = { x: 0, y: 0, z: 0 }
let muted = true
export function toggleMute(flag?: boolean) {
  if (flag === undefined) flag = !muted
  muted = flag
  if (muted) {
    audioContext?.suspend()
  } else {
    audioContext?.resume()
  }
  return muted
}

export function playBuffer(buffer: AudioBuffer, volume: number, position: { x: number; y: number; z: number }, rateRandomness: number) {
  if (!audioContext || muted) return
  const source = audioContext.createBufferSource()
  source.buffer = buffer
  const gain = audioContext.createGain()
  const pan = audioContext.createPanner()
  gain.gain.value = volume
  pan.setPosition(position.x, position.y, position.z)
  pan.rolloffFactor = 0.25
  pan.refDistance = 10
  const distance = Math.hypot(
    listenerPosition.x - position.x,
    listenerPosition.y - position.y,
    listenerPosition.z - position.z
  )
  source.connect(gain)
  source.playbackRate.value = 1 + rateRandomness * (2 * Math.random() - 1)
  gain.connect(pan)
  pan.connect(audioContext.destination)
  const speed = 334
  source.start(audioContext.currentTime + distance / speed)
}

type P = { x: number; y: number; z: number }
export function setAudioListener({ position, view, up }: { position: P, view: P, up: P }) {
  if (!audioContext) return
  listenerPosition.x = position.x
  listenerPosition.y = position.y
  listenerPosition.z = position.z
  audioContext.listener.setPosition(position.x, position.y, position.z)
  audioContext.listener.setOrientation(view.x, view.y, view.z, up.x, up.y, up.z)
}
export function playPyu(x: number, y: number, z: number) {
  playBuffer(sample(pyuSounds)!, 0.01, { x, y, z }, 0.1)
}

export function playBang(x: number, y: number, z: number) {
  playBuffer(sample(bangSounds)!, 0.5, { x, y, z }, 0.2)
}
