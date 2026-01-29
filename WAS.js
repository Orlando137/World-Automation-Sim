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
const ruleOverlay = document.getElementById('ruleOverlay');
const modalTitle = document.getElementById('modalTitle');
const container = document.getElementById('listContainer');
const ruleInput = document.getElementById('new-rule');
const addRuleB = document.getElementById('addBtn');
const cellSize = 4;
var started = false;
var playing = false;
var steps = 0;
var addColor = 0;

animationCanvas.width = 700;
animationCanvas.height = 700;
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

// --- Grid Class ---

// --- Animation Grid (inspired by AILife.HTML) ---
const WIDTH = animationCanvas.width;
const HEIGHT = animationCanvas.height;

// Typed arrays for current and next generation
let gridA = new Uint8Array((Math.floor(WIDTH / cellSize)) * (Math.floor(HEIGHT / cellSize)));
let gridB = new Uint8Array(gridA.length);

const palette = [
    [0,0,0],
    [255,0,0],
    [255,225,0],
    [0,255,0],
    [0,255,225],
    [0,0,255],
    [255,0,255],
    [255,255,255]
];

const canvasWidthCells = Math.floor(WIDTH / cellSize);
const canvasHeightCells = Math.floor(HEIGHT / cellSize);

function idx(x,y){
    // wrap-around
    const xx = (x + canvasWidthCells) % canvasWidthCells;
    const yy = (y + canvasHeightCells) % canvasHeightCells;
    return yy * canvasWidthCells + xx;
}

function computeNext() {
    for (let y = 0; y < canvasHeightCells; y++) {
        for (let x = 0; x < canvasWidthCells; x++) {
            const counts = new Int32Array(8);
            let neigh = 0;
            for (let dy=-1; dy<=1; dy++){
                for (let dx=-1; dx<=1; dx++){
                    if (dx===0 && dy===0) continue;
                    const c = gridA[idx(x+dx, y+dy)];
                    if (c>0){ neigh++; counts[c]++; }
                }
            }
            const here = gridA[idx(x,y)];
            let newC = 0;
            if (here === 0) {
                if (neigh === 3) {
                    let best = 1, bestCt = counts[1];
                    for (let c = 2; c < 8; c++){
                        if (counts[c] > bestCt){ best = c; bestCt = counts[c]; }
                    }
                    newC = best;
                }
            } else {
                if (neigh === 2 || neigh === 3) newC = here;
            }
            gridB[y * canvasWidthCells + x] = newC;
        }
    }
    // swap
    const tmp = gridA; gridA = gridB; gridB = tmp;
}

// render current gridA to canvas
function renderGrid() {
    const img = ctx.createImageData(canvasWidthCells * cellSize, canvasHeightCells * cellSize);
    const pix = img.data;
    // expand cell values to pixels
    for (let cy = 0; cy < canvasHeightCells; cy++){
        for (let cx = 0; cx < canvasWidthCells; cx++){
            const c = gridA[cy * canvasWidthCells + cx];
            const [r,g,b] = palette[c];
            // fill a cellSize x cellSize block
            for (let oy=0; oy<cellSize; oy++){
                for (let ox=0; ox<cellSize; ox++){
                    const px = (cy * cellSize + oy) * (canvasWidthCells * cellSize) + (cx * cellSize + ox);
                    const p = px * 4;
                    pix[p] = r; pix[p+1] = g; pix[p+2] = b; pix[p+3] = 255;
                }
            }
        }
    }
    // draw centered in the canvas element (canvas pixel size matches)
    ctx.putImageData(img, 0, 0);
}

// provide a minimal grid wrapper used by existing code
const grid = {
    width: canvasWidthCells,
    height: canvasHeightCells,
    getCell(x,y){ return gridA[idx(x,y)]; },
    setCell(x,y,v){ gridA[idx(x,y)] = v; },
    draw(){ renderGrid(); },
    cellAtCanvasPoint(clientX, clientY){
        const rect = animationCanvas.getBoundingClientRect();
        const cssX = clientX - rect.left;
        const cssY = clientY - rect.top;
        const gridX = Math.floor(cssX / (rect.width / this.width));
        const gridY = Math.floor(cssY / (rect.height / this.height));
        if (gridX >=0 && gridX < this.width && gridY >=0 && gridY < this.height) return {x:gridX,y:gridY,value:this.getCell(gridX,gridY)};
        return null;
    },
    enableClickSelection(callback){
        const f = (ev)=>{
            const cell = this.cellAtCanvasPoint(ev.clientX, ev.clientY);
            if (cell) callback(cell, ev);
        };
        animationCanvas.addEventListener('click', f);
        return ()=> animationCanvas.removeEventListener('click', f);
    }
};

// initial render
renderGrid();

// ensure canvas updates on user clicks
animationCanvas.addEventListener('click', (ev) => {
    const cell = grid.cellAtCanvasPoint(ev.clientX, ev.clientY);
    if (!cell) return;
    grid.setCell(cell.x, cell.y, addColor);
    grid.draw();
});


// --- Rule Management ---

for (let r = 0; r < ROWS; r++) {
    let row = ruleTable.insertRow();
    for (let c = 0; c < COLS; c++) {
        const id = `${r}-${c}`;
        masterData[id] = [];
        let cell = row.insertCell();
        cell.id = `cell-${id}`;
        cell.innerText = '0';
        cell.onclick = () => openModal(r, c);
    }
}

function openModal(r, c) {
    ruleOverlay.classList.add("active");
    activeCellId = `${r}-${c}`;
    modalTitle.innerText = `Cell ${r+1}, ${c+1}`;
    renderList();
    ruleInput.focus();
}
function closeModal() {
    ruleOverlay.classList.remove("active");
}
function renderList() {
    const items = masterData[activeCellId];
    container.innerHTML = "";
    items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `<span>${item}</span><button class="delete-btn" onclick="removeItem(${index})">Delete</button>`;
        container.appendChild(div);
    });
    document.getElementById(`cell-${activeCellId}`).innerText = items.length;
}
function addItem() {
    if (ruleInput.value.trim()) {
        masterData[activeCellId].push(ruleInput.value.trim());
        ruleInput.value = "";
        renderList();
    }
}
function removeItem(index) {
    masterData[activeCellId].splice(index, 1);
    renderList();
}

// --- Grid and Animation ---
