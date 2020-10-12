//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// MultiPoint.js (c) 2012 matsuda
// MultiPointJT.js  MODIFIED for EECS 351-1, Northwestern Univ. Jack Tumblin
//						(converted to 2D->4D; 3 verts --> 6 verts; draw as
//						gl.POINTS and as gl.LINE_LOOP, change color.
//
// Vertex shader program.  
//  Each instance computes all the on-screen attributes for just one VERTEX,
//  specifying that vertex so that it can be used as part of a drawing primitive
//  depicted in the CVV coord. system (+/-1, +/-1, +/-1) that fills our HTML5
//  'canvas' object.
// In this program, we get info for one vertex in our Vertex Buffer Object (VBO) 
// through the 'attribute' variable a_Position, and use it.
// 
//    ?What other vertex attributes can you set within a Vertex Shader? Color?
//    surface normal? texture coordinates?
//    ?How could you set each of these attributes separately for each vertex in//
//    our VBO?  Could you store them in the VBO? Use them in the Vertex Shader?
//
var VSHADER_SOURCE = [
  'attribute vec4 a_Position;',
  'attribute float a_PointSize;',
  'void main() {',
  '  gl_Position = a_Position;',
  '  gl_PointSize = a_PointSize;',
  '}'
].join('\n');

// Fragment shader program
//  Each instance computes all the on-screen attributes for just one PIXEL
var FSHADER_SOURCE = [
  'void main() {',
  '  gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);',
  '}'
].join('\n');

function main() {
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Write buffer full of vertices to the GPU, and make it available to shaders
  var n = initVertexBuffers(gl);	
  if (n < 0) {
    console.log('Failed to load vertices into the GPU');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0, 1);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw 6 points. see http://www.khronos.org/opengles/sdk/docs/man/xhtml/glDrawArrays.xml
 gl.drawArrays(gl.LINE_LOOP, 0, n); // gl.drawArrays(mode, first, count)
			//mode: sets drawing primitive to use. Other valid choices: 
			// gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
			// gl.TRIANGLES, gl.TRIANGLES_STRIP, gl.TRIANGLE_FAN
			// first: index of 1st element of array.
			// count; number of elements to read from the array.

  // That went well. Let's draw them again!
  //
  gl.drawArrays(gl.POINTS, 0, n); // gl.drawArrays(mode, first, count)
			//mode: sets drawing primitive to use. Other valid choices: 
			// gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
			// gl.TRIANGLES, gl.TRIANGLES_STRIP, gl.TRIANGLE_FAN
			// first: index of 1st element of array.
			// count; number of elements to read from the array.
}


function initVertexBuffers(gl) {
//==============================================================================
// first, create an array with all our vertex attribute values:
  var vertexData = new Float32Array([
     0.0,  0.5, 0.0, 1.0,  5.0,	// CAREFUL! I made these into 4D points/ vertices: x,y,z,w.
    -0.2,  0.0, 0.0, 1.0,	10.0, // new point!  (? What happens if I make w=0 instead of 1.0?)
    -0.5, -0.5, 0.0, 1.0, 15.0,  
     0.0, -0.2, 0.0, 1.0, 20.0, // new point!
     0.5, -0.5, 0.0, 1.0,	25.0, // 
     0.2,  0.0, 0.0, 1.0, 30.0, // new point!  (note we need a trailing comma here)
     
  ]);
  var numVertices = 6; // The number of vertices


  var sizes = new Float32Array([
    5.0, 10.0, 15.0, 20.0, 25.0, 30.0 // Point Sizes
  ]);

  // Then in the Graphics hardware, create a vertex buffer object (VBO)
  var vertexBuffer = gl.createBuffer();	// get it's 'handle'
  var sizeBuffer   = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // COPY data from our 'vertices' array into the vertex buffer object in GPU:
  gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

  var FSIZE = vertexData.BYTES_PER_ELEMENT;

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, FSIZE * 5, 0);
  // vertexAttributePointer(index, x,y,z,w size=4, type=FLOAT, 
  // NOT normalized, NO stride)

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  // Write point sizes to the buffer object and enable it
  gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.STATIC_DRAW);
  var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');

  gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, FSIZE * 5, FSIZE * 4);
  gl.enableVertexAttribArray(a_PointSize);

  return numVertices;
}
