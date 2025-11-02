const sections = document.querySelectorAll('.media-section');
const navDots  = document.querySelectorAll('.scroll-nav a');
const scroller = document.getElementById('scroller');

// 비디오 자동 재생/정지
const playObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const vids = entry.target.querySelectorAll('video.fullscreen-video');
    vids.forEach(v => {
      if (entry.isIntersecting) {
        v.play().catch(() => {});
        v.classList.add('playing');
      } else {
        v.pause();
        v.classList.remove('playing');
      }
    });
  });
}, { root: scroller, threshold: 0.6, rootMargin: '1px 0px 1px 0px' });

// 도트 활성화 + 섹션 active 토글(캡션 표시 트리거)
const dotObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      // 도트 on/off
      navDots.forEach(a => a.classList.toggle('active', a.dataset.target === id));
      // URL 해시
      history.replaceState(null, '', `#${id}`);
      // 섹션 active(캡션 표시)
      sections.forEach(s => s.classList.toggle('active', s === entry.target));
    }
  });
}, { root: scroller, threshold: 0.6, rootMargin: '1px 0px 1px 0px' });

// 옵저버 등록
sections.forEach(sec => {
  playObserver.observe(sec);
  dotObserver.observe(sec);
});

// 도트 클릭 이동
navDots.forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById(a.dataset.target)?.scrollIntoView({ behavior: 'smooth' });
  });
});

// 스냅 보정
let isSnapping = false;
let snapTimeout;
scroller.addEventListener('scroll', () => {
  if (isSnapping) return;
  clearTimeout(snapTimeout);
  snapTimeout = setTimeout(() => {
    const rect = scroller.getBoundingClientRect();
    const centerY = rect.top + scroller.clientHeight / 2;
    const nearest = [...sections].map(s => {
      const r = s.getBoundingClientRect();
      return { el: s, d: Math.abs((r.top + r.height / 2) - centerY) };
    }).sort((a, b) => a.d - b.d)[0];
    isSnapping = true;
    nearest.el.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => { isSnapping = false; }, 600);
  }, 120);
}, { passive: true });

// 초기화(첫 섹션 도트/영상/캡션)
function initFirstSection() {
  const first = sections[0];
  if (!first) return;

  // 도트 활성화
  const id = first.id;
  navDots.forEach(a => a.classList.toggle('active', a.dataset.target === id));

  // 스크롤 위치 보정
  scroller.scrollTo({ top: 0 });

  // 섹션 active(캡션 표시)
  sections.forEach(s => s.classList.toggle('active', s === first));

  // 비디오 재생
  const v = first.querySelector('video.fullscreen-video');
  if (v) {
    const playNow = () => v.play().catch(() => {});
    const showNow = () => v.classList.add('playing');

    if (v.readyState >= 2) {
      showNow(); playNow();
    } else {
      v.addEventListener('loadeddata', () => { showNow(); playNow(); }, { once: true });
      v.addEventListener('canplay', () => { showNow(); playNow(); }, { once: true });
    }
  }
}

window.addEventListener('load', () => {
  initFirstSection();
  requestAnimationFrame(() => {
    playObserver.takeRecords();
    dotObserver.takeRecords();
  });
});
