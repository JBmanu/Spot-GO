export function initializeTimeRangeControl(timeRangeEl) {
    const sh = timeRangeEl.querySelector("#start-h");
    const sm = timeRangeEl.querySelector("#start-m");
    const eh = timeRangeEl.querySelector("#end-h");
    const em = timeRangeEl.querySelector("#end-m");

    const lastValid = new WeakMap();

    const remember = (el) => lastValid.set(el, el.value);
    const rollback = (el) => el.value = lastValid.get(el) ?? "";

    const isNumeric = (v) => /^\d*$/.test(v);

    const getMinutes = (h, m) => Number(h) * 60 + Number(m);

    const pad = (v) => v.toString().padStart(2, "0");

    // VALIDAZIONI
    const isValidHour = (v) => {
        if (v === "") return true;
        if (v.length === 1) return Number(v) <= 2;
        return Number(v) >= 0 && Number(v) <= 23;
    };

    const isValidMinute = (v) => {
        if (v === "") return true;
        if (v.length === 1) return Number(v) <= 5;
        return Number(v) >= 0 && Number(v) <= 59;
    };

    const isEndAfterStart = () => {
        if (
            sh.value.length !== 2 ||
            sm.value.length !== 2 ||
            eh.value.length !== 2 ||
            em.value.length !== 2
        ) return true;

        return getMinutes(eh.value, em.value) >
               getMinutes(sh.value, sm.value);
    };

    // AUTO END TIME
    const autoSetEndTime = () => {
        if (sh.value.length === 2 && sm.value.length === 2) {
            let end = getMinutes(sh.value, sm.value) + 60;
            if (end >= 1440) end = 1439;

            eh.value = pad(Math.floor(end / 60));
            em.value = pad(end % 60);

            remember(eh);
            remember(em);
        }
    };

    // INPUT GENERICO
    const validatedInput = (el, validator, afterValid) => {
        remember(el);

        el.addEventListener("input", () => {
            if (!isNumeric(el.value) || !validator(el.value)) {
                rollback(el);
                return;
            }

            remember(el);
            afterValid?.();
        });
    };

    // START
    validatedInput(sh, isValidHour, () => {
        if (sh.value.length === 2) sm.focus();
    });

    validatedInput(sm, isValidMinute, () => {
        if (sm.value.length === 2) autoSetEndTime();
    });

    // END
    validatedInput(eh, (v) => isValidHour(v) && isEndAfterStart(), () => {
        if (eh.value.length === 2) em.focus();
    });

    validatedInput(em, (v) => isValidMinute(v) && isEndAfterStart());
}

export function validateTimeRange(timeRangeEl) {
    const sh = timeRangeEl.querySelector("#start-h");
    const sm = timeRangeEl.querySelector("#start-m");
    const eh = timeRangeEl.querySelector("#end-h");
    const em = timeRangeEl.querySelector("#end-m");

    if (!sh || !sm || !eh || !em) return false;

    const values = [sh.value, sm.value, eh.value, em.value];
    const isEmpty = (v) => v === "" || v == null;
    const isTwoDigits = (v) => /^\d{2}$/.test(v);

    // Tutti vuoti, spot considerato come "sempre aperto"
    if (values.every(isEmpty)) {
        return true;
    }

    // Combinazione parziale
    if (values.some(isEmpty)) {
        return false;
    }

    // Tutti compilati correttamente
    return values.every(isTwoDigits);
}

export function readTimeRangeValues(timeRangeElList) {
    if (!timeRangeElList) return [];

    let list;

    // NodeList o HTMLCollection
    if (typeof timeRangeElList.length === "number") {
        list = Array.from(timeRangeElList);
    }
    // singolo HTMLElement
    else if (timeRangeElList instanceof Element) {
        list = [timeRangeElList];
    }
    // array vero
    else if (Array.isArray(timeRangeElList)) {
        list = timeRangeElList;
    }
    // qualunque altra cosa, ignora
    else {
        return [];
    }

    const ranges = [];

    for (const timeRangeEl of list) {
        if (!validateTimeRange(timeRangeEl)) continue;

        const sh = timeRangeEl.querySelector("#start-h")?.value ?? "";
        const sm = timeRangeEl.querySelector("#start-m")?.value ?? "";
        const eh = timeRangeEl.querySelector("#end-h")?.value ?? "";
        const em = timeRangeEl.querySelector("#end-m")?.value ?? "";

        // tutti vuoti → sempre aperto
        if (!sh && !sm && !eh && !em) continue;

        // parziale → invalido
        if (!sh || !sm || !eh || !em) continue;

        ranges.push({
            inizio: `${sh}:${sm}`,
            fine: `${eh}:${em}`
        });
    }

    return ranges;
}

function toMinutes(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
};

function rangesOverlap(a, b) {
    // [a.start, a.end) ∩ [b.start, b.end)
    return a.start < b.end && b.start < a.end;
};

export function validateTimeRangesWithCrossIntersections(timeRangeElList) {
    let timeRangeRes = true;
    const ranges = [];

    // ===== VALIDAZIONE SINGOLA + LETTURA =====
    for (const timeRangeEl of timeRangeElList) {
        if (!validateTimeRange(timeRangeEl)) {
            timeRangeRes = false;
            break;
        }

        const sh = timeRangeEl.querySelector("#start-h")?.value;
        const sm = timeRangeEl.querySelector("#start-m")?.value;
        const eh = timeRangeEl.querySelector("#end-h")?.value;
        const em = timeRangeEl.querySelector("#end-m")?.value;

        // range vuoto → sempre aperto → ignoriamo nel confronto
        if (!sh || !sm || !eh || !em) continue;

        const start = toMinutes(`${sh}:${sm}`);
        const end = toMinutes(`${eh}:${em}`);

        ranges.push({ start, end });
    }

    // se una singola validazione è fallita
    if (!timeRangeRes) return false;

    // ===== 2. CONTROLLO INTERSEZIONI =====
    for (let i = 0; i < ranges.length; i++) {
        for (let j = i + 1; j < ranges.length; j++) {
            if (rangesOverlap(ranges[i], ranges[j])) {
                return false;
            }
        }
    }
    return true;
}
