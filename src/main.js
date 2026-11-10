import * as THREE from 'three';

const $ = (id) => document.getElementById(id);
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.65));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#a9c2c3');
scene.fog = new THREE.FogExp2('#a9c2c3', 0.0032);
const camera = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, 0.1, 450);
const clock = new THREE.Clock();
const city = new THREE.Group(); scene.add(city);
const mat = (color, roughness = .86, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const mats = {
  asphalt: mat('#343a3b'), sidewalk: mat('#747976'), curb: mat('#bec0b6'), concrete: mat('#c8c0a9'),
  grass: mat('#667451'), darkGlass: mat('#1b3034', .3, { metalness: .34 }), roof: mat('#575b55'),
  white: mat('#e0dfd0'), yellow: mat('#e3c954', .7), trunk: mat('#514337'), leaf: mat('#64785b'),
  water: mat('#42888a', .25, { metalness: .25 }),
};
scene.add(new THREE.HemisphereLight('#e5f3ea', '#39433c', 2.0));
const sun = new THREE.DirectionalLight('#fff0ce', 3.25); sun.position.set(-75, 120, 45); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -115; sun.shadow.camera.right = 115; sun.shadow.camera.top = 115; sun.shadow.camera.bottom = -115; sun.shadow.bias = -.00035; scene.add(sun);
const fill = new THREE.DirectionalLight('#71d5d4', .8); fill.position.set(65, 35, -90); scene.add(fill);
const boxGeo = new THREE.BoxGeometry(1, 1, 1), planeGeo = new THREE.PlaneGeometry(1, 1);
const rnd = (() => { let s = 987654321; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
const rand = (a,b) => a + rnd() * (b-a);
const meshBox = (parent, x,y,z, sx,sy,sz, material, cast = false) => {
  const m = new THREE.Mesh(boxGeo, material); m.position.set(x,y,z); m.scale.set(sx,sy,sz); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
};
const plane = (parent,x,z,sx,sz,material,y=.02) => { const m = new THREE.Mesh(planeGeo, material); m.rotation.x=-Math.PI/2; m.position.set(x,y,z); m.scale.set(sx,sz,1); m.receiveShadow=true; parent.add(m); return m; };
const roads = [-84,-56,-28,0,28,56,84];
const world = { min:-102, max:102, road:7, player:new THREE.Vector3(0,0,5) };
plane(city,0,0,230,230,mat('#78806c'),-.2);
// City edge and an open waterfront make the map read as a real place.
plane(city,119,0,30,225,mats.water,-.05);
for(let i=-100;i<=100;i+=5){ const ripple = new THREE.Mesh(new THREE.BoxGeometry(rand(3,10),.018,.045),mat('#93c7b5',.3,{transparent:true,opacity:.32})); ripple.position.set(119+rand(-11,11),.02,i+rand(-2,2)); city.add(ripple); }
// Full connected road grid, sidewalks, lane dashes and crosswalks.
for(const r of roads){
  plane(city,r,0,7.2,204,mats.asphalt,.01); plane(city,0,r,204,7.2,mats.asphalt,.012);
  plane(city,r-4.1,0,1.05,204,mats.sidewalk,.03); plane(city,r+4.1,0,1.05,204,mats.sidewalk,.03);
  plane(city,0,r-4.1,204,1.05,mats.sidewalk,.031); plane(city,0,r+4.1,204,1.05,mats.sidewalk,.031);
  for(let n=-98;n<=98;n+=10){
    plane(city,r, n, .11,3.8,mats.yellow,.035); plane(city,n,r,3.8,.11,mats.yellow,.036);
  }
  for(const cross of roads){
    for(let k=-3;k<=3;k++){
      plane(city,r+k*.72,cross-4.6,.38,.95,mats.white,.04); plane(city,cross-4.6,r+k*.72,.95,.38,mats.white,.04);
    }
  }
}
// Central boulevard median, palms and street lamps.
plane(city,-1.15,0,.62,204,mat('#667253'),.055);
const trunkGeo=new THREE.CylinderGeometry(.13,.21,2.4,6), palmMat=mat('#766047');
const crownMat=mat('#4b7358');
function addPalm(x,z,scale=1){
  const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);city.add(g);
  const t=new THREE.Mesh(trunkGeo,palmMat);t.position.y=1.2;t.castShadow=true;g.add(t);
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const leaf=new THREE.Mesh(new THREE.ConeGeometry(.42,3.1,5),crownMat);leaf.position.set(Math.sin(a)*.95,2.55,Math.cos(a)*.95);leaf.rotation.z=Math.cos(a)*.8;leaf.rotation.x=Math.sin(a)*.8;leaf.scale.set(.55,1,.28);leaf.castShadow=true;g.add(leaf);}
}
for(const r of roads){for(let z=-91;z<=91;z+=21){addPalm(r+5.0,z,.76); if(r===0)addPalm(-1.1,z,.88);}}
const lampMat=mat('#303a39'); const lampGlow=new THREE.MeshBasicMaterial({color:'#fff0af'});
for(const r of roads){for(let p=-90;p<=90;p+=28){
  const g=new THREE.Group();g.position.set(r+5.1,0,p+5);city.add(g);
  meshBox(g,0,2.1,0,.13,4.2,.13,lampMat);meshBox(g,.55,4.1,0,1.2,.09,.11,lampMat);meshBox(g,1.1,3.96,0,.3,.2,.26,lampGlow);
}}
// Block lots: mixed low-rise storefronts, apartment towers and warehouse roofs.
const windowInstances=[]; const neonInstances=[]; const obstacles=[];
const palettes=['#b5a68e','#89928e','#c3b9a2','#737d7b','#c0a996','#687879','#a7ada2','#95877b','#d0bea1'];
const buildingNames=['MOTEL','PALM CLUB','LAUNDROMAT','CORNER STORE','STUDIO 8','CITY MARKET','AUTO WORKS','SUNSET INN','MIRAGE','LIQUOR','NIGHT OWL','VESPER'];
const buildingMatPool=palettes.map(c=>mat(c));
const windowGeom=new THREE.PlaneGeometry(.72,.92), windowLit=mat('#efc477',.35,{emissive:'#edab4f',emissiveIntensity:1.2}), windowDark=mat('#20373a',.4,{metalness:.18});
function addBuilding(x,z,w,d,h,idx){
  obstacles.push({x,z,w:w+.6,d:d+.6});
  const g=new THREE.Group();g.position.set(x,0,z);city.add(g);
  const bodyMat=buildingMatPool[Math.floor(rnd()*buildingMatPool.length)];
  meshBox(g,0,h/2,0,w,h,d,bodyMat,true);
  meshBox(g,0,.35,0,w+.55,.7,d+.55,mat('#bcb7a5'),false);
  meshBox(g,0,h+.25,0,w+.25,.5,d+.25,mats.roof);
  // Parapets, rooftop machinery, vents.
  for(const side of [-1,1]){meshBox(g,side*(w/2-.1),h+.62,0,.22,.35,d+.15,mat('#77796e'));meshBox(g,0,h+.62,side*(d/2-.1),w+.15,.35,.22,mat('#77796e'));}
  for(let j=0;j<2+Math.floor(rnd()*3);j++){
    const ac=meshBox(g,rand(-w*.28,w*.28),h+.8,rand(-d*.28,d*.28),rand(.7,1.4),.45,rand(.65,1.1),mat('#686e68'),true);
    meshBox(g,ac.position.x,h+1.05,ac.position.z,.34,.05,.22,mat('#9a9c8b'));
  }
  const floors=Math.floor(h/3.3), cols=Math.max(2,Math.floor(w/2.15));
  for(let fy=0;fy<floors;fy++){
    for(let c=0;c<cols;c++){
      const wx=-w/2+1.1+c*(w-2.2)/Math.max(1,cols-1), wy=2.15+fy*3.25;
      if(wy>h-1.1)continue;
      if(!(fy===0&&c===Math.floor(cols/2))){
        windowInstances.push({x:x+wx,y:wy,z:z+d/2+.014,rot:0,lit:rnd()>.55});
        if(w>12&&c%2===0)windowInstances.push({x:x+wx,y:wy,z:z-d/2-.014,rot:Math.PI,lit:rnd()>.63});
      }
      if(d>10&&c%2===0){const wz=-d/2+1.5+(c/Math.max(1,cols-1))*(d-3);windowInstances.push({x:x+w/2+.014,y:wy,z:z+wz,rot:Math.PI/2,lit:rnd()>.65});}
    }
  }
  const door=mat('#334442');meshBox(g,0,1.2,d/2+.05,1.5,2.4,.15,door);
  meshBox(g,0,2.8,d/2+.12,Math.min(w-1,5),.44,.12,mat('#243436'));
  meshBox(g,0,2.8,d/2+.2,Math.min(w-1,4.7),.24,.04,idx%3===0?mat('#54d9d4',.4,{emissive:'#36b9b8',emissiveIntensity:2}):mat('#dfc36a',.4,{emissive:'#bb8738',emissiveIntensity:1.1}));
  // Shopfront awnings on selected street corners.
  if(idx%4===0){meshBox(g,0,3.35,d/2+.65,w*.75,.18,1.0,mat(idx%8?'#d4c77c':'#41b8b2'));}
}
let bi=0;
for(let zi=0;zi<roads.length-1;zi++)for(let xi=0;xi<roads.length-1;xi++){
  const x1=roads[xi]+5.1,x2=roads[xi+1]-5.1,z1=roads[zi]+5.1,z2=roads[zi+1]-5.1;
  const bx=(x1+x2)/2,bz=(z1+z2)/2;
  // A few courtyards, plazas and pocket parks break up the grid.
  if((xi===2&&zi===3)||(xi===4&&zi===1)||(xi===5&&zi===5)){
    plane(city,bx,bz,17,17,mat('#71865c'),.045);
    for(let p=0;p<4;p++)addPalm(bx+rand(-6,6),bz+rand(-6,6),.85);
    for(let p=0;p<3;p++){const bench=meshBox(city,bx+rand(-5,5),.35,bz+rand(-5,5),2,.35,.55,mat('#775c43'));bench.rotation.y=rand(0,3);}
    continue;
  }
  const count=1+(rnd()>.42?1:0)+(rnd()>.83?1:0);
  for(let n=0;n<count;n++){
    const w=count===1?rand(11,17):rand(7.5,10.5),d=count===1?rand(10,17):rand(8,12);
    const px=bx+(count===1?rand(-1.6,1.6):(n===0?-5.7:5.7)),pz=bz+(count===1?rand(-1.6,1.6):rand(-4.3,4.3));
    const h=rand(7,15)+(rnd()>.55?rand(4,17):0);addBuilding(px,pz,w,d,h,bi++);
  }
}
// Signature high rises at the north edge and the waterfront hotel.
function landmark(x,z,name,color,height=34){
  const w=14,d=14;const g=new THREE.Group();g.position.set(x,0,z);city.add(g);
  meshBox(g,0,height/2,0,w,height,d,mat('#677573'),true);
  meshBox(g,0,height+.5,0,w+.7,1,d+.7,mat('#313b39'));
  for(let f=0;f<Math.floor(height/3);f++)for(let c=0;c<5;c++){
    const glow=rnd()>.42?windowLit:windowDark;
    for(const side of [0,Math.PI/2]){const m=new THREE.Mesh(windowGeom,glow);m.position.set(-5.4+c*2.7,2+f*2.7,d/2+.02);m.rotation.y=side;m.scale.set(1,1,1);g.add(m);}
  }
  meshBox(g,0,height-2,d/2+.3,8,2,.25,mat(color,.35,{emissive:color,emissiveIntensity:1.3}));
  meshBox(g,0,1,d/2+1,7,2,.6,mat('#253a3a'));
  const logo=makeLabel(name,color);logo.position.set(x, height-1,z+d/2+.5);scene.add(logo);
  return g;
}
function makeLabel(text,color='#e8f077'){
  const c=document.createElement('canvas');c.width=512;c.height=100;const ctx=c.getContext('2d');ctx.fillStyle='#111b1dbd';ctx.fillRect(0,0,512,100);ctx.strokeStyle=color;ctx.lineWidth=4;ctx.strokeRect(4,4,504,92);ctx.fillStyle=color;ctx.font='800 52px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,51);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(12,2.35),new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide}));m.position.y=0;return m;
}
landmark(-70,-72,'THE ORPHEUM','#62e1dd',29);
landmark(70,-70,'VESPER HOTEL','#e1d47b',38);
landmark(70,70,'PALM CLUB','#e282c8',30);
landmark(-70,70,'AUTO WORKS','#d8ff52',24);
// Grounded storefront lots and a patterned pier at the waterfront.
for(let i=0;i<9;i++){meshBox(city,105+i*3,.35,rand(-62,62),.65,.7,1.2,mat('#87704e'));}
// Place instances for hundreds of glowing and dark windows with minimal draw calls.
function installWindows(isLit){const list=windowInstances.filter(w=>w.lit===isLit);const m=new THREE.InstancedMesh(windowGeom,isLit?windowLit:windowDark,list.length);const dummy=new THREE.Object3D();for(let i=0;i<list.length;i++){const w=list[i];dummy.position.set(w.x,w.y,w.z);dummy.rotation.set(0,w.rot,0);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);}m.instanceMatrix.needsUpdate=true;city.add(m);}
installWindows(false);installWindows(true);

// Decorative alley props: bins, benches and tiny neon wayfinding signs.
const binsMat=mat('#3c5550');
for(let i=0;i<80;i++){
  const x=rand(-88,88),z=rand(-88,88);if(roads.some(r=>Math.abs(x-r)<6||Math.abs(z-r)<6))continue;
  if(rnd()>.55)meshBox(city,x,.55,z,.65,1.1,.65,binsMat);
  else {const post=meshBox(city,x,1.4,z,.12,2.8,.12,mat('#384340'));meshBox(city,x,2.8,z,.85,.35,.15,mat('#c2ac60'));}
}
// Simple, colorful traffic that cruises the connected road lanes.
const traffic=[];const carColors=['#cf5549','#e2c36d','#507f9b','#d8ddd3','#373c40','#64a38f','#b989ad'];
function makeCar(color){
  const g=new THREE.Group();const body=mat(color,.48,{metalness:.18});
  meshBox(g,0,.68,0,2.05,.72,3.8,body,true);meshBox(g,0,1.22,-.12,1.65,.55,1.9,mat('#24383c',.22,{metalness:.3}),true);
  for(const s of [-1,1]){meshBox(g,s*.68,.55,1.92,.38,.2,.08,mat('#fff2be',.25,{emissive:'#ffe9a4',emissiveIntensity:1.6}));meshBox(g,s*.68,.55,-1.92,.38,.2,.08,mat('#d65d4d',.25,{emissive:'#b9281c',emissiveIntensity:.7}));}
  for(const s of [-1,1])for(const z of [-1.25,1.25]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.39,.39,.2,10),mat('#202729'));wheel.rotation.z=Math.PI/2;wheel.position.set(s*1.03,.4,z);g.add(wheel);}
  return g;
}
for(let i=0;i<21;i++){
  const g=makeCar(carColors[i%carColors.length]);city.add(g);
  const horizontal=i%2===0, road=roads[Math.floor(rnd()*roads.length)];
  traffic.push({g,horizontal,road,at:rand(-94,94),speed:rand(3.2,6.8),dir:rnd()>.5?1:-1});
}
// Original, stylized player avatars built from geometry so the game is fully self contained.
function makeAvatar(kind){
  const g=new THREE.Group();const isZara=kind==='zara';
  const skin=mat(isZara?'#a76d4b':'#9a6548'), outfit=mat(isZara?'#233638':'#c5c944'), shirt=mat(isZara?'#4fb7b3':'#252f34'), hair=mat(isZara?'#211a19':'#171d1c'), pants=mat(isZara?'#25242e':'#22282a'), shoes=mat('#161b1b');
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.43,.75,4,8),shirt);torso.position.y=1.48;torso.castShadow=true;g.add(torso);
  const jacket=new THREE.Mesh(new THREE.BoxGeometry(.91,.92,.53),outfit);jacket.position.set(0,1.53,0);jacket.castShadow=true;g.add(jacket);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.31,16,12),skin);head.position.set(0,2.32,0);head.scale.set(.86,1.1,.9);head.castShadow=true;g.add(head);
  const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.32,12,8,0,Math.PI*2,0,Math.PI*.52),hair);hairCap.position.set(0,2.4,-.01);g.add(hairCap);
  if(isZara){const pony=new THREE.Mesh(new THREE.CapsuleGeometry(.1,.45,3,7),hair);pony.position.set(-.25,2.06,-.12);pony.rotation.z=-.4;g.add(pony);}
  const legGeo=new THREE.CapsuleGeometry(.15,.55,3,7),armGeo=new THREE.CapsuleGeometry(.13,.5,3,7);
  const legs=[],arms=[];
  for(const side of [-1,1]){
    const leg=new THREE.Mesh(legGeo,pants);leg.position.set(side*.23,.65,0);leg.castShadow=true;g.add(leg);legs.push(leg);
    const shoe=meshBox(g,side*.23,.17,.1,.32,.2,.5,shoes);shoe.castShadow=true;
    const arm=new THREE.Mesh(armGeo,outfit);arm.position.set(side*.53,1.52,0);arm.rotation.z=side*-.12;arm.castShadow=true;g.add(arm);arms.push(arm);
  }
  g.userData={legs,arms,kind};return g;
}
const players={miles:makeAvatar('miles'),zara:makeAvatar('zara')};
for(const p of Object.values(players)){p.visible=false;scene.add(p);}
let active='miles',player=players[active],playing=false,gameTime=0,walkPhase=0;
const missions=[
 {x:23,z:5,title:'A FRESH START',copy:'Meet your contact by the old theater.',prompt:'TALK TO YOUR CONTACT',label:'FIND YOUR CONTACT',name:'THE ORPHEUM'},
 {x:-39,z:-44,title:'THE FIRST FAVOR',copy:'Pick up the envelope at the night market.',prompt:'COLLECT THE ENVELOPE',label:'HEAD TO THE NIGHT MARKET',name:'NIGHT MARKET'},
 {x:39,z:41,title:'CITY LIGHTS',copy:'Check in with Zara at Palm Club.',prompt:'CHECK IN AT PALM CLUB',label:'MEET ZARA AT PALM CLUB',name:'PALM CLUB'},
 {x:-67,z:37,title:'A NEW ROUTE',copy:'The city is open. Go wherever you want.',prompt:'EXPLORE THE CITY',label:'EXPLORE LOS SANTOS',name:'AUTO WORKS'},
];
let missionIndex=0,completed=0,cash=2450,rep=0;
const markers=new THREE.Group();scene.add(markers);
const missionObjects=[];
missions.forEach((m,i)=>{
  const group=new THREE.Group();group.position.set(m.x,0,m.z);scene.add(group);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.2,.12,8,40),mat(i===0?'#d8ff52':'#55e4d8',.3,{emissive:i===0?'#b4e23a':'#28c5bd',emissiveIntensity:1.8}));ring.rotation.x=Math.PI/2;ring.position.y=.2;group.add(ring);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.1,.95,6,12,1,true),new THREE.MeshBasicMaterial({color:i===0?'#d8ff52':'#55e4d8',transparent:true,opacity:.11,side:THREE.DoubleSide}));beam.position.y=3;group.add(beam);
  const orb=new THREE.Mesh(new THREE.SphereGeometry(.34,16,12),new THREE.MeshBasicMaterial({color:i===0?'#efff8d':'#9afff6'}));orb.position.y=5.8;group.add(orb);
  const label=makeLabel('✦  '+m.name,i===0?'#d8ff52':'#73e7df');label.scale.set(.75,.75,.75);label.position.set(m.x,7.3,m.z);scene.add(label);
  missionObjects.push({group,ring,beam,orb,label});
});
function showToast(message){const t=$('toast');t.textContent=message;t.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove('show'),2300);}
function refreshMission(){
  $('missionTitle').textContent=missions[missionIndex].title;$('missionCopy').textContent=missions[missionIndex].copy;
  $('objectiveLabel').textContent=missions[missionIndex].label;$('missionProgress').style.width=`${Math.max(12,completed/3*100)}%`;
  $('repAmount').textContent=String(rep).padStart(2,'0');$('cashAmount').textContent='$'+cash.toLocaleString('en-US');
  missionObjects.forEach((o,i)=>{const activeTarget=i===missionIndex&&missionIndex<3;o.group.visible=activeTarget;o.label.visible=activeTarget;});
}
function interact(){
  if(!playing)return;const m=missions[missionIndex];const d=Math.hypot(player.position.x-m.x,player.position.z-m.z);
  if(d>4.5){showToast('Get closer to the highlighted marker.');return;}
  if(missionIndex<3){completed++;rep+=25;cash+=500;$('completeText').textContent=['Good first impression.','You are starting to get noticed.','The city is opening up.'][missionIndex];$('completeBanner').classList.remove('hidden');$('completeBanner').classList.add('show');setTimeout(()=>$('completeBanner').classList.remove('show'),2800);setTimeout(()=>$('completeBanner').classList.add('hidden'),3300);missionIndex++;refreshMission();showToast('New lead added to your phone.');}
  else showToast('Explore the city — you make the rules.');
}

// City map drawing is deliberately sharp and legible at phone size.
function drawMap(target,large=false){
  const ctx=target.getContext('2d'),w=target.width,h=target.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#19282a';ctx.fillRect(0,0,w,h);
  const pad=large?17:5,scale=Math.min(w,h)-pad*2;const X=x=>pad+(x+102)/204*scale,Y=z=>pad+(z+102)/204*scale;
  ctx.fillStyle='#286d71';ctx.fillRect(X(102),pad,w-pad-X(102),scale);
  ctx.fillStyle='#688052';for(const p of [[-60,-60],[8,20],[60,-40]])ctx.fillRect(X(p[0]-7),Y(p[1]-7),scale*14/204,scale*14/204);
  ctx.strokeStyle='#495255';ctx.lineWidth=large?6:2.5;roads.forEach(r=>{ctx.beginPath();ctx.moveTo(X(r),pad);ctx.lineTo(X(r),pad+scale);ctx.stroke();ctx.beginPath();ctx.moveTo(pad,Y(r));ctx.lineTo(pad+scale,Y(r));ctx.stroke();});
  ctx.strokeStyle='#b8b397';ctx.lineWidth=large?1.5:.6;for(const r of roads){ctx.beginPath();ctx.moveTo(X(r-4.1),pad);ctx.lineTo(X(r-4.1),pad+scale);ctx.stroke();ctx.beginPath();ctx.moveTo(pad,Y(r-4.1));ctx.lineTo(pad+scale,Y(r-4.1));ctx.stroke();}
  for(let i=0;i<4;i++){const m=missions[i];ctx.fillStyle=i===missionIndex?'#e4ff64':'#61ded7';ctx.beginPath();ctx.arc(X(m.x),Y(m.z),large?5:3,0,Math.PI*2);ctx.fill();if(large){ctx.fillStyle='#eff4e8';ctx.font='700 9px sans-serif';ctx.fillText(m.name,X(m.x)+8,Y(m.z)+3);}}
  ctx.fillStyle='#54d9d4';[[-70,-72],[70,-70],[70,70],[-70,70]].forEach(p=>{ctx.beginPath();ctx.arc(X(p[0]),Y(p[1]),large?3.5:2,0,Math.PI*2);ctx.fill();});
  const px=X(player.position.x),py=Y(player.position.z);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px,py,large?5.5:4,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=large?2:1;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+Math.sin(player.rotation.y)*(large?12:8),py-Math.cos(player.rotation.y)*(large?12:8));ctx.stroke();
  if(mapWaypoint){ctx.strokeStyle='#d8ff52';ctx.lineWidth=large?2:1;ctx.setLineDash([large?5:3,large?4:2]);ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(X(mapWaypoint.x),Y(mapWaypoint.z));ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#d8ff52';ctx.beginPath();ctx.arc(X(mapWaypoint.x),Y(mapWaypoint.z),large?5:3,0,Math.PI*2);ctx.fill();}
  if(large){ctx.strokeStyle='#ffffff22';ctx.lineWidth=1;ctx.strokeRect(pad,pad,scale,scale);}
}
let mapWaypoint=null;
function updateUI(){
  const m=missions[missionIndex],d=Math.hypot(player.position.x-m.x,player.position.z-m.z);
  $('objectiveDistance').textContent=missionIndex===3?'FREE ROAM':`${Math.round(d)} M`;
  $('locationText').textContent=player.position.z < -35?'VESPER HEIGHTS':player.position.z>35?'PALM DISTRICT':'DOWNTOWN';
  $('districtLabel').textContent=$('locationText').textContent;
  const prompt=$('interactionPrompt');prompt.classList.toggle('visible',playing&&d<5.4);$('promptText').textContent=m.prompt;
  drawMap($('minimap'));if(!$('cityModal').classList.contains('hidden'))drawMap($('bigmap'),true);
}
function showMap(){ $('cityModal').classList.remove('hidden');drawMap($('bigmap'),true); }
function closeMap(){ $('cityModal').classList.add('hidden'); }
function showPhone(){ $('phoneModal').classList.remove('hidden'); }
function closePhone(){ $('phoneModal').classList.add('hidden'); }
let keys={},moveX=0,moveY=0,sprintTouch=false,dragging=false,lastX=0,cameraYaw=0;
function chooseCharacter(kind){
  active=kind;player=players[kind];Object.values(players).forEach(p=>p.visible=p===player);player.position.set(world.player.x,0,world.player.z);
  document.querySelectorAll('.character-card').forEach(el=>el.classList.toggle('selected',el.dataset.character===kind));
}
document.querySelectorAll('.character-card').forEach(el=>el.addEventListener('click',()=>chooseCharacter(el.dataset.character)));
chooseCharacter('miles');
$('playBtn').addEventListener('click',()=>{playing=true;$('intro').classList.add('hidden');showToast(`Welcome to the city, ${active==='miles'?'Miles':'Zara'}. Find the glowing marker.`);});
$('mapBtn').addEventListener('click',showMap);$('expandMap').addEventListener('click',showMap);$('closeMap').addEventListener('click',closeMap);
$('phoneBtn').addEventListener('click',showPhone);$('closePhone').addEventListener('click',closePhone);$('phoneDone').addEventListener('click',closePhone);
$('phoneMap').addEventListener('click',()=>{closePhone();showMap();});
$('phoneJobs').addEventListener('click',()=>{closePhone();showToast(`${missions[missionIndex].title} · ${missions[missionIndex].copy}`);});
$('phoneStats').addEventListener('click',()=>showToast(`REP ${rep} · CASH $${cash.toLocaleString()}`));
$('touchInteract').addEventListener('pointerdown',e=>{e.preventDefault();interact();});
$('touchSprint').addEventListener('pointerdown',e=>{e.preventDefault();sprintTouch=true;});$('touchSprint').addEventListener('pointerup',()=>sprintTouch=false);$('touchSprint').addEventListener('pointercancel',()=>sprintTouch=false);
const stickZone=$('stickZone'),stickRing=stickZone.querySelector('.stick-ring'),knob=$('stickKnob');let stickPointer=null,stickRect;
stickZone.addEventListener('pointerdown',e=>{e.preventDefault();stickPointer=e.pointerId;stickZone.setPointerCapture(e.pointerId);stickRect=stickZone.getBoundingClientRect();setStick(e);});
stickZone.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)setStick(e);});
function setStick(e){const rect=stickRing.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;let dx=(e.clientX-cx)/48,dy=(e.clientY-cy)/48;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l;}moveX=dx;moveY=dy;knob.style.left=`${50+dx*35}%`;knob.style.top=`${50+dy*35}%`;}
function resetStick(e){if(e.pointerId!==stickPointer)return;stickPointer=null;moveX=moveY=0;knob.style.left='50%';knob.style.top='50%';}
stickZone.addEventListener('pointerup',resetStick);stickZone.addEventListener('pointercancel',resetStick);
$('bigmap').addEventListener('click',e=>{const r=e.currentTarget.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,pz=(e.clientY-r.top)/r.height;mapWaypoint={x:THREE.MathUtils.clamp(px*204-102,-99,99),z:THREE.MathUtils.clamp(pz*204-102,-99,99)};showToast('Waypoint set on your map.');closeMap();});
window.addEventListener('keydown',e=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  keys[e.code]=true;if(e.repeat)return;
  if(e.code==='KeyE'||e.code==='Enter'&&playing)interact();
  if(e.code==='KeyM')showMap();if(e.code==='Escape'){closeMap();closePhone();}
  if(e.code==='KeyF')showPhone();if(e.code==='KeyQ'&&playing){chooseCharacter(active==='miles'?'zara':'miles');showToast(`Now playing ${active==='miles'?'Miles':'Zara'}.`);}
  if(e.code==='Space'&&playing)player.position.y=.2;
});window.addEventListener('keyup',e=>{keys[e.code]=false;});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'){dragging=true;lastX=e.clientX;}});
window.addEventListener('pointerup',()=>dragging=false);
window.addEventListener('pointermove',e=>{if(dragging){cameraYaw-=(e.clientX-lastX)*.004;lastX=e.clientX;}});
$('soundBtn').addEventListener('click',()=>showToast('City ambience is on.'));
function collides(x,z){return obstacles.some(o=>Math.abs(x-o.x)<o.w/2+.5&&Math.abs(z-o.z)<o.d/2+.5);}
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.04);gameTime+=dt;
  const forward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-moveY;
  const strafe=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+moveX;
  if(playing){let vx=-Math.sin(cameraYaw)*forward+Math.cos(cameraYaw)*strafe, vz=-Math.cos(cameraYaw)*forward-Math.sin(cameraYaw)*strafe;const mag=Math.hypot(vx,vz);if(mag>1){vx/=mag;vz/=mag;}
    const speed=(keys.ShiftLeft||keys.ShiftRight||sprintTouch?9.3:5.7),nx=THREE.MathUtils.clamp(player.position.x+vx*speed*dt,-98,98),nz=THREE.MathUtils.clamp(player.position.z+vz*speed*dt,-98,98);
    if(!collides(nx,player.position.z))player.position.x=nx;if(!collides(player.position.x,nz))player.position.z=nz;
    if(mag>.04){player.rotation.y=Math.atan2(-vx,-vz);walkPhase+=dt*speed*1.35;player.userData.legs.forEach((l,i)=>l.rotation.x=Math.sin(walkPhase+i*Math.PI)*.65);player.userData.arms.forEach((a,i)=>a.rotation.x=Math.sin(walkPhase+i*Math.PI+Math.PI)*.45);}else{player.userData.legs.forEach(l=>l.rotation.x*=.8);player.userData.arms.forEach(a=>a.rotation.x*=.8);}
    player.position.y=Math.max(0,player.position.y-dt*1.6);
  }
  traffic.forEach(c=>{c.at+=c.speed*c.dir*dt;if(c.at>101)c.at=-101;if(c.at<-101)c.at=101;if(c.horizontal){c.g.position.set(c.at,.03,c.road+(c.dir>0?1.55:-1.55));c.g.rotation.y=c.dir>0?Math.PI/2:-Math.PI/2;}else{c.g.position.set(c.road+(c.dir>0?-1.5:1.5),.03,c.at);c.g.rotation.y=c.dir>0?0:Math.PI;}});
  missionObjects.forEach((o,i)=>{o.group.position.y=.08+Math.sin(gameTime*2.2+i)*.1;o.ring.rotation.z=gameTime*.45;o.orb.position.y=5.8+Math.sin(gameTime*2.6+i)*.3;});
  const distance=17,camX=player.position.x+Math.sin(cameraYaw)*distance,camZ=player.position.z+Math.cos(cameraYaw)*distance;
  camera.position.lerp(new THREE.Vector3(camX,player.position.y+13,camZ),1-Math.pow(.002,dt));camera.lookAt(player.position.x,player.position.y+1.1,player.position.z);
  if(Math.floor(gameTime*5)!==Math.floor((gameTime-dt)*5))updateUI();
  renderer.render(scene,camera);
}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));}
window.addEventListener('resize',resize);
$('loading').classList.add('done');setTimeout(()=>$('loading').remove(),600);
refreshMission();updateUI();frame();
