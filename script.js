
    // Global variables
    const state = {
    alleProdukter: [],
    selectedStoneSrc: null,
    selectedProduktInfo: null,
    draggedBlock: null
};

    // DOM elements
    const elements = {
    sidebar: document.getElementById('sidebar'),
    sidebarWrapper: document.getElementById('sidebar-wrapper'),
    mainContent: document.getElementById('mainContent'),
    gridSizeSelect: document.getElementById('gridSize'),
    puzzleContainer: document.getElementById('puzzle_container'),
    stentypeFilter: document.getElementById('stentype-filter'),
    farveFilter: document.getElementById('farve-filter'),
    overfladeFilter: document.getElementById('overflade-filter'),
    produktSearch: document.getElementById('produkt-search'),
    resetFiltersBtn: document.getElementById('reset-filters'),
    resetGridBtn: document.getElementById('reset-grid'),
    exportPdfBtn: document.getElementById('export-pdf')
};

    // Initialize page
    document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    generateGrid();
    loadProdukter();
});





    // Set up event listeners
    function initializeEventListeners() {
    elements.gridSizeSelect.addEventListener('change', generateGrid);
    elements.resetGridBtn.addEventListener('click', resetGrid);
    elements.exportPdfBtn.addEventListener('click', exportToPDF);
    elements.resetFiltersBtn.addEventListener('click', resetFilters);
    elements.produktSearch.addEventListener('input', (e) => searchProdukter(e.target.value));
    elements.stentypeFilter.addEventListener('change', (e) => filterProducts('stentyper', e.target.value));
    elements.farveFilter.addEventListener('change', (e) => filterProducts('farver', e.target.value));
    elements.overfladeFilter.addEventListener('change', (e) => filterProducts('overflader', e.target.value));
}
    //  controls-icon minimize function
    document.getElementById("controls-icon").addEventListener("click", function () {
        document.getElementById("controls-content").classList.toggle("hidden");
    });


    // Load products
    function loadProdukter() {
    fetch('liste_data.json')
        .then(response => response.json())
        .then(produkter => {
            state.alleProdukter = produkter;
            renderProducts(produkter);
            populateFilters(produkter);
        })
        .catch(error => {
            console.error("Fejl ved indlæsning af produkter:", error);
        });
}

    // Render products in sidebar
    function renderProducts(produkter) {
    elements.sidebar.innerHTML = "";

    produkter.forEach(produkt => {
    const produktElement = createProductElement(produkt);
    elements.sidebar.appendChild(produktElement);
});
}

    // Create product element
    function createProductElement(produkt) {
    const produktElement = document.createElement("div");
    produktElement.className = "produkt-item";
    produktElement.dataset.navn = produkt.produkt_navn;
    produktElement.dataset.oprindelse = produkt.oprindelse;
    produktElement.dataset.stentyper = JSON.stringify(produkt.stentyper);
    produktElement.dataset.overflader = JSON.stringify(produkt.overflader);
    produktElement.dataset.farver = JSON.stringify(produkt.farver);
    produktElement.dataset.anvendelse = produkt.anvendelse;
    produktElement.setAttribute("role", "button");
    produktElement.setAttribute("tabindex", "0");

    const img = document.createElement("img");
    img.src = produkt.billede_url;
    img.alt = produkt.produkt_navn;
    img.setAttribute("draggable", "true");
    img.dataset.produkt = JSON.stringify(produkt);

    const name = document.createElement("p");
    name.textContent = produkt.produkt_navn;

    produktElement.appendChild(img);
    produktElement.appendChild(name);

    // Add event listeners
    img.addEventListener('dragstart', handleProductDragStart);
    produktElement.addEventListener('click', handleProductSelect);

    return produktElement;
}

    // Handle product drag start
    function handleProductDragStart(event) {
    event.dataTransfer.setData("text/plain", event.target.src);
    event.dataTransfer.setData("text/product-info", event.target.dataset.produkt);
    event.dataTransfer.setData("source", "sidebar");
}

    // Handle product selection
    function handleProductSelect() {
    document.querySelectorAll('.produkt-item').forEach(el => el.classList.remove('selected'));
    this.classList.add('selected');
    state.selectedStoneSrc = this.querySelector('img').src;
    state.selectedProduktInfo = JSON.parse(this.querySelector('img').dataset.produkt);
}

    // Populate filters with unique values
    function populateFilters(produkter) {
    const uniqueStentyper = new Set();
    const uniqueFarver = new Set();
    const uniqueOverflader = new Set();

    produkter.forEach(produkt => {
    produkt.stentyper.forEach(type => uniqueStentyper.add(type));
    produkt.farver.forEach(farve => uniqueFarver.add(farve));
    produkt.overflader.forEach(overflade => uniqueOverflader.add(overflade));
});

    populateFilter(elements.stentypeFilter, uniqueStentyper);
    populateFilter(elements.farveFilter, uniqueFarver);
    populateFilter(elements.overfladeFilter, uniqueOverflader);
}

    // Populate filter dropdown
    function populateFilter(selectElement, uniqueValues) {
    const defaultOption = selectElement.querySelector('option');
    selectElement.innerHTML = '';
    selectElement.appendChild(defaultOption);

    Array.from(uniqueValues).sort().forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    selectElement.appendChild(option);
});
}

    // Reset filters
    function resetFilters() {
    elements.stentypeFilter.value = '';
    elements.farveFilter.value = '';
    elements.overfladeFilter.value = '';
    elements.produktSearch.value = '';

    document.querySelectorAll('.produkt-item').forEach(produkt => {
    produkt.style.display = 'block';
});
}

    // Search products
    function searchProdukter(query) {
    query = query.toLowerCase();
    document.querySelectorAll('.produkt-item').forEach(produkt => {
    const navn = produkt.dataset.navn.toLowerCase();
    produkt.style.display = navn.includes(query) ? 'block' : 'none';
});
}

    // Filter products
    function filterProducts(filterType, filterValue) {
    if (!filterValue) {
    document.querySelectorAll('.produkt-item').forEach(produkt => {
    produkt.style.display = 'block';
});
    return;
}

    document.querySelectorAll('.produkt-item').forEach(produkt => {
    let visible = true;

    try {
    const values = JSON.parse(produkt.dataset[filterType]);
    visible = values.includes(filterValue);
} catch (e) {
    console.error(`Error parsing ${filterType}:`, e);
    visible = false;
}

    produkt.style.display = visible ? 'block' : 'none';
});
}





    // Generate grid
    function generateGrid() {
    const gridSize = parseInt(elements.gridSizeSelect.value);
    const existingBlocks = Array.from(elements.puzzleContainer.children);
    const oldGridSize = Math.sqrt(existingBlocks.length) || 0;

    // Save existing data
    const existingData = existingBlocks.map(block => ({
    backgroundImage: block.style.backgroundImage,
    isEmpty: block.classList.contains('empty'),
    produktInfo: block.getAttribute('data-produkt-info')
}));

    // Set grid properties
    elements.puzzleContainer.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    elements.puzzleContainer.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
    elements.puzzleContainer.innerHTML = "";

    // Create new blocks
    const totalBlocks = gridSize * gridSize;
    for (let i = 0; i < totalBlocks; i++) {
    const block = document.createElement("div");
    block.classList.add("puzzle_block", "empty");
    block.setAttribute("draggable", false);

    // Add event listeners
    block.addEventListener('click', handleBlockClick);
    block.addEventListener('dragover', allowDrop);
    block.addEventListener('drop', handleDrop);

    // Restore data if available
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;

    if (row < oldGridSize && col < oldGridSize && oldGridSize > 0) {
    const oldIndex = row * oldGridSize + col;
    if (oldIndex < existingData.length) {
    restoreBlockData(block, existingData[oldIndex]);
}
}

    elements.puzzleContainer.appendChild(block);
}

    // Make non-empty blocks draggable
    document.querySelectorAll('.puzzle_block:not(.empty)').forEach(makeBlockDraggable);
}

    // Restore block data
    function restoreBlockData(block, data) {
    if (!data.backgroundImage) return;

    block.style.backgroundImage = data.backgroundImage;

    if (!data.isEmpty) {
    block.classList.remove("empty");
    addRemoveButton(block);
}

    if (data.produktInfo) {
    block.setAttribute('data-produkt-info', data.produktInfo);
    updateTooltip(block);
    makeBlockDraggable(block);
}
}

    // Reset grid
    function resetGrid() {
    const blocks = elements.puzzleContainer.querySelectorAll(".puzzle_block");
    blocks.forEach(block => {
    block.style.backgroundImage = "";
    block.classList.add("empty");
    block.removeAttribute('data-produkt-info');
    block.removeAttribute('draggable');

    const tooltip = block.querySelector('.tooltip');
    if (tooltip) tooltip.remove();

    const removeBtn = block.querySelector('.remove-btn');
    if (removeBtn) removeBtn.remove();
});
}

    // Add remove button to block
    function addRemoveButton(block) {
    if (block.querySelector('.remove-btn')) return;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = 'X';
    removeBtn.onclick = function(e) {
    e.stopPropagation();
    clearBlock(block);
    this.remove();
};

    block.appendChild(removeBtn);
}

    // Clear block
    function clearBlock(block) {
    block.style.backgroundImage = '';
    block.classList.add('empty');
    block.removeAttribute('data-produkt-info');
    block.removeAttribute('draggable');

    const tooltip = block.querySelector('.tooltip');
    if (tooltip) tooltip.remove();
}

    // Make block draggable
    function makeBlockDraggable(block) {
    // Remove existing listeners to avoid duplicates
    block.removeEventListener('dragstart', handleBlockDragStart);

    if (!block.classList.contains('empty')) {
    block.setAttribute('draggable', true);
    block.addEventListener('dragstart', handleBlockDragStart);
} else {
    block.removeAttribute('draggable');
}
}

    // Handle block drag start
    function handleBlockDragStart(e) {
    state.draggedBlock = this;
    const bgImage = this.style.backgroundImage;
    const url = bgImage.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');

    e.dataTransfer.setData("text/plain", url);
    e.dataTransfer.setData("text/product-info", this.getAttribute("data-produkt-info") || "");
    e.dataTransfer.setData("source", "grid");
}

    // Allow drop
    function allowDrop(event) {
    event.preventDefault();
}

    // Handle drop
    function handleDrop(event) {
    event.preventDefault();
    let target = event.target;

    // Ensure we're not dropping on remove button
    if (target.classList.contains('remove-btn')) return;

    // Find the closest puzzle_block if target is not one
    if (!target.classList.contains('puzzle_block')) {
    target = target.closest('.puzzle_block');
    if (!target) return;
}

    const source = event.dataTransfer.getData("source");
    const src = event.dataTransfer.getData("text/plain");
    const produktInfo = event.dataTransfer.getData("text/product-info");

    if (source === "grid" && state.draggedBlock && state.draggedBlock !== target) {
    handleBlockSwap(target, src, produktInfo);
} else {
    // Standard drop from sidebar
    updateBlock(target, src, produktInfo);
}

    // Reset dragged block reference
    state.draggedBlock = null;
}

    // Handle block swap
    function handleBlockSwap(target, src, produktInfo) {
    // Save target block data
    const targetBg = target.style.backgroundImage;
    const targetProduktInfo = target.getAttribute("data-produkt-info");
    const targetIsEmpty = target.classList.contains('empty');

    // Update target with dragged block data
    updateBlock(target, src, produktInfo);

    // Update original block with target data
    if (targetBg && !targetIsEmpty) {
    updateBlock(state.draggedBlock, targetBg.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, ''), targetProduktInfo);
} else {
    clearBlock(state.draggedBlock);
    const removeBtn = state.draggedBlock.querySelector('.remove-btn');
    if (removeBtn) removeBtn.remove();
}
}

    // Update block with new data
    function updateBlock(block, src, produktInfo) {
    block.style.backgroundImage = `url(${src})`;
    block.classList.remove('empty');
    addRemoveButton(block);

    if (produktInfo) {
    block.setAttribute('data-produkt-info', produktInfo);
    updateTooltip(block);
    makeBlockDraggable(block);
}
}

    // Update tooltip
    function updateTooltip(block) {
    // Remove existing tooltip
    let tooltip = block.querySelector('.tooltip');
    if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    block.appendChild(tooltip);
}

    const produktInfo = block.getAttribute('data-produkt-info');
    if (produktInfo) {
    try {
    const info = JSON.parse(produktInfo);
    const overflader = Array.isArray(info.overflader) ? info.overflader.join(', ') : info.overflader;
    tooltip.innerHTML = `<strong>${info.produkt_navn}</strong><br>${overflader}`;
} catch (e) {
    console.error("Fejl ved parsing af produktinfo:", e);
}
}
}

    // Handle block click
    function handleBlockClick(event) {
    if (!state.selectedStoneSrc) return;

    if (event.target.classList.contains('remove-btn')) return;

    const block = event.target.classList.contains('puzzle_block') ?
    event.target :
    event.target.closest('.puzzle_block');

    if (!block) return;

    updateBlock(
    block,
    state.selectedStoneSrc,
    state.selectedProduktInfo ? JSON.stringify(state.selectedProduktInfo) : null
    );
}

    // Export to PDF
    function exportToPDF() {
    alert("PDF eksport-funktionalitet vil blive implementeret her");
}

