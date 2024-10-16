"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import necessary styles
require("./style.css");
// Setup the canvas and its context
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
if (!ctx) {
    throw new Error('Failed to get the canvas context');
}
// Retrieve buttons and assert their existence
var clearButton = document.getElementById('clearButton');
var undoButton = document.getElementById('undoButton');
var redoButton = document.getElementById('redoButton');
// Setup state for drawing
var isDrawing = false;
var currentLine = [];
var lines = [];
var undoStack = [];
var redoStack = [];
// Function to start drawing
function startDrawing(event) {
    isDrawing = true;
    currentLine = [];
    lines.push(currentLine);
    addPoint(event);
}
// Function to stop drawing
function stopDrawing() {
    isDrawing = false;
    undoStack.push(__spreadArray([], currentLine, true));
}
// Function to add a point to the current line
function addPoint(event) {
    var rect = canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    currentLine.push([x, y]);
    redrawCanvas();
}
// Function to redraw the canvas
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.forEach(function (line) {
        ctx.beginPath();
        line.forEach(function (point, index) {
            if (index === 0)
                ctx.moveTo(point[0], point[1]);
            else
                ctx.lineTo(point[0], point[1]);
        });
        ctx.stroke();
    });
}
// Event listeners for mouse interactions
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', function (event) {
    if (isDrawing) {
        addPoint(event);
    }
});
// Clear the canvas
clearButton.onclick = function () {
    lines = [];
    undoStack = [];
    redoStack = [];
    redrawCanvas();
};
// Undo the last action
undoButton.onclick = function () {
    if (undoStack.length > 0) {
        redoStack.push(undoStack.pop());
        lines.pop();
        redrawCanvas();
    }
};
// Redo the last undone action
redoButton.onclick = function () {
    if (redoStack.length > 0) {
        var lastLine = redoStack.pop();
        undoStack.push(lastLine);
        lines.push(lastLine);
        redrawCanvas();
    }
};
