/* ==========================================================================
   STATE MANAGEMENT
   ========================================================================== */
const state = {
  score: 78,
  previousScore: 78,
  level: "Intermediate Speaker",
  cefr: "B2 Threshold",
  subskills: {
    reading: 82,
    listening: 75,
    speaking: 70,
    writing: 84,
    vocabulary: 80
  },
  opportunities: {
    pronunciation: 68
  },
  readiness: {
    airport: 85,
    coffee: 95,
    hotel: 70,
    taxi: 60
  },
  activeScreen: 'home',
  isDarkMode: false
};

// Original baseline for resets
const baselineState = JSON.parse(JSON.stringify(state));

/* ==========================================================================
   WEB AUDIO API SOUND GENERATOR (Offline Friendly & Highly Responsive)
   ========================================================================== */
function playSound(type) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'tap') {
      // Small clean feedback click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } 
    else if (type === 'success_chime') {
      // Ascending major chord (C5 - E5 - G5 - C6) triangle wave arpeggio (Classic Duolingo vibe)
      const playTone = (freq, delay, dur) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur);
      };
      
      playTone(523.25, 0.0, 0.2);   // C5
      playTone(659.25, 0.1, 0.2);   // E5
      playTone(783.99, 0.2, 0.2);   // G5
      playTone(1046.50, 0.3, 0.45); // C6
    }
    else if (type === 'mic_start') {
      // Friendly input notification sound (C5 - G5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1);
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.2);
    }
    else if (type === 'pop_up') {
      // Fun bubble pop sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    }
  } catch (e) {
    console.warn("Audio Context blocked or failed to initialize:", e);
  }
}

/* ==========================================================================
   UI SYNCHRONIZATION
   ========================================================================== */
function updateUI() {
  // 1. Update text fields for Score
  document.querySelectorAll('.dynamic-score').forEach(el => {
    el.textContent = state.score;
  });
  
  // 2. Level Text & CEFR descriptor
  document.querySelectorAll('.dynamic-level').forEach(el => {
    el.textContent = state.level;
  });
  
  // Update CEFR text
  const fitnessSubtext = document.querySelector('.fitness-subtext');
  if (fitnessSubtext) {
    fitnessSubtext.innerHTML = `Equivalent to <strong>CEFR ${state.cefr}</strong>`;
  }

  // 3. Progress bars
  const homeProgress = document.getElementById('home-progress-bar');
  if (homeProgress) homeProgress.style.width = `${state.score}%`;
  
  const homePerc = document.querySelector('.dynamic-percentage');
  if (homePerc) homePerc.textContent = `${state.score}%`;

  // Details Circular Progress
  const circleProgress = document.getElementById('details-circular-progress');
  if (circleProgress) {
    // Circle dasharray maps directly to 0-100 score in SVG layout
    circleProgress.setAttribute('stroke-dasharray', `${state.score}, 100`);
  }

  // Points to next milestone
  const pointsToNext = document.getElementById('points-to-next');
  if (pointsToNext) {
    // Next milestone is Advanced (C1) at 90
    pointsToNext.textContent = 90 - state.score;
  }

  // 4. Sub-skill break down values & widths
  document.getElementById('val-reading').textContent = state.subskills.reading;
  document.getElementById('bar-reading').style.width = `${state.subskills.reading}%`;

  document.getElementById('val-listening').textContent = state.subskills.listening;
  document.getElementById('bar-listening').style.width = `${state.subskills.listening}%`;

  document.getElementById('val-speaking').textContent = state.subskills.speaking;
  document.getElementById('bar-speaking').style.width = `${state.subskills.speaking}%`;
  
  // Highlight speaking trend dynamically
  const trendSpeak = document.getElementById('trend-speaking');
  const badgeSpeak = document.getElementById('badge-speaking');
  if (state.score > 78) {
    trendSpeak.textContent = '↑ +10 this week';
    trendSpeak.style.fontWeight = '900';
    badgeSpeak.textContent = 'Proficient';
    badgeSpeak.className = 'subskill-badge badge-green';
  } else {
    trendSpeak.textContent = '↑ +5 this week';
    trendSpeak.style.fontWeight = '700';
    badgeSpeak.textContent = 'Conversational';
    badgeSpeak.className = 'subskill-badge badge-orange';
  }

  document.getElementById('val-writing').textContent = state.subskills.writing;
  document.getElementById('bar-writing').style.width = `${state.subskills.writing}%`;

  document.getElementById('val-vocabulary').textContent = state.subskills.vocabulary;
  document.getElementById('bar-vocabulary').style.width = `${state.subskills.vocabulary}%`;

  // Gaps panel - Pronunciation card
  document.getElementById('op-pron-curr').textContent = `${state.opportunities.pronunciation}%`;
  document.getElementById('op-bar-pron').style.width = `${state.opportunities.pronunciation}%`;

  // Real life readiness cards
  document.getElementById('ready-airport-val').textContent = `${state.readiness.airport}%`;
  document.getElementById('ready-airport-bar').style.width = `${state.readiness.airport}%`;

  document.getElementById('ready-coffee-val').textContent = `${state.readiness.coffee}%`;
  document.getElementById('ready-coffee-bar').style.width = `${state.readiness.coffee}%`;

  document.getElementById('ready-hotel-val').textContent = `${state.readiness.hotel}%`;
  document.getElementById('ready-hotel-bar').style.width = `${state.readiness.hotel}%`;

  document.getElementById('ready-taxi-val').textContent = `${state.readiness.taxi}%`;
  document.getElementById('ready-taxi-bar').style.width = `${state.readiness.taxi}%`;

  // Estimate Days indicator
  const roadmapReadinessDays = document.getElementById('readiness-days');
  if (roadmapReadinessDays) {
    roadmapReadinessDays.textContent = state.score >= 80 ? "14 Days" : "21 Days";
  }
}

/* ==========================================================================
   NAVIGATION ENGINE (Slide Animations)
   ========================================================================== */
function navigateToScreen(targetScreenId) {
  if (state.activeScreen === targetScreenId) return;
  playSound('tap');

  const currentScreen = document.getElementById(`screen-${state.activeScreen}`);
  const nextScreen = document.getElementById(`screen-${targetScreenId}`);
  
  if (!currentScreen || !nextScreen) return;

  // Determine direction
  // Screens order: home -> fitness
  const order = ['home', 'fitness'];
  const currentIndex = order.indexOf(state.activeScreen);
  const nextIndex = order.indexOf(targetScreenId);

  // Clear animation classes
  currentScreen.classList.remove('slide-in-right', 'slide-out-left', 'slide-in-left', 'slide-out-right', 'active');
  nextScreen.classList.remove('slide-in-right', 'slide-out-left', 'slide-in-left', 'slide-out-right', 'active');

  if (nextIndex > currentIndex) {
    // Slid left: current slide out to left, next slide in from right
    currentScreen.classList.add('slide-out-left');
    nextScreen.classList.add('slide-in-right', 'active');
  } else {
    // Slid right: current slide out to right, next slide in from left
    currentScreen.classList.add('slide-out-right');
    nextScreen.classList.add('slide-in-left', 'active');
  }

  // Update tab navigation active state
  document.querySelectorAll('.app-navbar .nav-item').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-screen') === targetScreenId) {
      btn.classList.add('active');
    }
  });

  // Remove pulsing dot if moving to fitness dashboard
  if (targetScreenId === 'fitness') {
    const pulseDot = document.querySelector('.pulse-indicator');
    if (pulseDot) pulseDot.style.display = 'none';
  }

  state.activeScreen = targetScreenId;
}

/* ==========================================================================
   PM PRESENTATION PANEL (Tabs Switching)
   ========================================================================== */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const targetTabId = this.getAttribute('data-tab');
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    
    this.classList.add('active');
    const targetSection = document.getElementById(targetTabId);
    if (targetSection) targetSection.classList.add('active');
  });
});

/* ==========================================================================
   MICRO-INTERACTION: SPEAKING OPPORTUNITY LESSON (SCREEN 3)
   ========================================================================== */
const overlaySpeaking = document.getElementById('overlay-speaking-lesson');
const btnImprovePron = document.getElementById('btn-improve-pron');
const btnCloseLesson = document.getElementById('btn-close-lesson');
const btnMic = document.getElementById('btn-mic');
const micText = document.getElementById('mic-text');
const btnSubmitSpeak = document.getElementById('btn-submit-speak');
const phraseSpeaker = document.querySelector('.phrase-speaker');

// Open Lesson
btnImprovePron.addEventListener('click', () => {
  playSound('pop_up');
  overlaySpeaking.classList.add('active');
});

// Close Lesson
function closeLesson() {
  overlaySpeaking.classList.remove('active');
  // Reset micro lesson UI state
  btnMic.classList.remove('recording');
  btnMic.style.backgroundColor = '';
  micText.textContent = "Tap the microphone to speak";
  btnSubmitSpeak.classList.add('disabled');
  btnSubmitSpeak.disabled = true;
  document.querySelector('.phrase-target').style.color = '';
}
btnCloseLesson.addEventListener('click', closeLesson);

// Text-to-Speech synthesis for Duolingo pronunciation voice
phraseSpeaker.addEventListener('click', () => {
  playSound('tap');
  const targetText = "Disculpe, ¿dónde está la estación?";
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(targetText);
    utterance.lang = 'es-ES'; // Spanish Accent
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  } else {
    // Sound fallback
    playSound('mic_start');
  }
});

// Simulate voice capture
btnMic.addEventListener('click', () => {
  if (btnMic.classList.contains('recording')) return;

  playSound('mic_start');
  btnMic.classList.add('recording');
  micText.textContent = "Listening carefully...";

  // Play audio waves logic or text progress
  setTimeout(() => {
    micText.textContent = "Analyzing speech patterns...";
    playSound('tap');
    
    setTimeout(() => {
      btnMic.classList.remove('recording');
      btnMic.style.backgroundColor = '#58cc02'; // Green success microphone
      micText.innerHTML = "✨ <strong>Excellent Accent! (92% Match)</strong>";
      
      // Color phrase green
      document.querySelector('.phrase-target').style.color = '#58cc02';
      
      // Enable Submit
      btnSubmitSpeak.classList.remove('disabled');
      btnSubmitSpeak.disabled = false;
      
      // Voice feedback
      playSound('tap');
    }, 1200);

  }, 1800);
});

// Submit Lesson Answer
btnSubmitSpeak.addEventListener('click', () => {
  closeLesson();
  triggerCelebration();
});

/* ==========================================================================
   SCREEN 6: CELEBRATION SYSTEM (Score Increase 78 -> 80)
   ========================================================================== */
const overlayCelebration = document.getElementById('overlay-celebration');
const btnCloseCelebration = document.getElementById('btn-close-celebration');
const celebScoreOld = document.getElementById('celeb-score-old');
const celebScoreNew = document.getElementById('celeb-score-new');

function triggerCelebration() {
  if (state.score >= 80) {
    // Already simulated, just show the celebration window directly without incrementing
    overlayCelebration.classList.add('active');
    triggerConfetti();
    playSound('success_chime');
    return;
  }

  // Pre-load values
  state.previousScore = state.score; // 78
  state.score = 80;
  state.level = "Fluent Conversationalist";
  state.cefr = "B2 Solid";
  
  // Incremental upgrades
  state.subskills.speaking = 75;
  state.opportunities.pronunciation = 80;
  state.readiness.airport = 90;
  state.readiness.hotel = 75;
  state.readiness.taxi = 65;

  celebScoreOld.textContent = state.previousScore;
  celebScoreNew.textContent = state.score;

  // Open overlay
  overlayCelebration.classList.add('active');
  
  // Animate the score numbers counting up in celebration screen
  let currentVal = state.previousScore;
  const countInterval = setInterval(() => {
    if (currentVal < state.score) {
      currentVal++;
      celebScoreOld.textContent = currentVal;
    } else {
      clearInterval(countInterval);
    }
  }, 300);

  // Play audio
  setTimeout(() => {
    playSound('success_chime');
  }, 100);

  // Confetti Blast
  triggerConfetti();
}

// Fallback Canvas Confetti loop if CDN fails or user offline
function triggerConfetti() {
  if (window.confetti) {
    // Standard library burst
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      window.confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#58cc02', '#ff9600', '#a560e8', '#ffc800', '#1897f5']
      });
      window.confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#58cc02', '#ff9600', '#a560e8', '#ffc800', '#1897f5']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  } else {
    // Custom inline Canvas confetti
    const canvas = document.getElementById('celebration-confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    const colors = ['#58cc02', '#ff9600', '#a560e8', '#ffc800', '#1897f5'];
    const particles = [];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        r: Math.random() * 6 + 4,
        d: Math.random() * canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0,
        vy: -Math.random() * 5 - 4,
        vx: Math.random() * 4 - 2
      });
    }

    let animationFrameId;
    function drawConfetti() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particles.forEach(p => {
        p.y += p.vy;
        p.x += p.vx;
        p.vy += 0.1; // gravity
        p.tiltAngle += p.tiltAngleIncremental;
        p.tilt += Math.sin(p.tiltAngle);

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();

        if (p.y < canvas.height + 20) {
          active = true;
        }
      });

      if (active) {
        animationFrameId = requestAnimationFrame(drawConfetti);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    drawConfetti();
  }
}

// Close celebration and navigate to Fitness details to view updated score card
btnCloseCelebration.addEventListener('click', () => {
  playSound('tap');
  overlayCelebration.classList.remove('active');
  updateUI();
  navigateToScreen('fitness');
});

/* ==========================================================================
   SIMULATOR CONTROLS (Presentation Interface)
   ========================================================================== */

// 1. Simulate Speaking lesson CTA
document.getElementById('btn-complete-lesson').addEventListener('click', () => {
  // Jump to fitness section and open the speaking exercise drawer immediately
  navigateToScreen('fitness');
  setTimeout(() => {
    // Scroll Details screen down to Opportunities section
    const fitnessScrollable = document.querySelector('#screen-fitness .screen-scrollable');
    const targetElement = document.getElementById('op-card-pronunciation');
    if (fitnessScrollable && targetElement) {
      fitnessScrollable.scrollTo({
        top: targetElement.offsetTop - 70,
        behavior: 'smooth'
      });
    }
    // ShowSpeaking Opportunity
    setTimeout(() => {
      btnImprovePron.click();
    }, 400);
  }, 250);
});

// 2. Reset Prototype CTA
document.getElementById('btn-reset-prototype').addEventListener('click', () => {
  playSound('pop_up');
  // Revert State
  Object.assign(state, JSON.parse(JSON.stringify(baselineState)));
  updateUI();
  
  // Re-enable pulsing dot
  const pulseDot = document.querySelector('.pulse-indicator');
  if (pulseDot) pulseDot.style.display = 'block';

  // Navigate to Home
  navigateToScreen('home');
  alert("Prototype reset to baseline (Score: 78 / 100)");
});

// 3. Jump navigations
document.querySelectorAll('.jump-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const target = this.getAttribute('data-target');
    
    if (target === 'home') {
      navigateToScreen('home');
    } else {
      navigateToScreen('fitness');
      
      // Auto scroll to corresponding sections within fitness scroll view
      setTimeout(() => {
        const fitnessScrollable = document.querySelector('#screen-fitness .screen-scrollable');
        if (!fitnessScrollable) return;
        
        let scrollY = 0;
        if (target === 'opportunities') {
          scrollY = document.getElementById('op-card-pronunciation').offsetTop - 70;
        } else if (target === 'roadmap') {
          scrollY = document.querySelector('.roadmap-timeline').offsetTop - 140;
        } else if (target === 'readiness') {
          scrollY = document.querySelector('.readiness-grid').offsetTop - 140;
        }
        
        fitnessScrollable.scrollTo({
          top: scrollY,
          behavior: 'smooth'
        });
      }, 300);
    }
  });
});

// 4. Dark Theme Switcher
const btnToggleDark = document.getElementById('btn-toggle-dark-mode');
btnToggleDark.addEventListener('click', () => {
  playSound('tap');
  const appRoot = document.getElementById('app-window-root');
  state.isDarkMode = !state.isDarkMode;
  
  if (state.isDarkMode) {
    appRoot.classList.add('dark-theme');
    btnToggleDark.querySelector('.mode-icon').textContent = "☀️";
    btnToggleDark.querySelector('.mode-text').textContent = "Switch to Light Mode";
  } else {
    appRoot.classList.add('dark-theme'); // safety clear
    appRoot.classList.remove('dark-theme');
    btnToggleDark.querySelector('.mode-icon').textContent = "🌙";
    btnToggleDark.querySelector('.mode-text').textContent = "Switch to Dark Mode";
  }
});

/* ==========================================================================
   APP STARTUP & MOUNT
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Sync initial stats
  updateUI();
  
  // Set real-time clock inside status bar
  const updatePhoneTime = () => {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    const timeStr = `${hours}:${minutes}`;
    const el = document.getElementById('phone-time');
    if (el) el.textContent = timeStr;
  };
  updatePhoneTime();
  setInterval(updatePhoneTime, 30000);

  // Home card redirect logic
  const homeCard = document.getElementById('home-fitness-card');
  if (homeCard) {
    homeCard.addEventListener('click', (e) => {
      // Don't intercept click if clicking button directly (will be handled by button listener)
      if (e.target.closest('button')) return;
      navigateToScreen('fitness');
    });
  }
  
  const btnViewInsights = document.getElementById('btn-view-insights');
  if (btnViewInsights) {
    btnViewInsights.addEventListener('click', () => {
      navigateToScreen('fitness');
    });
  }

  const btnFitnessBack = document.getElementById('btn-fitness-back');
  if (btnFitnessBack) {
    btnFitnessBack.addEventListener('click', () => {
      navigateToScreen('home');
    });
  }

  // Active path node clickable opens Fitness score or trigger Speaking simulation
  document.querySelectorAll('.clickable-node').forEach(node => {
    node.addEventListener('click', () => {
      // Redirect to speaking lesson immediately to guide user
      document.getElementById('btn-complete-lesson').click();
    });
  });
});
