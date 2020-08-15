const float pi = 3.14159265358979323846;
const vec3 wind = vec3(0.5, 0, 0);
const vec3 gravity = vec3(0, 0, -9.8);
vec3 velocityAt(vec3 v0, float k, float t) {
  return wind + gravity / k + (v0 - wind - gravity / k) * exp(-k * t);
}

vec3 positionAt(vec3 v0, float k, float t) {
  return (wind + gravity / k) * t - (v0 - wind - gravity / k) / k * (exp(-k * t) - 1.0);
}

float beePositionAt(float k, float t) {
  return (1.0 - (k * t + 1.0) * exp(-k * t)) / k;
}

float beeVelocityAt(float k, float t) {
  return k * t * exp(-k * t);
}

vec2 spiralPositionAt(float k, float w, float t) {
  return (vec2(1, 0) - (vec2(k, -w) * t + vec2(1, 0)) * exp(-k * t) * sin(vec2(w * t + pi / 2.0, w * t))) / k;
}

vec2 spiralVelocityAt(float k, float w, float t) {
  return vec2(k - w * w / k, -2.0 * w) * t * exp(-k * t) * sin(vec2(w * t + pi / 2.0, w * t));
}

#ifdef COLORS
// safari: "'first-class array' : not supported"
uniform vec3 color0;
#if COLORS > 1
uniform vec3 color1;
#endif
#if COLORS > 2
uniform vec3 color2;
#endif
#if COLORS > 3
uniform vec3 color3;
#endif
#if COLORS > 4
uniform vec3 color4;
#endif
#if COLORS > 5
uniform vec3 color5;
#endif
vec3 interpolateColor(float t) {
  #if COLORS == 1
    return color0;
  #else
    float i = clamp(t, 0.0, 0.999) * float(COLORS - 1);
    float s = smoothstep(0.0, 1.0, mod(i, 1.0));
    #if COLORS >= 2
    if (i < 1.0) return mix(color0, color1, s);
    #endif
    #if COLORS >= 3
    if (i < 2.0) return mix(color1, color2, s);
    #endif
    #if COLORS >= 4
    if (i < 3.0) return mix(color2, color3, s);
    #endif
    #if COLORS >= 5
    if (i < 4.0) return mix(color3, color4, s);
    #endif
    #if COLORS >= 6
    if (i < 5.0) return mix(color4, color5, s);
    #endif
  #endif
}
#endif
