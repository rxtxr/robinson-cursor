/**
 * 3D boid simulation with organic flocking behavior.
 *
 * Produces complex, deforming clouds via:
 * - spatially coherent curl-noise flow field
 * - density-dependent cohesion (edges shed more easily)
 * - per-boid wander tendency
 * - separation, alignment, cohesion in 3D
 * - 3D spatial hashing
 */

// ---- Simplex-style 3D value noise (fast, no import) ----

function hashf(x, y, z) {
    let h = (x * 374761393 + y * 668265263 + z * 1274126177) | 0;
    h = ((h ^ (h >> 13)) * 1274126177) | 0;
    return (h & 0x7fffffff) / 0x7fffffff; // 0..1
}

function smooth(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

function noise3d(x, y, z) {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    const fx = smooth(x - ix), fy = smooth(y - iy), fz = smooth(z - iz);

    const v000 = hashf(ix, iy, iz);
    const v100 = hashf(ix+1, iy, iz);
    const v010 = hashf(ix, iy+1, iz);
    const v110 = hashf(ix+1, iy+1, iz);
    const v001 = hashf(ix, iy, iz+1);
    const v101 = hashf(ix+1, iy, iz+1);
    const v011 = hashf(ix, iy+1, iz+1);
    const v111 = hashf(ix+1, iy+1, iz+1);

    const x00 = v000 + fx * (v100 - v000);
    const x10 = v010 + fx * (v110 - v010);
    const x01 = v001 + fx * (v101 - v001);
    const x11 = v011 + fx * (v111 - v011);

    const y0 = x00 + fy * (x10 - x00);
    const y1 = x01 + fy * (x11 - x01);

    return y0 + fz * (y1 - y0); // 0..1
}

// Curl of noise field → divergence-free flow (no compression/expansion artifacts)
function curlNoise(x, y, z, scale, time) {
    const s = scale;
    const t = time;
    const e = 0.5; // finite difference epsilon

    // Sample noise at offset positions to compute curl
    const nx = x * s + t;
    const ny = y * s + t * 0.7;
    const nz = z * s + t * 0.5;

    // ∂N3/∂y - ∂N2/∂z
    const cx = (noise3d(nx, ny + e, nz) - noise3d(nx, ny - e, nz)
              - noise3d(nx, ny, nz + e) + noise3d(nx, ny, nz - e)) / (2 * e);
    // ∂N1/∂z - ∂N3/∂x
    const cy = (noise3d(nx, ny, nz + e) - noise3d(nx, ny, nz - e)
              - noise3d(nx + e, ny, nz) + noise3d(nx - e, ny, nz)) / (2 * e);
    // ∂N2/∂x - ∂N1/∂y
    const cz = (noise3d(nx + e, ny, nz) - noise3d(nx - e, ny, nz)
              - noise3d(nx, ny + e, nz) + noise3d(nx, ny - e, nz)) / (2 * e);

    return [cx, cy, cz];
}


export class Flock {
    constructor(count, bounds) {
        this.bounds = bounds;
        this.params = {
            separationWeight: 1.5,
            alignmentWeight: 1.0,
            cohesionWeight: 1.0,
            visualRange: 80,
            separationRange: 28,
            maxSpeed: 3.0,
            minSpeed: 1.2,
            maxForce: 0.12,
            boundaryMargin: 200,
            boundaryForce: 0.2,
            windX: 0, windY: 0, windZ: 0,
            noiseAmount: 0.015,
            curlScale: 0.008,      // spatial frequency of flow field
            curlStrength: 0.06,    // weight of curl-noise contribution
            wanderStrength: 0.04,  // per-boid wander force
            edgeCohesionDrop: 0.7, // cohesion falloff at edges (0=none, 1=full)
            splitThreshold: 3,     // below this neighbor count: near-zero cohesion
        };
        this.count = 0;
        this.px = this.py = this.pz = null;
        this.vx = this.vy = this.vz = null;
        this.time = 0;
        this.setCount(count);
    }

    setCount(count) {
        const old = this.count;
        const b = this.bounds;

        const px = new Float32Array(count);
        const py = new Float32Array(count);
        const pz = new Float32Array(count);
        const vx = new Float32Array(count);
        const vy = new Float32Array(count);
        const vz = new Float32Array(count);
        // Per-boid wander direction (persistent, slowly evolving)
        const wx = new Float32Array(count);
        const wy = new Float32Array(count);
        const wz = new Float32Array(count);

        const copyN = Math.min(old, count);
        if (this.px) {
            px.set(this.px.subarray(0, copyN));
            py.set(this.py.subarray(0, copyN));
            pz.set(this.pz.subarray(0, copyN));
            vx.set(this.vx.subarray(0, copyN));
            vy.set(this.vy.subarray(0, copyN));
            vz.set(this.vz.subarray(0, copyN));
        }
        if (this.wx) {
            wx.set(this.wx.subarray(0, copyN));
            wy.set(this.wy.subarray(0, copyN));
            wz.set(this.wz.subarray(0, copyN));
        }

        for (let i = copyN; i < count; i++) {
            px[i] = (Math.random() - 0.5) * b.x * 1.2;
            py[i] = (Math.random() - 0.5) * b.y * 1.2;
            pz[i] = (Math.random() - 0.5) * b.z * 1.2;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const sp = 1.5 + Math.random() * 1.5;
            vx[i] = Math.sin(phi) * Math.cos(theta) * sp;
            vy[i] = Math.sin(phi) * Math.sin(theta) * sp;
            vz[i] = Math.cos(phi) * sp;
            // random initial wander direction
            const wt = Math.random() * Math.PI * 2;
            const wp = Math.acos(2 * Math.random() - 1);
            wx[i] = Math.sin(wp) * Math.cos(wt);
            wy[i] = Math.sin(wp) * Math.sin(wt);
            wz[i] = Math.cos(wp);
        }

        this.px = px; this.py = py; this.pz = pz;
        this.vx = vx; this.vy = vy; this.vz = vz;
        this.wx = wx; this.wy = wy; this.wz = wz;
        this.count = count;
    }

    buildGrid() {
        const cs = Math.max(this.params.visualRange, 40);
        this.cs = cs;
        const b = this.bounds;
        const nx = Math.ceil(b.x * 2 / cs) + 2;
        const ny = Math.ceil(b.y * 2 / cs) + 2;
        const nz = Math.ceil(b.z * 2 / cs) + 2;
        this.nx = nx; this.ny = ny; this.nz = nz;
        this.ox = b.x + cs;
        this.oy = b.y + cs;
        this.oz = b.z + cs;

        const total = nx * ny * nz;
        if (!this.grid || this.grid.length < total) {
            this.grid = new Array(total);
            for (let i = 0; i < total; i++) this.grid[i] = [];
        } else {
            for (let i = 0; i < total; i++) this.grid[i].length = 0;
        }

        for (let i = 0; i < this.count; i++) {
            const ci = Math.floor((this.px[i] + this.ox) / cs);
            const cj = Math.floor((this.py[i] + this.oy) / cs);
            const ck = Math.floor((this.pz[i] + this.oz) / cs);
            if (ci >= 0 && ci < nx && cj >= 0 && cj < ny && ck >= 0 && ck < nz) {
                this.grid[(ck * ny + cj) * nx + ci].push(i);
            }
        }
    }

    neighbors(idx) {
        const cs = this.cs;
        const ci = Math.floor((this.px[idx] + this.ox) / cs);
        const cj = Math.floor((this.py[idx] + this.oy) / cs);
        const ck = Math.floor((this.pz[idx] + this.oz) / cs);
        const out = [];
        const { nx, ny, nz } = this;

        for (let dz = -1; dz <= 1; dz++) {
            const gz = ck + dz;
            if (gz < 0 || gz >= nz) continue;
            for (let dy = -1; dy <= 1; dy++) {
                const gy = cj + dy;
                if (gy < 0 || gy >= ny) continue;
                for (let dx = -1; dx <= 1; dx++) {
                    const gx = ci + dx;
                    if (gx < 0 || gx >= nx) continue;
                    const cell = this.grid[(gz * ny + gy) * nx + gx];
                    for (let k = 0; k < cell.length; k++) out.push(cell[k]);
                }
            }
        }
        return out;
    }

    update(dt) {
        const {
            separationWeight, alignmentWeight, cohesionWeight,
            visualRange, separationRange, maxSpeed, minSpeed,
            maxForce, boundaryMargin, boundaryForce,
            windX, windY, windZ, noiseAmount,
            curlScale, curlStrength, wanderStrength,
            edgeCohesionDrop, splitThreshold
        } = this.params;

        const n = this.count;
        const b = this.bounds;
        const vrSq = visualRange * visualRange;
        const srSq = separationRange * separationRange;

        this.time += dt * 0.001;

        this.buildGrid();

        const acx = new Float32Array(n);
        const acy = new Float32Array(n);
        const acz = new Float32Array(n);

        // centroid of the whole flock (for global cohesion)
        let cmx = 0, cmy = 0, cmz = 0;
        for (let i = 0; i < n; i++) {
            cmx += this.px[i]; cmy += this.py[i]; cmz += this.pz[i];
        }
        cmx /= n; cmy /= n; cmz /= n;

        for (let i = 0; i < n; i++) {
            const xi = this.px[i], yi = this.py[i], zi = this.pz[i];
            const vxi = this.vx[i], vyi = this.vy[i], vzi = this.vz[i];

            let sepX = 0, sepY = 0, sepZ = 0;
            let aliX = 0, aliY = 0, aliZ = 0, aliN = 0;
            let cohX = 0, cohY = 0, cohZ = 0, cohN = 0;

            const cands = this.neighbors(i);
            for (let k = 0; k < cands.length; k++) {
                const j = cands[k];
                if (j === i) continue;
                const dx = this.px[j] - xi;
                const dy = this.py[j] - yi;
                const dz = this.pz[j] - zi;
                const dSq = dx * dx + dy * dy + dz * dz;

                if (dSq < vrSq && dSq > 0) {
                    aliX += this.vx[j]; aliY += this.vy[j]; aliZ += this.vz[j]; aliN++;
                    cohX += this.px[j]; cohY += this.py[j]; cohZ += this.pz[j]; cohN++;

                    if (dSq < srSq) {
                        const d = Math.sqrt(dSq);
                        const f = 1.0 - d / separationRange;
                        sepX -= (dx / d) * f;
                        sepY -= (dy / d) * f;
                        sepZ -= (dz / d) * f;
                    }
                }
            }

            let sx = 0, sy = 0, sz = 0;

            // --- Separation ---
            sx += sepX * separationWeight;
            sy += sepY * separationWeight;
            sz += sepZ * separationWeight;

            // --- Alignment ---
            if (aliN > 0) {
                sx += (aliX / aliN - vxi) * alignmentWeight * 0.1;
                sy += (aliY / aliN - vyi) * alignmentWeight * 0.1;
                sz += (aliZ / aliN - vzi) * alignmentWeight * 0.1;
            }

            // --- Cohesion with density modulation ---
            // Few neighbors → weak cohesion → edges can detach
            // Many neighbors → strong cohesion → core stays together
            if (cohN > 0) {
                const densityFactor = Math.min(cohN / 12, 1.0); // 0..1, saturates at ~12 neighbors
                // At the edge (few neighbors): cohesion strongly reduced
                let cohMod = 1.0 - edgeCohesionDrop * (1.0 - densityFactor);
                // Below splitThreshold: near-zero cohesion → enables splitting
                if (cohN <= splitThreshold) {
                    cohMod *= cohN / splitThreshold * 0.5;
                }

                const cx = (cohX / cohN - xi) * cohesionWeight * 0.005 * cohMod;
                const cy = (cohY / cohN - yi) * cohesionWeight * 0.005 * cohMod;
                const cz = (cohZ / cohN - zi) * cohesionWeight * 0.005 * cohMod;
                sx += cx; sy += cy; sz += cz;
            }

            // --- Very weak global cohesion ---
            // Prevents subgroups from drifting away permanently,
            // but weak enough to allow temporary splits
            const gcx = cmx - xi, gcy = cmy - yi, gcz = cmz - zi;
            const gcDist = Math.sqrt(gcx * gcx + gcy * gcy + gcz * gcz);
            if (gcDist > 80) {
                const gf = 0.0003 * Math.min((gcDist - 80) / 200, 1.0);
                sx += gcx * gf;
                sy += gcy * gf;
                sz += gcz * gf;
            }

            // --- Curl-noise flow field ---
            // Spatially coherent force that pushes different parts of the
            // flock in different directions → complex shapes
            const [cnx, cny, cnz] = curlNoise(xi, yi, zi, curlScale, this.time);
            sx += cnx * curlStrength;
            sy += cny * curlStrength;
            sz += cnz * curlStrength;

            // --- Per-boid wander tendency ---
            sx += this.wx[i] * wanderStrength;
            sy += this.wy[i] * wanderStrength;
            sz += this.wz[i] * wanderStrength;

            // --- Boundary avoidance ---
            const bx = b.x - boundaryMargin;
            const by = b.y - boundaryMargin;
            const bz = b.z - boundaryMargin;
            if (xi > bx)  sx -= (xi - bx) / boundaryMargin * boundaryForce;
            if (xi < -bx) sx -= (xi + bx) / boundaryMargin * boundaryForce;
            if (yi > by)  sy -= (yi - by) / boundaryMargin * boundaryForce;
            if (yi < -by) sy -= (yi + by) / boundaryMargin * boundaryForce;
            if (zi > bz)  sz -= (zi - bz) / boundaryMargin * boundaryForce;
            if (zi < -bz) sz -= (zi + bz) / boundaryMargin * boundaryForce;

            // --- Wind ---
            sx += windX * 0.01;
            sy += windY * 0.01;
            sz += windZ * 0.01;

            // --- Fine noise ---
            sx += (Math.random() - 0.5) * noiseAmount;
            sy += (Math.random() - 0.5) * noiseAmount;
            sz += (Math.random() - 0.5) * noiseAmount;

            // Clamp force
            const sm = Math.sqrt(sx * sx + sy * sy + sz * sz);
            if (sm > maxForce) {
                const r = maxForce / sm;
                sx *= r; sy *= r; sz *= r;
            }

            acx[i] = sx; acy[i] = sy; acz[i] = sz;
        }

        // --- Integration + wander drift ---
        const dtS = dt / 16.667;
        for (let i = 0; i < n; i++) {
            this.vx[i] += acx[i] * dtS;
            this.vy[i] += acy[i] * dtS;
            this.vz[i] += acz[i] * dtS;

            const spd = Math.sqrt(this.vx[i] ** 2 + this.vy[i] ** 2 + this.vz[i] ** 2);
            if (spd > maxSpeed) {
                const r = maxSpeed / spd;
                this.vx[i] *= r; this.vy[i] *= r; this.vz[i] *= r;
            } else if (spd < minSpeed && spd > 0.001) {
                const r = minSpeed / spd;
                this.vx[i] *= r; this.vy[i] *= r; this.vz[i] *= r;
            }

            this.px[i] += this.vx[i] * dtS;
            this.py[i] += this.vy[i] * dtS;
            this.pz[i] += this.vz[i] * dtS;

            // slowly rotate the wander direction (random walk on the unit sphere)
            this.wx[i] += (Math.random() - 0.5) * 0.08;
            this.wy[i] += (Math.random() - 0.5) * 0.08;
            this.wz[i] += (Math.random() - 0.5) * 0.08;
            const wl = Math.sqrt(this.wx[i] ** 2 + this.wy[i] ** 2 + this.wz[i] ** 2);
            if (wl > 0.001) {
                this.wx[i] /= wl; this.wy[i] /= wl; this.wz[i] /= wl;
            }

            // hard clamp — generous, boids may fly far out
            const bnd = 1.6;
            this.px[i] = Math.max(-this.bounds.x * bnd, Math.min(this.bounds.x * bnd, this.px[i]));
            this.py[i] = Math.max(-this.bounds.y * bnd, Math.min(this.bounds.y * bnd, this.py[i]));
            this.pz[i] = Math.max(-this.bounds.z * bnd, Math.min(this.bounds.z * bnd, this.pz[i]));
        }
    }
}
