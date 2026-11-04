const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const src = f => 'data:image/png;base64,' + fs.readFileSync(path.resolve(__dirname, 'src', f)).toString('base64');
const css = `*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;overflow:hidden;font-family:Inter,sans-serif;color:#fff;background:#111;position:relative}
.bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:brightness(.4)}
.t{position:absolute;left:80px;right:80px;font-weight:800;line-height:1.15;text-shadow:0 2px 18px rgba(0,0,0,.45)}
.big{font-size:76px}.pill{white-space:nowrap}.mid{font-size:52px;font-weight:600;line-height:1.3}
.pill{display:inline-block;background:#FFD400;color:#111;padding:6px 22px;border-radius:18px;text-shadow:none}
.icon{position:absolute;left:80px;top:300px;width:150px;height:150px;border-radius:40px;background:#FFD400;display:flex;align-items:center;justify-content:center}`;
const html = `<div class=bg style="background-image:url(${src('map_blur.png')})"></div>
<div class=icon><svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div>
<div class="t big" style="top:540px">На карте идут<br><span class=pill>технические работы</span></div>
<div class="t mid" style="top:900px">Сейчас она может<br>не открываться.<br>Скоро всё заработает.</div>
<div class="t mid" style="top:1250px">Написал КАРТА?<br>Ссылку пришлю, как только<br>всё будет готово.</div>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.setContent(`<style>${css}</style>${html}`, { waitUntil: 'load' });
  await p.screenshot({ path: path.join(__dirname, '10-tech-raboty.png') }); await b.close();
})();
