#include <hanabi_util>
#include <base_params>
#include <blink_params>
#include <particle_params>

varying float brightness;
#ifdef COLORS
varying vec3 color;
#endif

void main() {
  float burnRate = 1.0 + burnRateRandom * burnRateRandomness;
  float pduration = particleDuration * (1.0 + particleDurationRandom * particleDurationRandomness);
  float stime = stopTime * burnRate;
  float t2 = time - stime;
  if (t2 < 0.0 || pduration < t2) return;
  vec3 v0 = speed * direction * (1.0 + speedRandom * speedRandomness);
  #ifdef ROTATION
    v0 = rotationMatrix * v0;
  #endif
  v0 += baseVelocity;
  float friction2 = friction * (1.0 + frictionRandom * frictionRandomness);
  vec3 pv0 = velocityAt(v0, friction2, stime) + particleDirection * particleSpeed * (1.0 + particleSpeedRandom * particleSpeedRandomness);
  float pfriction2 = particleFriction * (1.0 + particleFrictionRandom * particleFrictionRandomness);
  vec3 gpos = center + positionAt(v0, friction2, stime) + positionAt(pv0, pfriction2, t2);
  #ifdef BEE
    float bt = stime - beeStart * burnRate;
    if (bt > 0.0) {
      float k = beeDecay * (1.0 + beeDecayRandom * beeDecayRandomness);
      float speed = beeSpeed * (1.0 + beeSpeedRandom * beeSpeedRandomness);
      gpos += beePositionAt(k, bt) * beeDirection * speed;
    }
  #endif
  float fPointSize = resolution * size / distance(cameraPosition, gpos);
  gl_PointSize = clamp(2.0, fPointSize, 16.0);
  float phase = t2 / pduration;
  brightness = (1.0 - phase) * fPointSize / gl_PointSize;
  #ifdef BLINK
    if (time > blinkStart * burnRate) {
      float t = t2 / blinkRate / (1.0 + blinkRateRandom * blinkRateRandomness) - blinkPhase;
      if (t - floor(t) < 0.5) return;
    }
  #endif
  #ifdef COLORS
    color = interpolateColor(phase);
  #endif
  gl_Position = projectionMatrix * viewMatrix * vec4(gpos, 1);
}
