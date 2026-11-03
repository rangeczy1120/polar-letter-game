import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Geometry and textures are generated locally; the standalone game needs no asset server.
export function refineArt(scene, model) {
  const root=model.world; let seed=671;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.9,...extra});
  function texture(draw,size=256){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=2;return t;}
  const grain=texture((c,n)=>{c.fillStyle='#c7ae8d';c.fillRect(0,0,n,n);for(let i=0;i<180;i++){c.strokeStyle=`rgba(${i%2?'61,31,13':'241,208,155'},${.03+random()*.13})`;c.lineWidth=.3+random()*1.3;c.beginPath();const y=random()*n;for(let x=0;x<=n;x+=8)c.lineTo(x,y+Math.sin(x*.04+i)*1.8);c.stroke();}for(let i=0;i<8;i++){c.strokeStyle='#6f472221';c.lineWidth=.8;const x=random()*n,y=random()*n;for(let r=2;r<8;r+=2){c.beginPath();c.ellipse(x,y,r*2,r,0,0,Math.PI*2);c.stroke();}}});
  const weave=texture((c,n)=>{c.fillStyle='#cdc9b7';c.fillRect(0,0,n,n);for(let i=0;i<n;i+=4){c.strokeStyle=i%8?'#b4b2a044':'#fff7dc55';c.beginPath();c.moveTo(i,0);c.lineTo(i,n);c.moveTo(0,i);c.lineTo(n,i);c.stroke();}});
  const snowGrain=texture((c,n)=>{c.fillStyle='#e1e9ec';c.fillRect(0,0,n,n);for(let i=0;i<6500;i++){c.fillStyle=`rgba(79,118,144,${random()*.08})`;c.fillRect(random()*n,random()*n,1,1);}});
  snowGrain.repeat.set(40,40);
  const snow=material('#b6c9da',{map:snowGrain}),timber=material('#8a6846',{map:grain}),dark=material('#493e32',{map:grain}),cream=material('#d0cbbb',{map:weave}),fabric=material('#668a89',{map:weave}),rock=material('#708795');
  const glow=new T.MeshBasicMaterial({color:'#f6d39a'});
  const rounded=(name,pos,size,mat,parent=root,r=.12)=>{const mesh=new T.Mesh(new RoundedBoxGeometry(...size,2,Math.min(r,...size.map(v=>v*.45))),mat);mesh.name=name;mesh.position.set(...pos);parent.add(mesh);return mesh;};
  const ellipsoid=(name,pos,scale,mat,parent=root)=>{const mesh=new T.Mesh(new T.SphereGeometry(1,16,10),mat);mesh.name=name;mesh.position.set(...pos);mesh.scale.set(...scale);parent.add(mesh);return mesh;};
  const cylinder=(name,pos,r,h,mat,parent=root)=>{const m=new T.Mesh(new T.CylinderGeometry(r,r,h,16),mat);m.name=name;m.position.set(...pos);parent.add(m);return m;};
  const originals=[];root.traverse(o=>originals.push(o));
  for(const o of originals){
    if(!o.isMesh)continue;
    if(['DistantPeak','FirSnowCap','SnowFir','TimberSeam_W','TimberSeam_E','TimberSeam_N','CrystalBase','SnowRoof','Chimney','WritingTable'].includes(o.name)){o.removeFromParent();continue;}
    const color=o.material.color?.getHexString();
    if(['73533c','aa8260'].includes(color))o.material=timber;
    if(color==='382e2a')o.material=dark;
    if(o.name.startsWith('Wall_')){o.material=timber;const p=o.geometry.parameters;if(p?.width)o.geometry=new RoundedBoxGeometry(p.width,p.height,p.depth,1,.055);}
    if(['BedFrame','Mattress','Duvet','Pillow','Hearth','Mantel','FireplaceSide','LakeBreathingStone','BeaconSwitch'].includes(o.name)){
      const p=o.geometry.parameters;o.geometry=new RoundedBoxGeometry(p.width,p.height,p.depth,2,.08);
    }
    if(['Duvet','Rug'].includes(o.name))o.material=fabric;
    if(['Pillow','Mattress'].includes(o.name))o.material=cream;
    if(o.name==='Snowfield'){
      const g=new T.PlaneGeometry(160,160,64,64);g.rotateX(-Math.PI/2);const p=g.attributes.position;
      for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);const calm=(x>-21&&x<31&&z>-45&&z<20);p.setY(i,calm?-.008:Math.sin(x*.14)*Math.sin(z*.11)*.12);}g.computeVertexNormals();o.geometry=g;o.position.y=0;o.material=snow;
    }
    if(o.name==='IceShard'){
      const p=o.geometry.parameters,h=p.height,r=p.radius;const points=[new T.Vector2(r*.6,0),new T.Vector2(r*.95,.18),new T.Vector2(r*.86,h*.78),new T.Vector2(.02,h)];
      const g=new T.LatheGeometry(points,8);g.translate(0,-h/2,0);o.geometry=g;o.material=new T.MeshPhysicalMaterial({color:'#80c7d2',metalness:.25,roughness:.16,clearcoat:1,clearcoatRoughness:.14,emissive:'#1f7681',emissiveIntensity:.18});
      const vein=new T.Mesh(new T.CylinderGeometry(.015,.025,h*.72,5),new T.MeshBasicMaterial({color:'#d2fcf0',transparent:true,opacity:.45}));vein.position.y=h*.36;o.parent.add(vein);
    }
    if(o.name==='LanternRoom'){o.geometry=new T.CylinderGeometry(1.45,1.45,1.8,24,1,true);o.material=material('#4b8791',{transparent:true,opacity:.36,metalness:.2,roughness:.15,side:T.DoubleSide});}
    if(o.geometry.type==='CylinderGeometry'&&o.parent.name==='AuroraLighthouse'&&o.position.y===4.5){o.geometry=new T.CylinderGeometry(1.1,1.9,9,32);o.material=material('#c4c8bd');}
    if(o.name==='LighthouseRoof'){o.geometry=new T.ConeGeometry(2,1.5,32);o.material=dark;}
    if(o.name==='Flame'){o.geometry=new T.SphereGeometry(1,10,8);o.scale.set(.13,.45,.13);o.material.opacity=.7;}
  }
  // Smooth, layered mountains rather than repeated triangular cones.
  for(let layer=0;layer<3;layer++){
    const geo=new T.PlaneGeometry(330,50,128,14);const p=geo.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),v=(p.getY(i)+25)/50;const ridge=12+Math.pow(.5+.5*Math.sin(x*.037+layer*2),2)*15+Math.sin(x*.12+layer)*3+Math.sin(x*.27)*1.2;p.setXYZ(i,x,Math.pow(v,1.3)*ridge-2,-92-layer*21+(1-v)*13);}
    geo.computeVertexNormals();const m=new T.Mesh(geo,material(['#45667e','#304c68','#243f59'][layer],{side:T.DoubleSide}));m.name='SculptedMountainRidge';root.add(m);
  }
  // Snow drifts sit away from the central walking routes.
  for(let i=0;i<38;i++){const a=random()*Math.PI*2,r=40+random()*22,x=Math.cos(a)*r,z=Math.sin(a)*r;if(x>-24&&x<33&&z>-46&&z<23)continue;ellipsoid('SnowDrift',[x,-.18,z],[2+random()*7,.5+random()*2,2+random()*5],snow);}
  // Soft snow-laden firs use shared geometry and instancing to limit draw calls.
  const pinePos=model.colliders.filter(c=>c.name==='Fir').map(c=>[(c.minX+c.maxX)/2,(c.minZ+c.maxZ)/2]);
  const firGeo=new T.ConeGeometry(1,1,16,4);const firP=firGeo.attributes.position;for(let i=0;i<firP.count;i++){const x=firP.getX(i),y=firP.getY(i),z=firP.getZ(i),f=1+Math.sin(Math.atan2(z,x)*7+y*29)*.06;firP.setXYZ(i,x*f,y,z*f);}firGeo.computeVertexNormals();const firMat=material('#416575'),green=new T.InstancedMesh(firGeo,firMat,pinePos.length*3),white=new T.InstancedMesh(firGeo,snow,pinePos.length*3),dummy=new T.Object3D();let k=0;
  for(const [x,z]of pinePos){const h=3+random()*4;for(let j=0;j<3;j++){const width=h*(.32-j*.065),height=h*.58;dummy.position.set(x,h*(.31+j*.24),z);dummy.scale.set(width,height,width);dummy.updateMatrix();green.setMatrixAt(k,dummy.matrix);dummy.position.y+=.12;dummy.scale.set(width*.94,height*.88,width*.94);dummy.updateMatrix();white.setMatrixAt(k++,dummy.matrix);}}
  green.name='FirBranches';white.name='FirSnowLayers';root.add(green,white);
  // A softly sculpted roof blanket, complete with a rounded, uneven snow edge.
  const cabin=root.getObjectByName('Cabin');const roofG=new T.PlaneGeometry(13.7,11.8,32,12);const rp=roofG.attributes.position;
  for(let i=0;i<rp.count;i++){const x=rp.getX(i),z=rp.getY(i);rp.setXYZ(i,x-12,6.5-Math.sqrt(x*x+.12)*.44+Math.sin(z*1.5+x)*.045,z);}roofG.computeVertexNormals();const roof=new T.Mesh(roofG,new T.MeshStandardMaterial({color:'#c6d9e4',roughness:1,side:T.DoubleSide}));roof.name='SnowRoof';cabin.add(roof);
  for(const x of [-18.7,-5.3]){const e=rounded('SnowEave',[x,3.52,0],[.25,.32,11.8],snow,cabin,.12);e.rotation.z=x<-12?-.13:.13;}
  rounded('Chimney',[-16.8,4.25,-3.9],[.8,4.3,.85],dark,cabin,.07);rounded('ChimneySnow',[-16.8,6.44,-3.9],[1.05,.2,1.1],snow,cabin);
  const smoke=new T.Group();scene.add(smoke);const smokeMaterial=new T.MeshBasicMaterial({color:'#a1b6c1',transparent:true,opacity:.055,depthWrite:false});for(let i=0;i<5;i++)ellipsoid('ChimneySmoke',[-16.8+i*.14,7+i*.65,-3.9],[.25+i*.15,.25+i*.15,.25+i*.15],smokeMaterial,smoke);
  // Log courses, mullions, carved door, and a small porch light.
  const logs=new T.Group();logs.name='CabinLogCourses';cabin.add(logs);
  for(let j=0;j<8;j++){const y=j*.42+.2;for(const x of [-18.18,-5.82]){const log=cylinder('LogCourse',[x,y,0],.22,10.35,timber,logs);log.rotation.x=Math.PI/2;}const sections=y>1&&y<2.8?[[-17.5,1],[-14.3,1.4],[-9.7,1.4],[-6.5,1]]:[[-15.8,4.4],[-8.2,4.4]];for(const [x,w] of sections){const log=cylinder('FrontLog',[x,y,5.18],.22,w,timber,logs);log.rotation.z=Math.PI/2;}}
  for(const x of [-16,-8]){rounded('WindowSnowSill',[x,1.04,5.4],[2.15,.17,.52],snow,cabin);rounded('WindowLintel',[x,2.87,5.36],[2.15,.2,.38],timber,cabin);}
  rounded('OpenDoor',[-10.25,1.42,4.3],[.15,2.8,1.6],dark,cabin);cylinder('DoorHandle',[-10.36,1.4,4.75],.065,.18,glow,cabin);
  rounded('PorchLamp',[-13.7,2.45,5.6],[.27,.42,.24],glow,cabin,.04);const porch=new T.PointLight('#ffcf8c',9,8,1.8);porch.position.set(-13.7,2.3,5.9);scene.add(porch);
  // Bed now has a padded headboard, folded linen, stitching and a draped quilt.
  rounded('BedHeadboard',[-8.2,1.1,-4.47],[2.65,1.5,.2],dark,cabin);
  for(const x of [-9.25,-7.15])rounded('BedPost',[x,.6,-4.5],[.18,1.3,.18],timber,cabin,.07);
  rounded('FoldedBlanket',[-8.2,1.08,-1.5],[2.3,.16,.75],cream,cabin);
  rounded('QuiltDrape',[-9.35,.68,-2.1],[.1,.58,2.1],fabric,cabin);
  for(let i=0;i<9;i++)rounded('QuiltStitch',[-9.23+i*.25,1.052,-2.1],[.012,.008,2.14],material('#9ab5a7'),cabin,.002);
  const rug=root.getObjectByName('Rug');rug.geometry=new RoundedBoxGeometry(4,.025,4,2,.01);
  for(let i=0;i<22;i++){rounded('RugFringe',[-13.9+i*.18,.025,2.62],[.04,.012,.26],cream,cabin,.005);}
  // A real open-legged writing desk with a letter, book, ceramic cup and lantern.
  rounded('WritingTable',[-16.4,1.72,2.6],[1.65,.14,1.3],timber,cabin);
  for(const x of [-17,-15.8])for(const z of [2.12,3.08])rounded('DeskLeg',[x,.85,z],[.1,1.7,.1],dark,cabin,.025);
  rounded('Book',[-16.87,1.84,2.5],[.42,.13,.6],fabric,cabin,.025);
  const cup=cylinder('CeramicCup',[-15.94,1.94,2.5],.12,.24,cream,cabin);const handle=new T.Mesh(new T.TorusGeometry(.11,.025,6,12),cream);handle.position.set(-15.78,1.95,2.5);cabin.add(handle);
  // A north-facing window actually reveals the world beyond the cabin.
  const north=root.getObjectByName('Wall_N');north.visible=false;
  rounded('NorthWallLeft',[-15.7,1.7,-5],[4.6,3.4,.35],timber,cabin,.04);rounded('NorthWallRight',[-8.3,1.7,-5],[4.6,3.4,.35],timber,cabin,.04);rounded('NorthWallLower',[-12,.5,-5],[2.8,1,.35],timber,cabin,.04);rounded('NorthWallUpper',[-12,3,-5],[2.8,.8,.35],timber,cabin,.04);
  for(const x of [-13.4,-10.6])rounded('NorthWindowFrame',[x,1.8,-4.77],[.13,1.8,.12],dark,cabin,.025);for(const y of [1,2.6])rounded('NorthWindowFrame',[-12,y,-4.77],[2.9,.13,.12],dark,cabin,.025);rounded('NorthWindowMullion',[-12,1.8,-4.73],[.06,1.6,.06],dark,cabin,.01);
  // Small snow-covered objects tell a story without adding new quest pressure.
  rounded('MailboxPost',[-19.5,.8,7],[.17,1.6,.17],timber);rounded('Mailbox',[-19.5,1.75,7],[.65,.48,.85],fabric);rounded('MailboxSnow',[-19.5,2.02,7],[.73,.16,.9],snow);model.colliders.push({name:'Mailbox',minX:-4.5,maxX:-3.5,minZ:9.5,maxZ:10.5});
  for(let i=0;i<5;i++){const log=cylinder('Woodpile',[-18.7+(i%2)*.28,.2+Math.floor(i/2)*.28,1.6],.16,.9,dark);log.rotation.x=Math.PI/2;}
  // Bevel the lake shore and use meandering branch-like cracks instead of straight scratches.
  const lake=root.getObjectByName('BlueIceLake');lake.material=new T.MeshPhysicalMaterial({color:'#407f9d',metalness:.12,roughness:.24,clearcoat:.6,clearcoatRoughness:.14,emissive:'#14374e',emissiveIntensity:.2});
  const crackMaterial=new T.LineBasicMaterial({color:'#a5d7db',transparent:true,opacity:.3});for(let j=0;j<9;j++){const a=random()*Math.PI*2,pts=[];for(let n=0;n<8;n++){const r=.7+n*.9;pts.push(new T.Vector3(10+Math.cos(a+Math.sin(n+j)*.08)*r,.042,-8+Math.sin(a+Math.sin(n+j)*.08)*r*.76));}const line=new T.Line(new T.BufferGeometry().setFromPoints(pts),crackMaterial);line.name='IceVein';root.add(line);}
  for(let i=0;i<18;i++){const a=i/18*Math.PI*2;ellipsoid('LakeSnowEdge',[10+Math.cos(a)*10.2,-.06,-8+Math.sin(a)*7.9],[1.1,.18,.65],snow);}
  // Grounded contact shadows and glows, no expensive shadow maps.
  const soft=texture((c,n)=>{const g=c.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2);g.addColorStop(0,'rgba(0,0,0,.7)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,n,n);},64);
  const shadowMat=new T.MeshBasicMaterial({map:soft,color:'#0a2236',transparent:true,opacity:.22,depthWrite:false});
  function shadow(x,z,w,d){const m=new T.Mesh(new T.PlaneGeometry(w,d),shadowMat);m.rotation.x=-Math.PI/2;m.position.set(x,.016,z);m.name='SoftContactShadow';root.add(m);}
  shadow(-12,0,15,12);shadow(-7,-39,6,6);for(const c of model.crystals){shadow(c.group.position.x,c.group.position.z,2,2);ellipsoid('CrystalSnowFoot',[c.group.position.x,-.03,c.group.position.z],[.65,.16,.6],snow);}
  // Soft round flakes eliminate the old square-pixel snow appearance.
  const flakeTexture=texture((c,n)=>{const g=c.createRadialGradient(n/2,n/2,0,n/2,n/2,n*.5);g.addColorStop(0,'#fffffff0');g.addColorStop(.35,'#ffffffb0');g.addColorStop(1,'#ffffff00');c.fillStyle=g;c.fillRect(0,0,n,n);},32);
  scene.traverse(o=>{if(o.isPoints&&o.geometry.attributes.position.count===1000){o.material.map=flakeTexture;o.material.size=.115;o.material.opacity=.55;}});
  // Merge static decorative pieces that share a material; gameplay objects keep references.
  const staticNames=new Set(['LogCourse','FrontLog','QuiltStitch','RugFringe','WindowSnowSill','WindowLintel','NorthWindowFrame','NorthWindowMullion','DeskLeg','BedPost','SnowDrift','LakeSnowEdge','CrystalSnowFoot','SoftContactShadow','LogCourse']);
  root.updateMatrixWorld(true);const batches=new Map();root.traverse(o=>{if(!o.isMesh||!staticNames.has(o.name)||!o.visible)return;const key=o.material.uuid;if(!batches.has(key))batches.set(key,{material:o.material,objects:[]});batches.get(key).objects.push(o);});
  for(const batch of batches.values()){if(batch.objects.length<2)continue;const geometries=batch.objects.map(o=>{const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);g.clearGroups();return g.index?g.toNonIndexed():g;});const merged=mergeGeometries(geometries,false);if(merged){const m=new T.Mesh(merged,batch.material);m.name='Merged_'+batch.objects[0].name;root.add(m);batch.objects.forEach(o=>o.removeFromParent());}geometries.forEach(g=>g.dispose());}
  const firLow=new T.ConeGeometry(1,1,10,2);let previousLow=null;
  const animate=(t,lit,low)=>{if(low!==previousLow){green.geometry=white.geometry=low?firLow:firGeo;previousLow=low;}smoke.visible=lit;for(let i=0;i<smoke.children.length;i++){const m=smoke.children[i];m.position.x=-16.8+Math.sin(t*.12+i)*.25+i*.12;m.position.y=7+i*.65+Math.sin(t*.18+i)*.12;}};
  return {animate};
}
