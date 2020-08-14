#include <hanabi_util>
#include <base_params>
#include <blink_params>
uniform float size;
const float resolution = 800.0;
varying float brightness;
#ifdef COLORS
varying vec3 color;
#endif
#ifdef LAST_FLASH
uniform float lastFlashDuration;
uniform float lastFlashSize;
uniform vec3 lastFlashColor;
varying vec3 lfcolor;
#endif

void main() {
  float burnRate = 1.0 + burnRateRandom * burnRateRandomness;
  if (time > duration * burnRate) return;
  #ifdef STOP
    if (time > stopTime * burnRate) return;
  #endif
  vec3 v0 = speed * direction * (1.0 + speedRandom * speedRandomness);
  #ifdef ROTATION
    v0 = rotationMatrix * v0;
  #endif
  v0 += baseVelocity;
  float friction2 = friction * (1.0 + frictionRandom * frictionRandomness);
  vec3 gpos = center + positionAt(v0, friction2, time);
  #ifdef BEE
    float bt = time - beeStart * burnRate;
    if (bt > 0.0) {
      float k = beeDecay * (1.0 + beeDecayRandom * beeDecayRandomness);
      float speed = beeSpeed * (1.0 + beeSpeedRandom * beeSpeedRandomness);
      gpos += beePositionAt(k, bt) * beeDirection * speed;
    }
  #endif
  #ifdef LAST_FLASH
    float lastFlash = clamp((duration - time / burnRate) / lastFlashDuration, 0.0, 1.0);
    lastFlash *= 4.0 * (1.0 - lastFlash);
    lastFlash *= lastFlash;
    lfcolor = lastFlash * lastFlashColor;
    float fPointSize = (size + lastFlashSize * lastFlash) * resolution / distance(cameraPosition, gpos);
  #else
    float fPointSize = size * resolution / distance(cameraPosition, gpos);
  #endif
  gl_PointSize = clamp(fPointSize, 2.0, 16.0);
  float phase = time / duration / burnRate;
  brightness = max(1.0 - phase, 0.0) * fPointSize / gl_PointSize;
  #ifdef BLINK
    if (time > blinkStart * burnRate) {
      float t = time / blinkRate / (1.0 + blinkRateRandom * blinkRateRandomness) - blinkPhase;
      if (t - floor(t) < 0.5) return;
    }
  #endif
  #ifdef COLORS
    color = interpolateColor(phase);
  #endif
  gl_Position = projectionMatrix * viewMatrix * vec4(gpos, 1);
}
