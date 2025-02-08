let selectedWords = [];
let remainingTries = 4;
let gameActive = true;
let categoriesSolved = 0;

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

function handleCorrectCategory(category) {
    category.solved = true;
    categoriesSolved++;
    
    // Get all word elements for this category
    const gameGrid = document.getElementById('gameGrid');
    const wordElements = Array.from(gameGrid.children).filter(box => 
        category.words.includes(box.textContent)
    );

    // Animate the merge
    animateMerge(wordElements, category);
    checkGameEnd();
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

function revealAnswers() {
    const unsolvedCategories = Object.values(categories)
        .filter(category => !category.solved)
        .sort((a, b) => categoryPriority.indexOf(a.color) - categoryPriority.indexOf(b.color));

    unsolvedCategories.forEach((category, index) => {
        setTimeout(() => {
            const gameGrid = document.getElementById('gameGrid');
            const wordElements = Array.from(gameGrid.children).filter(box => 
                category.words.includes(box.textContent)
            );
            
            animateMerge(wordElements, category);
        }, index * 1000);
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
