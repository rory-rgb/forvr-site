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

/* light orb tracks the cursor; stars glow and give way around it */
(function(){
  const cv=document.getElementById('stars'); if(!cv) return;
  const ctx=cv.getContext('2d'); let W,H,stars=[];
  let mx=.5,my=.42,ox=.5,oy=.42;
  function size(){W=cv.width=cv.offsetWidth*devicePixelRatio;H=cv.height=cv.offsetHeight*devicePixelRatio;
    stars=Array.from({length:64},()=>({x:Math.random()*W,y:Math.random()*H,
      r:(Math.random()*1.4+.5)*devicePixelRatio,tw:Math.random()*6.28,z:.35+Math.random()*.65,
      blue:Math.random()<.22, big:Math.random()<.16}));}
  size(); addEventListener('resize',size);
  cv.parentElement.addEventListener('pointermove',e=>{
    const b=cv.getBoundingClientRect();
    mx=(e.clientX-b.left)/b.width; my=(e.clientY-b.top)/b.height;});
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function star(x,y,r,alpha,blue,big,t,tw){
    // halo
    const g=ctx.createRadialGradient(x,y,0,x,y,r*7);
    g.addColorStop(0,(blue?'rgba(91,194,231,':'rgba(233,238,242,')+(alpha*.55)+')');
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r*7,0,6.283); ctx.fill();
    // core
    ctx.globalAlpha=alpha;
    ctx.fillStyle=blue?'#8FD8F2':'#F4F7F9';
    ctx.beginPath(); ctx.arc(x,y,r,0,6.283); ctx.fill();
    // sparkle cross on the large ones
    if(big){
      ctx.globalAlpha=alpha*.5; ctx.strokeStyle=blue?'#8FD8F2':'#F4F7F9';
      ctx.lineWidth=devicePixelRatio*.7;
      const L=r*(5+1.6*Math.sin(t/700+tw));
      ctx.beginPath();
      ctx.moveTo(x-L,y);ctx.lineTo(x+L,y);
      ctx.moveTo(x,y-L);ctx.lineTo(x,y+L);
      ctx.stroke();
    }
    ctx.globalAlpha=1;
  }
  function draw(t){
    ox+=(mx-ox)*.055; oy+=(my-oy)*.055;
    const OX=ox*W, OY=oy*H;
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation='lighter';
    // the orb
    const R=Math.min(W,H)*.34;
    let g=ctx.createRadialGradient(OX,OY,0,OX,OY,R);
    g.addColorStop(0,'rgba(91,194,231,.20)');
    g.addColorStop(.35,'rgba(43,130,168,.10)');
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(OX,OY,R,0,6.283); ctx.fill();
    g=ctx.createRadialGradient(OX,OY,0,OX,OY,R*.22);
    g.addColorStop(0,'rgba(160,220,243,.30)');
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(OX,OY,R*.22,0,6.283); ctx.fill();
    // stars, brightened near the orb, eased slightly away from it
    for(const st of stars){
      const dx=st.x-OX, dy=st.y-OY, d=Math.hypot(dx,dy)||1;
      const push=Math.max(0,1-d/(R*1.1))*20*st.z*devicePixelRatio;
      const x=st.x+dx/d*push, y=st.y+dy/d*push;
      const near=Math.max(0,1-d/(R*1.4));
      const a=(still?.4:.14+.26*(.5+.5*Math.sin(t/1500+st.tw)))+.35*near;
      star(x,y,st.r,Math.min(a,.85),st.blue,st.big,t,st.tw);
    }
    ctx.globalCompositeOperation='source-over';
    if(!still) requestAnimationFrame(draw); }
  if(still){draw(0);} else requestAnimationFrame(draw);
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
