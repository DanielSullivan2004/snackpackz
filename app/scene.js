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

  const joy = document.getElementById("joy");
  const joyKnob = document.getElementById("joyKnob");
  const useBtn = document.getElementById("useBtn");

  const coarse = matchMedia && matchMedia("(pointer: coarse)").matches;
  const reduce = matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = coarse || innerWidth < 820;

  // Packs (keep your existing pages)
  const PACKS = [
    { key:"fresh",  name:"FRESH",  tag:"Clean energy. Zero noise.",        page:"fresh.html",   poster:"assets/fresh.jpg",   video:"assets/fresh.mp4" },
    { key:"gaming", name:"GAMING", tag:"Locked focus. Long sessions.",      page:"gaming.html",  poster:"assets/gaming.jpg",  video:"assets/gaming.mp4" },
    { key:"gym",    name:"GYM",    tag:"Explosive drive. Controlled burn.", page:"gym.html",     poster:"assets/gym.jpg",     video:"assets/gym.mp4" },
    { key:"work",   name:"WORK",   tag:"Calm clarity. Get it done.",        page:"work.html",    poster:"assets/work.jpg",    video:"assets/work.mp4" },
    { key:"lockin", name:"LOCK-IN",tag:"Tunnel vision. No distractions.",   page:"lock-in.html", poster:"assets/lockin.jpg",  video:"assets/lockin.mp4" },
  ];

  // World placement (metres). Player looks down -Z.
  const world = {
    spawnX: 0,
    spawnZ: 0,
    totems: [
      { x:-4.6, z:-10.8 },
      { x: 4.9, z:-10.3 },
      { x:-2.7, z:-16.4 },
      { x: 2.6, z:-15.9 },
      { x: 0.1, z:-13.2 },
    ]
  };

  // Quality / FX
  const quality = {
    ultra: !mobile && !reduce,
    fxEvery: (!mobile && !reduce) ? 1 : 3,
    motes: (!mobile && !reduce) ? 44 : 18
  };

  // Resize canvas
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

  // Camera / player
  const cam = {
    x: world.spawnX,
    z: world.spawnZ,
    yaw: 0,
    pitch: -0.06,
    vyaw: 0,
    vpitch: 0,
    speed: 3.2
  };

  // Pointer lock (desktop)
  let locked = false;
  function tryLock(){
    if(mobile) return;
    document.body.requestPointerLock?.();
  }
  document.addEventListener("pointerlockchange", ()=>{
    locked = (document.pointerLockElement === document.body);
    stateChip.textContent = locked ? "WASD • E" : "Click to lock";
  });

  addEventListener("click", (e)=>{
    // Don’t steal clicks from buttons
    const t = e.target;
    if(t && (t.closest && (t.closest("#topbar") || t.closest("#dock") || t.closest("#mobileUI")))) return;
    if(!locked && !mobile) tryLock();
  });

  addEventListener("mousemove", (e)=>{
    if(!locked) return;
    cam.vyaw += (e.movementX || 0) * 0.0022;
    cam.vpitch += (e.movementY || 0) * 0.0018;
  }, {passive:true});

  // Keyboard movement
  const keys = { w:false,a:false,s:false,d:false, shift:false };
  addEventListener("keydown", (e)=>{
    const k = e.key.toLowerCase();
    if(k==="w") keys.w=true;
    if(k==="a") keys.a=true;
    if(k==="s") keys.s=true;
    if(k==="d") keys.d=true;
    if(k==="shift") keys.shift=true;
    if(k==="e") tryUse();
  });
  addEventListener("keyup", (e)=>{
    const k = e.key.toLowerCase();
    if(k==="w") keys.w=false;
    if(k==="a") keys.a=false;
    if(k==="s") keys.s=false;
    if(k==="d") keys.d=false;
    if(k==="shift") keys.shift=false;
  });

  // Mobile joystick + swipe look
  const joyState = { active:false, id:null, cx:0, cy:0, dx:0, dy:0 };
  if(joy){
    joy.addEventListener("pointerdown", (e)=>{
      joyState.active = true;
      joyState.id = e.pointerId;
      joy.setPointerCapture(e.pointerId);
      const r = joy.getBoundingClientRect();
      joyState.cx = r.left + r.width/2;
      joyState.cy = r.top + r.height/2;
    });
    joy.addEventListener("pointermove", (e)=>{
      if(!joyState.active || e.pointerId !== joyState.id) return;
      const max = 46;
      let dx = e.clientX - joyState.cx;
      let dy = e.clientY - joyState.cy;
      const len = Math.hypot(dx,dy) || 1;
      if(len > max){ dx = dx/len*max; dy = dy/len*max; }
      joyState.dx = dx/max;
      joyState.dy = dy/max;
      joyKnob.style.transform = `translate(${dx}px, ${dy}px) translate(-50%,-50%)`;
    });
    const end = ()=>{
      joyState.active = false;
      joyState.dx = 0; joyState.dy = 0;
      joyKnob.style.transform = `translate(-50%,-50%)`;
    };
    joy.addEventListener("pointerup", end);
    joy.addEventListener("pointercancel", end);
  }

  let look = { on:false, x:0, y:0 };
  addEventListener("pointerdown", (e)=>{
    if(!mobile) return;
    if(e.target === joy || e.target === joyKnob || e.target === useBtn) return;
    look.on = true;
    look.x = e.clientX;
    look.y = e.clientY;
  }, {passive:true});
  addEventListener("pointermove", (e)=>{
    if(!mobile || !look.on) return;
    const dx = e.clientX - look.x;
    const dy = e.clientY - look.y;
    look.x = e.clientX;
    look.y = e.clientY;
    cam.vyaw += dx * 0.0030;
    cam.vpitch += dy * 0.0022;
  }, {passive:true});
  addEventListener("pointerup", ()=>{ look.on=false; }, {passive:true});
  useBtn?.addEventListener("click", ()=> tryUse());

  // Totems DOM + preview
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
        <img src="${p.poster}" alt="${p.name} preview">
        <video muted playsinline loop preload="metadata"></video>
      </div>

      <div class="foot">
        <div class="hint">Walk up + E</div>
        <div class="enter">Enter</div>
      </div>
    `;

    const img = el.querySelector("img");
    const vid = el.querySelector("video");

    let hovered = false;
    let timer = null;

    async function prime(){
      if(vid.dataset.ready === "1") return true;
      vid.src = p.video;
      vid.dataset.ready = "1";
      try{
        await vid.play();
        vid.pause();
        vid.currentTime = 0;
        return true;
      }catch{
        return false;
      }
    }

    function showPoster(){
      vid.style.opacity = "0";
      img.style.opacity = "1";
      try{ vid.pause(); }catch{}
    }
    function showVideo(){
      vid.style.opacity = "1";
      img.style.opacity = "0";
      try{ vid.play().catch(()=>{}); }catch{}
    }

    el.addEventListener("mouseenter", ()=>{
      hovered = true;
      showPoster();
      timer = setTimeout(async ()=>{
        if(!hovered) return;
        const ok = await prime();
        if(ok && hovered) showVideo();
      }, 140);
    });
    el.addEventListener("mouseleave", ()=>{
      hovered = false;
      if(timer) clearTimeout(timer);
      showPoster();
    });

    el.addEventListener("click", ()=>{
      // Only enter if close enough (game feel)
      if(getDistance(i) < 2.3){
        location.href = p.page;
      } else if(!locked && !mobile){
        tryLock();
      }
    });

    const wp = world.totems[i] || { x:0, z:-12 };
    totems.push({ el, img, vid, p, wx: wp.x, wz: wp.z, wob: Math.random()*10 });
    totemsHost.appendChild(el);
  }

  PACKS.forEach(makeTotem);

  function getDistance(i){
    const t = totems[i];
    const dx = t.wx - cam.x;
    const dz = t.wz - cam.z;
    return Math.hypot(dx, dz);
  }

  // Projection: camera looks down -Z. If relZ is negative, it’s in front.
  const proj = {
    f: 820,            // focal length in px
    cx: () => innerWidth * 0.5,
    cy: () => innerHeight * 0.52
  };

  function project(wx, wz){
    const dx = wx - cam.x;
    const dz = wz - cam.z;

    // rotate world around camera by -yaw
    const c = Math.cos(-cam.yaw);
    const s = Math.sin(-cam.yaw);
    const rx = dx * c - dz * s;
    const rz = dx * s + dz * c;

    return { x: rx, z: rz };
  }

  let focused = -1;

  function updateFocus(){
    focused = -1;
    let best = Infinity;

    for(let i=0;i<totems.length;i++){
      const rel = project(totems[i].wx, totems[i].wz);
      if(rel.z > -0.8) continue; // behind or too close behind camera
      const dist = Math.hypot(rel.x, rel.z);
      const centre = Math.abs(rel.x); // closeness to crosshair
      const score = centre + dist*0.10;
      if(score < best){
        best = score;
        focused = i;
      }
    }
  }

  function tryUse(){
    if(focused < 0) return;
    const dist = getDistance(focused);
    if(dist < 2.3){
      location.href = totems[focused].p.page;
    } else {
      stateChip.textContent = `Too far (${dist.toFixed(1)}m)`;
    }
  }

  // FX motes
  let seed = 1337;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const motes = [];
  function seedMotes(){
    motes.length = 0;
    const n = quality.motes;
    for(let i=0;i<n;i++){
      motes.push({
        x: rnd()*innerWidth,
        y: rnd()*innerHeight,
        z: 0.15 + rnd()*0.85,
        r: 1.0 + rnd()*2.6,
        p: rnd()*1000
      });
    }
  }
  seedMotes();

  // UI controls
  soundBtn.addEventListener("click", ()=>{
    const on = soundBtn.getAttribute("aria-pressed") !== "true";
    soundBtn.setAttribute("aria-pressed", String(on));
    soundBtn.textContent = `Sound: ${on ? "On" : "Off"}`;
    bg.muted = !on;
    bg.play().catch(()=>{});
  });

  qualityBtn.addEventListener("click", ()=>{
    quality.ultra = !quality.ultra;
    quality.fxEvery = quality.ultra ? 1 : 3;
    quality.motes = quality.ultra ? 44 : 18;
    qualityBtn.setAttribute("aria-pressed", String(quality.ultra));
    qualityBtn.textContent = `Quality: ${quality.ultra ? "Ultra" : "Lite"}`;
    seedMotes();
  });

  // Main loop
  let last = performance.now();
  let f
