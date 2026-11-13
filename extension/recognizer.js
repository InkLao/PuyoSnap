/* Puyo Champions: 0 empty, 1 red, 2 green, 3 blue, 4 yellow, 5 purple, 6 garbage. */
(function (root) {
  "use strict";
  function bounds(image) {
    const {width: w, height: h, data} = image;
    if (w < 120 || h < 220 || w / h < 0.4 || w / h > 0.7)
      throw new Error("Recorta un solo tablero completo, incluyendo su marco.");
    for (let y = 0; y < h * 0.2; y++) {
      let left = -1, right = -1, count = 0;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if ((data[i] + data[i + 1] + data[i + 2]) / 3 < 70 && data[i + 3] > 200) {
          if (left < 0) left = x;
          right = x; count++;
        }
      }
      if (count < w * 0.73 || right - left < w * 0.85) continue;
      // shortcut: Champions default frame and cell proportions; recalibrate for other skins/layouts.
      const dark = x => {
        const i = (y * w + x) * 4;
        return (data[i] + data[i + 1] + data[i + 2]) / 3 < 70;
      };
      left = Math.floor(w * 0.1); right = Math.floor(w * 0.9);
      if (!dark(left) || !dark(right)) continue;
      while (left > 0 && dark(left - 1)) left--;
      while (right < w - 1 && dark(right + 1)) right++;
      const span = right - left + 1;
      const width = span * 0.965;
      let height = width * 1.875;
      // Use the lower frame when visible; rounding the width can shift small screenshots by a cell.
      let bestDark = 0.65;
      const bottomLimit = Math.min(h, y + height * 1.05);
      for (let bottom = Math.floor(y + height * 0.95); bottom < bottomLimit; bottom++) {
        let darkCount = 0;
        for (let x = left; x <= right; x++) {
          const i = (bottom * w + x) * 4;
          if ((data[i] + data[i + 1] + data[i + 2]) / 3 < 70) darkCount++;
        }
        if (darkCount / span > bestDark) {
          bestDark = darkCount / span;
          height = bottom - y;
        }
      }
      // shortcut: a tight full-board crop can omit the lower frame; partial boards need explicit cropping.
      if (bestDark === 0.65 && Math.abs((h - y) / height - 1) <= 0.03)
        height = h - y;
      if (y + height > h + 2) continue;
      return {x: left + span * 0.0175, y, width, height};
    }
    // Recover the grid from uninterrupted side borders when effects cover the top.
    const coverage = [];
    const start = Math.floor(h * 0.3), end = Math.floor(h * 0.9);
    for (let x = 0; x < w; x++) {
      let count = 0;
      for (let y = start; y < end; y++) {
        const i = (y * w + x) * 4;
        if (data[i + 3] > 200 && (data[i] + data[i + 1] + data[i + 2]) / 3 < 70) count++;
      }
      coverage[x] = count / (end - start);
    }
    const edgeGap = Math.max(2, Math.round(w * 0.02));
    let left = -1, right = -1;
    for (let x = edgeGap; x < w * 0.15; x++)
      if (coverage[x] >= 0.9 && coverage[x - edgeGap] < 0.5) { left = x; break; }
    for (let x = w - 1 - edgeGap; x > w * 0.85; x--)
      if (coverage[x] >= 0.9 && coverage[x + edgeGap] < 0.5) { right = x; break; }
    if (left >= 0 && right - left >= w * 0.8) {
      const span = right - left + 1, width = span * 0.965, height = width * 1.875;
      let bottom = -1, bestDark = 0.65;
      for (let y = Math.max(Math.floor(h * 0.8), Math.ceil(height)); y < h; y++) {
        let count = 0;
        for (let x = left; x <= right; x++) {
          const i = (y * w + x) * 4;
          if (data[i + 3] > 200 && (data[i] + data[i + 1] + data[i + 2]) / 3 < 70) count++;
        }
        if (count / span > bestDark) { bestDark = count / span; bottom = y; }
      }
      if (bottom >= height && bottom - height < h * 0.2)
        return {x: left + span * 0.0175, y: bottom - height, width, height, inferredTop: true};
    }
    throw new Error("No pude localizar el marco. Incluye los bordes y las 12 filas del tablero.");
  }
  function classify(image, cx, cy, cw, ch) {
    const votes = [0, 0, 0, 0, 0, 0, 0];
    let total = 0;
    for (let y = Math.ceil(cy - ch * 0.43); y < cy + ch * 0.43; y++) {
      for (let x = Math.ceil(cx - cw * 0.43); x < cx + cw * 0.43; x++) {
        if (x < 0 || y < 0 || x >= image.width || y >= image.height) continue;
        const i = (y * image.width + x) * 4;
        const [r, g, b] = image.data.slice(i, i + 3);
        total++;
        const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
        if (max < 145) continue;
        if (delta / max < 0.22) { votes[6]++; continue; }
        let hue = max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
        hue = (hue * 60 + 360) % 360;
        const color = hue < 18 || hue >= 345 ? 1 : hue < 75 ? 4 : hue < 170 ? 2 : hue < 245 ? 3 : 5;
        votes[color]++;
      }
    }
    let color = 1;
    for (let c = 2; c <= 5; c++) if (votes[c] > votes[color]) color = c;
    if (votes[color] / total >= 0.28) return color;
    // Large white eyes can dominate a colored Puyo; garbage still lacks a substantial color vote.
    if (votes[color] / total >= 0.18 && votes[6] / total >= 0.25 &&
        (votes[color] + votes[6]) / total >= 0.5) return color;
    return votes[6] / total >= 0.25 ? 6 : 0;
  }
  function recognize(image) {
    if (!image || image.data?.length !== image.width * image.height * 4)
      throw new Error("Imagen no válida.");
    const box = bounds(image), cw = box.width / 6, ch = box.height / 12;
    const cells = [];
    for (let row = 0; row < 12; row++)
      for (let col = 0; col < 6; col++)
        cells.push(classify(image, box.x + (col + 0.5) * cw, box.y + (row + 0.5) * ch, cw, ch));
    // Only grounded pieces belong to the stable board; ignore the falling pair and top markers.
    for (let col = 0; col < 6; col++) {
      let gap = false;
      for (let row = 11; row >= 0; row--) {
        const index = row * 6 + col;
        if (cells[index] === 0) gap = true;
        if (gap) cells[index] = 0;
      }
    }
    if (!cells.some(Boolean)) throw new Error("No detecté Puyos colocados. Revisa el recorte y el aspecto visual.");
    return {cells, box};
  }
  function nexusUrl(cells) {
    if (!Array.isArray(cells) || cells.length !== 72 || cells.some(c => !Number.isInteger(c) || c < 0 || c > 6))
      throw new Error("El tablero debe tener 72 celdas válidas.");
    const legacy = "0475681";
    return "https://puyonexus.com/chainsim/?chain=" + cells.map(c => legacy[c]).join("");
  }
  const api = {recognize, nexusUrl};
  if (typeof module !== "undefined") module.exports = api;
  else root.PuyoCapture = api;
})(globalThis);






