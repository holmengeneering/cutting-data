


const endMillBtn = document.getElementById("endMillBtn");
const calculator = document.getElementById("calculator");
const result = document.getElementById("result");
const drillBtn = document.getElementById("drillBtn");
const flutesGroup = document.getElementById("flutesGroup");

let selectedTool = "endMill";

// Temporary test data - Carbide End Mills
// Values must be validated before workshop use.

const cuttingData = {
    steel: {
        vc: 100
    },

    stainless304: {
        vc: 60
    },

    stainless316: {
        vc: 45
    },

    stainless329: {
        vc: 45
    },

    stainlessUnknown: {
        vc: 45
    },

    aluminum: {
        vc: 500
    }
};

const drillData = {
    steel: {
        vc: 95
    },

    stainless304: {
        vc: 60
    },

    stainless316: {
        vc: 45
    },

    stainless329: {
        vc: 40
    },

    stainlessUnknown: {
        vc: 45
    },

    aluminum: {
        vc: 175
    }
};

// General-purpose feed per tooth values for carbide end mills
const feedTable = [
    { diameter: 1,     fz: 0.002 },
    { diameter: 2,     fz: 0.004 },
    { diameter: 3,     fz: 0.006 },
    { diameter: 4,     fz: 0.008 },
    { diameter: 4.76,  fz: 0.010 },
    { diameter: 5,     fz: 0.011 },
    { diameter: 6,     fz: 0.014 },
    { diameter: 6.35,  fz: 0.015 },
    { diameter: 8,     fz: 0.020 },
    { diameter: 9.525, fz: 0.025 },
    { diameter: 10,    fz: 0.027 },
    { diameter: 12,    fz: 0.036 },
    { diameter: 12.7,  fz: 0.039 },
    { diameter: 15.875,fz: 0.054 },
    { diameter: 16,    fz: 0.055 },
    { diameter: 19.05, fz: 0.073 },
    { diameter: 20,    fz: 0.078 },
    { diameter: 25,    fz: 0.110 }
];

const drillFeedTable = {
    steel: [
        { maxDiameter: 3, fn: 0.10 },
        { maxDiameter: 6, fn: 0.15 },
        { maxDiameter: 10, fn: 0.20 },
        { maxDiameter: 14, fn: 0.24 },
        { maxDiameter: 20, fn: 0.28 }
    ],

    stainless: [
        { maxDiameter: 3, fn: 0.08 },
        { maxDiameter: 6, fn: 0.11 },
        { maxDiameter: 10, fn: 0.14 },
        { maxDiameter: 14, fn: 0.17 },
        { maxDiameter: 20, fn: 0.19 }
    ],

    aluminum: [
        { maxDiameter: 3, fn: 0.10 },
        { maxDiameter: 6, fn: 0.20 },
        { maxDiameter: 10, fn: 0.30 },
        { maxDiameter: 14, fn: 0.40 },
        { maxDiameter: 20, fn: 0.50 }
    ]
};

function getDrillFeed(diameter, material) {

    let materialGroup;

    if (material === "steel") {
        materialGroup = "steel";
    } else if (material === "aluminum") {
        materialGroup = "aluminum";
    } else {
        materialGroup = "stainless";
    }

    const table = drillFeedTable[materialGroup];

    const selectedRange = table.find(function(range) {
        return diameter <= range.maxDiameter;
    });

    if (!selectedRange) {
        return null;
    }

    return selectedRange.fn;
}

function getFeedPerTooth(diameter) {

    // Smaller than our smallest table value
    if (diameter <= feedTable[0].diameter) {
        return feedTable[0].fz;
    }

    // Find the two surrounding diameters
    for (let i = 0; i < feedTable.length - 1; i++) {

        const lower = feedTable[i];
        const upper = feedTable[i + 1];

        if (diameter >= lower.diameter &&
            diameter <= upper.diameter) {

            const position =
                (diameter - lower.diameter) /
                (upper.diameter - lower.diameter);

            return lower.fz +
                position * (upper.fz - lower.fz);
        }
    }

    // Larger than our largest table value
    return feedTable[feedTable.length - 1].fz;
}

// Calculate RPM and Feed automatically
function calculate() {

    const diameter = Number(document.getElementById("diameter").value);
    const flutes = Number(document.getElementById("flutes").value);
    const material = document.getElementById("material").value;
    const maxRpm = Number(document.getElementById("maxRpm").value);

    // Check diameter
    if (!diameter || diameter <= 0 || diameter > 25) {
        result.classList.add("hidden");
        return;
    }

    let vc;
    let feed;
    let feedValue;

    // END MILL
    if (selectedTool === "endMill") {

        vc = cuttingData[material].vc;

        const fz = getFeedPerTooth(diameter);

        const calculatedRpm =
            (vc * 1000) / (Math.PI * diameter);

        const rpm =
            Math.min(calculatedRpm, maxRpm);

        feed =
            rpm * flutes * fz;

        feedValue = fz;

        updateResults(
            rpm,
            feed,
            vc,
            feedValue,
            calculatedRpm,
            maxRpm,
            "mm/tooth"
        );
    }

    // DRILL
    if (selectedTool === "drill") {

        vc = drillData[material].vc;

        const fn = getDrillFeed(diameter, material);

        if (fn === null) {
            result.classList.add("hidden");
            return;
        }

        const calculatedRpm =
            (vc * 1000) / (Math.PI * diameter);

        const rpm =
            Math.min(calculatedRpm, maxRpm);

        feed =
            rpm * fn;

        feedValue = fn;

        updateResults(
            rpm,
            feed,
            vc,
            feedValue,
            calculatedRpm,
            maxRpm,
            "mm/rev"
        );
    }
}

function updateResults(
    rpm,
    feed,
    vc,
    feedValue,
    calculatedRpm,
    maxRpm,
    feedUnit
) {

    document.getElementById("rpmResult").textContent =
        Math.round(rpm).toLocaleString("en-US");

    document.getElementById("feedResult").textContent =
        Math.round(feed).toLocaleString("en-US");

    document.getElementById("vcResult").textContent =
        vc + " m/min";

    document.getElementById("fzResult").textContent =
        feedValue.toFixed(3) + " " + feedUnit;

    const rpmLimitWarning =
        document.getElementById("rpmLimitWarning");

    if (calculatedRpm > maxRpm) {

        rpmLimitWarning.innerHTML =
            "Machine RPM limit reached<br>" +
            "Calculated: " +
            Math.round(calculatedRpm).toLocaleString("en-US") +
            " RPM";

        rpmLimitWarning.classList.remove("hidden");

    } else {

        rpmLimitWarning.classList.add("hidden");
    }

    result.classList.remove("hidden");
}

endMillBtn.addEventListener("click", function() {

    selectedTool = "endMill";

    calculator.classList.remove("hidden");
    flutesGroup.classList.remove("hidden");

    document.getElementById("feedDataLabel").textContent =
        "Feed per tooth (fz):";

    calculate();
});

drillBtn.addEventListener("click", function() {

    selectedTool = "drill";

    calculator.classList.remove("hidden");
    flutesGroup.classList.add("hidden");

    document.getElementById("feedDataLabel").textContent =
        "Feed per revolution (fn):";

    calculate();
});

// Listen for changes
document.getElementById("diameter").addEventListener("input", calculate);
document.getElementById("flutes").addEventListener("change", calculate);
document.getElementById("material").addEventListener("change", calculate);
document.getElementById("maxRpm").addEventListener("input", calculate);
