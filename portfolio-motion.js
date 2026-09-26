/* Progressive enhancement only: all substantive content is readable without JS. */
(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  root.classList.add('has-interactions');
  const canAnimate = () => !reduced.matches && root.dataset.motion !== 'off';
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  const dock = document.createElement('nav');
  dock.className = 'chapter-dock';
  dock.setAttribute('aria-label', '章节快捷导航');
  [['top','概况'],['projects','作品'],['experience','实习'],['research','研究']].forEach(([id,label]) => {
    const a = document.createElement('a'); a.href = '#' + id; a.textContent = label; dock.append(a);
  });
  document.body.append(dock);
  let scrollFrame;
  const updateReading = () => {
    const max = root.scrollHeight - innerHeight;
    progress.style.setProperty('--read-progress', max > 0 ? String(Math.min(1,scrollY/max)) : '0');
    let active = 'top';
    document.querySelectorAll('.detail-section').forEach(section => { if (section.getBoundingClientRect().top < innerHeight * .45) active = section.id; });
    dock.querySelectorAll('a').forEach(a => { if (a.hash === '#' + active) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current'); });
  };
  const updateComposition = () => {
    document.querySelectorAll('.product-stage').forEach(stage => {
      const box = stage.getBoundingClientRect();
      const travel = Math.max(-1, Math.min(1, (box.top + box.height / 2 - innerHeight / 2) / innerHeight));
      stage.style.setProperty('--scroll-lift', canAnimate() ? (travel * 60).toFixed(2) + 'px' : '0px');
      stage.style.setProperty('--scroll-turn', canAnimate() ? (travel * 2.5).toFixed(2) + 'deg' : '0deg');
    });
  };
  const scheduleReading = () => { cancelAnimationFrame(scrollFrame); scrollFrame = requestAnimationFrame(() => { updateReading(); updateComposition(); }); };
  window.addEventListener('scroll', scheduleReading, {passive:true});
  window.addEventListener('resize', scheduleReading);
  updateReading();
  const stageAnimations = new Set();
  const overview = document.querySelector('.overview');
  if ('IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      entry.target.dataset.inView = String(entry.isIntersecting);
    }));
    heroObserver.observe(overview);
  }
  const mechanism = document.querySelector('.access-note');
  mechanism.querySelector('#access').hidden = true;
  mechanism.querySelectorAll('[data-panel]').forEach(button => button.addEventListener('click', () => {
    mechanism.querySelectorAll('[data-panel]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    mechanism.querySelectorAll('.mechanism-panel').forEach(panel => {
      panel.hidden = panel.id !== button.dataset.panel;
      if (!panel.hidden && canAnimate()) {
        const animation = panel.animate([{opacity:.3,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}], {duration:350,easing:'ease-out'});
        stageAnimations.add(animation); animation.onfinish = animation.oncancel = () => stageAnimations.delete(animation);
      }
    });
  }));
  if ('IntersectionObserver' in window) {
    const outcomesObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); outcomesObserver.unobserve(entry.target); }
    }), {threshold:.2});
    document.querySelectorAll('.outcomes').forEach(section => outcomesObserver.observe(section));
  }
  const unfold = stage => {
    if (!canAnimate() || !stage.animate) return;
    const angle = stage.closest('.campus') ? 1 : -1;
    const layers = [
      [stage.querySelector('.product-window'), [{transform:`translateY(24px) rotate(${angle*3}deg) scale(.97)`},{transform:`translateY(0) rotate(${angle}deg) scale(1)`}], 0],
      [stage.querySelector('.feature-sticker'), [{opacity:0,transform:'translateY(12px) rotate(-5deg)'},{opacity:1,transform:'translateY(0) rotate(-2deg)'}],180],
      [stage.closest('.project').querySelector('.project-copy'), [{opacity:.5,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],70]
    ];
    layers.forEach(([el,frames,delay]) => {
      el.getAnimations().forEach(a => a.cancel());
      const a = el.animate(frames,{duration:650,delay,easing:'cubic-bezier(.16,1,.3,1)'});
      stageAnimations.add(a); a.onfinish = a.oncancel = () => stageAnimations.delete(a);
    });
  };
  document.querySelectorAll('.product-stage').forEach(stage => {
    stage.dataset.preview = 'overview';
    stage.querySelectorAll('[data-preview]').forEach(button => button.addEventListener('click', () => {
      stage.dataset.preview = button.dataset.preview;
      stage.querySelectorAll('[data-preview]').forEach(b => b.setAttribute('aria-pressed',String(b===button)));
    }));
  });
  if ('IntersectionObserver' in window) {
    const seen = new WeakSet();
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      entry.target.dataset.inView = String(entry.isIntersecting);
      if (entry.isIntersecting && !seen.has(entry.target)) { unfold(entry.target); seen.add(entry.target); }
    }),{threshold:.2});
    document.querySelectorAll('.product-stage').forEach(stage => observer.observe(stage));
  }
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  document.querySelectorAll('.product-stage').forEach(stage => {
    const windowCard = stage.querySelector('.product-window');
    let frame;
    stage.addEventListener('pointermove', event => {
      if (!canAnimate() || !finePointer.matches) return;
      const rect = stage.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - .5) * 4;
      const y = ((event.clientY - rect.top) / rect.height - .5) * 4;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        windowCard.style.setProperty('--px', x.toFixed(2) + 'px');
        windowCard.style.setProperty('--py', y.toFixed(2) + 'px');
      });
    });
    stage.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      windowCard.style.removeProperty('--px');
      windowCard.style.removeProperty('--py');
    });
  });
  const copyButton = document.querySelector('.copy-email');
  copyButton.addEventListener('click', async () => {
    const status = document.querySelector('.copy-status');
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText('saintyoung@sjtu.edu.cn');
      status.textContent = '邮箱已复制';
    } catch {
      status.textContent = '请选中上方邮箱，手动复制';
    }
  });
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'motion-toggle';
  const updateToggle = () => {
    if (!canAnimate()) stageAnimations.forEach(animation => animation.cancel());
    updateComposition();
    toggle.disabled = reduced.matches;
    toggle.textContent = reduced.matches ? '已遵循系统减少动效' : root.dataset.motion === 'off' ? '开启动效' : '暂停动效';
    toggle.setAttribute('aria-pressed', String(root.dataset.motion === 'off' || reduced.matches));
  };
  toggle.addEventListener('click', () => { root.dataset.motion = root.dataset.motion === 'off' ? 'on' : 'off'; updateToggle(); });
  reduced.addEventListener('change', updateToggle);
  document.querySelector('footer').append(toggle);
  updateToggle();
  if ('IntersectionObserver' in window) {
    const sections = [...document.querySelectorAll('.detail-section')];
    const arrival = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { if (canAnimate()) entry.target.classList.add('section-arrive'); arrival.unobserve(entry.target); }
    }), { threshold: 0.05 });
    sections.forEach(section => arrival.observe(section));
    const nav = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      document.querySelectorAll('.topbar nav a').forEach(a => {
        if (a.hash === `#${entry.target.id}`) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    }), { rootMargin:'0px 0px -65% 0px', threshold:0 });
    sections.forEach(section => nav.observe(section));
  }
  // Keep the native details semantics and default-open state; animate only its body.
  document.querySelectorAll('.research-card').forEach(details => {
    const summary = details.querySelector('summary');
    const body = details.querySelector('.research-body');
    let animation;
    let desiredOpen = details.open;
    summary.addEventListener('click', event => {
      if (!canAnimate() || !body.animate) return;
      event.preventDefault();
      desiredOpen = !desiredOpen;
      if (animation) animation.cancel();
      if (desiredOpen) details.open = true;
      const height = body.scrollHeight;
      animation = body.animate(desiredOpen
        ? [{maxHeight:'0px', opacity:0, transform:'translateY(-8px)'}, {maxHeight:`${height}px`, opacity:1, transform:'translateY(0)'}]
        : [{maxHeight:`${height}px`, opacity:1}, {maxHeight:'0px', opacity:0}],
      {duration:260, easing:'ease-out'});
      body.style.overflow = 'hidden';
      animation.onfinish = () => { details.open = desiredOpen; body.style.overflow = ''; animation = null; };
      animation.oncancel = () => { body.style.overflow = ''; };
    });
    details.addEventListener('toggle', () => { if (!animation) desiredOpen = details.open; });
  });
})();
