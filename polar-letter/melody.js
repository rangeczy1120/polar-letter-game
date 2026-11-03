// A familiar traditional melody in C major; players control the tempo themselves.
export const TWINKLE=[
  1,1,5,5,6,6,5,
  4,4,3,3,2,2,1,
  5,5,4,4,3,3,2,
  5,5,4,4,3,3,2,
  1,1,5,5,6,6,5,
  4,4,3,3,2,2,1
];

export function createMelodyGuide({world,audio,onComplete=()=>{},onReplay=()=>{}}){
  const $=id=>document.getElementById(id);
  const guide={notes:TWINKLE,index:0,collapsed:false,visible:false,previewing:false};
  let guideNote=undefined,previewTimers=[];
  function highlight(note){if(guideNote===note)return;guideNote=note;world.setGuideNote(note);}
  function stopPreview(){previewTimers.forEach(clearTimeout);previewTimers=[];guide.previewing=false;$('melodyPreview').textContent='试听这句';}
  function render(message){
    document.body.classList.toggle('melody-visible',guide.visible&&!guide.collapsed);
    const done=guide.index>=guide.notes.length;
    const line=done?5:Math.floor(guide.index/7),offset=done?7:guide.index%7;
    $('melodyProgress').textContent=`${guide.index} / ${guide.notes.length}`;
    $('melodyLine').textContent=done?'已弹完 · 全曲 6 句':`第 ${line+1} 句 / 共 6 句`;
    $('melodyNotes').replaceChildren(...guide.notes.slice(line*7,line*7+7).map((note,i)=>{const el=document.createElement('span');el.textContent=note;el.className=i<offset?'done':i===offset?'current':'';if(i===6)el.setAttribute('title','这一音稍长');return el;}));
    $('melodyInstruction').textContent=message||(done?'你弹完了，星星听见了这首歌。':`敲亮着的 ${guide.notes[guide.index]}，数字相同的冰晶声音一样。`);
    $('melodyReplay').hidden=!done;
    highlight(guide.visible&&!guide.collapsed&&!done?guide.notes[guide.index]:null);
  }
  function show(inValley){
    if(guide.visible===inValley)return;
    guide.visible=inValley;
    $('melodyGuide').hidden=!inValley||guide.collapsed;
    $('melodyReopen').hidden=!inValley||!guide.collapsed;
    if(!inValley)stopPreview();
    render();
  }
  function hit(note){
    stopPreview();
    if(!guide.visible||guide.collapsed||guide.index>=guide.notes.length)return;
    if(note===guide.notes[guide.index]){guide.index++;render();if(guide.index===guide.notes.length)onComplete();}
    else render(`没关系，再试试亮着的 ${guide.notes[guide.index]}。`);
  }
  $('melodyReset').onclick=()=>{stopPreview();guide.index=0;render('从第一个 1 开始，慢慢来。');};
  $('melodyReplay').onclick=()=>{stopPreview();if(guide.index===guide.notes.length)onReplay();};
  $('melodyCollapse').onclick=()=>{stopPreview();guide.collapsed=true;$('melodyGuide').hidden=true;$('melodyReopen').hidden=!guide.visible;render();};
  $('melodyReopen').onclick=()=>{guide.collapsed=false;$('melodyGuide').hidden=!guide.visible;$('melodyReopen').hidden=true;render();};
  $('melodyPreview').onclick=()=>{
    if(guide.previewing){stopPreview();return;}
    if(audio.muted){render('声音已关闭，请先打开右上角声音。');return;}
    if(!audio.ctx||!audio.buffers.chime){render('声音正在准备，请稍后再试。');return;}
    audio.ctx.resume();guide.previewing=true;$('melodyPreview').textContent='停止试听';
    const line=guide.index>=guide.notes.length?5:Math.floor(guide.index/7);
    for(let i=0;i<7;i++)previewTimers.push(setTimeout(()=>audio.playNote(guide.notes[line*7+i],.34),i*600));
    previewTimers.push(setTimeout(stopPreview,4800));
  };
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPreview();});
  render();
  return Object.assign(guide,{show,hit,render,stopPreview});
}
