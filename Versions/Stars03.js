//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// Chapter 5: ColoredTriangle.js (c) 2012 matsuda  AND
// Chapter 4: RotatingTriangle_withButtons.js (c) 2012 matsuda AND
// Chapter 2: ColoredPoints.js (c) 2012 matsuda
//
// merged and modified to become:
//
// ControlMulti.js for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin

//		--converted from 2D to 4D (x,y,z,w) vertices
//		--demonstrate how to keep & use MULTIPLE colored shapes 
//			in just one Vertex Buffer Object(VBO).
//		--demonstrate several different user I/O methods: 
//				--Webpage pushbuttons 
//				--Webpage edit-box text, and 'innerHTML' for text display
//				--Mouse click & drag within our WebGL-hosting 'canvas'
//				--Keyboard input: alphanumeric + 'special' keys (arrows, etc)
//
// Vertex shader program----------------------------------
var VSHADER_SOURCE = 
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE = 
//  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
//  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Global Variables
// =========================
// Use globals to avoid needlessly complex & tiresome function argument lists,
// and for user-adjustable controls.
// For example, the WebGL rendering context 'gl' gets used in almost every fcn;
// requiring 'gl' as an argument won't give us any added 'encapsulation'; make
// it global.  Later, if the # of global vars grows too large, we can put them 
// into one (or just a few) sensible global objects for better modularity.
//------------For WebGL-----------------------------------------------
var gl;           // webGL Rendering Context. Set in main(), used everywhere.
var g_canvas = document.getElementById('webgl');     
                  // our HTML-5 canvas object that uses 'gl' for drawing.
                  
// ----------For tetrahedron & its matrix---------------------------------
var g_vertsMax = 0;                 // number of vertices held in the VBO 
                                    // (global: replaces local 'n' variable)
var g_modelMatrix = new Matrix4();  // Construct 4x4 matrix; contents get sent
                                    // to the GPU/Shaders as a 'uniform' var.
var g_modelMatLoc;                  // that uniform's location in the GPU

//------------For Animation---------------------------------------------
var g_isRun = true;                 // run/stop for animation; used in tick().
var g_lastMS = Date.now();    			// Timestamp for most-recently-drawn image; 
                                    // in milliseconds; used by 'animate()' fcn 
                                    // (now called 'timerAll()' ) to find time
                                    // elapsed since last on-screen image.
var g_angle01 = 0;                  // initial rotation angle
var g_angle01Rate = 45.0;           // rotation speed, in degrees/second 

var g_angle02 = 0;
var g_angle02Rate = 20.0;

//------------For mouse click-and-drag: -------------------------------
var g_isDrag=false;		// mouse-drag: true when user holds down mouse button
var g_isDoubleClick=false; // double-click: 
var g_xMclik=0.0;			// last mouse button-down position (in CVV coords)
var g_yMclik=0.0;   
var g_xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var g_yMdragTot=0.0;

var g_xDblMdragTot=0.0; // total (accumulated) mouse-drag on double click 
var g_yDblMdragTot=0.0;

var g_translatePyrX  = 0.0;
var g_translatePyrY  = 0.0;
var g_translatePyrRate = 0.3;

function main() {
//==============================================================================
/*REPLACED THIS: 
// Retrieve <canvas> element:
 var canvas = document.getElementById('webgl'); 
//with global variable 'g_canvas' declared & set above.
*/
  
  // Get gl, the rendering context for WebGL, from our 'g_canvas' object
  gl = getWebGLContext(g_canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Initialize a Vertex Buffer in the graphics system to hold our vertices
  g_maxVerts = initVertexBuffer(gl);  
  if (g_maxVerts < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

	// Register the Keyboard & Mouse Event-handlers------------------------------
	// When users move, click or drag the mouse and when they press a key on the 
	// keyboard the operating system create a simple text-based 'event' message.
	// Your Javascript program can respond to 'events' if you:
	// a) tell JavaScript to 'listen' for each event that should trigger an
	//   action within your program: call the 'addEventListener()' function, and 
	// b) write your own 'event-handler' function for each of the user-triggered 
	//    actions; Javascript's 'event-listener' will call your 'event-handler'
	//		function each time it 'hears' the triggering event from users.
	//
  // KEYBOARD:
  // The 'keyDown' and 'keyUp' events respond to ALL keys on the keyboard,
  //      including shift,alt,ctrl,arrow, pgUp, pgDn,f1,f2...f12 etc. 
	window.addEventListener("keydown", myKeyDown, false);
	// After each 'keydown' event, call the 'myKeyDown()' function.  The 'false' 
	// arg (default) ensures myKeyDown() call in 'bubbling', not 'capture' stage)
	// ( https://www.w3schools.com/jsref/met_document_addeventlistener.asp )
	window.addEventListener("keyup", myKeyUp, false);
	// Called when user RELEASES the key.  Now rarely used...

	// MOUSE:
	// Create 'event listeners' for a few vital mouse events 
	// (others events are available too... google it!).  
	window.addEventListener("mousedown", myMouseDown); 
	// (After each 'mousedown' event, browser calls the myMouseDown() fcn.)
  window.addEventListener("mousemove", myMouseMove); 
	window.addEventListener("mouseup", myMouseUp);	
	window.addEventListener("click", myMouseClick);				
	window.addEventListener("dblclick", myMouseDblClick); 
	// Note that these 'event listeners' will respond to mouse click/drag 
	// ANYWHERE, as long as you begin in the browser window 'client area'.  
	// You can also make 'event listeners' that respond ONLY within an HTML-5 
	// element or division. For example, to 'listen' for 'mouse click' only
	// within the HTML-5 canvas where we draw our WebGL results, try:
	// g_canvasID.addEventListener("click", myCanvasClick);
  //
	// Wait wait wait -- these 'mouse listeners' just NAME the function called 
	// when the event occurs!   How do the functions get data about the event?
	//  ANSWER1:----- Look it up:
	//    All mouse-event handlers receive one unified 'mouse event' object:
	//	  https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
	//  ANSWER2:----- Investigate:
	// 		All Javascript functions have a built-in local variable/object named 
	//    'argument'.  It holds an array of all values (if any) found in within
	//	   the parintheses used in the function call.
  //     DETAILS:  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
	// END Keyboard & Mouse Event-Handlers---------------------------------------
	
  // Specify the color for clearing <canvas>
  gl.clearColor(0.3, 0.3, 0.3, 1.0);

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
	gl.depthFunc(gl.LESS);
	gl.enable(gl.DEPTH_TEST); 	  
	
  // Get handle to graphics system's storage location of u_ModelMatrix
  g_modelMatLoc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!g_modelMatLoc) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
/* REPLACED by global var 'g_ModelMatrix' (declared, constructed at top)
  // Create a local version of our model matrix in JavaScript 
  var modelMatrix = new Matrix4();
*/
/* REPLACED by global g_angle01 variable (declared at top)
  // Create, init current rotation angle value in JavaScript
  var currentAngle = 0.0;
*/

  // ANIMATION: create 'tick' variable whose value is this function:
  //----------------- 
  var tick = function() {
		animate();  // Update the rotation angle
		drawAll();   // Draw all parts
		drawHexagram(); // Draw Hexagram
		drawPyramid();

		//--------------------------------
    requestAnimationFrame(tick, g_canvas);   
    									// Request that the browser re-draw the webpage
    									// (causes webpage to endlessly re-draw itself)
  };
  tick();							// start (and continue) animation: draw current image
	
}

function initVertexBuffer() {
//==============================================================================
// NOTE!  'gl' is now a global variable -- no longer needed as fcn argument!
	
	var s60 = Math.sqrt(3.0)/2.0;      // == sin(60deg) == sqrt(2) / 2
	var c60 = 0.5;

	var s30 = 0.5;
	var c30 = Math.sqrt(3.0)/2.0;


  var colorShapes = new Float32Array([

		 //! ------------------------ Pyramid ------------------------

		 //* Bottom Face
		 0.0,  0.0,  0.0, 1.0,    0.0,  1.0,  0.0, // Node 0 GREEN
		 0.0,  0.0, -1.0, 1.0,    1.0,  0.0,  0.0, // Node 1 RED
		 1.0,  0.0, -1.0, 1.0,    0.0,  0.0,  1.0, // Node 2 BLUE
		 0.0,  0.0,  0.0, 1.0,    0.0,  1.0,  0.0, // Node 0 GREEN
		 1.0,  0.0, -1.0, 1.0,    0.0,  0.0,  1.0, // Node 2 BLUE
		 1.0,  0.0,  0.0, 1.0,    1.0,  0.0,  1.0, // Node 3 MAGENTA
		 //* Front Face
		 0.0,  0.0,  0.0, 1.0,    0.0,  1.0,  0.0, // Node 0 GREEN
		 1.0,  0.0,  0.0, 1.0,    1.0,  0.0,  1.0, // Node 3 MAGENTA
		 0.5,  1.0, -0.5, 1.0,    0.0,  1.0,  1.0, // Node 4 CYAN
		 //* Right Face
		 1.0,  0.0,  0.0, 1.0,    1.0,  0.0,  1.0, // Node 3 MAGENTA
		 1.0,  0.0, -1.0, 1.0,    0.0,  0.0,  1.0, // Node 2 BLUE
		 0.5,  1.0, -0.5, 1.0,    0.0,  1.0,  1.0, // Node 4 CYAN
		 //* Back Face
		 1.0,  0.0, -1.0, 1.0,    0.0,  0.0,  1.0, // Node 2 BLUE
		 0.0,  0.0, -1.0, 1.0,    1.0,  0.0,  0.0, // Node 1 RED
		 0.5,  1.0, -0.5, 1.0,    0.0,  1.0,  1.0, // Node 4 CYAN
		 //* Left Face
		 0.0,  0.0, -1.0, 1.0,    1.0,  0.0,  0.0, // Node 1 RED
		 0.0,  0.0,  0.0, 1.0,    0.0,  1.0,  0.0, // Node 0 GREEN
		 0.5,  1.0, -0.5, 1.0,    0.0,  1.0,  1.0, // Node 4 CYAN

		//! ------------------------ 3D Hexagram -----------------------

			/*
			Nodes:
			  * Triangle 1
				1.0,  0.0,  0.0 , 1.0,   0.4,  0.0,  0.8,  // Node  0 PURPLE
			 -c60,  s60,  0.0 , 1.0,   0.0,  1.0,  0.0,  // Node  1 GREEN
			 -c60, -s60,  0.0 , 1.0,   0.0,  1.0,  1.0,  // Node  2 CYAN
				* Triangle 2
			 -1.0,  0.0,  0.01, 1.0,   0.4,  0.0,  0.8,  // Node  3 PURPLE
				c60, -s60,  0.01, 1.0,   0.0,  1.0,  0.0,  // Node  4 GREEN
				c60,  s60,  0.01, 1.0,   0.0,  1.0,  1.0,  // Node  5 CYAN

			 * Triangle 1 (back)
				1.0,  0.0, -1.0 , 1.0,   0.4,  0.0,  0.8,  // Node  6 PURPLE
			 -c60,  s60, -1.0 , 1.0,   0.0,  1.0,  0.0,  // Node  7 GREEN
			 -c60, -s60, -1.0 , 1.0,   0.0,  1.0,  1.0,  // Node  8 CYAN
			 * Triangle 2 (back)
			 -1.0,  0.0, -1.01, 1.0,   0.4,  0.0,  0.8,  // Node  9 PURPLE
				c60, -s60, -1.01, 1.0,   0.0,  1.0,  0.0,  // Node 10 GREEN
				c60,  s60, -1.01, 1.0,   0.0,  1.0,  1.0,  // Node 11 CYAN
			*/
			//* Front Face
			  1.0,  0.0,  0.0 , 1.0,   0.4,  0.0,  0.8,  // Node  0 PURPLE
			 -c60,  s60,  0.0 , 1.0,   0.0,  1.0,  0.0,  // Node  1 GREEN
			 -c60, -s60,  0.0 , 1.0,   0.0,  1.0,  1.0,  // Node  2 CYAN

			 -1.0,  0.0,  0.01, 1.0,   0.4,  0.0,  0.8,  // Node  3 PURPLE
				c60, -s60,  0.01, 1.0,   0.0,  1.0,  0.0,  // Node  4 GREEN
				c60,  s60,  0.01, 1.0,   0.0,  1.0,  1.0,  // Node  5 CYAN
			//* Back Face
				1.0,  0.0, -1.01, 1.0,   0.4,  0.0,  0.8,  // Node  6 PURPLE
			 -c60,  s60, -1.01, 1.0,   0.0,  1.0,  0.0,  // Node  7 GREEN
			 -c60, -s60, -1.01, 1.0,   0.0,  1.0,  1.0,  // Node  8 CYAN

			 -1.0,  0.0, -1.0 , 1.0,   0.4,  0.0,  0.8,  // Node  9 PURPLE
				c60, -s60, -1.0 , 1.0,   0.0,  1.0,  0.0,  // Node 10 GREEN
				c60,  s60, -1.0 , 1.0,   0.0,  1.0,  1.0,  // Node 11 CYAN
			//* Sides
			//*----------------------------------------
			  1.0,  0.0,  0.0 , 1.0,   0.4,  0.0,  0.8,  // Node  0 PURPLE
				1.0,  0.0, -1.01, 1.0,   0.4,  0.0,  0.8,  // Node  6 PURPLE
			 -c60,  s60, -1.01, 1.0,   0.0,  1.0,  0.0,  // Node  7 GREEN

			 -c60,  s60,  0.0 , 1.0,   0.0,  1.0,  0.0,  // Node  1 GREEN
			 -c60,  s60, -1.01, 1.0,   0.0,  1.0,  0.0,  // Node  7 GREEN
				1.0,  0.0,  0.0 , 1.0,   0.4,  0.0,  0.8,  // Node  0 PURPLE
			//*----------------------------------------
			 -c60,  s60,  0.0 , 1.0,   0.0,  1.0,  0.0,  // Node  1 GREEN
			 -c60,  s60, -1.01, 1.0,   0.0,  1.0,  0.0,  // Node  7 GREEN
			 -c60, -s60, -1.01, 1.0,   0.0,  1.0,  1.0,  // Node  8 CYAN
			
			 -c60, -s60,  0.0 , 1.0,   0.0,  1.0,  1.0,  // Node  2 CYAN
			 -c60, -s60, -1.01, 1.0,   0.0,  1.0,  1.0,  // Node  8 CYAN
			 -c60,  s60,  0.0 , 1.0,   0.0,  1.0,  0.0,  // Node  1 GREEN
			//*----------------------------------------
			 -c60, -s60,  0.0 , 1.0,   0.0,  1.0,  1.0,  // Node  2 CYAN
			 -c60, -s60, -1.01, 1.0,   0.0,  1.0,  1.0,  // Node  8 CYAN
			  1.0,  0.0, -1.01, 1.0,   0.4,  0.0,  0.8,  // Node  6 PURPLE

				1.0,  0.0,  0.0 , 1.0,   0.4,  0.0,  0.8,  // Node  0 PURPLE
				1.0,  0.0, -1.01, 1.0,   0.4,  0.0,  0.8,  // Node  6 PURPLE
			 -c60, -s60,  0.0 , 1.0,   0.0,  1.0,  1.0,  // Node  2 CYAN
			//*----------------------------------------
			 -1.0,  0.0,  0.01, 1.0,   0.4,  0.0,  0.8,  // Node  3 PURPLE
			 -1.0,  0.0, -1.0 , 1.0,   0.4,  0.0,  0.8,  // Node  9 PURPLE
				c60, -s60, -1.0 , 1.0,   0.0,  1.0,  0.0,  // Node 10 GREEN

				c60, -s60,  0.01, 1.0,   0.0,  1.0,  0.0,  // Node  4 GREEN
				c60, -s60, -1.0 , 1.0,   0.0,  1.0,  0.0,  // Node 10 GREEN
			 -1.0,  0.0,  0.01, 1.0,   0.4,  0.0,  0.8,  // Node  3 PURPLE
			//*----------------------------------------
			 c60, -s60,  0.01, 1.0,   0.0,  1.0,  0.0,  // Node  4 GREEN
			 c60, -s60, -1.0 , 1.0,   0.0,  1.0,  0.0,  // Node 10 GREEN
			 c60,  s60, -1.0 , 1.0,   0.0,  1.0,  1.0,  // Node 11 CYAN

			 c60,  s60,  0.01, 1.0,   0.0,  1.0,  1.0,  // Node  5 CYAN
			 c60,  s60, -1.0 , 1.0,   0.0,  1.0,  1.0,  // Node 11 CYAN
			 c60, -s60,  0.01, 1.0,   0.0,  1.0,  0.0,  // Node  4 GREEN
			//*----------------------------------------
			 c60,  s60,  0.01, 1.0,   0.0,  1.0,  1.0,  // Node  5 CYAN
			 c60,  s60, -1.0 , 1.0,   0.0,  1.0,  1.0,  // Node 11 CYAN
			-1.0,  0.0, -1.0 , 1.0,   0.4,  0.0,  0.8,  // Node  9 PURPLE

			-1.0,  0.0,  0.01, 1.0,   0.4,  0.0,  0.8,  // Node  3 PURPLE
			-1.0,  0.0, -1.0 , 1.0,   0.4,  0.0,  0.8,  // Node  9 PURPLE
			 c60,  s60,  0.01, 1.0,   0.0,  1.0,  1.0,  // Node  5 CYAN	
			//*----------------------------------------

		//! --------------------- 3D Concave Hexagon ----------------------
		/*
			Nodes:
			* Front Facing Triangle
			-0.1,  0.1,  0.5,  1.0,    1.0,  0.0,  0.0,  // Node 0 RED
			 0.0, -0.1,  0.5,  1.0,    1.0,  1.0,  1.0,  // Node 1 WHITE
			 0.1,  0.1,  0.5,  1.0,    0.0,  0.0,  1.0,  // Node 2 BLUE
			* Back Facing Triangle
			-0.1,  0.1,  0.0,  1.0,    1.0,  0.0,  0.0,  // Node 3 RED
			 0.0, -0.1,  0.0,  1.0,    1.0,  1.0,  1.0,  // Node 4 WHITE
			 0.1,  0.1,  0.0,  1.0,    0.0,  0.0,  1.0,  // Node 5 BLUE
			* Points of Star
			 0.0,  1.0,  0.25, 1.0,    1.0,  0.0,  0.0,  // Node 6 RED
			-c30, -s30,  0.25, 1.0,    1.0,  1.0,  1.0,  // Node 7 WHITE
			 c30, -s30,  0.25, 1.0,    0.0,  0.0,  1.0,  // Node 8 BLUE 
		*/
		// * Front
			-0.1,  0.1,  0.5,  1.0,    1.0,  0.0,  0.0,  // Node 0 RED
			 0.0, -0.1,  0.5,  1.0,    1.0,  1.0,  1.0,  // Node 1 WHITE
			 0.1,  0.1,  0.5,  1.0,    0.0,  0.0,  1.0,  // Node 2 BLUE
		// * Back
			-0.1,  0.1,  0.0,  1.0,    1.0,  0.0,  0.0,  // Node 3 RED
			 0.0, -0.1,  0.0,  1.0,    1.0,  1.0,  1.0,  // Node 4 WHITE
			 0.1,  0.1,  0.0,  1.0,    0.0,  0.0,  1.0,  // Node 5 BLUE
		// ! ------------------- Top Point -------------------------
		// * Front Top Point Face
			-0.1,  0.1,  0.5,  1.0,    1.0,  0.0,  0.0,  // Node 0 RED
			 0.1,  0.1,  0.5,  1.0,    0.0,  0.0,  1.0,  // Node 2 BLUE
			 0.0,  1.0,  0.25, 1.0,    1.0,  0.0,  0.0,  // Node 6 RED
		// * Left Top Point Face
			-0.1,  0.1,  0.5,  1.0,    1.0,  0.0,  0.0,  // Node 0 RED
			-0.1,  0.1,  0.0,  1.0,    1.0,  0.0,  0.0,  // Node 3 RED
			 0.0,  1.0,  0.25, 1.0,    1.0,  0.0,  0.0,  // Node 6 RED
		// * Back Top Point Face
			-0.1,  0.1,  0.0,  1.0,    1.0,  0.0,  0.0,  // Node 3 RED
			 0.1,  0.1,  0.0,  1.0,    0.0,  0.0,  1.0,  // Node 5 BLUE
			 0.0,  1.0,  0.25, 1.0,    1.0,  0.0,  0.0,  // Node 6 RED
		// * Right Top Point Face
			 0.1,  0.1,  0.5,  1.0,    0.0,  0.0,  1.0,  // Node 2 BLUE
			 0.1,  0.1,  0.0,  1.0,    0.0,  0.0,  1.0,  // Node 5 BLUE
			 0.0,  1.0,  0.25, 1.0,    1.0,  0.0,  0.0,  // Node 6 RED
		// ! ------------------- Left Point -------------------------
		// * Front Left Point Face
			-0.1,  0.1,  0.5,  1.0,    1.0,  0.0,  0.0,  // Node 0 RED
			 0.0, -0.1,  0.5,  1.0,    1.0,  1.0,  1.0,  // Node 1 WHITE
			-c30, -s30,  0.25, 1.0,    1.0,  1.0,  1.0,  // Node 7 WHITE
		// * Left Left Point Face
			-0.1,  0.1,  0.5,  1.0,    1.0,  0.0,  0.0,  // Node 0 RED
			-0.1,  0.1,  0.0,  1.0,    1.0,  0.0,  0.0,  // Node 3 RED
			-c30, -s30,  0.25, 1.0,    1.0,  1.0,  1.0,  // Node 7 WHITE
		// * Back Left Point Face
			-0.1,  0.1,  0.0,  1.0,    1.0,  0.0,  0.0,  // Node 3 RED
			 0.0, -0.1,  0.0,  1.0,    1.0,  1.0,  1.0,  // Node 4 WHITE
			-c30, -s30,  0.25, 1.0,    1.0,  1.0,  1.0,  // Node 7 WHITE
		// * Right Left Point Face
			 0.0, -0.1,  0.5,  1.0,    1.0,  1.0,  1.0,  // Node 1 WHITE
			 0.0, -0.1,  0.0,  1.0,    1.0,  1.0,  1.0,  // Node 4 WHITE
			-c30, -s30,  0.25, 1.0,    1.0,  1.0,  1.0,  // Node 7 WHITE
		// ! -------------------- Right Point ------------------------
		// * Front Right Point Face 
			0.0, -0.1,  0.5,  1.0,    1.0,  1.0,  1.0,  // Node 1 WHITE
			0.1,  0.1,  0.5,  1.0,    0.0,  0.0,  1.0,  // Node 2 BLUE
			c30, -s30,  0.25, 1.0,    0.0,  0.0,  1.0,  // Node 8 BLUE
		// * Left Right Point Face
			0.0, -0.1,  0.5,  1.0,    1.0,  1.0,  1.0,  // Node 1 WHITE
			0.0, -0.1,  0.0,  1.0,    1.0,  1.0,  1.0,  // Node 4 WHITE
			c30, -s30,  0.25, 1.0,    0.0,  0.0,  1.0,  // Node 8 BLUE
		// * Back Right Point Face
			0.0, -0.1,  0.0,  1.0,    1.0,  1.0,  1.0,  // Node 4 WHITE
			0.1,  0.1,  0.0,  1.0,    0.0,  0.0,  1.0,  // Node 5 BLUE
			c30, -s30,  0.25, 1.0,    0.0,  0.0,  1.0,  // Node 8 BLUE
		// * Right Right Point Face
			0.1,  0.1,  0.5,  1.0,    0.0,  0.0,  1.0,  // Node 2 BLUE
			0.1,  0.1,  0.0,  1.0,    0.0,  0.0,  1.0,  // Node 5 BLUE
			c30, -s30,  0.25, 1.0,    0.0,  0.0,  1.0,  // Node 8 BLUE 
			]);
	g_vertsMax = colorShapes.length / 7;		// 12 tetrahedron vertices.
																					// 18 Pyramid vertices
  								// we can also draw any subset of these we wish,
  								// such as the last 3 vertices.(onscreen at upper right)
	
  // Create a buffer object
  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  // (Use sparingly--may be slow if you transfer large shapes stored in files)
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?
    
  //Get graphics system's handle for our Vertex Shader's position-input variable: 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Use handle to specify how to retrieve position data from our VBO:
  gl.vertexAttribPointer(
  		a_Position, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * 7, 		// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  		0);						// Offset -- now many bytes from START of buffer to the
  									// value we will actually use?
  gl.enableVertexAttribArray(a_Position);  
  									// Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // Use handle to specify how to retrieve color data from our VBO:
  gl.vertexAttribPointer(
  	a_Color, 				// choose Vertex Shader attribute to fill with data
  	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
  	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
  	false, 					// did we supply fixed-point data AND it needs normalizing?
  	FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
  									// value we will actually use?  Need to skip over x,y,z,w
  									
  gl.enableVertexAttribArray(a_Color);  
  									// Enable assignment of vertex buffer object's position data

	//--------------------------------DONE!
  // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

/* REMOVED -- global 'g_vertsMax' means we don't need it anymore
  return nn;
*/
}

function drawPyramid() {

		g_modelMatrix.setTranslate(-0.5, 0.2, 0); // Discard old matrix;
		g_modelMatrix.scale(0.5, 0.5, 0.5);

		
		g_modelMatrix.translate(g_translatePyrX, g_translatePyrY, 0.0); 
		
		g_modelMatrix.rotate(g_angle01, 1, 0, 1);
		g_modelMatrix.rotate(g_angle02, 0, 1, 0);

		g_modelMatrix.translate(-0.5, 0.0, 0.5);
		pushMatrix(g_modelMatrix);

		gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements); // Send matrix data to the GPU
		gl.drawArrays(gl.TRIANGLES, 0 /* Start index */, 18 /* Num vertices to draw */);

	g_modelMatrix = popMatrix();

	g_modelMatrix.translate(0.5, 1.1, -0.6);
		g_modelMatrix.scale(0.5, 0.5, 0.5);
		g_modelMatrix.rotate(g_angle01, 1, 0, 0);
		gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
		gl.drawArrays(gl.TRIANGLES, 66 /* Start index */, 42 /* Num vertices to draw */); // draw Concave Hex
}

function drawHexagram() {
	g_modelMatrix.setTranslate(0.5, -0.5, 0);
	g_modelMatrix.scale(0.2, 0.2, 0.2);

	g_modelMatrix.translate(g_xDblMdragTot * 8, g_yDblMdragTot * 8, 0);

	var dist = Math.sqrt(g_xMdragTot*g_xMdragTot + g_yMdragTot*g_yMdragTot);
	g_modelMatrix.rotate(dist*120.0, -g_yMdragTot+0.0001, g_xMdragTot+0.0001, 0.0);

	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements); // Send matrix to GPU
	gl.drawArrays(gl.TRIANGLES, 18 /* Start index */, 48 /* Num vertices to draw */);
}

function drawConcaveHex() {
	gl.drawArrays(gl.TRIANGLES, 66 /* Start index */, 42 /* Num vertices to draw */);
}

function drawAll() {
//==============================================================================
  // Clear <canvas>  colors AND the depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	clrColr = new Float32Array(4);
	clrColr = gl.getParameter(gl.COLOR_CLEAR_VALUE);
	// console.log("clear value:", clrColr);

	

	// g_modelMatrix.setTranslate(0.0, -0.3, 0);
	// g_modelMatrix.scale(0.5, 0.5, 0.5);
	// gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);


}


// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate() {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
	g_last = now;
	
	var g_angle01min = -60.0;
	var g_angle01max =  60.0;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +120 and -120 degrees:
  if(g_angle01 >  g_angle01max && g_angle01Rate > 0) g_angle01Rate = -g_angle01Rate;
	if(g_angle01 <  g_angle01min && g_angle01Rate < 0) g_angle01Rate = -g_angle01Rate;
	
	g_angle01 = (g_angle01 + (g_angle01Rate * elapsed) / 1000.0) % 360;
	g_angle02 = (g_angle02 + (g_angle02Rate * elapsed) / 1000.0) % 360;
}

//==================HTML Button Callbacks======================

function angleSubmit() {
// Called when user presses 'Submit' button on our webpage
//		HOW? Look in HTML file (e.g. ControlMulti.html) to find
//	the HTML 'input' element with id='usrAngle'.  Within that
//	element you'll find a 'button' element that calls this fcn.

// Read HTML edit-box contents:
	var UsrTxt = document.getElementById('usrAngle').value;	
// Display what we read from the edit-box: use it to fill up
// the HTML 'div' element with id='editBoxOut':
  console.log('angleSubmit: UsrTxt:', UsrTxt); // print in console, and
  g_angle01 = parseFloat(UsrTxt);     // convert string to float number 
};

function clearDrag() {
// Called when user presses 'Clear' button in our webpage
	g_xMdragTot = 0.0;
	g_yMdragTot = 0.0;
}

function spinUp() {
// Called when user presses the 'Spin >>' button on our webpage.
// ?HOW? Look in the HTML file (e.g. ControlMulti.html) to find
// the HTML 'button' element with onclick='spinUp()'.
  g_angle02Rate += 25; 
}

function spinDown() {
// Called when user presses the 'Spin <<' button
 g_angle02Rate -= 25; 
}

function runStop() {
// Called when user presses the 'Run/Stop' button
  if(g_angle01Rate*g_angle01Rate > 1) {  // if nonzero rate,
    myTmp = g_angle01Rate;  // store the current rate,
    g_angle01Rate = 0;      // and set to zero.
  }
  else {    // but if rate is zero,
  	g_angle01Rate = myTmp;  // use the stored rate.
  }
}

//===================Mouse and Keyboard event-handling Callbacks

function myMouseDown(ev) {
	if(g_isDoubleClick) return;
	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
		var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
		var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
		var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
	//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
		
		// Convert to Canonical View Volume (CVV) coordinates too:
		var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
								 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
		var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
								 (g_canvas.height/2);
	//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
		
		g_isDrag = true;											// set our mouse-dragging flag
		g_xMclik = x;													// record where mouse-dragging began
		g_yMclik = y;
	console.log("myMouseClick() on button: ", ev.button); 
	// report on webpage
};


function myMouseMove(ev) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(!g_isDrag && !g_isDoubleClick) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

	// find how far we dragged the mouse:
	
	if(g_isDoubleClick) {
		g_xDblMdragTot += (x - g_xMclik);
		g_yDblMdragTot += (y - g_yMclik);
	} else {
		g_xMdragTot += (x - g_xMclik);					// Accumulate change-in-mouse-position,&
		g_yMdragTot += (y - g_yMclik);
	}
	// Report new mouse position & how far we moved on webpage

	g_xMclik = x;													// Make next drag-measurement from here.
	g_yMclik = y;
};

function myMouseUp(ev) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
	
	g_isDrag = false;				
	g_isDoubleClick = false;							// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:

	if(g_isDoubleClick) {
		g_xDblMdragTot += (x - g_xMclik);
		g_yDblMdragTot += (y - g_yMclik);
	} else {
		g_xMdragTot += (x - g_xMclik);
		g_yMdragTot += (y - g_yMclik);
	}
	// Report new mouse position:
	console.log('myMouseUp: g_xMdragTot,g_yMdragTot =',g_xMdragTot,',\t',g_yMdragTot);
};

function myMouseClick(ev) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
	
}	

function myMouseDblClick(ev) {
//=============================================================================
// Called when user completes a mouse-button double-click event 
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
	//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
	//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	g_isDoubleClick = true;	
	g_isDrag = false;										// set our mouse-dragging flag
	g_xMclik = x;													// record where mouse-dragging began
	g_yMclik = y;
	// report on webpage
	console.log("myMouse-DOUBLE-Click() on button: ", ev.button); 
}	

function myKeyDown(kev) {
//===============================================================================
// Called when user presses down ANY key on the keyboard;
//
// For a light, easy explanation of keyboard events in JavaScript,
// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
// For a thorough explanation of a mess of JavaScript keyboard event handling,
// see:    http://javascript.info/tutorial/keyboard-events
//
// NOTE: Mozilla deprecated the 'keypress' event entirely, and in the
//        'keydown' event deprecated several read-only properties I used
//        previously, including kev.charCode, kev.keyCode. 
//        Revised 2/2019:  use kev.key and kev.code instead.
//
// Report EVERYTHING in console:
  console.log(  "--kev.code:",    kev.code,   "\t\t--kev.key:",     kev.key, 
              "\n--kev.ctrlKey:", kev.ctrlKey,  "\t--kev.shiftKey:",kev.shiftKey,
              "\n--kev.altKey:",  kev.altKey,   "\t--kev.metaKey:", kev.metaKey);

	switch(kev.code) {
		case "KeyP":
			console.log("Pause/unPause!\n");                // print on console,
			if(g_isRun==true) {
			  g_isRun = false;    // STOP animation
			  }
			else {
			  g_isRun = true;     // RESTART animation
			  tick();
			  }
			break;
		//------------------WASD navigation-----------------
		case "KeyA":
			g_translatePyrX -= g_translatePyrRate;
			break;
    case "KeyD":
			g_translatePyrX += g_translatePyrRate;
			break;
		case "KeyS":
			g_translatePyrY -= g_translatePyrRate;
			break;
		case "KeyW":
			g_translatePyrY += g_translatePyrRate;
			break;
	}
}

function myKeyUp(kev) {
//===============================================================================
// Called when user releases ANY key on the keyboard; captures scancodes well

	console.log('myKeyUp()--keyCode='+kev.keyCode+' released.');
}
