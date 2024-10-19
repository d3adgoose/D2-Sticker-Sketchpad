import "./style.css";
const APP_NAME = "Sticker Sketchpad";
const app = document.querySelector("#app");
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
const ctx = canvas.getContext("2d");
let isDrawing = false;
// Event listener to start drawing on mousedown
canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
});
// Event listener to draw lines on mousemove
canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    }
});
// Event listener to stop drawing on mouseup
canvas.addEventListener("mouseup", () => {
    isDrawing = false;
    ctx.closePath();
});
// Event listener to stop drawing if mouse leaves the canvas
canvas.addEventListener("mouseout", () => {
    isDrawing = false;
});
// Create and add a clear button to the app
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
app.appendChild(clearButton);
// Clear the canvas when the "Clear" button is clicked
clearButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});
