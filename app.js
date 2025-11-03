const sections = document.querySelectorAll('.media-section');
const navDots  = document.querySelectorAll('.scroll-nav a');
const scroller = document.getElementById('scroller');

// === 공통 유틸: 비디오 0초로 안전 리셋 ===
function resetToStart(v) {
  const doReset = () => {
    try {
      // 일부 브라우저(iOS)에서 seekable 구간 시작점이 0이 아닐 수 있어 보정
      if (v.seekable && v.seekable.length > 0) {
        const start = v.seekable.start(0);
        v.currentTime = start || 0;
      } else {
        v.currentTime = 0;
      }
    } catch (_) {
      // 드문 케이스 보호
      v.currentTime = 0;
    }
  };

  // 메타데이터가 아직이면 로드 후에 0초 세팅
  if (v.readyState >= 1) {
    doReset();
  } else {
    v.addEventListener('loadedmetadata', doReset, { once: true });
  }
}

// === 재생/정지 관찰자: 섹션 나가면 무조건 0초 리셋 ===
const playObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const vids = entry.target.querySelectorAll('video.fullscreen-video');
    vids.forEach(v => {
      if (entry.isIntersecting) {
        // 화면 안: 부드럽게 재생
        v.classList.add('playing');
        // iOS/크롬 타이밍 이슈 방지용 rAF
        requestAnimationFrame(() => v.play().catch(() => {}));
      } else {
        // 화면 밖: 즉시 멈춤 + 0초 리셋 + 페이드아웃
        try { v.pause(); } catch {}
        v.classList.remove('playing');

        // 너무 빠른 스크롤에서 currentTime 적용 누락 방지:
        // 1) 즉시 시도
        resetToStart(v);
        // 2) 다음 프레임 한 번 더 보장
        requestAnimationFrame(() => resetToStart(v));
      }
    });
  });
}, { root: scroller, threshold: 0.65, rootMargin: '1px 0px 1px 0px' });

// === 도트/캡션 활성화 관찰자 ===
const dotObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navDots.forEach(a => a.classList.toggle('active', a.dataset.target === id));
      history.replaceState(null, '', `#${id}`);
      sections.forEach(s => s.classList.toggle('active', s === entry.target));
    }
  });
}, { root: scroller, threshold: 0.65, rootMargin: '1px 0px 1px 0px' });

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

// 스냅 보정(섹션 중앙에 가장 가까운 곳으로 스냅)
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
    if (!nearest) return;
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
  navDots.forEach(a => a.classList.toggle('active', a.dataset.target === first.id));

  // 스크롤 위치 살짝 보정(옵저버 트리거)
  scroller.scrollTo({ top: 10 });

  // 캡션 표시
  sections.forEach(s => s.classList.toggle('active', s === first));

  // 비디오 재생 준비
  const v = first.querySelector('video.fullscreen-video');
  if (v) {
    const showAndPlay = () => {
      resetToStart(v);             // 첫 섹션도 항상 처음부터
      v.classList.add('playing');
      v.play().catch(() => {});
    };
    if (v.readyState >= 2) showAndPlay();
    else {
      v.addEventListener('loadeddata', showAndPlay, { once: true });
      v.addEventListener('canplay', showAndPlay, { once: true });
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

// ✅ s1 비디오 종료 → 타이틀 페이드인 + 화면 디밍
  const introVideo = document.getElementById('introVideo');
  const introTitle = document.getElementById('introTitle');

  if (introVideo && introTitle) {
    const reveal = () => {
      introVideo.classList.add('video-dim'); // styles.css의 디밍 효과
      introTitle.classList.add('show');      // 타이틀 페이드인
    };

    // 정상적으로 'ended'가 올 때
    introVideo.addEventListener('ended', reveal, { once: true });

    // 브라우저별 ended 미발화 대비: 거의 끝나면(0.4s 남으면) 미리 노출
    let preShown = false;
    introVideo.addEventListener('timeupdate', () => {
      if (preShown) return;
      if (introVideo.duration && (introVideo.duration - introVideo.currentTime) < 0.4) {
        preShown = true;
        reveal();
      }
    });

    // 자동재생 차단 등으로 영상이 멈춘 경우 대비(3초 폴백)
    setTimeout(() => {
      if (!introTitle.classList.contains('show')) reveal();
    }, 3000);
  }
  // ===== Scroll Down: go to next section =====
(function(){
  const btn = document.getElementById('scrollDownBtn');
  if(!btn) return;

  // 스크롤 컨테이너(있으면 사용, 없으면 window 사용)
  const scroller = document.getElementById('scroller') || document.documentElement;
  const sections = Array.from(document.querySelectorAll('.media-section'));

  function getCurrentSectionIndex(){
    // 뷰포트 중앙과 가장 가까운 섹션을 현재 섹션으로 판단
    const centerY = (scroller === document.documentElement)
      ? window.innerHeight / 2
      : scroller.clientHeight / 2;

    let bestIdx = 0, bestDist = Infinity;
    sections.forEach((sec, i) => {
      const rect = (scroller === document.documentElement)
        ? sec.getBoundingClientRect()
        : sec.getBoundingClientRect(); // scroller 기준도 OK (fixed 레이아웃)
      const secCenter = rect.top + rect.height / 2;
      const dist = Math.abs(secCenter - centerY);
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    });
    return bestIdx;
  }

  function scrollToNext(){
    if (!sections.length) return;
    const idx = getCurrentSectionIndex();
    const next = sections[Math.min(idx + 1, sections.length - 1)];
    next.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  btn.addEventListener('click', scrollToNext);
})();

