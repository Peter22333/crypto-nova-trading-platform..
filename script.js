// ── TICKER ───────────────────────────────────────────────────────────────────
        const TDATA = [
            { s: 'BTC/USD', p: '$84,230', c: '+2.45%', u: true }, { s: 'ETH/USD', p: '$3,210', c: '+1.87%', u: true },
            { s: 'BNB/USD', p: '$412', c: '-0.54%', u: false }, { s: 'SOL/USD', p: '$178', c: '+3.21%', u: true },
            { s: 'XRP/USD', p: '$0.621', c: '+0.98%', u: true }, { s: 'EUR/USD', p: '1.0842', c: '+0.12%', u: true },
            { s: 'GBP/USD', p: '1.2634', c: '-0.08%', u: false }, { s: 'USD/JPY', p: '149.82', c: '+0.31%', u: true },
            { s: 'DOGE/USD', p: '$0.142', c: '+5.14%', u: true }, { s: 'ADA/USD', p: '$0.489', c: '-1.23%', u: false },
            { s: 'AVAX/USD', p: '$38.20', c: '+2.77%', u: true }, { s: 'MATIC/USD', p: '$0.892', c: '+1.44%', u: true }
        ];
        function buildTicker() {
            const tt = document.getElementById('tt');
            const items = [...TDATA, ...TDATA].map(t => `<div class="ti"><span class="sym">${t.s}</span><span>${t.p}</span><span class="${t.u ? 'up' : 'dn'}">${t.u ? '▲' : '▼'} ${t.c}</span></div>`).join('');
            tt.innerHTML = items;
        }
        buildTicker();

        // ── CHART ────────────────────────────────────────────────────────────────────
        const PRICES = { BTC: 84230, ETH: 3210, BNB: 412 };
        function genData(base, n, vol) {
            let d = [], v = base;
            for (let i = 0; i < n; i++) { v += ((Math.random() - .47) * vol); d.push(Math.max(v, base * .6)); }
            return d;
        }
        const CDATA = {
            '1H': genData(84230, 60, 400), '1D': genData(82000, 96, 800),
            '1W': genData(78000, 168, 1200), '1M': genData(70000, 30, 2000), '1Y': genData(40000, 52, 3000)
        };
        let curT = '1D';
        function ST(el, t) {
            document.querySelectorAll('.ctab').forEach(c => c.classList.remove('ac'));
            el.classList.add('ac'); curT = t; drawChart();
        }

        function fmtPrice(v) {
            if (v >= 1000) return '$' + (v / 1000).toFixed(1) + 'K';
            return '$' + Math.round(v);
        }

        function drawChart() {
            const canvas = document.getElementById('cc');
            if (!canvas) return;
            // Force layout recalc so offsetWidth is correct after CSS changes
            const cbody = document.getElementById('cbody');
            const W = cbody ? cbody.offsetWidth - 80 : canvas.offsetWidth;
            const H = cbody ? cbody.offsetHeight - 28 : canvas.offsetHeight;
            if (W <= 0 || H <= 0) return;

            canvas.style.width = W + 'px';
            canvas.style.height = H + 'px';
            canvas.width = Math.round(W * devicePixelRatio);
            canvas.height = Math.round(H * devicePixelRatio);

            const ctx = canvas.getContext('2d');
            ctx.scale(devicePixelRatio, devicePixelRatio);

            const data = CDATA[curT];
            const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
            const ptX = (i) => i * (W / (data.length - 1));
            const ptY = (v) => H - ((v - mn) / rng * (H * .84) + H * .06);

            ctx.clearRect(0, 0, W, H);

            // Grid lines
            ctx.strokeStyle = 'rgba(0,229,195,.07)'; ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = H * .06 + i * (H * .84 / 4);
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
            }

            // Gradient area fill
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, 'rgba(0,229,195,.2)');
            grad.addColorStop(0.7, 'rgba(0,229,195,.04)');
            grad.addColorStop(1, 'rgba(0,229,195,0)');
            ctx.beginPath();
            ctx.moveTo(ptX(0), ptY(data[0]));
            data.forEach((v, i) => { if (i > 0) ctx.lineTo(ptX(i), ptY(v)); });
            ctx.lineTo(ptX(data.length - 1), H);
            ctx.lineTo(0, H);
            ctx.closePath();
            ctx.fillStyle = grad; ctx.fill();

            // Line
            ctx.beginPath();
            ctx.moveTo(ptX(0), ptY(data[0]));
            data.forEach((v, i) => { if (i > 0) ctx.lineTo(ptX(i), ptY(v)); });
            ctx.strokeStyle = '#00e5c3'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();

            // Endpoint dot
            const lastX = ptX(data.length - 1), lastY = ptY(data[data.length - 1]);
            ctx.beginPath(); ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#00e5c3'; ctx.fill();
            ctx.beginPath(); ctx.arc(lastX, lastY, 7, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,229,195,.25)'; ctx.fill();

            // Y-axis labels
            const ya = document.getElementById('ya');
            if (ya) ya.innerHTML = [mx, mn + rng * .75, mn + rng * .5, mn + rng * .25, mn]
                .map(v => `<span>${fmtPrice(v)}</span>`).join('');

            // X-axis labels
            const xa = document.getElementById('xa');
            if (xa) {
                const step = Math.max(1, Math.floor(data.length / 5));
                const labels = { '1H': 'm', '1D': 'h', '1W': 'd', '1M': 'd', '1Y': 'w' };
                xa.innerHTML = Array.from({ length: 6 }, (_, i) => i * step)
                    .filter(i => i < data.length)
                    .map(i => `<span>${i}${labels[curT]}</span>`).join('');
            }

            // Live price update simulation
            const last = data[data.length - 1];
            const lp = document.getElementById('lp');
            if (lp) lp.textContent = '$' + last.toLocaleString(undefined, { maximumFractionDigits: 0 });
        }

        // Live price tick every 3s
        setInterval(() => {
            const d = CDATA[curT];
            const last = d[d.length - 1];
            const newVal = last + ((Math.random() - .49) * 200);
            d.push(Math.max(newVal, 50000));
            if (d.length > 200) d.shift();
            drawChart();
        }, 3000);

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(drawChart, 80);
        });
        window.addEventListener('load', () => { setTimeout(drawChart, 150); });

        // ── NETWORK CHART ─────────────────────────────────────────────────────────────
        function drawNetwork() {
            const canvas = document.getElementById('nc'); if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const W = canvas.offsetWidth, H = canvas.offsetHeight;
            canvas.width = W * devicePixelRatio; canvas.height = H * devicePixelRatio;
            ctx.scale(devicePixelRatio, devicePixelRatio);
            const nodes = Array.from({ length: 18 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 3 + 2 }));
            ctx.strokeStyle = 'rgba(0,229,195,.12)'; ctx.lineWidth = 1;
            nodes.forEach((a, i) => nodes.slice(i + 1).forEach(b => {
                const d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d < W * .35) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
            }));
            nodes.forEach(n => { ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,229,195,.6)'; ctx.fill(); });
        }
        window.addEventListener('load', () => { setTimeout(drawNetwork, 100); });

        // ── TESTIMONIALS ─────────────────────────────────────────────────────────────
        const TESTI = [
            { n: 'Michael Torres', t: 'Day Trader, New York', q: 'Crypto Nova\'s execution speed is unmatched. I\'ve tried five platforms and none come close to the sub-millisecond fills I get here.', av: 'https://i.pravatar.cc/80?img=11' },
            { n: 'Priya Sharma', t: 'Portfolio Manager, London', q: 'The managed plans are genuinely impressive. My Institutional plan has delivered consistently above the projected ROI every single month.', av: 'https://i.pravatar.cc/80?img=47' },
            { n: 'James Okafor', t: 'Crypto Investor, Lagos', q: 'The cold storage setup and 2FA give me complete peace of mind. I\'ve moved my entire long-term portfolio here.', av: 'https://i.pravatar.cc/80?img=33' },
            { n: 'Sophie Klein', t: 'Forex Trader, Berlin', q: '60+ pairs with tight spreads and 1:500 leverage. As a professional forex trader this is exactly what I needed.', av: 'https://i.pravatar.cc/80?img=25' },
            { n: 'Aiden Wu', t: 'Quant Analyst, Singapore', q: 'The API access and advanced analytics are top tier. I\'ve automated my entire strategy through their infrastructure.', av: 'https://i.pravatar.cc/80?img=52' },
            { n: 'Elena Russo', t: 'Private Investor, Milan', q: 'Customer support is exceptional. They helped me set up my cloud mining contract and I\'ve been earning daily rewards ever since.', av: 'https://i.pravatar.cc/80?img=44' }
        ];
        let tp = 0;
        function renderT() {
            const g = document.getElementById('tg');
            const isMobile = window.innerWidth < 700;
            const count = isMobile ? 1 : 3;
            const visible = TESTI.slice(tp, tp + count);
            g.innerHTML = visible.map(t => `<div class="tc"><div class="tstar">★★★★★</div><div class="tq">"${t.q}"</div><div class="tau"><img class="tav" src="${t.av}" alt="${t.n}"><div><div class="tan">${t.n}</div><div class="tat">${t.t}</div></div></div></div>`).join('');
        }
        document.getElementById('tn').addEventListener('click', () => {
            const count = window.innerWidth < 700 ? 1 : 3;
            tp = (tp + count) % TESTI.length; renderT();
        });
        document.getElementById('tp').addEventListener('click', () => {
            const count = window.innerWidth < 700 ? 1 : 3;
            tp = (tp - count + TESTI.length) % TESTI.length; renderT();
        });
        renderT();

        // ── COUNTERS ─────────────────────────────────────────────────────────────────
        function animateCounters() {
            document.querySelectorAll('.cnt').forEach(el => {
                const target = parseFloat(el.dataset.t), suffix = el.dataset.s || '', dec = parseInt(el.dataset.d) || 0;
                let start = null;
                const step = ts => {
                    if (!start) start = ts;
                    const prog = Math.min((ts - start) / 1800, 1);
                    el.textContent = (target * prog).toFixed(dec) + suffix;
                    if (prog < 1) requestAnimationFrame(step);
                };
                requestAnimationFrame(step);
            });
        }

        // ── SCROLL REVEAL ────────────────────────────────────────────────────────────
        const ro = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('vis');
                    if (e.target.querySelector('.cnt')) animateCounters();
                }
            });
        }, { threshold: .15 });
        document.querySelectorAll('.rev').forEach(el => ro.observe(el));

        // ── HAMBURGER — REMOVED OLD DUPLICATE HANDLER (was here) ─────────────────────

        // ── DROPDOWN ─────────────────────────────────────────────────────────────────
        function toggleDD(e, id) {
            e.preventDefault(); e.stopPropagation();
            const m = document.getElementById(id);
            m.style.display = m.style.display === 'block' ? 'none' : 'block';
        }
        document.addEventListener('click', function () {
            document.querySelectorAll('[id$="-menu"]').forEach(m => m.style.display = 'none');
        });


/* ══ TICKER ══ */
const TICKS=[{s:'BTC/USD',p:'84,230.90',c:'+2.45%',u:1},{s:'ETH/USD',p:'3,495.12',c:'+1.82%',u:1},{s:'EUR/USD',p:'1.1084',c:'-0.21%',u:0},{s:'GBP/USD',p:'1.2650',c:'-0.34%',u:0},{s:'XAU/USD',p:'2,340.50',c:'+0.55%',u:1},{s:'SOL/USD',p:'148.30',c:'+3.12%',u:1},{s:'BNB/USD',p:'602.40',c:'-0.88%',u:0},{s:'ADA/USD',p:'0.4512',c:'+1.20%',u:1},{s:'XRP/USD',p:'0.5830',c:'+0.74%',u:1},{s:'DOGE/USD',p:'0.1612',c:'-1.10%',u:0}];
(()=>{document.getElementById('tt').innerHTML=[...TICKS,...TICKS].map(x=>`<div class="ti"><span class="ts">${x.s}</span><span class="tp">$${x.p}</span><span class="${x.u?'tu':'td2'}">${x.c}</span></div>`).join('')})();

/* ══ HAMBURGER ══ */
(()=>{
    const btn=document.getElementById('hamburger');
    const menu=document.getElementById('mobile-menu');
    if(!btn||!menu)return;

    btn.addEventListener('click',()=>{
        const isOpen=btn.classList.toggle('open');
        btn.setAttribute('aria-expanded',isOpen);
        if(isOpen){
            menu.style.display='flex';
            requestAnimationFrame(()=>{
                requestAnimationFrame(()=>menu.classList.add('open'));
            });
        } else {
            menu.classList.remove('open');
            menu.addEventListener('transitionend',()=>{
                if(!menu.classList.contains('open'))menu.style.display='none';
            },{once:true});
        }
    });

    // Close menu when a link is clicked
    menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded','false');
        menu.classList.remove('open');
        menu.addEventListener('transitionend',()=>{
            if(!menu.classList.contains('open'))menu.style.display='none';
        },{once:true});
    }));

    // Close menu on outside click
    document.addEventListener('click',e=>{
        if(!btn.contains(e.target)&&!menu.contains(e.target)&&menu.classList.contains('open')){
            btn.classList.remove('open');
            btn.setAttribute('aria-expanded','false');
            menu.classList.remove('open');
            menu.addEventListener('transitionend',()=>{
                if(!menu.classList.contains('open'))menu.style.display='none';
            },{once:true});
        }
    });

    // Close menu on resize to desktop
    window.addEventListener('resize',()=>{
        if(window.innerWidth>960){
            btn.classList.remove('open');
            btn.setAttribute('aria-expanded','false');
            menu.classList.remove('open');
            menu.style.display='none';
        }
    });
})();

/* ══ BTC CHART ENGINE ══ */
const CE=(()=>{
    const cv=document.getElementById('cc'),ctx=cv.getContext('2d');
    const tt=document.getElementById('ctt'),bod=document.getElementById('cbody');
    let data=[],tab='1D',mouse=null,aid=null;
    let touchActive=false;

function gen(n,base,vol,tr){
    const a=[];let p=base;
    for(let i=0;i<n;i++){
        const s=(Math.random()-.49)*vol,t=Math.sin(i/(n/5))*(vol*.4);
        p=Math.max(base*.68,Math.min(base*1.38,p+s+t+tr));
        a.push(Math.round(p*100)/100);
    }
    return a;
}

const CFG={
    '1H':{n:60,base:83500,vol:120,tr:.8,xl:()=>{const h=new Date().getHours();return Array.from({length:7},(_,i)=>`${String((h-6+i+24)%24).padStart(2,'0')}:00`)}},
    '1D':{n:96,base:82000,vol:600,tr:2,xl:()=>['00:00','04:00','08:00','12:00','16:00','20:00','24:00']},
    '1W':{n:84,base:75000,vol:1800,tr:6,xl:()=>['Mon','Tue','Wed','Thu','Fri','Sat','Sun']},
    '1M':{n:90,base:68000,vol:3000,tr:12,xl:()=>['Week 1','Week 2','Week 3','Week 4']},
    '1Y':{n:104,base:42000,vol:5000,tr:25,xl:()=>['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']},
};

function rsz(){const d=window.devicePixelRatio||1,W=cv.offsetWidth,H=cv.offsetHeight;cv.width=W*d;cv.height=H*d;ctx.scale(d,d)}

function ya(){
    const mn=Math.min(...data),mx=Math.max(...data),pad=(mx-mn)*.1,lo=mn-pad,hi=mx+pad;
    document.getElementById('ya').innerHTML=Array.from({length:6},(_,i)=>{const v=hi-(i/5)*(hi-lo);return`<span class="yl">$${Math.round(v).toLocaleString()}</span>`}).join('');
}
function xa(ls){document.getElementById('xa').innerHTML=ls.map(l=>`<span class="xl">${l}</span>`).join('')}
function load(t){tab=t;const c=CFG[t];data=gen(c.n,c.base,c.vol,c.tr);ya();xa(c.xl());anim()}

function anim(){
    if(aid)cancelAnimationFrame(aid);
    const s=performance.now(),dur=1600;
    (function fr(now){const p=Math.min((now-s)/dur,1);draw(1-Math.pow(1-p,3),mouse);if(p<1)aid=requestAnimationFrame(fr);else aid=null})(performance.now());
}

function draw(prog,m){
    const W=cv.offsetWidth,H=cv.offsetHeight;
    ctx.clearRect(0,0,W,H);
    const vis=Math.max(2,Math.floor(prog*data.length)),sl=data.slice(0,vis);
    const mn=Math.min(...sl),mx=Math.max(...sl),pad=(mx-mn)*.12,lo=mn-pad,hi=mx+pad;
    const tx=i=>(i/(data.length-1))*W,ty=v=>H-((v-lo)/(hi-lo))*(H*.88)-H*.06;

    for(let g=0;g<6;g++){const y=ty(lo+(g/5)*(hi-lo));ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.strokeStyle='rgba(14,207,170,.05)';ctx.lineWidth=1;ctx.stroke()}

    const bH=H*.08,bY=H-bH*.05;
    ctx.globalAlpha=.38;
    for(let i=0;i<sl.length;i++){
        const h=bH*(.25+Math.random()*.75),bw=Math.max(1,(W/data.length)-1);
        ctx.fillStyle=sl[i]>=(sl[i-1]||sl[i])?'rgba(14,207,170,.75)':'rgba(231,76,60,.75)';
        ctx.fillRect(tx(i)-bw/2,bY-h,bw,h);
    }
    ctx.globalAlpha=1;

    const up=sl[sl.length-1]>=sl[0],lc=up?'#0ecfaa':'#e74c3c';

    const gr=ctx.createLinearGradient(0,0,0,H);
    gr.addColorStop(0,up?'rgba(14,207,170,.28)':'rgba(231,76,60,.22)');
    gr.addColorStop(.55,up?'rgba(14,207,170,.07)':'rgba(231,76,60,.05)');
    gr.addColorStop(1,'rgba(0,0,0,0)');
    ctx.beginPath();ctx.moveTo(tx(0),H);
    for(let i=0;i<sl.length;i++){if(i===0)ctx.lineTo(tx(0),ty(sl[0]));else{const cx=(tx(i-1)+tx(i))/2;ctx.bezierCurveTo(cx,ty(sl[i-1]),cx,ty(sl[i]),tx(i),ty(sl[i]))}}
    ctx.lineTo(tx(sl.length-1),H);ctx.closePath();ctx.fillStyle=gr;ctx.fill();

    ctx.beginPath();
    for(let i=0;i<sl.length;i++){if(i===0)ctx.moveTo(tx(0),ty(sl[0]));else{const cx=(tx(i-1)+tx(i))/2;ctx.bezierCurveTo(cx,ty(sl[i-1]),cx,ty(sl[i]),tx(i),ty(sl[i]))}}
    ctx.strokeStyle=lc;ctx.lineWidth=2.5;ctx.shadowColor=lc;ctx.shadowBlur=10;ctx.stroke();ctx.shadowBlur=0;

    if(m&&prog===1){
    const idx=Math.round((m.x/W)*(data.length-1));
    if(idx>=0&&idx<data.length){
        const cx=tx(idx),cy=ty(data[idx]);
        ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx,H);ctx.strokeStyle='rgba(14,207,170,.2)';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.stroke();
        ctx.beginPath();ctx.moveTo(0,cy);ctx.lineTo(W,cy);ctx.stroke();ctx.setLineDash([]);
        ctx.beginPath();ctx.arc(cx,cy,5,0,Math.PI*2);ctx.fillStyle=lc;ctx.shadowColor=lc;ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0;
        const pct=(((data[idx]-data[0])/data[0])*100).toFixed(2);
        tt.innerHTML=`<b>$${data[idx].toLocaleString()}</b> <span style="color:${pct>=0?'#0ecfaa':'#e74c3c'}">${pct>=0?'▲':'▼'} ${Math.abs(pct)}%</span>`;
        tt.style.display='block';
        let tlx=m.x+18,tly=m.y-44;
        if(tlx+175>W)tlx=m.x-185;if(tly<0)tly=8;
        if(tlx<4)tlx=4;
        tt.style.left=tlx+'px';tt.style.top=tly+'px';
    }
    }else tt.style.display='none';

    if(prog===1){const lx=tx(data.length-1),ly=ty(data[data.length-1]);ctx.beginPath();ctx.arc(lx,ly,4,0,Math.PI*2);ctx.fillStyle=lc;ctx.shadowColor=lc;ctx.shadowBlur=16;ctx.fill();ctx.shadowBlur=0}
}

cv.addEventListener('mousemove',e=>{const r=cv.getBoundingClientRect();mouse={x:e.clientX-r.left,y:e.clientY-r.top};if(!aid)draw(1,mouse)});
cv.addEventListener('mouseleave',()=>{mouse=null;tt.style.display='none';if(!aid)draw(1,null)});

cv.addEventListener('touchstart',e=>{
    e.preventDefault();
    touchActive=true;
    const r=cv.getBoundingClientRect(),t=e.touches[0];
    mouse={x:t.clientX-r.left,y:t.clientY-r.top};
    if(!aid)draw(1,mouse);
},{passive:false});

cv.addEventListener('touchmove',e=>{
    e.preventDefault();
    if(!touchActive)return;
    const r=cv.getBoundingClientRect(),t=e.touches[0];
    mouse={x:t.clientX-r.left,y:t.clientY-r.top};
    if(!aid)draw(1,mouse);
},{passive:false});

cv.addEventListener('touchend',()=>{
    touchActive=false;
    mouse=null;
    tt.style.display='none';
    if(!aid)draw(1,null);
});

setInterval(()=>{
    if(!data.length)return;
    const c=CFG[tab],last=data[data.length-1];
    const np=Math.max(c.base*.68,Math.min(c.base*1.38,last+(Math.random()-.485)*c.vol*.4));
    const rp=Math.round(np*100)/100;
    data.push(rp);if(data.length>c.n+20)data.shift();
    ya();if(!aid)draw(1,mouse);
    const prev=data[data.length-2]||rp;
    const pe=document.getElementById('lp'),ce2=document.getElementById('lc');
    pe.textContent='$'+rp.toLocaleString(undefined,{maximumFractionDigits:2});
    pe.style.color=rp>=prev?'#0ecfaa':'#e74c3c';
    const pct2=(((rp-data[0])/data[0])*100).toFixed(2);
    ce2.textContent=(pct2>=0?'▲ +':'▼ ')+pct2+'% today';
    ce2.className=pct2>=0?'cu':'cd';
},2000);

window.addEventListener('resize',()=>{rsz();if(!aid)draw(1,mouse)});
rsz();load('1D');
return{load};
})();

window.ST=(el,t)=>{document.querySelectorAll('.ctab').forEach(x=>x.classList.remove('ac'));el.classList.add('ac');CE.load(t)};

/* ══ NETWORK CANVAS ══ */
(()=>{
const c=document.getElementById('nc');if(!c)return;
const ctx=c.getContext('2d');
const rz=()=>{c.width=c.offsetWidth;c.height=c.offsetHeight};rz();window.addEventListener('resize',rz);
const ns=Array.from({length:24},()=>({x:Math.random()*c.width,y:Math.random()*c.height,vx:(Math.random()-.5)*.5,vy:(Math.random()-.5)*.5,r:2+Math.random()*3,ph:Math.random()*Math.PI*2}));
(function lp(){
    ctx.clearRect(0,0,c.width,c.height);
    for(let i=0;i<ns.length;i++)for(let j=i+1;j<ns.length;j++){const dx=ns[i].x-ns[j].x,dy=ns[i].y-ns[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<150){ctx.beginPath();ctx.moveTo(ns[i].x,ns[i].y);ctx.lineTo(ns[j].x,ns[j].y);ctx.strokeStyle=`rgba(14,207,170,${.22*(1-d/150)})`;ctx.lineWidth=1;ctx.stroke()}}
    ns.forEach(n=>{n.ph+=.04;const g=.5+.5*Math.sin(n.ph);ctx.beginPath();ctx.arc(n.x,n.y,n.r*(1+.3*g),0,Math.PI*2);ctx.fillStyle=`rgba(14,207,170,${.3+.45*g})`;ctx.shadowColor='#0ecfaa';ctx.shadowBlur=10*g;ctx.fill();ctx.shadowBlur=0;n.x+=n.vx;n.y+=n.vy;if(n.x<0||n.x>c.width)n.vx*=-1;if(n.y<0||n.y>c.height)n.vy*=-1});
    requestAnimationFrame(lp);
})();
})();

/* ══ COUNTERS ══ */
(()=>{
const obs=new IntersectionObserver(es=>{es.forEach(e=>{if(!e.isIntersecting)return;const el=e.target,tgt=parseFloat(el.dataset.t),suf=el.dataset.s||'',dec=parseInt(el.dataset.d)||0,dur=2400,s=performance.now();(function tk(now){const p=Math.min((now-s)/dur,1),ease=1-Math.pow(1-p,4),v=ease*tgt;el.textContent=(dec?v.toFixed(dec):Math.floor(v).toLocaleString())+suf;if(p<1)requestAnimationFrame(tk);else el.textContent=(dec?tgt.toFixed(dec):tgt.toLocaleString())+suf})(performance.now());obs.unobserve(el)})},{threshold:.5});
document.querySelectorAll('.cnt').forEach(el=>obs.observe(el));
})();

/* ══ TESTIMONIALS ══ */
(()=>{
const T=[
    {q:"The most professional platform I've used. The spreads on EUR/USD are incredibly tight, and withdrawals are processed within hours.",n:"Marcus T.",r:"Forex Trader",i:"https://i.pravatar.cc/80?img=11"},
    {q:"I switched to Equinox's managed plans 6 months ago. The consistency in their algorithm trading strategy is impressive. Highly recommended for passive income.",n:"Sarah L.",r:"Private Investor",i:"https://i.pravatar.cc/80?img=25"},
    {q:"Security was my main concern when dealing with crypto. The cold storage solutions and regular audits give me complete peace of mind.",n:"David W.",r:"Institutional Client",i:"https://i.pravatar.cc/80?img=33"},
    {q:"Real-time execution is no joke. I've tested several platforms and Equinox consistently fills orders at the exact price I see — zero slippage.",n:"Yemi A.",r:"Algorithmic Trader",i:"https://i.pravatar.cc/80?img=52"},
    {q:"The analytics dashboard alone is worth it. I can track my P&L across all asset classes in one view. It completely changed how I manage risk.",n:"Chen W.",r:"Portfolio Manager",i:"https://i.pravatar.cc/80?img=60"},
    {q:"Customer support is exceptional — 24/7 and they actually understand trading. Had an issue at 3am and it was resolved in under 10 minutes.",n:"Fatima R.",r:"Day Trader",i:"https://i.pravatar.cc/80?img=44"},
];
    const grid=document.getElementById('tg'),total=T.length;let cur=0;
    const pp=()=>window.innerWidth<768?1:3;
    const render=()=>{
    const p=pp();grid.style.gridTemplateColumns=p===1?'1fr':'repeat(3,1fr)';
    grid.innerHTML=Array.from({length:p},(_,i)=>T[(cur+i)%total]).map((t,i)=>`<div class="tc" style="animation-delay:${i*.08}s"><div class="tq">${t.q}</div><div class="tau"><img class="tav" src="${t.i}" alt="${t.n}"><div><div class="tn">${t.n}</div><div class="tr">${t.r}</div></div><div class="tst">★★★★★</div></div></div>`).join('');
};
document.getElementById('tp').addEventListener('click',()=>{cur=(cur-pp()+total)%total;render()});
document.getElementById('tn').addEventListener('click',()=>{cur=(cur+pp())%total;render()});
render();window.addEventListener('resize',render);
})();

/* ══ SCROLL REVEAL ══ */
(()=>{const obs=new IntersectionObserver(e=>e.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');obs.unobserve(x.target)}}),{threshold:.1});document.querySelectorAll('.rev').forEach(el=>obs.observe(el))})();

/* ══ NAVBAR ══ */
window.addEventListener('scroll',()=>{document.getElementById('nav').classList.toggle('sc',scrollY>40)},{passive:true});