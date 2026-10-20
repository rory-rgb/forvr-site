const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
gsap.registerPlugin(ScrollTrigger);

/* ScrollTrigger measures before images and webfonts settle, which left
   anything already on screen stuck at opacity 0 until the first scroll. */
addEventListener('load',()=>ScrollTrigger.refresh());
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>ScrollTrigger.refresh());
addEventListener('resize',()=>ScrollTrigger.refresh());

/* videos play when visible */
const vio=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){e.target.play().catch(()=>{});}else{e.target.pause();}
}),{threshold:.15});
document.querySelectorAll('video:not([data-noauto])').forEach(v=>vio.observe(v));
addEventListener('pointerdown',()=>document.querySelectorAll('video:not([data-noauto])').forEach(v=>{
  if(v.paused&&v.getBoundingClientRect().top<innerHeight)v.play().catch(()=>{});
}),{once:true});

/* The 72-hour ad drop toy. The F mark is fixed in the middle; the loose format
   blocks float, collide and squash, and a hit dents the mark, which springs
   back to the exact lockup. Geometry is layout() from the brand scene file, so
   the resting mark is the real lockup, not an approximation. */
(function(){
  const stage=document.getElementById('tdropStage'); if(!stage) return;
  const sec=stage.closest('.tdrop'), lane=document.getElementById('tdropLane');
  const coarse=matchMedia('(pointer: coarse)').matches;

  const GW=176,g=8,sw=56,topH=GW*9/16,stemH=sw*16/9;
  const sr=24,sx0=sw+g+56+g/2+sr,sy0=topH+g+stemH-sr,BW=GW,BH=topH+g+stemH;
  const MARK=[{k:'16x9',x:0,y:0,w:GW,h:topH},{k:'9x16',x:0,y:topH+g,w:sw,h:stemH},
              {k:'1x1',x:sw+g,y:topH+g,w:56,h:56},{k:'dot',x:sx0-sr,y:sy0-sr,w:sr*2,h:sr*2}];
  const KINDS=['16x9','9x16','1x1','dot'], AR={'16x9':9/16,'9x16':16/9,'1x1':1,'dot':1};
  const SZ={'16x9':.085,'9x16':.034,'1x1':.047,'dot':.030};

  let W=0,H=0,TB=null,running=false;
  const bodies=[], rnd=(a,b)=>a+Math.random()*(b-a);

  function make(kind,isMark){
    const el=document.createElement('div');
    el.className='b'+(isMark?' mark':'');
    el.innerHTML='<img src="assets/mark/house_'+kind+'.png" alt="" loading="lazy">';
    stage.appendChild(el);
    return {kind,isMark,el,x:0,y:0,vx:0,vy:0,w:0,h:0,sx:1,sy:1,vsx:0,vsy:0,rot:0,vrot:0,
            hx:0,hy:0,round:kind==='dot',ph:Math.random()*6.283,ph2:Math.random()*6.283};
  }
  MARK.forEach(m=>{const b=make(m.k,true); b.def=m; bodies.push(b);});
  for(let i=0;i<14;i++) bodies.push(make(KINDS[i%4],false));

  function layout(){
    const r=stage.getBoundingClientRect(); W=r.width; H=r.height;
    const z=lane?lane.getBoundingClientRect():null;
    const L=(z&&z.width>40)?{cx:z.left-r.left+z.width/2,cw:z.width}:{cx:W*0.5,cw:W*0.3};
    const scale=Math.min(L.cw*0.92,H*0.52*(BW/BH))/BW;
    const mx=L.cx-BW*scale/2, my=H/2-BH*scale/2;
    for(const b of bodies){
      if(b.isMark){
        b.w=b.def.w*scale; b.h=b.def.h*scale;
        b.hx=mx+b.def.x*scale; b.hy=my+b.def.y*scale;
        /* always snap, never once: the first layout() can run before the grid
           has settled, and the spring only corrects that if the loop is
           already running, which it is not until the section scrolls in */
        b.x=b.hx; b.y=b.hy; b.started=1;
      }else if(!b.started){
        b.w=W*SZ[b.kind]; b.h=b.w*AR[b.kind];
        b.x=rnd(0,Math.max(1,W-b.w)); b.y=rnd(0,Math.max(1,H-b.h));
        b.vx=rnd(-.5,.5); b.vy=rnd(-.5,.5); b.rot=b.round?0:rnd(-9,9); b.started=1;
      }
      b.el.style.width=b.w+'px';
      /* paint the position now. Only frame() wrote transforms before, so until
         the loop's first frame every piece sat at x=0, in the corner. */
      b.el.style.transform='translate3d('+b.x+'px,'+b.y+'px,0) rotate('+b.rot+'deg)';
    }
    const t=sec.querySelector('.tdrop-in > div:first-child');
    if(t){const w=t.getBoundingClientRect(); TB={x:w.left-r.left,y:w.top-r.top,w:w.width,h:w.height};}
  }

  let held=null,ox=0,oy=0,lx=0,ly=0;
  function at(cx,cy){
    const r=stage.getBoundingClientRect(), px=cx-r.left, py=cy-r.top;
    for(let i=bodies.length-1;i>=0;i--){const b=bodies[i];
      if(b.isMark) continue;
      if(px>=b.x&&px<=b.x+b.w&&py>=b.y&&py<=b.y+b.h) return b;}
    return null;
  }
  sec.addEventListener('pointerdown',e=>{
    if(reduced||coarse) return;
    const b=at(e.clientX,e.clientY); if(!b) return;
    held=b;
    /* offsets before capture: capture can throw, and a later assignment would
       leave them stale, which makes the block jump on the next move */
    ox=e.clientX-b.x; oy=e.clientY-b.y; lx=e.clientX; ly=e.clientY;
    try{sec.setPointerCapture(e.pointerId);}catch(err){}
    e.preventDefault();
  });
  sec.addEventListener('pointermove',e=>{
    if(!held) return;
    held.x=e.clientX-ox; held.y=e.clientY-oy;
    held.vx=(e.clientX-lx)*0.5; held.vy=(e.clientY-ly)*0.5;
    lx=e.clientX; ly=e.clientY;
  });
  const drop=()=>{held=null;};
  sec.addEventListener('pointerup',drop); sec.addEventListener('pointercancel',drop);

  function squash(b,nx,ny,amt){
    const a=Math.min(amt,0.40);
    b.vsx+=(-Math.abs(nx)+Math.abs(ny)*0.75)*a;
    b.vsy+=(-Math.abs(ny)+Math.abs(nx)*0.75)*a;
  }
  function collide(a,b){
    const acx=a.x+a.w/2,acy=a.y+a.h/2,bcx=b.x+b.w/2,bcy=b.y+b.h/2;
    let nx,ny,depth;
    if(a.round&&b.round){
      const dx=bcx-acx,dy=bcy-acy,d=Math.hypot(dx,dy)||1;
      depth=a.w/2+b.w/2-d; if(depth<=0) return; nx=dx/d; ny=dy/d;
    }else{
      const px=(a.w+b.w)/2-Math.abs(acx-bcx), py=(a.h+b.h)/2-Math.abs(acy-bcy);
      if(px<=0||py<=0) return;
      if(px<py){nx=acx<bcx?1:-1;ny=0;depth=px;} else {nx=0;ny=acy<bcy?1:-1;depth=py;}
    }
    const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny, hit=Math.min(Math.abs(rel),22);
    const af=a.isMark, bf=b.isMark;
    if(!af&&!bf){
      a.x-=nx*depth/2; a.y-=ny*depth/2; b.x+=nx*depth/2; b.y+=ny*depth/2;
      const p=rel*0.5;
      if(a!==held){a.vx+=nx*p;a.vy+=ny*p;}
      if(b!==held){b.vx-=nx*p;b.vy-=ny*p;}
    }else if(af){
      b.x+=nx*depth; if(b!==held){b.vx-=nx*rel*0.9;b.vy-=ny*rel*0.9;}
      b.y+=ny*depth; a.x-=nx*depth*0.22; a.y-=ny*depth*0.22;
    }else{
      a.x-=nx*depth; if(a!==held){a.vx+=nx*rel*0.9;a.vy+=ny*rel*0.9;}
      a.y-=ny*depth; b.x+=nx*depth*0.22; b.y+=ny*depth*0.22;
    }
    const amt=0.012*hit+depth*0.0016;
    squash(a,nx,ny,amt); squash(b,nx,ny,amt);
  }

  function frame(t){
    if(!running) return;
    for(const b of bodies){
      if(b.isMark||b===held) continue;
      b.vx+=Math.cos(t*0.00026+b.ph)*0.013;
      b.vy+=Math.sin(t*0.00031+b.ph2)*0.013;
      b.x+=b.vx; b.y+=b.vy; b.vx*=0.985; b.vy*=0.985;
      b.rot+=b.vrot; b.vrot*=0.96;
      const sp=Math.hypot(b.vx,b.vy); if(sp>7){b.vx*=7/sp;b.vy*=7/sp;}
      if(b.x<0){b.x=0;b.vx=Math.abs(b.vx)*.72;squash(b,1,0,.012*Math.abs(b.vx)+.05);}
      if(b.y<0){b.y=0;b.vy=Math.abs(b.vy)*.72;squash(b,0,1,.012*Math.abs(b.vy)+.05);}
      if(b.x+b.w>W){b.x=W-b.w;b.vx=-Math.abs(b.vx)*.72;squash(b,1,0,.012*Math.abs(b.vx)+.05);}
      if(b.y+b.h>H){b.y=H-b.h;b.vy=-Math.abs(b.vy)*.72;squash(b,0,1,.012*Math.abs(b.vy)+.05);}
    }
    for(let i=0;i<bodies.length;i++)
      for(let j=i+1;j<bodies.length;j++){
        if(bodies[i].isMark&&bodies[j].isMark) continue;
        collide(bodies[i],bodies[j]);
      }
    /* a soft shoulder round the mark, so blocks drift off it instead of
       settling on top and burying the F */
    for(const b of bodies){
      if(b.isMark||b===held) continue;
      for(const m of bodies){
        if(!m.isMark) continue;
        const dx=(b.x+b.w/2)-(m.x+m.w/2), dy=(b.y+b.h/2)-(m.y+m.h/2);
        const rx=(b.w+m.w)/2+14, ry=(b.h+m.h)/2+14;
        if(Math.abs(dx)<rx&&Math.abs(dy)<ry){
          b.vx+=Math.sign(dx||1)*(1-Math.abs(dx)/rx)*0.14;
          b.vy+=Math.sign(dy||1)*(1-Math.abs(dy)/ry)*0.14;
        }
      }
    }
    for(const b of bodies){
      if(b.isMark){b.x+=(b.hx-b.x)*0.10; b.y+=(b.hy-b.y)*0.10;}
      b.vsx+=(1-b.sx)*0.16; b.vsx*=0.80; b.sx+=b.vsx;
      b.vsy+=(1-b.sy)*0.16; b.vsy*=0.80; b.sy+=b.vsy;
      b.sx=Math.max(.55,Math.min(1.45,b.sx)); b.sy=Math.max(.55,Math.min(1.45,b.sy));
      let o=b.isMark?1:0.40;
      if(!b.isMark&&TB&&b.x+b.w>TB.x&&b.x<TB.x+TB.w&&b.y+b.h>TB.y&&b.y<TB.y+TB.h) o=0.18;
      b.el.style.opacity=o;
      b.el.style.transform='translate3d('+b.x+'px,'+b.y+'px,0) rotate('+b.rot+'deg) scale('+b.sx+','+b.sy+')';
    }
    requestAnimationFrame(frame);
  }

  function start(){ if(running) return; running=true; requestAnimationFrame(frame); }
  function stop(){ running=false; }

  layout();
  if(reduced||coarse){
    for(const b of bodies) b.el.style.transform='translate3d('+b.x+'px,'+b.y+'px,0)';
    const n=sec.querySelector('.nudge'); if(n) n.style.display='none';
    return;
  }
  /* only run the loop while the section is actually on screen */
  new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting?start():stop()),
    {threshold:.01}).observe(sec);
  addEventListener('resize',layout);
  addEventListener('load',layout);
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(layout);
})();







/* mobile menu */
(function(){
  const btn=document.getElementById('burger'), menu=document.getElementById('menu');
  if(!btn||!menu) return;
  let open=false;
  function set(v){
    open=v;
    btn.setAttribute('aria-expanded',v);
    btn.setAttribute('aria-label',v?'Close menu':'Open menu');
    document.body.classList.toggle('menu-open',v);
    if(v){menu.hidden=false; requestAnimationFrame(()=>menu.classList.add('open'));}
    else{menu.classList.remove('open'); setTimeout(()=>{if(!open)menu.hidden=true},320);}
  }
  btn.addEventListener('click',()=>set(!open));
  menu.addEventListener('click',e=>{if(e.target.tagName==='A')set(false)});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&open)set(false)});
})();

/* nav */
addEventListener('scroll',()=>document.getElementById('nav').classList.toggle('scrolled',scrollY>40),{passive:true});



if(!reduced){
  gsap.timeline()
    .to('.hero h1 .row>span',{y:0,duration:1.05,ease:'power4.out',stagger:.12,delay:.15})
    .to('.hero .sub',{opacity:1,y:0,duration:.7,ease:'power3.out'},'-=.5')
    .to('.hero .cta-row',{opacity:1,y:0,duration:.7,ease:'power3.out'},'-=.5')
    .to('.hero-media',{opacity:1,y:0,duration:.9,ease:'power3.out'},'-=.6');

  const el=document.getElementById('word');
  const words=el?JSON.parse(el.dataset.words):[]; let wi=0;
  function typeNext(){
    const next=words[(++wi)%words.length], cur=el.textContent; let i=cur.length;
    const del=setInterval(()=>{ el.textContent=cur.slice(0,--i);
      if(i<=0){clearInterval(del); let j=0;
        const add=setInterval(()=>{ el.textContent=next.slice(0,++j);
          if(j>=next.length){clearInterval(add); setTimeout(typeNext,2100);} },55);}
    },30);
  }
  /* reserve the headline height for the longest word so the hero never jumps (layout shift) */
  function reserve(){
    const h1=el&&el.closest('h1'); if(!h1) return;
    const keep=el.textContent; h1.style.minHeight=''; let max=0;
    for(const w of words){ el.textContent=w; max=Math.max(max,h1.offsetHeight); }
    el.textContent=keep; h1.style.minHeight=max+'px';
  }
  if(el&&words.length>1){
    const h1=el.closest('h1');
    if(h1){ h1.style.display='flex'; h1.style.flexDirection='column'; h1.style.justifyContent='flex-end'; }
    reserve(); if(document.fonts&&document.fonts.ready) document.fonts.ready.then(reserve);
    let rt; addEventListener('resize',()=>{clearTimeout(rt); rt=setTimeout(reserve,150);});
  }
  if(el&&words.length>1) setTimeout(typeNext,2600);

  /* tools belt: seamless loop into the pacman, slows on hover */
  const t=document.getElementById('tools');
  if(t){
    const one=t.innerHTML;
    t.innerHTML=one+one+one+one;
    const tw=gsap.to(t,{xPercent:-25,duration:26,ease:'none',repeat:-1});
    t.addEventListener('mouseenter',()=>gsap.to(tw,{timeScale:.12,duration:.4}));
    t.addEventListener('mouseleave',()=>gsap.to(tw,{timeScale:1,duration:.4}));
  }

  gsap.utils.toArray('.tile').forEach((x,i)=>gsap.fromTo(x,{opacity:0,y:44},
    {opacity:1,y:0,duration:.9,ease:'power3.out',scrollTrigger:{trigger:x,start:'top bottom-=40'},delay:(i%2)*.08}));
  gsap.utils.toArray('.reveal,.check,.scanwrap,.proj,.lane,.stepc,.fact,.split .imgwrap,.sitecard,.gal figure').forEach(x=>gsap.to(x,
    {opacity:1,y:0,x:0,duration:.85,ease:'power3.out',scrollTrigger:{trigger:x,start:'top bottom-=40'}}));

  /* stat rows: count + strike */
  gsap.utils.toArray('.srow').forEach(row=>{
    const z=row.querySelector('[data-n]');if(z)z.textContent=0;
    ScrollTrigger.create({trigger:row,start:'top bottom-=60',once:true,onEnter(){
      row.classList.add('struck');
      const n=row.querySelector('[data-n]');
      if(n)gsap.fromTo(n,{textContent:0},{textContent:+n.dataset.n,duration:1.2,ease:'power2.out',snap:{textContent:1}});
    }});
  });



  gsap.utils.toArray('.tile video,.tile img,.proj .media video,.proj .media img').forEach(v=>gsap.fromTo(v,{yPercent:-4},
    {yPercent:4,ease:'none',scrollTrigger:{trigger:v,scrub:true,start:'top bottom',end:'bottom top'}}));

  /* trial: calm cards + roadmap draw + lit nodes */
  gsap.utils.toArray('.fcard').forEach((c,i)=>gsap.to(c,{opacity:1,y:0,duration:.7,ease:'power3.out',
    scrollTrigger:{trigger:'.flow',start:'top bottom-=60'},delay:i*.12}));


  /* curtain: the page slides over the pinned hero */
  gsap.to('.hero-inner',{yPercent:-16,opacity:.25,ease:'none',
    scrollTrigger:{trigger:'main.over',start:'top bottom',end:'top top',scrub:true}});
  gsap.fromTo('#heroBg',{scale:1.04},{scale:1.12,yPercent:-4,ease:'none',
    scrollTrigger:{trigger:'main.over',start:'top bottom',end:'top top',scrub:true}});
  gsap.to('#heroBg',{scale:'+=0.025',duration:16,ease:'sine.inOut',yoyo:true,repeat:-1});
  gsap.to('.mist.m1',{xPercent:9,duration:20,ease:'sine.inOut',yoyo:true,repeat:-1});
  gsap.to('.mist.m2',{xPercent:-7,duration:26,ease:'sine.inOut',yoyo:true,repeat:-1});

  gsap.utils.toArray('.split .imgwrap img').forEach(im=>gsap.fromTo(im,{yPercent:-14},{yPercent:0,ease:'none',
    scrollTrigger:{trigger:im,start:'top bottom',end:'bottom top',scrub:true}}));

  /* tell image: pinned window, the frame scrolls while the image slides inside it */
  gsap.fromTo('#scanImg',{yPercent:-22},{yPercent:0,ease:'none',
    scrollTrigger:{trigger:'#scan',start:'top bottom',end:'bottom top',scrub:true}});

  /* aurora drift + stamp idle float */
  gsap.to('#stamp',{y:8,rotate:-3,duration:2.6,ease:'sine.inOut',yoyo:true,repeat:-1});
}else{
  document.querySelectorAll('.reveal,.check,.fcard,.scanwrap,.tile,.hero-media,.hero .sub,.cta-row,.proj,.lane,.stepc,.fact,.split .imgwrap,.sitecard,.gal figure').forEach(e=>{e.style.opacity=1;e.style.transform='none'});
  document.querySelectorAll('.hero h1 .row>span').forEach(e=>e.style.transform='none');
  document.querySelectorAll('.srow').forEach(r=>r.classList.add('struck'));
  document.querySelectorAll('[data-n]').forEach(n=>n.textContent=n.dataset.n);
}
