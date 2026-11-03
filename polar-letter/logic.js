export const EYE = 1.65;
export const landmarks = {cabin:[-12,0,0],lake:[10,0,-8],valley:[23,0,-25],beacon:[-7,0,-39]};
export const letters=[{id:'fire',title:'把寒意留在门外',text:'点燃木屋里的壁炉',line:'火光不问你从哪里来，它只想让你暖一些。'},{id:'chime',title:'听见雪的回信',text:'轻触风铃谷的任意冰晶',line:'那些没说出口的话，风已经听见了。'},{id:'beacon',title:'为远方留一盏灯',text:'点亮极光灯塔',line:'总有人会循着这束光，找到回家的路。'},{id:'rest',title:'今夜，安心停泊',text:'躺在木屋床铺上休息',line:'你已经走得够远。今晚，就留在这里。'}];
export function blocked(x,z,boxes,r=.28){if(Math.abs(x)>56-r||Math.abs(z)>56-r)return true;return boxes.some(b=>{const cx=Math.max(b.minX,Math.min(x,b.maxX)),cz=Math.max(b.minZ,Math.min(z,b.maxZ));return (x-cx)**2+(z-cz)**2<r*r;});}
export function moveWithCollision(position,dx,dz,boxes){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.12));for(let i=0;i<steps;i++){if(!blocked(position.x+dx/steps,position.z,boxes))position.x+=dx/steps;if(!blocked(position.x,position.z+dz/steps,boxes))position.z+=dz/steps;}return position;}
export function reachable(from,to,boxes,maxDistance=4.5){const dx=to.x-from.x,dz=to.z-from.z,d=Math.hypot(dx,dz);if(d>maxDistance)return false;const occluders=boxes.filter(b=>!(to.x>=b.minX&&to.x<=b.maxX&&to.z>=b.minZ&&to.z<=b.maxZ));for(let t=.12;t<d-.25;t+=.15){if(blocked(from.x+dx*t/d,from.z+dz*t/d,occluders,.03))return false;}return true;}
export function loadProgress(){return new Set();}
