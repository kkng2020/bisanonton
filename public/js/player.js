/**
 * BISA NONTON - Video Player Engine
 * Mendukung HLS (.m3u8), selector kualitas, navigasi episode serial,
 * auto-play next episode, live scrub preview ala Netflix,
 * overlay kontrol tengah (Mundur 10s, Play/Pause, Maju 10s),
 * dan fitur Remember Watch Progress menggunakan localStorage.
 */

class BisaPlayer {
  constructor() {
    // DOM Elements
    this.modal = document.getElementById('playerModal');
    this.videoContainer = document.getElementById('videoContainer');
    this.video = document.getElementById('main-video-element');
    this.closeBtn = document.getElementById('playerCloseBtn');
    this.playerTitle = document.getElementById('playerTitle');
    this.playerSubtitle = document.getElementById('playerSubtitle');
    this.loadingSpinner = document.getElementById('videoLoadingSpinner');

    // Center Controls Overlay
    this.centerControls = document.getElementById('centerControlsOverlay');
    this.centerBtnPlayPause = document.getElementById('centerBtnPlayPause');
    this.centerBtnRewind = document.getElementById('centerBtnRewind');
    this.centerBtnForward = document.getElementById('centerBtnForward');
    this.centerPlayIcon = document.getElementById('centerPlayIcon');

    // Live Seek Preview Tooltip (Netflix-Style)
    this.seekPreviewTooltip = document.getElementById('seekPreviewTooltip');
    this.seekPreviewVideo = document.getElementById('seekPreviewVideo');
    this.seekPreviewTime = document.getElementById('seekPreviewTime');

    // Bottom Controls Bar
    this.controlsBar = document.getElementById('customControlsBar');
    this.btnPlayPause = document.getElementById('btnPlayPause');
    this.btnPrevEp = document.getElementById('btnPrevEp');
    this.btnNextEp = document.getElementById('btnNextEp');
    this.timeDisplay = document.getElementById('timeDisplay');
    this.progressBar = document.getElementById('progressBar');
    this.progressFilled = document.getElementById('progressFilled');
    this.progressBuffer = document.getElementById('progressBuffer');
    this.progressThumb = document.getElementById('progressThumb');

    // Playback Speed Selector
    this.btnSpeed = document.getElementById('btnSpeed');
    this.speedMenu = document.getElementById('speedMenu');
    this.speedLabel = document.getElementById('currentSpeedLabel');
    this.currentSpeed = 1;

    // Quality Selector
    this.btnQuality = document.getElementById('btnQuality');
    this.qualityMenu = document.getElementById('qualityMenu');
    this.qualityLabel = document.getElementById('currentQualityLabel');

    // Volume & Fullscreen
    this.btnMute = document.getElementById('btnMute');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.btnFullscreen = document.getElementById('btnFullscreen');

    // Sidebar & Autoplay
    this.sidebar = document.getElementById('episodeSidebar');
    this.episodeList = document.getElementById('episodeList');
    this.episodeCountBadge = document.getElementById('episodeCountBadge');
    this.autoplayOverlay = document.getElementById('autoplayOverlay');
    this.autoplayNextTitle = document.getElementById('autoplayNextTitle');
    this.countdownBarFill = document.getElementById('countdownBarFill');
    this.autoplayPlayNowBtn = document.getElementById('autoplayPlayNowBtn');
    this.autoplayCancelBtn = document.getElementById('autoplayCancelBtn');

    // State Variables
    this.hls = null;
    this.previewHls = null;
    this.currentItem = null; // Movie or Series object
    this.currentEpisodeIndex = 0;
    this.autoplayTimer = null;
    this.controlsTimeout = null;
    this.isDraggingSeek = false;
    this.lastSaveTime = 0;

    this.initEvents();
  }

  initEvents() {
    // Modal Close
    this.closeBtn.addEventListener('click', () => this.close());

    // Play / Pause Toggle Buttons
    if (this.btnPlayPause) {
      this.btnPlayPause.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePlay();
      });
    }

    // Center Controls Overlay Action Buttons
    if (this.centerBtnPlayPause) {
      this.centerBtnPlayPause.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePlay();
      });
    }

    if (this.centerBtnRewind) {
      this.centerBtnRewind.addEventListener('click', (e) => {
        e.stopPropagation();
        this.skipTime(-10);
        this.pulseCenterBtn(this.centerBtnRewind);
      });
    }

    if (this.centerBtnForward) {
      this.centerBtnForward.addEventListener('click', (e) => {
        e.stopPropagation();
        this.skipTime(10);
        this.pulseCenterBtn(this.centerBtnForward);
      });
    }

    // Menekan area video: jika paused langsung play, jika playing munculkan kontrol tanpa pause
    this.videoContainer.addEventListener('click', (e) => {
      // Abaikan jika klik terjadi pada tombol kontrol langsung
      if (
        e.target.closest('.center-btn') || 
        e.target.closest('.custom-controls-bar') || 
        e.target.closest('.autoplay-countdown-overlay')
      ) {
        return;
      }

      // Jika video sedang dijeda / belum berputar -> Klik di mana saja pada layar video LANGSUNG PUTAR!
      if (this.video.paused || this.video.ended) {
        this.togglePlay();
        return;
      }

      // Jika video sedang berputar -> Klik video memunculkan/menyembunyikan overlay tanpa menghentikan video
      this.toggleControlsVisibility();
    });

    // Episode Prev / Next button
    if (this.btnPrevEp) {
      this.btnPrevEp.addEventListener('click', () => this.playPreviousEpisode());
    }
    if (this.btnNextEp) {
      this.btnNextEp.addEventListener('click', () => this.playNextEpisode());
    }

    // Volume & Mute
    if (this.btnMute) {
      this.btnMute.addEventListener('click', () => this.toggleMute());
    }
    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', (e) => {
        this.video.volume = parseFloat(e.target.value);
        this.video.muted = this.video.volume === 0;
        this.updateVolumeIcon();
      });
    }

    // Fullscreen
    if (this.btnFullscreen) {
      this.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
    }

    // Speed Menu Toggle
    if (this.btnSpeed && this.speedMenu) {
      this.btnSpeed.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.qualityMenu) this.qualityMenu.classList.remove('show');
        this.speedMenu.classList.toggle('show');
      });

      const speedOptions = this.speedMenu.querySelectorAll('.speed-option');
      speedOptions.forEach(opt => {
        opt.addEventListener('click', () => {
          const speed = parseFloat(opt.dataset.speed);
          this.setPlaybackSpeed(speed);
          this.speedMenu.classList.remove('show');
        });
      });
    }

    // Quality Menu Toggle
    if (this.btnQuality && this.qualityMenu) {
      this.btnQuality.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.speedMenu) this.speedMenu.classList.remove('show');
        this.qualityMenu.classList.toggle('show');
      });
    }

    document.addEventListener('click', (e) => {
      if (this.qualityMenu && !this.qualityMenu.contains(e.target) && e.target !== this.btnQuality) {
        this.qualityMenu.classList.remove('show');
      }
      if (this.speedMenu && !this.speedMenu.contains(e.target) && e.target !== this.btnSpeed) {
        this.speedMenu.classList.remove('show');
      }
    });

    // ========================================================
    // PROGRESS BAR & SCRUBBER (Mouse & Touch Dragging)
    // ========================================================
    // Mouse Seeking
    this.progressBar.addEventListener('mousedown', (e) => this.startSeek(e));
    window.addEventListener('mousemove', (e) => {
      if (this.isDraggingSeek) {
        this.doSeek(e.clientX);
      }
    });
    window.addEventListener('mouseup', () => this.endSeek());

    // Touch Seeking (Layar Sentuh iPhone / iPad / Android)
    this.progressBar.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        this.startSeekTouch(e);
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (this.isDraggingSeek && e.touches && e.touches.length > 0) {
        e.preventDefault(); // Mencegah scrolling halaman saat menggeser slider video
        this.doSeek(e.touches[0].clientX);
      }
    }, { passive: false });

    window.addEventListener('touchend', () => this.endSeek());

    // Desktop Hover Preview
    this.progressBar.addEventListener('mousemove', (e) => {
      if (!this.isDraggingSeek) {
        this.updateSeekPreview(e.clientX);
      }
    });

    this.progressBar.addEventListener('mouseleave', () => {
      if (!this.isDraggingSeek && this.seekPreviewTooltip) {
        this.seekPreviewTooltip.classList.remove('active');
      }
    });

    // ========================================================
    // VIDEO EVENT LISTENERS
    // ========================================================
    this.video.addEventListener('timeupdate', () => this.onTimeUpdate());
    this.video.addEventListener('progress', () => this.updateBuffer());
    this.video.addEventListener('waiting', () => this.showLoading(true));
    this.video.addEventListener('canplay', () => this.showLoading(false));
    this.video.addEventListener('loadeddata', () => this.showLoading(false));
    this.video.addEventListener('playing', () => {
      this.showLoading(false);
      this.updatePlayPauseIcons(true);
      this.videoContainer.classList.remove('is-paused');
      if (this.currentSpeed && this.currentSpeed !== 1) {
        this.video.playbackRate = this.currentSpeed;
      }
      this.resetControlsTimeout();
    });
    this.video.addEventListener('pause', () => {
      this.showLoading(false);
      this.updatePlayPauseIcons(false);
      this.videoContainer.classList.add('is-paused');
      this.showControls();
      this.saveWatchProgress();
    });
    this.video.addEventListener('ended', () => {
      this.videoContainer.classList.add('is-paused');
      this.onVideoEnded();
    });

    // Autoplay Next Episode overlay buttons
    if (this.autoplayPlayNowBtn) {
      this.autoplayPlayNowBtn.addEventListener('click', () => {
        this.cancelAutoplay();
        this.playNextEpisode();
      });
    }

    if (this.autoplayCancelBtn) {
      this.autoplayCancelBtn.addEventListener('click', () => {
        this.cancelAutoplay();
      });
    }

    // Idle controls hiding saat kursor bergerak di atas video
    this.videoContainer.addEventListener('mousemove', () => this.resetControlsTimeout());
    this.videoContainer.addEventListener('mouseleave', () => {
      if (!this.video.paused) {
        this.hideControls();
      }
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (!this.modal.classList.contains('active')) return;

      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        this.togglePlay();
      } else if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        this.skipTime(10);
        this.pulseCenterBtn(this.centerBtnForward);
      } else if (e.key === 'ArrowLeft' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        this.skipTime(-10);
        this.pulseCenterBtn(this.centerBtnRewind);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        this.toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        this.toggleMute();
      }
    });
  }

  // ========================================================
  // KONTROL TAMPILAN OVERLAY & TIMEOUT
  // ========================================================
  toggleControlsVisibility() {
    if (this.videoContainer.classList.contains('user-idle')) {
      this.showControls();
    } else {
      if (!this.video.paused) {
        this.hideControls();
      }
    }
  }

  showControls() {
    this.videoContainer.classList.remove('user-idle');
    this.resetControlsTimeout();
  }

  hideControls() {
    clearTimeout(this.controlsTimeout);
    this.videoContainer.classList.add('user-idle');
    if (this.seekPreviewTooltip) {
      this.seekPreviewTooltip.classList.remove('active');
    }
  }

  resetControlsTimeout() {
    this.videoContainer.classList.remove('user-idle');
    clearTimeout(this.controlsTimeout);
    this.controlsTimeout = setTimeout(() => {
      if (!this.video.paused) {
        this.hideControls();
      }
    }, 3200);
  }

  pulseCenterBtn(btn) {
    if (!btn) return;
    btn.classList.remove('skip-pulse');
    void btn.offsetWidth; // trigger reflow
    btn.classList.add('skip-pulse');
  }

  updatePlayPauseIcons(isPlaying) {
    const icon = isPlaying ? '⏸' : '▶';
    if (this.btnPlayPause) this.btnPlayPause.textContent = icon;
    if (this.centerPlayIcon) this.centerPlayIcon.textContent = icon;
  }

  // Buka Pemutar Film/Serial
  open(item, episodeIndex = null) {
    this.currentItem = item;
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    this.playerTitle.textContent = item.title;
    this.videoContainer.classList.add('is-paused');
    this.videoContainer.classList.remove('user-idle');
    this.updatePlayPauseIcons(false);
    this.showControls();

    if (item.type === 'series') {
      this.sidebar.classList.remove('hidden');

      // Tentukan episode mana yang diputar:
      // Gunakan episodeIndex jika diberikan, atau cek riwayat episode terakhir dari localStorage
      let targetIndex = 0;
      if (typeof episodeIndex === 'number' && episodeIndex >= 0) {
        targetIndex = episodeIndex;
      } else {
        try {
          const saved = localStorage.getItem(`bisanonton_progress_${item.id}`);
          if (saved) {
            const data = JSON.parse(saved);
            if (data && typeof data.episodeIndex === 'number' && data.episodeIndex < (item.episodes || []).length) {
              targetIndex = data.episodeIndex;
            }
          }
        } catch (e) {}
      }

      this.currentEpisodeIndex = targetIndex;
      this.renderEpisodeList();
      this.playEpisode(targetIndex);
    } else {
      this.currentEpisodeIndex = 0;
      this.sidebar.classList.add('hidden');
      this.playerSubtitle.textContent = item.genre || 'Film';
      if (this.btnPrevEp) this.btnPrevEp.disabled = true;
      if (this.btnNextEp) this.btnNextEp.disabled = true;
      this.loadStream(item.stream_url);
    }
  }

  // Muat stream URL menggunakan HLS.js
  loadStream(url) {
    this.cancelAutoplay();
    this.showLoading(true);

    if (!url) {
      this.showToast('Link video belum diisi untuk film / episode ini!');
      this.showLoading(false);
      return;
    }

    // Selalu pastikan instance HLS sebelumnya sudah dihancurkan sebelum memuat stream baru
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    if (this.previewHls) {
      this.previewHls.destroy();
      this.previewHls = null;
    }
    this.previewStreamLoaded = false;

    // Gunakan streaming proxy untuk link eksternal agar bebas dari blokir CORS CDN
    let streamUrl = url.trim();
    if (streamUrl.startsWith('http://') || streamUrl.startsWith('https://')) {
      streamUrl = `/api/proxy?url=${encodeURIComponent(streamUrl)}`;
    }

    // Simpan URL stream
    this.currentStreamUrl = streamUrl;

    // Cek apakah browser mendukung Hls.js
    if (Hls.isSupported()) {
      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      this.hls.loadSource(streamUrl);
      this.hls.attachMedia(this.video);

      this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        this.setupQualityLevels(this.hls.levels);
        this.showLoading(false);

        // Periksa dan lanjutkan riwayat episode spesifik ini
        this.checkResumeProgress();

        this.video.play().catch(err => {
          console.warn('Autoplay dibatasi browser:', err);
          this.showLoading(false);
          this.videoContainer.classList.add('is-paused');
          this.updatePlayPauseIcons(false);
        });
      });

      this.hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('HLS Network Error, mencoba memulihkan...', data);
              this.hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('HLS Media Error, mencoba recoverMediaError...', data);
              this.hls.recoverMediaError();
              break;
            default:
              console.error('HLS Fatal Error, stream tidak dapat diputar:', data);
              this.hls.destroy();
              this.showToast('Gagal memuat video. Pastikan link streaming aktif & dapat diakses.');
              break;
          }
        }
      });
    } 
    // Fallback untuk Safari atau browser dengan dukungan native HLS
    else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
      this.video.src = streamUrl;
      this.video.addEventListener('loadedmetadata', () => {
        this.video.play().catch(console.warn);
        this.checkResumeProgress();
      }, { once: true });
      if (this.qualityLabel) this.qualityLabel.textContent = 'Native';
      if (this.qualityMenu) this.qualityMenu.innerHTML = `<button class="quality-option active">Native Auto</button>`;
    } else {
      this.showToast('Browser Anda tidak mendukung pemutaran HLS video.');
    }
  }

  // Muat stream ke video preview sekunder untuk Netflix-style live thumbnail
  loadPreviewStream(streamUrl) {
    if (!this.seekPreviewVideo) return;

    if (this.previewHls) {
      this.previewHls.destroy();
      this.previewHls = null;
    }

    if (Hls.isSupported()) {
      this.previewHls = new Hls({
        enableWorker: false,
        lowLatencyMode: false,
        maxBufferLength: 10,
        maxMaxBufferLength: 20
      });
      this.previewHls.loadSource(streamUrl);
      this.previewHls.attachMedia(this.seekPreviewVideo);
    } else if (this.seekPreviewVideo.canPlayType('application/vnd.apple.mpegurl')) {
      this.seekPreviewVideo.src = streamUrl;
    }
  }

  // Render daftar episode di sidebar dengan progress spesifik tiap episode
  renderEpisodeList() {
    const episodes = this.currentItem.episodes || [];
    this.episodeCountBadge.textContent = `${episodes.length} Episode`;
    this.episodeList.innerHTML = '';

    if (episodes.length === 0) {
      this.episodeList.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.85rem;">
          Belum ada episode yang ditambahkan.
        </div>
      `;
      return;
    }

    const movieId = this.currentItem.id || this.currentItem.title;

    episodes.forEach((ep, idx) => {
      const isCurrent = idx === this.currentEpisodeIndex;
      const epKey = `bisanonton_prog_${movieId}_ep_${idx}`;

      let epProgData = null;
      try {
        const raw = localStorage.getItem(epKey);
        if (raw) epProgData = JSON.parse(raw);
      } catch (e) {}

      let statusText = isCurrent ? 'Sedang Diputar' : 'Putar';
      let progBarHtml = '';

      if (epProgData && epProgData.percent) {
        if (epProgData.percent >= 92) {
          statusText = '✓ Selesai Ditonton';
        } else if (epProgData.percent >= 3) {
          statusText = isCurrent 
            ? `Sedang Diputar • ${epProgData.percent}% (${this.formatTime(epProgData.time)})`
            : `Lanjutkan • ${epProgData.percent}% (${this.formatTime(epProgData.time)})`;
          progBarHtml = `
            <div class="episode-prog-track">
              <div class="episode-prog-fill" style="width: ${epProgData.percent}%;"></div>
            </div>
          `;
        }
      }

      const epEl = document.createElement('div');
      epEl.className = `episode-item ${isCurrent ? 'active' : ''}`;
      epEl.innerHTML = `
        <div class="episode-num-badge">${ep.episode_number || (idx + 1)}</div>
        <div class="episode-details">
          <div class="episode-name" title="${ep.title || `Episode ${idx + 1}`}">${ep.title || `Episode ${idx + 1}`}</div>
          <div class="episode-status">${statusText}</div>
          ${progBarHtml}
        </div>
      `;

      epEl.addEventListener('click', () => {
        if (idx !== this.currentEpisodeIndex) {
          this.playEpisode(idx);
        }
      });

      this.episodeList.appendChild(epEl);
    });
  }

  // Putar episode tertentu
  playEpisode(index) {
    const episodes = this.currentItem.episodes || [];
    if (index < 0 || index >= episodes.length) return;

    // 1. Simpan progress episode yang sedang ditonton sebelumnya
    this.saveWatchProgress();

    // 2. Hentikan video dan reset posisi waktu
    if (this.video) {
      this.video.pause();
      this.video.removeAttribute('src');
      this.video.currentTime = 0;
    }

    // 3. Hancurkan instance HLS lama agar tidak bentrok dengan stream episode baru
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    if (this.previewHls) {
      this.previewHls.destroy();
      this.previewHls = null;
    }
    this.previewStreamLoaded = false;

    this.currentEpisodeIndex = index;
    const currentEp = episodes[index];

    this.playerSubtitle.textContent = `${currentEp.title || `Episode ${index + 1}`}`;

    // Update active class & progress bar di sidebar
    this.renderEpisodeList();

    // Update prev/next button states
    if (this.btnPrevEp) this.btnPrevEp.disabled = index === 0;
    if (this.btnNextEp) this.btnNextEp.disabled = index === episodes.length - 1;

    // Load stream link episode baru
    this.loadStream(currentEp.stream_url);
  }

  playPreviousEpisode() {
    if (this.currentEpisodeIndex > 0) {
      this.playEpisode(this.currentEpisodeIndex - 1);
    }
  }

  playNextEpisode() {
    const episodes = this.currentItem.episodes || [];
    if (this.currentEpisodeIndex < episodes.length - 1) {
      this.playEpisode(this.currentEpisodeIndex + 1);
    }
  }

  // Ketika video selesai diputar (ended)
  onVideoEnded() {
    this.updatePlayPauseIcons(false);

    // Hapus riwayat progress tontonan karena video sudah tamat
    this.clearWatchProgress();

    // Jika serial dan masih ada episode berikutnya -> Jalankan Auto-Play
    if (this.currentItem && this.currentItem.type === 'series') {
      const episodes = this.currentItem.episodes || [];
      const nextIndex = this.currentEpisodeIndex + 1;

      if (nextIndex < episodes.length) {
        const nextEp = episodes[nextIndex];
        this.triggerAutoplayNext(nextEp, nextIndex);
      } else {
        this.showToast('Anda telah menyelesaikan semua episode serial ini! 🎉');
      }
    }
  }

  // Menjalankan countdown otomatis memutar episode selanjutnya
  triggerAutoplayNext(nextEp, nextIndex) {
    this.autoplayNextTitle.textContent = nextEp.title || `Episode ${nextIndex + 1}`;
    this.autoplayOverlay.classList.remove('hidden');

    this.countdownBarFill.style.transition = 'none';
    this.countdownBarFill.style.width = '100%';

    // Animate progress bar fill
    setTimeout(() => {
      this.countdownBarFill.style.transition = 'width 5s linear';
      this.countdownBarFill.style.width = '0%';
    }, 50);

    this.autoplayTimer = setTimeout(() => {
      this.cancelAutoplay();
      this.playEpisode(nextIndex);
    }, 5000);
  }

  cancelAutoplay() {
    if (this.autoplayTimer) {
      clearTimeout(this.autoplayTimer);
      this.autoplayTimer = null;
    }
    if (this.autoplayOverlay) {
      this.autoplayOverlay.classList.add('hidden');
    }
  }

  // Setup dropdown pilihan kualitas dari Hls.js
  setupQualityLevels(levels) {
    if (!this.qualityMenu || !this.qualityLabel) return;
    this.qualityMenu.innerHTML = '';

    if (!levels || levels.length === 0) {
      this.qualityLabel.textContent = 'Default';
      this.qualityMenu.innerHTML = `
        <button class="quality-option active">Default (Auto)</button>
      `;
      return;
    }

    // 1. Opsi Auto
    const autoBtn = document.createElement('button');
    autoBtn.className = `quality-option ${this.hls.currentLevel === -1 ? 'active' : ''}`;
    autoBtn.textContent = 'Auto (Otomatis)';
    autoBtn.addEventListener('click', () => {
      this.hls.currentLevel = -1;
      this.qualityLabel.textContent = 'Auto';
      this.updateQualityActiveBtn(autoBtn);
    });
    this.qualityMenu.appendChild(autoBtn);

    // 2. Daftar Level Kualitas
    levels.forEach((lvl, idx) => {
      const btn = document.createElement('button');
      const label = lvl.height ? `${lvl.height}p` : `${Math.round(lvl.bitrate / 1000)}k`;
      btn.className = `quality-option ${this.hls.currentLevel === idx ? 'active' : ''}`;
      btn.textContent = label;

      btn.addEventListener('click', () => {
        this.hls.currentLevel = idx;
        this.qualityLabel.textContent = label;
        this.updateQualityActiveBtn(btn);
      });

      this.qualityMenu.appendChild(btn);
    });
  }

  updateQualityActiveBtn(activeBtn) {
    const allBtns = this.qualityMenu.querySelectorAll('.quality-option');
    allBtns.forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
    this.qualityMenu.classList.remove('show');
  }

  // Play / Pause
  togglePlay() {
    if (this.video.paused || this.video.ended) {
      this.video.play().catch(err => {
        console.warn('Autoplay dibatasi browser:', err);
      });
      this.updatePlayPauseIcons(true);
      this.videoContainer.classList.remove('is-paused');
      this.resetControlsTimeout();
    } else {
      this.video.pause();
      this.updatePlayPauseIcons(false);
      this.videoContainer.classList.add('is-paused');
      this.showControls();
    }

    // Animasi pulse pada tombol play/pause di tengah
    if (this.centerBtnPlayPause) {
      this.centerBtnPlayPause.classList.remove('pulse-action');
      void this.centerBtnPlayPause.offsetWidth; // trigger reflow
      this.centerBtnPlayPause.classList.add('pulse-action');
    }
  }

  // Lompat waktu video (maju/mundur dalam detik)
  skipTime(seconds) {
    if (!this.video) return;
    const duration = this.video.duration || 0;
    const current = this.video.currentTime || 0;
    const newTime = Math.max(0, Math.min(duration, current + seconds));
    this.video.currentTime = newTime;
    this.onTimeUpdate();
    this.resetControlsTimeout();
    this.saveWatchProgress();

    // Animasi pulse pada tombol skip yang ditekan
    if (seconds < 0) {
      this.pulseCenterBtn(this.centerBtnRewind);
    } else {
      this.pulseCenterBtn(this.centerBtnForward);
    }
  }

  // Atur kecepatan pemutaran video (playback speed)
  setPlaybackSpeed(speed) {
    this.currentSpeed = speed;
    if (this.video) {
      this.video.playbackRate = speed;
    }
    if (this.speedLabel) {
      this.speedLabel.textContent = `${speed}x`;
    }
    if (this.speedMenu) {
      const options = this.speedMenu.querySelectorAll('.speed-option');
      options.forEach(opt => {
        if (parseFloat(opt.dataset.speed) === speed) {
          opt.classList.add('active');
        } else {
          opt.classList.remove('active');
        }
      });
    }
  }

  // Time & Progress Update
  onTimeUpdate() {
    if (this.isDraggingSeek) return;

    const current = this.video.currentTime || 0;
    const duration = this.video.duration || 0;

    const percent = duration > 0 ? (current / duration) * 100 : 0;
    this.progressFilled.style.width = `${percent}%`;
    this.progressThumb.style.left = `${percent}%`;

    this.timeDisplay.textContent = `${this.formatTime(current)} / ${this.formatTime(duration)}`;

    // Simpan progress tontonan ke localStorage setiap 3 detik
    const now = Date.now();
    if (now - this.lastSaveTime > 3000) {
      this.lastSaveTime = now;
      this.saveWatchProgress();
    }
  }

  updateBuffer() {
    const duration = this.video.duration;
    if (duration > 0 && this.video.buffered.length > 0) {
      const bufferedEnd = this.video.buffered.end(this.video.buffered.length - 1);
      const percent = (bufferedEnd / duration) * 100;
      this.progressBuffer.style.width = `${percent}%`;
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const m = mins < 10 ? `0${mins}` : mins;
    const s = secs < 10 ? `0${secs}` : secs;

    if (hrs > 0) {
      const h = hrs < 10 ? `0${hrs}` : hrs;
      return `${h}:${m}:${s}`;
    }
    return `${m}:${s}`;
  }

  // ========================================================
  // SEEKING & SCRUBBING (Touch & Mouse Support)
  // ========================================================
  startSeek(e) {
    this.isDraggingSeek = true;
    this.progressBar.classList.add('dragging');
    this.doSeek(e.clientX);
  }

  startSeekTouch(e) {
    e.preventDefault();
    this.isDraggingSeek = true;
    this.progressBar.classList.add('dragging');
    if (e.touches && e.touches[0]) {
      this.doSeek(e.touches[0].clientX);
    }
  }

  doSeek(clientX) {
    if (!this.isDraggingSeek) return;
    const rect = this.progressBar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const duration = this.video.duration || 0;
    const targetTime = pos * duration;

    this.progressFilled.style.width = `${pos * 100}%`;
    this.progressThumb.style.left = `${pos * 100}%`;
    this.timeDisplay.textContent = `${this.formatTime(targetTime)} / ${this.formatTime(duration)}`;

    // Live Scrub Preview
    this.updateSeekPreview(clientX);
  }

  updateSeekPreview(clientX) {
    if (!this.video || !this.video.duration || !this.seekPreviewTooltip) return;

    // Lazy load preview stream pada saat user pertama kali menggeser/hover scrubber
    if (this.currentStreamUrl && !this.previewStreamLoaded) {
      this.previewStreamLoaded = true;
      this.loadPreviewStream(this.currentStreamUrl);
    }

    const barRect = this.progressBar.getBoundingClientRect();
    const containerRect = this.videoContainer.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - barRect.left) / barRect.width));
    const targetTime = pos * this.video.duration;

    // Update label waktu
    if (this.seekPreviewTime) {
      this.seekPreviewTime.textContent = this.formatTime(targetTime);
    }

    // Update frame video preview secara instan
    if (this.seekPreviewVideo && !isNaN(targetTime)) {
      this.seekPreviewVideo.currentTime = targetTime;
    }

    // Posisikan tooltip di atas kursor/jari dengan clamping batas layar
    const relX = clientX - containerRect.left;
    const minX = 85;
    const maxX = containerRect.width - 85;
    const clampedX = Math.max(minX, Math.min(maxX, relX));

    this.seekPreviewTooltip.style.left = `${clampedX}px`;
    this.seekPreviewTooltip.classList.add('active');
  }

  endSeek() {
    if (!this.isDraggingSeek) return;
    this.isDraggingSeek = false;
    this.progressBar.classList.remove('dragging');

    const percent = parseFloat(this.progressFilled.style.width) / 100;
    if (!isNaN(percent) && this.video.duration) {
      this.video.currentTime = percent * this.video.duration;
      this.saveWatchProgress();
    }

    if (this.seekPreviewTooltip) {
      this.seekPreviewTooltip.classList.remove('active');
    }
  }

  // ========================================================
  // REMEMBER WATCH PROGRESS (LocalStorage Per-Device)
  // ========================================================
  getProgressKey() {
    if (!this.currentItem) return null;
    const id = this.currentItem.id || this.currentItem.title;
    if (this.currentItem.type === 'series') {
      return `bisanonton_prog_${id}_ep_${this.currentEpisodeIndex}`;
    }
    return `bisanonton_prog_${id}`;
  }

  saveWatchProgress() {
    if (!this.currentItem || !this.video || !this.video.duration) return;
    const current = this.video.currentTime || 0;
    const duration = this.video.duration || 0;
    const percent = (current / duration) * 100;
    const key = this.getProgressKey();
    if (!key) return;

    // Video sudah hampir selesai (> 92%) atau tamat -> bersihkan progress
    if (percent >= 92 || this.video.ended) {
      this.clearWatchProgress();
      return;
    }

    // Simpan jika sudah ditonton lebih dari 3 detik
    if (current > 3) {
      try {
        const data = {
          id: this.currentItem.id,
          title: this.currentItem.title,
          type: this.currentItem.type,
          episodeIndex: this.currentEpisodeIndex,
          episodeTitle: this.currentItem.type === 'series' && this.currentItem.episodes?.[this.currentEpisodeIndex] 
            ? this.currentItem.episodes[this.currentEpisodeIndex].title 
            : null,
          time: Math.floor(current),
          duration: Math.floor(duration),
          percent: Math.min(100, Math.max(1, Math.round(percent))),
          updatedAt: Date.now()
        };

        // 1. Simpan progress spesifik per-episode!
        localStorage.setItem(key, JSON.stringify(data));

        // 2. Simpan juga penanda episode terakhir aktif pada serial untuk kartu beranda & auto-resume serial
        if (this.currentItem.id) {
          localStorage.setItem(`bisanonton_progress_${this.currentItem.id}`, JSON.stringify(data));
        }

        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        // LocalStorage quota or privacy mode
      }
    }
  }

  clearWatchProgress() {
    const key = this.getProgressKey();
    if (!key) return;
    try {
      localStorage.removeItem(key);
      if (this.currentItem && this.currentItem.id) {
        if (this.currentItem.type === 'series') {
          const finishedData = {
            id: this.currentItem.id,
            title: this.currentItem.title,
            type: 'series',
            episodeIndex: this.currentEpisodeIndex,
            time: 0,
            percent: 100,
            completed: true,
            updatedAt: Date.now()
          };
          localStorage.setItem(`bisanonton_progress_${this.currentItem.id}`, JSON.stringify(finishedData));
        } else {
          localStorage.removeItem(`bisanonton_progress_${this.currentItem.id}`);
        }
      }
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  }

  checkResumeProgress() {
    const key = this.getProgressKey();
    if (!key) return false;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        // Episode ini belum pernah ditonton sebelumnya, pastikan mulai dari 00:00
        if (this.video) this.video.currentTime = 0;
        return false;
      }
      const data = JSON.parse(raw);
      if (data && data.time && data.time > 3) {
        // Jika durasi sudah diketahui dan progress bukan di akhir
        if (!this.video.duration || data.time < this.video.duration * 0.92) {
          this.video.currentTime = data.time;
          const label = this.currentItem.type === 'series'
            ? `Episode ${(this.currentEpisodeIndex + 1)} dari <strong>${this.formatTime(data.time)}</strong> ⏱️`
            : `dari <strong>${this.formatTime(data.time)}</strong> ⏱️`;
          this.showResumeToast(data.time, label);
          return true;
        }
      }
    } catch (e) {
      console.warn('Gagal membaca progress tontonan:', e);
    }
    return false;
  }

  showResumeToast(savedTime, customLabel = null) {
    const formatted = this.formatTime(savedTime);
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    if (!toast || !toastMsg) return;

    const labelText = customLabel || `dari <strong>${formatted}</strong> ⏱️`;
    toastMsg.innerHTML = `
      <span>Melanjutkan ${labelText}</span>
      <button id="btnRestartPlayback" style="margin-left:10px;padding:3px 9px;background:rgba(255,255,255,0.25);border:1px solid rgba(255,255,255,0.3);color:#fff;border-radius:4px;cursor:pointer;font-size:0.75rem;font-weight:700;">Ulang (00:00)</button>
    `;
    toast.classList.add('show');

    const restartBtn = document.getElementById('btnRestartPlayback');
    if (restartBtn) {
      restartBtn.onclick = (e) => {
        e.stopPropagation();
        if (this.video) {
          this.video.currentTime = 0;
          this.onTimeUpdate();
        }
        this.clearWatchProgress();
        toast.classList.remove('show');
        this.renderEpisodeList();
      };
    }

    setTimeout(() => {
      toast.classList.remove('show');
    }, 6000);
  }

  // Volume & Mute
  toggleMute() {
    this.video.muted = !this.video.muted;
    if (this.volumeSlider) {
      this.volumeSlider.value = this.video.muted ? 0 : (this.video.volume || 1);
    }
    this.updateVolumeIcon();
  }

  updateVolumeIcon() {
    if (!this.btnMute) return;
    if (this.video.muted || this.video.volume === 0) {
      this.btnMute.textContent = '🔇';
    } else if (this.video.volume < 0.5) {
      this.btnMute.textContent = '🔉';
    } else {
      this.btnMute.textContent = '🔊';
    }
  }

  // Fullscreen
  toggleFullscreen() {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (!fsEl) {
      const el = this.videoContainer;
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else if (el.webkitEnterFullscreen) {
        this.video.webkitEnterFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  showLoading(show) {
    if (!this.loadingSpinner) return;
    if (show) {
      this.loadingSpinner.classList.add('active');
    } else {
      this.loadingSpinner.classList.remove('active');
    }
  }

  showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  close() {
    this.saveWatchProgress();
    this.cancelAutoplay();
    this.video.pause();
    this.video.src = '';
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    if (this.previewHls) {
      this.previewHls.destroy();
      this.previewHls = null;
    }
    this.modal.classList.remove('active');
    this.videoContainer.classList.remove('is-paused');
    if (this.speedMenu) this.speedMenu.classList.remove('show');
    if (this.qualityMenu) this.qualityMenu.classList.remove('show');
    document.body.style.overflow = '';
  }
}

// Inisialisasi Player secara global
window.playerInstance = new BisaPlayer();
