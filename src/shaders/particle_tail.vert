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
  if (time > duration * burnRate) return;
  vec3 v0 = speed * direction * (1.0 + speedRandom * speedRandomness);
  #ifdef ROTATION
    v0 = rotationMatrix * v0;
  #endif
  v0 += baseVelocity;
  float friction2 = friction * (1.0 + frictionRandom * frictionRandomness);
  float rate = particleDuration * (1.0 + particleDurationRandom * particleDurationRandomness);
  float t2 = time + particlePhase * rate;
  float t = rate * floor(t2 / rate) - particlePhase * rate;
  t2 = time - t;
  if (t < 0.0) return;
  #ifdef STOP
    if (t > stopTime * burnRate) return;
  #endif
  vec3 pv0 = velocityAt(v0, friction2, t) + particleDirection * particleSpeed * (1.0 + particleSpeedRandom * particleSpeedRandomness);
  float pfriction2 = particleFriction * (1.0 + particleFrictionRandom * particleFrictionRandomness);
  vec3 gpos = center + positionAt(v0, friction2, t) + positionAt(pv0, pfriction2, t2);
  #ifdef BEE
    float bt = t - beeStart * burnRate;
    if (bt > 0.0) {
      float k = beeDecay * (1.0 + beeDecayRandom * beeDecayRandomness);
      float speed = beeSpeed * (1.0 + beeSpeedRandom * beeSpeedRandomness);
      gpos += beePositionAt(k, bt) * beeDirection * speed;
    }
  #endif
  float fPointSize = resolution * size / distance(cameraPosition, gpos);
  gl_PointSize = clamp(fPointSize, 2.0, 16.0);
  float phase = t / duration / burnRate;
  brightness = fPointSize / gl_PointSize * (1.0 - t2 / rate);
  #ifndef COLORS
    brightness *= max(1.0 - t / duration / burnRate, 0.0);
  #endif
  #ifdef BLINK
    if (t > blinkStart * burnRate) {
      float tb = t2 / blinkRate / (1.0 + blinkRateRandom * blinkRateRandomness) - blinkPhase;
      if (tb - floor(tb) < 0.5) return;
    }
  #endif
  #ifdef COLORS
    color = interpolateColor(phase);
  #endif
  gl_Position = projectionMatrix * viewMatrix * vec4(gpos, 1);
}
