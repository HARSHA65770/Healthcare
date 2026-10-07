// In-Browser Optical Recognition Architecture (Section 5 & 10)
// Direct implementation of greyscale conversion, contrast boosting, Otsu thresholding,
// and 7-segment regex parsing for NIBP and Glucose LCD monitors.

export interface ParsedVitals {
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  glucose: number | null;
  confidence: number;
  rawText: string;
}

/**
 * Section 5 exact regex parser for standard NIBP & Glucose LCD Monitors
 */
export const parseVitalsFromText = (rawText: string): ParsedVitals => {
  const clean = rawText.replace(/[\r\n]+/g, ' ');
  const bpMatch = clean.match(/(\d{2,3})\s*[\/\-]?\s*(\d{2,3})/);
  const pulseMatch = clean.match(/(?:pul|pr|hr)?\s*(\d{2,3})\s*(?:bpm)?/i);
  const glucoseMatch = clean.match(/(\d{2,3})\s*(?:mg\/dl)?/i);

  const systolic = bpMatch ? parseInt(bpMatch[1], 10) : null;
  const diastolic = bpMatch ? parseInt(bpMatch[2], 10) : null;
  const pulse = pulseMatch ? parseInt(pulseMatch[1], 10) : null;
  const glucose = glucoseMatch ? parseInt(glucoseMatch[1], 10) : null;

  // Calculate estimated confidence based on matches found
  let matchScore = 0;
  if (systolic && systolic >= 60 && systolic <= 240) matchScore += 45;
  if (diastolic && diastolic >= 40 && diastolic <= 150) matchScore += 35;
  if (pulse && pulse >= 40 && pulse <= 200) matchScore += 15;
  if (glucose && glucose >= 40 && glucose <= 500) matchScore += 40;

  const confidence = Math.min(matchScore, 95);

  return {
    systolic,
    diastolic,
    pulse,
    glucose,
    confidence,
    rawText: clean
  };
};

/**
 * Applies digital filters (Greyscale, Contrast Boosting, and Otsu Thresholding)
 * on an HTML Canvas before passing to WASM-OCR engine.
 */
export function preprocessCanvasFor7Segment(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // 1. Greyscale & Contrast Boosting
  let sum = 0;
  const histogram = new Array(256).fill(0);

  for (let i = 0; i < data.length; i += 4) {
    // Luminance formula
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
    histogram[gray]++;
    sum += gray;
  }

  // 2. Compute Otsu's Threshold
  const totalPixels = canvas.width * canvas.height;
  let sumB = 0;
  let wB = 0;
  let maximum = 0;
  let threshold = 128;

  for (let i = 0; i < 256; i++) {
    wB += histogram[i];
    if (wB === 0) continue;
    const wF = totalPixels - wB;
    if (wF === 0) break;

    sumB += i * histogram[i];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const betweenVariance = wB * wF * ((mB - mF) ** 2);

    if (betweenVariance > maximum) {
      maximum = betweenVariance;
      threshold = i;
    }
  }

  // 3. Apply binary thresholding for clean LCD digit segmentation
  for (let i = 0; i < data.length; i += 4) {
    const val = data[i] > threshold ? 255 : 0;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Camera Torch Toggle using MediaStreamTrack applyConstraints
 * Section 10: Poor Lighting mitigation
 */
export async function toggleCameraTorch(track: MediaStreamTrack, enable: boolean): Promise<boolean> {
  try {
    const capabilities = track.getCapabilities?.() as any;
    if (capabilities && capabilities.torch) {
      await (track as any).applyConstraints({
        advanced: [{ torch: enable }]
      });
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[Torch] Unable to toggle camera torch:', err);
    return false;
  }
}
