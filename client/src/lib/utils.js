// client/src/lib/utils.js

export const mulberry32 = (a) => {
  return function () {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};

export const pick = (arr, rand) => {
  if (!arr || arr.length === 0) return "";
  return arr[Math.floor(rand() * arr.length)];
};

const decoder = new TextDecoder("utf-8");

export const bytesToString = (bytes) => {
  return decoder.decode(bytes);
};

export const toHex = (bytes, limit = 16) => {
  const len = Math.min(bytes.length, limit);
  const parts = [];
  for (let i = 0; i < len; i++) parts.push(bytes[i].toString(16).padStart(2, "0"));
  return parts.join(" ");
};

export const polishText = (text) => {
  if (!text) return "";
  let refined = text.replace(/\s+/g, " ").trim();
  refined = refined.replace(/,\s*,/g, ",");
  refined = refined.replace(/\.\s*\./g, ".");
  refined = refined.replace(/,\s*\./g, ".");
  refined = refined.replace(/\.\s*,/g, ".");
  refined = refined.replace(/\b(a)\s+([aeiou])/gi, (match, article, vowel) => {
    if (vowel.toLowerCase() === 'u') return match; 
    return article + "n " + vowel;
  });
  if (refined.length > 0) {
    refined = refined.charAt(0).toUpperCase() + refined.slice(1);
  }
  return refined;
};

export const createThumbnail = (file, maxWidth = 120, quality = 0.6) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxWidth) {
            h = Math.round(h * (maxWidth / w));
            w = maxWidth;
          }
        } else {
          if (h > maxWidth) {
            w = Math.round(w * (maxWidth / h));
            h = maxWidth;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeContext = (text) => {
  if (!text) return { hasSubject: false, gender: null, type: null };
  const lower = text.toLowerCase();
  const male = /\b(man|men|boy|boys|guy|male|father|dad|gentleman|husband|mann|junge|vater|herren|herr)\b/;
  const female = /\b(woman|women|girl|girls|lady|female|mother|mom|dame|frau|mädchen|mutter|wife|damsel)\b/;
  const person = /\b(person|people|character|portrait|human|someone|model|face|body|figure)\b/;
  const landscape = /\b(landscape|forest|mountain|sea|ocean|view|scenery|nature|sky|beach|desert|landschaft|wald|berg|meer|strand|himmel)\b/;
  const urban = /\b(city|street|building|house|room|interior|urban|architecture|stadt|straße|haus|zimmer|architektur)\b/;

  const isMale = male.test(lower);
  const isFemale = female.test(lower);
  const hasPerson = isMale || isFemale || person.test(lower);
  
  let detectedType = null;
  if (hasPerson) detectedType = 'portrait';
  else if (landscape.test(lower)) detectedType = 'landscape';
  else if (urban.test(lower)) detectedType = 'urban';

  return {
    hasSubject: hasPerson,
    gender: isMale ? 'male' : (isFemale ? 'female' : 'neutral'),
    type: detectedType
  };
};
