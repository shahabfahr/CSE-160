// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }
`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }
`;

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

// UI Globals
let g_selectedColor = [1.0, 0.0, 0.0, 1.0];
let g_selectedSize = 10;
let g_selectedType = 'point';
let g_selectedSegments = 10;

function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

function addActionsForHtmlUI(){
  // Clear Button
  document.getElementById('clearButton').addEventListener('click', function() {
    g_shapesList = [];
    renderAllShapes();
  });

  // Draw Picture Button
  document.getElementById('drawPictureButton').addEventListener('click', function() {
    drawPicture();
  });

  // Point Button
  document.getElementById('pointButton').addEventListener('click', function() {
    g_selectedType = 'point';
  });

  // Triangle Button
  document.getElementById('triangleButton').addEventListener('click', function() {
    g_selectedType = 'triangle';
  });

  // Circle Button
  document.getElementById('circleButton').addEventListener('click', function() {
    g_selectedType = 'circle';
  });

  // Red Slider
  document.getElementById('redSlider').addEventListener('input', function() {
    g_selectedColor[0] = this.value / 255;
  });

  // Green Slider
  document.getElementById('greenSlider').addEventListener('input', function() {
    g_selectedColor[1] = this.value / 255;
  });

  // Blue Slider
  document.getElementById('blueSlider').addEventListener('input', function() {
    g_selectedColor[2] = this.value / 255;
  });

  // Size Slider
  document.getElementById('sizeSlider').addEventListener('input', function() {
    g_selectedSize = this.value;
  });

  // Segment Slider
  document.getElementById('segmentSlider').addEventListener('input', function() {
    g_selectedSegments = this.value;
  });
}

// Initialize shaders without external library
function initShaders(gl, vshader, fshader) {
  var program = createProgram(gl, vshader, fshader);
  if (!program) {
    console.log('Failed to create program');
    return false;
  }
  gl.program = program;
  gl.useProgram(program);
  return true;
}

function createProgram(gl, vshader, fshader) {
  // Create shader objects
  var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
  var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
  if (!vertexShader || !fragmentShader) {
    return null;
  }

  // Create a program object
  var program = gl.createProgram();
  if (!program) {
    return null;
  }

  // Attach the shader objects
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  // Link the program object
  gl.linkProgram(program);

  // Check the result of linking
  var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    var error = gl.getProgramInfoLog(program);
    console.log('Failed to link program: ' + error);
    gl.deleteProgram(program);
    gl.deleteShader(fragmentShader);
    gl.deleteShader(vertexShader);
    return null;
  }
  return program;
}

function loadShader(gl, type, source) {
  // Create shader object
  var shader = gl.createShader(type);
  if (shader == null) {
    console.log('unable to create shader');
    return null;
  }

  // Set the shader program
  gl.shaderSource(shader, source);

  // Compile the shader
  gl.compileShader(shader);

  // Check the result of compilation
  var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
    var error = gl.getShaderInfoLog(shader);
    console.log('Failed to compile shader: ' + error);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function main() {
  // Set up canvas and gl variables
  setupWebGL();
  // Set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();
  // Set up actions for the HTML UI elements
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = click;

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

// Shape storage
var g_shapesList = [];

function click(ev) {
  // Only draw if mouse button is pressed
  if (ev.buttons !== 1) {
    return;
  }

  // Extract the event click and return it in WebGL coordinates
  let [x,y] = convertCoordinatesEventToGL(ev);

  // Create a new shape based on selected type
  let shape;
  if (g_selectedType === 'point') {
    shape = new Point();
  } else if (g_selectedType === 'triangle') {
    shape = new Triangle();
  } else if (g_selectedType === 'circle') {
    shape = new Circle();
    shape.segments = g_selectedSegments;
  }
  
  shape.position = [x, y];
  shape.color = [g_selectedColor[0], g_selectedColor[1], g_selectedColor[2], 1.0];
  shape.size = g_selectedSize;
  g_shapesList.push(shape);

  //Draw every shape that is supposed to be in the canvas
  renderAllShapes();
}

// Extract the event click and return it in WebGL coordinates
function convertCoordinatesEventToGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x,y]);
}

//Draw every shape that is supposed to be in the canvas
function renderAllShapes(){
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }
}

// Draw a custom picture using triangles (Step 12)
function drawPicture() {

  // Clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  // Set color to white
  gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);

  // 20 x 20 grid

  // top right quadrant
  drawTriangle([0.0, 0.0, 0.0, 0.1, 0.1, 0.0]);
  drawTriangle([0.0, 0.1, 0.0, 0.2, 0.1, 0.2]);
  drawTriangle([0.0, 0.2, 0.0, 0.3, 0.1, 0.2]);
  drawTriangle([0.0, 0.3, 0.0, 0.4, 0.1, 0.4]);
  drawTriangle([0.0, 0.4, 0.0, 0.5, 0.1, 0.4]);
  drawTriangle([0.0, 0.5, 0.0, 0.6, 0.1, 0.6]);
  drawTriangle([0.0, 0.6, 0.1, 0.7, 0.1, 0.6]);

  drawTriangle([0.1, 0.2, 0.2, 0.2, 0.2, 0.1]);
  drawTriangle([0.1, 0.2, 0.1, 0.3, 0.2, 0.2]);
  drawTriangle([0.1, 0.7, 0.1, 0.8, 0.2, 0.7]);
  drawTriangle([0.1, 0.8, 0.2, 0.8, 0.2, 0.7]);

  drawTriangle([0.2, 0.0, 0.2, 0.1, 0.3, 0.0]);
  drawTriangle([0.2, 0.5, 0.2, 0.6, 0.3, 0.5]);
  drawTriangle([0.2, 0.6, 0.2, 0.7, 0.3, 0.7]);
  drawTriangle([0.2, 0.7, 0.2, 0.8, 0.3, 0.8]);
  drawTriangle([0.2, 0.7, 0.3, 0.7, 0.3, 0.8]);

  // right eye (RED)
  gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0);
  drawTriangle([0.35, 0.55, 0.35, 0.65, 0.45, 0.55]);
  drawTriangle([0.45, 0.55, 0.35, 0.65, 0.45, 0.65]);
  // back to white
  gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);


  drawTriangle([0.3, 0.7, 0.3, 0.8, 0.4, 0.7]);
  drawTriangle([0.3, 0.8, 0.4, 0.8, 0.4, 0.7]);

  drawTriangle([0.4, 0.1, 0.4, 0.2, 0.5, 0.2]);
  drawTriangle([0.4, 0.2, 0.4, 0.3, 0.5, 0.2]);
  drawTriangle([0.4, 0.3, 0.5, 0.3, 0.5, 0.2]);
  drawTriangle([0.4, 0.7, 0.4, 0.8, 0.5, 0.7]);
  drawTriangle([0.4, 0.8, 0.5, 0.8, 0.5, 0.7]);

  drawTriangle([0.5, 0.2, 0.5, 0.3, 0.6, 0.3]);
  drawTriangle([0.5, 0.5, 0.6, 0.6, 0.6, 0.5]);
  drawTriangle([0.6, 0.6, 0.5, 0.7, 0.6, 0.7]);
  drawTriangle([0.5, 0.7, 0.5, 0.8, 0.6, 0.8]);
  drawTriangle([0.5, 0.7, 0.6, 0.8, 0.6, 0.7]);

  drawTriangle([0.6, 0.7, 0.6, 0.8, 0.7, 0.7]);

  // TOP LEFT QUADRANT (mirrored - all x values negated)
  drawTriangle([0.0, 0.0, 0.0, 0.1, -0.1, 0.0]);
  drawTriangle([0.0, 0.1, 0.0, 0.2, -0.1, 0.2]);
  drawTriangle([0.0, 0.2, 0.0, 0.3, -0.1, 0.2]);
  drawTriangle([0.0, 0.3, 0.0, 0.4, -0.1, 0.4]);
  drawTriangle([0.0, 0.4, 0.0, 0.5, -0.1, 0.4]);
  drawTriangle([0.0, 0.5, 0.0, 0.6, -0.1, 0.6]);
  drawTriangle([0.0, 0.6, -0.1, 0.7, -0.1, 0.6]);
  drawTriangle([-0.1, 0.2, -0.2, 0.2, -0.2, 0.1]);
  drawTriangle([-0.1, 0.2, -0.1, 0.3, -0.2, 0.2]);
  drawTriangle([-0.1, 0.7, -0.1, 0.8, -0.2, 0.7]);
  drawTriangle([-0.1, 0.8, -0.2, 0.8, -0.2, 0.7]);
  drawTriangle([-0.2, 0.0, -0.2, 0.1, -0.3, 0.0]);
  drawTriangle([-0.2, 0.5, -0.2, 0.6, -0.3, 0.5]);
  drawTriangle([-0.2, 0.6, -0.2, 0.7, -0.3, 0.7]);
  drawTriangle([-0.2, 0.7, -0.2, 0.8, -0.3, 0.8]);
  drawTriangle([-0.2, 0.7, -0.3, 0.7, -0.3, 0.8]);
  
  // left eye (RED)
  gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0);
  drawTriangle([-0.35, 0.55, -0.35, 0.65, -0.45, 0.55]);
  drawTriangle([-0.45, 0.55, -0.35, 0.65, -0.45, 0.65]);
  // back to white
  gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);

  drawTriangle([-0.3, 0.7, -0.3, 0.8, -0.4, 0.7]);
  drawTriangle([-0.3, 0.8, -0.4, 0.8, -0.4, 0.7]);
  drawTriangle([-0.4, 0.1, -0.4, 0.2, -0.5, 0.2]);
  drawTriangle([-0.4, 0.2, -0.4, 0.3, -0.5, 0.2]);
  drawTriangle([-0.4, 0.3, -0.5, 0.3, -0.5, 0.2]);
  drawTriangle([-0.4, 0.7, -0.4, 0.8, -0.5, 0.7]);
  drawTriangle([-0.4, 0.8, -0.5, 0.8, -0.5, 0.7]);
  drawTriangle([-0.5, 0.2, -0.5, 0.3, -0.6, 0.3]);
  drawTriangle([-0.5, 0.5, -0.6, 0.6, -0.6, 0.5]);
  drawTriangle([-0.6, 0.6, -0.5, 0.7, -0.6, 0.7]);
  drawTriangle([-0.5, 0.7, -0.5, 0.8, -0.6, 0.8]);
  drawTriangle([-0.5, 0.7, -0.6, 0.8, -0.6, 0.7]);
  drawTriangle([-0.6, 0.7, -0.6, 0.8, -0.7, 0.7]);

  // bottom right quadrant
  /*
  drawTriangle([0.0, -0.2, 0.0, -0.3, 0.1, -0.2]);
  drawTriangle([0.0, -0.3, 0.1, -0.2, 0.1, -0.3]);
  drawTriangle([0.0, -0.3, 0.0, -0.4, 0.1, -0.3]);
  drawTriangle([0.0, -0.4, 0.1, -0.3, 0.1, -0.4]); */
  drawTriangle([0.0, -0.4, 0.0, -0.5, 0.1, -0.4]);
  drawTriangle([0.0, -0.5, 0.1, -0.4, 0.1, -0.5]);
  drawTriangle([0.0, -0.5, 0.0, -0.6, 0.1, -0.5]);
  drawTriangle([0.0, -0.8, 0.0, -0.9, 0.1, -0.8]);
  drawTriangle([0.0, -0.9, 0.1, -0.8, 0.1, -0.9]);
  //drawTriangle([0.0, -0.9, 0.0, -1.0, 0.1, -0.9]);
  //drawTriangle([0.0, -1.0, 0.1, -0.9, 0.1, -1.0]);

  //drawTriangle([0.1, -0.1, 0.2, -0.1, 0.2, -0.2]);

  // mustache
  /*
  drawTriangle([0.1, -0.2, 0.1, -0.3, 0.2, -0.2]);
  drawTriangle([0.1, -0.3, 0.2, -0.2, 0.2, -0.3]);
  drawTriangle([0.1, -0.3, 0.1, -0.4, 0.2, -0.3]);
  drawTriangle([0.1, -0.4, 0.2, -0.3, 0.2, -0.4]); // 1
  drawTriangle([0.2, -0.2, 0.2, -0.3, 0.3, -0.2]);
  drawTriangle([0.2, -0.3, 0.3, -0.2, 0.3, -0.3]);
  drawTriangle([0.2, -0.3, 0.2, -0.4, 0.3, -0.3]);
  drawTriangle([0.2, -0.4, 0.3, -0.3, 0.3, -0.4]); // 2
  drawTriangle([0.3, -0.2, 0.3, -0.3, 0.4, -0.2]);
  drawTriangle([0.3, -0.3, 0.4, -0.2, 0.4, -0.3]);
  drawTriangle([0.3, -0.3, 0.3, -0.4, 0.4, -0.3]);
  drawTriangle([0.3, -0.4, 0.4, -0.3, 0.4, -0.4]); // 3
  drawTriangle([0.4, -0.2, 0.4, -0.3, 0.5, -0.2]);
  drawTriangle([0.4, -0.3, 0.5, -0.2, 0.5, -0.3]);
  drawTriangle([0.4, -0.3, 0.4, -0.4, 0.5, -0.3]);
  drawTriangle([0.4, -0.4, 0.5, -0.3, 0.5, -0.4]); // 4
  drawTriangle([0.5, -0.2, 0.5, -0.3, 0.6, -0.2]);
  drawTriangle([0.5, -0.3, 0.6, -0.2, 0.6, -0.3]);
  drawTriangle([0.5, -0.3, 0.5, -0.4, 0.6, -0.3]);
  drawTriangle([0.5, -0.4, 0.6, -0.3, 0.6, -0.4]); // 6
  drawTriangle([0.6, -0.2, 0.6, -0.3, 0.7, -0.3]); 
  drawTriangle([0.6, -0.3, 0.6, -0.4, 0.7, -0.3]);
  drawTriangle([0.6, -0.4, 0.7, -0.3, 0.7, -0.4]); 
  drawTriangle([0.7, -0.3, 0.7, -0.4, 0.8, -0.4]); */

  // top lip
  drawTriangle([0.1, -0.4, 0.1, -0.5, 0.2, -0.4]);
  drawTriangle([0.1, -0.5, 0.2, -0.4, 0.2, -0.5]);
  drawTriangle([0.2, -0.4, 0.2, -0.5, 0.3, -0.4]);
  drawTriangle([0.2, -0.5, 0.3, -0.4, 0.3, -0.5]);
  drawTriangle([0.3, -0.4, 0.3, -0.5, 0.4, -0.4]);
  drawTriangle([0.3, -0.5, 0.4, -0.4, 0.4, -0.5]);
  drawTriangle([0.4, -0.4, 0.4, -0.5, 0.5, -0.5]);

  // bottom lip
  drawTriangle([0.0, -0.8, 0.0, -0.9, 0.1, -0.8]);
  drawTriangle([0.0, -0.9, 0.1, -0.8, 0.1, -0.9]);
  drawTriangle([0.1, -0.8, 0.1, -0.9, 0.2, -0.8]);
  drawTriangle([0.1, -0.9, 0.2, -0.8, 0.2, -0.9]);
  drawTriangle([0.2, -0.8, 0.2, -0.9, 0.3, -0.8]);
  drawTriangle([0.2, -0.9, 0.3, -0.8, 0.3, -0.9]);
  drawTriangle([0.3, -0.8, 0.3, -0.9, 0.4, -0.8]);
  drawTriangle([0.3, -0.9, 0.4, -0.8, 0.4, -0.9]);
  drawTriangle([0.4, -0.8, 0.4, -0.9, 0.5, -0.8]);

  // side lip 
  drawTriangle([0.3, -0.5, 0.4, -0.5, 0.4, -0.6]);
  drawTriangle([0.4, -0.6, 0.4, -0.5, 0.5, -0.6]);
  drawTriangle([0.4, -0.5, 0.5, -0.5, 0.5, -0.6]);
  drawTriangle([0.4, -0.7, 0.4, -0.6, 0.5, -0.7]);
  drawTriangle([0.4, -0.6, 0.5, -0.6, 0.5, -0.7]);
  drawTriangle([0.4, -0.8, 0.4, -0.7, 0.5, -0.8]);
  drawTriangle([0.4, -0.7, 0.5, -0.7, 0.5, -0.8]);
  drawTriangle([0.3, -0.8, 0.4, -0.7, 0.4, -0.8]);

  // bottom left quadrant (mirrored)
  /*
  drawTriangle([0.0, -0.2, 0.0, -0.3, -0.1, -0.2]);
  drawTriangle([0.0, -0.3, -0.1, -0.2, -0.1, -0.3]);
  drawTriangle([0.0, -0.3, 0.0, -0.4, -0.1, -0.3]);
  drawTriangle([0.0, -0.4, -0.1, -0.3, -0.1, -0.4]); */
  drawTriangle([0.0, -0.4, 0.0, -0.5, -0.1, -0.4]);
  drawTriangle([0.0, -0.5, -0.1, -0.4, -0.1, -0.5]);
  drawTriangle([0.0, -0.5, 0.0, -0.6, -0.1, -0.5]);
  drawTriangle([0.0, -0.8, 0.0, -0.9, -0.1, -0.8]);
  drawTriangle([0.0, -0.9, -0.1, -0.8, -0.1, -0.9]);
  //drawTriangle([0.0, -0.9, 0.0, -1.0, -0.1, -0.9]);
  //drawTriangle([0.0, -1.0, -0.1, -0.9, -0.1, -1.0]);
  //drawTriangle([-0.1, -0.1, -0.2, -0.1, -0.2, -0.2]);
  // mustache 
  /*
  drawTriangle([-0.1, -0.2, -0.1, -0.3, -0.2, -0.2]);
  drawTriangle([-0.1, -0.3, -0.2, -0.2, -0.2, -0.3]);
  drawTriangle([-0.1, -0.3, -0.1, -0.4, -0.2, -0.3]);
  drawTriangle([-0.1, -0.4, -0.2, -0.3, -0.2, -0.4]); // 1
  drawTriangle([-0.2, -0.2, -0.2, -0.3, -0.3, -0.2]);
  drawTriangle([-0.2, -0.3, -0.3, -0.2, -0.3, -0.3]);
  drawTriangle([-0.2, -0.3, -0.2, -0.4, -0.3, -0.3]);
  drawTriangle([-0.2, -0.4, -0.3, -0.3, -0.3, -0.4]); // 2
  drawTriangle([-0.3, -0.2, -0.3, -0.3, -0.4, -0.2]);
  drawTriangle([-0.3, -0.3, -0.4, -0.2, -0.4, -0.3]);
  drawTriangle([-0.3, -0.3, -0.3, -0.4, -0.4, -0.3]);
  drawTriangle([-0.3, -0.4, -0.4, -0.3, -0.4, -0.4]); // 3
  drawTriangle([-0.4, -0.2, -0.4, -0.3, -0.5, -0.2]);
  drawTriangle([-0.4, -0.3, -0.5, -0.2, -0.5, -0.3]);
  drawTriangle([-0.4, -0.3, -0.4, -0.4, -0.5, -0.3]);
  drawTriangle([-0.4, -0.4, -0.5, -0.3, -0.5, -0.4]); // 4
  drawTriangle([-0.5, -0.2, -0.5, -0.3, -0.6, -0.2]);
  drawTriangle([-0.5, -0.3, -0.6, -0.2, -0.6, -0.3]);
  drawTriangle([-0.5, -0.3, -0.5, -0.4, -0.6, -0.3]);
  drawTriangle([-0.5, -0.4, -0.6, -0.3, -0.6, -0.4]); // 6
  drawTriangle([-0.6, -0.2, -0.6, -0.3, -0.7, -0.3]); 
  drawTriangle([-0.6, -0.3, -0.6, -0.4, -0.7, -0.3]);
  drawTriangle([-0.6, -0.4, -0.7, -0.3, -0.7, -0.4]); 
  drawTriangle([-0.7, -0.3, -0.7, -0.4, -0.8, -0.4]);
  */
  // top lip
  drawTriangle([-0.1, -0.4, -0.1, -0.5, -0.2, -0.4]);
  drawTriangle([-0.1, -0.5, -0.2, -0.4, -0.2, -0.5]);
  drawTriangle([-0.2, -0.4, -0.2, -0.5, -0.3, -0.4]);
  drawTriangle([-0.2, -0.5, -0.3, -0.4, -0.3, -0.5]);
  drawTriangle([-0.3, -0.4, -0.3, -0.5, -0.4, -0.4]);
  drawTriangle([-0.3, -0.5, -0.4, -0.4, -0.4, -0.5]);
  drawTriangle([-0.4, -0.4, -0.4, -0.5, -0.5, -0.5]);
  // bottom lip
  drawTriangle([0.0, -0.8, 0.0, -0.9, -0.1, -0.8]);
  drawTriangle([0.0, -0.9, -0.1, -0.8, -0.1, -0.9]);
  drawTriangle([-0.1, -0.8, -0.1, -0.9, -0.2, -0.8]);
  drawTriangle([-0.1, -0.9, -0.2, -0.8, -0.2, -0.9]);
  drawTriangle([-0.2, -0.8, -0.2, -0.9, -0.3, -0.8]);
  drawTriangle([-0.2, -0.9, -0.3, -0.8, -0.3, -0.9]);
  drawTriangle([-0.3, -0.8, -0.3, -0.9, -0.4, -0.8]);
  drawTriangle([-0.3, -0.9, -0.4, -0.8, -0.4, -0.9]);
  drawTriangle([-0.4, -0.8, -0.4, -0.9, -0.5, -0.8]);
  // side lip 
  drawTriangle([-0.3, -0.5, -0.4, -0.5, -0.4, -0.6]);
  drawTriangle([-0.4, -0.6, -0.4, -0.5, -0.5, -0.6]);
  drawTriangle([-0.4, -0.5, -0.5, -0.5, -0.5, -0.6]);
  drawTriangle([-0.4, -0.7, -0.4, -0.6, -0.5, -0.7]);
  drawTriangle([-0.4, -0.6, -0.5, -0.6, -0.5, -0.7]);
  drawTriangle([-0.4, -0.8, -0.4, -0.7, -0.5, -0.8]);
  drawTriangle([-0.4, -0.7, -0.5, -0.7, -0.5, -0.8]);
  drawTriangle([-0.3, -0.8, -0.4, -0.7, -0.4, -0.8]);

  // forgotten stuffs
  drawTriangle([0.2, -0.2, 0.2, -0.1, 0.3, -0.1]);
  drawTriangle([-0.2, -0.2, -0.2, -0.1, -0.3, -0.1]);
  drawTriangle([0.2, 0.0, 0.3, 0.0, 0.3, -0.1]);
  drawTriangle([-0.2, 0.0, -0.3, 0.0, -0.3, -0.1]);
  // gotee
  /*
  drawTriangle([-0.2, -0.9, -0.1, -1.0, -0.1, -0.9]);
  drawTriangle([0.2, -0.9, 0.1, -1.0, 0.1, -0.9]);
  */

  // initials (SF) (RED)
  // S
  gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0);
  drawTriangle([-0.4, -0.7, -0.3, -0.7, -0.3, -0.8]);
  drawTriangle([-0.3, -0.7, -0.3, -0.8, -0.2, -0.8]);
  drawTriangle([-0.3, -0.7, -0.2, -0.7, -0.2, -0.8]);
  drawTriangle([-0.2, -0.8, -0.2, -0.7, -0.1, -0.7]);
  drawTriangle([-0.2, -0.6, -0.1, -0.6, -0.1, -0.7]);
  drawTriangle([-0.1, -0.6, 0.0, -0.6, 0.0, -0.6]);
  drawTriangle([-0.1, -0.5, 0.0, -0.5, 0.0, -0.6]);
  drawTriangle([-0.2, -0.6, -0.1, -0.5, -0.1, -0.6]);
  drawTriangle([-0.1, -0.6, -0.1, -0.5, -0.0, -0.6]);
  drawTriangle([0.0, -0.6, 0.0, -0.5, 0.1, -0.5]);
  // F
  drawTriangle([0.1, -0.5, 0.1, -0.6, 0.2, -0.6]);
  drawTriangle([0.1, -0.5, 0.2, -0.5, 0.2, -0.6]);
  drawTriangle([0.1, -0.6, 0.1, -0.7, 0.2, -0.7]);
  drawTriangle([0.1, -0.6, 0.2, -0.6, 0.2, -0.7]);
  drawTriangle([0.1, -0.7, 0.1, -0.8, 0.2, -0.8]);
  drawTriangle([0.1, -0.7, 0.2, -0.7, 0.2, -0.8]);
  drawTriangle([0.2, -0.5, 0.2, -0.55, 0.3, -0.5]);
  drawTriangle([0.2, -0.6, 0.2, -0.65, 0.3, -0.6]);

  // framing diamonds (RED)
  drawTriangle([1.0, 1.0, 0.9, 0.9, 1.0, 0.8]);
  drawTriangle([1.0, 1.0, 1.0, 0.8, 1.0, 0.8]);
  drawTriangle([1.0, 0.8, 0.9, 0.7, 1.0, 0.6]);
  drawTriangle([1.0, 0.8, 1.0, 0.6, 1.0, 0.6]);
  drawTriangle([1.0, 0.6, 0.9, 0.5, 1.0, 0.4]);
  drawTriangle([1.0, 0.6, 1.0, 0.4, 1.0, 0.4]);
  drawTriangle([1.0, 0.4, 0.9, 0.3, 1.0, 0.2]);
  drawTriangle([1.0, 0.4, 1.0, 0.2, 1.0, 0.2]);
  drawTriangle([1.0, 0.2, 0.9, 0.1, 1.0, 0.0]);
  drawTriangle([1.0, 0.2, 1.0, 0.0, 1.0, 0.0]);
  drawTriangle([1.0, 0.0, 0.9, -0.1, 1.0, -0.2]);
  drawTriangle([1.0, 0.0, 1.0, -0.2, 1.0, -0.2]);
  drawTriangle([1.0, -0.2, 0.9, -0.3, 1.0, -0.4]);
  drawTriangle([1.0, -0.2, 1.0, -0.4, 1.0, -0.4]);
  drawTriangle([1.0, -0.4, 0.9, -0.5, 1.0, -0.6]);
  drawTriangle([1.0, -0.4, 1.0, -0.6, 1.0, -0.6]);
  drawTriangle([1.0, -0.6, 0.9, -0.7, 1.0, -0.8]);
  drawTriangle([1.0, -0.6, 1.0, -0.8, 1.0, -0.8]);
  drawTriangle([1.0, -0.8, 0.9, -0.9, 1.0, -1.0]);
  drawTriangle([1.0, -0.8, 1.0, -1.0, 1.0, -1.0]);
  drawTriangle([-1.0, 1.0, -0.9, 0.9, -1.0, 0.8]);
  drawTriangle([-1.0, 1.0, -1.0, 0.8, -1.0, 0.8]);
  drawTriangle([-1.0, 0.8, -0.9, 0.7, -1.0, 0.6]);
  drawTriangle([-1.0, 0.8, -1.0, 0.6, -1.0, 0.6]);
  drawTriangle([-1.0, 0.6, -0.9, 0.5, -1.0, 0.4]);
  drawTriangle([-1.0, 0.6, -1.0, 0.4, -1.0, 0.4]);
  drawTriangle([-1.0, 0.4, -0.9, 0.3, -1.0, 0.2]);
  drawTriangle([-1.0, 0.4, -1.0, 0.2, -1.0, 0.2]);
  drawTriangle([-1.0, 0.2, -0.9, 0.1, -1.0, 0.0]);
  drawTriangle([-1.0, 0.2, -1.0, 0.0, -1.0, 0.0]);
  drawTriangle([-1.0, 0.0, -0.9, -0.1, -1.0, -0.2]);
  drawTriangle([-1.0, 0.0, -1.0, -0.2, -1.0, -0.2]);
  drawTriangle([-1.0, -0.2, -0.9, -0.3, -1.0, -0.4]);
  drawTriangle([-1.0, -0.2, -1.0, -0.4, -1.0, -0.4]);
  drawTriangle([-1.0, -0.4, -0.9, -0.5, -1.0, -0.6]);
  drawTriangle([-1.0, -0.4, -1.0, -0.6, -1.0, -0.6]);
  drawTriangle([-1.0, -0.6, -0.9, -0.7, -1.0, -0.8]);
  drawTriangle([-1.0, -0.6, -1.0, -0.8, -1.0, -0.8]);
  drawTriangle([-1.0, -0.8, -0.9, -0.9, -1.0, -1.0]);
  drawTriangle([-1.0, -0.8, -1.0, -1.0, -1.0, -1.0]);

  console.log("Picture drawn with triangles!");
}









