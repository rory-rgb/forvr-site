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
document.querySelectorAll('video').forEach(v=>vio.observe(v));
addEventListener('pointerdown',()=>document.querySelectorAll('video').forEach(v=>{
  if(v.paused&&v.getBoundingClientRect().top<innerHeight)v.play().catch(()=>{});
}),{once:true});

/* Trial panel: a light orb the cursor carries, with depth-parallaxed stars.
   Everything is drawn additively so the glow reads on the near-black ground. */
(function(){
  const cv=document.getElementById('stars'); if(!cv) return;
  const ctx=cv.getContext('2d'); let W,H,stars=[],DPR=1;
  let mx=.5,my=.45,ox=.5,oy=.45,warm=0;
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;

  function build(){
    DPR=Math.min(devicePixelRatio||1,2);
    W=cv.width=Math.round(cv.offsetWidth*DPR);
    H=cv.height=Math.round(cv.offsetHeight*DPR);
    const n=Math.round(Math.min(120,Math.max(55,cv.offsetWidth/13)));
    stars=Array.from({length:n},()=>{
      const z=Math.random();
      return {x:Math.random()*W,y:Math.random()*H,z,
        r:(0.7+z*2.0)*DPR, tw:Math.random()*6.28, sp:.25+Math.random()*.55,
        blue:Math.random()<.28, big:z>.78};
    });
  }
  build();
  addEventListener('resize',build);
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(build);
  addEventListener('load',build);

  const host=cv.parentElement;
  host.addEventListener('pointermove',e=>{
    const b=cv.getBoundingClientRect();
    mx=(e.clientX-b.left)/b.width; my=(e.clientY-b.top)/b.height; warm=1;
  });
  host.addEventListener('pointerleave',()=>{warm=0});

  function orb(x,y,R,a){
    const g=ctx.createRadialGradient(x,y,0,x,y,R);
    g.addColorStop(0,   'rgba(150,222,247,'+(0.42*a)+')');
    g.addColorStop(0.18,'rgba(91,194,231,' +(0.26*a)+')');
    g.addColorStop(0.45,'rgba(38,120,164,' +(0.12*a)+')');
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,R,0,6.283); ctx.fill();
  }

  function drawStar(x,y,r,a,blue,big,t,tw){
    const col=blue?'145,215,242':'236,242,246';
    const g=ctx.createRadialGradient(x,y,0,x,y,r*9);
    g.addColorStop(0,'rgba('+col+','+(a*0.7)+')');
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r*9,0,6.283); ctx.fill();
    ctx.fillStyle='rgba('+col+','+Math.min(a*1.35,1)+')';
    ctx.beginPath(); ctx.arc(x,y,r,0,6.283); ctx.fill();
    if(big){
      const L=r*(6+2.2*Math.sin(t/620+tw));
      ctx.strokeStyle='rgba('+col+','+(a*0.55)+')';
      ctx.lineWidth=Math.max(1,r*0.34);
      ctx.beginPath();
      ctx.moveTo(x-L,y); ctx.lineTo(x+L,y);
      ctx.moveTo(x,y-L*0.8); ctx.lineTo(x,y+L*0.8);
      ctx.stroke();
    }
  }

  function frame(t){
    ox+=(mx-ox)*.06; oy+=(my-oy)*.06;
    const OX=ox*W, OY=oy*H, R=Math.max(W,H)*0.42;
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation='lighter';

    orb(OX,OY,R,0.85+0.25*warm);
    orb(OX,OY,R*0.26,1.1+0.4*warm);

    for(const s of stars){
      const px=s.x+(ox-.5)*s.z*70*DPR, py=s.y+(oy-.5)*s.z*46*DPR;
      const d=Math.hypot(px-OX,py-OY)||1;
      const near=Math.max(0,1-d/(R*0.95));
      const base=still?0.42:0.24+0.22*(.5+.5*Math.sin(t/1600+s.tw))*s.sp;
      drawStar(px,py,s.r,Math.min(base+near*0.62,1),s.blue,s.big,t,s.tw);
    }
    ctx.globalCompositeOperation='source-over';
    if(!still) requestAnimationFrame(frame);
  }
  if(still) frame(0); else requestAnimationFrame(frame);
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
  gsap.utils.toArray('.reveal,.check,.scanwrap,.proj,.lane,.stepc,.fact,.split .imgwrap').forEach(x=>gsap.to(x,
    {opacity:1,y:0,x:0,duration:.85,ease:'power3.out',scrollTrigger:{trigger:x,start:'top bottom-=40'}}));

  /* stat rows: count + strike */
  gsap.utils.toArray('.srow').forEach(row=>{
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
  document.querySelectorAll('.reveal,.check,.fcard,.scanwrap,.tile,.hero-media,.hero .sub,.cta-row,.proj,.lane,.stepc,.fact,.split .imgwrap').forEach(e=>{e.style.opacity=1;e.style.transform='none'});
  document.querySelectorAll('.hero h1 .row>span').forEach(e=>e.style.transform='none');
  document.querySelectorAll('.srow').forEach(r=>r.classList.add('struck'));
  document.querySelectorAll('[data-n]').forEach(n=>n.textContent=n.dataset.n);
}
