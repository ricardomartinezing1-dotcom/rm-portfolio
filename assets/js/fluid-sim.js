/*!
 * AI Section – Water-ripple refraction
 * Faithful vanilla-WebGL2 port of the GentleRain/Codegrid Three.js demo
 * (height-field wave sim → refracts a content texture).
 *
 * The content texture = forest-green background + the white heading.
 * Water ripples (mouse-driven) distort the heading like the reference.
 * Body paragraphs stay as crisp HTML on top (z-index 1).
 *
 * window.initAIFluid(canvas, section) / window.destroyAIFluid()
 */
(function (W) {
'use strict';

/* ─── tuning (matches the reference) ─────────────────────── */
var DELTA       = 1.4;    // wave timestep
var INJECT_R    = 0.022;  // mouse drop radius (uv)
var INJECT_AMP  = 2.0;    // pressure added per frame at cursor
var DISTORT     = 0.30;   // how much the wave bends the content (uv)
var SPEC_POW    = 60.0;   // specular sharpness
var SPEC_AMP    = 1.5;    // specular strength

/* ─── shaders (GLSL ES 1.00 for WebGL1/2 compatibility) ──── */
var VS = `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0,1); }
`;

// Height-field wave update. Channels: x=pressure, y=vel, zw=gradient.
var FS_SIM = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPrev;
  uniform vec2  uRes;
  uniform vec2  uMouse;     // pixels (0,0 = inactive)
  uniform int   uFrame;

  void main(){
    if (uFrame == 0){ gl_FragColor = vec4(0.0); return; }

    vec2 uv = vUv;
    vec4 data = texture2D(uPrev, uv);
    float pressure = data.x;
    float pVel     = data.y;

    vec2 texel = 1.0 / uRes;
    float pr = texture2D(uPrev, uv + vec2( texel.x, 0.0)).x;
    float pl = texture2D(uPrev, uv + vec2(-texel.x, 0.0)).x;
    float pu = texture2D(uPrev, uv + vec2(0.0,  texel.y)).x;
    float pd = texture2D(uPrev, uv + vec2(0.0, -texel.y)).x;

    if (uv.x <= texel.x)        pl = pr;
    if (uv.x >= 1.0 - texel.x)  pr = pl;
    if (uv.y <= texel.y)        pd = pu;
    if (uv.y >= 1.0 - texel.y)  pu = pd;

    pVel += ${DELTA.toFixed(1)} * (-2.0*pressure + pr + pl) / 4.0;
    pVel += ${DELTA.toFixed(1)} * (-2.0*pressure + pu + pd) / 4.0;
    pressure += ${DELTA.toFixed(1)} * pVel;
    pVel     -= 0.005 * ${DELTA.toFixed(1)} * pressure;
    pVel     *= 1.0 - 0.002 * ${DELTA.toFixed(1)};
    pressure *= 0.999;

    vec2 mouseUV = uMouse / uRes;
    if (uMouse.x > 0.0){
      float dist = distance(uv, mouseUV);
      if (dist <= ${INJECT_R.toFixed(3)}){
        pressure += ${INJECT_AMP.toFixed(1)} * (1.0 - dist / ${INJECT_R.toFixed(3)});
      }
    }

    gl_FragColor = vec4(pressure, pVel, (pr-pl)/2.0, (pu-pd)/2.0);
  }
`;

// Refract the content texture through the wave gradient + specular glint.
var FS_RENDER = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uWave;
  uniform sampler2D uContent;
  void main(){
    vec4 data = texture2D(uWave, vUv);
    vec2 distortion = ${DISTORT.toFixed(2)} * data.zw;
    vec4 color = texture2D(uContent, vUv + distortion);

    vec3 normal = normalize(vec3(-data.z * 2.0, 0.5, -data.w * 2.0));
    vec3 light  = normalize(vec3(-3.0, 10.0, 3.0));
    float spec  = pow(max(0.0, dot(normal, light)), ${SPEC_POW.toFixed(1)}) * ${SPEC_AMP.toFixed(1)};

    gl_FragColor = color + vec4(spec);
  }
`;

/* ─── gl helpers ─────────────────────────────────────────── */
function compile(gl, type, src){
  var s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
    console.error('[ripple] shader error:', gl.getShaderInfoLog(s)); return null;
  }
  return s;
}
function prog(gl, vs, fs){
  var v=compile(gl,gl.VERTEX_SHADER,vs), f=compile(gl,gl.FRAGMENT_SHADER,fs);
  if(!v||!f) return null;
  var p=gl.createProgram();
  gl.bindAttribLocation(p,0,'aPos');
  gl.attachShader(p,v); gl.attachShader(p,f); gl.linkProgram(p);
  gl.deleteShader(v); gl.deleteShader(f);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)){
    console.error('[ripple] link error:', gl.getProgramInfoLog(p)); return null;
  }
  var u={}, n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);
  for(var i=0;i<n;i++){ var nm=gl.getActiveUniform(p,i).name; u[nm]=gl.getUniformLocation(p,nm); }
  return {p:p,u:u};
}
function rt(gl, w, h, type, filter){
  var tex=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // RGBA float storage. WebGL2 wants sized internalformat RGBA32F.
  var ifmt = (gl instanceof WebGL2RenderingContext) ? gl.RGBA32F : gl.RGBA;
  gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, gl.RGBA, type, null);
  var fb=gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return {tex:tex, fb:fb, w:w, h:h};
}

/* ─── Ripple ─────────────────────────────────────────────── */
function Ripple(canvas, section){
  var gl, gl2;
  var pSim, pRender, quad;
  var rtA, rtB, contentTex;
  var FTYPE, FILT;
  var frame = 0;
  var active=false, raf=null;
  var io, ro, onFit=null, fitRaf=0;
  var card  = canvas.closest('.ai-card');
  var title = card ? card.querySelector('.ai-title') : null;
  var titleHidden=false;

  // mouse in device pixels (0,0 = inactive), plus auto-wander
  var mouse = { x:0, y:0 };
  var userActiveUntil = 0;
  var wander = { t: Math.random()*1000 };

  function initGL(){
    var opt={ alpha:true, antialias:false, premultipliedAlpha:false, depth:false, preserveDrawingBuffer:false };
    gl = canvas.getContext('webgl2', opt); gl2 = !!gl;
    if(!gl) gl = canvas.getContext('webgl', opt) || canvas.getContext('experimental-webgl', opt);
    if(!gl){ console.error('[ripple] no WebGL'); return false; }
    console.log('[ripple] context:', gl2 ? 'WebGL2':'WebGL1');

    // Full float buffers (the reference uses FloatType — half-float was the
    // reason ripples weren't propagating before).
    if(gl2){
      if(!gl.getExtension('EXT_color_buffer_float')){ console.warn('[ripple] no float render'); }
      FTYPE = gl.FLOAT;
      FILT  = gl.getExtension('OES_texture_float_linear') ? gl.LINEAR : gl.NEAREST;
    } else {
      var f = gl.getExtension('OES_texture_float');
      gl.getExtension('OES_texture_float_linear');
      FTYPE = f ? gl.FLOAT : gl.UNSIGNED_BYTE;
      FILT  = gl.LINEAR;
    }

    gl.clearColor(0,0,0,0);
    gl.disable(gl.BLEND);
    quad=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);

    pSim    = prog(gl, VS, FS_SIM);
    pRender = prog(gl, VS, FS_RENDER);
    if(!pSim||!pRender){ console.error('[ripple] program failed'); return false; }
    console.log('[ripple] shaders OK');
    return true;
  }

  function blit(target){
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(0);
    if(target){ gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb); gl.viewport(0,0,target.w,target.h); }
    else      { gl.bindFramebuffer(gl.FRAMEBUFFER, null);     gl.viewport(0,0,canvas.width,canvas.height); }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function allocRTs(){
    rtA = rt(gl, canvas.width, canvas.height, FTYPE, FILT);
    rtB = rt(gl, canvas.width, canvas.height, FTYPE, FILT);
    frame = 0;
    console.log('[ripple] RTs:', canvas.width+'x'+canvas.height);
  }

  /* ── content texture: forest bg + white heading ── */
  function buildContent(){
    var w = canvas.width, h = canvas.height;
    var oc = document.createElement('canvas');
    oc.width = w; oc.height = h;
    var ctx = oc.getContext('2d');

    // Light neutral background (predominantly white/grey, subtle green/lime tints)
    var g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,   '#F5F5F0');
    g.addColorStop(0.55,'#ECEEE8');
    g.addColorStop(1,   '#E4E8E0');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
    // soft forest tint upper-left
    var fg = ctx.createRadialGradient(w*0.18,h*0.28,0, w*0.18,h*0.28, w*0.5);
    fg.addColorStop(0,'rgba(45,106,79,0.10)');
    fg.addColorStop(1,'rgba(45,106,79,0)');
    ctx.fillStyle = fg;
    ctx.fillRect(0,0,w,h);
    // lime glow lower-centre
    var rg = ctx.createRadialGradient(w*0.6,h*0.82,0, w*0.6,h*0.82, w*0.45);
    rg.addColorStop(0,'rgba(184,243,0,0.12)');
    rg.addColorStop(1,'rgba(184,243,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0,0,w,h);

    // Heading text — two lines, mirroring the (now-hidden) HTML title.
    //   line 1: "Where AI fits in" — Inter, "AI" filled with a gradient
    //   line 2: "my process"       — Fraunces italic, forest green
    if(card && title){
      var cardR = card.getBoundingClientRect();
      var rect  = canvas.getBoundingClientRect();
      var dpr   = w / rect.width;
      var l1 = title.querySelector('.ai-line-1');
      var l2 = title.querySelector('.ai-line-2');

      ctx.textBaseline = 'middle';

      // ── line 1 ──
      if(l1){
        var cs1   = getComputedStyle(l1);
        var size1 = parseFloat(cs1.fontSize) * dpr;
        var ls1   = (parseFloat(cs1.letterSpacing) || 0) * dpr;
        var r1    = l1.getBoundingClientRect();
        var x1    = (r1.left - cardR.left) * dpr;
        var y1    = (r1.top - cardR.top + r1.height/2) * dpr;

        ctx.font = '700 ' + size1 + 'px ' + cs1.fontFamily;
        if('letterSpacing' in ctx) ctx.letterSpacing = ls1 + 'px';

        var pre = 'Where ', mid = 'AI', post = ' fits in';
        // "Where "
        ctx.fillStyle = '#1A1A1A';
        ctx.fillText(pre, x1, y1);
        var preW = ctx.measureText(pre).width + ls1;
        // "AI" with the brand gradient (≈228deg: top-right → bottom-left)
        var aiX = x1 + preW;
        var aiW = ctx.measureText(mid).width;
        var grad = ctx.createLinearGradient(aiX + aiW, y1 - size1*0.5, aiX, y1 + size1*0.5);
        grad.addColorStop(0.00, '#364A2C');
        grad.addColorStop(0.14, '#02734A');
        grad.addColorStop(1.00, '#B8F300');
        ctx.fillStyle = grad;
        ctx.fillText(mid, aiX, y1);
        var midW = ctx.measureText(mid).width + ls1;
        // " fits in"
        ctx.fillStyle = '#1A1A1A';
        ctx.fillText(post, aiX + midW, y1);
      }

      // ── line 2 ──
      if(l2){
        var cs2   = getComputedStyle(l2);
        var size2 = parseFloat(cs2.fontSize) * dpr;
        var r2    = l2.getBoundingClientRect();
        var x2    = (r2.left - cardR.left) * dpr;
        var y2    = (r2.top - cardR.top + r2.height/2) * dpr;
        if('letterSpacing' in ctx) ctx.letterSpacing = '0px';
        ctx.font = (cs2.fontStyle || 'italic') + ' ' + (cs2.fontWeight || '300') + ' ' + size2 + 'px ' + cs2.fontFamily;
        ctx.fillStyle = '#2D6A4F';
        ctx.fillText(l2.textContent, x2, y2);
      }

      // hide the HTML heading glyphs (canvas shows the heading now).
      // line 2 and .ai-ai have their own explicit colours, so transparent must
      // be set on them directly — inheriting from the title isn't enough.
      if(!titleHidden){
        title.style.color = 'transparent';
        var aiEl = title.querySelector('.ai-ai');
        if(aiEl){ aiEl.style.background = 'none'; aiEl.style.webkitTextFillColor = 'transparent'; }
        if(l2) l2.style.color = 'transparent';
        titleHidden = true;
      }
    }

    if(!contentTex) contentTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, contentTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, oc);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    console.log('[ripple] content built');
  }

  /* ── per-frame ── */
  function frameStep(now){
    // auto-wander when the user isn't actively moving
    if(now > userActiveUntil){
      wander.t += 0.012;
      var wx = 0.5 + 0.32*Math.cos(wander.t) + 0.12*Math.cos(wander.t*2.3);
      var wy = 0.5 + 0.26*Math.sin(wander.t*0.8) + 0.10*Math.sin(wander.t*1.7);
      mouse.x = wx * canvas.width;
      mouse.y = wy * canvas.height;
    }

    // 1) wave update  A → B
    gl.useProgram(pSim.p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, rtA.tex);
    gl.uniform1i(pSim.u.uPrev, 0);
    gl.uniform2f(pSim.u.uRes, canvas.width, canvas.height);
    gl.uniform2f(pSim.u.uMouse, mouse.x, mouse.y);
    gl.uniform1i(pSim.u.uFrame, frame);
    blit(rtB);

    // 2) render  B (wave) + content → screen
    gl.useProgram(pRender.p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, rtB.tex);
    gl.uniform1i(pRender.u.uWave, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, contentTex);
    gl.uniform1i(pRender.u.uContent, 1);
    blit(null);

    // 3) swap
    var t=rtA; rtA=rtB; rtB=t;
    frame++;
  }

  function loop(){
    if(!active) return;
    frameStep(performance.now());
    raf = requestAnimationFrame(loop);
  }

  /* ── resize ── */
  function resize(){
    var dpr = Math.min(window.devicePixelRatio||1, 2);
    var r = canvas.getBoundingClientRect();
    var w = Math.round(r.width*dpr), h = Math.round(r.height*dpr);
    if(w<2||h<2) return;
    if(canvas.width===w && canvas.height===h) return;
    canvas.width=w; canvas.height=h;
    console.log('[ripple] canvas:', w+'x'+h);
    if(gl){ allocRTs(); buildContent(); }
  }

  /* ── pointer ── */
  function onMove(e){
    var r = canvas.getBoundingClientRect();
    var dpr = canvas.width / r.width;
    mouse.x = (e.clientX - r.left) * dpr;
    mouse.y = (r.height - (e.clientY - r.top)) * dpr;   // flip Y
    userActiveUntil = performance.now() + 1500;          // pause wander
  }
  function onLeave(){ /* keep last pos so ripples settle; wander resumes */ userActiveUntil = 0; }
  function onTouch(e){ if(e.touches[0]) onMove(e.touches[0]); }

  /* ── public ── */
  this.start = function(){
    if(!initGL()){ console.warn('[ripple] init failed – CSS forest bg stays'); return; }

    section.addEventListener('mousemove', onMove,  {passive:true});
    section.addEventListener('mouseleave',onLeave, {passive:true});
    section.addEventListener('touchmove', onTouch, {passive:true});

    ro = new ResizeObserver(resize); ro.observe(canvas);
    io = new IntersectionObserver(function(en){
      var vis = en[0].isIntersecting;
      if(!vis){ active=false; if(raf){ cancelAnimationFrame(raf); raf=null; } }
      else if(!raf){ active=true; raf=requestAnimationFrame(loop); }
    }, {threshold:0});
    io.observe(section);

    // Rebuild the heading texture when the title is re-fitted (resize / fonts)
    onFit = function(){
      if(!gl || fitRaf) return;
      fitRaf = requestAnimationFrame(function(){ fitRaf = 0; if(gl) buildContent(); });
    };
    window.addEventListener('ai:titlefit', onFit);

    resize();
    if(!rtA) allocRTs();
    if(!contentTex) buildContent();

    active=true;
    raf=requestAnimationFrame(loop);

    // rebuild text once webfonts are ready (positions/metrics settle)
    if(document.fonts && document.fonts.ready){
      document.fonts.ready.then(function(){ if(gl) buildContent(); });
    }
  };

  this.destroy = function(){
    active=false;
    if(raf){ cancelAnimationFrame(raf); raf=null; }
    if(io) io.disconnect();
    if(ro) ro.disconnect();
    section.removeEventListener('mousemove', onMove);
    section.removeEventListener('mouseleave',onLeave);
    section.removeEventListener('touchmove', onTouch);
    if(onFit){ window.removeEventListener('ai:titlefit', onFit); onFit=null; }
    if(fitRaf){ cancelAnimationFrame(fitRaf); fitRaf=0; }
    if(title && titleHidden){
      title.style.color='';
      var aiEl=title.querySelector('.ai-ai');
      if(aiEl){ aiEl.style.background=''; aiEl.style.webkitTextFillColor=''; }
      var l2El=title.querySelector('.ai-line-2');
      if(l2El) l2El.style.color='';
      titleHidden=false;
    }
    if(gl){ var e=gl.getExtension('WEBGL_lose_context'); if(e) e.loseContext(); gl=null; }
  };
}

/* ─── window API ─────────────────────────────────────────── */
var _inst=null;
W.initAIFluid = function(canvas, section){
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  if(_inst){ _inst.destroy(); _inst=null; }
  _inst = new Ripple(canvas, section || canvas.parentElement);
  _inst.start();
  return _inst;
};
W.destroyAIFluid = function(){ if(_inst){ _inst.destroy(); _inst=null; } };

}(window));
