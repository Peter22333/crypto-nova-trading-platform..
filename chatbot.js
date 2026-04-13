/* ═══════════════════════════════════════════════════════
   Crypto Nova AI Support Chat
   Usage: <script src="chatbot.js"></script>
   Put this just before </body> on any page
═══════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ── CONFIG ── */
const CN = {
  name:    'Nova',
  avatar:  '#16a34a',
  brand:   'Crypto Nova',
  apiUrl:  'https://api.anthropic.com/v1/messages',
  model:   'claude-sonnet-4-20250514',
  /* Escalation: when user wants human, open this */
  supportEmail: 'cryptonova.info2024@gmail.com',
  supportLink:  'contact.html',

  systemPrompt: `You are Nova, the friendly AI support assistant for Crypto Nova — a regulated crypto and forex trading platform.

Your job:
- Answer questions about Crypto Nova's services clearly and helpfully
- Be concise — keep replies to 2-4 sentences unless detail is needed
- Use simple language, no jargon
- Always be warm, professional, and encouraging
- If you cannot answer something confidently or the user has an account-specific issue, escalate to human support

Crypto Nova services:
- Forex Trading: 10+ currency pairs, leverage up to 1:500, real-time execution
- Crypto Trading: BTC, ETH, SOL, BNB, XRP and more
- Investment Plans: Starter (5%/day, min $500, 7 days), Pro (8%/day, min $5,000, 14 days), Premium (12%/day, min $25,000, 30 days)
- Cloud Mining: Bronze ($500, 15 TH/s, 1.2%/day, 180 days), Silver ($5,000, 150 TH/s, 1.5%/day, 365 days), Gold ($25,000, 350 TH/s, 2.6%/day, 365 days)
- Deposits: Crypto only (BTC, ETH, USDT, SOL, BNB) — reviewed and credited within 1-24 hours
- Withdrawals: Submit request, processed within 1-24 hours, minimum $20

Account info:
- Sign up at signup.html, login at login.html
- Dashboard at dashboard.html shows balance, trades, portfolio
- All balances are in USD

Rules:
- Never make up specific numbers not listed above
- Never promise guaranteed returns (say "projected" or "estimated")
- For account issues (missing balance, stuck withdrawal, login problems) always escalate to human support
- If asked something unrelated to Crypto Nova (weather, coding, general knowledge), politely redirect to platform topics
- Keep responses under 150 words unless user asks for detail
- Format with short paragraphs, no markdown headers, minimal bullet points`
};

/* ── QUICK REPLIES ── */
const QUICK = [
  { label: '💰 Investment Plans',  msg: 'Tell me about the investment plans' },
  { label: '⛏️ Cloud Mining',      msg: 'How does cloud mining work?' },
  { label: '📈 Forex Trading',     msg: 'How do I start forex trading?' },
  { label: '💳 How to Deposit',    msg: 'How do I deposit funds?' },
  { label: '💸 Withdrawals',       msg: 'How do withdrawals work?' },
  { label: '🔒 Is it safe?',       msg: 'Is Crypto Nova safe and regulated?' },
];

/* ── STATE ── */
let isOpen   = false;
let isTyping = false;
let history  = [];  // {role, content}
let hasGreeted = false;
let unread   = 0;

/* ── INJECT CSS ── */
const style = document.createElement('style');
style.textContent = `
#cn-chat-btn{position:fixed;bottom:28px;right:28px;width:58px;height:58px;border-radius:50%;background:#16a34a;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(22,163,74,.45);z-index:9998;transition:all .3s cubic-bezier(.34,1.56,.64,1)}
#cn-chat-btn:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(22,163,74,.55)}
#cn-chat-btn.open{background:#374151}
#cn-unread{position:absolute;top:-3px;right:-3px;width:20px;height:20px;border-radius:50%;background:#ef4444;color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #fff;display:none;font-family:system-ui,sans-serif}
#cn-chat-btn.pulse::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:3px solid rgba(22,163,74,.4);animation:cn-pulse 2s ease infinite}
@keyframes cn-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.25);opacity:0}}
#cn-chat-win{position:fixed;bottom:100px;right:28px;width:370px;height:580px;background:#fff;border-radius:20px;box-shadow:0 20px 64px rgba(0,0,0,.18);z-index:9997;display:flex;flex-direction:column;overflow:hidden;transform:scale(.85) translateY(20px);opacity:0;pointer-events:none;transition:all .3s cubic-bezier(.34,1.56,.64,1);transform-origin:bottom right}
#cn-chat-win.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all}
#cn-chat-hdr{background:linear-gradient(135deg,#16a34a,#0db89e);padding:16px 18px;display:flex;align-items:center;gap:12px;flex-shrink:0}
#cn-chat-hdr-av{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px}
#cn-chat-hdr-info{flex:1}
#cn-chat-hdr-name{font-family:system-ui,sans-serif;font-size:15px;font-weight:800;color:#fff}
#cn-chat-hdr-status{font-size:11px;color:rgba(255,255,255,.8);display:flex;align-items:center;gap:5px;margin-top:2px}
#cn-chat-hdr-status::before{content:'';width:6px;height:6px;border-radius:50%;background:#86efac;flex-shrink:0}
#cn-chat-close{background:rgba(255,255,255,.2);border:none;color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:background .2s;flex-shrink:0}
#cn-chat-close:hover{background:rgba(255,255,255,.35)}
#cn-chat-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;scroll-behavior:smooth}
#cn-chat-msgs::-webkit-scrollbar{width:3px}
#cn-chat-msgs::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:3px}
.cn-msg{display:flex;gap:8px;align-items:flex-end;animation:cn-msgIn .25s ease}
@keyframes cn-msgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.cn-msg.user{flex-direction:row-reverse}
.cn-msg-av{width:28px;height:28px;border-radius:50%;background:#16a34a;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}
.cn-msg-bubble{max-width:78%;padding:10px 14px;border-radius:16px;font-family:system-ui,sans-serif;font-size:13px;line-height:1.55;color:#111827}
.cn-msg.bot .cn-msg-bubble{background:#f3f4f6;border-bottom-left-radius:4px}
.cn-msg.user .cn-msg-bubble{background:#16a34a;color:#fff;border-bottom-right-radius:4px}
.cn-msg-time{font-size:10px;color:#9ca3af;margin-top:4px;text-align:right;font-family:system-ui,sans-serif}
.cn-msg.bot .cn-msg-time{text-align:left}
.cn-typing{display:flex;gap:5px;align-items:center;padding:12px 16px;background:#f3f4f6;border-radius:16px;border-bottom-left-radius:4px;width:fit-content}
.cn-typing span{width:7px;height:7px;border-radius:50%;background:#9ca3af;animation:cn-bounce .9s ease infinite}
.cn-typing span:nth-child(2){animation-delay:.15s}
.cn-typing span:nth-child(3){animation-delay:.3s}
@keyframes cn-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
#cn-quick-wrp{padding:8px 14px;display:flex;gap:6px;flex-wrap:wrap;flex-shrink:0;border-top:1px solid #f3f4f6}
.cn-quick-btn{padding:5px 12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:50px;font-family:system-ui,sans-serif;font-size:11px;font-weight:600;color:#16a34a;cursor:pointer;transition:all .18s;white-space:nowrap}
.cn-quick-btn:hover{background:#16a34a;color:#fff;border-color:#16a34a}
#cn-chat-inp-wrap{padding:12px 14px;border-top:1px solid #f3f4f6;display:flex;gap:8px;align-items:center;flex-shrink:0;background:#fff}
#cn-chat-inp{flex:1;border:1.5px solid #e5e7eb;border-radius:22px;padding:9px 16px;font-family:system-ui,sans-serif;font-size:13px;outline:none;resize:none;max-height:80px;overflow-y:auto;transition:border-color .2s;line-height:1.4}
#cn-chat-inp:focus{border-color:#16a34a}
#cn-chat-send{width:36px;height:36px;border-radius:50%;background:#16a34a;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s}
#cn-chat-send:hover{background:#0a9a84;transform:scale(1.05)}
#cn-chat-send:disabled{background:#d1d5db;cursor:not-allowed;transform:none}
#cn-escalate-bar{background:#fffbeb;border-top:1px solid #fde68a;padding:9px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;display:none}
#cn-escalate-bar span{font-size:12px;color:#92400e;font-family:system-ui,sans-serif}
#cn-escalate-bar a{font-size:12px;font-weight:700;color:#16a34a;font-family:system-ui,sans-serif;text-decoration:none;padding:4px 12px;border:1px solid #16a34a;border-radius:20px}
@media(max-width:420px){
  #cn-chat-win{width:calc(100vw - 24px);right:12px;bottom:90px;height:70vh}
  #cn-chat-btn{bottom:20px;right:20px}
}
`;
document.head.appendChild(style);

/* ── INJECT HTML ── */
const wrap = document.createElement('div');
wrap.innerHTML = `
<button id="cn-chat-btn" class="pulse" onclick="cnToggle()" aria-label="Open support chat">
  <div id="cn-unread"></div>
  <svg id="cn-icon-chat" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  <svg id="cn-icon-close" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="display:none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
</button>

<div id="cn-chat-win">
  <div id="cn-chat-hdr">
    <div id="cn-chat-hdr-av">🤖</div>
    <div id="cn-chat-hdr-info">
      <div id="cn-chat-hdr-name">Nova — AI Support</div>
      <div id="cn-chat-hdr-status">Online · Typically replies instantly</div>
    </div>
    <button id="cn-chat-close" onclick="cnToggle()">✕</button>
  </div>

  <div id="cn-chat-msgs"></div>

  <div id="cn-quick-wrp"></div>

  <div id="cn-escalate-bar">
    <span>🙋 Want to speak to a person?</span>
    <a href="${CN.supportLink}">Contact Support →</a>
  </div>

  <div id="cn-chat-inp-wrap">
    <textarea id="cn-chat-inp" placeholder="Ask anything about Crypto Nova…" rows="1"
      onkeydown="cnKey(event)" oninput="cnResize(this)"></textarea>
    <button id="cn-chat-send" onclick="cnSend()" aria-label="Send">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
    </button>
  </div>
</div>`;
document.body.appendChild(wrap);

/* ── BUILD QUICK REPLIES ── */
const qWrap = document.getElementById('cn-quick-wrp');
QUICK.forEach(q => {
  const btn = document.createElement('button');
  btn.className = 'cn-quick-btn';
  btn.textContent = q.label;
  btn.onclick = () => cnSendMsg(q.msg);
  qWrap.appendChild(btn);
});

/* ── HELPERS ── */
function timeStr(){
  return new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
}
function scrollBottom(){
  const msgs = document.getElementById('cn-chat-msgs');
  setTimeout(()=>{ msgs.scrollTop = msgs.scrollHeight; }, 50);
}

function addMsg(role, text, showTime=true){
  const msgs = document.getElementById('cn-chat-msgs');
  const div = document.createElement('div');
  div.className = 'cn-msg ' + role;
  const isBot = role === 'bot';
  const esc = text.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  div.innerHTML = `
    ${isBot ? '<div class="cn-msg-av">🤖</div>' : ''}
    <div>
      <div class="cn-msg-bubble">${esc}</div>
      ${showTime ? `<div class="cn-msg-time">${timeStr()}</div>` : ''}
    </div>
    ${!isBot ? '<div class="cn-msg-av" style="background:#6b7280;font-size:11px;font-weight:700;color:#fff">You</div>' : ''}
  `;
  msgs.appendChild(div);
  scrollBottom();
}

function showTyping(){
  const msgs = document.getElementById('cn-chat-msgs');
  const div = document.createElement('div');
  div.className = 'cn-msg bot';
  div.id = 'cn-typing-ind';
  div.innerHTML = `<div class="cn-msg-av">🤖</div>
    <div class="cn-typing"><span></span><span></span><span></span></div>`;
  msgs.appendChild(div);
  scrollBottom();
}
function hideTyping(){
  const el = document.getElementById('cn-typing-ind');
  if(el) el.remove();
}

function setUnread(n){
  unread = n;
  const badge = document.getElementById('cn-unread');
  if(n > 0 && !isOpen){
    badge.textContent = n;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

function detectEscalation(text){
  const t = text.toLowerCase();
  const triggers = ['human','agent','person','staff','support','speak to','talk to','real person','help me','urgent','not working','problem','issue','complaint','missing','wrong'];
  return triggers.some(w => t.includes(w));
}

/* ── TOGGLE OPEN/CLOSE ── */
window.cnToggle = function(){
  isOpen = !isOpen;
  const win  = document.getElementById('cn-chat-win');
  const btn  = document.getElementById('cn-chat-btn');
  const ic   = document.getElementById('cn-icon-chat');
  const ix   = document.getElementById('cn-icon-close');
  win.classList.toggle('open', isOpen);
  btn.classList.toggle('open', isOpen);
  btn.classList.remove('pulse');
  ic.style.display = isOpen ? 'none' : 'block';
  ix.style.display = isOpen ? 'block' : 'none';
  setUnread(0);
  if(isOpen && !hasGreeted){
    hasGreeted = true;
    setTimeout(()=>{
      addMsg('bot', "Hi there! 👋 I'm Nova, Crypto Nova's AI assistant. I can answer questions about our investment plans, trading, deposits, withdrawals, and more.\n\nWhat can I help you with today?");
    }, 400);
  }
  if(isOpen){
    setTimeout(()=>document.getElementById('cn-chat-inp').focus(), 300);
  }
};

/* ── RESIZE TEXTAREA ── */
window.cnResize = function(el){
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 80) + 'px';
};

/* ── ENTER TO SEND ── */
window.cnKey = function(e){
  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault();
    cnSend();
  }
};

/* ── SEND FROM INPUT ── */
window.cnSend = function(){
  const inp = document.getElementById('cn-chat-inp');
  const msg = inp.value.trim();
  if(!msg || isTyping) return;
  inp.value = '';
  inp.style.height = 'auto';
  cnSendMsg(msg);
};

/* ── CORE SEND + AI CALL ── */
window.cnSendMsg = async function(msg){
  if(isTyping) return;

  // Add user message to UI and history
  addMsg('user', msg);
  history.push({role:'user', content:msg});

  // Hide quick replies after first message
  document.getElementById('cn-quick-wrp').style.display = 'none';

  // Check for escalation keywords
  if(detectEscalation(msg)){
    document.getElementById('cn-escalate-bar').style.display = 'flex';
  }

  isTyping = true;
  document.getElementById('cn-chat-send').disabled = true;
  showTyping();

  try{
    const res = await fetch(CN.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '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',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: CN.model,
        max_tokens: 300,
        system: CN.systemPrompt,
        messages: history.slice(-10)  // keep last 10 for context
      })
    });

    const data = await res.json();
    hideTyping();

    if(data.error){
      // Fallback to scripted response if API fails
      const fallback = getFallback(msg);
      addMsg('bot', fallback);
      history.push({role:'assistant', content:fallback});
    } else {
      const reply = data.content?.[0]?.text || "I'm sorry, I didn't catch that. Could you rephrase?";
      addMsg('bot', reply);
      history.push({role:'assistant', content:reply});
      // Show escalation bar if AI suggests human help
      if(reply.toLowerCase().includes('contact') || reply.toLowerCase().includes('support team')){
        document.getElementById('cn-escalate-bar').style.display = 'flex';
      }
    }
  } catch(e){
    hideTyping();
    const fallback = getFallback(msg);
    addMsg('bot', fallback);
    history.push({role:'assistant', content:fallback});
  }

  isTyping = false;
  document.getElementById('cn-chat-send').disabled = false;

  // If chat is closed, show unread badge
  if(!isOpen) setUnread(unread + 1);
  scrollBottom();
};

/* ── SCRIPTED FALLBACKS (if API unavailable) ── */
function getFallback(msg){
  const t = msg.toLowerCase();
  if(t.includes('invest') || t.includes('plan')){
    return "We have 3 investment plans:\n\n• Starter — min $500, 5%/day for 7 days\n• Pro — min $5,000, 8%/day for 14 days\n• Premium — min $25,000, 12%/day for 30 days\n\nReturns are projected and credited daily to your balance.";
  }
  if(t.includes('mining') || t.includes('mine')){
    return "Our cloud mining contracts let you earn passive crypto income without hardware:\n\n• Bronze — $500, 15 TH/s, 1.2%/day, 180 days\n• Silver — $5,000, 150 TH/s, 1.5%/day, 365 days\n• Gold — $25,000, 350 TH/s, 2.6%/day, 365 days";
  }
  if(t.includes('deposit')){
    return "To deposit, log into your account → Dashboard → Deposit. We accept BTC, ETH, USDT, SOL and BNB. Send crypto to your unique address and our team will credit your account within 1–24 hours.";
  }
  if(t.includes('withdraw')){
    return "To withdraw, go to Dashboard → Withdraw. Enter your wallet address and amount (minimum $20). Withdrawals are processed within 1–24 hours after review by our team.";
  }
  if(t.includes('forex')){
    return "Our forex terminal supports 10+ currency pairs including EUR/USD, GBP/USD and USD/JPY with leverage up to 1:500. Access it from Dashboard → Trade or directly at forex.html.";
  }
  if(t.includes('safe') || t.includes('secure') || t.includes('trust')){
    return "Crypto Nova uses bank-grade 256-bit encryption, two-factor authentication, and cold wallet storage for all funds. Your security is our top priority.";
  }
  if(t.includes('signup') || t.includes('register') || t.includes('account')){
    return "Creating an account is free and takes under 2 minutes. Click 'Open Account' at the top of any page, or go to signup.html.";
  }
  return "Thanks for your message! For this query, I'd recommend reaching out to our support team directly — they'll be happy to help. Click 'Contact Support' below or email us at " + CN.supportEmail;
}

/* ── AUTO SHOW after 8s if user hasn't opened ── */
setTimeout(()=>{
  if(!hasGreeted && !isOpen){
    setUnread(1);
    document.getElementById('cn-chat-btn').classList.add('pulse');
  }
}, 8000);

})();