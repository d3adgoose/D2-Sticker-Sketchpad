import "./style.css";

// Get the modal and export button elements
const exportModal = document.getElementById("exportModal") as HTMLDivElement;
const exportButton = document.getElementById("export") as HTMLButtonElement;
const finalExportButton = document.getElementById("finalExport") as HTMLButtonElement;
const closeModalButton = document.querySelector(".close") as HTMLSpanElement;

// Open the modal when the export button is clicked
exportButton.addEventListener("click", () => {
  exportModal.style.display = "block";
});

// Close the modal when the close button is clicked
closeModalButton.addEventListener("click", () => {
  exportModal.style.display = "none";
});

// Close the modal if the user clicks outside of the modal
globalThis.addEventListener("click", (event) => {
  if (event.target === exportModal) {
    exportModal.style.display = "none";
  }
});

// Function to export the canvas as an image
function exportCanvas(backgroundColor: string) {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  // Create a temporary canvas for export
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const exportCtx = exportCanvas.getContext("2d");

  if (!exportCtx) return;

  // If white background is selected, fill the background with white
  if (backgroundColor === "white") {
    exportCtx.fillStyle = "white";
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  }

  // Draw the original canvas onto the export canvas
  exportCtx.drawImage(canvas, 0, 0);

  // Create an image link for download
  const link = document.createElement("a");
  link.download = "sticker_sketchpad.png";
  link.href = exportCanvas.toDataURL();
  link.click();
}

// Final export button logic
finalExportButton.addEventListener("click", () => {
  const selectedBackground = document.querySelector(
    'input[name="bg-color"]:checked'
  ) as HTMLInputElement;
  const backgroundColor = selectedBackground.value;

  // Export the canvas based on the selected background
  exportCanvas(backgroundColor);

  // Close the modal after export
  exportModal.style.display = "none";
});

// Canvas Drawing Logic
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
let isDrawing = false;
let currentThickness = 3;
let currentColor = "#000000";
let currentEmoji: string | null = null;
let currentRotation = 0; // Default rotation for emoji stickers

const emojis: string[] = ["😀", "🍕", "🌟", "🚀", "❤️"];

// Command for drawing lines
class InkLine {
  points: { x: number; y: number }[] = [];
  thickness: number;
  color: string;

  constructor(initialX: number, initialY: number, thickness: number, color: string) {
    this.points.push({ x: initialX, y: initialY });
    this.thickness = thickness;
    this.color = color;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      ctx.lineWidth = this.thickness;
      ctx.strokeStyle = this.color;
      ctx.lineCap = "round";
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.stroke();
    }
  }
}

// Command for placing emojis
class EmojiCommand {
  emoji: string;
  x: number;
  y: number;
  fontSize: number;
  rotation: number;

  constructor(emoji: string, x: number, y: number, fontSize: number, rotation: number) {
    this.emoji = emoji;
    this.x = x;
    this.y = y;
    this.fontSize = fontSize;
    this.rotation = rotation;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.font = `${this.fontSize}px Arial`;
    ctx.fillText(this.emoji, -this.fontSize / 2, this.fontSize / 2);
    ctx.restore();
  }
}

const commands: (InkLine | EmojiCommand)[] = [];
const redoStack: (InkLine | EmojiCommand)[] = [];

let cursorPreview: CursorPreview | null = null;
let currentLine: InkLine | null = null;
let currentEmojiCommand: EmojiCommand | null = null;

// Cursor preview object
class CursorPreview {
  x: number;
  y: number;
  size: number;
  color: string | null = null;
  emoji: string | null = null;
  rotation: number | null = null;

  constructor(x: number, y: number, size: number, color: string | null = null, emoji: string | null = null, rotation: number | null = null) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
    this.emoji = emoji;
    this.rotation = rotation;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.emoji) {
      ctx.save();
      ctx.translate(this.x, this.y);
      if (this.rotation) {
        ctx.rotate((this.rotation * Math.PI) / 180);
      }
      ctx.font = `${this.size}px Arial`;
      ctx.fillText(this.emoji, -this.size / 2, this.size / 2);
      ctx.restore();
    } else if (this.color) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size / 2, 0, 2 * Math.PI);
      ctx.lineWidth = 1;
      ctx.strokeStyle = this.color;
      ctx.stroke();
    }
  }
}

// Helper function to generate a random color
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Helper function to generate a random rotation angle (0 to 360 degrees)
function getRandomRotation() {
  return Math.floor(Math.random() * 361); // 0 to 360 degrees
}

// Mouse event to place emojis or start drawing lines
canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const startX = e.clientX - rect.left;
  const startY = e.clientY - rect.top;

  if (currentEmoji) {
    const emojiSize = currentThickness * 2 + 10;
    currentEmojiCommand = new EmojiCommand(currentEmoji, startX, startY, emojiSize, currentRotation);
    commands.push(currentEmojiCommand);
    redoStack.length = 0;
    canvas.dispatchEvent(new Event("drawing-changed"));
    currentEmojiCommand = null;
  } else {
    isDrawing = true;
    currentLine = new InkLine(startX, startY, currentThickness, currentColor);
    redoStack.length = 0;
    cursorPreview = null;
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (isDrawing && currentLine) {
    currentLine.drag(mouseX, mouseY);
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else if (currentEmojiCommand) {
    currentEmojiCommand.drag(mouseX, mouseY);
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else {
    const previewSize = currentEmoji ? currentThickness * 2 + 10 : currentThickness;
    cursorPreview = new CursorPreview(mouseX, mouseY, previewSize, currentColor, currentEmoji, currentRotation);
    canvas.dispatchEvent(new Event("tool-moved"));
  }
});

canvas.addEventListener("mouseup", () => {
  if (isDrawing && currentLine) {
    isDrawing = false;
    commands.push(currentLine);
    currentLine = null;
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  commands.forEach((command) => command.draw(ctx));
});

canvas.addEventListener("tool-moved", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  commands.forEach((command) => command.draw(ctx));
  if (cursorPreview && !isDrawing) {
    cursorPreview.draw(ctx);
  }
});

// Button setup for thickness and emojis
const toolContainer = document.createElement("div");
toolContainer.classList.add("tools");
document.getElementById("app")!.appendChild(toolContainer);

// Function to create a tool button
function createToolButton(label: string, onClick: () => void) {
  const button = document.createElement("button");
  button.textContent = label;
  button.classList.add("tool-button");
  button.addEventListener("click", onClick);
  toolContainer.appendChild(button);
  return button;
}

// Function to update the selected tool's styling
function updateToolSelection(selectedButton: HTMLElement) {
  document.querySelectorAll(".tool-button").forEach((button) => button.classList.remove("selected"));
  selectedButton.classList.add("selected");
}

const thinButton = createToolButton("Thin Line", () => {
  currentThickness = 3;
  currentEmoji = null;
  currentColor = getRandomColor();
  updateToolSelection(thinButton);
});

const thickButton = createToolButton("Thick Line", () => {
  currentThickness = 8;
  currentEmoji = null;
  currentColor = getRandomColor();
  updateToolSelection(thickButton);
});

updateToolSelection(thinButton);

function renderEmojiButtons() {
  const existingEmojiButtons = document.querySelectorAll(".emoji-button");
  existingEmojiButtons.forEach((button) => button.remove());

  emojis.forEach((sticker) => {
    const emojiButton = document.createElement("button");
    emojiButton.textContent = sticker;
    emojiButton.classList.add("tool-button", "emoji-button");
    emojiButton.addEventListener("click", () => {
      currentEmoji = sticker;
      currentRotation = getRandomRotation();
      updateToolSelection(emojiButton);
      canvas.dispatchEvent(new Event("tool-moved"));
    });
    toolContainer.appendChild(emojiButton);
  });
}

renderEmojiButtons();

const _customEmojiButton = createToolButton("Add Emoji", () => {
  const customEmoji = prompt("Enter your custom emoji:", "🙂");
  if (customEmoji) {
    emojis.push(customEmoji);
    renderEmojiButtons();
  }
});

const actionContainer = document.createElement("div");
actionContainer.classList.add("actions");
document.getElementById("app")!.appendChild(actionContainer);

function createActionButton(label: string, onClick: () => void) {
  const button = document.createElement("button");
  button.textContent = label;
  button.classList.add("action-button");
  button.addEventListener("click", onClick);
  actionContainer.appendChild(button);
  return button;
}

const _undoButton = createActionButton("Undo", () => {
  if (commands.length > 0) {
    redoStack.push(commands.pop()!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

const _redoButton = createActionButton("Redo", () => {
  if (redoStack.length > 0) {
    commands.push(redoStack.pop()!);
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

const _clearButton = createActionButton("Clear", () => {
  commands.length = 0;
  redoStack.length = 0;
  canvas.dispatchEvent(new Event("drawing-changed"));
});
