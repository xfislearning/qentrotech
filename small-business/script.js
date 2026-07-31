var QENTRO_MARKET = 'small_business';
function qentroTrack(eventName, parameters){
  if(typeof window.gtag === 'function'){
    var details = parameters || {};
    details.market = details.market || QENTRO_MARKET;
    window.gtag('event', eventName, details);
  }
}

document.querySelectorAll('a[href^="mailto:"]').forEach(function(link){
  link.addEventListener('click', function(){
    qentroTrack('email_clicked');
  });
});

document.querySelectorAll('.menu-toggle').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var links = document.querySelector('.nav-links');
    var open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
});
document.addEventListener('click', function (e) {
  var links = document.querySelector('.nav-links');
  var btn = document.querySelector('.menu-toggle');
  if (!links || !links.classList.contains('open')) return;
  if (links.contains(e.target) || (btn && btn.contains(e.target))) return;
  links.classList.remove('open');
  if (btn) btn.setAttribute('aria-expanded', 'false');
});
document.querySelectorAll('.year').forEach(function (el) {
  el.textContent = new Date().getFullYear();
});
(function () {
  var fill = document.getElementById('traceFill');
  var processSection = document.getElementById('process');
  if (!fill || !processSection) return;
  var steps = document.querySelectorAll('[data-step]');
  function updateTrace() {
    var rect = processSection.getBoundingClientRect();
    var vh = window.innerHeight;
    var total = rect.height + vh * 0.5;
    var scrolled = Math.min(Math.max(vh - rect.top, 0), total);
    var pct = Math.min((scrolled / total) * 100, 100);
    fill.style.height = pct + '%';
    steps.forEach(function (step, i) {
      var stepPct = (i / (steps.length - 1)) * 100;
      if (pct >= stepPct - 5) step.classList.add('lit'); else step.classList.remove('lit');
    });
  }
  window.addEventListener('scroll', updateTrace, { passive: true });
  window.addEventListener('resize', updateTrace);
  updateTrace();
})();

// Reveal the embedded Google contact form only after the visitor asks to send a message.
document.querySelectorAll('.contact-form-trigger').forEach(function(button){
  button.addEventListener('click', function(){
    var panel=button.closest('.contact-box').querySelector('.embedded-contact-form');
    if(!panel) return;
    var opening=panel.hasAttribute('hidden');
    if(opening){
      qentroTrack('form_opened');
      panel.removeAttribute('hidden');
      button.setAttribute('aria-expanded','true');
      button.textContent='Hide message form';
      panel.scrollIntoView({behavior:'smooth',block:'start'});
    }else{
      panel.setAttribute('hidden','');
      button.setAttribute('aria-expanded','false');
      button.textContent='Send us a message';
    }
  });
});

document.querySelectorAll('.native-contact-form').forEach(function(form){
  var frameName=form.getAttribute('target');
  var frame=frameName ? document.querySelector('iframe[name="'+frameName+'"]') : null;
  form.dataset.submitted='false';
  form.addEventListener('submit', function(){
    form.dataset.submitted='true';
    var status=form.querySelector('.form-status');
    if(status) status.textContent='Sending…';
  });
  if(frame){
    frame.addEventListener('load', function(){
      if(form.dataset.submitted!=='true') return;
      form.dataset.submitted='false';
      qentroTrack('form_submitted');
      form.reset();
      var panel=form.closest('.embedded-contact-form');
      var box=form.closest('.contact-box');
      var button=box ? box.querySelector('.contact-form-trigger') : null;
      if(panel) panel.setAttribute('hidden','');
      if(button){
        button.setAttribute('aria-expanded','false');
        button.textContent='Message sent';
        window.setTimeout(function(){ button.textContent='Send us a message'; },2500);
      }
    });
  }
});
