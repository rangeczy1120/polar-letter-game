from pathlib import Path
import base64,json,re
root=Path(__file__).parent
shim="""<script>(function(){const list=[];window.__mergeAudio={pause:()=>{for(const x of list)if(x.state==='running')x.suspend().catch(()=>{});try{speechSynthesis.cancel()}catch(e){}},resume:()=>{for(const x of list)if(x.state==='suspended')x.resume().catch(()=>{})}};for(const key of ['AudioContext','webkitAudioContext']){const C=window[key];if(!C)continue;function Wrapped(...args){const x=new C(...args);list.push(x);return x}Wrapped.prototype=C.prototype;Object.setPrototypeOf(Wrapped,C);window[key]=Wrapped}for(const e of ['pointerdown','keydown','touchstart'])document.addEventListener(e,()=>window.__mergeAudio.resume(),{capture:true,passive:true})})();</script>"""
def read(name):
 s=(root/name).read_text(encoding='utf-8-sig');s,n=re.subn(r'(<head(?:\s[^>]*)?>)',lambda m:m.group(1)+shim,s,count=1,flags=re.I)
 if n!=1:raise ValueError('missing head: '+name)
 return base64.b64encode(s.encode()).decode()
data=json.dumps({'warm':read('../极夜来信-双击游玩.html'),'horror':read('../恐怖世界/游戏.html')})
s=(root/'外壳.html').read_text(encoding='utf-8').replace('/* DATA */','const DATA='+data+';')
(root.parent/'极夜来信.html').write_text(s,encoding='utf-8')
print('build complete')
