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
