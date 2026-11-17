(() => {
  "use strict";
  if (document.getElementById("puyo-capture-panel")) return;
  const host = document.createElement("div");
  host.id = "puyo-capture-panel";
  host.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483647;max-width:calc(100vw - 32px)";
  const shadow = host.attachShadow({mode: "open"});
  shadow.innerHTML = `
    <style>
      :host {color-scheme:light}
      * {box-sizing:border-box}
      details {width:300px;max-width:calc(100vw - 32px);font:14px/1.5 system-ui,sans-serif;color:#172034;background:#fff;border:1px solid #bdc9d9;border-radius:12px;box-shadow:0 4px 24px #0003}
      summary {padding:12px 16px;cursor:pointer;font-weight:700}
      section {padding:0 16px 16px}
      p {margin:8px 0}
      #paste {padding:18px 12px;border:2px dashed #8a9bb2;border-radius:8px;background:#f5f8fc;text-align:center;cursor:text}
      :focus-visible {outline:3px solid #225acb;outline-offset:3px}
      input {width:100%;margin:8px 0;font:inherit}
      a {display:block;padding:10px;border-radius:6px;background:#174caa;color:white;text-align:center;font-weight:600;text-decoration:none}
      [hidden] {display:none}
      small {color:#465570}
      #status {overflow-wrap:anywhere}
    </style>
    <details open>
      <summary>Captura Puyo → Nexus</summary>
      <section>
        <p>Captura el tablero completo de Champions, con su marco.</p>
        <div id="paste" tabindex="0" role="group" aria-label="Pegar captura del tablero">Haz clic aquí y pega con <strong>Ctrl+V</strong></div>
        <label for="file">O selecciona una imagen:</label>
        <input id="file" type="file" accept="image/*">
        <p id="status" role="status" aria-live="polite">Las correcciones se hacen en Nexus.</p>
        <a id="open" target="_blank" rel="noopener noreferrer" hidden>Cargar en Nexus ↗</a>
        <small>Abre una pestaña nueva. La imagen se procesa en este navegador.</small>
      </section>
    </details>`;
  document.body.append(host);
  const status = shadow.getElementById("status");
  const link = shadow.getElementById("open");
  const fileInput = shadow.getElementById("file");
  let request = 0;
  async function read(file) {
    const current = ++request;
    link.hidden = true;
    link.removeAttribute("href");
    status.textContent = "Leyendo tablero…";
    let bitmap;
    try {
      if (!file || !file.type.startsWith("image/")) throw new Error("Pega una imagen, no un enlace ni texto.");
      if (file.size > 20 * 1024 * 1024) throw new Error("La imagen supera 20 MB. Recorta solo el tablero.");
      bitmap = await createImageBitmap(file);
      if (current !== request) return;
      if (bitmap.width * bitmap.height > 16000000) throw new Error("La imagen es demasiado grande. Recorta solo el tablero.");
      const scale = Math.min(1, 1200 / bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d", {willReadFrequently: true});
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const {cells, box} = PuyoCapture.recognize(ctx.getImageData(0, 0, canvas.width, canvas.height));
      link.href = PuyoCapture.nexusUrl(cells);
      link.hidden = false;
      status.textContent = cells.filter(Boolean).length + " Puyos detectados. " + (box.inferredTop ? "Marco superior estimado por los laterales. Revisa en Nexus las piezas cubiertas por efectos." : "Abre el resultado y corrige allí lo necesario.");
    } catch (error) {
      if (current === request) status.textContent = error.message || "No pude leer la imagen. Prueba otra captura.";
    } finally {
      bitmap?.close();
    }
  }
  shadow.addEventListener("paste", event => {
    event.preventDefault();
    const file = Array.from(event.clipboardData?.items || []).find(item => item.type.startsWith("image/"))?.getAsFile();
    read(file);
  });
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) read(file);
    fileInput.value = "";
  });
})();

