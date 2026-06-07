/**
 * かずき栽培 (Kazuki Cultivation) - Game Logic
 */

// Sound Synthesis Controller
const SoundSynth = {
  ctx: null,
  enabled: true,

  init() {
    // AudioContext is initialized on user interaction to comply with browser policies
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    } catch (e) {
      console.warn("Web Audio API is not supported in this browser");
    }
  },

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled && !this.ctx) {
      this.init();
    }
    return this.enabled;
  },

  playHarvest() {
    if (!this.enabled) return;
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    
    // Create oscillator for the main pop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    
    // Fast frequency sweep (pitch sweep) to simulate the "plop/pop" sound
    osc.frequency.setValueAtTime(250, t);
    osc.frequency.exponentialRampToValueAtTime(1000, t + 0.08);
    
    // Quick volume envelope
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(t);
    osc.stop(t + 0.1);
  },

  playRareHarvest() {
    if (!this.enabled) return;
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    
    // Sparkling/chime sound for rare harvest
    const freqs = [600, 800, 1200, 1600];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.03);
      osc.frequency.linearRampToValueAtTime(freq * 1.5, t + idx * 0.03 + 0.15);
      
      gain.gain.setValueAtTime(0.15, t + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.03 + 0.2);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(t + idx * 0.03);
      osc.stop(t + idx * 0.03 + 0.22);
    });
  },

  playClick() {
    if (!this.enabled) return;
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(t);
    osc.stop(t + 0.05);
  }
};

// Game Database
const KazukiDatabase = {
  1: {
    id: 1,
    name: "通常かずき",
    rarity: 1,
    baseNP: 10,
    img: "assets/normal_kazuki.png",
    desc: "最も標準的なかずき。プログラミングとコーヒーをこよなく愛する。日々のコーディング作業で目が少し冴えている。"
  },
  2: {
    id: 2,
    name: "きのこかずき",
    rarity: 2,
    baseNP: 30,
    img: "assets/mushroom_kazuki.png",
    desc: "なめこの帽子をかぶった可愛いかずき。すっかりきのこになりきっており、原木との親和性が抜群。少しぬめぬめしている気がする。"
  },
  3: {
    id: 3,
    name: "インテリかずき",
    rarity: 3,
    baseNP: 80,
    img: "assets/smart_kazuki.png",
    desc: "メガネをかけ、ビジネススーツを着こなした知的なかずき。どんな難解なアルゴリズムも一瞬で解き明かすが、たまにキーボードを叩くのが速すぎる。"
  },
  4: {
    id: 4,
    name: "ゴールデンかずき",
    rarity: 5,
    baseNP: 500,
    img: "assets/golden_kazuki.png",
    desc: "全身がメタリックな金色に輝く、伝説の超ウルトラレアかずき。収穫すると莫大なNPをもたらし、栽培場全体が金色の幸運に包まれる。"
  },
  5: {
    id: 5,
    name: "枯れかずき",
    rarity: 1,
    baseNP: 1,
    img: "assets/withered_kazuki.png",
    desc: "フードが切れた状態で放置され、乾燥してしまったかずき。元気がなく、グルグルお目々になっている。すぐに水分（フード）をあげて復活させよう。"
  }
};

// Game State Definition
class KazukiGame {
  constructor() {
    this.np = 0;
    this.foodTimer = 0; // in seconds
    this.upgrades = {
      humidifier: 1, // Max 5
      heater: 1,     // Max 5
      light: 1       // Max 5
    };
    this.discovered = [1]; // Start with ID 1 discovered
    this.counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    this.growing = []; // Array of growing Kazuki instances
    this.activeTab = "screen-cultivate";
    
    // Control variables
    this.isSwiping = false;
    
    // Max capacity based on LED Light upgrade
    this.getMaxCapacity = () => 8 + this.upgrades.light * 4; // Level 1: 12, Level 5: 28
    
    // Load existing game if present
    this.loadGame();
  }

  // Save current game state
  saveGame() {
    const data = {
      np: this.np,
      foodTimer: this.foodTimer,
      upgrades: this.upgrades,
      discovered: this.discovered,
      counts: this.counts,
      growing: this.growing,
      saveTime: Date.now()
    };
    localStorage.setItem("like_a_nameko_save", JSON.stringify(data));
  }

  // Load game state
  loadGame() {
    const saved = localStorage.getItem("like_a_nameko_save");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.np = data.np || 0;
        this.upgrades = data.upgrades || { humidifier: 1, heater: 1, light: 1 };
        this.discovered = data.discovered || [1];
        this.counts = data.counts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        // Handle offline growth if food was active
        const elapsedSeconds = Math.floor((Date.now() - data.saveTime) / 1000);
        this.foodTimer = Math.max(0, (data.foodTimer || 0) - elapsedSeconds);
        
        // Load growing database
        this.growing = data.growing || [];
        
        // Simulate growing ticks for offline time
        if (elapsedSeconds > 0) {
          this.simulateOfflineGrowth(elapsedSeconds, data.foodTimer || 0);
        }
      } catch (e) {
        console.error("Failed to parse save game data", e);
      }
    }
  }

  // Offline growth simulation
  simulateOfflineGrowth(elapsed, remainingFood) {
    const activeFoodTime = Math.min(elapsed, remainingFood);
    const witheredTime = Math.max(0, elapsed - remainingFood);
    
    // 1. Grow existing sprouts to mature
    this.growing.forEach(k => {
      if (k.state === 'sprout') {
        const growthNeeded = (k.matureTime - k.sproutTime) / 1000;
        if (activeFoodTime >= growthNeeded) {
          k.state = 'mature';
        }
      }
    });

    // 2. Spawn new ones during active food time
    const spawnChance = 0.1 + (this.upgrades.humidifier * 0.05); // Chance per 5 seconds
    const intervalTicks = Math.floor(activeFoodTime / 5);
    const capacity = this.getMaxCapacity();
    
    for (let i = 0; i < intervalTicks; i++) {
      if (this.growing.length >= capacity) break;
      if (Math.random() < spawnChance) {
        const type = this.rollKazukiType();
        const coords = this.getRandomCoords();
        this.growing.push({
          id: Math.random().toString(36).substr(2, 9),
          type: type,
          x: coords.x,
          y: coords.y,
          state: 'mature', // Assume grown offline
          sproutTime: Date.now(),
          matureTime: Date.now()
        });
      }
    }

    // 3. Wither mature Kazukis if food ran out
    if (witheredTime > 0) {
      const witherChancePerMin = 0.15 / this.upgrades.light; // e.g. 15% chance per min divided by light lvl
      const witherMinutes = witheredTime / 60;
      const totalWitherChance = 1 - Math.pow(1 - witherChancePerMin, witherMinutes);
      
      this.growing.forEach(k => {
        if (k.state === 'mature' && Math.random() < totalWitherChance) {
          k.state = 'withered';
          k.type = 5; // Withered Kazuki
        }
      });
    }
  }

  // Calculate random coords on wood log
  getRandomCoords() {
    // We restrict spawning to coordinates lying horizontally on the log
    // x: 16% - 84%, y: 35% - 62%
    return {
      x: 16 + Math.random() * 68,
      y: 32 + Math.random() * 30
    };
  }

  // Select Kazuki type based on Heater level
  rollKazukiType() {
    const rand = Math.random();
    const lvl = this.upgrades.heater;
    
    // Probabilities adapt dynamically based on heater level
    // Level 1: Normal 85%, Mushroom 11%, Smart 3.5%, Golden 0.5%
    // Level 5: Normal 40%, Mushroom 35%, Smart 20%, Golden 5%
    const goldenChance = 0.005 + (lvl - 1) * 0.01125; // 0.5% to 5%
    const smartChance = 0.035 + (lvl - 1) * 0.04125;  // 3.5% to 20%
    const mushroomChance = 0.11 + (lvl - 1) * 0.06;   // 11% to 35%

    if (rand < goldenChance) return 4; // Golden
    if (rand < goldenChance + smartChance) return 3; // Smart
    if (rand < goldenChance + smartChance + mushroomChance) return 2; // Mushroom
    return 1; // Normal
  }

  // Try to sprout a new Kazuki
  trySprout() {
    if (this.foodTimer <= 0) return;
    if (this.growing.length >= this.getMaxCapacity()) return;
    
    // Spawn chance per tick (1s): 8% at Lv.1, up to 24% at Lv.5
    const spawnChance = 0.04 + (this.upgrades.humidifier * 0.04);
    if (Math.random() < spawnChance) {
      const type = this.rollKazukiType();
      const coords = this.getRandomCoords();
      
      // Calculate growth time (Lv.1: 6s, Lv.5: 2s)
      const baseGrowthTime = 6000;
      const growthDuration = baseGrowthTime / (1 + (this.upgrades.humidifier - 1) * 0.25);
      
      const sproutTime = Date.now();
      const matureTime = sproutTime + growthDuration;
      
      const newKazuki = {
        id: Math.random().toString(36).substr(2, 9),
        type: type,
        x: coords.x,
        y: coords.y,
        state: 'sprout',
        sproutTime: sproutTime,
        matureTime: matureTime
      };

      this.growing.push(newKazuki);
      this.renderGrowingKazuki(newKazuki);
    }
  }

  // Wither process when food runs out
  tickWither() {
    if (this.foodTimer > 0) return;
    
    // 5% chance per second for mature Kazuki to wither, reduced by light level
    const witherChance = 0.05 / this.upgrades.light;
    
    this.growing.forEach(k => {
      if (k.state === 'mature' && Math.random() < witherChance) {
        k.state = 'withered';
        k.type = 5; // Change type to withered
        
        // Update DOM element
        const el = document.getElementById(`kazuki-${k.id}`);
        if (el) {
          el.className = 'growing-kazuki mature withered';
          el.querySelector('img').src = KazukiDatabase[5].img;
        }
      }
    });
  }

  // Render a single growing Kazuki
  renderGrowingKazuki(k) {
    const spawner = document.getElementById('kazuki-spawner');
    if (!spawner) return;

    const el = document.createElement('div');
    el.id = `kazuki-${k.id}`;
    el.className = `growing-kazuki ${k.state}`;
    
    // Rarity-based glow class
    if (k.type === 4) el.classList.add('golden');
    if (k.state === 'withered') el.classList.add('withered');

    el.style.left = `${k.x}%`;
    el.style.top = `${k.y}%`;
    
    const dbEntry = KazukiDatabase[k.state === 'withered' ? 5 : k.type];
    
    const img = document.createElement('img');
    img.src = dbEntry.img;
    img.alt = dbEntry.name;
    img.draggable = false;
    
    el.appendChild(img);
    spawner.appendChild(el);

    // Dynamic sprout size enlargement
    if (k.state === 'sprout') {
      // Trigger CSS reflow
      void el.offsetWidth;
      el.classList.add('sprout');
      
      const checkGrowth = setInterval(() => {
        const now = Date.now();
        if (now >= k.matureTime) {
          k.state = 'mature';
          el.classList.remove('sprout');
          el.classList.add('mature');
          clearInterval(checkGrowth);
        }
      }, 500);
      
      // Store interval so we can clear if harvested early
      el.dataset.intervalId = checkGrowth;
    }
  }

  // Re-render all growing ones on tab switch or load
  renderAllGrowing() {
    const spawner = document.getElementById('kazuki-spawner');
    if (!spawner) return;
    spawner.innerHTML = '';
    this.growing.forEach(k => this.renderGrowingKazuki(k));
  }

  // Harvest process
  harvest(id, clientX, clientY) {
    const idx = this.growing.findIndex(k => k.id === id);
    if (idx === -1) return;
    
    const k = this.growing[idx];
    
    // Clear checkGrowth interval if still sprouting
    const el = document.getElementById(`kazuki-${k.id}`);
    if (el && el.dataset.intervalId) {
      clearInterval(Number(el.dataset.intervalId));
    }

    // Determine actual type harvested
    const harvestedType = k.state === 'withered' ? 5 : k.type;
    const db = KazukiDatabase[harvestedType];
    
    // Add points
    this.np += db.baseNP;
    this.counts[harvestedType]++;
    
    // Discover rare type
    if (!this.discovered.includes(harvestedType)) {
      this.discovered.push(harvestedType);
      this.renderEncyclopedia(); // Refresh encyclo visual
    }

    // Play synthesized sound
    if (harvestedType === 4) {
      SoundSynth.playRareHarvest();
    } else {
      SoundSynth.playHarvest();
    }

    // Floating text feedback
    this.spawnFloatingText(`+${db.baseNP} NP`, clientX, clientY);

    // Remove from memory & DOM
    this.growing.splice(idx, 1);
    if (el) {
      el.remove();
    }
    
    // Update Score
    this.updateScoreUI();
    this.saveGame();
  }

  // Floating text pop effect
  spawnFloatingText(text, clientX, clientY) {
    const container = document.getElementById('cultivate-area');
    if (!container) return;

    // Convert screen coordinates to relative container coordinates
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const pop = document.createElement('div');
    pop.className = 'floating-np';
    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
    pop.innerText = text;

    container.appendChild(pop);
    
    // Auto-destruct after animation completes
    setTimeout(() => {
      pop.remove();
    }, 800);
  }

  // Upgrade Equipment
  upgradeEquipment(type) {
    const currentLvl = this.upgrades[type];
    if (currentLvl >= 5) return; // Max level reached

    const cost = this.getUpgradeCost(type, currentLvl);
    if (this.np >= cost) {
      this.np -= cost;
      this.upgrades[type]++;
      
      SoundSynth.playRareHarvest(); // Chime for success
      this.updateScoreUI();
      this.updateShopUI();
      this.saveGame();

      // Humidifier steam visual feedback
      if (type === 'humidifier') {
        this.updateHumidifierSteam();
      }
    } else {
      SoundSynth.playClick(); // Buzz sound or dull click
    }
  }

  getUpgradeCost(type, level) {
    const baseCosts = {
      humidifier: 100,
      heater: 150,
      light: 200
    };
    // Progressive increase: lvl 1: base, lvl 2: base*3, lvl 3: base*6, lvl 4: base*12
    return baseCosts[type] * Math.pow(2.2, level - 1) * level;
  }

  // UI Updates
  updateScoreUI() {
    const npCount = document.getElementById('np-count');
    if (npCount) {
      // Animate counter increment
      const start = parseInt(npCount.innerText.replace(/,/g, ''));
      const end = this.np;
      if (start !== end) {
        this.animateCounter(npCount, start, end, 300);
      } else {
        npCount.innerText = this.np.toLocaleString();
      }
    }
  }

  animateCounter(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const val = Math.floor(progress * (end - start) + start);
      obj.innerText = val.toLocaleString();
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  updateFoodTimerUI() {
    const timerEl = document.getElementById('food-timer');
    const displayBtn = document.getElementById('food-display-btn');
    if (!timerEl) return;

    if (this.foodTimer <= 0) {
      timerEl.innerText = "フード切れ";
      displayBtn.style.background = "#e74c3c"; // Red background alert
      displayBtn.style.boxShadow = "0 4px 12px rgba(231, 76, 60, 0.25)";
    } else {
      const minutes = Math.floor(this.foodTimer / 60);
      const seconds = this.foodTimer % 60;
      timerEl.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      displayBtn.style.background = "var(--accent-gradient)"; // Normal orange gradient
      displayBtn.style.boxShadow = "0 4px 12px rgba(255, 126, 95, 0.25)";
    }
  }

  updateHumidifierSteam() {
    const steam = document.getElementById('steam-overlay');
    if (steam) {
      // Set opacity depending on humidifier level (max 5)
      // Level 1: 0.2, Level 5: 0.7
      const maxOpacity = 0.1 + (this.upgrades.humidifier * 0.12);
      steam.style.opacity = this.foodTimer > 0 ? maxOpacity.toString() : '0';
    }
  }

  updateShopUI() {
    // Humidifier
    const humLvl = document.getElementById('humidifier-lvl');
    const humCost = document.getElementById('humidifier-cost');
    const humBtn = document.getElementById('btn-upgrade-humidifier');
    if (humLvl && humCost && humBtn) {
      const lvl = this.upgrades.humidifier;
      if (lvl >= 5) {
        humLvl.innerText = "Lv.MAX";
        humCost.innerText = "MAX";
        humBtn.classList.add('disabled');
      } else {
        const cost = Math.floor(this.getUpgradeCost('humidifier', lvl));
        humLvl.innerText = `Lv.${lvl}`;
        humCost.innerText = `${cost.toLocaleString()} NP`;
        humBtn.classList.toggle('disabled', this.np < cost);
      }
    }

    // Heater
    const heatLvl = document.getElementById('heater-lvl');
    const heatCost = document.getElementById('heater-cost');
    const heatBtn = document.getElementById('btn-upgrade-heater');
    if (heatLvl && heatCost && heatBtn) {
      const lvl = this.upgrades.heater;
      if (lvl >= 5) {
        heatLvl.innerText = "Lv.MAX";
        heatCost.innerText = "MAX";
        heatBtn.classList.add('disabled');
      } else {
        const cost = Math.floor(this.getUpgradeCost('heater', lvl));
        heatLvl.innerText = `Lv.${lvl}`;
        heatCost.innerText = `${cost.toLocaleString()} NP`;
        heatBtn.classList.toggle('disabled', this.np < cost);
      }
    }

    // Light
    const lightLvl = document.getElementById('light-lvl');
    const lightCost = document.getElementById('light-cost');
    const lightBtn = document.getElementById('btn-upgrade-light');
    if (lightLvl && lightCost && lightBtn) {
      const lvl = this.upgrades.light;
      if (lvl >= 5) {
        lightLvl.innerText = "Lv.MAX";
        lightCost.innerText = "MAX";
        lightBtn.classList.add('disabled');
      } else {
        const cost = Math.floor(this.getUpgradeCost('light', lvl));
        lightLvl.innerText = `Lv.${lvl}`;
        lightCost.innerText = `${cost.toLocaleString()} NP`;
        lightBtn.classList.toggle('disabled', this.np < cost);
      }
    }
  }

  // Render Encyclopedia Grid
  renderEncyclopedia() {
    const grid = document.getElementById('encyclopedia-grid');
    if (!grid) return;
    grid.innerHTML = '';

    Object.keys(KazukiDatabase).forEach(idStr => {
      const id = parseInt(idStr);
      const db = KazukiDatabase[id];
      const isDiscovered = this.discovered.includes(id);

      const card = document.createElement('div');
      card.className = `ency-card ${isDiscovered ? '' : 'locked'}`;
      card.dataset.id = id;

      const num = document.createElement('span');
      num.className = 'ency-card-num';
      num.innerText = `No. ${id.toString().padStart(2, '0')}`;
      card.appendChild(num);

      const img = document.createElement('img');
      img.src = db.img;
      img.alt = isDiscovered ? db.name : "???";
      img.className = 'ency-card-img';
      img.draggable = false;
      card.appendChild(img);

      const name = document.createElement('div');
      name.className = 'ency-card-name';
      name.innerText = isDiscovered ? db.name : "???";
      card.appendChild(name);

      if (isDiscovered) {
        card.addEventListener('click', () => this.showDetailModal(id));
      } else {
        card.addEventListener('click', () => {
          SoundSynth.playClick();
          alert("まだ発見されていません！設備を強化して栽培しましょう。");
        });
      }

      grid.appendChild(card);
    });
  }

  showDetailModal(id) {
    const db = KazukiDatabase[id];
    const modal = document.getElementById('detail-modal');
    
    document.getElementById('modal-img').src = db.img;
    document.getElementById('modal-name').innerText = db.name;
    document.getElementById('modal-rarity').innerText = "★".repeat(db.rarity) + "☆".repeat(5 - db.rarity);
    document.getElementById('modal-count').innerText = this.counts[id] || 0;
    document.getElementById('modal-desc').innerText = db.desc;

    modal.classList.add('open');
    SoundSynth.playClick();
  }

  closeDetailModal() {
    const modal = document.getElementById('detail-modal');
    if (modal) {
      modal.classList.remove('open');
      SoundSynth.playClick();
    }
  }

  // Feed/Nutrient refill
  refillFood(duration, cost) {
    if (this.np >= cost) {
      this.np -= cost;
      this.foodTimer += duration;
      this.updateScoreUI();
      this.updateFoodTimerUI();
      this.updateHumidifierSteam();
      this.updateShopUI(); // Upgrades list is dependent on NP
      this.saveGame();
      SoundSynth.playRareHarvest(); // chime sound
      
      // Close food drawer
      document.getElementById('food-drawer').classList.remove('open');
    } else {
      SoundSynth.playClick();
      alert("NPが不足しています！かずきを収穫してNPを貯めましょう。");
    }
  }
}

// Instantiate and setup Event Listeners when page loads
window.addEventListener('DOMContentLoaded', () => {
  const game = new KazukiGame();
  
  // Render initial views
  game.updateScoreUI();
  game.updateFoodTimerUI();
  game.updateHumidifierSteam();
  game.renderAllGrowing();
  game.renderEncyclopedia();
  game.updateShopUI();

  // 1. Tab Navigation
  const navButtons = document.querySelectorAll('.nav-btn');
  const screens = document.querySelectorAll('.game-screen');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      
      // Update nav active styling
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update screen visibility
      screens.forEach(s => s.classList.remove('active'));
      document.getElementById(target).classList.add('active');

      game.activeTab = target;
      
      SoundSynth.playClick();

      // Special redraw tasks
      if (target === 'screen-cultivate') {
        game.renderAllGrowing();
      } else if (target === 'screen-encyclopedia') {
        game.renderEncyclopedia();
      } else if (target === 'screen-shop') {
        game.updateShopUI();
      }
    });
  });

  // 2. Sound Toggle
  const soundBtn = document.getElementById('sound-toggle-btn');
  const soundIcon = document.getElementById('sound-status-icon');
  if (soundBtn && soundIcon) {
    soundBtn.addEventListener('click', () => {
      const active = SoundSynth.toggle();
      soundIcon.innerText = active ? "🔊 Sound On" : "🔇 Sound Off";
    });
  }

  // Initialize sound on first user touch/click on screen
  const initSoundContext = () => {
    SoundSynth.init();
    window.removeEventListener('click', initSoundContext);
    window.removeEventListener('touchstart', initSoundContext);
  };
  window.addEventListener('click', initSoundContext);
  window.addEventListener('touchstart', initSoundContext);

  // 3. Food Drawer Toggle
  const foodDisplay = document.getElementById('food-display-btn');
  const foodDrawer = document.getElementById('food-drawer');
  const closeDrawer = document.getElementById('close-drawer-btn');

  if (foodDisplay && foodDrawer && closeDrawer) {
    foodDisplay.addEventListener('click', () => {
      foodDrawer.classList.toggle('open');
      SoundSynth.playClick();
    });

    closeDrawer.addEventListener('click', () => {
      foodDrawer.classList.remove('open');
      SoundSynth.playClick();
    });
  }

  // Food Option clicks
  const foodCards = document.querySelectorAll('.food-card');
  foodCards.forEach(card => {
    card.addEventListener('click', () => {
      const dur = parseInt(card.dataset.duration);
      const cost = parseInt(card.dataset.cost);
      game.refillFood(dur, cost);
    });
  });

  // 4. Shop purchase clicks
  const shopButtons = document.querySelectorAll('.buy-btn');
  shopButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      game.upgradeEquipment(type);
    });
  });

  // 5. Encyclopedia details close
  const closeDetail = document.getElementById('modal-close-btn');
  if (closeDetail) {
    closeDetail.addEventListener('click', () => {
      game.closeDetailModal();
    });
  }

  // 6. SWIPE TO HARVEST IMPLEMENTATION (Supports both Desktop and Mobile smoothly)
  const spawner = document.getElementById('kazuki-spawner');
  
  let activePointers = new Set();
  
  // Track pointer down/up state for desktop swipe
  let isPointerDown = false;
  
  const handleHarvestCheck = (clientX, clientY) => {
    // Find all growing-kazuki elements under the pointer coordinates
    const elements = document.elementsFromPoint(clientX, clientY);
    elements.forEach(el => {
      // Find parent div if child img is matched
      const item = el.closest('.growing-kazuki');
      if (item && item.classList.contains('mature')) {
        const id = item.id.replace('kazuki-', '');
        game.harvest(id, clientX, clientY);
      }
    });
  };

  if (spawner) {
    // Mouse Drag (Desktop)
    spawner.addEventListener('mousedown', (e) => {
      isPointerDown = true;
      handleHarvestCheck(e.clientX, e.clientY);
    });
    
    window.addEventListener('mouseup', () => {
      isPointerDown = false;
    });

    spawner.addEventListener('mousemove', (e) => {
      if (isPointerDown) {
        handleHarvestCheck(e.clientX, e.clientY);
      }
    });

    // Touch Swipe (Mobile)
    spawner.addEventListener('touchstart', (e) => {
      isPointerDown = true;
      const touch = e.touches[0];
      handleHarvestCheck(touch.clientX, touch.clientY);
    });

    spawner.addEventListener('touchmove', (e) => {
      if (isPointerDown) {
        const touch = e.touches[0];
        handleHarvestCheck(touch.clientX, touch.clientY);
      }
    });

    spawner.addEventListener('touchend', () => {
      isPointerDown = false;
    });
  }

  // 7. CORE GAME LOOP (Spawning & Timer Ticks)
  setInterval(() => {
    // Decrement food timer
    if (game.foodTimer > 0) {
      game.foodTimer--;
      game.updateFoodTimerUI();
      
      // Auto-turn off steam if food runs dry
      if (game.foodTimer === 0) {
        game.updateHumidifierSteam();
      }
    }

    // Attempt spawning a sprout
    game.trySprout();

    // Attempt withering mature Kazukis if food is dry
    game.tickWither();
  }, 1000);

  // Periodical auto-saver (every 5 seconds)
  setInterval(() => {
    game.saveGame();
  }, 5000);
});
