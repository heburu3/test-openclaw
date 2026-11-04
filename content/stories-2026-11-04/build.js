const { chromium } = require('playwright');
const path = require('path');
const fs=require('fs');const src = f => 'data:image/'+(f.endsWith('.jpg')?'jpeg':'png')+';base64,'+fs.readFileSync(path.resolve(__dirname,'src',f)).toString('base64');
const base = `*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;overflow:hidden;font-family:Inter,sans-serif;color:#fff;background:#111;position:relative}
.bg{position:absolute;inset:0;background-size:cover;background-position:center}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.8) 0%,rgba(0,0,0,.35) 45%,rgba(0,0,0,.15) 60%,rgba(0,0,0,.7) 100%)}
.t{position:absolute;left:80px;right:80px;font-weight:800;line-height:1.15;text-shadow:0 2px 18px rgba(0,0,0,.45)}
.big{font-size:84px}.mid{font-size:62px}.small{font-size:44px;font-weight:600;opacity:.92}
.pill{display:inline-block;background:#FFD400;color:#111;padding:6px 22px;border-radius:18px;text-shadow:none}
.hint{position:absolute;left:80px;right:80px;border:4px dashed rgba(255,255,255,.55);border-radius:36px;color:rgba(255,255,255,.75);font:600 36px Inter;display:flex;align-items:center;justify-content:center;text-align:center}`;
const frames = {
 '01-zacepka': `<div class=bg style="background-image:url(${src('street.jpg')});filter:blur(14px) brightness(.55);transform:scale(1.1)"></div>
  <div class="t big" style="top:420px">Сколько мест<br>из рилсов у тебя<br>лежит в <span class=pill>сохранёнках?</span></div>`,
 '02-kommentarii': `<div class=bg style="background:#1c1d21"></div>
  <div class="t big" style="top:250px">Под каждым моим<br>роликом одно и&nbsp;то&nbsp;же</div>
  <img src="${src('comments.png')}" style="position:absolute;left:40px;top:560px;width:1000px;border-radius:28px">`,
 '03-bol': `<div class=bg style="background-image:url(${src('street.jpg')})"></div><div class=shade></div>
  <div class="t big" style="top:260px">А потом приезжаешь,<br>а там ни адреса,<br>ни часов работы</div>
  <div class="t mid" style="top:1380px">И Google Maps тут<br>почти не помогает</div>`,
 '04-intriga': `<div class=bg style="background-image:url(${src('map_blur.png')});filter:brightness(.45)"></div>
  <div class="t big" style="top:380px">Поэтому я собрал<br>всё в одно место</div>
  <div class="t big" style="top:700px"><span class=pill>Сегодня в 22:00</span><br>покажу</div>`,
 '06-demo': `<div class=bg style="background:#111"></div>
  <img src="${src('map.png')}" style="position:absolute;left:280px;top:400px;width:520px;border-radius:44px;box-shadow:0 20px 80px rgba(0,0,0,.6)">
  <div class="t mid" style="top:200px;text-align:center"><span class=pill>772 места</span><br>Сеул · Пусан · Чеджу</div>
  <div class="t small" style="top:1590px;text-align:center">У каждого адрес, часы и цены.<br>Одна кнопка — и оно в Naver</div>`,
};
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const [n, h] of Object.entries(frames)) {
    await p.setContent(`<style>${base}</style>${h}`, { waitUntil: 'load' });
    await p.screenshot({ path: path.join(__dirname, n + '.png') });
  }
  await b.close();
})();
