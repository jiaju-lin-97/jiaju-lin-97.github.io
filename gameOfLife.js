class GameOfLife {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellSize = 10;
        this.stagnantCount = 0;
        this.lastGridState = '';
        this.isAnimating = true; // Start with animation enabled
        this.animationFrame = null; // Track animation frame
        this.resize();
        this.initGrid();
        window.addEventListener('resize', () => this.resize());

        // Setup toggle button if it exists
        this.setupToggleButton();

        // Start animation immediately
        this.startAnimation();
    }

    setupToggleButton() {
        const toggleButton = document.getElementById('toggleAnimation');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggleAnimation());
            // Set initial button state
            this.updateButtonState(toggleButton);
        }
    }

    toggleAnimation() {
        this.isAnimating = !this.isAnimating;
        const toggleButton = document.getElementById('toggleAnimation');
        this.updateButtonState(toggleButton);

        if (this.isAnimating) {
            this.startAnimation();
        } else {
            this.stopAnimation();
        }
    }

    updateButtonState(button) {
        if (button) {
            button.textContent = this.isAnimating ? 'Pause Animation' : 'Resume Animation';
            button.classList.toggle('paused', !this.isAnimating);
        }
    }

    startAnimation() {
        if (!this.animationFrame) {
            this.animate();
        }
    }

    stopAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.cols = Math.floor(this.canvas.width / this.cellSize);
        this.rows = Math.floor(this.canvas.height / this.cellSize);
    }

    initGrid() {
        this.grid = Array(this.rows).fill().map(() =>
            Array(this.cols).fill().map(() => Math.random() > 0.85)
        );
    }

    addRandomDisturbance() {
        const disturbanceCount = Math.floor(this.rows * this.cols * 0.01); // Disturb 1% of cells
        for (let i = 0; i < disturbanceCount; i++) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            this.grid[row][col] = Math.random() > 0.5;
        }
    }

    checkStagnation() {
        const currentState = this.grid;
        if (this.lastGridState) {
            let changedCells = 0;
            const totalCells = this.rows * this.cols;

            // Count changed cells
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    if (currentState[i][j] !== this.lastGridState[i][j]) {
                        changedCells++;
                    }
                }
            }

            // If less than 10% cells changed
            if (changedCells / totalCells < 0.04) {
                this.stagnantCount++;
                if (this.stagnantCount > 70) {
                    this.addRandomDisturbance();
                    this.stagnantCount = 0;
                }
            } else {
                this.stagnantCount = 0;
            }
        }

        // Create a deep copy of current state for next comparison
        this.lastGridState = currentState.map(row => [...row]);
    }

    update() {
        const newGrid = Array(this.rows).fill().map(() => Array(this.cols).fill(false));

        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const neighbors = this.countNeighbors(i, j);
                if (this.grid[i][j]) {
                    newGrid[i][j] = neighbors === 2 || neighbors === 3;
                } else {
                    newGrid[i][j] = neighbors === 3;
                }
            }
        }

        this.grid = newGrid;
        this.checkStagnation();
    }

    countNeighbors(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const newRow = (row + i + this.rows) % this.rows;
                const newCol = (col + j + this.cols) % this.cols;
                if (this.grid[newRow][newCol]) count++;
            }
        }
        return count;
    }

    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Use a slightly different blue color for variety
        const baseHue = 210; // Blue hue

        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.grid[i][j]) {
                    // Vary the color slightly based on position
                    const hue = (baseHue + Math.sin(i * 0.1) * 10) % 360;
                    const saturation = 70 + Math.cos(j * 0.1) * 10;
                    this.ctx.fillStyle = `hsla(${hue}, ${saturation}%, 60%, 0.5)`;

                    this.ctx.fillRect(
                        j * this.cellSize,
                        i * this.cellSize,
                        this.cellSize - 1,
                        this.cellSize - 1
                    );
                }
            }
        }
    }

    animate() {
        if (!this.isAnimating) {
            this.animationFrame = null;
            return;
        }

        this.update();
        this.draw();
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
}

// Auto-initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        const game = new GameOfLife(canvas);
    }
}); 