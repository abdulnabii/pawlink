/**
 * PawLink Collar Tag Badge Isolated Printer
 * Prints strictly the physical collar tag badge without any surrounding webpage chrome,
 * dashboard navigation, headers, footers, buttons, or specifications.
 */

interface PrintBadgeOptions {
  petName: string;
  tagCode: string;
  qrUrl: string;
}

export function printTagBadge({ petName, tagCode, qrUrl }: PrintBadgeOptions) {
  if (typeof window === "undefined") return;

  const safePet = petName || "Pet";
  const safeTag = tagCode || "PW-TAG";
  const highResQr = qrUrl.includes("size=")
    ? qrUrl.replace(/size=\d+x\d+/, "size=600x600")
    : qrUrl;

  // Clean up any existing print iframe
  const existingIframe = document.getElementById("pawlink-print-frame");
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement("iframe");
  iframe.id = "pawlink-print-frame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.style.zIndex = "-9999";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    // Fallback if iframe fails
    window.print();
    return;
  }

  const printDocumentHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>PawLink Badge — ${safePet} (${safeTag})</title>
  <style>
    @page {
      size: auto;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #ffffff;
      color: #0f172a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
    }
    .print-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .cut-guide-label {
      font-size: 7.5pt;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 6px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .cut-outer-border {
      border: 1.5px dashed #94a3b8;
      border-radius: 18mm;
      padding: 3mm;
      background: #ffffff;
      display: inline-block;
    }
    .badge-card {
      width: 58mm;
      height: 92mm;
      background: #ffffff;
      border: 2.5px solid #0f172a;
      border-radius: 16mm;
      padding: 5mm 4mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
      box-sizing: border-box;
      position: relative;
    }
    .punch-hole {
      width: 4.8mm;
      height: 4.8mm;
      border-radius: 50%;
      border: 2px solid #0f172a;
      background: #f1f5f9;
      margin: 0 auto 1.5mm;
    }
    .badge-brand {
      font-size: 8.5pt;
      font-weight: 900;
      letter-spacing: 0.16em;
      color: #0f766e;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
    .qr-container {
      width: 38mm;
      height: 38mm;
      background: #ffffff;
      border: 1.2px solid #cbd5e1;
      border-radius: 4mm;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2mm;
      box-sizing: border-box;
      margin: 1.5mm auto;
    }
    .qr-container img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }
    .pet-info {
      margin-top: 1mm;
    }
    .pet-name {
      font-size: 13.5pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.02em;
      color: #0f172a;
      line-height: 1.1;
    }
    .tag-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 7.5pt;
      font-weight: 700;
      color: #475569;
      letter-spacing: 0.04em;
      margin-top: 1.2mm;
    }
    .scan-cue {
      font-size: 7.5pt;
      font-weight: 900;
      letter-spacing: 0.14em;
      color: #0d9488;
      text-transform: uppercase;
      margin-top: 1.5mm;
    }
    .print-instructions {
      margin-top: 12px;
      font-size: 7pt;
      color: #64748b;
      max-width: 60mm;
      line-height: 1.4;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="print-container">
    <div class="cut-guide-label">✁ CUT ALONG DASHED LINE TO ATTACH TO COLLAR</div>
    <div class="cut-outer-border">
      <div class="badge-card">
        <div class="punch-hole"></div>
        <div class="badge-brand">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0f766e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          <span>PAWLINK TAG</span>
        </div>
        <div class="qr-container">
          <img src="${highResQr}" alt="QR Code for ${safePet}" />
        </div>
        <div class="pet-info">
          <div class="pet-name">${safePet}</div>
          <div class="tag-code">${safeTag}</div>
          <div class="scan-cue">SCAN IF LOST</div>
        </div>
      </div>
    </div>
    <div class="print-instructions">
      Print on waterproof sticker paper or cardstock. Punch hole at top circle and attach to pet collar ring or pouch.
    </div>
  </div>
</body>
</html>`;

  doc.open();
  doc.write(printDocumentHtml);
  doc.close();

  const img = doc.querySelector("img");
  const executePrint = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Print error:", err);
      } finally {
        setTimeout(() => {
          try {
            iframe.remove();
          } catch {}
        }, 3000);
      }
    }, 250);
  };

  if (img) {
    if (img.complete) {
      executePrint();
    } else {
      img.onload = executePrint;
      img.onerror = executePrint;
    }
  } else {
    executePrint();
  }
}
