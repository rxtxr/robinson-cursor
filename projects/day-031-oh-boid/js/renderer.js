/**
 * WebGL2 renderer for 3D boid particles.
 * Instanced billboard quads, orbit camera.
 */

// --- Boid shader ---
const VERT = `#version 300 es
precision highp float;

in vec2 a_quad;
in vec3 a_pos;
in vec3 a_vel;

uniform mat4 u_view;
uniform mat4 u_proj;
uniform float u_baseSize;

out float v_depth;
out float v_speed;
out vec2 v_uv;

void main() {
    vec4 viewPos = u_view * vec4(a_pos, 1.0);
    float dist = -viewPos.z;
    float size = u_baseSize * 2.5;

    viewPos.xy += a_quad * size;
    gl_Position = u_proj * viewPos;

    v_depth = clamp(dist / 1400.0, 0.0, 1.0);
    v_speed = length(a_vel);
    v_uv = a_quad;
}
`;

const FRAG = `#version 300 es
precision highp float;

in float v_depth;
in float v_speed;
in vec2 v_uv;
out vec4 fragColor;

void main() {
    float r = dot(v_uv, v_uv);
    if (r > 1.0) discard;

    float alpha = smoothstep(1.0, 0.6, r);

    float fog = 1.0 - v_depth;
    vec3 nearCol = vec3(0.12, 0.13, 0.14);
    vec3 farCol  = vec3(0.45, 0.46, 0.47);
    vec3 col = mix(farCol, nearCol, fog);

    float sp = clamp(v_speed / 6.0, 0.0, 1.0);
    col += sp * vec3(0.03, 0.03, 0.04);

    alpha *= mix(0.15, 0.95, fog);

    fragColor = vec4(col, alpha);
}
`;

// --- Background shader ---
const BG_V = `#version 300 es
in vec2 a_p;
out vec2 v_uv;
void main() {
    v_uv = a_p * 0.5 + 0.5;
    gl_Position = vec4(a_p, 0.999, 1.0);
}`;

const BG_F = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform float u_time;

float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p = rot * p * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = v_uv;
    float t = u_time * 0.012;

    vec3 skyTop = vec3(0.48, 0.49, 0.51);
    vec3 skyBot = vec3(0.56, 0.55, 0.54);
    vec3 sky = mix(skyBot, skyTop, uv.y);

    vec2 p1 = uv * vec2(1.4, 0.9) + vec2(t * 0.25, t * 0.04);
    float c1 = fbm(p1);
    vec2 p2 = uv * vec2(1.8, 1.1) + vec2(-t * 0.15 + 5.3, t * 0.06 + 2.7);
    float c2 = fbm(p2);

    float clouds = c1 * 0.55 + c2 * 0.45;
    clouds = smoothstep(0.28, 0.72, clouds);

    vec3 lightGrey = vec3(0.64, 0.64, 0.65);
    vec3 darkGrey  = vec3(0.38, 0.39, 0.40);
    vec3 cloudCol = mix(darkGrey, lightGrey, clouds);

    vec3 col = mix(sky, cloudCol, 0.75);
    col *= 0.92 + 0.08 * (1.0 - uv.y);

    float grain = hash(floor(uv * vec2(640.0, 360.0)) + fract(u_time * 5.1));
    col += (grain - 0.5) * 0.0125;

    fragColor = vec4(col, 1.0);
}
`;

// --- Utility ---

function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        return null;
    }
    return s;
}

function link(gl, vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(p));
    }
    return p;
}

function perspective(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0,
    ]);
}

function lookAt(eye, center, up) {
    const zx = eye[0] - center[0], zy = eye[1] - center[1], zz = eye[2] - center[2];
    let len = 1 / Math.sqrt(zx * zx + zy * zy + zz * zz);
    const fz = [zx * len, zy * len, zz * len];

    const sx = up[1] * fz[2] - up[2] * fz[1];
    const sy = up[2] * fz[0] - up[0] * fz[2];
    const sz = up[0] * fz[1] - up[1] * fz[0];
    len = 1 / Math.sqrt(sx * sx + sy * sy + sz * sz);
    const fs = [sx * len, sy * len, sz * len];

    const ux = fz[1] * fs[2] - fz[2] * fs[1];
    const uy = fz[2] * fs[0] - fz[0] * fs[2];
    const uz = fz[0] * fs[1] - fz[1] * fs[0];

    return new Float32Array([
        fs[0], ux, fz[0], 0,
        fs[1], uy, fz[1], 0,
        fs[2], uz, fz[2], 0,
        -(fs[0]*eye[0]+fs[1]*eye[1]+fs[2]*eye[2]),
        -(ux*eye[0]+uy*eye[1]+uz*eye[2]),
        -(fz[0]*eye[0]+fz[1]*eye[1]+fz[2]*eye[2]),
        1,
    ]);
}

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
        if (!gl) throw new Error('WebGL2 not supported');
        this.gl = gl;

        this.prog = link(gl, VERT, FRAG);
        this.u_view = gl.getUniformLocation(this.prog, 'u_view');
        this.u_proj = gl.getUniformLocation(this.prog, 'u_proj');
        this.u_baseSize = gl.getUniformLocation(this.prog, 'u_baseSize');

        this.bgProg = link(gl, BG_V, BG_F);
        this.u_bgTime = gl.getUniformLocation(this.bgProg, 'u_time');

        // --- Billboard quad VAO (instanced) ---
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const quadVerts = new Float32Array([
            -1, -1,  1, -1,  -1, 1,
            -1,  1,  1, -1,   1, 1,
        ]);
        const quadBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
        gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);
        const aQuad = gl.getAttribLocation(this.prog, 'a_quad');
        gl.enableVertexAttribArray(aQuad);
        gl.vertexAttribPointer(aQuad, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(aQuad, 0);

        this.posBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
        const aPos = gl.getAttribLocation(this.prog, 'a_pos');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(aPos, 1);

        this.velBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.velBuf);
        const aVel = gl.getAttribLocation(this.prog, 'a_vel');
        gl.enableVertexAttribArray(aVel);
        gl.vertexAttribPointer(aVel, 3, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(aVel, 1);

        gl.bindVertexArray(null);

        // --- BG fullscreen quad ---
        this.bgVao = gl.createVertexArray();
        gl.bindVertexArray(this.bgVao);
        const bgBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bgBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
        const aP = gl.getAttribLocation(this.bgProg, 'a_p');
        gl.enableVertexAttribArray(aP);
        gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
        gl.bindVertexArray(null);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        this.posArr = null;
        this.velArr = null;

        this.camDist = 500;
        this.camTheta = 0.3;
        this.camPhi = 0.3;
        this.baseSize = 3.0;
        this.autoRotate = true;
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        if (this.canvas.width !== w * dpr || this.canvas.height !== h * dpr) {
            this.canvas.width = w * dpr;
            this.canvas.height = h * dpr;
        }
        return { w, h, pw: w * dpr, ph: h * dpr };
    }

    render(flock, time) {
        const { w, h, pw, ph } = this.resize();
        const gl = this.gl;
        gl.viewport(0, 0, pw, ph);

        // BG – cloudy sky
        gl.disable(gl.DEPTH_TEST);
        gl.useProgram(this.bgProg);
        gl.uniform1f(this.u_bgTime, time * 0.001);
        gl.bindVertexArray(this.bgVao);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Camera
        if (this.autoRotate) {
            this.camTheta += 0.0008;
        }
        const ct = this.camTheta, cp = this.camPhi, cd = this.camDist;
        const eye = [
            Math.cos(cp) * Math.sin(ct) * cd,
            Math.sin(cp) * cd,
            Math.cos(cp) * Math.cos(ct) * cd,
        ];
        const view = lookAt(eye, [0, 0, 0], [0, 1, 0]);
        const proj = perspective(Math.PI / 3, w / h, 0.5, 4000);

        // Upload instance data
        const n = flock.count;
        if (!this.posArr || this.posArr.length < n * 3) {
            this.posArr = new Float32Array(n * 3);
            this.velArr = new Float32Array(n * 3);
        }
        for (let i = 0; i < n; i++) {
            this.posArr[i * 3]     = flock.px[i];
            this.posArr[i * 3 + 1] = flock.py[i];
            this.posArr[i * 3 + 2] = flock.pz[i];
            this.velArr[i * 3]     = flock.vx[i];
            this.velArr[i * 3 + 1] = flock.vy[i];
            this.velArr[i * 3 + 2] = flock.vz[i];
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
        gl.bufferData(gl.ARRAY_BUFFER, this.posArr, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.velBuf);
        gl.bufferData(gl.ARRAY_BUFFER, this.velArr, gl.DYNAMIC_DRAW);

        // Boids
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(false);
        gl.useProgram(this.prog);
        gl.uniformMatrix4fv(this.u_view, false, view);
        gl.uniformMatrix4fv(this.u_proj, false, proj);
        gl.uniform1f(this.u_baseSize, this.baseSize);
        gl.bindVertexArray(this.vao);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, n);
        gl.depthMask(true);
        gl.bindVertexArray(null);
    }
}
