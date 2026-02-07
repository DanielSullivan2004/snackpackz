// app/minimap.js
// Simple HUD minimap. No dependencies.
// Exposes: window.Minimap.init({ packs, world, cam, focusedGetter, bounds })

(function(){
  const Minimap = {};
  let el, canvas, ctx;
  let packs=[], world=null, cam=null, focusedGetter=null, bounds=null;

  function makeUI(){
    el = document.createElement("div");
    el.id = "minimapHUD";
    el.innerHTML = `
      <div class="mmTop">
        <b>MAP</b>
        <span class="mmHint">You are the dot. Packs are rings.</span>
      </div>
      <canvas class="mmCanvas" width="220" height="220"></canvas>
      <div class="mmBottom">
        <span class="mmChip" id="mmPos">x 0.0 • z 0.0</span>
        <span class="mmChip" id="mmNear">Nearest: —</span>
      </div>
    `;
    document.body.appendChild(el);
    canvas = el.querySelector("canvas");
    ctx = canvas.getContext("2d");
  }

  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

  function worldToMap(wx, wz){
    // bounds world space -> map space 0..1
    const nx = (wx - bounds.minX) / (bounds.maxX - bounds.minX);
    const nz = (wz - bounds.minZ) / (bounds.maxZ - bounds.minZ);
    return { x:nx, y:nz };
  }

  function draw(){
    if(!ctx || !cam || !world || !bounds) return;

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);

    // background glass
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    roundRect(ctx, 0, 0, W, H, 18, true, false);

    // soft grid
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    for(let i=1;i<5;i++){
      const x = (W*i/5)|0;
      const y = (H*i/5)|0;
      ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x, H-10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(W-10, y); ctx.stroke();
    }

    // border
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    roundRect(ctx, 0.5, 0.5, W-1, H-1, 18, false, true);

    // packs (rings)
    const focus = focusedGetter ? focusedGetter() : -1;
    const pad = 18;

    for(let i=0;i<world.totems.length;i++){
      const p = packs[i];
      const t = world.totems[i];
      const m = worldToMap(t.x, t.z);
      const x = pad + m.x*(W-2*pad);
      const y = pad + m.y*(H-2*pad);

      const isFocus = (i===focus);
      ctx.globalAlpha = isFocus ? 1 : 0.85;

      // outer ring
      ctx.beginPath();
      ctx.strokeStyle = isFocus ? "rgba(205,255,140,0.92)" : "rgba(255,255,255,0.55)";
      ctx.lineWidth = isFocus ? 3 : 2;
      ctx.arc(x,y, 8, 0, Math.PI*2);
      ctx.stroke();

      // inner dot
      ctx.beginPath();
      ctx.fillStyle = isFocus ? "rgba(205,255,140,0.92)" : "rgba(255,255,255,0.65)";
      ctx.arc(x,y, 2.6, 0, Math.PI*2);
      ctx.fill();
    }

    // player
    const mp = worldToMap(cam.x, cam.z);
    const px = pad + mp.x*(W-2*pad);
    const py = pad + mp.y*(H-2*pad);

    // player glow
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "rgba(205,255,140,0.35)";
    ctx.beginPath();
    ctx.arc(px,py, 14, 0, Math.PI*2);
    ctx.fill();

    // player dot
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.arc(px,py, 4.2, 0, Math.PI*2);
    ctx.fill();

    // facing direction wedge
    const ang = cam.yaw - Math.PI/2;
    const dx = Math.cos(ang), dy = Math.sin(ang);
    ctx.strokeStyle = "rgba(255,255,255,0.80)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px,py);
    ctx.lineTo(px + dx*18, py + dy*18);
    ctx.stroke();

    // labels
    const pos = el.querySelector("#mmPos");
    const near = el.querySelector("#mmNear");
    if(pos) pos.textContent = `x ${cam.x.toFixed(1)} • z ${cam.z.toFixed(1)}`;

    // nearest pack
    let best = {i:-1,d:1e9};
    for(let i=0;i<world.totems.length;i++){
      const t = world.totems[i];
      const d = Math.hypot(t.x-cam.x, t.z-cam.z);
      if(d<best.d){ best={i,d}; }
    }
    if(near){
      near.textContent = best.i>=0 ? `Nearest: ${packs[best.i].name} (${best.d.toFixed(1)}m)` : "Nearest: —";
    }

    requestAnimationFrame(draw);
  }

  function roundRect(ctx,x,y,w,h,r,fill,stroke){
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr, y);
    ctx.arcTo(x+w, y, x+w, y+h, rr);
    ctx.arcTo(x+w, y+h, x, y+h, rr);
    ctx.arcTo(x, y+h, x, y, rr);
    ctx.arcTo(x, y, x+w, y, rr);
    ctx.closePath();
    if(fill) ctx.fill();
    if(stroke) ctx.stroke();
  }

  Minimap.init = function(opts){
    packs = opts.packs;
    world = opts.world;
    cam = opts.cam;
    focusedGetter = opts.focusedGetter || null;
    bounds = opts.bounds;

    if(!packs || !world || !cam || !bounds) return;
    makeUI();
    requestAnimationFrame(draw);
  };

  window.Minimap = Minimap;
})();
