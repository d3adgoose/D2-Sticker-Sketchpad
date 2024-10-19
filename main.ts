import "./style.css";

const APP_NAME = "Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

// Create and add title to the app
const title = document.createElement("h1");
title.textContent = APP_NAME;
app.appendChild(title);

// Create and add canvas to the app
const canvas = document.createElement("canvas");
canvas.id = "canvas";
canvas.width = 256;
canvas.height = 256;
app.appendChild(canvas);

const ctx = canvas.getContext("2d")!;
let isDrawing = false;

// Array to store lines (each line is an array of points)
const lines: { x: number; y: number }[][] = [];
let currentLine: { x: number; y: number }[] = [];

// Array to store lines for redo functionality
const redoStack: { x: number; y: number }[][] = [];

// Event listener to start drawing on mousedown
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  currentLine = [];
  addPoint(e);
  redoStack.length = 0; // Clear the redo stack when a new drawing starts
});

// Event listener to save points on mousemove
canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    addPoint(e);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

// Event listener to stop drawing on mouseup
canvas.addEventListener("mouseup", () => {
  if (isDrawing) {
    isDrawing = false;
    lines.push(currentLine);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

// Event listener to stop drawing if mouse leaves the canvas
canvas.addEventListener("mouseout", () => {
  if (isDrawing) {
    isDrawing = false;
    lines.push(currentLine);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

// Function to add a point to the current line
function addPoint(e: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  currentLine.push({ x: e.clientX - rect.left, y: e.clientY - rect.top });
}

// Observer for "drawing-changed" to clear and redraw the canvas
canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawLines();
});

// Function to redraw the saved lines
function drawLines() {
  for (const line of lines) {
    if (line.length > 0) {
      ctx.beginPath();
      ctx.moveTo(line[0].x, line[0].y);
      for (const point of line) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
    }
  }
}

// Create and add the undo button
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
app.appendChild(undoButton);

// Create and add the redo button
const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
app.appendChild(redoButton);

// Create and add a clear button to the app
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
app.appendChild(clearButton);

// Undo the last drawn line
undoButton.addEventListener("click", () => {
  if (lines.length > 0) {
    const lastLine = lines.pop(); // Remove the last line
    if (lastLine) {
      redoStack.push(lastLine); // Add it to the redo stack
      canvas.dispatchEvent(new Event("drawing-changed"));
    }
  }
});

// Redo the last undone line
redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    const redoLine = redoStack.pop(); // Take the last line from the redo stack
    if (redoLine) {
      lines.push(redoLine); // Add it back to the lines array
      canvas.dispatchEvent(new Event("drawing-changed"));
    }
  }
});

// Clear the canvas and reset lines when the "Clear" button is clicked
clearButton.addEventListener("click", () => {
  lines.length = 0; // Clear the lines array
  redoStack.length = 0; // Clear the redo stack
  canvas.dispatchEvent(new Event("drawing-changed"));
});
