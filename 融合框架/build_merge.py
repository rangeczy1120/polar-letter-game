from pathlib import Path
import base64, json, re

root = Path(__file__).resolve().parent
cfg = json.loads((root / 'config.json').read_text(encoding='utf-8'))
errors = []
for name in ('warm_html', 'horror_html'):
    if not (root / cfg.get(name, '')).is_file(): errors.append(f"找不到 {name}: {cfg.get(name)}")
for name in ('warm_signal_id', 'horror_signal_id'):
    if not cfg.get(name, '').strip(): errors.append(f"请填写 {name}")
if not isinstance(cfg.get('cycles'), int) or isinstance(cfg['cycles'], bool) or cfg['cycles'] < 1:
    errors.append('cycles 必须是正整数')
if errors: raise SystemExit('\n'.join(errors))
shim = r"""<script>(function(){const contexts=[];for(const key of ['AudioContext','webkitAudioContext']){const C=window[key];if(!C)continue;function Wrapped(...args){const c=new C(...args);contexts.push(c);return c}Wrapped.prototype=C.prototype;Object.setPrototypeOf(Wrapped,C);window[key]=Wrapped}function wake(){for(const c of contexts)if(c.state==='suspended')c.resume().catch(()=>{})}for(const e of ['pointerdown','keydown','touchstart'])document.addEventListener(e,wake,{capture:true,passive:true});})();</script>"""
def encode(name):
    source = (root / cfg[name]).read_text(encoding='utf-8-sig')
    if not re.search(r'<head(?:\s[^>]*)?>', source, re.I):
        raise SystemExit(f'{name} 缺少 <head>，无法注入音频解锁脚本')
    source = re.sub(r'(<head(?:\s[^>]*)?>)', lambda m: m.group(1)+shim, source, count=1, flags=re.I)
    return base64.b64encode(source.encode('utf-8')).decode('ascii')
data = {'warm':encode('warm_html'), 'horror':encode('horror_html'), 'signals':{'warm':cfg['warm_signal_id'], 'horror':cfg['horror_signal_id']}, 'cycles':cfg['cycles']}
template = (root / 'shell.html').read_text(encoding='utf-8')
output = template.replace('/*__GAME_DATA__*/', 'const GAME_DATA='+json.dumps(data,ensure_ascii=True,separators=(',',':'))+';')
(root / cfg['output_html']).write_text(output,encoding='utf-8')
print('已生成:', (root / cfg['output_html']).resolve())
