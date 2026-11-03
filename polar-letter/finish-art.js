import * as T from 'three';
import {environmentImage} from './polar-environment.js';
export function finishArt(scene,model,renderer){
 const root=model.world,lake=root.getObjectByName('BlueIceLake'),snow=root.getObjectByName('Snowfield');
 const original=lake.material,ice=new T.MeshPhysicalMaterial({map:original.map,normalMap:original.normalMap,roughnessMap:original.roughnessMap,color:original.color,emissive:original.emissive,emissiveMap:original.emissiveMap,emissiveIntensity:original.emissiveIntensity});ice.normalScale.copy(original.normalScale);ice.metalness=.08;ice.roughness=.32;ice.clearcoat=.9;ice.clearcoatRoughness=.16;ice.envMapIntensity=.55;lake.material=ice;
 snow.material.roughness=.92;snow.material.envMapIntensity=.12;
 const pmrem=new T.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();
 new T.TextureLoader().load(environmentImage,source=>{source.colorSpace=T.SRGBColorSpace;source.mapping=T.EquirectangularReflectionMapping;const filtered=pmrem.fromEquirectangular(source).texture;ice.envMap=filtered;ice.needsUpdate=true;for(const c of model.crystals){const m=c.group.getObjectByName('IceShard').material;m.envMap=filtered;m.envMapIntensity=.35;m.needsUpdate=true;}source.dispose();pmrem.dispose();});
 const internalMat=new T.MeshPhysicalMaterial({color:'#ffd0bf',roughness:.23,metalness:.02,transparent:true,opacity:.30,clearcoat:1,depthWrite:false});
 const bubbleGeo=new T.SphereGeometry(.012,8,6),bubbleMat=new T.MeshPhysicalMaterial({color:'#fff1df',roughness:.12,transparent:true,opacity:.65,depthWrite:false}),dummy=new T.Object3D();
 for(let i=0;i<model.crystals.length;i++){
  const c=model.crystals[i],h=c.group.userData.height,shard=c.group.getObjectByName('IceShard');
  shard.material.transmission=.28;shard.material.thickness=.55;shard.material.ior=1.31;shard.material.roughness=.15;shard.material.clearcoat=1;shard.material.clearcoatRoughness=.12;shard.material.opacity=.94;shard.material.needsUpdate=true;
  const inner=new T.Mesh(new T.OctahedronGeometry(1,0),internalMat);inner.name='IceInternalFacets';inner.scale.set(.11,h*.29,.105);inner.position.set(.01,h*.46,0);inner.rotation.y=i*.38;c.group.add(inner);
  const bubbles=new T.InstancedMesh(bubbleGeo,bubbleMat,20);bubbles.name='FrozenBubbles';for(let n=0;n<20;n++){const a=n*2.399+i*.8,r=.035+(n%4)*.024;dummy.position.set(Math.cos(a)*r,h*(.18+(n%12)*.045),Math.sin(a)*r);dummy.scale.setScalar(.45+(n%3)*.28);dummy.updateMatrix();bubbles.setMatrixAt(n,dummy.matrix);}bubbles.instanceMatrix.needsUpdate=true;c.group.add(bubbles);
 }
 const skyLayer=scene.getObjectByName('AuroraTextureLayer');if(skyLayer)skyLayer.visible=false;
 const rim=new T.Mesh(new T.CylinderGeometry(10,10,.28,96,1,true),new T.MeshPhysicalMaterial({color:'#9dcdda',roughness:.28,metalness:.05,clearcoat:.8}));rim.name='LakeIceThickness';rim.scale.z=.76;rim.position.set(10,-.125,-8);root.add(rim);
 const cabin=root.getObjectByName('Cabin');const icicleGeo=new T.ConeGeometry(.055,1,7),icicleMat=new T.MeshPhysicalMaterial({color:'#bfdfec',roughness:.2,clearcoat:.9,transparent:true,opacity:.82});const icicles=new T.InstancedMesh(icicleGeo,icicleMat,32);icicles.name='EaveIcicles';for(let i=0;i<32;i++){const h=.10+(i%5)*.045;dummy.position.set(-18.2+i*.4,3.42-h/2,5.66);dummy.scale.set(.6+(i%3)*.18,h,.6+(i%3)*.18);dummy.rotation.set(0,0,Math.PI);dummy.updateMatrix();icicles.setMatrixAt(i,dummy.matrix);}icicles.instanceMatrix.needsUpdate=true;cabin.add(icicles);
 // Solid roof backing gives the snow blanket thickness when viewed from below.
 const roofMat=new T.MeshStandardMaterial({color:'#b7d3e2',roughness:.88});for(const side of [-1,1]){const slab=new T.Mesh(new T.BoxGeometry(7.48,.16,11.8),roofMat);slab.name='SolidSnowRoof';slab.position.set(-12+side*3.42,4.88,0);slab.rotation.z=-side*Math.atan(.44);slab.castShadow=true;slab.receiveShadow=true;cabin.add(slab);}
 // Actual structural frames give the lantern room volume from every angle.
 const tower=root.getObjectByName('AuroraLighthouse'),frameMat=new T.MeshStandardMaterial({color:'#87adb4',metalness:.25,roughness:.42}),postGeo=new T.CylinderGeometry(.055,.055,1.55,8);for(let k=0;k<8;k++){const a=k*Math.PI/4,post=new T.Mesh(postGeo,frameMat);post.name='LanternFramePost';post.position.set(-7+Math.cos(a)*1.35,9.8,-39+Math.sin(a)*1.35);tower.add(post);}for(const y of [9.0,10.6]){const ring=new T.Mesh(new T.TorusGeometry(1.35,.06,8,32),frameMat);ring.name='LanternFrameRing';ring.position.set(-7,y,-39);ring.rotation.x=Math.PI/2;tower.add(ring);}
 for(const x of [-16,-8]){const lamp=new T.PointLight('#ffd39a',4.5,5,2);lamp.position.set(x,1.8,5.6);scene.add(lamp);}
 const moon=scene.children.find(o=>o.isDirectionalLight);if(moon)moon.shadow.normalBias=.03;
}
