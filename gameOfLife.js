// Select canvas and set context
const canvas = document.getElementById('gameOfLifeCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game of Life settings
const resolution = 10; // Adjust for different cell sizes
const cols = canvas.width / resolution;
const rows = canvas.height / resolution;

// Initialize state
let grid = new Array(cols).fill(null)
    .map(() => new Array(rows).fill(0)
    .map(() => Math.floor(Math.random() * 2))); // Random initial state

// Game of Life rules
function update() {
  grid = nextGen(grid);
  render(grid);
  requestAnimationFrame(update);
}

// Compute the next generation of the grid
function nextGen(grid) {
  const nextGen = grid.map(arr => [...arr]);

  for (let col = 0; col < grid.length; col++) {
    for (let row = 0; row < grid[col].length; row++) {
      const cell = grid[col][row];
      let numNeighbours = 0;
      for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
          if (i === 0 && j === 0) continue;
          const x_cell = col + i;
          const y_cell = row + j;

          if (x_cell >= 0 && y_cell >= 0 && x_cell < cols && y_cell < rows) {
            const currentNeighbour = grid[col + i][row + j];
            numNeighbours += currentNeighbour;
          }
        }
      }
      
      // Rules of Life
      if (cell === 1 && numNeighbours < 2) nextGen[col][row] = 0; // Loneliness
      else if (cell === 1 && numNeighbours > 3) nextGen[col][row] = 0; // Overpopulation
      else if (cell === 0 && numNeighbours === 3) nextGen[col][row] = 1; // Reproduction
      // Otherwise, no change in state
    }
  }

  return nextGen;
}

// Render the grid
function render(grid) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let col = 0; col < grid.length; col++) {
    for (let row = 0; row < grid[col].length; row++) {
      const cell = grid[col][row];

      ctx.beginPath();
      ctx.rect(col * resolution, row * resolution, resolution, resolution);
      ctx.fillStyle = cell ? 'black' : 'white';
      ctx.fill();
      ctx.stroke();
    }
  }
}

// Start the game
update();
