/* Ornaments kit: подгрузка спрайта, пауза вне экрана, вращение от скролла. Author: Lev Daruev */
(function(){
  var d=document,rm=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches,sc=d.currentScript;
  function init(){
    var els=[].slice.call(d.querySelectorAll('.orn,.orn-div,.orn-band,.orn-pat,[data-orn-scroll]'));
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle('orn-off',!e.isIntersecting)})},{rootMargin:'160px'});
      els.forEach(function(e){io.observe(e)});
    }
    var sr=[].slice.call(d.querySelectorAll('[data-orn-scroll]'));
    if(!sr.length||rm)return;
    var busy=false;
    function upd(){busy=false;var y=window.pageYOffset;sr.forEach(function(e){if(e.classList.contains('orn-off'))return;e.style.setProperty('--o-rot',(y*(parseFloat(e.getAttribute('data-orn-scroll'))||.1)).toFixed(2)+'deg')})}
    window.addEventListener('scroll',function(){if(!busy){busy=true;requestAnimationFrame(upd)}},{passive:true});
    upd();
  }
  function boot(){
    if(d.getElementById('o-lotus')||!sc||!sc.src||!window.fetch)return init();
    fetch(new URL('../ornaments/ornaments.svg',sc.src)).then(function(r){return r.text()}).then(function(t){
      var w=d.createElement('div');w.setAttribute('aria-hidden','true');w.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
      w.innerHTML=t;d.body.insertBefore(w,d.body.firstChild);init();
    }).catch(init);
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot);else boot();
})();
