#include <hanabi_util>
#include <base_params>
#include <blink_params>
const float size = 0.02;
const float resolution = 800.0;
varying float brightness;

void main() {
  float burnRate = 1.0 + burnRateRandom * burnRateRandomness;
  if (time > duration * burnRate) return;
  vec3 v0 = baseVelocity + velocityScale * direction * (1.0 + speedRandom * speedRandomness);
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
  float fPointSize = resolution * size / distance(cameraPosition, gpos);
  gl_PointSize = clamp(2.0, fPointSize, 16.0);
  brightness = max(1.0 - time / duration / burnRate, 0.0) * fPointSize / gl_PointSize;
  #ifdef BLINK
    if (time > blinkStart * burnRate) {
      float t = time / blinkRate / (1.0 + blinkRateRandom * blinkRateRandomness) - blinkPhase;
      brightness *= step(0.5, t - floor(t));
    }
  #endif
  gl_Position = projectionMatrix * viewMatrix * vec4(gpos, 1);
}
