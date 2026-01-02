// client/src/lib/metadata.js
import { bytesToString } from './utils';

// Helper: Robusterer String-Cleanup
function cleanString(str) {
  return str.replace(/\0/g, '').trim();
}

export const extractA1111 = (text) => {
  if (!text) return null;
  const hasSteps = text.includes("Steps:");
  const hasNegative = text.includes("Negative prompt:");
  if (!hasSteps && !hasNegative) return null;
  
  const negIndex = text.indexOf("Negative prompt:");
  const stepsIndex = text.indexOf("Steps:");
  
  let endPositive = text.length;
  if (negIndex !== -1 && stepsIndex !== -1) endPositive = Math.min(negIndex, stepsIndex);
  else if (negIndex !== -1) endPositive = negIndex;
  else if (stepsIndex !== -1) endPositive = stepsIndex;

  const positive = text.slice(0, endPositive).trim();
  
  let negative = "";
  if (negIndex !== -1) {
    const start = negIndex + "Negative prompt:".length;
    const end = stepsIndex > negIndex ? stepsIndex : text.length;
    negative = text.slice(start, end).trim();
  }
  
  return { positive, negative, raw: text.trim() };
};

export const extractFromJson = (jsonText) => {
  if (!jsonText || typeof jsonText !== 'string') return null;
  if (!jsonText.trim().startsWith('{') && !jsonText.trim().startsWith('[')) return null;

  const results = { positive: [], negative: [], other: [] };
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch {
    return null;
  }

  const visit = (node, keyHint = "") => {
    if (!node) return;
    if (typeof node === "string") {
      const lowKey = keyHint.toLowerCase();
      const val = node.trim();
      if (val.length < 2) return; 

      if (lowKey.includes("negative")) {
        results.negative.push(val);
      } else if (lowKey.includes("prompt") || lowKey.includes("text") || lowKey.includes("positive") || lowKey === "string") {
        if (!val.includes(".pt") && !val.includes(".safetensors")) {
             results.positive.push(val);
        }
      } else {
        results.other.push(val);
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(item => visit(item, keyHint));
      return;
    }
    if (typeof node === "object") {
      Object.entries(node).forEach(([key, value]) => {
          visit(value, key);
      });
    }
  };

  visit(data);
  const uniq = arr => Array.from(new Set(arr));
  
  return {
    positive: uniq(results.positive),
    negative: uniq(results.negative),
    other: uniq(results.other)
  };
};

export const parsePng = (buffer) => {
  const view = new DataView(buffer);
  if (view.getUint32(0) !== 0x89504E47 || view.getUint32(4) !== 0x0D0A1A0A) {
      return null;
  }
  const texts = [];
  let offset = 8; 

  while (offset < buffer.byteLength) {
    if (offset + 8 > buffer.byteLength) break;
    const length = view.getUint32(offset); 
    const type = String.fromCharCode(
      view.getUint8(offset + 4),
      view.getUint8(offset + 5),
      view.getUint8(offset + 6),
      view.getUint8(offset + 7)
    );
    const dataStart = offset + 8;
    
    if (type === "tEXt" || type === "iTXt") {
        const data = new Uint8Array(buffer.slice(dataStart, dataStart + length));
        let nullIndex = -1;
        for(let i=0; i<data.length; i++) {
            if(data[i] === 0) { nullIndex = i; break; }
        }
        if (nullIndex > 0) {
            const key = bytesToString(data.slice(0, nullIndex));
            let textVal = "";
            if (type === "tEXt") {
                textVal = bytesToString(data.slice(nullIndex + 1));
            } else {
                let cursor = nullIndex + 3; 
                while(cursor < data.length && data[cursor] !== 0) cursor++;
                cursor++;
                while(cursor < data.length && data[cursor] !== 0) cursor++;
                cursor++;
                if (cursor < data.length) {
                    textVal = bytesToString(data.slice(cursor));
                }
            }
            texts.push({ key: key, value: textVal });
        }
    }
    offset += 12 + length;
  }
  return { texts, notes: [] };
};

export const parseJpeg = (buffer) => {
  const view = new DataView(buffer);
  if (view.getUint16(0) !== 0xFFD8) return null;
  let offset = 2;
  const segments = [];
  while (offset + 4 <= buffer.byteLength) {
    if (view.getUint8(offset) !== 0xFF) break;
    const marker = view.getUint8(offset + 1);
    if (marker === 0xDA) break;
    const length = view.getUint16(offset + 2);
    const start = offset + 4;
    const end = start + length - 2;
    if (end > buffer.byteLength) break;
    const data = new Uint8Array(buffer.slice(start, end));
    segments.push({ marker, data });
    offset = end;
  }
  return segments;
};

export const collectTextCandidates = (meta) => {
  const texts = [];
  if (meta.texts) {
    meta.texts.forEach(item => {
      texts.push({ source: `PNG [${item.key}]`, value: item.value });
    });
  }
  return texts;
};

export const extractFromSegments = (segments) => {
    const texts = [];
    const notes = [];
    segments.forEach(seg => {
      if (seg.marker === 0xE1) {
        const header = bytesToString(seg.data.slice(0, 30));
        if (header.startsWith("Exif\0\0")) {
          texts.push({ source: "JPEG EXIF", value: bytesToString(seg.data) });
        } else if (header.includes("http://ns.adobe.com/xap/1.0/")) {
          texts.push({ source: "JPEG XMP", value: bytesToString(seg.data) });
        } else {
             texts.push({ source: "JPEG APP1", value: bytesToString(seg.data) });
        }
      }
    });
    return { texts, notes };
};

export const processImageFile = async (file) => {
  const buffer = await file.arrayBuffer();
  let report = [];
  let candidates = [];
  let extracted = { a1111: null, comfy: null };

  const pngMeta = parsePng(buffer);
  
  if (pngMeta) {
    report.push("Datentyp: PNG Bild");
    const found = collectTextCandidates(pngMeta);
    candidates = candidates.concat(found);
    if(found.length === 0) report.push("(Keine Text-Chunks gefunden)");
  } else {
    const jpegSegs = parseJpeg(buffer);
    if (jpegSegs) {
      report.push("Datentyp: JPEG Bild");
      const { texts } = extractFromSegments(jpegSegs);
      candidates = candidates.concat(texts);
    } else {
      report.push("Format: Unbekannt (Kein valider PNG/JPEG Header)");
    }
  }

  const texts = candidates.map(c => c.value).filter(Boolean);
  
  for (const text of texts) {
    if (!extracted.a1111) extracted.a1111 = extractA1111(text);
    if (!extracted.comfy) {
      const maybeJson = extractFromJson(text);
      if (maybeJson && (maybeJson.positive.length > 0 || maybeJson.negative.length > 0)) {
          extracted.comfy = maybeJson;
      }
    }
  }

  if (extracted.a1111) {
      report.push("\n✅ Automatic1111 Daten gefunden!");
  } else if (extracted.comfy) {
      report.push("\n✅ ComfyUI Workflow gefunden!");
  }

  return { report, candidates, extracted };
};
