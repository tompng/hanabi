attribute float burnRateRandom;
attribute vec3 direction;
attribute float frictionRandom;
attribute float speedRandom;
uniform float speedRandomness;
uniform float frictionRandomness;
uniform float burnRateRandomness;
uniform vec3 center;
uniform vec3 baseVelocity;
uniform float speed;
uniform float friction;
uniform float duration;
uniform float time;
#ifdef ROTATION
uniform mat3 rotationMatrix;
#endif
#ifdef STOP
uniform float stopTime;
#endif
#ifdef BEE
attribute vec3 beeDirection;
attribute float beeSpeedRandom;
attribute float beeDecayRandom;
uniform float beeDecayRandomness;
uniform float beeSpeedRandomness;
uniform float beeDecay;
uniform float beeSpeed;
uniform float beeStart;
#endif