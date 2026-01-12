// DrawTriangle.js (c) 2012 matsuda
function main() {  
  // Retrieve <canvas> element
  var canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  var ctx = canvas.getContext('2d');

  // Draw a black background
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set color to black
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the entire canvas
}

// Function to handle draw button click
function handleDrawEvent() {
  // Clear the canvas
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set color to black
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the entire canvas

  // Read the values of the text boxes to create v1
  var x1 = parseFloat(document.getElementById('v1x').value);
  var y1 = parseFloat(document.getElementById('v1y').value);
  var v1 = new Vector3([x1, y1, 0]);

  // Call drawVector(v1, "red")
  drawVector(v1, "red");

  // Read the values of the text boxes to create v2
  var x2 = parseFloat(document.getElementById('v2x').value);
  var y2 = parseFloat(document.getElementById('v2y').value);
  var v2 = new Vector3([x2, y2, 0]);

  // Call drawVector(v2, "blue")
  drawVector(v2, "blue");
}

// Function to handle draw operation button click
function handleDrawOperationEvent() {
  // Clear the canvas
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set color to black
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the entire canvas

  // Read the values of the text boxes to create v1 and call drawVector(v1, "red")
  var x1 = parseFloat(document.getElementById('v1x').value);
  var y1 = parseFloat(document.getElementById('v1y').value);
  var v1 = new Vector3([x1, y1, 0]);
  drawVector(v1, "red");

  // Read the values of the text boxes to create v2 and call drawVector(v2, "blue")
  var x2 = parseFloat(document.getElementById('v2x').value);
  var y2 = parseFloat(document.getElementById('v2y').value);
  var v2 = new Vector3([x2, y2, 0]);
  drawVector(v2, "blue");

  // Read the value of the selector and call the respective Vector3 function
  var operation = document.getElementById('operation').value;
  var scalar = parseFloat(document.getElementById('scalar').value);

  // For add and sub operations, draw a green vector v3 = v1 + v2 or v3 = v1 - v2
  if (operation === 'add') {
    var v3 = new Vector3([x1, y1, 0]);
    v3.add(v2);
    drawVector(v3, "green");
  } else if (operation === 'sub') {
    var v3 = new Vector3([x1, y1, 0]);
    v3.sub(v2);
    drawVector(v3, "green");
  } 
  // For mul and div operations, draw two green vectors v3 = v1 * s and v4 = v2 * s
  else if (operation === 'mul') {
    var v3 = new Vector3([x1, y1, 0]);
    v3.mul(scalar);
    drawVector(v3, "green");

    var v4 = new Vector3([x2, y2, 0]);
    v4.mul(scalar);
    drawVector(v4, "green");
  } else if (operation === 'div') {
    var v3 = new Vector3([x1, y1, 0]);
    v3.div(scalar);
    drawVector(v3, "green");

    var v4 = new Vector3([x2, y2, 0]);
    v4.div(scalar);
    drawVector(v4, "green");
  }
  // For magnitude operation, print the magnitude results to the console
  else if (operation === 'magnitude') {
    var mag1 = v1.magnitude();
    var mag2 = v2.magnitude();
    console.log("Magnitude v1:", mag1);
    console.log("Magnitude v2:", mag2);
  }
  // For normalize operation, draw normalized v1 and v2 in green
  else if (operation === 'normalize') {
    var v3 = new Vector3([x1, y1, 0]);
    v3.normalize();
    drawVector(v3, "green");

    var v4 = new Vector3([x2, y2, 0]);
    v4.normalize();
    drawVector(v4, "green");
  }
  // For angleBetween operation, calculate and print the angle to the console
  else if (operation === 'angleBetween') {
    var angle = angleBetween(v1, v2);
    console.log("Angle between v1 and v2:", angle);
  }
  // For area operation, calculate and print the area of the triangle to the console
  else if (operation === 'area') {
    var area = areaTriangle(v1, v2);
    console.log("Area of the triangle:", area);
  }
}

// Function to draw a vector
function drawVector(v, color) {
  // Get the canvas and context
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');

  // Calculate the center of the canvas
  var centerX = canvas.width / 2;  // 200
  var centerY = canvas.height / 2; // 200

  // Scale the vector coordinates by 20
  var endX = centerX + v.elements[0] * 20;
  var endY = centerY - v.elements[1] * 20; // Subtract because canvas Y increases downward

  // Draw the vector as a line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY); // Start at center
  ctx.lineTo(endX, endY);       // Draw to the scaled endpoint
  ctx.stroke();
}

// Function to calculate angle between v1 and v2
function angleBetween(v1, v2) {
  // Use the dot product formula: dot(v1, v2) = ||v1|| * ||v2|| * cos(alpha)
  // Rearranging: alpha = acos(dot(v1, v2) / (||v1|| * ||v2||))
  var dotProduct = Vector3.dot(v1, v2);
  var mag1 = v1.magnitude();
  var mag2 = v2.magnitude();
  var cosAlpha = dotProduct / (mag1 * mag2);
  var alpha = Math.acos(cosAlpha);
  // Convert from radians to degrees
  var angleDegrees = alpha * 180 / Math.PI;
  return angleDegrees;
}

// Function to calculate area of triangle formed by v1 and v2
function areaTriangle(v1, v2) {
  // The magnitude of the cross product ||v1 x v2|| equals the area of the parallelogram
  // The area of the triangle is half of that
  var crossProduct = Vector3.cross(v1, v2);
  var parallelogramArea = crossProduct.magnitude();
  var triangleArea = parallelogramArea / 2;
  return triangleArea;
}