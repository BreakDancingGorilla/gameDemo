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
