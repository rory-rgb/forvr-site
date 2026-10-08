/* Forvr consent + measurement.
   Nothing from Google loads, and no cookie is set, until the visitor accepts.
   The choice is kept in localStorage as forvrConsent = "yes" | "no".
   Events (book_call, generate_lead) queue in dataLayer and only leave the
   browser if the visitor has accepted. */
(function(){
  var GA='G-4ZVGGB8EFY', KEY='forvrConsent';
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){dataLayer.push(arguments)};

  function get(){try{return localStorage.getItem(KEY)}catch(e){return null}}
  function set(v){try{localStorage.setItem(KEY,v)}catch(e){}}

  var loaded=false;
  function load(){
    if(loaded) return; loaded=true;
    gtag('consent','default',{analytics_storage:'granted',ad_storage:'granted',ad_user_data:'granted',ad_personalization:'denied'});
    gtag('js',new Date());
    gtag('config',GA);
    var s=document.createElement('script');
    s.async=true; s.src='https://www.googletagmanager.com/gtag/js?id='+GA;
    document.head.appendChild(s);
  }

  var css='#fc{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:420px;background:#0A0B0D;color:#F2F3F4;'+
    'font:400 14px/1.5 Archivo,system-ui,sans-serif;padding:18px 18px 16px;border:1px solid #1E2226;box-shadow:0 18px 50px rgba(0,0,0,.35)}'+
    '#fc p{margin:0 0 14px;color:#C9CFD4}#fc a{color:#5BC2E7;text-decoration:underline}'+
    '#fc .r{display:flex;gap:10px}#fc button{flex:1;cursor:pointer;font:600 12px/1 "IBM Plex Mono",monospace;letter-spacing:.08em;'+
    'text-transform:uppercase;padding:13px 10px;border:1px solid #F2F3F4;background:transparent;color:#F2F3F4}'+
    '#fc button.y{background:#5BC2E7;border-color:#5BC2E7;color:#070707}#fc button:focus-visible{outline:2px solid #5BC2E7;outline-offset:2px}';

  function banner(){
    if(document.getElementById('fc')) return;
    var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
    var d=document.createElement('div'); d.id='fc'; d.setAttribute('role','dialog'); d.setAttribute('aria-label','Cookie choice');
    d.innerHTML='<p>Can we use Google Analytics to see which pages and ads bring people here? Nothing loads unless you say yes. '+
      '<a href="/privacy">Privacy</a></p><div class="r"><button type="button" class="n">No thanks</button><button type="button" class="y">Accept</button></div>';
    document.body.appendChild(d);
    d.querySelector('.y').onclick=function(){set('yes');d.remove();load()};
    d.querySelector('.n').onclick=function(){set('no');d.remove()};
  }

  window.forvrConsent={open:function(){set('');banner()}};

  var c=get();
  if(c==='yes') load();
  else if(c!=='no'){
    if(document.body) banner(); else document.addEventListener('DOMContentLoaded',banner);
  }

  /* contact form posts straight to Formspree, so log the lead on submit */
  document.addEventListener('submit',function(e){
    var f=e.target;
    if(f && f.classList && f.classList.contains('enq')) gtag('event','generate_lead',{form_name:'contact',transport_type:'beacon'});
  },true);

  /* Calendly booking on /calendar */
  window.addEventListener('message',function(e){
    if(e.origin!=='https://calendly.com' || !e.data || !e.data.event) return;
    if(e.data.event==='calendly.event_scheduled') gtag('event','book_call',{method:'calendly'});
  });
})();
