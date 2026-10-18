(function () {
  'use strict';

  var doc = document.documentElement;
  var hdr = document.querySelector('.hdr');
  var hdrBar = document.getElementById('hdrBar');
  var ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    var max = doc.scrollHeight - window.innerHeight;
    hdr.classList.toggle('on', y > 30);
    hdrBar.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  var burger = document.getElementById('burger');
  var mnav = document.getElementById('mnav');

  function menuSet(open) {
    mnav.hidden = !open;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
    document.body.classList.toggle('menu-open', open);
  }
  burger.addEventListener('click', function () { menuSet(mnav.hidden); });
  mnav.addEventListener('click', function (e) {
    if (e.target.closest('a')) menuSet(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 960 && !mnav.hidden) menuSet(false);
  });

  var ios = document.querySelectorAll('.io');
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          var el = e.target;
          var p = el.parentElement;
          if (p && /cards|path-grid|how-grid/.test(p.className)) {
            var sibs = Array.prototype.filter.call(p.children, function (c) {
              return c.classList.contains('io');
            });
            el.style.animationDelay = (sibs.indexOf(el) % 4) * 90 + 'ms';
          }
          el.classList.add('in');
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -3% 0px' });
    ios.forEach(function (el) { obs.observe(el); });
  } else {
    ios.forEach(function (el) { el.classList.add('in'); });
  }

  var counters = document.querySelectorAll('[data-n]');
  counters.forEach(function (el) {
    var to = +el.dataset.n;
    var t0 = null;
    el.textContent = '0';
    function step(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / 1400);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    }
    setTimeout(function () { requestAnimationFrame(step); }, 350);
    setTimeout(function () { el.textContent = to; }, 2400);
  });

  var chips = document.querySelectorAll('.filters .chip');
  var cards = document.querySelectorAll('.card');
  chips.forEach(function (ch) {
    ch.addEventListener('click', function () {
      chips.forEach(function (c) {
        c.classList.remove('on');
        c.setAttribute('aria-pressed', 'false');
      });
      ch.classList.add('on');
      ch.setAttribute('aria-pressed', 'true');
      var f = ch.dataset.f;
      cards.forEach(function (card) {
        var show = f === 'all' || card.dataset.cat === f;
        card.classList.toggle('hide', !show);
      });
    });
  });

  var cardsBox = document.querySelector('.cards');
  var spotFrame = 0;
  cardsBox.addEventListener('pointermove', function (e) {
    var card = e.target.closest('.card');
    if (!card || e.pointerType === 'touch') return;
    cancelAnimationFrame(spotFrame);
    spotFrame = requestAnimationFrame(function () {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  var TG = 'https://t.me/amanita123';
  var KEY = 'ak_cart_v1';
  var WEIGHTS = [10, 30, 50, 100];
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { cart = []; }

  var bar = document.getElementById('cartbar');
  var cCount = document.getElementById('cartCount');
  var cSum = document.getElementById('cartSum');
  var modal = document.getElementById('modal');
  var mList = document.getElementById('modalList');
  var mEmpty = document.getElementById('modalEmpty');
  var mSum = document.getElementById('modalSum');
  var tgGo = document.getElementById('tgGo');
  var live = document.getElementById('live');

  var fmt = function (n) { return n.toLocaleString('ru-RU') + ' ₽'; };
  var clean = function (s) { return s.replace(/\s*\(г\)$/, ''); };
  var isG = function (it) { return it.unit === 'г'; };
  var qtyLabel = function (it) { return it.qty + (isG(it) ? ' г' : ' шт'); };
  var find = function (id) {
    for (var i = 0; i < cart.length; i++) if (cart[i].id === id) return cart[i];
    return null;
  };
  function say(msg) {
    live.textContent = '';
    setTimeout(function () { live.textContent = msg; }, 30);
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {}
    render();
  }

  function total() {
    return cart.reduce(function (s, it) { return s + it.price * it.qty; }, 0);
  }

  function orderText() {
    var lines = cart.map(function (it) {
      return clean(it.name) + ' — ' + qtyLabel(it) + ' = ' + fmt(it.qty * it.price);
    });
    return 'Здравствуйте! Хочу заказать:\n' + lines.join('\n') + '\nИтого: ' + fmt(total());
  }

  var focusKey = null;

  function render() {
    cCount.textContent = cart.length;
    cSum.textContent = fmt(total());
    bar.hidden = cart.length === 0;
    document.body.classList.toggle('has-cart', cart.length > 0);

    document.querySelectorAll('.add').forEach(function (b) {
      var it = find(b.dataset.id);
      b.classList.toggle('done', !!it);
      b.textContent = it ? '✓ ' + qtyLabel(it) : 'в заказ';
    });

    mList.innerHTML = '';
    cart.forEach(function (it) {
      var li = document.createElement('li');
      var name = document.createElement('span');
      name.textContent = clean(it.name);
      var val = document.createElement('b');
      val.textContent = fmt(it.qty * it.price);

      var ctl = document.createElement('div');
      ctl.className = 'li-ctl';
      var qty = document.createElement('div');
      qty.className = 'qty';
      var step = isG(it) ? 10 : 1;
      var min = step;

      var dec = document.createElement('button');
      dec.type = 'button';
      dec.textContent = '−';
      dec.setAttribute('aria-label', 'Уменьшить: ' + clean(it.name));
      dec.dataset.k = it.id + ':dec';
      dec.disabled = it.qty <= min;
      dec.addEventListener('click', function () {
        it.qty = Math.max(min, it.qty - step);
        focusKey = dec.dataset.k;
        save();
      });

      var out = document.createElement('output');
      out.textContent = qtyLabel(it);

      var inc = document.createElement('button');
      inc.type = 'button';
      inc.textContent = '+';
      inc.setAttribute('aria-label', 'Увеличить: ' + clean(it.name));
      inc.dataset.k = it.id + ':inc';
      inc.addEventListener('click', function () {
        it.qty += step;
        focusKey = inc.dataset.k;
        save();
      });

      qty.appendChild(dec);
      qty.appendChild(out);
      qty.appendChild(inc);

      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'rm';
      rm.textContent = 'убрать';
      rm.setAttribute('aria-label', 'Убрать из заказа: ' + clean(it.name));
      rm.addEventListener('click', function () {
        cart = cart.filter(function (x) { return x.id !== it.id; });
        save();
      });

      ctl.appendChild(qty);
      ctl.appendChild(rm);
      li.appendChild(name);
      li.appendChild(val);
      li.appendChild(ctl);
      mList.appendChild(li);
    });
    mEmpty.hidden = cart.length > 0;
    mSum.textContent = cart.length ? 'Итого: ' + fmt(total()) : '';
    tgGo.href = cart.length ? TG + '?text=' + encodeURIComponent(orderText()) : TG;

    if (focusKey) {
      var again = mList.querySelector('[data-k="' + focusKey + '"]');
      if (again && !again.disabled) again.focus();
      focusKey = null;
    }
  }

  document.querySelectorAll('.card').forEach(function (card) {
    var b = card.querySelector('.add');
    var price = +b.dataset.price;
    var sel = 50;
    if (b.dataset.unit !== 'г') {
      b.setAttribute('aria-label', 'Добавить в заказ: ' + clean(b.dataset.name));
      return;
    }
    var priceNote = card.querySelector('.price span');
    var wrap = document.createElement('div');
    wrap.className = 'wsel';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Вес: ' + clean(b.dataset.name));
    var btns = WEIGHTS.map(function (w) {
      var x = document.createElement('button');
      x.type = 'button';
      x.textContent = w + ' г';
      x.setAttribute('aria-pressed', w === sel ? 'true' : 'false');
      x.addEventListener('click', function () {
        sel = w;
        btns.forEach(function (o, i) {
          o.setAttribute('aria-pressed', WEIGHTS[i] === w ? 'true' : 'false');
        });
        paint();
      });
      wrap.appendChild(x);
      return x;
    });
    function paint() {
      priceNote.textContent = sel + ' г = ' + fmt(sel * price);
      b.dataset.qty = sel;
      b.setAttribute('aria-label', 'Добавить в заказ ' + sel + ' г: ' + clean(b.dataset.name));
    }
    card.querySelector('.card-row').before(wrap);
    paint();
  });

  document.querySelectorAll('.add').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.dataset.id;
      var grams = b.dataset.unit === 'г';
      var add = grams ? +b.dataset.qty || 50 : 1;
      var it = find(id);
      if (it) {
        it.qty += add;
      } else {
        it = {
          id: id,
          name: b.dataset.name,
          price: +b.dataset.price,
          unit: b.dataset.unit,
          qty: add
        };
        cart.push(it);
      }
      save();
      say('В заказе: ' + clean(it.name) + ', ' + qtyLabel(it));
    });
  });

  var FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
  var lastFocus = null;

  function trap(box, e) {
    if (e.key !== 'Tab') return;
    var f = Array.prototype.filter.call(box.querySelectorAll(FOCUSABLE), function (n) {
      return n.offsetParent !== null || n === document.activeElement;
    });
    if (!f.length) return;
    var first = f[0];
    var last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    render();
    modal.querySelector('.x').focus();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.getElementById('cartOpen').addEventListener('click', openModal);
  document.getElementById('cartSend').addEventListener('click', openModal);
  modal.querySelectorAll('[data-close]').forEach(function (el) {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!lb.hidden) lbClose();
      else if (!modal.hidden) closeModal();
      else if (!mnav.hidden) menuSet(false);
      return;
    }
    if (!modal.hidden) trap(modal.querySelector('.modal-box'), e);
    if (!lb.hidden) {
      trap(lb, e);
      if (e.key === 'ArrowLeft') lbStep(-1);
      if (e.key === 'ArrowRight') lbStep(1);
    }
  });

  tgGo.addEventListener('click', function () {
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

  gfigs.forEach(function (f) {
    f.tabIndex = 0;
    f.setAttribute('role', 'button');
    f.setAttribute('aria-label', 'Открыть фото: ' + f.querySelector('img').alt);
    f.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        lbOpen(f);
      }
    });
  });

  gtabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      gtabs.forEach(function (t) {
        t.classList.remove('on');
        t.setAttribute('aria-pressed', 'false');
      });
      tab.classList.add('on');
      tab.setAttribute('aria-pressed', 'true');
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
  var lbFocus = null;

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
    lbFocus = document.activeElement;
    lbShow();
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lb.querySelector('.lb-x').focus();
  }
  function lbClose() {
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lbFocus && lbFocus.focus) lbFocus.focus();
  }
  function lbStep(dir) {
    if (!lbList.length) return;
    lbIdx = (lbIdx + dir + lbList.length) % lbList.length;
    lbShow();
  }

  var gDragged = false;
  var gDown = false;
  var gStartX = 0;
  var gStartScroll = 0;

  gtrack.addEventListener('dragstart', function (e) { e.preventDefault(); });
  gtrack.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    gDown = true;
    gDragged = false;
    gStartX = e.pageX;
    gStartScroll = gtrack.scrollLeft;
    gtrack.classList.add('dragging');
  });
  window.addEventListener('pointermove', function (e) {
    if (!gDown) return;
    var dx = e.pageX - gStartX;
    if (Math.abs(dx) > 5) gDragged = true;
    if (gDragged) gtrack.scrollLeft = gStartScroll - dx;
  });
  window.addEventListener('pointerup', function () {
    if (!gDown) return;
    gDown = false;
    gtrack.classList.remove('dragging');
    setTimeout(function () { gDragged = false; }, 50);
  });

  gtrack.addEventListener('click', function (e) {
    if (gDragged) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  gtrack.addEventListener('click', function (e) {
    var f = e.target.closest('figure');
    if (f) lbOpen(f);
  });
  lb.querySelectorAll('[data-lb-close]').forEach(function (el) {
    el.addEventListener('click', lbClose);
  });
  document.querySelector('[data-lb-prev]').addEventListener('click', function () { lbStep(-1); });
  document.querySelector('[data-lb-next]').addEventListener('click', function () { lbStep(1); });

  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-goal]');
    if (!g) return;
    try {
      if (window.ym && window.YM_ID) window.ym(window.YM_ID, 'reachGoal', g.dataset.goal);
      (window.dataLayer = window.dataLayer || []).push({ event: g.dataset.goal });
    } catch (err) {}
  });

  var frame = document.querySelector('.hero-frame');
  var tiltRaf = 0;
  if (frame && window.matchMedia('(hover:hover) and (min-width:961px)').matches) {
    document.querySelector('.hero').addEventListener('pointermove', function (e) {
      cancelAnimationFrame(tiltRaf);
      tiltRaf = requestAnimationFrame(function () {
        var x = e.clientX / window.innerWidth - 0.5;
        var y = e.clientY / window.innerHeight - 0.5;
        frame.style.transform = 'perspective(900px) rotateY(' + (x * 9).toFixed(2) + 'deg) rotateX(' + (-y * 7).toFixed(2) + 'deg)';
      });
    });
  }

  var hero = document.querySelector('.hero');
  var vid = document.querySelector('.hero-vid');
  var cv = document.getElementById('spores');
  var heroOn = true;
  var run = false;
  var parts = [];
  var cw = 0;
  var ch = 0;
  var ctx = cv && cv.getContext ? cv.getContext('2d') : null;

  function sizeCanvas() {
    var r = cv.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = r.width;
    ch = r.height;
    cv.width = Math.round(cw * dpr);
    cv.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.max(26, Math.min(64, Math.round(cw * ch / 24000)));
    parts = [];
    for (var i = 0; i < n; i++) parts.push(spore(true));
  }
  function spore(fill) {
    return {
      x: Math.random() * cw,
      y: fill ? Math.random() * ch : ch + 10,
      r: 0.5 + Math.random() * 1.5,
      v: 0.14 + Math.random() * 0.36,
      p: Math.random() * 6.28,
      w: 0.5 + Math.random() * 1.1,
      c: Math.random() < 0.22 ? '10,153,163' : '233,227,210'
    };
  }
  function tick() {
    if (!heroOn || document.hidden) { run = false; return; }
    ctx.clearRect(0, 0, cw, ch);
    for (var i = 0; i < parts.length; i++) {
      var q = parts[i];
      q.y -= q.v;
      q.p += 0.017;
      q.x += Math.sin(q.p) * 0.28 * q.w;
      if (q.y < -10) parts[i] = q = spore(false);
      var edge = Math.min(1, q.y / (ch * 0.25), (ch - q.y) / (ch * 0.08));
      var a = Math.max(0, edge) * (0.28 + 0.5 * Math.abs(Math.sin(q.p * 1.7)));
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + q.c + ',' + a.toFixed(3) + ')';
      ctx.arc(q.x, q.y, q.r, 0, 6.2832);
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  function start() {
    if (ctx && !run) {
      run = true;
      requestAnimationFrame(tick);
    }
  }
  if (ctx) {
    sizeCanvas();
    var rz = 0;
    window.addEventListener('resize', function () {
      clearTimeout(rz);
      rz = setTimeout(sizeCanvas, 160);
    });
    document.addEventListener('visibilitychange', start);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      heroOn = es[0].isIntersecting;
      if (heroOn) {
        start();
        if (vid && vid.paused) vid.play().catch(function () {});
      } else if (vid) {
        vid.pause();
      }
    }, { threshold: 0 }).observe(hero);
  }
  start();
  if (vid) vid.play().catch(function () {});

  render();
})();
