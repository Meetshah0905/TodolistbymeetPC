// Background Music Player - Works across all pages
(function () {
  'use strict';

  // Extract video ID from YouTube URL - IMPROVED
  function extractVideoId(url) {
    if (!url) return null;

    // Try multiple patterns
    let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (match && match[1]) {
      const videoId = match[1].substring(0, 11); // YouTube IDs are 11 characters
      console.log('Extracted video ID:', videoId);
      return videoId;
    }

    // Fallback pattern
    match = url.match(/[?&]v=([^&#]+)/);
    if (match && match[1]) {
      const videoId = match[1].substring(0, 11);
      console.log('Extracted video ID (fallback):', videoId);
      return videoId;
    }

    console.error('Could not extract video ID from URL:', url);
    return null;
  }

  // Background music tracks
  const tracks = [
    {
      id: 'gentle-rain',
      name: 'Gentle Rain',
      url: 'https://www.youtube.com/watch?v=q76bMs-NwRk&pp=ygUKcmFpbiBhc21yIA%3D%3D',
      icon: '🌧️'
    },
    {
      id: 'soothing-rain',
      name: 'Soothing Rain',
      url: 'https://www.youtube.com/watch?v=J4d-a7dVtiQ&pp=ygUKcmFpbiBhc21yIA%3D%3D',
      icon: '🌧️'
    },
    {
      id: 'fire-relaxing',
      name: 'Fire Relaxing',
      url: 'https://www.youtube.com/watch?v=UgHKb_7884o&pp=ygUJZmlyZSBhc21y',
      icon: '🔥'
    },
    {
      id: 'tranquil-fire',
      name: 'Tranquil Fire',
      url: 'https://www.youtube.com/watch?v=4ApMS8qYWo0&pp=ygUJZmlyZSBhc21y',
      icon: '🔥'
    }
  ];

  // State management
  const state = {
    currentTrack: null,
    isPlaying: false,
    player: null,
    audioElement: null,
    volume: 50,
    iframe: null
  };

  // Load state from localStorage
  function loadState() {
    try {
      const stored = localStorage.getItem('bgMusicState');
      if (stored) {
        const data = JSON.parse(stored);
        state.currentTrack = data.currentTrack || null;
        state.isPlaying = data.isPlaying || false;
        state.volume = data.volume !== undefined ? data.volume : 50;
      }
    } catch (e) {
      console.warn('Failed to load music state:', e);
    }
  }

  // Save state to localStorage
  function saveState() {
    try {
      localStorage.setItem('bgMusicState', JSON.stringify({
        currentTrack: state.currentTrack,
        isPlaying: state.isPlaying,
        volume: state.volume
      }));
    } catch (e) {
      console.warn('Failed to save music state:', e);
    }
  }

  // Initialize YouTube IFrame API
  let ytApiReady = false;
  let ytApiLoading = false;
  let ytApiCheckAttempts = 0;
  const MAX_API_CHECK_ATTEMPTS = 100;

  function initYouTubeAPI() {
    if (window.YT && window.YT.Player) {
      ytApiReady = true;
      console.log('YouTube API already available');
      return true;
    }

    if (ytApiLoading) {
      return false;
    }

    // Set up global callback FIRST (before loading script)
    if (!window.onYouTubeIframeAPIReady) {
      window.onYouTubeIframeAPIReady = function () {
        ytApiReady = true;
        ytApiLoading = false;
        console.log('✅ YouTube API ready!');
        if (state.currentTrack && state.isPlaying) {
          setTimeout(() => {
            createPlayer();
          }, 300);
        }
      };
    }

    // Load YouTube IFrame API if not already loaded
    if (!document.getElementById('youtube-api-script')) {
      ytApiLoading = true;
      console.log('Loading YouTube IFrame API...');
      const tag = document.createElement('script');
      tag.id = 'youtube-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      // Fallback check if callback doesn't fire
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          if (!ytApiReady) {
            ytApiReady = true;
            ytApiLoading = false;
            console.log('✅ YouTube API detected via fallback check');
            if (state.currentTrack && state.isPlaying) {
              setTimeout(() => {
                createPlayer();
              }, 300);
            }
          }
          clearInterval(checkInterval);
        }
        ytApiCheckAttempts++;
        if (ytApiCheckAttempts >= MAX_API_CHECK_ATTEMPTS) {
          clearInterval(checkInterval);
          console.error('❌ YouTube API failed to load');
        }
      }, 100);
    }

    return false;
  }

  // Create YouTube player - DIRECT EMBED with video and audio
  function createPlayer() {
    if (!state.currentTrack) {
      console.warn('No track selected');
      return;
    }

    const videoId = extractVideoId(state.currentTrack.url);
    if (!videoId) {
      console.error('Invalid YouTube URL:', state.currentTrack.url);
      showError('Invalid video URL');
      return;
    }

    // Remove existing player if any
    const existingPlayer = document.getElementById('bgMusicPlayer');
    if (existingPlayer) {
      if (state.player && typeof state.player.destroy === 'function') {
        try {
          state.player.destroy();
        } catch (e) {
          console.warn('Error destroying player:', e);
        }
      }
      existingPlayer.remove();
      state.player = null;
    }

    // Create INVISIBLE player container - audio only mode
    const playerContainer = document.createElement('div');
    playerContainer.id = 'bgMusicPlayer';
    // Make it invisible but present in DOM for API to work
    playerContainer.style.cssText = `
      position: fixed;
      bottom: 0;
      right: 0;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
      z-index: -1;
      visibility: hidden;
    `;
    document.body.appendChild(playerContainer);

    console.log('Creating YouTube player for:', state.currentTrack.name, 'Video ID:', videoId);

    // Initialize YouTube API if not ready
    if (!ytApiReady) {
      console.log('YouTube API not ready, initializing...');
      initYouTubeAPI();

      // Wait for API to be ready
      const checkInterval = setInterval(() => {
        if (ytApiReady) {
          clearInterval(checkInterval);
          createPlayer(); // Retry after API is ready
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (!ytApiReady) {
          showError('YouTube API failed to load. Please refresh.');
        }
      }, 10000);
      return;
    }

    try {
      // Create player with SIMPLIFIED configuration to fix Error 153
      console.log('Creating YT.Player with videoId:', videoId);

      // IMPORTANT: Don't set origin parameter - it causes Error 153
      // especially when running from file:// or localhost
      console.log('Creating player without origin parameter to avoid Error 153');

      // Simplified playerVars - only essential parameters, NO origin
      state.player = new YT.Player('bgMusicPlayer', {
        height: '169',
        width: '300',
        videoId: videoId,
        playerVars: {
          autoplay: state.isPlaying ? 1 : 0,
          loop: 1,
          playlist: videoId,
          controls: 1,
          mute: 0,
          enablejsapi: 1
          // DO NOT include origin - causes Error 153
        },
        events: {
          onReady: function (event) {
            console.log('✅ YouTube player ready for:', state.currentTrack.name);
            try {
              // Set volume
              event.target.setVolume(state.volume);
              console.log('Volume set to:', state.volume);

              // Unmute to ensure audio plays
              event.target.unMute();
              console.log('Audio unmuted');

              // Try to play immediately if state says it should be playing
              if (state.isPlaying) {
                console.log('Attempting to play video with audio...');
                // Small delay to ensure player is fully ready
                setTimeout(() => {
                  try {
                    // Unmute again before playing
                    event.target.unMute();
                    event.target.playVideo();
                    console.log('Play command sent - video should start playing');

                    // Verify playback after delay
                    setTimeout(() => {
                      try {
                        const playerState = event.target.getPlayerState();
                        const isMuted = event.target.isMuted();
                        console.log('Player state after play:', playerState, getStateName(playerState));
                        console.log('Is muted:', isMuted);

                        if (isMuted) {
                          console.log('⚠️ Player is muted - unmuting...');
                          event.target.unMute();
                        }

                        if (playerState === YT.PlayerState.PLAYING) {
                          console.log('✅ Video is playing with audio!');
                          state.isPlaying = true;
                          saveState();
                          updateUI();
                        } else if (playerState === YT.PlayerState.CUED || playerState === YT.PlayerState.UNSTARTED) {
                          console.log('⚠️ Video cued but not playing - user may need to click play');
                          // Keep isPlaying as true - user can click play button in the player
                        } else if (playerState === YT.PlayerState.BUFFERING) {
                          console.log('⏳ Video is buffering...');
                          // Wait a bit more
                          setTimeout(() => {
                            const newState = event.target.getPlayerState();
                            if (newState === YT.PlayerState.PLAYING) {
                              console.log('✅ Started playing after buffering!');
                              event.target.unMute(); // Ensure unmuted
                              state.isPlaying = true;
                              saveState();
                              updateUI();
                            }
                          }, 2000);
                        }
                      } catch (e) {
                        console.error('Error checking state:', e);
                      }
                    }, 2000);
                  } catch (e) {
                    console.error('Error playing video:', e);
                    console.log('User can click play button in the player');
                  }
                }, 500);
              } else {
                console.log('Player ready - waiting for user to click play');
              }
            } catch (e) {
              console.error('Error in onReady:', e);
            }
            updateUI();
          },
          onStateChange: function (event) {
            const stateName = getStateName(event.data);
            console.log('Player state changed:', event.data, stateName);

            if (event.data === YT.PlayerState.ENDED) {
              try {
                event.target.playVideo();
              } catch (e) {
                console.error('Error restarting:', e);
              }
            } else if (event.data === YT.PlayerState.PLAYING) {
              state.isPlaying = true;
              saveState();
              updateUI();
              console.log('✅ Now playing! Video with audio will continue in background.');

              // Ensure audio is unmuted - CRITICAL
              try {
                const isMuted = event.target.isMuted();
                console.log('Player muted status:', isMuted);
                if (isMuted) {
                  event.target.unMute();
                  console.log('✅ Unmuted player - audio should now be audible');
                } else {
                  console.log('✅ Player is already unmuted - audio should be playing');
                }

                // Double check volume
                const currentVolume = event.target.getVolume();
                console.log('Player volume:', currentVolume);
                if (currentVolume === 0) {
                  event.target.setVolume(state.volume);
                  console.log('Volume was 0, set to:', state.volume);
                }
              } catch (e) {
                console.warn('Could not check mute/volume status:', e);
              }
            } else if (event.data === YT.PlayerState.PAUSED) {
              state.isPlaying = false;
              saveState();
              updateUI();
              console.log('⏸️ Paused');
            } else if (event.data === YT.PlayerState.BUFFERING) {
              console.log('⏳ Buffering...');
            } else if (event.data === YT.PlayerState.ENDED) {
              // Restart if ended (should loop but just in case)
              try {
                event.target.playVideo();
              } catch (e) {
                console.error('Error restarting:', e);
              }
            }
          },
          onError: function (event) {
            console.error('❌ YouTube player error:', event.data);
            let errorMsg = 'Error loading video. ';
            switch (event.data) {
              case 2: errorMsg += 'Invalid video ID.'; break;
              case 5: errorMsg += 'HTML5 player error.'; break;
              case 100: errorMsg += 'Video not found.'; break;
              case 101:
              case 150: errorMsg += 'Playback not allowed.'; break;
              case 153:
                errorMsg += 'Configuration error. Retrying...';
                console.log('Error 153 - Retrying with simpler config...');
                // Retry with simpler config
                setTimeout(() => {
                  if (state.currentTrack && state.player) {
                    try {
                      state.player.destroy();
                    } catch (e) { }
                    state.player = null;
                    createPlayer();
                  }
                }, 1000);
                break;
              default: errorMsg += 'Error code: ' + event.data;
            }
            if (event.data !== 153) {
              showError(errorMsg);
            } else {
              console.log(errorMsg);
            }
          }
        }
      });
    } catch (e) {
      console.error('❌ Error creating YouTube player:', e);
      showError('Failed to create player: ' + e.message);
    }
  }

  // Helper to get state name
  function getStateName(state) {
    if (!window.YT) return 'Unknown';
    const states = {
      [-1]: 'UNSTARTED',
      [0]: 'ENDED',
      [1]: 'PLAYING',
      [2]: 'PAUSED',
      [3]: 'BUFFERING',
      [5]: 'CUED'
    };
    return states[state] || 'UNKNOWN';
  }

  // Show error message
  function showError(message) {
    console.error('Error:', message);
    const currentTrackEl = document.getElementById('bgMusicCurrentTrack');
    if (currentTrackEl) {
      const originalText = currentTrackEl.textContent;
      currentTrackEl.textContent = `⚠️ ${message}`;
      currentTrackEl.style.color = 'var(--danger)';
      currentTrackEl.style.display = 'block';
      setTimeout(() => {
        if (state.currentTrack) {
          currentTrackEl.textContent = `${state.currentTrack.icon} ${state.currentTrack.name}`;
        } else {
          currentTrackEl.textContent = originalText;
        }
        currentTrackEl.style.color = '';
      }, 5000);
    }
  }

  // Get audio stream URL from YouTube (using yt-dlp service or similar)
  async function getAudioStreamUrl(youtubeUrl) {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Try multiple methods to get audio stream
    // Method 1: Use a public YouTube audio extraction service
    // Note: These services may have rate limits or restrictions
    try {
      // Using yt-dlp compatible service or direct YouTube stream
      // For now, we'll use YouTube's embed URL with audio-only parameters
      // This requires the YouTube IFrame API but with better configuration

      // Alternative: Use a service like youtubeinmp3 or similar
      // For client-side only, we'll use YouTube's own audio stream
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&enablejsapi=1&iv_load_policy=3&playsinline=1&mute=0`;
    } catch (e) {
      console.error('Error getting audio stream:', e);
      throw e;
    }
  }

  // Play selected track using HTML5 Audio with YouTube stream
  async function playTrack(track) {
    console.log('🎵 Playing track:', track.name);
    state.currentTrack = track;
    state.isPlaying = true;
    saveState();
    updateUI();

    const videoId = extractVideoId(track.url);
    if (!videoId) {
      showError('Invalid YouTube URL');
      return;
    }

    // Stop existing audio if playing
    if (state.audioElement) {
      state.audioElement.pause();
      state.audioElement = null;
    }

    // Stop YouTube player if exists
    if (state.player) {
      try {
        state.player.stopVideo();
        state.player.pauseVideo();
      } catch (e) {
        console.warn('Error stopping YouTube player:', e);
      }
    }

    // Create audio element for background playback
    const audio = document.createElement('audio');
    audio.id = 'bgMusicAudio';
    audio.loop = true;
    audio.volume = state.volume / 100;
    audio.preload = 'auto';

    // Use YouTube's audio stream via a proxy service
    // For now, we'll use the YouTube IFrame API but ensure it works
    // The real solution requires a backend service to extract audio

    // Try using YouTube's direct stream (may not work due to CORS)
    // audio.src = `https://www.youtube.com/get_video_info?video_id=${videoId}`;

    // Better approach: Use YouTube IFrame API but ensure it plays
    if (!ytApiReady) {
      console.log('API not ready, initializing...');
      initYouTubeAPI();
      const checkInterval = setInterval(() => {
        if (ytApiReady) {
          clearInterval(checkInterval);
          createPlayer();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!ytApiReady) {
          showError('YouTube API failed to load. Please refresh.');
        }
      }, 10000);
      return;
    }

    // Use YouTube IFrame API
    if (state.player && ytApiReady) {
      try {
        console.log('Loading new video into existing player:', videoId);
        state.player.loadVideoById({
          videoId: videoId,
          startSeconds: 0
        });
        state.player.setLoop(true);
        state.player.setVolume(state.volume);

        // Try to play after video loads
        setTimeout(() => {
          try {
            const playerState = state.player.getPlayerState();
            console.log('Player state before play:', playerState, getStateName(playerState));

            // Set loop and volume first
            state.player.setLoop(true);
            state.player.setVolume(state.volume);

            // Then play
            state.player.playVideo();
            console.log('Play command sent for loaded video');

            // Check if it actually started playing
            setTimeout(() => {
              try {
                const newState = state.player.getPlayerState();
                console.log('Player state after play:', newState, getStateName(newState));
                if (newState === YT.PlayerState.PLAYING) {
                  console.log('✅ Video is playing! Will continue in background.');
                  state.isPlaying = true;
                  saveState();
                  updateUI();
                } else if (newState === YT.PlayerState.BUFFERING) {
                  console.log('⏳ Buffering...');
                  // Check again
                  setTimeout(() => {
                    const finalState = state.player.getPlayerState();
                    if (finalState === YT.PlayerState.PLAYING) {
                      state.isPlaying = true;
                      saveState();
                      updateUI();
                    }
                  }, 2000);
                } else {
                  console.log('⚠️ Playback may require user interaction - click play button');
                }
              } catch (e) {
                console.error('Error checking playback state:', e);
              }
            }, 1500);
          } catch (e) {
            console.error('Error playing:', e);
            // Don't show error - user can click play button
          }
        }, 800);
      } catch (e) {
        console.error('Error loading video:', e);
        // Recreate player
        createPlayer();
      }
    } else {
      // Create new player
      console.log('Creating new YouTube player...');
      createPlayer();
    }
  }

  // Stop playback
  function stopPlayback() {
    console.log('⏹️ Stopping playback');
    state.isPlaying = false;
    state.currentTrack = null;
    saveState();

    // Stop audio element
    if (state.audioElement) {
      try {
        state.audioElement.pause();
        state.audioElement.currentTime = 0;
        state.audioElement = null;
      } catch (e) {
        console.error('Error stopping audio:', e);
      }
    }

    // Stop YouTube player
    if (state.player) {
      try {
        state.player.stopVideo();
        state.player.pauseVideo();
      } catch (e) {
        console.error('Error stopping:', e);
      }
    }

    // Remove player element
    const existingPlayer = document.getElementById('bgMusicPlayer');
    if (existingPlayer) {
      if (state.player && typeof state.player.destroy === 'function') {
        try {
          state.player.destroy();
        } catch (e) {
          console.warn('Error destroying player:', e);
        }
      }
      existingPlayer.remove();
      state.player = null;
    }

    // Remove audio element
    const existingAudio = document.getElementById('bgMusicAudio');
    if (existingAudio) {
      existingAudio.remove();
    }

    updateUI();
  }

  // Toggle play/pause
  function togglePlayback() {
    console.log('🔄 Toggle playback, current state:', state.isPlaying);

    if (!state.currentTrack) {
      showError('Please select a track first');
      return;
    }

    if (state.isPlaying) {
      // Pause
      if (state.player && ytApiReady) {
        try {
          state.player.pauseVideo();
          state.isPlaying = false;
          saveState();
          updateUI();
          console.log('⏸️ Paused');
        } catch (e) {
          console.error('Error pausing:', e);
          showError('Error pausing');
        }
      } else {
        state.isPlaying = false;
        saveState();
        updateUI();
      }
    } else {
      // Play
      console.log('▶️ Attempting to play...');
      state.isPlaying = true;
      saveState();

      if (state.player && ytApiReady) {
        try {
          const playerState = state.player.getPlayerState();
          console.log('Current player state:', playerState, getStateName(playerState));

          if (playerState === YT.PlayerState.UNSTARTED || playerState === YT.PlayerState.CUED) {
            state.player.playVideo();
          } else if (playerState === YT.PlayerState.PAUSED) {
            state.player.playVideo();
          } else {
            state.player.playVideo();
          }

          setTimeout(() => {
            try {
              const newState = state.player.getPlayerState();
              console.log('State after play command:', newState, getStateName(newState));
              if (newState === YT.PlayerState.PLAYING) {
                console.log('✅ Successfully playing!');
              } else {
                console.log('⚠️ Not playing, state:', newState);
              }
            } catch (e) {
              console.error('Error checking state:', e);
            }
          }, 500);
        } catch (e) {
          console.error('Error playing:', e);
          if (!state.player) {
            playTrack(state.currentTrack);
          } else {
            showError('Error: ' + e.message);
          }
        }
      } else {
        if (!ytApiReady) {
          showError('YouTube API not ready. Please wait...');
          initYouTubeAPI();
          setTimeout(() => {
            if (ytApiReady) {
              playTrack(state.currentTrack);
            } else {
              showError('Failed to load YouTube API. Refresh page.');
            }
          }, 2000);
        } else {
          playTrack(state.currentTrack);
        }
      }
      updateUI();
    }
  }

  // Set volume
  function setVolume(volume) {
    state.volume = Math.max(0, Math.min(100, volume));
    saveState();

    // Update audio element volume
    if (state.audioElement) {
      try {
        state.audioElement.volume = state.volume / 100;
        console.log('Audio element volume set to:', state.volume);
      } catch (e) {
        console.error('Error setting audio volume:', e);
      }
    }

    // Update YouTube player volume
    if (state.player && ytApiReady) {
      try {
        state.player.setVolume(state.volume);
        console.log('YouTube player volume set to:', state.volume);
      } catch (e) {
        console.error('Error setting volume:', e);
      }
    }

    updateUI();
  }

  // Update global controls on all pages
  function updateGlobalControls() {
    // Update global controls in header (if they exist)
    const globalControls = document.getElementById('globalMusicControls');
    const globalInfo = document.getElementById('globalMusicInfo');
    const globalPlayPause = document.getElementById('globalMusicPlayPause');
    const globalStop = document.getElementById('globalMusicStop');

    if (globalControls) {
      if (state.currentTrack) {
        globalControls.style.display = 'flex';
        if (globalInfo) {
          globalInfo.textContent = `${state.currentTrack.icon} ${state.currentTrack.name}`;
          globalInfo.style.display = 'block';
        }
        if (globalPlayPause) {
          globalPlayPause.textContent = state.isPlaying ? '⏸️' : '▶️';
        }
      } else {
        globalControls.style.display = 'none';
        if (globalInfo) {
          globalInfo.style.display = 'none';
        }
      }
    }

    // Set up global control listeners if not already set
    if (globalPlayPause && !globalPlayPause.dataset.listenerAdded) {
      globalPlayPause.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        togglePlayback();
        // Update again after a short delay
        setTimeout(updateGlobalControls, 200);
      });
      globalPlayPause.dataset.listenerAdded = 'true';
    }

    if (globalStop && !globalStop.dataset.listenerAdded) {
      globalStop.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        stopPlayback();
        // Update again after a short delay
        setTimeout(updateGlobalControls, 200);
      });
      globalStop.dataset.listenerAdded = 'true';
    }
  }

  // Periodically update global controls (for cross-page synchronization)
  setInterval(updateGlobalControls, 1000);

  // Update UI elements
  function updateUI() {
    const btn = document.getElementById('bgMusicBtn');
    const menu = document.getElementById('bgMusicMenu');
    const currentTrackEl = document.getElementById('bgMusicCurrentTrack');
    const playPauseBtn = document.getElementById('bgMusicPlayPause');
    const volumeSlider = document.getElementById('bgMusicVolume');

    // Update global controls
    updateGlobalControls();

    if (btn) {
      btn.classList.toggle('active', state.isPlaying && state.currentTrack !== null);
    }

    if (currentTrackEl) {
      if (state.currentTrack) {
        currentTrackEl.textContent = `${state.currentTrack.icon} ${state.currentTrack.name}`;
        currentTrackEl.style.display = 'block';
      } else {
        currentTrackEl.style.display = 'none';
      }
    }

    if (playPauseBtn) {
      playPauseBtn.textContent = state.isPlaying ? '⏸️' : '▶️';
      playPauseBtn.title = state.isPlaying ? 'Pause' : 'Play';
    }

    if (volumeSlider) {
      volumeSlider.value = state.volume;
    }

    // Update track list
    if (menu) {
      const trackList = menu.querySelector('.bg-music-track-list');
      if (trackList) {
        trackList.innerHTML = tracks.map(track => {
          const isActive = state.currentTrack && state.currentTrack.id === track.id;
          return `
            <button class="bg-music-track-item ${isActive ? 'active' : ''}" 
                    data-track-id="${track.id}">
              <span class="bg-music-track-icon">${track.icon}</span>
              <span class="bg-music-track-name">${track.name}</span>
              ${isActive ? '<span class="bg-music-track-active">●</span>' : ''}
            </button>
          `;
        }).join('');

        // Add event listeners
        trackList.querySelectorAll('.bg-music-track-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const trackId = btn.dataset.trackId;
            const track = tracks.find(t => t.id === trackId);
            if (track) {
              console.log('Track clicked:', track.name);
              playTrack(track);
              setTimeout(() => {
                menu.classList.remove('open');
              }, 500);
            }
          });
        });
      }
    }
  }

  // Toggle menu
  function toggleMenu() {
    const menu = document.getElementById('bgMusicMenu');
    if (menu) {
      menu.classList.toggle('open');
      if (menu.classList.contains('open')) {
        updateUI(); // Refresh track list when opening
      }
    }
  }

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('bgMusicMenu');
    const btn = document.getElementById('bgMusicBtn');
    if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
      menu.classList.remove('open');
    }
  });

  // Initialize when DOM is ready
  function init() {
    console.log('🎵 Initializing background music player...');
    loadState();
    console.log('📦 Loaded state:', state);

    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      ytApiReady = true;
      console.log('✅ YouTube API already loaded');
    } else {
      console.log('📡 Loading YouTube API...');
      initYouTubeAPI();
    }

    // Set up event listeners
    const btn = document.getElementById('bgMusicBtn');
    const playPauseBtn = document.getElementById('bgMusicPlayPause');
    const stopBtn = document.getElementById('bgMusicStop');
    const volumeSlider = document.getElementById('bgMusicVolume');

    console.log('🔌 Setting up event listeners...', {
      btn: !!btn,
      playPauseBtn: !!playPauseBtn,
      stopBtn: !!stopBtn,
      volumeSlider: !!volumeSlider
    });

    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🎵 Music button clicked');
        toggleMenu();
      });
    } else {
      console.error('❌ Music button not found in DOM!');
    }

    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('▶️ Play/Pause button clicked');
        togglePlayback();
      });
    } else {
      console.error('❌ Play/Pause button not found in DOM!');
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('⏹️ Stop button clicked');
        stopPlayback();
        const menu = document.getElementById('bgMusicMenu');
        if (menu) menu.classList.remove('open');
      });
    } else {
      console.error('❌ Stop button not found in DOM!');
    }

    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        setVolume(parseInt(e.target.value));
      });
    } else {
      console.error('❌ Volume slider not found in DOM!');
    }

    // If there's a track that should be playing, start it
    if (state.currentTrack && state.isPlaying) {
      console.log('🔄 Resuming playback for:', state.currentTrack.name);
      setTimeout(() => {
        if (ytApiReady) {
          createPlayer();
        } else {
          const checkInterval = setInterval(() => {
            if (ytApiReady) {
              clearInterval(checkInterval);
              createPlayer();
            }
          }, 100);
          setTimeout(() => {
            clearInterval(checkInterval);
            if (!ytApiReady) {
              console.warn('⚠️ YouTube API did not load in time');
            }
          }, 10000);
        }
      }, 500);
    }

    updateUI();
    console.log('✅ Background music player initialized');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose functions globally for debugging
  window.bgMusic = {
    playTrack,
    stopPlayback,
    togglePlayback,
    setVolume,
    state,
    ytApiReady: () => ytApiReady,
    createPlayer,
    tracks
  };
})();
