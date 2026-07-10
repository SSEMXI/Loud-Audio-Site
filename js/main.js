// ===================== CONFIG =====================
// Point this at your Railway backend once deployed.
// e.g. "https://loud-audio-backend.up.railway.app"
const API_BASE = window.LOUD_API_BASE || "https://loud-audio-mastering-backend-production.up.railway.app";

// ===================== NAV =====================
(function(){
  const nav = document.querySelector('.site-nav');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if(nav){
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }, {passive:true});
  }
  if(toggle && links){
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true':'false');
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }
})();

// ===================== VU METER (decorative, hero) =====================
(function(){
  const row = document.querySelector('.vu-row');
  if(!row) return;
  const n = 24;
  for(let i=0;i<n;i++){
    const bar = document.createElement('div');
    bar.className = 'vu-bar';
    bar.style.animationDelay = (Math.random()*1.8).toFixed(2)+'s';
    bar.style.animationDuration = (1.2 + Math.random()*1.1).toFixed(2)+'s';
    row.appendChild(bar);
  }
})();

// ===================== FAQ ACCORDION =====================
(function(){
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q && q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(o => {
        o.classList.remove('open');
        o.querySelector('.faq-a').style.maxHeight = null;
      });
      if(!isOpen){
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });
})();

// ===================== FILE UPLOAD WIDGET =====================
// Used on book.html and thank-you.html (post-purchase delivery of project files)
function initUploadWidget(dropId, inputId, listId){
  const drop = document.getElementById(dropId);
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  if(!drop || !input || !list) return;
  let files = [];

  function render(){
    list.innerHTML = '';
    files.forEach((f, idx) => {
      const row = document.createElement('div');
      row.className = 'file';
      row.innerHTML = `<span>${f.name} · ${(f.size/1024/1024).toFixed(1)}MB</span>`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Remove ' + f.name);
      btn.textContent = '✕';
      btn.addEventListener('click', () => { files.splice(idx,1); render(); });
      row.appendChild(btn);
      list.appendChild(row);
    });
  }

  function addFiles(fileList){
    Array.from(fileList).forEach(f => files.push(f));
    render();
  }

  drop.addEventListener('click', () => input.click());
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
  drop.addEventListener('drop', e => {
    e.preventDefault();
    drop.classList.remove('drag');
    addFiles(e.dataTransfer.files);
  });
  input.addEventListener('change', () => addFiles(input.files));

  return { getFiles: () => files };
}

// ===================== STRIPE CHECKOUT =====================
// Frontend just asks the backend to create a Checkout Session, then redirects.
// Backend route + Stripe secret key live on Railway — see /backend/server.js
async function startCheckout(serviceId, serviceName, priceCents, customerEmail){
  try{
    const res = await fetch(`${API_BASE}/api/create-checkout-session`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ serviceId, serviceName, priceCents, customerEmail })
    });
    if(!res.ok) throw new Error('Checkout session failed');
    const data = await res.json();
    if(data.url) window.location.href = data.url;
  }catch(err){
    console.error(err);
    alert('Checkout is being connected — this button will go live once the backend is deployed to Railway. See README.');
  }
}

// wire up any [data-checkout] buttons declared in HTML
document.querySelectorAll('[data-checkout]').forEach(btn => {
  btn.addEventListener('click', () => {
    startCheckout(
      btn.dataset.serviceId,
      btn.dataset.serviceName,
      parseInt(btn.dataset.priceCents, 10),
      null
    );
  });
});

// ===================== AI INTAKE CHATBOT =====================
(function(){
  const launcher = document.getElementById('chatLauncher');
  const win = document.getElementById('chatWindow');
  const closeBtn = document.getElementById('chatClose');
  const body = document.getElementById('chatBody');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  if(!launcher || !win) return;

  let opened = false;
  launcher.addEventListener('click', () => {
    win.classList.toggle('open');
    if(!opened){
      opened = true;
      botSay("Hey — I'm the Loud Audio intake assistant. What are you looking to get done today?", [
        "Mix my song", "Master my track", "Vocal tuning", "Not sure yet"
      ]);
    }
  });
  closeBtn && closeBtn.addEventListener('click', () => win.classList.remove('open'));

  function scrollDown(){ body.scrollTop = body.scrollHeight; }

  function botSay(text, chips){
    const msg = document.createElement('div');
    msg.className = 'msg bot';
    msg.textContent = text;
    body.appendChild(msg);
    if(chips && chips.length){
      const row = document.createElement('div');
      row.className = 'chip-row';
      chips.forEach(c => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.textContent = c;
        chip.addEventListener('click', () => { userSay(c); handleTurn(c); });
        row.appendChild(chip);
      });
      body.appendChild(row);
    }
    scrollDown();
  }

  function userSay(text){
    const msg = document.createElement('div');
    msg.className = 'msg me';
    msg.textContent = text;
    body.appendChild(msg);
    scrollDown();
  }

  // Simple local flow as a fallback demo. Swap with a real call to
  // ${API_BASE}/api/chat (which calls the Claude/OpenAI API server-side)
  // for genuinely intelligent, open-ended intake.
  let stage = 0;
  async function handleTurn(text){
    // Try the real backend first
    try{
      const res = await fetch(`${API_BASE}/api/chat`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message: text })
      });
      if(res.ok){
        const data = await res.json();
        botSay(data.reply, data.suggestions || []);
        return;
      }
    }catch(e){ /* fall through to local demo flow */ }

    stage++;
    if(stage === 1){
      botSay("Got it. What's the timeline you're hoping for?", ["This week", "Next 2 weeks", "Flexible"]);
    }else if(stage === 2){
      botSay("Perfect — I can get you to the right service and price. Want me to take you to booking now?", ["Yes, take me there", "I have a question first"]);
    }else{
      botSay("You can fill out the booking form below with your project details, or head straight to a service to pay and upload your files.", []);
      window.location.href = "book.html";
    }
  }

  form && form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim();
    if(!text) return;
    userSay(text);
    input.value = '';
    handleTurn(text);
  });
})();
