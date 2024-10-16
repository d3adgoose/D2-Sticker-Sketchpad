// Import necessary styles
import "./style.css";

// Setup the canvas and its context
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
if (!ctx) {
    
    throw new Error('Failed to get the canvas context');
}

// Retrieve buttons and assert their existence
const clearButton = document.getElementById('clearButton') as HTMLButtonElement;
const undoButton = document.getElementById('undoButton') as HTMLButtonElement;
const redoButton = document.getElementById('redoButton') as HTMLButtonElement;

// Setup state for drawing
let isDrawing = false;
let currentLine: [number, number][] = [];
let lines: [number, number][][] = [];
let undoStack: [number, number][][] = [];
let redoStack: [number, number][][] = [];

// Function to start drawing
function startDrawing(event: MouseEvent) {
    isDrawing = true;
    currentLine = [];
    lines.push(currentLine);
    addPoint(event);
}

// Function to stop drawing
function stopDrawing() {
    isDrawing = false;
    undoStack.push([...currentLine]);
}

// Function to add a point to the current line
function addPoint(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    currentLine.push([x, y]);
    redrawCanvas();
}

// Function to redraw the canvas
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.forEach(line => {
        ctx.beginPath();
        line.forEach((point, index) => {
            if (index === 0) ctx.moveTo(point[0], point[1]);
            else ctx.lineTo(point[0], point[1]);
        });
        ctx.stroke();
    });
}

// Event listeners for mouse interactions
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', (event) => {
    if (isDrawing) {
        addPoint(event);
    }
});

// Clear the canvas
clearButton.onclick = () => {
    lines = [];
    undoStack = [];
    redoStack = [];
    redrawCanvas();
};

// Undo the last action
undoButton.onclick = () => {
    if (undoStack.length > 0) {
        redoStack.push(undoStack.pop()!);
        lines.pop();
        redrawCanvas();
    }
};

// Redo the last undone action
redoButton.onclick = () => {
    if (redoStack.length > 0) {
        const lastLine = redoStack.pop()!;
        undoStack.push(lastLine);
        lines.push(lastLine);
        redrawCanvas();
    }
};
