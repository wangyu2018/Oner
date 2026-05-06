/**
 * Extract dominant colors from an uploaded image via Canvas API.
 * Entirely client-side, no dependencies.
 */

import { hexToHsl, hslToHex } from './themeColors';

/**
 * Extract dominant colors from an image file.
 * @param {File} imageFile - Uploaded image file
 * @param {number} count - Number of dominant colors to extract (default 5)
 * @returns {Promise<Array<{h:number, s:number, l:number, hex:string}>>}
 */
export async function extractDominantColors(imageFile, count = 5) {
  const imageData = await loadImageData(imageFile);
  const pixels = samplePixels(imageData, 64);
  const clusters = kMeans(pixels, count, 3);
  return clusters.map(({ h, s, l }) => ({
    h: Math.round(h),
    s: Math.round(s),
    l: Math.round(l),
    hex: hslToHex(Math.round(h), Math.round(s), Math.round(l)),
  }));
}

/**
 * Resize image and convert to data URL for use as wallpaper.
 * @param {File} file - Uploaded image file
 * @param {number} maxDim - Maximum dimension in pixels (default 1920)
 * @param {number} quality - JPEG quality 0-1 (default 0.8)
 * @returns {Promise<string>} data URL
 */
export function imageToDataUrl(file, maxDim = 1920, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ===== Private helpers =====

function loadImageData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        resolve(ctx.getImageData(0, 0, size, size));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function samplePixels(imageData, sampleSize) {
  const data = imageData.data;
  const pixels = [];
  const step = Math.max(1, Math.floor(imageData.width / sampleSize));
  for (let y = 0; y < imageData.height; y += step) {
    for (let x = 0; x < imageData.width; x += step) {
      const idx = (y * imageData.width + x) * 4;
      const r = data[idx] / 255;
      const g = data[idx + 1] / 255;
      const b = data[idx + 2] / 255;
      const a = data[idx + 3] / 255;
      if (a < 0.5) continue; // skip transparent

      // Convert to HSL for better clustering
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const l = (max + min) / 2;

      // Filter out near-white and near-black pixels (background/noise)
      if (l > 0.95 || l < 0.05) continue;

      let h = 0, s = 0;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      pixels.push({
        h: h * 360,
        s: s * 100,
        l: l * 100,
      });
    }
  }
  return pixels;
}

function kMeans(pixels, k, iterations = 5) {
  if (pixels.length === 0) {
    return [{ h: 217, s: 91, l: 60 }]; // default blue
  }

  // Initialize centroids (k-means++ style)
  const centroids = [pixels[Math.floor(Math.random() * pixels.length)]];
  for (let i = 1; i < k; i++) {
    const distances = pixels.map(p => {
      const dx = p.h - centroids[centroids.length - 1].h;
      const dy = p.s - centroids[centroids.length - 1].s;
      const dz = p.l - centroids[centroids.length - 1].l;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    });
    const totalDist = distances.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalDist;
    for (let j = 0; j < distances.length; j++) {
      r -= distances[j];
      if (r <= 0) {
        centroids.push(pixels[j]);
        break;
      }
    }
  }

  for (let iter = 0; iter < iterations; iter++) {
    // Assign pixels to nearest centroid
    const assignments = Array.from({ length: k }, () => []);
    for (const p of pixels) {
      let minDist = Infinity, best = 0;
      for (let i = 0; i < k; i++) {
        const c = centroids[i];
        const dh = Math.abs(p.h - c.h);
        const ds = Math.abs(p.s - c.s);
        const dl = Math.abs(p.l - c.l);
        // Perceptual weighting: hue matters less at low saturation
        const sw = c.s / 100;
        const dist = Math.sqrt((dh * sw) ** 2 + ds * ds + dl * dl);
        if (dist < minDist) { minDist = dist; best = i; }
      }
      assignments[best].push(p);
    }

    // Update centroids
    for (let i = 0; i < k; i++) {
      if (assignments[i].length === 0) continue;
      const sum = assignments[i].reduce((a, p) => ({
        h: a.h + p.h, s: a.s + p.s, l: a.l + p.l,
      }), { h: 0, s: 0, l: 0 });
      const n = assignments[i].length;
      centroids[i] = { h: sum.h / n, s: sum.s / n, l: sum.l / n };
    }
  }

  // Count cluster sizes and sort by frequency (largest first)
  const assignments = Array.from({ length: k }, () => []);
  for (const p of pixels) {
    let minDist = Infinity, best = 0;
    for (let i = 0; i < k; i++) {
      const c = centroids[i];
      const dh = Math.abs(p.h - c.h);
      const ds = Math.abs(p.s - c.s);
      const dl = Math.abs(p.l - c.l);
      const sw = c.s / 100;
      const dist = Math.sqrt((dh * sw) ** 2 + ds * ds + dl * dl);
      if (dist < minDist) { minDist = dist; best = i; }
    }
    assignments[best].push(p);
  }

  return centroids
    .map((c, i) => ({ ...c, count: assignments[i].length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, k);
}
