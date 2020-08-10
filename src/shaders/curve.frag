varying vec2 coord;
uniform vec3 color;
void main(){
  float alpha = max(1.0 - dot(coord, coord), 0.0);
  gl_FragColor = vec4(alpha * color, 1);
}
