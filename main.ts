import "./style.css";

const APP_NAME = "Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;

// Add a title and canvas to the page
const title = document.createElement("h1");
title.textContent = APP_NAME;
app.appendChild(title);

const canvas = document.createElement("canvas");
canvas.id = "canvas";
canvas.width = 256;
canvas.height = 256;
app.appendChild(canvas);

const ctx = canvas.getContext("2d")!;
let isDrawing = false;

// Default tool settings: line thickness and sticker
let currentThickness = 2;
let currentSticker: string | null = null;

// Command for drawing lines
class MarkerLine {
  points: { x: number; y: number }[] = [];
  thickness: number;

  constructor(initialX: number, initialY: number, thickness: number) {
    this.points.push({ x: initialX, y: initialY });
    this.thickness = thickness;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      ctx.lineWidth = this.thickness;
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.stroke();
    }
  }
}

// Command for placing stickers
class StickerCommand {
  sticker: string;
  x: number;
  y: number;

  constructor(sticker: string, x: number, y: number) {
    this.sticker = sticker;
    this.x = x;
    this.y = y;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.font = "30px Arial";
    ctx.fillText(this.sticker, this.x, this.y);
  }
}

// Array to store commands and redo stack
const commands: (MarkerLine | StickerCommand)[] = [];
const redoStack: (MarkerLine | StickerCommand)[] = [];

// Tool preview object
let toolPreview: ToolPreview | null = null;
let currentLine: MarkerLine | null = null;
let currentStickerCommand: StickerCommand | null = null;

// Tool preview: a small circle or sticker showing what will be drawn
class ToolPreview {
  x: number;
  y: number;
  thickness: number;

  constructor(x: number, y: number, thickness: number) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.thickness / 2, 0, 2 * Math.PI);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "gray";
    ctx.stroke();
  }
}

// Mouse event to place stickers or start drawing lines
canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const startX = e.clientX - rect.left;
  const startY = e.clientY - rect.top;

  if (currentSticker) {
    // Start placing the sticker
    currentStickerCommand = new StickerCommand(currentSticker, startX, startY);
    commands.push(currentStickerCommand);
    redoStack.length = 0;
    canvas.dispatchEvent(new Event("drawing-changed"));
    currentStickerCommand = null;
  } else {
    // Start drawing a line
    isDrawing = true;
    currentLine = new MarkerLine(startX, startY, currentThickness);
    redoStack.length = 0;
    toolPreview = null;
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

// Drag the sticker or line while moving the mouse
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (isDrawing && currentLine) {
    currentLine.drag(mouseX, mouseY);
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else if (currentStickerCommand) {
    // Drag the sticker
    currentStickerCommand.drag(mouseX, mouseY);
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else {
    // Show the tool preview
    toolPreview = new ToolPreview(mouseX, mouseY, currentThickness);
    canvas.dispatchEvent(new Event("tool-moved"));
  }
});

// Stop drawing when the mouse is released
canvas.addEventListener("mouseup", () => {
  if (isDrawing && currentLine) {
    isDrawing = false;
    commands.push(currentLine);
    currentLine = null;
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

// Clear and redraw the canvas when needed
canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  commands.forEach(command => command.draw(ctx));
});

// Draw tool preview when moving over the canvas
canvas.addEventListener("tool-moved", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  commands.forEach(command => command.draw(ctx));
  if (toolPreview && !isDrawing) {
    toolPreview.draw(ctx);
  }
});

// Button setup for thickness and stickers
const thinButton = document.createElement("button");
thinButton.textContent = "Thin";
app.appendChild(thinButton);

const thickButton = document.createElement("button");
thickButton.textContent = "Thick";
app.appendChild(thickButton);

thinButton.addEventListener("click", () => {
  currentThickness = 2;
  currentSticker = null;
});

thickButton.addEventListener("click", () => {
  currentThickness = 5;
  currentSticker = null;
});

// Sticker buttons
const stickers = ["😀", "🍕", "🌟"];
stickers.forEach(sticker => {
  const stickerButton = document.createElement("button");
  stickerButton.textContent = sticker;
  stickerButton.addEventListener("click", () => {
    currentSticker = sticker;
    canvas.dispatchEvent(new Event("tool-moved"));
  });
  app.appendChild(stickerButton);
});

// Undo, Redo, Clear buttons
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
app.appendChild(undoButton);

const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
app.appendChild(redoButton);

const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
app.appendChild(clearButton);

// Undo/Redo functionality
undoButton.addEventListener("click", () => {
  if (commands.length > 0) {
    redoStack.push(commands.pop()!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    commands.push(redoStack.pop()!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

// Clear the canvas
clearButton.addEventListener("click", () => {
  commands.length = 0;
  redoStack.length = 0;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

