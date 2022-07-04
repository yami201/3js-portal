

void main() {
    float distanceFromCenter = distance(gl_PointCoord,vec2(0.5));
    float strength = 0.05/distanceFromCenter - 0.1;
    gl_FragColor = vec4(vec3(1.0),strength);
}