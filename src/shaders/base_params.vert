attribute float burnRateRandom;
attribute vec3 direction;
attribute float frictionRandom;
attribute float speedRandom;
const float speedRandomness = 0.1;
const float frictionRandomness = 0.4;
const float burnRateRandomness = 0.2;
uniform vec3 center;
uniform vec3 baseVelocity;
uniform float velocityScale;
uniform float friction;
uniform float duration;
uniform float time;
#ifdef BEE
attribute vec3 beeDirection;
attribute float beeSpeedRandom;
attribute float beeDecayRandom;
const float beeDecayRandomness = 0.2;
const float beeSpeedRandomness = 0.2;
const float beeDecay = 16.0;
const float beeSpeed = 8.0;
const float beeStart = 0.1;
#endif