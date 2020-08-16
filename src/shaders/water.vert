// uniform sampler2D wave;
varying vec2 pos2d;
void main() {
  vec4 gpos = modelMatrix * vec4(position * 64.0, 1);
  pos2d = gpos.xy;
  gl_Position = projectionMatrix * viewMatrix * gpos;
}