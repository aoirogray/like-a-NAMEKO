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
  1: { id: 1, name: "通常かずき", rarity: 1, baseNP: 10, img: "assets/normal_kazuki.png", cssFilter: "", desc: "最も標準的なかずき。プログラミングとコーヒーをこよなく愛する。日々のコーディング作業で目が少し冴えている。" },
  2: { id: 2, name: "きのこかずき", rarity: 2, baseNP: 30, img: "assets/mushroom_kazuki.png", cssFilter: "", desc: "なめこの帽子をかぶった可愛いかずき。すっかりきのこになりきっており、原木との親和性が抜群。少しぬめぬめしている気がする。" },
  3: { id: 3, name: "インテリかずき", rarity: 3, baseNP: 80, img: "assets/smart_kazuki.png", cssFilter: "", desc: "メガネをかけ、ビジネススーツを着こなした知的なかずき。どんな難解なアルゴリズムも一瞬で解き明かすが、たまにキーボードを叩くのが速すぎる。" },
  4: { id: 4, name: "ゴールデンかずき", rarity: 5, baseNP: 500, img: "assets/golden_kazuki.png", cssFilter: "", desc: "全身がメタリックな金色に輝く、伝説の超ウルトラレアかずき。収穫すると莫大なNPをもたらし、栽培場全体が金色の幸運に包まれる。" },
  5: { id: 5, name: "枯れかずき", rarity: 1, baseNP: 1, img: "assets/withered_kazuki.png", cssFilter: "", desc: "フードが切れた状態で放置され、乾燥してしまったかずき。元気がなく、グルグルお目々になっている。すぐに水分（フード）をあげて復活させよう。" },
  6: { id: 6, name: "忍者かずき", rarity: 2, baseNP: 40, img: "assets/ninja_kazuki.png", cssFilter: "", desc: "頭巾をかぶった忍びのキノコ。物音ひとつ立てずに移動するが、キーボードの打鍵音だけは隠せないらしい。" },
  7: { id: 7, name: "宇宙飛行士かずき", rarity: 3, baseNP: 90, img: "assets/astro_kazuki.png", cssFilter: "", desc: "ヘルメットをかぶったSFキノコ。無重力空間でのコードデバッグに挑戦中。カサがヘルメットに引っかかって苦しそう。" },
  8: { id: 8, name: "猫耳かずき", rarity: 2, baseNP: 35, img: "assets/cat_kazuki.png", cssFilter: "", desc: "猫 of 耳としっぽが生えた可愛いキノコ。語尾に「〜にゃ」をつけたいが、恥ずかしさが勝って言えないでいる。" },
  9: { id: 9, name: "マチョかずき", rarity: 3, baseNP: 100, img: "assets/macho_kazuki.png", cssFilter: "", desc: "筋骨隆々としたビルドアップキノコ。自慢の二頭筋を誇示している。プログラミングはパワーだと信じている。" },
  10: { id: 10, name: "天使かずき", rarity: 4, baseNP: 200, img: "assets/angel_kazuki.png", cssFilter: "", desc: "背中に白い羽を授かった神秘的なキノコ。頭のハロー（光輪）が優しく発光し、見ているだけで癒やしをくれる。" },

  // Green / Melon series (hue-rotate(90deg))
  11: { id: 11, name: "メロンかずき", rarity: 2, baseNP: 40, img: "assets/normal_kazuki.png", cssFilter: "hue-rotate(90deg)", desc: "メロンのように爽やかな緑色になったかずき。網目模様が体に浮き出ている気がするが、ただの気のせい。" },
  12: { id: 12, name: "緑きのこかずき", rarity: 2, baseNP: 45, img: "assets/mushroom_kazuki.png", cssFilter: "hue-rotate(90deg)", desc: "全身がフォレストグリーンに変色したきのこかずき。苔との親和性がさらに高まり、原木に完璧に擬態している。" },
  13: { id: 13, name: "エリートかずき", rarity: 3, baseNP: 110, img: "assets/smart_kazuki.png", cssFilter: "hue-rotate(80deg)", desc: "スーツと肌が緑色のサイバーカラーになったスマートかずき。地球外の高度な暗号資産システムをハック可能。" },
  14: { id: 14, name: "プラチナかずき", rarity: 5, baseNP: 600, img: "assets/golden_kazuki.png", cssFilter: "hue-rotate(180deg) saturate(0.2) brightness(1.5)", desc: "金を超えた輝きを持つプラチナ製のかずき。神々しい白銀の輝きを放ち、収穫時のサウンドも耳にとても心地よい。" },
  15: { id: 15, name: "カビかずき", rarity: 1, baseNP: 2, img: "assets/withered_kazuki.png", cssFilter: "hue-rotate(120deg)", desc: "放置されてカビのような緑色の斑点が生えてしまった枯れかずき。お風呂に入れてあげればすぐ元に戻るが、NPは相変わらず低い。" },
  16: { id: 16, name: "木ノ葉忍者かずき", rarity: 2, baseNP: 55, img: "assets/ninja_kazuki.png", cssFilter: "hue-rotate(90deg)", desc: "森に溶け込む草緑色の忍び装束を身にまとった忍者。木葉隠れの術を得意とし、完全に気配を消している。" },
  17: { id: 17, name: "未知の宇宙かずき", rarity: 3, baseNP: 120, img: "assets/astro_kazuki.png", cssFilter: "hue-rotate(120deg)", desc: "緑色の宇宙服をまとった、未知の生命体のような宇宙飛行士。ヘルメット越しに見せるフレンドリーな笑顔が不気味。" },
  18: { id: 18, name: "シャム猫かずき", rarity: 2, baseNP: 50, img: "assets/cat_kazuki.png", cssFilter: "hue-rotate(40deg) brightness(0.8)", desc: "ちょっぴり大人の焦げ茶色（シャム風）の毛並みを持つ猫耳キノコ。気高きプライドを持つが、なでられると弱い。" },
  19: { id: 19, name: "ハルクかずき", rarity: 4, baseNP: 220, img: "assets/macho_kazuki.png", cssFilter: "hue-rotate(100deg)", desc: "怒りのパワーで全身が黄緑色に染まったマッチョキノコ。破壊衝動に満ちており、デバッグ時にバグごとコードを粉砕する。" },
  20: { id: 20, name: "新緑 of 精霊かずき", rarity: 4, baseNP: 250, img: "assets/angel_kazuki.png", cssFilter: "hue-rotate(90deg)", desc: "新緑の季節を司る緑の羽の天使キノコ。彼が原木にたたずむだけで、他のキノコの成長速度がアップするような気がする。" },

  // Blue / Cyber series (hue-rotate(180deg))
  21: { id: 21, name: "ソーダかずき", rarity: 2, baseNP: 50, img: "assets/normal_kazuki.png", cssFilter: "hue-rotate(180deg)", desc: "ソーダ水のように透き通る青色のかずき。見ているだけで涼しい気分になれる。微炭酸。" },
  22: { id: 22, name: "氷きのこかずき", rarity: 2, baseNP: 60, img: "assets/mushroom_kazuki.png", cssFilter: "hue-rotate(180deg)", desc: "カサに氷結晶が乗った、氷のきのこかずき。触ると冷たく、原木がちょっと凍りついている。" },
  23: { id: 23, name: "サイバーかずき", rarity: 3, baseNP: 130, img: "assets/smart_kazuki.png", cssFilter: "hue-rotate(180deg)", desc: "青色のネオンホログラムを放つインテリキノコ。メタバース空間での開発をメインとしており、存在自体がバーチャル。" },
  24: { id: 24, name: "ダイヤかずき", rarity: 5, baseNP: 700, img: "assets/golden_kazuki.png", cssFilter: "hue-rotate(190deg) brightness(1.3) saturate(0.5)", desc: "ダイヤモンドの硬度と輝きを持つ、最高品質のキノコ。眩しすぎる水色のきらめきが部屋を照らし出す。" },
  25: { id: 25, name: "深海かずき", rarity: 2, baseNP: 5, img: "assets/withered_kazuki.png", cssFilter: "hue-rotate(200deg) brightness(0.7)", desc: "深海1000mの圧力に耐えてカサが紺色にしぼんでしまった枯れキノコ。暗闇でうっすらと発光してプランクトンを呼び寄せる。" },
  26: { id: 26, name: "海忍かずき", rarity: 2, baseNP: 70, img: "assets/ninja_kazuki.png", cssFilter: "hue-rotate(200deg)", desc: "紺青の装束の忍者キノコ。水上を走る「水蜘蛛の術」をマスターし、お風呂場でも活動可能。" },
  27: { id: 27, name: "ネオ宇宙飛行士", rarity: 3, baseNP: 150, img: "assets/astro_kazuki.png", cssFilter: "hue-rotate(200deg)", desc: "近未来のネオ宇宙服（サイアンブルー）を身にまとった宇宙飛行士。酸素の代わりにプログラミング言語を吸って生きている。" },
  28: { id: 28, name: "ロシアンブルー猫", rarity: 2, baseNP: 60, img: "assets/cat_kazuki.png", cssFilter: "hue-rotate(220deg)", desc: "高貴なアッシュブルーの体毛を持つ猫耳キノコ。ツンデレ気質であり、時折見せるデレが最高に可愛い。" },
  29: { id: 29, name: "ポセイドンかずき", rarity: 4, baseNP: 280, img: "assets/macho_kazuki.png", cssFilter: "hue-rotate(200deg)", desc: "海の神の力を宿し、青く巨大化したマッチョキノコ。そのパンチは原木の水分を一瞬で蒸発させるほど強力。" },
  30: { id: 30, name: "堕天使かずき", rarity: 4, baseNP: 300, img: "assets/angel_kazuki.png", cssFilter: "hue-rotate(240deg) brightness(0.6)", desc: "天界の掟を破り、闇の力を得た黒紫の羽を持つ天使キノコ。少し寂しそうな表情で原木の裏に隠れている。" },

  // Purple / Pink series (hue-rotate(270deg))
  31: { id: 31, name: "グレープかずき", rarity: 2, baseNP: 60, img: "assets/normal_kazuki.png", cssFilter: "hue-rotate(270deg)", desc: "ブドウの甘い香りが漂う紫のかずき。果汁100%のジューシーなエキスがカサから滴り落ちている。" },
  32: { id: 32, name: "毒きのこかずき", rarity: 2, baseNP: 80, img: "assets/mushroom_kazuki.png", cssFilter: "hue-rotate(270deg)", desc: "どぎつい紫色になった、怪しい毒きのこ。食べると笑いが止まらなくなる効果があるが、収穫する分には安全。" },
  33: { id: 33, name: "マッド開発者", rarity: 3, baseNP: 160, img: "assets/smart_kazuki.png", cssFilter: "hue-rotate(280deg)", desc: "ピンクのネクタイを締め、狂気に満ちたコードを吐き出すマッドサイエンティストなキノコ。怪しい薬剤をキーボードにこぼした。" },
  34: { id: 34, name: "アメジストかずき", rarity: 5, baseNP: 800, img: "assets/golden_kazuki.png", cssFilter: "hue-rotate(280deg) brightness(1.2)", desc: "紫水晶（アメジスト）で結晶化した豪華なキノコ。魔力を宿しており、部屋全体のレア出現率を隠しパラメータで微増させる。" },
  35: { id: 35, name: "ゾンビ枯れかずき", rarity: 2, baseNP: 8, img: "assets/withered_kazuki.png", cssFilter: "hue-rotate(300deg)", desc: "腐敗が進んで妖しい紫色に変色した枯れかずき。ゾンビウイルスに感染しているが、ゆっくり動くだけなので無害。" },
  36: { id: 36, name: "くのいちかずき", rarity: 2, baseNP: 85, img: "assets/ninja_kazuki.png", cssFilter: "hue-rotate(300deg)", desc: "桃色の装束をまとった艶やかなくのいちキノコ。華麗なアクロバットと甘い香りで敵を惑わせ、素早く収穫される。" },
  37: { id: 37, name: "ワープ宇宙飛行士", rarity: 3, baseNP: 180, img: "assets/astro_kazuki.png", cssFilter: "hue-rotate(300deg)", desc: "ワープ航法中の時空の歪みで赤紫色にブレて表示される宇宙飛行士。彼のカレンダーは常に2年先を指している。" },
  38: { id: 38, name: "チェシャ猫かずき", rarity: 3, baseNP: 95, img: "assets/cat_kazuki.png", cssFilter: "hue-rotate(300deg)", desc: "ピンクと紫の縞模様を持つ、いたずら好きな猫耳キノコ。収穫される直前にニヤニヤとした笑い顔だけを残して消えようとする。" },
  39: { id: 39, name: "デビルマッチョ", rarity: 4, baseNP: 350, img: "assets/macho_kazuki.png", cssFilter: "hue-rotate(320deg)", desc: "悪魔の筋トレメソッドで限界を突破し、赤紫色の筋肉を手に入れたマッチョキノコ。スクワットで原木を揺らす。" },
  40: { id: 40, name: "キューピッドかずき", rarity: 4, baseNP: 380, img: "assets/angel_kazuki.png", cssFilter: "hue-rotate(320deg) saturate(1.5)", desc: "ハートの矢を持つ恋の天使キノコ。彼の矢に射抜かれた開発者は、バグだらけのコードすら愛おしく感じてしまう。" },

  // Special series (mix of filters)
  41: { id: 41, name: "シャドウかずき", rarity: 3, baseNP: 100, img: "assets/normal_kazuki.png", cssFilter: "brightness(0) invert(0.1)", desc: "光を吸収し、完全な黒い影（シルエット）となった不気味なかずき。誰の目にも見えないが、収穫時に確かに「存在」を感じる。" },
  42: { id: 42, name: "ネオンかずき", rarity: 3, baseNP: 140, img: "assets/mushroom_kazuki.png", cssFilter: "invert(1) hue-rotate(180deg) saturate(2)", desc: "色の反転効果（インバート）により、ネオンサイバーカラーに発光するサイケデリックなキノコ。クラブ音楽が好き。" },
  43: { id: 43, name: "ゴーストかずき", rarity: 4, baseNP: 300, img: "assets/smart_kazuki.png", cssFilter: "opacity(0.45) brightness(1.5) saturate(0.1)", desc: "半透明になり、この世をさまようインテリキノコの霊。成仏できない理由は、未解決のバグ（無限ループ）を残したため。" },
  44: { id: 44, name: "ルビーかずき", rarity: 5, baseNP: 1000, img: "assets/golden_kazuki.png", cssFilter: "hue-rotate(340deg) brightness(1.1) saturate(1.8)", desc: "真っ赤なルビー結晶に包まれた超絶レアキノコ。情熱の炎のような赤いきらめきを放ち、収穫した者に最高の幸運をもたらす。" },
  45: { id: 45, name: "ミイラかずき", rarity: 2, baseNP: 20, img: "assets/withered_kazuki.png", cssFilter: "sepia(0.8) contrast(1.2)", desc: "包帯を巻いたようなセピア色の乾燥したミイラキノコ。数千年前の古代エジプト原木から発掘された歴史的価値がある。" },
  46: { id: 46, name: "桜忍者かずき", rarity: 3, baseNP: 150, img: "assets/ninja_kazuki.png", cssFilter: "hue-rotate(330deg) saturate(1.3)", desc: "桜の花びらの舞うピンクの装束をまとった忍者。春の季節にのみ現れ、収穫されるとほのかな桜の香りを残す。" },
  47: { id: 47, name: "ブラックホール宇宙", rarity: 4, baseNP: 400, img: "assets/astro_kazuki.png", cssFilter: "contrast(3) brightness(0.2) invert(1) hue-rotate(180deg)", desc: "中心に超重力ブラックホールを宿したアストロキノコ。周囲のNPを光ごと吸い込むため、彼の周りだけ時空が歪んでいる。" },
  48: { id: 48, name: "黒猫かずき", rarity: 3, baseNP: 180, img: "assets/cat_kazuki.png", cssFilter: "brightness(0.25) contrast(1.2)", desc: "艶やかな黒い毛並みを持つ、神秘的な黒猫耳キノコ。横切るだけで不幸を払うと言われており、魔女の使いとしても有名。" },
  49: { id: 49, name: "ナイトマッチョ", rarity: 4, baseNP: 450, img: "assets/macho_kazuki.png", cssFilter: "brightness(0.3) saturate(0.5) hue-rotate(240deg)", desc: "漆黒の鎧をまとったような、闇の騎士マッチョキノコ。プログラミングの「深夜残業」によって鍛え上げられた不屈の筋肉を持つ。" },
  50: { id: 50, name: "大天使ウリエル", rarity: 5, baseNP: 2000, img: "assets/angel_kazuki.png", cssFilter: "brightness(1.4) saturate(2.0) sepia(0.3) drop-shadow(0 0 8px #ffe066)", desc: "神の炎を司る、最高峰の大天使キノコ。黄金の後光がまばゆく輝き、収穫するとゲーム画面が一瞬きらめきで満たされる最高レア。" }
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
    this.counts = {};
    for (let i = 1; i <= 50; i++) {
      this.counts[i] = 0;
    }
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
        const savedCounts = data.counts || {};
        for (let i = 1; i <= 50; i++) {
          this.counts[i] = savedCounts[i] || 0;
        }
        
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

  // Get available Kazuki types based on upgrade sum
  getAvailableTypes() {
    const sum = this.upgrades.humidifier + this.upgrades.heater + this.upgrades.light;
    let maxId = 2;
    if (sum >= 13) maxId = 50;
    else if (sum >= 12) maxId = 45;
    else if (sum >= 11) maxId = 40;
    else if (sum >= 10) maxId = 35;
    else if (sum >= 9) maxId = 30;
    else if (sum >= 8) maxId = 25;
    else if (sum >= 7) maxId = 20;
    else if (sum >= 6) maxId = 15;
    else if (sum >= 5) maxId = 10;
    else if (sum >= 4) maxId = 6;
    
    const ids = [];
    for (let i = 1; i <= maxId; i++) {
      if (i !== 5) ids.push(i); // Exclude withered Kazuki from sprouting
    }
    return ids;
  }

  // Select Kazuki type based on Heater level and Rarity weights
  rollKazukiType() {
    const availableIds = this.getAvailableTypes();
    const heaterLvl = this.upgrades.heater;
    
    // Calculate weights for each available type
    const weights = availableIds.map(id => {
      const db = KazukiDatabase[id];
      // Base rarity weight: Rarity 1: 100, Rarity 2: 25, Rarity 3: 6, Rarity 4: 1.5, Rarity 5: 0.3
      let weight = 100 / Math.pow(4, db.rarity - 1);
      
      // Apply heater level bonus
      if (db.rarity >= 3) {
        weight *= (1 + (heaterLvl - 1) * 0.5);
      }
      if (db.rarity === 5) {
        weight *= (1 + (heaterLvl - 1) * 0.8);
      }
      return { id, weight };
    });
    
    // Weighted random selection
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const w of weights) {
      random -= w.weight;
      if (random <= 0) {
        return w.id;
      }
    }
    return availableIds[0];
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
          el.classList.remove('golden'); // Remove gold glow if it was rare
          const imgEl = el.querySelector('img');
          imgEl.src = KazukiDatabase[5].img;
          imgEl.style.filter = ''; // Reset CSS color filter
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
    if (KazukiDatabase[k.type].rarity === 5) el.classList.add('golden');
    if (k.state === 'withered') el.classList.add('withered');

    el.style.left = `${k.x}%`;
    el.style.top = `${k.y}%`;
    
    const dbEntry = KazukiDatabase[k.state === 'withered' ? 5 : k.type];
    
    const img = document.createElement('img');
    img.src = dbEntry.img;
    img.alt = dbEntry.name;
    img.draggable = false;
    
    // Apply CSS color swap filter if it exists (and is not withered)
    if (k.state !== 'withered' && dbEntry.cssFilter) {
      img.style.filter = dbEntry.cssFilter;
    }
    
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
      if (isDiscovered && db.cssFilter) {
        img.style.filter = db.cssFilter;
      }
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
    
    const modalImg = document.getElementById('modal-img');
    modalImg.src = db.img;
    modalImg.style.filter = db.cssFilter || '';
    
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
      soundIcon.innerText = active ? "🔊 On" : "🔇 Off";
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
