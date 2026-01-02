// client/src/lib/generator.js
import { data } from './data';
import { mulberry32, pick, polishText, analyzeContext } from './utils';

export function resolveSeed(currentSeedInput, isLocked) {
    const manual = Number(currentSeedInput);
    if (isLocked) {
        if (Number.isFinite(manual) && manual >= 0) return manual;
        return manual || newSeed(); 
    }
    if (Number.isFinite(manual) && manual >= 0) return manual;
    return newSeed();
}

export function newSeed() {
    return Math.floor(Math.random() * 1_000_000_000);
}

export function buildPrompt(settings) {
    const seed = settings.seed || newSeed();
    const rand = mulberry32(seed);
    const idea = settings.promptIdea ? settings.promptIdea.trim() : "";
    const ctx = analyzeContext(idea);

    // Chaos
    const level = Number(settings.detailLevel || 3);
    const styleChoice = settings.sentenceStyle || pick(["short", "normal", "long"], rand);
    const styleShift = styleChoice === "long" ? 1 : styleChoice === "short" ? -1 : 0;

    const selectedResolution = settings.resolution || pick(["1024x1024", "832x1216", "1216x832"], rand);
    const pickedLens = settings.lens || pick(data.lenses, rand);
    const pickedAperture = settings.aperture || pick(data.apertures, rand);
    const pickedIso = settings.iso || pick(data.isos, rand);
    const pickedShutter = settings.shutter || pick(data.shutters, rand);
    
    const pickedTime = settings.time || pick(data.times, rand);
    const pickedWeather = settings.weather || pick(data.weather, rand);
    const pickedSeason = settings.season || pick(["spring", "summer", "autumn", "winter"], rand);
    const pickedLocation = settings.locationType || pick(["indoors", "outdoors"], rand);
    const pickedLocale = settings.localeType || pick(["urban", "rural"], rand);
    const light = settings.lighting || pick(data.lightDetails, rand);

    if (settings.turboMode) {
        let mode = settings.sceneType;
        if (!mode) {
            if (ctx.type === 'portrait') mode = 'portrait';
            else if (ctx.type === 'landscape') mode = 'landscape';
            else mode = pick(["portrait", "landscape", "everyday"], rand);
        }

        const extraDetailSentence = level + styleShift >= 4
            ? "Materials and textures are clearly visible, with subtle imperfections."
            : "";
        
        if (mode === "portrait") {
            let subjectDescription = "";
            if (!ctx.hasSubject) {
                const genderChoice = settings.gender || pick(["female", "male"], rand);
                const peoplePool = data.portraitPeople[genderChoice] || data.portraitPeople.female;
                const person = pick(peoplePool, rand);
                const age = settings.ageRange || "";
                const eth = settings.ethnicity || "";
                const cloth = settings.clothing || "";
                const acc = settings.accessory || "";
                const personDetails = [age ? `aged ${age}` : "", eth ? eth : "", cloth ? `wearing ${cloth}` : "", acc ? `with ${acc}` : ""].filter(Boolean).join(", ");
                const fullPerson = personDetails ? `${person}, ${personDetails}` : person;
                subjectDescription = `Photorealistic portrait of ${fullPerson}`;
            } else {
                subjectDescription = idea; 
                if (settings.clothing) subjectDescription += `, wearing ${settings.clothing}`;
                if (settings.accessory) subjectDescription += `, with ${settings.accessory}`;
            }

            const pose = pick(data.portraitPoses, rand);
            const env = pick(data.portraitEnvironments, rand);

            const sentences = [
                subjectDescription + ".",
                `${pose}.`,
                `Shot in ${env} during ${pickedTime} with ${pickedWeather}. Lighting: ${light}.`,
                `Camera: ${pickedLens}, f/${pickedAperture}, ISO ${pickedIso}, ${pickedShutter}, shallow depth of field, natural bokeh.`,
                styleChoice !== "short" ? "Realistic skin texture, true-to-life colors, sharp focus on eyes, subtle film grain." : "",
                styleChoice === "long" ? extraDetailSentence : "",
                styleChoice !== "short" ? `Resolution: ${selectedResolution}.` : ""
            ];
            
            if (!ctx.hasSubject && idea && mode === 'portrait') {
                 sentences.unshift(`${idea}.`);
            }

            return {
                prompt: sentences.map(polishText).join(" "),
                tags: [ctx.hasSubject ? "Custom Subject" : "Gen Subject", mode, light, selectedResolution],
                seed: seed
            };
        }

        if (mode === "landscape") {
            let mainSubject = "";
            if (ctx.type === 'landscape' || (idea && ctx.type !== 'portrait')) {
                mainSubject = idea;
            } else {
                const place = pick(data.landscapePlaces, rand);
                const detail = pick(data.landscapeDetails, rand);
                mainSubject = `Photorealistic landscape of ${place} with ${detail}`;
            }
            const sentences = [
                `${mainSubject}.`,
                `${pickedTime} with ${pickedWeather} in ${pickedSeason}, ${pickedLocale} ${pickedLocation}. Lighting: ${light}.`,
                `Camera: ${pickedLens}, f/${pickedAperture}, ISO ${pickedIso}, ${pickedShutter}, high dynamic range.`,
                styleChoice !== "short" ? "Natural color grading, subtle film grain, high detail." : "",
                styleChoice === "long" ? extraDetailSentence : "",
                styleChoice !== "short" ? `Resolution: ${selectedResolution}.` : ""
            ].filter(Boolean);
            if (idea && mainSubject !== idea) sentences.unshift(`${idea}.`);
            return {
                prompt: sentences.map(polishText).join(" "),
                tags: [mode, light, selectedResolution],
                seed: seed
            };
        }

        let subject = idea || `Photorealistic photo of ${pick(data.everydaySubjects, rand)}`;
        const texture = pick(data.everydayTextures, rand);
        const sentences = [
            `${subject}.`,
            `${texture}. Lighting: ${light}.`,
            `Camera: ${pickedLens}, f/${pickedAperture}, ISO ${pickedIso}, ${pickedShutter}.`,
            styleChoice !== "short" ? "Natural colors, realistic shadows, sharp focal plane." : "",
            styleChoice !== "short" ? `Resolution: ${selectedResolution}.` : ""
        ].filter(Boolean);

        return {
            prompt: sentences.map(polishText).join(" "),
            tags: ["Object", light, selectedResolution],
            seed: seed
        };
    }

    const subject = ctx.hasSubject ? idea : pick(data.subjects, rand);
    const setting = pick(data.settings, rand);
    const mood = pick(data.moods, rand);
    const presetKey = settings.preset || pick(Object.keys(data.presets), rand);
    const presetData = data.presets[presetKey] || data.presets[Object.keys(data.presets)[0]];

    const promptLines = [
        ctx.hasSubject ? subject : `${subject} ${setting}`,
        ctx.hasSubject ? setting : "",
        `${mood}, ${pickedTime}, ${light}`,
        `${settings.camera || "cinematic camera"}, ${pickedLens}, ${pick(data.grades, rand)}`,
        `${presetData.modifiers.join(", ")}`,
        `aspect ratio ${settings.aspect || "3:2"}`,
        `resolution ${selectedResolution}`
    ];
    
    if (idea && !ctx.hasSubject) {
        promptLines.unshift(idea);
    }

    const finalLines = promptLines.filter(line => line && line.trim() !== "").map(polishText);
    const negatives = (settings.negative || "").split(",").map(i => i.trim()).filter(Boolean);
    if (negatives.length) finalLines.push(`negative: ${negatives.join(", ")}`);

    return {
        prompt: finalLines.join(", "),
        tags: [presetData.label, mood],
        presetLabel: presetData.label,
        seed: seed
    };
}

export function enhancePrompt(text, settings) {
    const seed = settings.seed || newSeed();
    const rand = mulberry32(seed);
    const clean = text.trim();
    if (!clean) return "";

    const lens = settings.lens || pick(["24mm", "35mm", "50mm", "85mm"], rand);
    const aperture = settings.aperture || pick(data.apertures, rand);
    const iso = settings.iso || pick(data.isos, rand);
    const shutter = settings.shutter || pick(data.shutters, rand);
    const selectedResolution = settings.resolution || pick(["1024x1024", "832x1216", "1216x832"], rand);
    const light = settings.lighting || pick(data.lightDetails, rand);

    const additions = [];
    if (!/photorealistic|photo-realistic|lifelike|realistic/i.test(clean)) {
        additions.push("Photorealistic, true-to-life colors, subtle film grain, high detail.");
    }
    if (!/lighting:/i.test(clean)) {
        additions.push(`Lighting: ${light}.`);
    }
    if (!/(camera:|lens|iso|f\/)/i.test(clean)) {
        additions.push(`Camera: ${lens} lens, f/${aperture}, ISO ${iso}, ${shutter}.`);
    }
    if (!/resolution/i.test(clean)) {
        additions.push(`Resolution: ${selectedResolution}.`);
    }
    
    return [polishText(clean), ...additions].join(" ");
}
