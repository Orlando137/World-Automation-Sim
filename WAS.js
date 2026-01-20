const pausePlayB = document.getElementById('pause-play');
const startResetB = document.getElementById('start-reset');
const stepB = document.getElementById('step');
const colorSelectB = document.getElementById('color-select');
const instructionsB = document.getElementById('instructions');
const helpB = document.getElementById('help');
const animationNameI = document.getElementById('animation-name');
const saveAnimationB = document.getElementById('save-animation');
const animationCanvas = document.getElementById('animation-canvas');
const ruleI = document.getElementById('rule-input');
const saveRuleB = document.getElementById('save-rule');
const randomI = document.getElementById('random-input');
const reshuffleRandomB = document.getElementById('reshuffle-random');
const addRandomB = document.getElementById('add-random');
const flushB = document.getElementById('flush');
const closeB = document.getElementById('closeModal');
const ctx = animationCanvas.getContext('2d');
const overlay = document.getElementById('modalOverlay');
const modalContent = document.getElementById('modalContent');
const cellSize = 4;
var started = false;
var playing = false;
var steps = 0;
var addColor = 0;

animationCanvas.width = 400;
animationCanvas.height = 400;
const gridSizeX = Math.floor(animationCanvas.width / cellSize);
const gridSizeY = Math.floor(animationCanvas.height / cellSize);

const ruleTable = document.getElementById('rule-table');
const ROWS = 8;
const COLS = 8;
const masterData = [];
let activeCellId = null;

// --- Button Event Listeners ---

pausePlayB.onclick = () => {
    pausePlayB.textContent = playing ? "Play" : "Pause";
    playing = !playing;
    if(playing) {
        // Call Play Animation
        startResetB.classList.add('hidden');
    } else {
        startResetB.classList.remove('hidden');
    }
}

startResetB.onclick = () => {
    startResetB.textContent = started ? "Start" : "Reset";
    started = !started;
    if(started) {
        // Call Start Animation
        playing = true;
        pausePlayB.textContent = "Pause";
        pausePlayB.classList.remove('hidden');
        startResetB.classList.add('hidden');
    } else {
        // Call Reset Animation
        playing = false;
        pausePlayB.textContent = "Play";
        pausePlayB.classList.add('hidden');
        steps = 0;
        stepB.textContent = `Step: ${steps}`;
    }
}

stepB.onclick = () => {
    steps++;
    stepB.textContent = `Step: ${steps}`;
    // Call Step Animation
}

colorSelectB.onclick = () => {
    switch (addColor) {
        case 0: addColor = 1; colorSelectB.textContent = 'Red'; break;
        case 1: addColor = 2; colorSelectB.textContent = 'Yellow'; break;
        case 2: addColor = 3; colorSelectB.textContent = 'Green'; break;
        case 3: addColor = 4; colorSelectB.textContent = 'Cyan'; break;
        case 4: addColor = 5; colorSelectB.textContent = 'Blue'; break;
        case 5: addColor = 6; colorSelectB.textContent = 'Magenta'; break;
        case 6: addColor = 7; colorSelectB.textContent = 'White'; break;
        case 7: addColor = 0; colorSelectB.textContent = 'Black'; break;
    }
}

instructionsB.onclick = () => {
    overlay.classList.add("active");
}

helpB.onclick = () => {
    overlay.classList.add("active");
}

closeB.onclick = () => {
    overlay.classList.remove("active");
}

// --- Rule management ---

for (let r = 0; r < ROWS; r++) {
    let row = ruleTable.insertRow();
    for (let c = 0; c < COLS; c++) {
        const id = '${r}-${c}';
        masterData[id] = [];
        let cell = row.insertCell();
        cell.id = 'cell-${id}';
        cell.innerText = '0';
    }
}