varying vec2 coord;
varying float brightness;
#ifdef COLORS
varying vec3 color;
#else
uniform vec3 color;
#endif
void main(){
  float alpha = max(1.0 - dot(coord, coord), 0.0);
  gl_FragColor = vec4(brightness * alpha * color, 1);
}
