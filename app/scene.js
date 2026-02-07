export function startScene(ids){
  const bg = document.getElementById(ids.bgVideoId);
  const fx = document.getElementById(ids.fxId);
  const ctx = fx.getContext("2d");
  const totemsHost = document.getElementById(ids.totemsId);

  const soundBtn = document.getElementById(ids.soundBtnId);
  const qualityBtn = document.getElementById(ids.qualityBtnId);
  const fpsChip = document.getElementById(ids.fpsChipId);
  const stateChip = document.getElementById(ids.stateChipId);
  const dockTitle = document.getElementById(ids.dockTitleId);
  const dockSub = document.getElementById(ids.dockSubId);

  const PACKS = [
    { key:"fresh",  name:"FRESH",  tag:"Clean energy. Zero noise.",      page:"fresh.html",   poster:"assets/fresh.jpg",   video:"assets/fresh.mp4" },
    { key:"gaming", name:"GAMING", tag:"Locked focus. Long sessions.",    page:"gaming.html",  poster:"assets/gaming.jpg",  video:"assets/gaming.mp4" },
    { key:"gym",    name:"GYM",    tag:"Explosive drive. Controlled burn.",page:"gym.html",     poster:"assets/gym.jpg",     video:"assets/gym.mp4" },
    { key:"work",   name:"WORK",   tag:"Calm clarity. Get it done.",      page:"work.html",    poster:"assets/work.jpg",    video:"assets/work.mp4" },
    { key:"lockin", name:"LOCK-IN",tag:"Tunnel vision. No distractions.", page:"lock-in.html", poster:"assets/lockin.jpg",  video:"assets/lockin.mp4" },
  ];

  // ---- quality
  const quality = { ultra:true, fxEvery:1, motes:46, flies:22, birds:10 };
  const prefersReduce = matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia && matchMedia("(pointer: coarse)").matches;
  if(prefersReduce || coarse){
    quality.ultra = false;
    quality.fxEvery = 3;
    quality.motes = 18;
    quality.flies = 10;
    quality.birds = 6;
  }

  // ---- camera feel
  const cam = { x:0, y:0, sx:0, sy:0, vx:0, vy:0 };
  function onMove(e){
    const x = (e.clientX ?? (e.touches?.[0]?.clientX ?? innerWidth/2));
    const y = (e.clientY ?? (e.touches?.[0]?.clientY ?? innerHeight/2));
    const nx = (x / innerWidth - 0.5) * 2;
    const ny = (y / innerHeight - 0.5) * 2;
    cam.vx += (nx - cam.x) * 0.06;
    cam.vy += (ny - cam.y) * 0.06;
    cam.x = nx; cam.y = ny;
  }
  addEventListener("mousemove", onMove, {passive:true});
  addEventListener("touchmove", onMove, {passive:true});

  // ---- resize
  let DPR = Math.min(devicePixelRatio || 1, 2);
  function resize(){
    DPR = Math.min(devicePixelRatio || 1, 2);
    fx.width = Math.floor(innerWidth * DPR);
    fx.height = Math.floor(innerHeight * DPR);
    fx.style.width = "100%";
    fx.style.height = "100%";
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  addEventListener("resize", resize, {passive:true});
  resize();

  // ---- totems layout (scene positions)
  const totems = [];
  function makeTotem(p, i){
    const el = document.createElement("div");
    el.className = "totem";
    el.dataset.key = p.key;

    el.innerHTML = `
      <div class="cap">
        <div>
          <div class="name">${p.name}</div>
          <div class="tag">${p.tag}</div>
        </div>
        <div class="orb"></div>
      </div>

      <div class="window">
        <img src="${p.poster}" alt="${p.name} preview"/>
        <video muted playsinline loop preload="metadata"></video>
      </div>

      <div class="foot">
        <div class="hint">Hover to preview</div>
        <div class="enter">Enter</div>
      </div>
    `;

    const img = el.querySelector("img");
    const vid = el.querySelector("video");

    // hover preview: poster -> video crossfade
    let hoverTimer = null;
    let hovered = false;

    async function prime(){
      if(vid.dataset.ready === "1") return true;
      vid.src = p.video;
      vid.dataset.ready = "1";
      try{
        await vid.play(); // muted so allowed
        vid.pause();
        vid.currentTime = 0;
        return true;
      }catch{
        return false;
      }
    }

    function showVideo(){
      vid.style.opacity = "1";
      img.style.opacity = "0";
      try{ vid.play().catch(()=>{}); }catch{}
    }
    function showPoster(){
      vid.style.opacity = "0";
      img.style.opacity = "1";
      try{ vid.pause(); }catch{}
    }

    el.addEventListener("mouseenter", ()=>{
      hovered = true;
      stateChip.textContent = `Hover: ${p.name}`;
      dockTitle.textContent = p.name;
      dockSub.textContent = p.tag;

      showPoster();
      hoverTimer = setTimeout(async ()=>{
        if(!hovered) return;
        const ok = await prime();
        if(ok && hovered) showVideo();
      }, 140);
    });

    el.addEventListener("mouseleave", ()=>{
      hovered = false;
      stateChip.textContent = "Idle";
      if(hoverTimer) clearTimeout(hoverTimer);
      showPoster();
    });

    el.addEventListener("click", ()=>{
      window.location.href = p.page;
    });

    // pack position in “scene” (x,y,depth)
    const pos = [
      {x:0.14,y:0.28,z:0.35},
      {x:0.68,y:0.24,z:0.25},
      {x:0.22,y:0.62,z:0.55},
      {x:0.64,y:0.64,z:0.45},
      {x:0.42,y:0.42,z:0.70},
    ][i] || {x:0.5,y:0.5,z:0.5};

    totems.push({ el, img, vid, p, ...pos, wob: Math.random()*10 });
    totemsHost.appendChild(el);
  }

  PACKS.forEach(makeTotem);

  // ---- FX entities
  let seed = 1337;
  const rnd = ()=> (seed = (seed*16807)%2147483647)/2147483647;
  const motes = Array.from({length:quality.motes}, ()=>({
    x:rnd()*innerWidth, y:rnd()*innerHeight, z:0.15+rnd()*0.85,
    r: 1.2 + rnd()*2.8, p:rnd()*1000
  }));
  const flies = Array.from({length:quality.flies}, ()=>({
    x:rnd()*innerWidth, y:rnd()*innerHeight, z:0.35+rnd()*0.65,
    vx:(rnd()-0.5)*30, vy:(rnd()-0.5)*22, p:rnd()*1000
  }));
  const birds = Array.from({length:quality.birds}, ()=>({
    x: (rnd()<0.5 ? -100 : innerWidth+100),
    y: innerHeight*(0.08+rnd()*0.25),
    dir: rnd()<0.5 ? 1 : -1,
    sp: 14 + rnd()*22,
    p: rnd()*1000
  }));

  // ---- audio (simple, safe)
  const audio = { ctx:null, on:false, master:null };
  function toggleSound(){
    audio.on = !audio.on;
    soundBtn.setAttribute("aria-pressed", String(audio.on));
    soundBtn.textContent = `Sound: ${audio.on ? "On" : "Off"}`;

    if(!audio.ctx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return;
      audio.ctx = new AC();
      audio.master = audio.ctx.createGain();
      audio.master.gain.value = 0;
      audio.master.connect(audio.ctx.destination);
    }
    audio.ctx.resume();

    // we reuse the bg video as a sound source (simple + works)
    const src = audio.ctx.createMediaElementSource(bg);
    const g = audio.ctx.createGain();
    g.gain.value = 0;
    src.connect(g).connect(audio.master);

    // fade
    const now = audio.ctx.currentTime;
    audio.master.gain.cancelScheduledValues(now);
    audio.master.gain.setValueAtTime(audio.master.gain.value, now);
    audio.master.gain.linearRampToValueAtTime(audio.on ? 0.9 : 0.0, now + 1.2);

    if(audio.on) bg.muted = false;
    else bg.muted = true;
  }

  soundBtn.addEventListener("click", toggleSound);

  qualityBtn.addEventListener("click", ()=>{
    quality.ultra = !quality.ultra;
    qualityBtn.setAttribute("aria-pressed", String(quality.ultra));
    qualityBtn.textContent = `Quality: ${quality.ultra ? "Ultra" : "Lite"}`;
    quality.fxEvery = quality.ultra ? 1 : 3;
    stateChip.textContent = quality.ultra ? "Ultra mode" : "Lite mode";
  });

  // ---- main loop
  let last = performance.now();
  let raf = 0;
  let frames = 0;
  let fpsLast = performance.now();

  function tick(t){
    const dt = Math.min(40, t-last);
    last = t;

    // smooth cam
    cam.sx += (cam.x - cam.sx) * 0.06;
    cam.sy += (cam.y - cam.sy) * 0.06;
    cam.vx *= 0.92; cam.vy *= 0.92;

    // background camera drift (feels like “standing there”)
    const bx = cam.sx * 12 + cam.vx * 220;
    const by = cam.sy * 8  + cam.vy * 180;
    bg.style.transform = `translate(${bx}px, ${by}px) scale(${quality.ultra ? 1.08 : 1.05})`;

    // totems parallax + depth + breathing
    const rect = totemsHost.getBoundingClientRect();
    for(const o of totems){
      const wob = Math.sin(t*0.0012 + o.wob) * 6;
      const px = (o.x - 0.5) * rect.width;
      const py = (o.y - 0.5) * rect.height;

      const depth = o.z;
      const dx = cam.sx * (18 * (1-depth));
      const dy = cam.sy * (12 * (1-depth));

      const lift = (depth * 26) + wob;
      const scale = 0.86 + depth * 0.28;

      const rx = (-cam.sy * (8*(1-depth)));
      const ry = ( cam.sx * (10*(1-depth)));

      o.el.style.left = `${(rect.width/2 + px) - 120}px`;
      o.el.style.top  = `${(rect.height/2 + py) - 170}px`;
      o.el.style.transform = `translate(${dx}px, ${dy}px) translateY(${-lift}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`;
      o.el.style.opacity = String(0.55 + depth*0.45);
      o.el.style.zIndex = String(Math.floor(depth*100));
    }

    // FX draw throttle
    frames++;
    if(frames % quality.fxEvery === 0){
      ctx.clearRect(0,0,innerWidth,innerHeight);

      // haze
      ctx.globalCompositeOperation = "screen";
      const g = ctx.createRadialGradient(innerWidth*0.32, innerHeight*0.28, 20, innerWidth*0.32, innerHeight*0.28, 520);
      g.addColorStop(0,"rgba(205,255,140,.025)");
      g.addColorStop(0.6,"rgba(255,220,150,.010)");
      g.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(innerWidth*0.32, innerHeight*0.28, 520, 0, Math.PI*2); ctx.fill();

      // motes
      for(const m of motes){
        m.p += dt*0.0006;
        const s = 0.55 + m.z*0.85;
        const x = (m.x + Math.sin(m.p)*12 + cam.sx*90*(1-m.z)) % (innerWidth+80) - 40;
        const y = (m.y + Math.cos(m.p)*10 + cam.sy*70*(1-m.z)) % (innerHeight+80) - 40;
        const a = (0.06 + m.z*0.18);
        ctx.globalAlpha = a;
        ctx.fillStyle = "rgba(255,255,255,.85)";
        ctx.beginPath(); ctx.arc(x,y,m.r*s,0,Math.PI*2); ctx.fill();
      }

      // flies
      for(const f of flies){
        f.p += dt*0.0012;
        if(rnd() < 0.02){ f.vx += (rnd()-0.5)*70; f.vy += (rnd()-0.5)*55; }
        f.vx *= 0.985; f.vy *= 0.985;
        f.x += f.vx*dt*0.02;
        f.y += f.vy*dt*0.02;
        if(f.x < -80) f.x = innerWidth+80;
        if(f.x > innerWidth+80) f.x = -80;
        if(f.y < -80) f.y = innerHeight+80;
        if(f.y > innerHeight+80) f.y = -80;

        const tw = (Math.sin(f.p*10) * 0.5 + 0.5);
        ctx.globalAlpha = (0.08 + tw*0.18) * f.z;
        ctx.fillStyle = "rgba(205,255,140,.85)";
        ctx.beginPath(); ctx.arc(f.x, f.y, (1.2+tw*1.8)*(0.6+f.z), 0, Math.PI*2); ctx.fill();
      }

      // birds (far)
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = "rgba(0,0,0,.55)";
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";
      for(const b of birds){
        b.x += b.dir*b.sp*dt*0.05;
        b.y += Math.sin((t*0.0015)+b.p)*0.12*dt;
        if(b.dir>0 && b.x>innerWidth+140){ b.x=-140; }
        if(b.dir<0 && b.x<-140){ b.x=innerWidth+140; }
        const wing = 18 + (b.sp*0.25);
        ctx.beginPath();
        ctx.moveTo(b.x-wing,b.y);
        ctx.quadraticCurveTo(b.x-wing*0.35, b.y - wing*0.42, b.x, b.y);
        ctx.quadraticCurveTo(b.x+wing*0.35, b.y - wing*0.42, b.x+wing, b.y);
        ctx.stroke();
      }
    }

    // fps
    const now = performance.now();
    if(now - fpsLast > 500){
      const fps = Math.round((frames * 1000) / (now - fpsLast));
      fpsChip.textContent = `FPS: ${fps}`;
      frames = 0;
      fpsLast = now;
    }

    raf = requestAnimationFrame(tick);
  }

  // start
  bg.play().catch(()=>{});
  requestAnimationFrame(tick);
}
