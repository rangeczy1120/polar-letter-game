import * as T from 'three';

// Small, genuinely volumetric shards. All decoration is generated locally;
// the standalone build has no image, model, or network dependencies.
export function warmCrystals(scene, model, camera) {
  let seed=927; const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const palette=['#ffc79b','#f3a3bc','#e3a7da','#c4a0df','#ffd8ab','#efb0ca'].map(c=>new T.Color(c));
  const makeGlow=()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,236,183,.9)');g.addColorStop(.23,'rgba(255,190,131,.4)');g.addColorStop(.6,'rgba(245,143,170,.12)');g.addColorStop(1,'rgba(255,172,178,0)');x.fillStyle=g;x.fillRect(0,0,128,128);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;};
  const glowMap=makeGlow(),animated=[];
  // A local studio reflection gives the facets a glass finish in the night scene.
  const faces=Array.from({length:6},(_,i)=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,64,64);g.addColorStop(0,'#26364e');g.addColorStop(.36,i%2?'#ad7a9f':'#d0a58c');g.addColorStop(.44,'#fff1cd');g.addColorStop(.52,'#79658b');g.addColorStop(1,'#1f314c');x.fillStyle=g;x.fillRect(0,0,64,64);return c;});
  const reflection=new T.CubeTexture(faces);reflection.colorSpace=T.SRGBColorSpace;reflection.needsUpdate=true;
  const frostMat=new T.LineBasicMaterial({color:'#fff0ce',transparent:true,opacity:.76});
  const seamMat=new T.LineBasicMaterial({color:'#ffe2a7',transparent:true,opacity:.6});
  const snowMat=new T.MeshStandardMaterial({color:'#f3dfed',roughness:1,emissive:'#bda2c1',emissiveIntensity:.16});
  const starMat=new T.MeshBasicMaterial({color:'#fff0bd',transparent:true,opacity:.9,side:T.DoubleSide});
  const starGeo=new T.BufferGeometry(); const sv=[];
  const rim=[];for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?.15:1;rim.push([Math.cos(a)*r,Math.sin(a)*r,0]);}
  for(let i=0;i<8;i++)sv.push(0,0,0,...rim[i],...rim[(i+1)%8]);starGeo.setAttribute('position',new T.Float32BufferAttribute(sv,3));starGeo.computeVertexNormals();
  for(let index=0;index<model.crystals.length;index++){
    const item=model.crystals[index],group=item.group,shard=group.getObjectByName('IceShard');
    // Keep the original mesh identity for gameplay and replace its geometry.
    for(const child of [...group.children])if(child!==shard)group.remove(child);
    const h=1.25+rnd()*.48,r=.26+rnd()*.08,n=6,turn=rnd()*Math.PI*2;
    const rings=[{y:.075,r:r*.55,dx:0},{y:h*.25,r:r,dx:-r*.12},{y:h*.71,r:r*.77,dx:r*.1}];
    const ringPoint=(k,j)=>{const q=rings[k],a=j/n*Math.PI*2+turn;return new T.Vector3(Math.cos(a)*q.r+q.dx,q.y,Math.sin(a)*q.r);};
    const tip=new T.Vector3(r*.28,h,-r*.12),pos=[],colors=[];
    function tri(a,b,c,col){pos.push(...a.toArray(),...c.toArray(),...b.toArray());for(let k=0;k<3;k++)colors.push(col.r,col.g,col.b);}
    for(let j=0;j<n;j++){
      for(let k=0;k<2;k++){const a=ringPoint(k,j),b=ringPoint(k,(j+1)%n),c=ringPoint(k+1,j),d=ringPoint(k+1,(j+1)%n),col=palette[(j+k+index)%palette.length];tri(a,b,c,col);tri(b,d,c,col.clone().multiplyScalar(.91));}
      tri(ringPoint(2,j),ringPoint(2,(j+1)%n),tip,palette[(j+index+1)%6]);
      tri(new T.Vector3(0,.075,0),ringPoint(0,(j+1)%n),ringPoint(0,j),palette[2]);
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
    shard.geometry.dispose();shard.geometry=geo;
    shard.material=new T.MeshPhysicalMaterial({vertexColors:true,envMap:reflection,envMapIntensity:1.25,roughness:.17,metalness:.2,clearcoat:1,clearcoatRoughness:.14,emissive:'#ffb36f',emissiveIntensity:.43,transparent:true,opacity:.94,depthWrite:true,side:T.FrontSide});
    shard.position.set(0,0,0);shard.rotation.set(0,0,0);shard.name='IceShard';
    group.userData.style='RoseGoldFrost';group.userData.height=h;
    const seams=new T.LineSegments(new T.EdgesGeometry(geo,24),seamMat);seams.name='GoldenFacetEdges';group.add(seams);
    const inner=new T.Mesh(new T.OctahedronGeometry(1,0),new T.MeshBasicMaterial({color:'#ffe4a5',transparent:true,opacity:.78}));inner.name='WarmCrystalHeart';inner.position.set(0,h*.32,0);inner.scale.set(r*.37,h*.35,r*.37);group.add(inner);
    // Fern frost lies on the actual six surfaces, visible from every side.
    const frost=[];
    for(let face=0;face<n;face++){
      const lo=ringPoint(1,face).lerp(ringPoint(1,(face+1)%n),.5),hi=ringPoint(2,face).lerp(ringPoint(2,(face+1)%n),.5);
      const outward=new T.Vector3(lo.x,0,lo.z).normalize().multiplyScalar(.007),tangent=new T.Vector3(-outward.z,0,outward.x).normalize();
      const onFace=(t,side=0)=>lo.clone().lerp(hi,t).add(outward).addScaledVector(tangent,side);
      frost.push(...onFace(.03).toArray(),...onFace(.94).toArray());
      for(let b=0;b<8;b++){const t=.1+b*.097,width=r*(.31-b*.025);for(const sign of [-1,1]){const a=onFace(t),end=onFace(t+.15,width*sign);frost.push(...a.toArray(),...end.toArray());for(let k=1;k<=2;k++){const s=k/3,mid=a.clone().lerp(end,s),fin=mid.clone().add(new T.Vector3(0,h*.033,0)).addScaledVector(tangent,-sign*r*.05);frost.push(...mid.toArray(),...fin.toArray());}}}
    }
    const fg=new T.BufferGeometry();fg.setAttribute('position',new T.Float32BufferAttribute(frost,3));const fern=new T.LineSegments(fg,frostMat);fern.name='FernFrost';group.add(fern);
    // Snow grains sit on a sloping shoulder rather than forming a second shard.
    const snowGeo=new T.IcosahedronGeometry(.022,0),snow=new T.InstancedMesh(snowGeo,snowMat,32),dummy=new T.Object3D();
    for(let j=0;j<32;j++){const t=j/32,p=ringPoint(2,1).lerp(tip,t);dummy.position.copy(p);dummy.position.x+=(rnd()-.5)*.06;dummy.position.z+=(rnd()-.5)*.06;dummy.scale.setScalar(.55+rnd());dummy.updateMatrix();snow.setMatrixAt(j,dummy.matrix);}snow.name='SnowDustedShoulder';group.add(snow);
    const halo=new T.Sprite(new T.SpriteMaterial({map:glowMap,transparent:true,opacity:.22,depthWrite:false,depthTest:false,blending:T.AdditiveBlending}));halo.name='CrystalInnerHalo';halo.position.y=h*.33;halo.scale.set(1.15,h*.97,1);group.add(halo);
    const pool=new T.Mesh(new T.PlaneGeometry(2.15,2.15),new T.MeshBasicMaterial({map:glowMap,color:'#ffd0ac',transparent:true,opacity:.48,depthWrite:false,blending:T.AdditiveBlending}));pool.name='WarmSnowGlow';pool.rotation.x=-Math.PI/2;pool.position.y=.025;group.add(pool);
    const stars=[];
    for(let j=0;j<3;j++){const star=new T.Mesh(starGeo,starMat);star.name='CrystalSparkle';star.position.set((j%2?1:-1)*(r+.08+rnd()*.16),h*(.22+j*.29),.06);star.scale.setScalar(j===1?.064:.036);group.add(star);stars.push(star);}
    const dustPos=[];for(let j=0;j<28;j++){const a=rnd()*Math.PI*2,rr=rnd()*r*.6;dustPos.push(Math.cos(a)*rr,.13+rnd()*h*.74,Math.sin(a)*rr);}
    const dustGeo=new T.BufferGeometry();dustGeo.setAttribute('position',new T.Float32BufferAttribute(dustPos,3));const dust=new T.Points(dustGeo,new T.PointsMaterial({map:glowMap,color:'#fff2c5',size:.032,transparent:true,opacity:.85,depthWrite:false,blending:T.AdditiveBlending}));dust.name='CrystalStardust';group.add(dust);
    // Retain the collision footprint and place note labels above the smaller art.
    item.marker.position.set(group.position.x+.38,h+.34,group.position.z+.08);
    const target=model.targets.find(t=>t.id==='chime'&&t.crystalIndex===index);target.position.y=h*.62;target.objects=[shard,inner,item.marker];target.objects.forEach(o=>o.userData.interaction='chime');
    animated.push({item,halo,pool,inner,stars,material:shard.material,phase:index*1.91});
  }
  const previous=model.animate;
  model.animate=(t,dt,reduced,lit,beaconOn,low)=>{previous(t,dt,reduced,lit,beaconOn,low);for(const a of animated){const pulse=reduced?0:Math.sin(t*1.2+a.phase)*.035,hit=Math.min(1,a.item.hit);a.material.emissiveIntensity=.43+hit*.45;a.halo.material.opacity=.22+pulse+hit*.12;a.pool.material.opacity=.4+hit*.2;a.inner.material.opacity=.7+hit*.22;for(const s of a.stars){s.visible=!low;s.quaternion.copy(camera.quaternion);s.material=starMat;} }};
}
