/* Shoyu Park — shared interactivity: cursor, ruler build, grid spotlight, reveal */

(function(){
  // ---- page reveal ----
  window.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('ready');
  });

  // ---- scroll reveal ----
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });  // fire as soon as the top edge is on screen (a % threshold never triggers on very tall sections)
  window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  });
  // a .reveal starts translateY(18px) and settles to translateY(0) over .6s
  // once '.in' is added — grid-snapped content nested inside it (.spec-table)
  // gets measured by the ruler build long before that settle finishes, baking
  // in a stale offset. Redo the snap once the reveal's own transform actually
  // finishes moving.
  document.addEventListener('transitionend', (e) => {
    if (e.target.classList.contains('reveal') && e.propertyName === 'transform'){
      e.target.querySelectorAll('.spec-table').forEach(table => alignToGrid(table, 80));
    }
  });

  // ---- custom cursor ----
  const cursor = document.createElement('div');
  cursor.id = 'cursor';
  cursor.style.opacity = '0'; // hidden until the mouse actually moves — it
  // used to default to dead-center of the viewport (see mx/my below) and sit
  // there looking like a stray star until the user first moved their mouse
  // simple circle cursor (drawn with CSS, no SVG or shadow filter)
  document.body.appendChild(cursor);

  let mx = window.innerWidth/2, my = window.innerHeight/2;
  let cx = mx, cy = my;
  let cursorSeen = false;
  // querying + reading layout (getBoundingClientRect) on every raw mousemove
  // event used to run this at mouse-poll rate (can be several hundred Hz),
  // stalling the main thread and making the cursor itself feel laggy. The
  // mousemove handler now only records the pointer position — cheap enough
  // to never block — and the actual DOM query/reads/writes happen at most
  // once per animation frame inside raf() below, in step with painting.
  // Performance: the cursor-following grid spotlight was removed, and the
  // cursor animation now only runs while the mouse is moving (it stops
  // itself once the cursor catches up), instead of every frame forever.
  let running = false;
  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    if (!cursorSeen){ cursorSeen = true; cx = mx; cy = my; cursor.style.opacity = '1'; }
    if (!running){ running = true; requestAnimationFrame(raf); }
  }, { passive:true });

  function raf(){
    cx += (mx-cx)*0.35; cy += (my-cy)*0.35;
    cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
    if (Math.abs(mx-cx) < 0.3 && Math.abs(my-cy) < 0.3){ running = false; return; }
    requestAnimationFrame(raf);
  }

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('.card')) cursor.classList.add('on-card');
    else cursor.classList.remove('on-card');
  });

  // ---- build rulers with correct sequential numbers ----
  // startIndex lets a continuation ruler (.mat-extend) pick up numbering where
  // the preceding .mat's ruler left off, instead of restarting at 0.
  // Returns the ending tick index, so callers can chain continuations.
  function buildRuler(el, horizontal, length, startIndex){
    startIndex = startIndex || 0;
    el.innerHTML = '';
    const step = 8; // px between minor ticks
    const majorEvery = 5; // every 5th tick is major w/ number
    const count = Math.ceil(length/step);
    for (let i=0;i<=count;i++){
      const pos = i*step;
      const isMajor = i % majorEvery === 0;
      const tick = document.createElement('div');
      tick.className = 'tick';
      if (horizontal){
        tick.style.left = pos+'px';
        tick.style.height = isMajor ? '14px' : '7px';
      } else {
        tick.style.top = pos+'px';
        tick.style.width = isMajor ? '14px' : '7px';
      }
      el.appendChild(tick);
      // the top ruler is tick marks only, no numbers — just the side rulers are numbered
      if (isMajor && !horizontal){
        const num = document.createElement('span');
        num.className = 'tick-num';
        num.textContent = startIndex + i;
        num.style.top=(pos+3)+'px'; num.style.left = (el.classList.contains('right') ? '2px':'14px');
        el.appendChild(num);
      }
    }
    return startIndex + count;
  }

  // ---- build scratchboard-style "+" marks at every 3rd big square ----
  // (every 30 ruler units = 240px). `originOffset` is the exact pixel height
  // already "consumed" before this host's own y=0 (0 for a root .mat, or the
  // preceding mat's pixel offsetHeight for a .mat-extend continuation) — it
  // must be the same raw-pixel value used to phase-align the grid squares
  // themselves (matH % 80 below), not the rounded ruler tick count. Using the
  // rounded count here used to drift the crosses a few px off the actual grid
  // corners right as a mat's continuation zone begins.
  function buildCrosses(host, width, height, originOffset, dark){
    let layer = host.querySelector(':scope > .mat-crosses');
    if (!layer){
      layer = document.createElement('div');
      layer.className = 'mat-crosses';
      // z-index:0, not 1 — foreground content (.grid, .section-block, etc.)
      // is also z-index:1, and since this layer gets appended to the DOM
      // later at runtime, equal z-index meant it painted on top of them per
      // DOM-order tiebreaking. Sitting at 0 keeps it behind real content
      // while staying above the unpositioned base mat-grid backgrounds.
      layer.style.cssText = 'position:absolute; inset:0; pointer-events:none; z-index:0;';
      // project pages fade their grid out gradually via a sibling with
      // .page-fade (a single continuous mat, no white-paper crossfade) —
      // the crosses need the same mask, or they stay fully visible the
      // entire length of a very long page after the grid has long faded out
      if (Array.from(host.children).some(c => c.classList.contains('page-fade'))){
        layer.classList.add('page-fade');
      }
      host.appendChild(layer);
    }
    layer.innerHTML = '';
    const span = 240; // px between crosses (30 units * 8px), matches the 80px grid * 3

    const xs = [];
    for (let x = span; x <= width; x += span) xs.push(x);

    const phase = ((originOffset % span) + span) % span;
    const firstY = phase === 0 ? span : span - phase;
    const ys = [];
    for (let y = firstY; y <= height; y += span) ys.push(y);

    xs.forEach(x => ys.forEach(y => {
      const mark = document.createElement('div');
      mark.className = 'cross-mark' + (dark ? ' tone-dark' : '');
      mark.style.left = x+'px';
      mark.style.top = y+'px';
      layer.appendChild(mark);
    }));
  }

  // ---- snap a block's top edge onto the nearest grid line ----
  // Content like the spec-row table has its own natural top offset from flow
  // layout (nav height, font metrics, etc.) that's never a clean multiple of
  // the mat's 80px grid, so its row dividers land a few px off every grid
  // line instead of on it — two faint lines fighting each other. Nudging the
  // block down/up so its top lands exactly on a grid line fixes every row
  // divider below it in one move (each row is a full grid unit tall). Uses a
  // transform, not margin: this block often sits inside a vertically-centered
  // flex/grid area, and a margin change would alter its own box size, which
  // would shift the centering, which would change the very offset we just
  // measured — a transform repositions it without feeding back into layout.
  function alignToGrid(el, unit){
    const mat = el.closest('.mat');
    if (!mat) return;
    el.style.transform = 'none';
    const relTop = el.getBoundingClientRect().top - mat.getBoundingClientRect().top;
    const nearest = Math.round(relTop/unit)*unit;
    const delta = nearest - relTop;
    el.style.transform = delta ? `translateY(${delta}px)` : 'none';
  }

  function initRulers(){
    const build = () => {
      document.querySelectorAll('.spec-table').forEach(table => alignToGrid(table, 80));
      document.querySelectorAll('.mat').forEach(mat => {
        const h = mat.querySelector('.ruler-h');
        const vl = mat.querySelector('.ruler-v.left');
        const vr = mat.querySelector('.ruler-v.right');
        if (h) buildRuler(h, true, h.offsetWidth, 0);
        let endIndex = 0;
        if (vl) endIndex = buildRuler(vl, false, mat.offsetHeight, 0);
        if (vr) buildRuler(vr, false, mat.offsetHeight, 0);
        buildCrosses(mat, mat.offsetWidth, mat.offsetHeight, 0, false);

        if (mat.id){
          const ext = document.querySelector('.mat-extend[data-continues="'+mat.id+'"]');
          if (ext){
            // white-tone copies (visible while still over the green mat) plus
            // dark-tone copies (fade in as the background turns to white paper)
            ext.querySelectorAll('.ruler-v.left').forEach(el => buildRuler(el, false, ext.offsetHeight, endIndex));
            ext.querySelectorAll('.ruler-v.right').forEach(er => buildRuler(er, false, ext.offsetHeight, endIndex));

            // phase-align the following section's grid pattern with this mat's
            // grid, so the lines connect seamlessly across the boundary instead
            // of a visible seam (background-attachment:fixed was tried here but
            // is unreliable across scroll repaints, so we compute this instead).
            // There can be two copies (white-tone + dark-tone, cross-fading), so
            // align every matching layer found directly under the section.
            const parent = ext.parentElement;
            const matH = mat.offsetHeight;
            // uses matH (exact pixels), not endIndex (rounded ruler ticks), so
            // the crosses land exactly on the phase-aligned grid's corners
            buildCrosses(ext, ext.offsetWidth, ext.offsetHeight, matH, true);
            parent.querySelectorAll(':scope > .mat-grid').forEach(layer => {
              layer.style.backgroundPosition = `0 ${-(matH % 80)}px`;
            });
            parent.querySelectorAll(':scope > .grid-fade-in .mat-grid-bright, :scope > .grid-fade-out .mat-grid-bright').forEach(layer => {
              layer.style.backgroundPosition = `0 ${-(matH % 16)}px`;
            });
          }
        }
      });
    };
    build();
    window.addEventListener('resize', build);
    // a .mat can grow taller after initial layout (images/fonts finishing
    // load further down the page), which used to leave the ruler/grid built
    // for a too-short height and cutting off partway down — rebuild once
    // everything has actually finished loading.
    window.addEventListener('load', build);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  }
  window.addEventListener('DOMContentLoaded', initRulers);
})();

// forceAutoplay: make sure muted looping videos start on their own
(function forceAutoplay(){
  function go(){
    document.querySelectorAll('video[autoplay]').forEach(v=>{
      v.muted=true; v.playsInline=true; v.removeAttribute('controls');
      const p=v.play(); if(p&&p.catch) p.catch(()=>{});
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',go); else go();
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) go(); });
})();

// ABOUT ME marker circle (drawn on hover via CSS)
(function(){
  function add(){
    document.querySelectorAll('nav .pill').forEach(p => {
      if (p.querySelector('.marker')) return;
      p.insertAdjacentHTML('beforeend',
        '<svg class="marker" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true">' +
        '<path pathLength="1" d="M172 15 C128 2 38 5 14 32 C-4 54 56 77 122 73 C184 69 204 44 188 24 C176 10 140 7 104 11"/></svg>');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add();
})();

// ---- gridSnap: notebook alignment on graph-paper pages ----
// Every text block gets a line-height that is a whole number of grid squares,
// its top is nudged onto a grid line, and the text is shifted down so each
// line's baseline sits ON a grid line (like writing in a ruled notebook).
// Lines/images listed in SNAP_BOX get their top edge snapped to a grid line.
(function(){
  if (document.body && document.body.classList.contains('plain')) return;
  const G = 24;
  const SNAP_TEXT = 'nav .logo span, nav .pill, .eyebrow, .hero-title, .hello, .name, .bio p, h2.section, ' +
                    '.job-title, .job-role, .job-loc, .job li, .edu-school, .edu-degree, .edu-year, .lang-row';
  const SNAP_BOX  = '.headshot, .badges, .divider, .cta-row';
  const pageTop = el => { let y = 0; while (el){ y += el.offsetTop; el = el.offsetParent; } return y; };
  function run(){
    if (document.body.classList.contains('plain')) return;
    const texts = [...document.querySelectorAll(SNAP_TEXT)];
    const boxes = [...document.querySelectorAll(SNAP_BOX)];
    const all = [...texts, ...boxes].sort((a,b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
    all.forEach(el => { el.style.marginTop = ''; el.style.position = ''; el.style.top = ''; });
    texts.forEach(el => {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      const lh = Math.max(G, Math.round(fs * 0.95 / G) * G);   // one square per line for body text, no skipped rows
      el.style.lineHeight = lh + 'px';
    });
    all.forEach(el => {
      if (el.offsetParent === null) return;                 // hidden
      const cs = getComputedStyle(el);
      const off = pageTop(el) % G;
      if (off){ el.style.marginTop = (parseFloat(cs.marginTop) + (G - off)) + 'px'; }
      if (!texts.includes(el)) return;
      // measure where the first line's baseline falls, then sit it on the next grid line
      const probe = document.createElement('span');
      probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
      el.insertBefore(probe, el.firstChild);
      const base = pageTop(probe) - pageTop(el);
      probe.remove();
      const shift = (Math.ceil(base / G) * G) - base;
      if (shift > 0){
        if (cs.position === 'static') el.style.position = 'relative';
        el.style.top = shift + 'px';
      }
    });
    // About page: headshot top lines up with the top of the "Isabel S. Park" name
    const photo = document.querySelector('.headshot'), name = document.querySelector('.name');
    if (photo && name && getComputedStyle(photo.parentElement).gridTemplateColumns.trim().split(/\s+/).length > 1){   // side-by-side layout only
      const nameTop = pageTop(name) + (parseFloat(name.style.top) || 0);
      const snapped = Math.round(nameTop / G) * G;
      const diff = snapped - pageTop(photo);
      if (diff) photo.style.marginTop = ((parseFloat(photo.style.marginTop) || 0) + diff) + 'px';
    }
  }
  let t;
  const go = () => { clearTimeout(t); t = setTimeout(run, 60); };
  window.addEventListener('load', () => { (document.fonts ? document.fonts.ready : Promise.resolve()).then(run); });
  window.addEventListener('resize', go);
})();

// ---- embed mode: PORTFOLIO_x.html?embed=1&only=id1,id2 ----
// Shows only the listed sub-projects (section-blocks) of a project page so the
// landing page can stack them under a category tab. Reports its height to the
// parent page so the frame can grow to fit (no inner scrollbar).
(function(){
  const q = new URLSearchParams(location.search);
  if (!q.get('embed')) return;
  document.documentElement.classList.add('embed');
  const ids = (q.get('only') || '').split(',').filter(Boolean);
  function apply(){
    document.querySelectorAll('.section-block').forEach(sb => {
      const keep = ids.includes(sb.id);
      if (!keep){ sb.remove(); return; }          // drop unused sections so their images/videos never download
      sb.classList.add('embed-keep', 'in');
    });
    document.querySelectorAll('.proj-hero, .browse-projects, .nav-back, footer').forEach(el => el.remove());
    // links inside open in the full window, not inside the frame
    document.querySelectorAll('a[href]').forEach(a => { if (!a.target) a.target = '_top'; });
    send();
  }
  let last = 0;
  function send(){
    const h = Math.ceil(document.documentElement.getBoundingClientRect().height);
    if (h !== last){ last = h; parent.postMessage({ type:'embedH', h, key: q.get('key') }, '*'); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
  window.addEventListener('load', send);
  if (window.ResizeObserver) new ResizeObserver(send).observe(document.documentElement);
  setInterval(send, 1500);   // catches late-loading images / embeds
})();

// ---- Browse Projects: horizontal slider with every other project ----
(function(){
  const PROJECTS = [
    ['PORTFOLIO_CRApage.html','Cambridge Redevelopment Authority','assets/images/cra-hero.jpg'],
    ['PORTFOLIO_HikariPage.html','Hikari Ferramentas','assets/images/hikari-ferramentas.webp'],
    ['PORTFOLIO_HelenaJangPage.html','Chef Helena','assets/images/helena-jang-hero.jpg'],
    ['PORTFOLIO_FilthyGorgeousPage.html','Filthy Gorgeous','assets/images/filthy-gorgeous-banner/01-full-banner-v1.jpg'],
    ['PORTFOLIO_KoreanMagicDustPage.html','Korean Magic Dust','assets/images/korean-magic-dust.webp'],
    ['PORTFOLIO_RogueDefensePage.html','Rogue Defense','assets/images/rogue-defense.jpg'],
    ['PORTFOLIO_BeyondBancardPage.html','Beyond Bancard','assets/images/beyond-bancard.jpg'],
    ['PORTFOLIO_KbappPage.html','K_bapp','assets/images/k-bapp.webp'],
    ['PORTFOLIO_DazeyShadesPage.html','Dazey Shades','assets/images/dazey-shades.jpg'],
    ['PORTFOLIO_MupyPage.html','Mupy','assets/images/mupy.jpg'],
    ['PORTFOLIO_MidwayCrusadePage.html','Midway Crusade','assets/images/midway-crusade.webp'],
    ['PORTFOLIO_YoMochiPage.html','Yo! Mochi','assets/images/yo-mochi.jpg'],
    ['PORTFOLIO_HiddenHillsPage.html','Hidden Hills','assets/images/hidden-hills.webp']
  ];
  function build(){
    const here = decodeURIComponent(location.pathname.split('/').pop());
    document.querySelectorAll('.browse-projects').forEach(sec => {
      const grid = sec.querySelector('.browse-grid');
      if (!grid || sec.querySelector('.browse-track')) return;
      // start with the projects after this one, wrap around, so each page shows different neighbours first
      const i = PROJECTS.findIndex(p => p[0] === here);
      const list = i >= 0 ? PROJECTS.slice(i + 1).concat(PROJECTS.slice(0, i)) : PROJECTS;
      const track = document.createElement('div');
      track.className = 'browse-track';
      track.innerHTML = list.map(([href, title, img]) =>
        '<a class="browse-card" href="' + href + '"><div class="browse-thumb"><img loading="lazy" decoding="async" src="' + img + '" alt="' + title + '"/></div>' +
        '<span class="browse-title">' + title + '</span></a>').join('');
      grid.replaceWith(track);
      const head = sec.querySelector('.section-title');
      const ctr = document.createElement('div');
      ctr.className = 'browse-controls';
      ctr.innerHTML =
        '<button class="browse-arrow prev" aria-label="Previous projects"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>' +
        '<button class="browse-arrow next" aria-label="More projects"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>';
      const bar = document.createElement('div');
      bar.className = 'browse-head';
      head.replaceWith(bar); bar.appendChild(head); bar.appendChild(ctr);
      const step = () => { const c = track.querySelector('.browse-card'); return c ? c.getBoundingClientRect().width + 28 : 300; };
      const prev = ctr.querySelector('.prev'), next = ctr.querySelector('.next');
      prev.onclick = () => track.scrollBy({ left: -step(), behavior: 'smooth' });
      next.onclick = () => track.scrollBy({ left:  step(), behavior: 'smooth' });
      const upd = () => {
        prev.disabled = track.scrollLeft < 4;
        next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 4;
      };
      track.addEventListener('scroll', upd, { passive:true }); window.addEventListener('resize', upd); upd();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
