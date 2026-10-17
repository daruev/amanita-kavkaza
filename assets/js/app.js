(function () {
  'use strict';

  var hdr = document.querySelector('.hdr');
  var onScroll = function () { hdr.classList.toggle('on', window.scrollY > 30); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var ios = document.querySelectorAll('.io');
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    ios.forEach(function (el) { obs.observe(el); });
  } else {
    ios.forEach(function (el) { el.classList.add('in'); });
  }

  var chips = document.querySelectorAll('.chip');
  var cards = document.querySelectorAll('.card');
  chips.forEach(function (ch) {
    ch.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('on'); });
      ch.classList.add('on');
      var f = ch.dataset.f;
      cards.forEach(function (card) {
        var show = f === 'all' || card.dataset.cat === f;
        card.classList.toggle('hide', !show);
      });
    });
  });

  var TG = 'https://t.me/amanita_kavkaza';
  var KEY = 'ak_cart_v1';
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { cart = []; }

  var bar = document.getElementById('cartbar');
  var cCount = document.getElementById('cartCount');
  var cSum = document.getElementById('cartSum');
  var modal = document.getElementById('modal');
  var mList = document.getElementById('modalList');
  var mEmpty = document.getElementById('modalEmpty');
  var mSum = document.getElementById('modalSum');

  var fmt = function (n) { return n.toLocaleString('ru-RU') + ' ₽'; };
  var find = function (id) {
    for (var i = 0; i < cart.length; i++) if (cart[i].id === id) return cart[i];
    return null;
  };

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {}
    render();
  }

  function total() {
    return cart.reduce(function (s, it) { return s + it.price * it.qty; }, 0);
  }

  function orderText() {
    var lines = cart.map(function (it) {
      var qtyLabel = it.unit === 'г'
        ? it.qty + ' г = ' + fmt(it.qty * it.price)
        : it.qty + ' шт = ' + fmt(it.qty * it.price);
      return it.name + ' — ' + qtyLabel;
    });
    return 'Здравствуйте! Хочу заказать:\n' + lines.join('\n') + '\nИтого: ' + fmt(total());
  }

  function render() {
    var n = cart.reduce(function (s, it) { return s + (it.unit === 'г' ? 1 : it.qty); }, 0);
    cCount.textContent = n;
    cSum.textContent = fmt(total());
    bar.hidden = cart.length === 0;

    document.querySelectorAll('.add').forEach(function (b) {
      var it = find(b.dataset.id);
      b.classList.toggle('done', !!it);
      b.textContent = it ? it.qty + ' ' + (it.unit === 'г' ? 'г' : 'шт') + ' ✓' : 'в заказ';
    });

    mList.innerHTML = '';
    cart.forEach(function (it) {
      var li = document.createElement('li');
      var name = document.createElement('span');
      name.textContent = it.name;
      var rm = document.createElement('button');
      rm.className = 'rm';
      rm.textContent = 'убрать';
      rm.addEventListener('click', function () {
        cart = cart.filter(function (x) { return x.id !== it.id; });
        save();
      });
      name.appendChild(rm);
      var val = document.createElement('b');
      var qtyLabel = it.unit === 'г' ? it.qty + ' г' : it.qty + ' шт';
      val.textContent = qtyLabel + ' · ' + fmt(it.qty * it.price);
      li.appendChild(name);
      li.appendChild(val);
      mList.appendChild(li);
    });
    mEmpty.hidden = cart.length > 0;
    mSum.textContent = cart.length ? 'Итого: ' + fmt(total()) : '';
  }

  document.querySelectorAll('.add').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.dataset.id;
      var it = find(id);
      if (it) {
        it.qty += it.unit === 'г' ? 50 : 1;
      } else {
        cart.push({
          id: id,
          name: b.dataset.name,
          price: +b.dataset.price,
          unit: b.dataset.unit,
          qty: b.dataset.unit === 'г' ? 50 : 1
        });
      }
      save();
    });
  });

  document.getElementById('cartOpen').addEventListener('click', openModal);
  document.getElementById('cartSend').addEventListener('click', openModal);

  function openModal() {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    render();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }
  modal.querySelectorAll('[data-close]').forEach(function (el) {
    el.addEventListener('click', closeModal);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!lb.hidden) lbClose();
      if (!modal.hidden) closeModal();
    }
    if (!lb.hidden && e.key === 'ArrowLeft') lbStep(-1);
    if (!lb.hidden && e.key === 'ArrowRight') lbStep(1);
  });

  document.getElementById('tgGo').addEventListener('click', function () {
    if (!cart.length) return;
    try { navigator.clipboard.writeText(orderText()); } catch (e) {}
  });

  document.getElementById('copyList').addEventListener('click', function () {
    if (!cart.length) return;
    var btn = this;
    var done = function () {
      btn.textContent = 'скопировано ✓';
      setTimeout(function () { btn.textContent = 'скопировать список'; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(orderText()).then(done, function () { fallback(); });
    } else {
      fallback();
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = orderText();
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      document.body.removeChild(ta);
    }
  });

  var gtrack = document.getElementById('galTrack');
  var gfigs = Array.prototype.slice.call(gtrack.querySelectorAll('figure'));
  var gtabs = document.querySelectorAll('.gtabs .chip');

  gtabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      gtabs.forEach(function (t) { t.classList.remove('on'); });
      tab.classList.add('on');
      var g = tab.dataset.g;
      gtrack.dataset.mode = g;
      gfigs.forEach(function (f) { f.hidden = f.dataset.g !== g; });
      gtrack.scrollTo({ left: 0, behavior: 'smooth' });
    });
  });

  document.querySelectorAll('[data-r]').forEach(function (b) {
    b.addEventListener('click', function () {
      var step = gtrack.clientWidth * 0.7;
      gtrack.scrollBy({ left: b.dataset.r === 'next' ? step : -step, behavior: 'smooth' });
    });
  });

  var lb = document.getElementById('lb');
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');
  var lbList = [];
  var lbIdx = 0;

  function lbShow() {
    var f = lbList[lbIdx];
    var img = f.querySelector('img');
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    var cap = f.querySelector('figcaption');
    lbCap.textContent = cap ? cap.textContent : '';
  }
  function lbOpen(f) {
    lbList = gfigs.filter(function (x) { return !x.hidden; });
    lbIdx = lbList.indexOf(f);
    if (lbIdx < 0) return;
    lbShow();
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function lbClose() {
    lb.hidden = true;
    document.body.style.overflow = '';
  }
  function lbStep(dir) {
    if (!lbList.length) return;
    lbIdx = (lbIdx + dir + lbList.length) % lbList.length;
    lbShow();
  }

  gtrack.addEventListener('click', function (e) {
    var f = e.target.closest('figure');
    if (f) lbOpen(f);
  });
  lb.querySelectorAll('[data-lb-close]').forEach(function (el) {
    el.addEventListener('click', lbClose);
  });
  document.querySelector('[data-lb-prev]').addEventListener('click', function () { lbStep(-1); });
  document.querySelector('[data-lb-next]').addEventListener('click', function () { lbStep(1); });

  render();
})();
