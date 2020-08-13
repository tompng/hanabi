#include <hanabi_util>
#include <base_params>
uniform float curveDelay;
uniform float widthStart;
uniform float widthEnd;
varying vec2 coord;
varying float brightness;
const float particleFriction = 32.0;
#define STOP
#ifdef STOP
const float stopTime = 0.4;
#endif

void main(){
  float burnRate = 1.0 + burnRateRandom * burnRateRandomness;
  if (time - curveDelay > duration * burnRate) return;
  #ifdef STOP
    if (time - curveDelay > stopTime * burnRate) return;
  #endif
  float t = position.x;
  float u = position.y;
  vec3 v0 = baseVelocity + velocityScale * direction * (1.0 + speedRandom * speedRandomness);
  float delay = t * min(time, curveDelay);
  float t2 = time - delay;
  float friction2 = friction * (1.0 + frictionRandom * frictionRandomness);
  vec3 v1 = velocityAt(v0, friction2, t2);
  vec3 gpos = center + positionAt(v0, friction2, t2) + positionAt(v1, particleFriction, delay);
  vec3 v = velocityAt(v0, friction2, t2) + velocityAt(v1, particleFriction, delay);
  #ifdef BEE
    float bt = t2 - beeStart * burnRate;
    if (bt > 0.0) {
      float k = beeDecay * (1.0 + beeDecayRandom * beeDecayRandomness);
      float speed = beeSpeed * (1.0 + beeSpeedRandom * beeSpeedRandomness);
      gpos += beePositionAt(k, bt) * beeDirection * speed;
      v += beeVelocityAt(k, bt) * beeDirection * speed;
    }
  #endif
  float width = mix(widthStart, widthEnd, t);
  vec3 n = normalize(cross(v, gpos - cameraPosition)) * width;
  coord = vec2(2.0 * t - 1.0, u);
  brightness = max(1.0 - time / duration / burnRate, 0.0);
  #ifdef STOP
    if (t2 > stopTime * burnRate) brightness = 0.0;
  #endif
  gl_Position = projectionMatrix * viewMatrix * vec4(gpos + u * n, 1);
}
