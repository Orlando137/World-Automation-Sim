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
const color1Input = document.getElementById('color1-input');
const color2Input = document.getElementById('color2-input');
const color3Input = document.getElementById('color3-input');
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
const ROWS = 5;
const COLS = 4;
// masterData stores arrays of rules per cell (each rule value 1-24)
// Indexed as masterData[row * COLS + col], each entry is an array
let masterData = Array(ROWS * COLS).fill(null).map(() => []);
let activeCellId = null;

// --- Button Event Listeners & Animation ---

let animationFrameId = null;

function stepOnce() {
    // Compute next generation using rules
    for (let y = 0; y < canvasHeightCells; y++) {
        for (let x = 0; x < canvasWidthCells; x++) {
            const here = gridA[idx(x, y)];
            // Count neighbors by color
            const counts = new Uint8Array(4);
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const c = gridA[idx(x + dx, y + dy)];
                    if (c < 4) counts[c]++;
                }
            }
            // Count neighbors: number of non-zero neighbors and weighted sum (each neighbor contributes its color value 1/2/3)
            const neighCount = counts[1] + counts[2] + counts[3];
            const neighSum = counts[1] * 1 + counts[2] * 2 + counts[3] * 3; // 1..24

            // Columns represent TARGET colors (0=dead,1=color1,2=color2,3=color3).
            // Row layout now: 0 = any, 1 = dead-specific, 2 = color1, 3 = color2, 4 = color3
            // Priority: specific color-row (highest), dead-row (middle, applies when here==0), any-row (lowest).
            // In death mode: default to dead (0) unless explicitly kept alive
            let chosenTarget = isDeathMode ? 0 : here; // default to dead in death mode, otherwise preserve
            let chosenPriority = 0; // 3 = specific, 2 = dead, 1 = any
            for (let target = 0; target < COLS; target++) {
                const anyRules = masterData[0 * COLS + target] || [];
                const deadRules = masterData[1 * COLS + target] || [];
                const specificRowIndex = (here > 0) ? (here + 1) : -1; // map color 1->2, 2->3, 3->4
                const specificRules = (specificRowIndex >= 0) ? (masterData[specificRowIndex * COLS + target] || []) : [];

                if (specificRules.includes(neighSum) && 3 >= chosenPriority) {
                    chosenPriority = 3; chosenTarget = target;
                }
                if (here === 0 && deadRules.includes(neighSum) && 2 >= chosenPriority) {
                    chosenPriority = 2; chosenTarget = target;
                }
                if (anyRules.includes(neighSum) && 1 >= chosenPriority) {
                    chosenPriority = 1; chosenTarget = target;
                }
            }
            gridB[idx(x, y)] = chosenTarget;
        }
    }
    // Swap grids
    const tmp = gridA; gridA = gridB; gridB = tmp;
}

function animate() {
    if (!playing) return;
    stepOnce();
    steps++;
    stepB.textContent = `Step: ${steps}`;
    grid.draw();
    animationFrameId = requestAnimationFrame(animate);
}

pausePlayB.onclick = () => {
    playing = !playing;
    pausePlayB.textContent = playing ? "Pause" : "Play";
    if (playing) {
        startResetB.classList.add('hidden');
        animate();
    } else {
        startResetB.classList.remove('hidden');
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    }
}

startResetB.onclick = () => {
    if (!started) {
        // Start animation
        started = true;
        steps = 0;
        stepB.textContent = `Step: ${steps}`;
        playing = true;
        pausePlayB.textContent = "Pause";
        pausePlayB.classList.remove('hidden');
        startResetB.textContent = "Reset";
        startResetB.classList.add('hidden');
        animate();
    } else {
        // Reset animation
        started = false;
        playing = false;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        steps = 0;
        stepB.textContent = `Step: ${steps}`;
        startResetB.textContent = "Start";
        pausePlayB.classList.add('hidden');
        // Clear grid
        gridA.fill(0);
        gridB.fill(0);
        grid.draw();
    }
}

stepB.onclick = () => {
    // Allow stepping when not playing (paused or not started). Ignore while animation is running.
    if (!playing) {
        stepOnce();
        steps++;
        stepB.textContent = `Step: ${steps}`;
        grid.draw();
    }
}

colorSelectB.onclick = () => {
    switch (addColor) {
        case 0: addColor = 1; colorSelectB.textContent = 'Color 1'; break;
        case 1: addColor = 2; colorSelectB.textContent = 'Color 2'; break;
        case 2: addColor = 3; colorSelectB.textContent = 'Color 3'; break;
        case 3: addColor = 0; colorSelectB.textContent = 'Black'; break;
    }
}

const lifeDeathB = document.getElementById('life-death');
let isDeathMode = false;

lifeDeathB.onclick = () => {
    isDeathMode = !isDeathMode;
    lifeDeathB.textContent = isDeathMode ? 'Death' : 'Life';
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

let palette = [
    [0,0,0],
    [255,0,0],
    [0,255,0],
    [0,0,255]
];

function parseColorToRGB(val){
    if (!val) return null;
    // prefer explicit hex, but handle css names too
    try {
        // use canvas context to normalize
        ctx.fillStyle = val;
        const norm = ctx.fillStyle; // may become rgb(...) or #rrggbb
        if (norm.startsWith('#')){
            const hex = norm.slice(1);
            const r = parseInt(hex.substring(0,2),16);
            const g = parseInt(hex.substring(2,4),16);
            const b = parseInt(hex.substring(4,6),16);
            return [r,g,b];
        }
        if (norm.startsWith('rgb')){
            const nums = norm.match(/\d+/g).map(n=>parseInt(n,10));
            return [nums[0], nums[1], nums[2]];
        }
    } catch(e){ }
    return null;
}

function updatePaletteFromInputs(){
    // Use the input value if present, otherwise use placeholder
    const v1 = (color1Input && (color1Input.value || color1Input.placeholder)) || null;
    const v2 = (color2Input && (color2Input.value || color2Input.placeholder)) || null;
    const v3 = (color3Input && (color3Input.value || color3Input.placeholder)) || null;
    const c1 = parseColorToRGB(v1);
    const c2 = parseColorToRGB(v2);
    const c3 = parseColorToRGB(v3);
    if (c1) palette[1] = c1;
    if (c2) palette[2] = c2;
    if (c3) palette[3] = c3;
}

if (color1Input) color1Input.addEventListener('input', ()=>{ updatePaletteFromInputs(); grid.draw(); });
if (color2Input) color2Input.addEventListener('input', ()=>{ updatePaletteFromInputs(); grid.draw(); });
if (color3Input) color3Input.addEventListener('input', ()=>{ updatePaletteFromInputs(); grid.draw(); });

// Parse random spec in format "n1|n2|n3" -> [n1,n2,n3] or null
function parseRandomSpec(str){
    if (!str || typeof str !== 'string') return null;
    const parts = str.split('|').map(s => s.trim());
    if (parts.length !== 3) return null;
    const nums = parts.map(n => Number(n));
    if (nums.some(n => !Number.isInteger(n) || n < 0)) return null;
    return nums;
}

// Helper to reshuffle grid according to a parsed spec [n1,n2,n3]
function reshuffleGrid(spec) {
    if (!spec) return;
    const [n1, n2, n3] = spec;
    const totalRequested = n1 + n2 + n3;
    const cells = gridA.length;
    if (totalRequested === 0){
        gridA.fill(0);
        gridB.fill(0);
        grid.draw();
        return;
    }
    if (totalRequested > cells) console.warn(`Requested ${totalRequested} cells, but only ${cells} available: extra placements will be truncated.`);

    // create shuffled indices
    const indices = Array.from({length: cells}, (_, i) => i);
    for (let i = cells - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    gridA.fill(0);
    gridB.fill(0);

    let p = 0;
    const assignTotal = Math.min(totalRequested, cells);
    const place = (count, color) => {
        const end = Math.min(p + count, assignTotal);
        while (p < end) {
            gridA[indices[p]] = color;
            p++;
        }
    }
    place(n1, 1);
    place(n2, 2);
    place(n3, 3);

    grid.draw();
}

// Place random colors according to counts specified in randomI
reshuffleRandomB.addEventListener('click', ()=>{
    const spec = parseRandomSpec(randomI.value);
    if (!spec) {
        console.error('Random input must be in format "n1|n2|n3" with non-negative integers');
        return;
    }
    reshuffleGrid(spec);
});

// Add a single random rule to masterData and update table
addRandomB.addEventListener('click', ()=>{
    const row = Math.floor(Math.random() * ROWS);   // 0..ROWS-1
    const col = Math.floor(Math.random() * COLS);   // 0..COLS-1
    const rule = Math.floor(Math.random() * 24) + 1;    // 1..24
    // Call existing helper which validates and updates the table/modal
    addRuleToMasterData(`${row}|${col}|${rule}`);
    console.log(`Added random rule: row=${row}, col=${col}, rule=${rule}`);

    // In death mode, also reshuffle the canvas using current random spec
    if (isDeathMode) {
        const spec = parseRandomSpec(randomI.value);
        if (spec) reshuffleGrid(spec);
    }
});

// Flush all rules from masterData and update table counts
flushB.addEventListener('click', ()=>{
    // Clear each rule list
    for (let i = 0; i < masterData.length; i++) masterData[i] = [];

    // Update table counters
    for (let r = 0; r < ROWS; r++){
        for (let c = 0; c < COLS; c++){
            const el = document.getElementById(`cell-${r}-${c}`);
            if (el) el.innerText = '0';
        }
    }

    // If rule modal is open, refresh the list
    if (ruleOverlay.classList.contains('active') && activeCellId) renderList();

    console.log('All rules flushed.');
});

const canvasWidthCells = Math.floor(WIDTH / cellSize);
const canvasHeightCells = Math.floor(HEIGHT / cellSize);

// pixel buffer dimensions and cached ImageData for faster rendering
const canvasPixelWidth = canvasWidthCells * cellSize;
const canvasPixelHeight = canvasHeightCells * cellSize;
let _imgData = null;
let _pix = null;

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
    // allocate ImageData once and reuse its pixel buffer
    if (!_imgData) {
        _imgData = ctx.createImageData(canvasPixelWidth, canvasPixelHeight);
        _pix = _imgData.data;
    }
    const pix = _pix;
    const rowPixelStride = canvasPixelWidth; // pixels per canvas row

    // expand cell values to pixels
    for (let cy = 0; cy < canvasHeightCells; cy++){
        for (let cx = 0; cx < canvasWidthCells; cx++){
            const c = gridA[cy * canvasWidthCells + cx];
            const [r,g,b] = palette[c];
            // fill a cellSize x cellSize block
            for (let oy=0; oy<cellSize; oy++){
                const rowStart = ((cy * cellSize + oy) * rowPixelStride);
                for (let ox=0; ox<cellSize; ox++){
                    const px = rowStart + (cx * cellSize + ox);
                    const p = px * 4;
                    pix[p] = r; pix[p+1] = g; pix[p+2] = b; pix[p+3] = 255;
                }
            }
        }
    }
    // draw to canvas
    ctx.putImageData(_imgData, 0, 0);
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
updatePaletteFromInputs();
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
        let cell = row.insertCell();
        cell.id = `cell-${r}-${c}`;
        cell.innerText = '0';
        cell.onclick = () => openModal(r, c);
    }
}

function openModal(r, c) {
    ruleOverlay.classList.add("active");
    activeCellId = `${r}-${c}`;
    // Rows: 0 = any, 1 = color1 (one), 2 = color2 (two), 3 = color3 (three)
    // Columns: 0 = dead, 1 = color1, 2 = color2, 3 = color3
    const labels = [
        ['any -> dead', 'any -> one', 'any -> two', 'any -> three'],
        ['dead -> dead', 'dead -> one', 'dead -> two', 'dead -> three'],
        ['one -> dead', 'one -> one', 'one -> two', 'one -> three'],
        ['two -> dead', 'two -> one', 'two -> two', 'two -> three'],
        ['three -> dead', 'three -> one', 'three -> two', 'three -> three']
    ];
    modalTitle.innerText = labels[r][c];
    renderList();
    ruleInput.focus();
}
function closeModal() {
    ruleOverlay.classList.remove("active");
}
function renderList() {
    const [r, c] = activeCellId.split('-').map(Number);
    const idx = r * COLS + c;
    const rules = masterData[idx];
    container.innerHTML = "";
    rules.forEach((rule, index) => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `<span>Rule ${index + 1}: <strong>${rule}</strong>/24</span><button class="delete-btn" onclick="removeItem(${index})">Delete</button>`;
        container.appendChild(div);
    });
    document.getElementById(`cell-${activeCellId}`).innerText = rules.length;
}
function addItem() {
    const num = parseInt(ruleInput.value.trim(), 10);
    if (!isNaN(num) && num >= 0 && num <= 24) {
        const [r, c] = activeCellId.split('-').map(Number);
        const idx = r * COLS + c;
        masterData[idx].push(num);
        ruleInput.value = "";
        renderList();
    }
}
function removeItem(index) {
    const [r, c] = activeCellId.split('-').map(Number);
    const idx = r * COLS + c;
    masterData[idx].splice(index, 1);
    renderList();
}

// Function to add a rule to masterData
function addRuleToMasterData(input) {
    if (!input || typeof input !== 'string') return;
    const parts = input.split('|').map(s => s.trim());
    if (parts.length !== 3) {
        console.error('Invalid rule format. Expected row|col|rule');
        return;
    }
    const [row, col, rule] = parts.map(Number);
    if ([row, col, rule].some(n => Number.isNaN(n))) {
        console.error('Invalid numbers in rule input');
        return;
    }
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS || rule < 0 || rule > 24) {
        console.error('Rule values out of range');
        return;
    }

    const idx = row * COLS + col;
    const rules = masterData[idx];
    if (!rules.includes(rule)) rules.push(rule);

    // Update table cell count
    const cellEl = document.getElementById(`cell-${row}-${col}`);
    if (cellEl) cellEl.innerText = rules.length;

    // If modal is open and showing this cell, refresh list
    if (ruleOverlay.classList.contains('active') && activeCellId === `${row}-${col}`) {
        renderList();
    }
}

// Event listener for saveRuleB button
saveRuleB.addEventListener('click', () => {
    const ruleInputValue = ruleI.value.trim();
    if (!ruleInputValue) return;
    addRuleToMasterData(ruleInputValue);
    ruleI.value = ''; // Clear input after saving
});