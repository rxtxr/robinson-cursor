// ═══════════════════════════════════════════════════════════════
//  ANT COLONY SIMULATION v2 — consolidated rewrite
// ═══════════════════════════════════════════════════════════════

// ── GRID & CANVAS ───────────────────────────────────────────
const COLS=200, ROWS=120, T=4;
const CW=COLS*T, CH=ROWS*T;
const canvas=document.getElementById('canvas');
canvas.width=CW; canvas.height=CH;
const ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
// fit + zoom defined here but called after globals are ready (see bottom of init)
let baseScale=1;
function fit(){
  baseScale=Math.min(innerWidth/CW,innerHeight/CH);
  applyZoom();
}
function applyZoom(){
  const cl=(v,a,b)=>v<a?a:v>b?b:v; // local clamp (available before helpers)
  const s=baseScale*zoom;
  const maxCX=Math.max(0,CW-innerWidth/s);
  const maxCY=Math.max(0,CH-innerHeight/s);
  camX=cl(camX,0,maxCX);camY=cl(camY,0,maxCY);
  let tx=-camX*s,ty=-camY*s;
  if(CW*s<=innerWidth) tx=(innerWidth-CW*s)/2;
  if(CH*s<=innerHeight) ty=(innerHeight-CH*s)/2;
  canvas.style.transform=`translate(${tx}px,${ty}px) scale(${s})`;
  canvas.style.width=CW+'px';canvas.style.height=CH+'px';
}

// ImageData buffer
const imgData=ctx.createImageData(CW,CH);
const buf32=new Uint32Array(imgData.data.buffer);

// ── TILE TYPES ──────────────────────────────────────────────
const AIR=0,SOIL=1,ROCK=2,FOOD=3,EGG=4,LARVA=5,PUPA=6,SURFACE=7,MOUND=8,CORPSE=9,FOOD2=10,FOOD3=11;
// FOOD=red crumb, FOOD2=seed(yellow), FOOD3=sweet(green)
const grid=new Uint8Array(COLS*ROWS);
const soilVar=new Uint8Array(COLS*ROWS); // per-tile variation 0-7

// ── PHEROMONES ──────────────────────────────────────────────
const phTrail=new Float32Array(COLS*ROWS);
const phHome=new Float32Array(COLS*ROWS);

// ── CONSTANTS ───────────────────────────────────────────────
const SURFACE_ROW=16;
const MAX_ANTS=200;
const EGG_TICKS=400, LARVA_TICKS=500, PUPA_TICKS=400;
const ANT_LIFESPAN=8000;
const DAY_TICKS=4500;

// Ant types (numeric)
const T_WORKER=0, T_QUEEN=1, T_SOLDIER=2;
// Ant states
const S_IDLE=0,S_DIG=1,S_FORAGE=2,S_CARRY_FOOD=3,
      S_NURSE=4,S_QUEEN=5,S_SOLDIER=6,S_CARRY_CORPSE=7,S_CARRY_BROOD=8;
// Chamber types for dig planner
const CH_FOOD=0, CH_BROOD=1, CH_WASTE=2, CH_QUEEN=3;

// ── GLOBALS ─────────────────────────────────────────────────
let tick=0, dayPhase=0.35, simSpeed=1, paused=false;
let ants=[], broods=[], particles=[], digGoals=[];
let foodStored=0, entranceX=0, queenX=0, queenY=0;
let queenRef=null; // direct reference to queen ant
let zoom=1, camX=0, camY=0; // zoom/pan
// cached HUD counters
let cntWorker=0,cntSoldier=0,cntEgg=0,cntLarva=0,cntPupa=0;

// now that zoom/cam globals exist, init canvas sizing
fit(); addEventListener('resize',fit);

// ── HELPERS ─────────────────────────────────────────────────
const gi=(x,y)=>y*COLS+x;
const inB=(x,y)=>x>=0&&x<COLS&&y>=0&&y<ROWS;
const rng=()=>Math.random();
const rngi=(a,b)=>a+(rng()*(b-a+1)|0);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function hash(x,y){return((x*374761393+y*668265263)^0x5bf03635)>>>0;}

function isSolid(x,y){if(!inB(x,y))return true;const c=grid[gi(x,y)];return c===SOIL||c===ROCK;}
function isFood(c){return c===FOOD||c===FOOD2||c===FOOD3;}
function canStep(x,y){
  if(!inB(x,y))return false;
  const c=grid[gi(x,y)];
  return c===AIR||c===SURFACE||isFood(c)||c===EGG||c===LARVA||c===PUPA||c===MOUND||c===CORPSE;
}
function randomFoodType(){const r=rng();return r<.4?FOOD:r<.7?FOOD2:FOOD3;}
function hasFloor(x,y){
  if(y<=SURFACE_ROW)return true;
  return isSolid(x,y+1)||isSolid(x-1,y)||isSolid(x+1,y)||isSolid(x,y-1);
}
function isDay(){return dayPhase>.3&&dayPhase<.7;}

// pack RGBA into Uint32 (little-endian)
function rgba(r,g,b,a){return(a<<24)|(b<<16)|(g<<8)|r;}
function rgbSolid(r,g,b){return(255<<24)|(b<<16)|(g<<8)|r;}

// ═══════════════════════════════════════════════════════════════
//  WORLD GENERATION
// ═══════════════════════════════════════════════════════════════
function generateWorld(){
  for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){
    soilVar[gi(x,y)]=hash(x,y)&7;
    if(y<SURFACE_ROW) grid[gi(x,y)]=AIR;
    else if(y===SURFACE_ROW) grid[gi(x,y)]=SURFACE;
    else grid[gi(x,y)]=SOIL;
  }
  // rock borders
  for(let y=0;y<ROWS;y++){grid[gi(0,y)]=ROCK;grid[gi(COLS-1,y)]=ROCK;}
  for(let x=0;x<COLS;x++) grid[gi(x,ROWS-1)]=ROCK;
  // scatter rocks
  for(let i=0;i<50;i++){
    const rx=rngi(4,COLS-5),ry=rngi(SURFACE_ROW+10,ROWS-5),sz=rngi(1,3);
    for(let dy=-sz;dy<=sz;dy++) for(let dx=-sz;dx<=sz;dx++){
      if(dx*dx+dy*dy<=sz*sz+1){
        const px=rx+dx,py=ry+dy;
        if(inB(px,py)&&py>SURFACE_ROW+2) grid[gi(px,py)]=ROCK;
      }
    }
  }
  // entrance
  entranceX=(COLS/2|0)+rngi(-5,5);
  carveRect(entranceX-1,SURFACE_ROW,3,1,AIR);
  // main shaft
  carveTunnel(entranceX,SURFACE_ROW+1,entranceX,SURFACE_ROW+15);

  // functional chambers via dig planner
  // queen chamber (deepest)
  const qx=entranceX+rngi(-3,3), qy=SURFACE_ROW+22;
  carveTunnel(entranceX,SURFACE_ROW+15,qx,qy);
  carveRoom(qx,qy,5,3,true);
  queenX=qx; queenY=qy;

  // brood chamber (mid depth)
  const bx=qx+rngi(-8,8), by=SURFACE_ROW+16;
  carveTunnel(qx,qy,bx,by);
  carveRoom(bx,by,4,2,true);

  // food storage (near surface)
  const fx=entranceX+rngi(-10,10), fy=SURFACE_ROW+8;
  carveTunnel(entranceX,SURFACE_ROW+6,fx,fy);
  carveRoom(fx,fy,4,2,true);

  // waste chamber (far from brood)
  const wx=clamp(qx+(bx>qx?-12:12),5,COLS-6), wy=SURFACE_ROW+25;
  carveTunnel(qx,qy,wx,wy);
  carveRoom(wx,wy,3,2,true);

  const rooms=[
    {x:qx,y:qy,type:CH_QUEEN},
    {x:bx,y:by,type:CH_BROOD},
    {x:fx,y:fy,type:CH_FOOD},
    {x:wx,y:wy,type:CH_WASTE}
  ];

  // seed initial dig goals for expansion
  addDigGoals(rooms);

  // place initial food underground
  foodStored=0;
  for(let i=0;i<10;i++){
    const rx=fx+rngi(-3,3),ry=fy+rngi(-1,1);
    if(inB(rx,ry)&&grid[gi(rx,ry)]===AIR){grid[gi(rx,ry)]=randomFoodType();foodStored++;}
  }
  // surface food
  for(let i=0;i<8;i++){
    const sx=rngi(5,COLS-6);
    if(grid[gi(sx,SURFACE_ROW)]===SURFACE||grid[gi(sx,SURFACE_ROW)]===AIR){
      grid[gi(sx,SURFACE_ROW)]=randomFoodType();
    }
  }
  return rooms;
}

function carveTunnel(x0,y0,x1,y1){
  let x=x0,y=y0;
  while(x!==x1||y!==y1){
    for(let dx=-1;dx<=1;dx++){
      if(inB(x+dx,y)&&grid[gi(x+dx,y)]!==ROCK) grid[gi(x+dx,y)]=AIR;
    }
    if(x<x1)x++; else if(x>x1)x--;
    if(y<y1)y++; else if(y>y1)y--;
  }
}
function carveRect(x0,y0,w,h,t){
  for(let dy=0;dy<h;dy++) for(let dx=0;dx<w;dx++){
    const px=x0+dx,py=y0+dy;
    if(inB(px,py)&&grid[gi(px,py)]!==ROCK) grid[gi(px,py)]=t;
  }
}
function carveRoom(cx,cy,w,h,forceRock){
  for(let dy=-h;dy<=h;dy++) for(let dx=-w;dx<=w;dx++){
    if(dx*dx/(w*w)+dy*dy/(h*h)<=1){
      const px=cx+dx,py=cy+dy;
      if(inB(px,py)){
        // forceRock=true removes rocks (used for initial chambers)
        if(grid[gi(px,py)]===ROCK&&!forceRock) continue;
        grid[gi(px,py)]=AIR;
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  DIG PLANNER — colony-level architecture
// ═══════════════════════════════════════════════════════════════
function addDigGoals(rooms){
  // branch new tunnels from existing rooms
  for(const r of rooms){
    const count=rngi(1,2);
    for(let i=0;i<count;i++){
      // ~120° branching angles (downward bias)
      const angle=(rng()*.6+.2)*Math.PI;
      const dist=rngi(8,18);
      const sign=rng()>.5?1:-1;
      const tx=clamp(Math.round(r.x+Math.cos(angle)*dist*sign),5,COLS-6);
      const ty=clamp(Math.round(r.y+Math.sin(angle)*dist*.6+dist*.4),SURFACE_ROW+5,ROWS-5);
      // determine chamber type by depth
      const depth=ty-SURFACE_ROW;
      let ctype=CH_FOOD;
      if(depth>18) ctype=CH_BROOD;
      if(depth>25) ctype=rng()>.5?CH_WASTE:CH_BROOD;
      digGoals.push({x:tx,y:ty,type:ctype,claimed:false,done:false,parentX:r.x,parentY:r.y});
    }
  }
}

function claimDigGoal(ant){
  let best=null,bd=Infinity;
  for(const g of digGoals){
    if(g.done||g.claimed)continue;
    const d=Math.abs(g.x-ant.x)+Math.abs(g.y-ant.y);
    if(d<bd){bd=d;best=g;}
  }
  if(best) best.claimed=true;
  return best;
}

// ═══════════════════════════════════════════════════════════════
//  PARTICLES — dig dust
// ═══════════════════════════════════════════════════════════════
function spawnDust(x,y){
  if(particles.length>=80) return;
  for(let i=0;i<3;i++){
    const life=rngi(10,20);
    particles.push({
      x:x*T+rngi(0,T), y:y*T+rngi(0,T),
      vx:(rng()-.5)*1.5, vy:-rng()*2,
      life, maxLife:life,
      r:120+rngi(-20,20), g:90+rngi(-15,15), b:50+rngi(-10,10)
    });
  }
}
function tickParticles(){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x+=p.vx; p.y+=p.vy; p.vy+=.15; p.life--;
    if(p.life<=0) particles.splice(i,1);
  }
}

// ═══════════════════════════════════════════════════════════════
//  ANT ENTITY
// ═══════════════════════════════════════════════════════════════
function createAnt(x,y,type){
  return{
    x,y,type,
    state:type===T_QUEEN?S_QUEEN:type===T_SOLDIER?S_SOLDIER:S_IDLE,
    dir:rng()>.5?1:-1,
    carry:0, // 0=none,1=soil,2=food,3=corpse
    ticks:0,
    age:0,
    goal:null,      // dig goal ref
    broodRef:null,  // brood being carried
    lastFoodX:-1, lastFoodY:-1, // memory
    stuckCount:0,
    fed:100,        // internal food (trophallaxis)
  };
}

// ═══════════════════════════════════════════════════════════════
//  ANT MOVEMENT
// ═══════════════════════════════════════════════════════════════
function moveAnt(ant,tx,ty){
  const dx=tx-ant.x, dy=ty-ant.y;
  const mx=dx===0?0:(dx>0?1:-1);
  const my=dy===0?0:(dy>0?1:-1);
  const tries=[
    {x:mx,y:my},{x:mx,y:0},{x:0,y:my},
    {x:mx,y:-my},{x:-mx,y:my},
    {x:ant.dir,y:0},{x:-ant.dir,y:0},{x:0,y:-1},{x:0,y:1}
  ];
  for(const t of tries){
    if(t.x===0&&t.y===0)continue;
    const nx=ant.x+t.x,ny=ant.y+t.y;
    if(canStep(nx,ny)&&hasFloor(nx,ny)){
      ant.x=nx;ant.y=ny;if(t.x!==0)ant.dir=t.x;ant.stuckCount=0;return true;
    }
  }
  ant.stuckCount++;
  return false;
}

function wanderSurface(ant){
  const nx=ant.x+ant.dir;
  if(nx<=1||nx>=COLS-2){ant.dir=-ant.dir;return;}
  if(canStep(nx,SURFACE_ROW)){ant.x=nx;ant.y=SURFACE_ROW;}
  else if(canStep(nx,SURFACE_ROW-1)){ant.x=nx;ant.y=SURFACE_ROW-1;}
  else ant.dir=-ant.dir;
  if(rng()<.04)ant.dir=-ant.dir;
}

function followPheromone(ant,ph){
  let bx=ant.x,by=ant.y,bp=-1;
  for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
    if(dx===0&&dy===0)continue;
    if(Math.abs(dx)+Math.abs(dy)>1)continue;
    const nx=ant.x+dx,ny=ant.y+dy;
    if(!canStep(nx,ny))continue;
    const p=ph[gi(nx,ny)]+rng()*.03;
    if(p>bp){bp=p;bx=nx;by=ny;}
  }
  if(bp>.01&&rng()<.7){
    ant.x=bx;ant.y=by;ant.stuckCount=0;return true;
  }
  return false;
}

function moveToColony(ant){
  if(ant.y<=SURFACE_ROW){
    if(Math.abs(ant.x-entranceX)>1){
      ant.dir=entranceX>ant.x?1:-1;ant.x+=ant.dir;ant.y=SURFACE_ROW;
    } else {ant.x=entranceX;ant.y=SURFACE_ROW+1;}
    return;
  }
  if(!followPheromone(ant,phHome)) moveAnt(ant,entranceX,SURFACE_ROW);
}

function moveToQueen(ant){
  if(ant.y<=SURFACE_ROW){
    if(Math.abs(ant.x-entranceX)>1){ant.dir=entranceX>ant.x?1:-1;ant.x+=ant.dir;ant.y=SURFACE_ROW;}
    else{ant.x=entranceX;ant.y=SURFACE_ROW+1;}
    return;
  }
  if(!followPheromone(ant,phHome)) moveAnt(ant,queenX,queenY);
}

// ═══════════════════════════════════════════════════════════════
//  ANT BEHAVIOR
// ═══════════════════════════════════════════════════════════════
function antTick(ant){
  ant.ticks++;
  ant.age++;
  ant.fed-=.008;

  // rescue from solid
  if(!canStep(ant.x,ant.y)){
    for(let r=1;r<=15;r++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){
      if(Math.abs(dx)+Math.abs(dy)!==r)continue;
      const nx=ant.x+dx,ny=ant.y+dy;
      if(canStep(nx,ny)){ant.x=nx;ant.y=ny;return true;}
    }
    return true;
  }
  // gravity
  if(ant.y<ROWS-1&&!hasFloor(ant.x,ant.y)&&canStep(ant.x,ant.y+1)){ant.y++;return true;}

  // deposit pheromones
  if(inB(ant.x,ant.y)){
    const i=gi(ant.x,ant.y);
    // trail pheromone: on surface AND underground when carrying food
    if(ant.carry===2) phTrail[i]=Math.min(1,phTrail[i]+.5);
    // also leave trail on surface when returning from successful forage (memory-based)
    if(ant.state===S_FORAGE&&ant.lastFoodX>=0&&ant.y<=SURFACE_ROW) phTrail[i]=Math.min(1,phTrail[i]+.2);
    // home pheromone: ALL ants mark their position (stronger near entrance/colony center)
    if(ant.y>SURFACE_ROW) phHome[i]=Math.min(1,phHome[i]+.25);
  }

  // trophallaxis: sample a few nearby ants instead of full scan
  if(ant.fed>50 && ant.type===T_WORKER && rng()<.05){
    const samples=Math.min(8,ants.length);
    for(let s=0;s<samples;s++){
      const o=ants[rngi(0,ants.length-1)];
      if(o===ant)continue;
      if(Math.abs(o.x-ant.x)<=1&&Math.abs(o.y-ant.y)<=1&&o.fed<40){
        const give=Math.min(20,ant.fed-30);
        ant.fed-=give; o.fed+=give;
        break;
      }
    }
  }

  // mortality — old workers die
  if(ant.type===T_WORKER && ant.age>ANT_LIFESPAN){
    if(ant.goal){ant.goal.claimed=false;ant.goal=null;}
    if(ant.broodRef){
      // drop brood
      if(inB(ant.x,ant.y)&&grid[gi(ant.x,ant.y)]===AIR){
        grid[gi(ant.x,ant.y)]=ant.broodRef.type;
        ant.broodRef.x=ant.x;ant.broodRef.y=ant.y;
      }
      ant.broodRef=null;
    }
    if(ant.carry===2&&inB(ant.x,ant.y)&&grid[gi(ant.x,ant.y)]===AIR){
      grid[gi(ant.x,ant.y)]=randomFoodType();
    }
    if(inB(ant.x,ant.y)&&grid[gi(ant.x,ant.y)]===AIR) grid[gi(ant.x,ant.y)]=CORPSE;
    return false;
  }
  // starvation
  if(ant.fed<=-30&&ant.type!==T_QUEEN){
    if(ant.goal){ant.goal.claimed=false;ant.goal=null;}
    if(ant.broodRef){
      if(inB(ant.x,ant.y)&&grid[gi(ant.x,ant.y)]===AIR){
        grid[gi(ant.x,ant.y)]=ant.broodRef.type;ant.broodRef.x=ant.x;ant.broodRef.y=ant.y;
      }
      ant.broodRef=null;
    }
    return false;
  }
  if(ant.type===T_QUEEN&&ant.fed<5) ant.fed=5;
  // soldier mortality (longer lived than workers)
  if(ant.type===T_SOLDIER&&ant.age>ANT_LIFESPAN*1.5){
    if(inB(ant.x,ant.y)&&grid[gi(ant.x,ant.y)]===AIR) grid[gi(ant.x,ant.y)]=CORPSE;
    return false;
  }

  // === QUEEN ===
  if(ant.state===S_QUEEN){
    queenRef=ant;
    // queen stays near her chamber (don't update queenX/Y to track wandering)
    if(rng()<.04){
      const nx=ant.x+rngi(-1,1),ny=ant.y+rngi(-1,1);
      // only move if staying close to original chamber
      if(canStep(nx,ny)&&Math.abs(nx-queenX)+Math.abs(ny-queenY)<=6){ant.x=nx;ant.y=ny;}
    }
    // queen eats: try nearby tiles first, then consume from colony stores
    if(ant.fed<70){
      // eat adjacent food tile
      let ate=false;
      for(let dy=-2;dy<=2&&!ate;dy++) for(let dx=-2;dx<=2&&!ate;dx++){
        const px=ant.x+dx,py=ant.y+dy;
        if(inB(px,py)&&isFood(grid[gi(px,py)])){
          grid[gi(px,py)]=AIR;
          ant.fed=Math.min(100,ant.fed+30);
          ate=true;
        }
      }
      // fallback: consume from colony food stores (workers bring food, queen eats)
      if(!ate&&foodStored>2&&tick%50===0){
        // find and remove a food tile from anywhere underground
        for(let sy=SURFACE_ROW+1;sy<ROWS&&!ate;sy++)
          for(let sx=0;sx<COLS&&!ate;sx++)
            if(isFood(grid[gi(sx,sy)])){
              grid[gi(sx,sy)]=AIR;
              ant.fed=Math.min(100,ant.fed+25);
              ate=true;
            }
      }
    }
    // lay egg — minimal fed threshold so colony can recover
    if(ant.ticks%250===0 && ant.fed>10 && ants.length+broods.length<MAX_ANTS){
      for(let r=1;r<=3;r++){
        let laid=false;
        for(let dy=-r;dy<=r&&!laid;dy++) for(let dx=-r;dx<=r&&!laid;dx++){
          const px=ant.x+dx,py=ant.y+dy;
          if(inB(px,py)&&grid[gi(px,py)]===AIR){
            grid[gi(px,py)]=EGG;
            broods.push({x:px,y:py,type:EGG,timer:EGG_TICKS,tended:false,neglect:0});
            ant.fed-=8;
            cntEgg++;
            laid=true;
          }
        }
        if(laid)break;
      }
    }
    return true;
  }

  // === SOLDIER ===
  if(ant.state===S_SOLDIER){
    const py=SURFACE_ROW+5;
    if(Math.abs(ant.y-py)>8||Math.abs(ant.x-entranceX)>12) moveAnt(ant,entranceX,py);
    else if(rng()<.25){
      const sdx=rngi(-1,1),sdy=rngi(-1,1);
      const nx=ant.x+sdx,ny=ant.y+sdy;
      if(canStep(nx,ny)&&hasFloor(nx,ny)){if(sdx!==0)ant.dir=sdx;ant.x=nx;ant.y=ny;}
    }
    // feed queen if nearby (use cached ref)
    if(ant.fed>50&&queenRef&&Math.abs(queenRef.x-ant.x)<=2&&Math.abs(queenRef.y-ant.y)<=2&&queenRef.fed<60){
      ant.fed-=10;queenRef.fed+=10;
    }
    return true;
  }

  // === WORKER FSM ===
  if(ant.stuckCount>50){
    ant.stuckCount=0;ant.state=S_IDLE;ant.ticks=0;
    if(ant.goal){ant.goal.claimed=false;ant.goal=null;}
    if(ant.broodRef){
      if(inB(ant.x,ant.y)&&grid[gi(ant.x,ant.y)]===AIR){
        grid[gi(ant.x,ant.y)]=ant.broodRef.type;ant.broodRef.x=ant.x;ant.broodRef.y=ant.y;
      }
      ant.broodRef=null;
    }
    ant.carry=0;
  }

  switch(ant.state){
  case S_IDLE:{
    // age polyethism: young ants (age<1500) prefer nursing, old prefer foraging
    const young=ant.age<1500;
    const r=rng();
    const needFood=foodStored<ants.length*.4;
    const nightPenalty=isDay()?0:.7; // at night, less foraging

    // pick task
    if(ant.carry===0){
      // check for nearby corpses (necrophorese)
      for(let dy=-3;dy<=3;dy++) for(let dx=-3;dx<=3;dx++){
        const px=ant.x+dx,py=ant.y+dy;
        if(inB(px,py)&&grid[gi(px,py)]===CORPSE){
          grid[gi(px,py)]=AIR;
          ant.carry=3;ant.state=S_CARRY_CORPSE;ant.ticks=0;
          return true;
        }
      }
    }

    // balance: foraging > digging, especially when food is low
    const openGoals=digGoals.some(g=>!g.done&&!g.claimed);
    if(needFood && r<.55-nightPenalty*.4){
      ant.state=S_FORAGE;
    } else if(young && broods.length>0 && r<.65){
      ant.state=S_NURSE;
    } else if(!young && openGoals && r<.55){
      ant.state=S_DIG;
      ant.goal=claimDigGoal(ant);
    } else {
      // default: forage (old) or nurse (young)
      ant.state=young?S_NURSE:S_FORAGE;
    }
    ant.ticks=0;
    break;
  }

  case S_DIG:{
    if(ant.ticks>400){
      if(ant.goal){ant.goal.claimed=false;ant.goal=null;}
      ant.carry=0;ant.state=S_IDLE;ant.ticks=0;break;
    }
    // carrying soil → dump at surface (creates mound)
    if(ant.carry===1){
      if(ant.y<=SURFACE_ROW+1){
        ant.carry=0;
        // deposit mound near entrance
        const mx=entranceX+rngi(-4,4);
        if(inB(mx,SURFACE_ROW)&&(grid[gi(mx,SURFACE_ROW)]===AIR||grid[gi(mx,SURFACE_ROW)]===SURFACE)){
          grid[gi(mx,SURFACE_ROW)]=MOUND;
        }
      } else {
        moveAnt(ant,entranceX,SURFACE_ROW);
      }
      break;
    }
    // dig toward goal
    if(ant.goal&&!ant.goal.done){
      const dist=Math.abs(ant.goal.x-ant.x)+Math.abs(ant.goal.y-ant.y);
      if(dist<=2){
        // reached — carve chamber
        ant.goal.done=true;
        const sz=ant.goal.type===CH_QUEEN?5:rngi(3,4);
        const sh=ant.goal.type===CH_QUEEN?3:2;
        carveRoom(ant.goal.x,ant.goal.y,sz,sh);
        // branch from here
        if(rng()<.6) addDigGoals([{x:ant.goal.x,y:ant.goal.y,type:ant.goal.type}]);
        ant.goal.claimed=false;ant.goal=null;
        ant.state=S_IDLE;ant.ticks=0;
      } else {
        // dig toward goal — find soil in path
        const dx=ant.goal.x-ant.x,dy=ant.goal.y-ant.y;
        const mx=dx===0?0:(dx>0?1:-1),my=dy===0?0:(dy>0?1:-1);
        let dug=false;
        const digTries=[{x:mx,y:my},{x:mx,y:0},{x:0,y:my}];
        for(const t of digTries){
          const nx=ant.x+t.x,ny=ant.y+t.y;
          if(inB(nx,ny)&&grid[gi(nx,ny)]===SOIL&&ny>SURFACE_ROW+1){
            grid[gi(nx,ny)]=AIR;
            // widen tunnel
            const wx=nx+(rng()>.5?1:-1);
            if(inB(wx,ny)&&grid[gi(wx,ny)]===SOIL) grid[gi(wx,ny)]=AIR;
            ant.carry=1;
            spawnDust(nx,ny);
            ant.x=nx;ant.y=ny;
            dug=true;break;
          } else if(canStep(nx,ny)){
            ant.x=nx;ant.y=ny;dug=true;break;
          }
        }
        if(!dug) moveAnt(ant,ant.goal.x,ant.goal.y);
      }
    } else {
      // no goal — dig adjacent soil randomly
      const dirs=[[0,1],[1,0],[-1,0],[0,-1]];
      for(let i=dirs.length-1;i>0;i--){const j=rngi(0,i);[dirs[i],dirs[j]]=[dirs[j],dirs[i]];}
      let dug=false;
      for(const[dx,dy] of dirs){
        const nx=ant.x+dx,ny=ant.y+dy;
        if(inB(nx,ny)&&grid[gi(nx,ny)]===SOIL&&ny>SURFACE_ROW+1){
          grid[gi(nx,ny)]=AIR;ant.carry=1;spawnDust(nx,ny);dug=true;break;
        }
      }
      if(!dug) moveAnt(ant,ant.x+rngi(-3,3),ant.y+rngi(0,3));
    }
    break;
  }

  case S_FORAGE:{
    if(ant.ticks>800){ant.state=S_IDLE;ant.ticks=0;break;}
    // night: go home
    if(!isDay()&&ant.ticks>50){ant.state=S_IDLE;ant.ticks=0;break;}

    // go to surface — navigate upward through tunnel system
    if(ant.y>SURFACE_ROW+1){
      // try going up first (priority)
      let moved=false;
      for(const dx of [0,-1,1,-2,2]){
        if(canStep(ant.x+dx,ant.y-1)){
          ant.x+=dx;ant.y--;ant.stuckCount=0;moved=true;break;
        }
      }
      if(!moved){
        // can't go up — move toward entrance column
        if(!followPheromone(ant,phHome)) moveAnt(ant,entranceX,SURFACE_ROW);
      }
      break;
    }
    // on surface — check for food underfoot
    if(isFood(grid[gi(ant.x,ant.y)])){
      grid[gi(ant.x,ant.y)]=AIR;
      ant.carry=2;ant.state=S_CARRY_FOOD;ant.ticks=0;
      ant.lastFoodX=ant.x;ant.lastFoodY=ant.y;
      break;
    }
    // remember last food location
    if(ant.lastFoodX>=0&&Math.abs(ant.x-ant.lastFoodX)>1){
      wanderToward(ant,ant.lastFoodX,ant.lastFoodY);
    } else if(rng()<.35&&followPheromone(ant,phTrail)){
      // follow trail
    } else {
      wanderSurface(ant);
    }
    // look around
    for(let dx=-2;dx<=2;dx++){
      const fx=ant.x+dx;
      if(inB(fx,SURFACE_ROW)&&isFood(grid[gi(fx,SURFACE_ROW)])){
        ant.x=fx;ant.y=SURFACE_ROW;break;
      }
    }
    break;
  }

  case S_CARRY_FOOD:{
    if(ant.ticks>1000){ant.carry=0;ant.state=S_IDLE;ant.ticks=0;break;}
    // head underground — priority: go DOWN through tunnels
    if(ant.y<=SURFACE_ROW){
      // on surface: go to entrance
      if(Math.abs(ant.x-entranceX)>1){
        ant.dir=entranceX>ant.x?1:-1;ant.x+=ant.dir;ant.y=SURFACE_ROW;
      } else {
        if(canStep(entranceX,SURFACE_ROW+1)){ant.x=entranceX;ant.y=SURFACE_ROW+1;}
      }
    } else {
      // underground: go down toward queen
      let moved=false;
      for(const dx of [0,-1,1,-2,2]){
        if(canStep(ant.x+dx,ant.y+1)){ant.x+=dx;ant.y++;ant.stuckCount=0;moved=true;break;}
      }
      if(!moved) moveAnt(ant,queenX,queenY);
    }
    // deposit food when underground
    if(ant.y>SURFACE_ROW+3){
      for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++){
        const px=ant.x+dx,py=ant.y+dy;
        if(inB(px,py)&&grid[gi(px,py)]===AIR&&py>SURFACE_ROW){
          grid[gi(px,py)]=randomFoodType();
          ant.carry=0;ant.state=S_IDLE;ant.ticks=0;ant.fed=Math.min(100,ant.fed+10);
          return true;
        }
      }
    }
    // failsafe: if carrying too long, deposit near queen (simulates relay)
    if(ant.ticks>200){
      for(let dy=-4;dy<=4;dy++) for(let dx=-4;dx<=4;dx++){
        const px=queenX+dx,py=queenY+dy;
        if(inB(px,py)&&grid[gi(px,py)]===AIR){
          grid[gi(px,py)]=randomFoodType();
          ant.carry=0;ant.state=S_IDLE;ant.ticks=0;ant.fed=Math.min(100,ant.fed+10);
          return true;
        }
      }
    }
    break;
  }

  case S_CARRY_CORPSE:{
    // carry to waste area (deep, far from queen)
    if(ant.ticks>400){
      // just drop it
      if(inB(ant.x,ant.y)&&grid[gi(ant.x,ant.y)]===AIR) grid[gi(ant.x,ant.y)]=CORPSE;
      ant.carry=0;ant.state=S_IDLE;ant.ticks=0;break;
    }
    // move to deepest known area
    const wasteY=SURFACE_ROW+ROWS*.7|0;
    moveAnt(ant,ant.x,wasteY);
    // drop when deep enough
    if(ant.y>SURFACE_ROW+20){
      if(inB(ant.x,ant.y)&&grid[gi(ant.x,ant.y)]===AIR) grid[gi(ant.x,ant.y)]=CORPSE;
      ant.carry=0;ant.state=S_IDLE;ant.ticks=0;
    }
    break;
  }

  case S_NURSE:{
    if(ant.ticks>300){ant.state=S_IDLE;ant.ticks=0;break;}
    // feed queen if nearby (use cached ref)
    if(ant.fed>40&&queenRef&&Math.abs(queenRef.x-ant.x)<=2&&Math.abs(queenRef.y-ant.y)<=2&&queenRef.fed<70){
      const give=Math.min(15,ant.fed-25);
      ant.fed-=give;queenRef.fed+=give;
    }
    // tend brood
    let nearest=null,nd=Infinity;
    for(const b of broods){
      const d=Math.abs(b.x-ant.x)+Math.abs(b.y-ant.y);
      if(d<nd){nd=d;nearest=b;}
    }
    if(nearest){
      if(nd<=2){
        nearest.timer=Math.max(0,nearest.timer-1);
        nearest.tended=true; // mark as tended this cycle
        // feed larva (requires food nearby)
        if(nearest.type===LARVA&&ant.fed>30){
          ant.fed-=2;nearest.timer=Math.max(0,nearest.timer-2);
        }
        // pick up brood to move toward queen chamber (clustering)
        if(rng()<.01&&!ant.broodRef&&Math.abs(nearest.x-queenX)+Math.abs(nearest.y-queenY)>10){
          // detach from grid
          if(inB(nearest.x,nearest.y)) grid[gi(nearest.x,nearest.y)]=AIR;
          ant.broodRef=nearest;
          ant.carry=4; // 4=brood
          ant.state=S_CARRY_BROOD;ant.ticks=0;
        }
      } else {
        moveAnt(ant,nearest.x,nearest.y);
      }
    } else {
      moveToQueen(ant);
    }
    break;
  }

  case S_CARRY_BROOD:{
    if(ant.ticks>300||!ant.broodRef){
      // drop brood here
      if(ant.broodRef){
        if(inB(ant.x,ant.y)&&grid[gi(ant.x,ant.y)]===AIR){
          grid[gi(ant.x,ant.y)]=ant.broodRef.type;
          ant.broodRef.x=ant.x;ant.broodRef.y=ant.y;
        }
        ant.broodRef=null;
      }
      ant.carry=0;ant.state=S_IDLE;ant.ticks=0;break;
    }
    // carry toward queen chamber area
    moveToQueen(ant);
    // drop when near queen
    if(Math.abs(ant.x-queenX)+Math.abs(ant.y-queenY)<=6){
      // find nearby AIR tile to place brood
      let placed=false;
      for(let dy=-2;dy<=2&&!placed;dy++) for(let dx=-2;dx<=2&&!placed;dx++){
        const px=ant.x+dx,py=ant.y+dy;
        if(inB(px,py)&&grid[gi(px,py)]===AIR){
          grid[gi(px,py)]=ant.broodRef.type;
          ant.broodRef.x=px;ant.broodRef.y=py;
          ant.broodRef=null;ant.carry=0;ant.state=S_NURSE;ant.ticks=0;
          placed=true;
        }
      }
      if(placed) break;
    }
    break;
  }
  }
  return true;
}

function wanderToward(ant,tx,ty){
  const d=tx>ant.x?1:tx<ant.x?-1:0;
  if(d!==0){
    ant.dir=d;
    const nx=ant.x+d;
    if(canStep(nx,SURFACE_ROW)){ant.x=nx;ant.y=SURFACE_ROW;}
  }
}

// ═══════════════════════════════════════════════════════════════
//  BROOD LIFECYCLE
// ═══════════════════════════════════════════════════════════════
function broodTick(){
  for(let i=broods.length-1;i>=0;i--){
    const b=broods[i];
    // validate brood/grid sync — remove orphaned broods
    if(inB(b.x,b.y)){
      const gc=grid[gi(b.x,b.y)];
      if(gc!==b.type){
        // grid was overwritten — remove brood entry
        if(b.type===EGG)cntEgg--;else if(b.type===LARVA)cntLarva--;else if(b.type===PUPA)cntPupa--;
        broods.splice(i,1);continue;
      }
    }
    // larvae need tending to develop — timer only decrements if tended
    if(b.type===LARVA){
      const wasTended=!!b.tended;
      if(wasTended) b.timer--; // fast when tended
      else if(tick%3===0) b.timer--; // slow natural development
      b.tended=false; // reset each tick
      // starving larva: if untended too long, it dies
      b.neglect=clamp((b.neglect||0)+(wasTended?-2:1),-50,1200);
      if(b.neglect>1000){
        if(inB(b.x,b.y)) grid[gi(b.x,b.y)]=AIR;
        cntLarva--;broods.splice(i,1);continue;
      }
    } else {
      b.timer--;
    }
    if(b.timer<=0){
      if(b.type===EGG){
        b.type=LARVA;b.timer=LARVA_TICKS;
        if(inB(b.x,b.y)) grid[gi(b.x,b.y)]=LARVA;
        cntEgg--;cntLarva++;
      } else if(b.type===LARVA){
        b.type=PUPA;b.timer=PUPA_TICKS;
        if(inB(b.x,b.y)) grid[gi(b.x,b.y)]=PUPA;
        cntLarva--;cntPupa++;
      } else if(b.type===PUPA){
        if(inB(b.x,b.y)) grid[gi(b.x,b.y)]=AIR;
        if(ants.length<MAX_ANTS){
          // soldier chance: ~8% if well-fed colony, capped at ~10% of population
          const soldierRatio=cntSoldier/(cntWorker+cntSoldier+1);
          const makeSoldier=foodStored>ants.length*.6&&soldierRatio<.1&&rng()<.08;
          if(makeSoldier){
            ants.push(createAnt(b.x,b.y,T_SOLDIER));
            cntSoldier++;
          } else {
            ants.push(createAnt(b.x,b.y,T_WORKER));
            cntWorker++;
          }
        }
        cntPupa--;
        broods.splice(i,1);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  PHEROMONE DECAY
// ═══════════════════════════════════════════════════════════════
function pheromoneTick(){
  for(let i=0;i<COLS*ROWS;i++){
    phTrail[i]*=.997;phHome[i]*=.998;
    if(phTrail[i]<.001)phTrail[i]=0;
    if(phHome[i]<.001)phHome[i]=0;
  }
}

// ═══════════════════════════════════════════════════════════════
//  FOOD SPAWNING
// ═══════════════════════════════════════════════════════════════
function spawnFood(){
  let surfFood=0;
  for(let x=1;x<COLS-1;x++){
    const c=grid[gi(x,SURFACE_ROW)];
    if(isFood(c)) surfFood++;
  }
  if(surfFood<18){
    const fx=rngi(5,COLS-6);
    const c=grid[gi(fx,SURFACE_ROW)];
    if(c===AIR||c===SURFACE) grid[gi(fx,SURFACE_ROW)]=randomFoodType();
  }
}

// ═══════════════════════════════════════════════════════════════
//  RENDERING — ImageData pipeline
// ═══════════════════════════════════════════════════════════════

// sky cache (one color per row, recomputed when dayPhase changes enough)
let skyCache=new Uint32Array(SURFACE_ROW);
let skyCachePhase=-1;

function updateSkyCache(){
  const t=dayPhase;
  for(let y=0;y<SURFACE_ROW;y++){
    let r,g,b;
    if(t<.25){r=8;g=12;b=30;}
    else if(t<.35){
      const s=(t-.25)/.1;
      r=8+s*160|0;g=12+s*100|0;b=30+s*60|0;
    } else if(t<.65){
      const h=y/SURFACE_ROW;
      r=130+h*40|0;g=180+h*30|0;b=235;
    } else if(t<.75){
      const s=(t-.65)/.1;
      r=170-s*100|0;g=140-s*80|0;b=90+s*20|0;
    } else {r=8;g=12;b=30;}
    skyCache[y]=rgbSolid(clamp(r,0,255),clamp(g,0,255),clamp(b,0,255));
  }
  skyCachePhase=t;
}

function soilRGB(x,y){
  const depth=y-SURFACE_ROW;
  const v=soilVar[gi(x,y)];
  // moisture gradient: deeper = more saturated
  const moisture=Math.min(1,depth/80);
  const base=Math.max(30,140-depth*1.8);
  const r=clamp(base+v*3-8-moisture*15|0,20,180);
  const g=clamp(base*.6+v*2-5+moisture*5|0,15,120);
  const b=clamp(base*.25+v-3+moisture*10|0,5,60);
  return rgbSolid(r,g,b);
}

function fillTile(x,y,col){
  const px=x*T,py=y*T;
  for(let dy=0;dy<T;dy++){
    const row=(py+dy)*CW+px;
    for(let dx=0;dx<T;dx++) buf32[row+dx]=col;
  }
}

function setPixel(px,py,col){
  if(px>=0&&px<CW&&py>=0&&py<CH) buf32[py*CW+px]=col;
}

function fillRect(px,py,w,h,col){
  for(let dy=0;dy<h;dy++) for(let dx=0;dx<w;dx++) setPixel(px+dx,py+dy,col);
}

function render(){
  // update sky cache if needed
  if(Math.abs(dayPhase-skyCachePhase)>.005) updateSkyCache();

  // ── TILES ──
  for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){
    const c=grid[gi(x,y)];
    if(c===AIR){
      if(y<SURFACE_ROW){
        fillTile(x,y,skyCache[y]);
        // stars
        if((dayPhase>.75||dayPhase<.2)&&hash(x,y)%60===0){
          const tw=Math.sin(tick*.03+x+y*.7)*.3+.7;
          const br=clamp(150+((hash(x+99,y)&63))*tw|0,0,255);
          setPixel(x*T+1,y*T+1,rgbSolid(br,br,clamp(br+40,0,255)));
        }
      } else {
        // underground tunnel
        const v=hash(x,y)&3;
        fillTile(x,y,rgbSolid(18+v,12+v,6));
      }
    } else if(c===SURFACE){
      const ph=isDay()?1:.4;
      const gv=hash(x,y)&15;
      fillTile(x,y,rgbSolid((50+gv)*ph|0,(120+gv)*ph|0,(20+gv)*ph|0));
      // grass blade
      if(hash(x,y)%3===0){
        const bo=(tick+x*7)%20<10?0:1;
        const gc=rgbSolid(60*ph|0,140*ph|0,30*ph|0);
        setPixel(x*T+1+bo,y*T-2,gc);
        setPixel(x*T+1+bo,y*T-1,gc);
      }
    } else if(c===SOIL){
      const col=soilRGB(x,y);
      fillTile(x,y,col);
      // texture
      if(hash(x,y)%4===0){
        const depth=y-SURFACE_ROW;
        const v=soilVar[gi(x,y)];
        const base=Math.max(30,140-depth*1.8);
        setPixel(x*T+(hash(x,y+1)&1)*2,y*T+(hash(x+1,y)&1)*2,
          rgbSolid(clamp(base+v*3-23,10,170),clamp(base*.6+v*2-15,10,110),clamp(base*.25+v-8,2,45)));
      }
    } else if(c===ROCK){
      const rv=(hash(x,y)&7)-4;
      fillTile(x,y,rgbSolid(95+rv,95+rv,100+rv));
      setPixel(x*T+(hash(x,y)%3),y*T+(hash(x,y+1)%3),rgbSolid(110+rv,110+rv,115+rv));
    } else if(c===FOOD){
      // background
      if(y<=SURFACE_ROW){
        const ph=isDay()?1:.4;
        const gv=hash(x,y)&15;
        fillTile(x,y,rgbSolid((50+gv)*ph|0,(120+gv)*ph|0,(20+gv)*ph|0));
      } else {
        const v=hash(x,y)&3;
        fillTile(x,y,rgbSolid(18+v,12+v,6));
      }
      fillRect(x*T+1,y*T+1,2,2,rgbSolid(232,80,48));
      setPixel(x*T+1,y*T+1,rgbSolid(240,128,64));
    } else if(c===EGG){
      const v=hash(x,y)&3;
      fillTile(x,y,rgbSolid(18+v,12+v,6));
      fillRect(x*T+1,y*T+1,2,2,rgbSolid(240,238,221));
    } else if(c===LARVA){
      const v=hash(x,y)&3;
      fillTile(x,y,rgbSolid(18+v,12+v,6));
      const wo=tick%20<10?0:1;
      fillRect(x*T+wo,y*T+1,3,2,rgbSolid(232,221,160));
    } else if(c===PUPA){
      const v=hash(x,y)&3;
      fillTile(x,y,rgbSolid(18+v,12+v,6));
      fillRect(x*T,y*T,3,3,rgbSolid(139,107,58));
    } else if(c===MOUND){
      // soil mound on surface
      const ph=isDay()?1:.5;
      fillTile(x,y,rgbSolid(110*ph|0,80*ph|0,40*ph|0));
      setPixel(x*T+1,y*T,rgbSolid(120*ph|0,90*ph|0,50*ph|0));
    } else if(c===FOOD2){
      // seed (yellow-brown)
      if(y<=SURFACE_ROW){
        const ph2=isDay()?1:.4;const gv2=hash(x,y)&15;
        fillTile(x,y,rgbSolid((50+gv2)*ph2|0,(120+gv2)*ph2|0,(20+gv2)*ph2|0));
      } else {
        const v2=hash(x,y)&3;fillTile(x,y,rgbSolid(18+v2,12+v2,6));
      }
      fillRect(x*T+1,y*T+1,2,2,rgbSolid(200,170,60));
      setPixel(x*T+2,y*T+1,rgbSolid(220,190,80));
    } else if(c===FOOD3){
      // sweet (green drop)
      if(y<=SURFACE_ROW){
        const ph3=isDay()?1:.4;const gv3=hash(x,y)&15;
        fillTile(x,y,rgbSolid((50+gv3)*ph3|0,(120+gv3)*ph3|0,(20+gv3)*ph3|0));
      } else {
        const v3=hash(x,y)&3;fillTile(x,y,rgbSolid(18+v3,12+v3,6));
      }
      fillRect(x*T+1,y*T+1,2,2,rgbSolid(80,190,60));
      setPixel(x*T+1,y*T+1,rgbSolid(100,220,80));
    } else if(c===CORPSE){
      const v=hash(x,y)&3;
      fillTile(x,y,rgbSolid(18+v,12+v,6));
      fillRect(x*T+1,y*T+1,2,2,rgbSolid(60,35,20));
    }
  }

  // ── PHEROMONE OVERLAY ──
  for(let y=SURFACE_ROW;y<ROWS;y++) for(let x=0;x<COLS;x++){
    const i=gi(x,y);
    const pt=phTrail[i],ph=phHome[i];
    if(pt>.03){
      const a=Math.min(.22,pt*.25);
      const px=x*T,py=y*T;
      for(let dy=0;dy<T;dy++) for(let dx=0;dx<T;dx++){
        const idx=(py+dy)*CW+(px+dx);
        const old=buf32[idx];
        const or2=old&0xff,og=(old>>8)&0xff,ob=(old>>16)&0xff;
        buf32[idx]=rgbSolid(
          clamp(or2+a*200|0,0,255),
          clamp(og+a*160|0,0,255),
          clamp(ob+a*30|0,0,255)
        );
      }
    }
    if(ph>.06){
      const a=Math.min(.12,ph*.1);
      const px=x*T,py=y*T;
      for(let dy=0;dy<T;dy++) for(let dx=0;dx<T;dx++){
        const idx=(py+dy)*CW+(px+dx);
        const old=buf32[idx];
        const or2=old&0xff,og=(old>>8)&0xff,ob=(old>>16)&0xff;
        buf32[idx]=rgbSolid(
          clamp(or2+a*40|0,0,255),
          clamp(og+a*80|0,0,255),
          clamp(ob+a*200|0,0,255)
        );
      }
    }
  }

  // ── PARTICLES ──
  for(const p of particles){
    const a=clamp(p.life/p.maxLife,0,1);
    // fade toward tunnel background color to avoid color shift
    const bg_r=18,bg_g=12,bg_b=6;
    setPixel(p.x|0,p.y|0,rgbSolid(bg_r+(p.r-bg_r)*a|0,bg_g+(p.g-bg_g)*a|0,bg_b+(p.b-bg_b)*a|0));
  }

  // ── ANTS ──
  for(const ant of ants) drawAnt(ant);

  // put pixel buffer to canvas
  ctx.putImageData(imgData,0,0);

  // ── HUD overlay ── (ctx API for proper alpha blending)
  ctx.fillStyle='rgba(0,0,0,0.55)';
  ctx.fillRect(2,2,96,52);
  drawHUD();

  // pause indicator
  if(paused){
    ctx.fillStyle='rgba(0,0,0,0.5)';
    ctx.fillRect(CW/2-24,CH/2-6,48,12);
    // pixel font "PAUSED" via small canvas trick
    ctx.fillStyle='#ddc8a0';
    ctx.font='8px monospace';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText('PAUSED',CW/2,CH/2);
  }
}

function drawAnt(ant){
  const px=ant.x*T,py=ant.y*T;
  const f=ant.dir;

  if(ant.type===T_QUEEN){
    fillRect(px,py-1,3,5,rgbSolid(58,21,5));
    fillRect(px,py,3,2,rgbSolid(90,40,16));
    setPixel(px+(f>0?2:0),py-1,rgbSolid(74,32,16));
    setPixel(px+(f>0?3:-1),py-2,rgbSolid(42,16,5));
    const lo=(tick+ant.x*3)%8<4?0:1;
    const lc=rgbSolid(48,16,8);
    setPixel(px-1,py+lo,lc);setPixel(px+3,py+1-lo,lc);
    setPixel(px-1,py+2+lo,lc);setPixel(px+3,py+3-lo,lc);
    setPixel(px+1,py-2,rgbSolid(255,215,0)); // crown
  } else if(ant.type===T_SOLDIER){
    fillRect(px,py,3,4,rgbSolid(37,10,2));
    fillRect(px,py+1,3,1,rgbSolid(64,21,5));
    setPixel(px+(f>0?2:0),py,rgbSolid(53,16,5));
    setPixel(px+(f>0?3:-1),py,rgbSolid(96,32,16)); // mandible
    const lo=(tick+ant.x*5)%8<4?0:1;
    setPixel(px-1,py+1+lo,rgbSolid(32,8,0));
    setPixel(px+3,py+2-lo,rgbSolid(32,8,0));
  } else {
    fillRect(px+1,py,2,3,rgbSolid(64,24,16));
    fillRect(px+1,py+1,2,1,rgbSolid(80,48,32));
    setPixel(px+(f>0?3:0),py,rgbSolid(74,37,24));
    setPixel(px+(f>0?3:-1),py-1,rgbSolid(42,16,5));
    const lo=(tick+ant.x*7)%8<4?0:1;
    const lc=rgbSolid(48,16,8);
    setPixel(px,py+lo,lc);setPixel(px+3,py+1-lo,lc);setPixel(px,py+2+lo,lc);
    // carry indicator
    if(ant.carry===2) fillRect(px+1,py-1,2,1,rgbSolid(232,80,48));
    else if(ant.carry===1) fillRect(px+1,py-1,2,1,rgbSolid(139,101,53));
    else if(ant.carry===3) fillRect(px+1,py-1,2,1,rgbSolid(60,35,20));
    else if(ant.carry===4) fillRect(px+1,py-1,2,1,rgbSolid(240,238,200)); // brood
  }
}

// ── PIXEL FONT ──────────────────────────────────────────────
const FONT={
'0':[7,5,5,5,7],'1':[2,6,2,2,7],'2':[7,1,7,4,7],'3':[7,1,7,1,7],'4':[5,5,7,1,1],
'5':[7,4,7,1,7],'6':[7,4,7,5,7],'7':[7,1,2,2,2],'8':[7,5,7,5,7],'9':[7,5,7,1,7],
'A':[7,5,7,5,5],'B':[6,5,6,5,6],'C':[7,4,4,4,7],'D':[6,5,5,5,6],'E':[7,4,7,4,7],
'F':[7,4,7,4,4],'G':[7,4,5,5,7],'H':[5,5,7,5,5],'I':[7,2,2,2,7],'K':[5,6,4,6,5],
'L':[4,4,4,4,7],'M':[5,7,7,5,5],'N':[5,7,7,5,5],'O':[7,5,5,5,7],'P':[7,5,7,4,4],
'R':[7,5,7,6,5],'S':[7,4,7,1,7],'T':[7,2,2,2,2],'U':[5,5,5,5,7],'V':[5,5,5,5,2],
'W':[5,5,7,7,5],'X':[5,5,2,5,5],'Y':[5,5,2,2,2],':':[0,2,0,2,0],' ':[0,0,0,0,0],
'+':[0,2,7,2,0],'-':[0,0,7,0,0],'/':[1,1,2,4,4],'.':[0,0,0,0,2],
};

function ctxText(str,x,y,col){
  // pixel font rendered via ctx.fillRect for pixel-art consistency
  str=str.toUpperCase();
  ctx.fillStyle=col;
  for(let c=0;c<str.length;c++){
    const gl=FONT[str[c]];
    if(!gl){x+=4;continue;}
    for(let row=0;row<5;row++){
      for(let bit=2;bit>=0;bit--){
        if(gl[row]&(1<<bit)) ctx.fillRect(x+(2-bit),y+row,1,1);
      }
    }
    x+=4;
  }
}

function drawHUD(){
  ctxText(`ANTS:${cntWorker+cntSoldier+1}`,4,4,'#ddc8a0');
  ctxText(`FOOD:${foodStored}`,4,11,'#ddc8a0');
  ctxText(`EGG:${cntEgg} L:${cntLarva} P:${cntPupa}`,4,18,'#ddc8a0');
  ctxText(`SPD:${simSpeed}X`,4,25,'#ddc8a0');
  const ts=dayPhase<.25?'NIGHT':dayPhase<.35?'DAWN':dayPhase<.65?'DAY':dayPhase<.75?'DUSK':'NIGHT';
  ctxText(ts,4,32,'#aab8cc');
  ctxText(`TICK:${tick}`,4,39,'#999');

  if(tick<600){
    ctxText('CLICK:FOOD WHEEL:ZOOM SPACE:PAUSE +/-:SPD',CW/2-90,CH-8,'rgba(160,160,140,0.6)');
  }
}

// ═══════════════════════════════════════════════════════════════
//  INPUT
// ═══════════════════════════════════════════════════════════════
// screen coords → grid coords (zoom-aware)
function screenToGrid(ex,ey){
  const s=baseScale*zoom;
  // reverse transform
  let tx=0,ty=0;
  const maxCX=Math.max(0,CW-innerWidth/s);
  const maxCY=Math.max(0,CH-innerHeight/s);
  const cx=clamp(camX,0,maxCX),cy=clamp(camY,0,maxCY);
  tx=CW*s<=innerWidth?(innerWidth-CW*s)/2:-cx*s;
  ty=CH*s<=innerHeight?(innerHeight-CH*s)/2:-cy*s;
  const px=(ex-tx)/s;
  const py=(ey-ty)/s;
  return{gx:px/T|0,gy:py/T|0};
}

// zoom with wheel
let dragging=false,dragSX=0,dragSY=0,dragCX=0,dragCY=0;
canvas.addEventListener('wheel',e=>{
  e.preventDefault();
  const oldZ=zoom;
  zoom=clamp(zoom*(e.deltaY<0?1.15:1/1.15),1,8);
  applyZoom();
},{passive:false});

// pan with drag
canvas.addEventListener('mousedown',e=>{
  if(zoom>1){dragging=true;dragSX=e.clientX;dragSY=e.clientY;dragCX=camX;dragCY=camY;canvas.style.cursor='grabbing';}
});
addEventListener('mousemove',e=>{
  if(!dragging)return;
  const s=baseScale*zoom;
  camX=dragCX-(e.clientX-dragSX)/s;
  camY=dragCY-(e.clientY-dragSY)/s;
  applyZoom();
});
addEventListener('mouseup',e=>{
  if(dragging){
    dragging=false;canvas.style.cursor='crosshair';
    if(Math.abs(e.clientX-dragSX)+Math.abs(e.clientY-dragSY)<5){
      placeFood(e.clientX,e.clientY);
    }
    return;
  }
});

canvas.addEventListener('click',e=>{
  if(zoom<=1) placeFood(e.clientX,e.clientY);
});

function placeFood(ex,ey){
  const{gx,gy}=screenToGrid(ex,ey);
  if(inB(gx,gy)){
    const c=grid[gi(gx,gy)];
    if(c===AIR||c===SURFACE||c===MOUND){
      grid[gi(gx,gy)]=randomFoodType();
      for(let dx=-1;dx<=1;dx++){
        const nx=gx+dx;
        if(inB(nx,gy)){const nc=grid[gi(nx,gy)];if(nc===AIR||nc===SURFACE||nc===MOUND)grid[gi(nx,gy)]=randomFoodType();}
      }
    }
  }
}

document.addEventListener('keydown',e=>{
  if(e.code==='Space'){e.preventDefault();paused=!paused;}
  if(e.key==='+'||e.key==='=')simSpeed=Math.min(20,simSpeed+1);
  if(e.key==='-')simSpeed=Math.max(1,simSpeed-1);
  if(e.key==='r'||e.key==='R')resetSim();
  if(e.code==='Escape'){zoom=1;camX=0;camY=0;applyZoom();}
});

// ═══════════════════════════════════════════════════════════════
//  SIMULATION TICK
// ═══════════════════════════════════════════════════════════════
function simTick(){
  tick++;
  dayPhase=(dayPhase+1/DAY_TICKS)%1;

  // update ants (iterate backwards for safe removal)
  for(let i=ants.length-1;i>=0;i--){
    if(!antTick(ants[i])){
      const dead=ants[i];
      if(dead.type===T_WORKER) cntWorker--;
      else if(dead.type===T_SOLDIER) cntSoldier--;
      ants.splice(i,1);
    }
  }

  broodTick();
  tickParticles();
  if(tick%2===0) pheromoneTick();

  // spawn food (scaled to colony size)
  const interval=Math.max(30,120-ants.length);
  if(tick%interval===0) spawnFood();

  // recount food (incremental is tricky with grid, do periodic recount)
  if(tick%60===0){
    foodStored=0;
    for(let y=SURFACE_ROW+1;y<ROWS;y++)
      for(let x=0;x<COLS;x++)
        if(isFood(grid[gi(x,y)]))foodStored++;
  }

  // purge completed dig goals + unclaim orphaned claims
  if(tick%500===0){
    digGoals=digGoals.filter(g=>!g.done);
    // unclaim goals whose claimant died
    for(const g of digGoals){
      if(g.claimed){
        const hasClaimant=ants.some(a=>a.goal===g);
        if(!hasClaimant) g.claimed=false;
      }
    }
  }

  // ensure dig goals exist
  if(tick%300===0){
    const active=digGoals.filter(g=>!g.done&&!g.claimed).length;
    if(active<3){
      // find deepest tunnel for branching
      let dX=queenX,dY=queenY;
      for(let y=ROWS-2;y>SURFACE_ROW;y--){
        for(let x=1;x<COLS-1;x++){
          if(grid[gi(x,y)]===AIR&&y>SURFACE_ROW&&y>dY){dX=x;dY=y;break;}
        }
        if(dY>queenY+5)break;
      }
      addDigGoals([{x:dX,y:dY,type:rngi(0,2)}]);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  INIT / RESET
// ═══════════════════════════════════════════════════════════════
function resetSim(){
  grid.fill(0);phTrail.fill(0);phHome.fill(0);
  ants=[];broods=[];particles=[];digGoals=[];
  tick=0;foodStored=0;dayPhase=.35;
  cntWorker=0;cntSoldier=0;cntEgg=0;cntLarva=0;cntPupa=0;
  skyCachePhase=-1;

  const rooms=generateWorld();

  // queen
  queenRef=createAnt(queenX,queenY,T_QUEEN);
  ants.push(queenRef);
  // workers
  for(let i=0;i<20;i++){
    const r=rooms[rngi(0,rooms.length-1)];
    const ax=r.x+rngi(-2,2),ay=r.y+rngi(-1,1);
    const ok=canStep(ax,ay);
    const a=createAnt(ok?ax:queenX+rngi(-2,2),ok?ay:queenY+rngi(-1,1),T_WORKER);
    a.age=rngi(0,800); // stagger ages (keep young)
    ants.push(a);
    cntWorker++;
  }
  // soldiers (few — more are produced from pupae)
  for(let i=0;i<2;i++){
    ants.push(createAnt(entranceX+rngi(-2,2),SURFACE_ROW+rngi(2,6),T_SOLDIER));
    cntSoldier++;
  }
}

// ═══════════════════════════════════════════════════════════════
//  GAME LOOP
// ═══════════════════════════════════════════════════════════════
let lastTime=0;
function gameLoop(ts){
  if(!paused){
    const ticks=Math.min(simSpeed,20);
    for(let i=0;i<ticks;i++) simTick();
  }
  render();
  requestAnimationFrame(gameLoop);
}

resetSim();
requestAnimationFrame(gameLoop);
