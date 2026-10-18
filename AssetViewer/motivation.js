const COVER_FILENAMES = [
  "09ed6d5138c5f1960c63ebc19103ba95.jpg",
  "0f0f960addbcf62bc64c8f039b064a9b.jpg",
  "1a64929e7a70353afd31bed86f68162f.jpg",
  "26cca7448f8ae80bde69e90f4dfff1e0.jpg",
  "34d3b8f92687354e6683ed531804e947.jpg",
  "3803309c8909b8258cc0ab95be5274d8.jpg",
  "3e3aa71b6a0c09d8314048b7b52a2150.jpg",
  "501159f536ca42a9a46fe81a528872f3.jpg",
  "57d1c7014ddc4d849c243fed6ceafeb1.jpg",
  "58678a48d9fbef5691b56bb25e3cc56f.jpg",
  "5b1929096f59627322d9499442ead07a.jpg",
  "653786a94632faf88fa785a988f379f6.jpg",
  "6f256e63be4889761183386181b03bb5.jpg",
  "9adcce41a8439e5be5bac391bba2a354.jpg",
  "a4a81284c9a44ec747009090697469cc.jpg",
  "a64defc7fd881e921df07bad0ef1131c.jpg",
  "ad7c1d02f5f2beb7eb1c4876132ddb68.jpg",
  "be1fd70e394af7b9552d7e566da058cc.jpg",
  "c45b18a45c939f870f9218469dc26eab.jpg",
  "d6c6e9f0de724c2c33e452adca25e0ef.jpg",
  "d782af00f9f7e36b7bd89b01926f1c06.jpg",
  "d9410e51f35fa2706909fb749a0f4926.jpg",
  "dd08b103cd6f9bec861a5aa9089fc0b1.jpg",
  "download (1).png",
  "download (2).png",
  "download (3).png",
  "download.png",
  "e475fbb8524cd4a3fab802cdee39ce0f.jpg",
  "e91e7505955bda3d8994be149d1dd9eb.jpg"
];

const COVER_DIR = encodeURIComponent('cover page');
const COVER_IMAGES = COVER_FILENAMES.map(name => `assets/${COVER_DIR}/${encodeURIComponent(name)}`);
const COVER_ORDER = shuffleArray(COVER_IMAGES);

const VIDEO_SOURCES = [
  "assets/videos/1 (1).mp4",
  "assets/videos/1 (2).mp4",
  "assets/videos/1 (3).mp4",
  "assets/videos/1 (4).mp4",
  "assets/videos/1 (5).mp4",
  "assets/videos/1 (6).mp4",
  "assets/videos/1 (7).mp4",
  "assets/videos/1 (8).mp4",
  "assets/videos/1 (9).mp4",
  "assets/videos/1 (10).mp4",
  "assets/videos/1 (11).mp4",
  "assets/videos/1 (12).mp4",
  "assets/videos/1 (13).mp4",
  "assets/videos/1 (14).mp4",
  "assets/videos/1 (15).mp4",
  "assets/videos/1 (16).mp4",
  "assets/videos/1 (17).mp4",
  "assets/videos/1 (18).mp4",
  "assets/videos/1 (19).mp4",
  "assets/videos/1 (20).mp4",
  "assets/videos/1 (21).mp4",
  "assets/videos/1 (22).mp4",
  "assets/videos/1 (23).mp4",
  "assets/videos/1 (24).mp4",
  "assets/videos/1 (25).mp4",
  "assets/videos/1 (26).mp4",
  "assets/videos/1 (27).mp4",
  "assets/videos/1 (28).mp4",
  "assets/videos/1 (29).mp4",
  "assets/videos/1 (30).mp4",
  "assets/videos/1 (31).mp4",
  "assets/videos/1 (32).mp4",
  "assets/videos/1 (33).mp4",
  "assets/videos/1 (34).mp4",
  "assets/videos/1 (35).mp4",
  "assets/videos/1 (36).mp4",
  "assets/videos/1 (37).mp4",
  "assets/videos/1 (38).mp4",
  "assets/videos/1 (39).mp4",
  "assets/videos/1 (40).mp4",
  "assets/videos/1 (41).mp4",
  "assets/videos/1 (42).mp4",
  "assets/videos/1 (43).mp4",
  "assets/videos/1 (44).mp4"
];

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('motivationGrid');
  const modal = setupModal();
  renderReels(grid, modal);
});

function renderReels(container, modal) {
  if (!container) return;
  const fragment = document.createDocumentFragment();

  VIDEO_SOURCES.forEach((src, index) => {
    const card = document.createElement('article');
    card.className = 'motivation-card';
    card.tabIndex = 0;

    const thumb = document.createElement('div');
    thumb.className = 'motivation-thumb';
    assignCoverImage(thumb, index);

    const badge = document.createElement('span');
    badge.className = 'motivation-badge';
    badge.textContent = `Reel ${index + 1}`;

    thumb.appendChild(badge);
    card.appendChild(thumb);
    fragment.appendChild(card);

    card.addEventListener('click', () => openModal(modal, src, `Reel ${index + 1}`, index));
    card.addEventListener('keypress', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openModal(modal, src, `Reel ${index + 1}`, index);
      }
    });
  });

  container.appendChild(fragment);
}

function setupModal() {
  const modal = document.getElementById('motivationModal');
  if (!modal) return null;

  modal.innerHTML = `
    <div class="motivation-modal-layer">
      <div class="motivation-modal-inner">
        <button class="motivation-close" aria-label="Close">✕</button>
        <div class="motivation-modal-content">
          <button class="motivation-nav-btn motivation-nav-prev" data-action="prev" aria-label="Previous video">‹</button>
          <div class="motivation-modal-stage">
            <video class="motivation-modal-video" playsinline></video>
            <div class="motivation-modal-overlay">
              <div class="motivation-modal-progress">
                <div class="motivation-modal-progress-fill"></div>
              </div>
              <div class="motivation-modal-buttons">
                <button class="motivation-modal-btn" data-action="play" aria-label="Play or pause">❚❚</button>
                <button class="motivation-modal-btn" data-action="mute" aria-label="Mute or unmute">🔊</button>
                <input class="motivation-modal-volume" type="range" min="0" max="1" step="0.05" value="1" aria-label="Volume">
                <button class="motivation-modal-btn" data-action="replay" aria-label="Replay">↺</button>
                <span class="motivation-modal-time">00:00</span>
              </div>
            </div>
          </div>
          <button class="motivation-nav-btn motivation-nav-next" data-action="next" aria-label="Next video">›</button>
        </div>
        <div class="motivation-modal-caption">
          <span class="motivation-modal-title"></span>
        </div>
      </div>
    </div>`;

  const layer = modal.querySelector('.motivation-modal-layer');
  const stage = modal.querySelector('.motivation-modal-stage');
  const video = modal.querySelector('.motivation-modal-video');
  const closeBtn = modal.querySelector('.motivation-close');
  const prevBtn = modal.querySelector('[data-action="prev"]');
  const nextBtn = modal.querySelector('[data-action="next"]');
  const progressFill = modal.querySelector('.motivation-modal-progress-fill');
  const timeLabel = modal.querySelector('.motivation-modal-time');
  const titleLabel = modal.querySelector('.motivation-modal-title');
  const playBtn = modal.querySelector('[data-action="play"]');
  const muteBtn = modal.querySelector('[data-action="mute"]');
  const replayBtn = modal.querySelector('[data-action="replay"]');
  const volumeSlider = modal.querySelector('.motivation-modal-volume');

  const state = { 
    modal, 
    video, 
    progressFill, 
    timeLabel, 
    titleLabel, 
    playBtn, 
    muteBtn, 
    replayBtn, 
    volumeSlider,
    currentIndex: -1
  };

  prevBtn.addEventListener('click', event => {
    event.stopPropagation();
    navigateVideo(state, -1);
  });

  nextBtn.addEventListener('click', event => {
    event.stopPropagation();
    navigateVideo(state, 1);
  });

  stage.addEventListener('click', event => event.stopPropagation());
  layer.addEventListener('click', () => closeModal(state));
  closeBtn.addEventListener('click', () => closeModal(state));

  video.addEventListener('click', () => {
    if (video.paused) {
      playVideo(video).then(() => updateButtons(state));
    } else {
      video.pause();
      updateButtons(state);
    }
  });

  playBtn.addEventListener('click', () => {
    if (video.paused) {
      playVideo(video).then(() => updateButtons(state));
    } else {
      video.pause();
      updateButtons(state);
    }
  });

  muteBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    updateButtons(state);
  });

  replayBtn.addEventListener('click', () => {
    video.currentTime = 0;
    playVideo(video).catch(() => undefined);
    updateButtons(state);
  });

  volumeSlider.addEventListener('input', event => {
    const value = Number(event.target.value);
    video.volume = value;
    if (value === 0) {
      video.muted = true;
    } else if (video.muted) {
      video.muted = false;
    }
    updateButtons(state);
  });

  const updateProgress = () => {
    if (video.duration) {
      const ratio = video.currentTime / video.duration;
      progressFill.style.width = `${ratio * 100}%`;
      timeLabel.textContent = formatTime(video.currentTime);
      
      if (!video.paused && !video.ended) {
        state.progressRaf = requestAnimationFrame(updateProgress);
      } else {
        state.progressRaf = null;
      }
    }
  };

  video.addEventListener('play', () => {
    if (state.progressRaf === null) {
      state.progressRaf = requestAnimationFrame(updateProgress);
    }
  });

  video.addEventListener('pause', () => {
    if (state.progressRaf !== null) {
      cancelAnimationFrame(state.progressRaf);
      state.progressRaf = null;
    }
  });

  video.addEventListener('ended', () => {
    if (state.progressRaf !== null) {
      cancelAnimationFrame(state.progressRaf);
      state.progressRaf = null;
    }
    updateButtons(state);
  });

  video.addEventListener('loadedmetadata', () => {
    if (!video.paused && state.progressRaf === null) {
      state.progressRaf = requestAnimationFrame(updateProgress);
    }
  });

  document.addEventListener('keydown', event => {
    if (!modal.classList.contains('open')) return;
    
    if (event.key === 'Escape') {
      closeModal(state);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      navigateVideo(state, -1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      navigateVideo(state, 1);
    }
  });

  return state;
}

function openModal(state, src, label, index) {
  if (!state) return;
  const { modal, video, titleLabel } = state;
  if (modal.classList.contains('open') && video.src === src) return;

  state.currentIndex = index;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  titleLabel.textContent = label;
  video.src = src;
  video.currentTime = 0;
  playVideo(video).finally(() => updateButtons(state));
  updateNavButtons(state);
}

function navigateVideo(state, direction) {
  if (!state || state.currentIndex === -1) return;
  
  const newIndex = state.currentIndex + direction;
  if (newIndex < 0 || newIndex >= VIDEO_SOURCES.length) return;

  const src = VIDEO_SOURCES[newIndex];
  const label = `Reel ${newIndex + 1}`;
  openModal(state, src, label, newIndex);
}

function updateNavButtons(state) {
  if (!state) return;
  const prevBtn = state.modal.querySelector('[data-action="prev"]');
  const nextBtn = state.modal.querySelector('[data-action="next"]');
  
  if (prevBtn) {
    prevBtn.disabled = state.currentIndex <= 0;
    prevBtn.style.opacity = state.currentIndex <= 0 ? '0.3' : '1';
    prevBtn.style.cursor = state.currentIndex <= 0 ? 'not-allowed' : 'pointer';
  }
  
  if (nextBtn) {
    nextBtn.disabled = state.currentIndex >= VIDEO_SOURCES.length - 1;
    nextBtn.style.opacity = state.currentIndex >= VIDEO_SOURCES.length - 1 ? '0.3' : '1';
    nextBtn.style.cursor = state.currentIndex >= VIDEO_SOURCES.length - 1 ? 'not-allowed' : 'pointer';
  }
}

function closeModal(state) {
  if (!state) return;
  const { modal, video } = state;
  video.pause();
  video.currentTime = 0;
  video.src = '';
  
  // Cancel any pending animation frames
  if (state.progressRaf !== null) {
    cancelAnimationFrame(state.progressRaf);
    state.progressRaf = null;
  }
  
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

function playVideo(video) {
  video.muted = false;
  return video.play().catch(() => {
    video.muted = true;
    return video.play();
  });
}

function updateButtons(state) {
  const { video, playBtn, muteBtn, volumeSlider } = state;
  playBtn.textContent = video.paused ? '▶' : '❚❚';
  muteBtn.textContent = video.muted || video.volume === 0 ? '🔇' : '🔊';
  if (volumeSlider && !volumeSlider.matches(':focus')) {
    volumeSlider.value = video.muted ? 0 : video.volume;
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function assignCoverImage(element, index) {
  if (!COVER_ORDER.length) return;
  const coverSrc = COVER_ORDER[index % COVER_ORDER.length];
  const img = new Image();
  img.src = coverSrc;
  img.onload = () => {
    element.style.backgroundImage = `url('${coverSrc}')`;
  };
  img.onerror = () => {
    element.classList.add('motivation-thumb-fallback');
  };
}

function shuffleArray(source) {
  const array = [...source];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
