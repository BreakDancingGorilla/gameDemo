// Fixed game.js — two-canvas setup (layer1 = game, layer2 = UI)

addEventListener("load", () => {
  // ---- CANVASES ----
  const canvas = document.getElementById("layer1");
  const ctx = canvas.getContext("2d");
  const canvas2 = document.getElementById("layer2");
  const ui = canvas2.getContext("2d");

  // Keep a steady internal resolution for consistent physics;
  // stretch visually to fit viewport.
  function sizeCanvases() {
    const w = document.documentElement.clientWidth;
    const h = Math.floor(document.documentElement.clientHeight * 0.78);
    canvas.width = 1280;  canvas.height = 720;
    canvas2.width = 1280; canvas2.height = 720;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    canvas2.style.width = w + "px";
    canvas2.style.height = h + "px";
  }
  sizeCanvases();
  addEventListener("resize", sizeCanvases);

  const canvasTopYAxis = Math.floor(document.documentElement.clientHeight * 0.11);
  const canvasBottomYAxis = canvas.height; // internal space bound

  ctx.globalAlpha = 1.0;
  ui.globalAlpha = 1.0;

  // ---- INPUT ----
  const keyPress = {
    w: false, a: false, s: false, d: false,
    f: false, one: false, two: false, three: false, four: false, five: false,
    space: false, ArrowUp: false, ArrowDown: false, ArrowRight: false, ArrowLeft: false,
  };

  addEventListener("keydown", (e) => {
    const k = e.key;
    switch (k) {
      case "w": keyPress.w = true; break;
      case "a": keyPress.a = true; break;
      case "s": keyPress.s = true; break;
      case "d": keyPress.d = true; break;
      case "f": keyPress.f = true; break;
      case "1": keyPress.one = true; break;
      case "2": keyPress.two = true; break;
      case "3": keyPress.three = true; break;
      case "4": keyPress.four = true; break;
      case "5": keyPress.five = true; break;
      case " ": keyPress.space = true; break;
      case "ArrowUp": keyPress.ArrowUp = true; e.preventDefault(); break;
      case "ArrowLeft": keyPress.ArrowLeft = true; e.preventDefault(); break;
      case "ArrowDown": keyPress.ArrowDown = true; e.preventDefault(); break;
      case "ArrowRight": keyPress.ArrowRight = true; e.preventDefault(); break;
    }
  });
  addEventListener("keyup", (e) => {
    const k = e.key;
    switch (k) {
      case "w": keyPress.w = false; break;
      case "a": keyPress.a = false; break;
      case "s": keyPress.s = false; break;
      case "d": keyPress.d = false; break;
      case "f": keyPress.f = false; break;
      case "1": keyPress.one = false; break;
      case "2": keyPress.two = false; break;
      case "3": keyPress.three = false; break;
      case "4": keyPress.four = false; break;
      case "5": keyPress.five = false; break;
      case " ": keyPress.space = false; break;
      case "ArrowUp": keyPress.ArrowUp = false; break;
      case "ArrowLeft": keyPress.ArrowLeft = false; break;
      case "ArrowDown": keyPress.ArrowDown = false; break;
      case "ArrowRight": keyPress.ArrowRight = false; break;
    }
  });

  // ---- HELPERS ----
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const aabb = (a, b) =>
    a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

  // ---- TEXT STYLE / SIMPLE TEXT RENDER ----
  // (Simplified. Uses a Google Fonts <link> in HTML; no FontFace with CSS URL.)
  const textStyle = {
    fontFamily: "'Permanent Marker', system-ui, sans-serif",
    fontSize: 40,
    color: "#fcf259",
    border: { enabled: true, width: 6, color: "#9c1d2c" },
  };

  function drawUIText(s, x, y, size = textStyle.fontSize) {
    ui.save();
    ui.font = `${size}px ${textStyle.fontFamily}`;
    ui.fillStyle = textStyle.color;
    if (textStyle.border.enabled) {
      ui.lineWidth = textStyle.border.width;
      ui.strokeStyle = textStyle.border.color;
      ui.strokeText(s, x, y);
    }
    ui.fillText(s, x, y);
    ui.restore();
  }

  // ---- CLASSES / ENTITIES ----
  class Character {
    constructor(x, y, width, height, speed, color) {
      this.x = x; this.y = y;
      this.width = width; this.height = height;
      this.speed = speed;
      this.color = color;
      this.lastPosX = x; this.lastPosY = y;
    }
    updateMovementKeyboard(dt) {
      let vx = 0, vy = 0;
      if (keyPress.w) vy -= 1;
      if (keyPress.s) vy += 1;
      if (keyPress.a) vx -= 1;
      if (keyPress.d) vx += 1;
      if (vx && vy) { vx *= Math.SQRT1_2; vy *= Math.SQRT1_2; } // proper diagonal normalization

      this.x += vx * this.speed * dt;
      this.y += vy * this.speed * dt;

      // bounds
      if (this.x < 0) this.x = 0;
      if (this.y < 0) this.y = 0;
      if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
      if (this.y + this.height > canvasBottomYAxis) this.y = canvasBottomYAxis - this.height;
    }
    render() {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  class ObjectList {
    constructor(width, height) {
      this.array = [];
      this.widthBP = width;
      this.heightBP = height;
      this.speedBP = 0;
      this.colorBP = "green";
      this.renderModeBP = 1; // 1=rect, 2=image (not used here), 3=gif frames (not used)
      this.typeBP = 1;
    }
    create(n, randomPos = true, opts = {}) {
      for (let i = 0; i < n; i++) {
        const w = opts.width ?? this.widthBP;
        const h = opts.height ?? this.heightBP;
        const x = randomPos ? rand(w, canvas.width - w) : (opts.x ?? 0);
        const y = randomPos ? rand(h, canvas.height - h) : (opts.y ?? 0);
        const speed = opts.speed ?? this.speedBP;
        const color = opts.color ?? this.colorBP;
        const hp = opts.hp ?? 10;
        const type = opts.type ?? this.typeBP;
        this.array.push({ x, y, width: w, height: h, speed, color, hp, hpMax: hp, type });
      }
    }
    removeAt(i) {
      this.array.splice(i, 1);
    }
    renderRects() {
      for (const o of this.array) {
        ctx.fillStyle = o.color;
        ctx.fillRect(o.x, o.y, o.width, o.height);
      }
    }
  }

  // ---- WORLD STATE ----
  const player = new Character(150, 300, 25, 35, 270, "green");

  const zombies = new ObjectList(25, 35);
  zombies.colorBP = "green";
  zombies.speedBP = 220;

  const bullets = new ObjectList(6, 6);
  const coins = new ObjectList(20, 20);

  const score = {
    kills: 0,
    wave: 1,
    coins: 0,
    coinMult: 1,
  };

  const gun = {
    bulletSpeed: 1000,
    cooldown: 0.15, // seconds
    timer: 0,
    update(dt) {
      this.timer -= dt;
      // Determine shooting direction
      let dx = 0, dy = 0;
      if (keyPress.ArrowRight) dx = 1;
      else if (keyPress.ArrowLeft) dx = -1;
      else if (keyPress.ArrowUp) dy = -1;
      else if (keyPress.ArrowDown) dy = 1;

      if ((dx || dy) && this.timer <= 0) {
        this.timer = this.cooldown;
        const bx = player.x + player.width / 2 - 3;
        const by = player.y + player.height / 2 - 3;
        bullets.create(1, false, { x: bx, y: by, width: 6, height: 6, dx, dy });
        // attach dx/dy to the last bullet
        const b = bullets.array[bullets.array.length - 1];
        b.dx = dx; b.dy = dy;
      }

      // move bullets & cull
      for (let i = bullets.array.length - 1; i >= 0; i--) {
        const b = bullets.array[i];
        b.x += (b.dx || 0) * this.bulletSpeed * dt;
        b.y += (b.dy || 0) * this.bulletSpeed * dt;
        if (b.x < -10 || b.y < -10 || b.x > canvas.width + 10 || b.y > canvas.height + 10) {
          bullets.removeAt(i);
        }
      }
    },
  };

  const healthBar = {
    playerMax: 10,
    playerHP: 10,
    grace: 0, // i-frames timer
    update(dt) {
      this.grace = Math.max(0, this.grace - dt);
    },
    drawEntityBar(x, y, w, h, hp, max) {
      ui.fillStyle = "#000";
      ui.fillRect(x, y, w, h);
      const pct = Math.max(0, Math.min(1, hp / max));
      ui.fillStyle = "#ef4444";
      ui.fillRect(x + 1, y + 1, (w - 2) * pct, h - 2);
      ui.fillStyle = "#9ca3af";
      ui.fillRect(x + 1 + (w - 2) * pct, y + 1, (w - 2) * (1 - pct), h - 2);
    },
    draw() {
      // player bar above player
      this.drawEntityBar(player.x, player.y - 12, player.width, 8, this.playerHP, this.playerMax);
      // zombies
      for (const z of zombies.array) {
        this.drawEntityBar(z.x, z.y - 10, z.width, 6, z.hp, z.hpMax);
      }
    }
  };

  const waveHandler = {
    startWave() {
      const count = Math.max(1, Math.floor(score.wave * 1.5));
      zombies.array.length = 0;

      for (let i = 0; i < count; i++) {
        // special zombie types: fast and boss
        let type = 1, w = 25, h = 35, spd = 220, hp = 10, color = "green";
        if (score.wave % 5 === 0 && i === 0) {
          type = 3; w = 60; h = 60; spd = 250; hp = 40; color = "red";
        } else if (score.wave % 3 === 0 && i < Math.floor(score.wave / 2)) {
          type = 2; w = 20; h = 28; spd = 300; hp = 5; color = "lime";
        }
        zombies.create(1, true, { width: w, height: h, speed: spd, hp, color, type });
      }

      // coins equal to wave number
      coins.array.length = 0;
      coins.create(score.wave, true, { width: 20, height: 20, color: "#fbbf24" });
    },
    update() {
      if (zombies.array.length === 0) {
        score.wave += 1;
        this.startWave();
      }
    }
  };

  // ---- COLLISIONS / UPDATES ----
  function updateBulletsVsZombies() {
    for (let i = bullets.array.length - 1; i >= 0; i--) {
      const b = bullets.array[i];
      let hit = false;
      for (let j = zombies.array.length - 1; j >= 0; j--) {
        const z = zombies.array[j];
        if (aabb({ x: b.x, y: b.y, width: b.width, height: b.height }, z)) {
          hit = true;
          z.hp -= 2;
          if (z.hp <= 0) {
            zombies.removeAt(j);
            score.kills += 1;
          }
          break;
        }
      }
      if (hit) bullets.removeAt(i);
    }
  }

  function updateZombies(dt) {
    for (const z of zombies.array) {
      const dx = player.x - z.x;
      const dy = player.y - z.y;
      const d = Math.hypot(dx, dy) || 1;
      z.x += (dx / d) * z.speed * dt;
      z.y += (dy / d) * z.speed * dt;

      // bounds
      if (z.x < 0) z.x = 0;
      if (z.y < 0) z.y = 0;
      if (z.x + z.width > canvas.width) z.x = canvas.width - z.width;
      if (z.y + z.height > canvasBottomYAxis) z.y = canvasBottomYAxis - z.height;
    }
  }

  function updatePlayerDamage(dt) {
    const touching = zombies.array.some(z => aabb(player, z));
    if (touching && healthBar.grace <= 0) {
      healthBar.playerHP -= 1;
      healthBar.grace = 1.0; // 1s i-frames
      if (healthBar.playerHP <= 0) {
        // reset run
        healthBar.playerHP = healthBar.playerMax;
        score.kills = 0; score.coins = 0; score.wave = 1;
        waveHandler.startWave();
      }
    }
  }

  function updateCoinPickup() {
    for (let i = coins.array.length - 1; i >= 0; i--) {
      const c = coins.array[i];
      if (aabb(player, c)) {
        coins.removeAt(i);
        score.coins += 1 * score.coinMult;
      }
    }
  }

  // ---- SHOP (F to open/close) ----
  const shop = {
    open: false,
    toggle() { this.open = !this.open; },
    update() {
      // Handle one-shot presses for options when open
      if (!this.open) return;
      if (keyPress.one) { if (score.coins >= 25) { player.speed += 10; score.coins -= 25; } keyPress.one = false; }
      if (keyPress.two) { if (score.coins >= 25) { player.width = Math.round(player.width * 1.1); player.height = Math.round(player.height * 1.1); score.coins -= 25; } keyPress.two = false; }
      if (keyPress.three) { if (score.coins >= 25) { score.coinMult += 1; score.coins -= 25; } keyPress.three = false; }
      if (keyPress.four) { /* reserved */ keyPress.four = false; }
      if (keyPress.five) { this.open = false; keyPress.five = false; }
    },
    draw() {
      if (!this.open) return;
      const x = 50, y = 200, w = 420, h = 320;
      ui.save();
      ui.fillStyle = "rgba(0,0,0,.85)";
      ui.fillRect(x, y, w, h);
      drawUIText("Shop", x + 16, y + 12, 36);
      ui.fillStyle = "#e2e8f0";
      ui.font = "22px system-ui, sans-serif";
      ui.fillText("(1) Speed +10  — $25", x + 16, y + 70);
      ui.fillText("(2) Size +10%   — $25", x + 16, y + 100);
      ui.fillText("(3) Coin Mult +1 — $25", x + 16, y + 130);
      ui.fillText("(5) Exit", x + 16, y + 160);
      ui.fillText(`Coins: ${score.coins}`, x + 16, y + 200);
      ui.restore();
    }
  };

  // F toggles shop, but make it edge-triggered so it doesn't flicker
  let fLatch = false;
  function handleShopToggle() {
    if (keyPress.f && !fLatch) {
      shop.toggle();
      fLatch = true;
    } else if (!keyPress.f && fLatch) {
      fLatch = false;
    }
  }

  // ---- MAIN LOOP ----
  const deltaTime = { last: performance.now(), dt: 0 };
  function step(now = performance.now()) {
    deltaTime.dt = Math.min(0.05, (now - deltaTime.last) / 1000);
    deltaTime.last = now;

    // Update
    handleShopToggle();
    shop.update();

    gun.update(deltaTime.dt);
    player.updateMovementKeyboard(deltaTime.dt);
    updateZombies(deltaTime.dt);
    updateBulletsVsZombies();
    updatePlayerDamage(deltaTime.dt);
    updateCoinPickup();
    waveHandler.update();
    healthBar.update(deltaTime.dt);

    // Render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ui.clearRect(0, 0, canvas2.width, canvas2.height);

    // draw order
    coins.renderRects();
    zombies.renderRects();
    // bullets
    ctx.fillStyle = "#111827";
    for (const b of bullets.array) ctx.fillRect(b.x, b.y, b.width, b.height);
    player.render();
    healthBar.draw();

    // HUD
    drawUIText(`Zombie Kills  ${score.kills}`, 50, 50);
    drawUIText(`Wave  ${score.wave}`, 50, 50 + textStyle.fontSize + 10);
    drawUIText(`Coins  ${score.coins}`, 50, 50 + textStyle.fontSize * 2 + 20);

    // shop
    shop.draw();

    requestAnimationFrame(step);
  }

  // ---- INIT ----
  ui.font = `32px ${textStyle.fontFamily}`;
  ui.textBaseline = "top";
  waveHandler.startWave();
  requestAnimationFrame(step);
});
