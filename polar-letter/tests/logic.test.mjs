import {test} from 'node:test';import assert from 'node:assert/strict';import {blocked,moveWithCollision,reachable,loadProgress} from '../logic.js';
const walls=[{minX:-18.2,maxX:-17.8,minZ:-5,maxZ:5},{minX:-18,maxX:-13.6,minZ:4.8,maxZ:5.2},{minX:-10.4,maxX:-6,minZ:4.8,maxZ:5.2}];
test('doorway remains passable while side walls stop the player',()=>{let p={x:-12,z:8};moveWithCollision(p,0,-8,walls);assert.ok(Math.abs(p.z)<1e-8);p={x:-15,z:8};moveWithCollision(p,0,-8,walls);assert.ok(p.z>5.45);});
test('large movement is subdivided to prevent tunneling',()=>{let p={x:-20,z:0};moveWithCollision(p,10,0,walls);assert.ok(p.x< -18.4);});
test('diagonal wall contact slides without penetration',()=>{let p={x:-19,z:0};moveWithCollision(p,2,3,walls);assert.ok(p.x< -18.4);assert.ok(p.z>2.9);});
test('map bounds prevent walking out of snowfield',()=>{let p={x:55,z:0};moveWithCollision(p,50,0,[]);assert.ok(p.x<55.73);});
test('interaction rejects far targets and wall obstruction',()=>{assert.equal(reachable({x:-19,z:0},{x:-17,z:0},walls),false);assert.equal(reachable({x:0,z:0},{x:10,z:0},walls),false);assert.equal(reachable({x:-12,z:6},{x:-12,z:3},walls),true);});
test('corrupt saved progress safely resets',()=>{globalThis.localStorage={getItem:()=>'{bad'};assert.equal(loadProgress().size,0);globalThis.localStorage={getItem:()=>JSON.stringify(['fire','injected'])};assert.deepEqual([...loadProgress()],['fire']);});

