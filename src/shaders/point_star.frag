varying float brightness;
#ifdef COLORS
varying vec3 color;
#else
uniform vec3 color;
#endif
#ifdef LAST_FLASH
varying vec3 lfcolor;
#endif
void main() {
  vec2 coord = 2.0 * gl_PointCoord.xy - vec2(1);
  float r2 = dot(coord, coord);
  #ifdef LAST_FLASH
    gl_FragColor = vec4((color + lfcolor) * (1.0 - r2) * brightness, 1);
  #else
    gl_FragColor = vec4(color * (1.0 - r2) * brightness, 1);
  #endif
}
