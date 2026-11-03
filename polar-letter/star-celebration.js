import * as T from 'three';

// One reusable particle buffer keeps the celebration inexpensive and replayable.
// All particles belong to the scene, not the exported collision or GLB world.
export function createStarCelebration({scene,camera}) {
  const ROCKETS=3, MAX_STARS=48, TRAILS=5, PER_ROCKET=1+TRAILS+MAX_STARS;
  const count=ROCKETS*PER_ROCKET;
  const positions=new Float32Array(count*3),colors=new Float32Array(count*3);
  const sizes=new Float32Array(count),alphas=new Float32Array(count);
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));
  geometry.setAttribute('color',new T.BufferAttribute(colors,3));
  geometry.setAttribute('aSize',new T.BufferAttribute(sizes,1));
  geometry.setAttribute('aAlpha',new T.BufferAttribute(alphas,1).setUsage(T.DynamicDrawUsage));
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,vertexColors:true,
    uniforms:{pixelRatio:{value:Math.min(window.devicePixelRatio||1,1.5)}},
    vertexShader:`attribute float aSize; attribute float aAlpha; varying float vAlpha; varying vec3 vColor; uniform float pixelRatio;
      void main(){vAlpha=aAlpha;vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*pixelRatio*800.0/max(1.0,-mv.z),1.0,48.0);}`,
    fragmentShader:`varying float vAlpha; varying vec3 vColor;
      void main(){vec2 p=gl_PointCoord*2.0-1.0;float r=length(p);float a=atan(p.y,p.x);float edge=.37+.22*pow(abs(cos(a*2.5)),6.0);float star=1.0-smoothstep(edge,edge+.10,r);float halo=exp(-r*5.0)*.28;float alpha=(star*.72+halo)*vAlpha;if(alpha<.005)discard;gl_FragColor=vec4(vColor,alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const points=new T.Points(geometry,material);points.name='GentleStarCelebration';points.frustumCulled=false;points.visible=false;scene.add(points);
  const basisForward=new T.Vector3(),basisRight=new T.Vector3(),origin=new T.Vector3();
  const seeds=[];let seed=3007;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const palette=[new T.Color('#f2dfad'),new T.Color('#c5e4cd'),new T.Color('#bbd9ee'),new T.Color('#f3c78f')];
  for(let r=0;r<ROCKETS;r++)for(let j=0;j<PER_ROCKET;j++){
    const i=r*PER_ROCKET+j,c=palette[Math.floor(random()*palette.length)];
    colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;
    const angle=random()*Math.PI*2,speed=.38+random()*.85;
    sizes[i]=j===0?.22:j<=TRAILS?.095:.09+random()*.1;
    seeds[i]={angle,speed,depth:(random()-.5)*.34,phase:random()*Math.PI*2};
  }
  let active=false,elapsed=0,reduced=false,low=false,disposed=false,playCount=0;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  function set(i,x,y,z,a){positions[i*3]=x;positions[i*3+1]=y;positions[i*3+2]=z;alphas[i]=clamp(a);}
  function projected(side,depth,y){return [origin.x+basisRight.x*side+basisForward.x*depth,y,origin.z+basisRight.z*side+basisForward.z*depth];}
  function play(options={}){
    if(disposed)return;
    reduced=!!options.reduced;low=!!options.low;elapsed=0;active=true;playCount++;
    camera.getWorldDirection(basisForward);basisForward.y=0;if(basisForward.lengthSq()<.001)basisForward.set(0,0,-1);basisForward.normalize();
    basisRight.set(-basisForward.z,0,basisForward.x);
    origin.copy(camera.position).addScaledVector(basisForward,7.5);origin.y=0;
    alphas.fill(0);points.visible=true;geometry.attributes.aAlpha.needsUpdate=true;
  }
  function update(dt){
    if(!active||disposed)return;
    elapsed+=Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.1));
    const maxStars=reduced?16:low?24:MAX_STARS;
    for(let r=0;r<ROCKETS;r++){
      const start=r*1.15,age=elapsed-start,side=(r-1)*1.15,depth=(r===1?.45:0),height=3.25+r*.32;
      for(let j=0;j<PER_ROCKET;j++){
        const i=r*PER_ROCKET+j,info=seeds[i];
        if(j>TRAILS+maxStars){alphas[i]=0;continue;}
        if(reduced){
          if(r>0||j<=TRAILS){alphas[i]=0;continue;}
          const a=clamp(elapsed/1.6)*clamp((6.5-elapsed)/2.1)*.65;
          const radius=.24+info.speed*1.1,[x,y,z]=projected(Math.cos(info.angle)*radius,info.depth,height+Math.sin(info.angle)*radius*.8);
          set(i,x,y,z,a);continue;
        }
        if(j<=TRAILS){
          const trailDelay=j*.11,t=(age-trailDelay)/1.65,fade=clamp((age-trailDelay)/.5)*clamp((1.65-(age-trailDelay))/.45);
          const y=.25+(height-.25)*(1-Math.pow(1-clamp(t),1.6));const [x,py,z]=projected(side,depth,y);
          set(i,x,py,z,fade*(j===0?.82:.23*(1-j/(TRAILS+2))));continue;
        }
        const burst=age-1.45;if(burst<0||burst>3.5){alphas[i]=0;continue;}
        const spread=(1-Math.exp(-burst*.9))*info.speed*1.85,drift=burst*.08;
        const horizontal=side+Math.cos(info.angle)*spread,vertical=height+Math.sin(info.angle)*spread*.75-burst*burst*.035;
        const [x,y,z]=projected(horizontal,depth+info.depth*spread+drift,vertical);
        const opacity=clamp(burst/.6)*clamp((3.5-burst)/1.65)*.8;
        set(i,x,y,z,opacity);
      }
    }
    geometry.attributes.position.needsUpdate=true;geometry.attributes.aAlpha.needsUpdate=true;
    if(elapsed>(reduced?6.5:8)){active=false;points.visible=false;}
  }
  function dispose(){if(disposed)return;disposed=true;active=false;scene.remove(points);geometry.dispose();material.dispose();}
  return {play,update,dispose,get active(){return active;},get elapsed(){return elapsed;},get playCount(){return playCount;},get points(){return points;},get object(){return points;}};
}
