let selectedWords = [];
let remainingTries = 4;
let gameActive = true;
let categoriesSolved = 0;
let currentTargetRow = 0;
const gridColumns = 4;

function initializeGame() {
    const gameGrid = document.getElementById('gameGrid');
    gameGrid.innerHTML = '';
    
    // Flatten all words and shuffle
    const allWords = [].concat(...Object.values(categories).map(c => c.words));
    shuffleArray(allWords);
    
    allWords.forEach(word => {
        const box = document.createElement('div');
        box.className = 'word-box';
        box.textContent = word;
        box.onclick = () => toggleWord(word, box);
        gameGrid.appendChild(box);
    });
    
    updateTriesDisplay();
}

function toggleWord(word, element) {
    if (!gameActive) return;
    
    const index = selectedWords.indexOf(word);
    if (index === -1) {
        if (selectedWords.length < 4) {
            selectedWords.push(word);
            element.classList.add('selected');
        }
    } else {
        selectedWords.splice(index, 1);
        element.classList.remove('selected');
    }
}

function submitGroup() {
    if (!gameActive || selectedWords.length !== 4) return;

    const correctCategory = Object.values(categories).find(cat =>
        selectedWords.every(word => cat.words.includes(word))
    );

    if (correctCategory) {
        handleCorrectCategory(correctCategory);
    } else {
        handleIncorrectSubmit();
    }

    selectedWords = [];
    deselectAll();
    checkGameEnd();
}

async function handleCorrectCategory(category) {
    category.solved = true;
    categoriesSolved++;
    
    const gameGrid = document.getElementById('gameGrid');
    const wordElements = Array.from(gameGrid.children).filter(box => 
        category.words.includes(box.textContent)
    );

    await mergeCategory(wordElements, category);
    checkGameEnd();
}

// Add these helper functions
function getTargetPositions(rowIndex) {
    const startPos = rowIndex * gridColumns;
    return Array.from({length: gridColumns}, (_, i) => startPos + i);
}

async function animateToPosition(element, targetIndex) {
    const grid = document.getElementById('gameGrid');
    const targetCell = grid.children[targetIndex];
    const targetRect = targetCell.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();
    
    // Calculate relative positions
    const x = targetRect.left - gridRect.left;
    const y = targetRect.top - gridRect.top;
    
    // Animate using Web Animations API
    const animation = element.animate([
        { transform: `translate(${x}px, ${y}px) scale(1)` },
        { transform: `translate(${x}px, ${y}px) scale(0.1)` }
    ], {
        duration: 600,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });

    await animation.finished;
}

async function mergeCategory(words, category) {
    const grid = document.getElementById('gameGrid');
    const targetRow = currentTargetRow++;
    const targetIndices = getTargetPositions(targetRow);
    
    // Animate all words to their target positions
    await Promise.all(words.map((word, index) => 
        animateToPosition(word, targetIndices[index])
    ));

    // Create merged category box
    const categoryBox = document.createElement('div');
    categoryBox.className = `category-box ${category.color} merged`;
    categoryBox.innerHTML = `
        <div><strong>${category.name}</strong></div>
        <div>${category.words.join(', ')}</div>
    `;

    // Replace target cells with merged box
    targetIndices.forEach(index => {
        if (index < grid.children.length) {
            grid.children[index].style.visibility = 'hidden';
        }
    });
    
    grid.insertBefore(categoryBox, grid.children[targetIndices[0]]);
}

// Add these helper functions
function animateMerge(words, category) {
    // Get target position in categories container
    const categoriesContainer = document.getElementById('categoriesContainer');
    const targetPosition = categoriesContainer.getBoundingClientRect();
    const targetX = targetPosition.left + window.scrollX;
    const targetY = targetPosition.top + window.scrollY + (categoriesContainer.children.length * 70);

    // Animate each word
    words.forEach((wordElem, index) => {
        // Clone the element for animation
        const clone = wordElem.cloneNode(true);
        clone.classList.add('animating');
        document.body.appendChild(clone);

        // Get original position
        const rect = wordElem.getBoundingClientRect();
        clone.style.position = 'absolute';
        clone.style.left = `${rect.left}px`;
        clone.style.top = `${rect.top}px`;

        // Remove original element immediately
        wordElem.remove();

        // Animate to target position with staggered delay
        setTimeout(() => {
            clone.style.left = `${targetX}px`;
            clone.style.top = `${targetY}px`;
            clone.style.transform = 'scale(0.5)';
            clone.style.opacity = '0.5';

            // Remove clone and create category box after animation
            if (index === words.length - 1) {
                setTimeout(() => {
                    document.body.removeChild(clone);
                    createCategoryBox(category, targetY);
                }, 500);
            }
        }, index * 100);
    });
}

function createCategoryBox(category, targetY) {
    const categoryBox = document.createElement('div');
    categoryBox.className = `category-box ${category.color} reveal`;
    categoryBox.innerHTML = `
        <div><strong>${category.name}</strong></div>
        <div>${category.words.join(', ')}</div>
    `;
    
    // Add to categories container
    document.getElementById('categoriesContainer').appendChild(categoryBox);
}

async function revealAnswers() {
    const unsolvedCategories = Object.values(categories)
        .filter(category => !category.solved)
        .sort((a, b) => categoryPriority.indexOf(a.color) - categoryPriority.indexOf(b.color));

    for (const category of unsolvedCategories) {
        const gameGrid = document.getElementById('gameGrid');
        const wordElements = Array.from(gameGrid.children).filter(box => 
            category.words.includes(box.textContent)
        );
        
        await mergeCategory(wordElements, category);
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

async function animateMerge(words, category) {
    // Create temporary container for animation
    const animationContainer = document.createElement('div');
    animationContainer.style.position = 'fixed';
    animationContainer.style.pointerEvents = 'none';
    document.body.appendChild(animationContainer);

    // Get target position in categories container
    const categoriesContainer = document.getElementById('categoriesContainer');
    const targetRect = categoriesContainer.getBoundingClientRect();
    const targetPosition = {
        x: targetRect.left + window.scrollX,
        y: targetRect.top + window.scrollY + (categoriesContainer.children.length * 70)
    };

    // Create clones for animation
    const clones = words.map(word => {
        const clone = word.cloneNode(true);
        const rect = word.getBoundingClientRect();
        
        clone.style.position = 'absolute';
        clone.style.left = `${rect.left}px`;
        clone.style.top = `${rect.top}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        animationContainer.appendChild(clone);
        
        word.style.visibility = 'hidden';
        return clone;
    });

    // Animate clones to target position
    const animations = clones.map((clone, index) => {
        return clone.animate([
            {
                transform: 'translate(0, 0) scale(1)',
                opacity: 1
            },
            {
                transform: `translate(${targetPosition.x - clone.offsetLeft}px, 
                          ${targetPosition.y - clone.offsetTop}px) scale(0.5)`,
                opacity: 0.7
            }
        ], {
            duration: 600,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            delay: index * 100
        });
    });

    // Wait for all animations to complete
    await Promise.all(animations.map(animation => animation.finished));

    // Clean up
    animationContainer.remove();
    words.forEach(word => word.remove());

    // Create category box
    createCategoryBox(category);
}

function createCategoryBox(category) {
    const categoryBox = document.createElement('div');
    categoryBox.className = `category-box ${category.color} reveal`;
    categoryBox.innerHTML = `
        <div><strong>${category.name}</strong></div>
        <div>${category.words.join(', ')}</div>
    `;
    
    // Add initial hidden state
    categoryBox.style.opacity = '0';
    categoryBox.style.transform = 'translateY(20px)';
    
    // Add to container and animate
    const container = document.getElementById('categoriesContainer');
    container.appendChild(categoryBox);
    
    // Trigger animation
    requestAnimationFrame(() => {
        categoryBox.style.opacity = '1';
        categoryBox.style.transform = 'translateY(0)';
        categoryBox.style.transition = 'all 0.5s ease-out';
    });
}

function handleIncorrectSubmit() {
    remainingTries--;
    updateTriesDisplay();
    
    if (remainingTries === 0) {
        gameActive = false;
        document.getElementById('message').textContent = "you were prob close lol..... or not";
        revealAnswers();
    }
}

function updateTriesDisplay() {
    const circles = document.querySelectorAll('#triesCircles .circle');
    circles.forEach((circle, index) => {
        // Turn circles white from right to left
        circle.classList.toggle('white', index >= remainingTries);
    });
}

function shuffleWords() {
    if (!gameActive) return;
    
    const gameGrid = document.getElementById('gameGrid');
    const boxes = Array.from(gameGrid.children);
    shuffleArray(boxes);
    gameGrid.innerHTML = '';
    boxes.forEach(box => gameGrid.appendChild(box));
}

function deselectAll() {
    selectedWords = [];
    document.querySelectorAll('.word-box').forEach(box => {
        box.classList.remove('selected');
    });
}

function checkGameEnd() {
    if (categoriesSolved === 4) {
        gameActive = false;
        document.getElementById('message').textContent = "YAY!!! u did it :D didn't think u could honestly";
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Initialize game on load
window.onload = initializeGame;
