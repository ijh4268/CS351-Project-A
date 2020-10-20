//Project A Javascript
//WebGL functions located here

//Project Description
//


//Fragment shader program
var FSHADER_SOURCE = 
//  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
//  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';


//Vertex shader program
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

var ANGLE_STEP = 45.0;
var ANGLE_STEP_2 = 20.0;
var ANGLE_STEP_HAND = 80.0;
var ANGLE_STEP_ARM = 15.0;
var FORMER_ANGLE_STEP_ARM = 15.0;
var LENGTH_STEP = 0.5;
var ARM_MOVING = true;

var userStretch = 1.0;

// Global vars for mouse click-and-drag for rotation.
var isDrag = false;		// mouse-drag: true when user holds down mouse button
var xMclik = 0.0;			// last mouse button-down position (in CVV coords)
var yMclik = 0.0;
var xMdragTot = 0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot = 0.0;
var MOUSE_DRAG = false;
var translateArmX = 0.0;
var translateArmY = 0.0;
var translateArmStep = 0.5;

function main(){
	//Retrieve canvas element
	var canvas = document.getElementById("webgl");
	
	
	//Get the rendering context
	var gl = getWebGLContext(canvas);
	
	if(!gl)
	{
		console.log('Failed to get the rendering context for WebGL');
		return;
	}
	
	//Initialize shaders
	//Use initShaders
	//If failed, log
	if(!initShaders(gl,VSHADER_SOURCE, FSHADER_SOURCE))
	{
		console.log('Failed to initialize shaders.');
		return;
	}
	
	//Write the positions of vertices into an array, transfer
	//array contents to a Vertex Buffer Object created in the graphics hardware
	
	var n = initVertexBuffers(gl);
	var n2 = initVertexBuffers(gl);

  	if (n < 0) {
    	console.log('Failed to set the positions of the vertices');
    return;
	}	
		
  	canvas.onmousedown = function (ev) { myMouseDown(ev, gl, canvas) };

    // when user's mouse button goes down call mouseDown() function
  	canvas.onmousemove = function (ev) { myMouseMove(ev, gl, canvas) };

    // call mouseMove() function					
  	canvas.onmouseup = function (ev) { myMouseUp(ev, gl, canvas) };

  	window.addEventListener("keydown", myKeyDown, false);
  	window.addEventListener("keyup", myKeyUp, false);
  	//window.addEventListener("keyup", myKeyUp, false);

	//Specify the color for clearing <canvas>?
		gl.clearColor(0,0,0,1);
	
	//Enable 3D depth test
	gl.enable(gl.DEPTH_TEST);
		
	//Get storage location of u_modelMatrix
	var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  	if (!u_ModelMatrix) { 
    	console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  	}
	

  	var modelMatrix = new Matrix4();
  	var checkpointAngle = 0.0;
  	var taiFighterAngle = 0.0;
  	var armAngle = 0.0;
  	var handAngle = 0.0;
  	var wingAngle = 0.0;
  	var curLength = 1.0;

  	var tick = function () {
  	    var now = Date.now();

  	    checkpointAngle = animateCheckpoint(checkpointAngle, now);
  	    taiFighterAngle = animateTaiFighter(taiFighterAngle, now);
  	    wingAngle = animateTaiFighterWing(wingAngle, now);
  	    armAngle = animateArm(armAngle, now);
  	    handAngle = animateHand(handAngle, now);
  	    curLength = animateLength(curLength, now);

  	    g_last = now;
  	    console.log(checkpointAngle + " " + now);
  	    draw(gl, n, checkpointAngle, curLength, modelMatrix, u_ModelMatrix);
  	    drawTaiFighter(gl, n, taiFighterAngle, wingAngle, modelMatrix, u_ModelMatrix);
  	    drawArm(gl, n2, armAngle, handAngle, modelMatrix, u_ModelMatrix);
		requestAnimationFrame(tick, canvas); //Request the browser calls tick
	};
	
	tick();
 
}

function initVertexBuffers(gl)
{
    var colorShapes = new Float32Array([
        
		//Octagonal base
        //16*3
		/*
		//Bottom vertices
		1.0, 0.0, 0.5, 1.0,//NODE 0
		0.5, 0.0, 1.0, 1.0,// NODE 1
		-0.5, 0.0, 1.0, 1.0,// NODE 2
		-1.0, 0.0, 0.5, 1.0,// NODE 3
		-1.0, 0.0, -0.5, 1.0,// NODE 4
		-0.5, 0.0, -1.0, 1.0,// NODE 5
		0.5, 0.0, -1.0, 1.0,// NODE 6
		1.0, 0.0, -0.5, 1.0, // NODE 7
		
		//Top vertices
		1.0, 2.0, 0.5,1.0, //NODE 8
		0.5, 2.0, 1.0, 1.0,// NODE 9
		-0.5, 2.0, 1.0, 1.0,// NODE 10
		-1.0, 2.0, 0.5, 1.0,// NODE 11
		-1.0, 2.0, -0.5, 1.0,// NODE 12
		-0.5, 2.0, -1.0, 1.0,// NODE 13
		0.5, 2.0, -1.0, 1.0,// NODE 14
		1.0, 2.0, -0.5, 1.0, // NODE 15
		*/
		
		//RED		
		1.0, 0.0, 0.5, 1.0, 	0.35, 0.5, 1.0,//NODE 0
		0.5, 0.0, 1.0, 1.0, 	0.6, 0.0, 0.5,// NODE 1
		0.5, 2.0, 1.0, 1.0, 	1.0, 0.0, 0.0,// NODE 9
		
		0.5, 2.0, 1.0, 1.0,		1.0, 0.1, 0.1,// NODE 9
		1.0, 2.0, 0.5,1.0,		1.0, 0.1, 0.1, //NODE 8
		1.0, 0.0, 0.5, 1.0, 	1.0, 0.0, 1.0,//NODE 0
		
		0.5, 0.0, 1.0, 1.0,		1.0, 0.0, 0.0,// NODE 1
		-0.5, 0.0, 1.0, 1.0,	1.0, 0.0, 0.0,// NODE 2
		-0.5, 2.0, 1.0, 1.0,	1.0, 1.0, 0.0,// NODE 10
		
		-0.5, 2.0, 1.0, 1.0,	1.0, 1.0, 0.0,// NODE 10 
		0.5, 2.0, 1.0, 1.0,		1.0, 0.0, 1.0,// NODE 9
		0.5, 0.0, 1.0, 1.0,		1.0, 0.0, 0.0,// NODE 1

        //GREEN
		-0.5, 0.0, 1.0, 1.0,    0.4, 0.5, 0.5,// NODE 2
		-1.0, 0.0, 0.5, 1.0,    0.5, 0.5, 0.5,// NODE 3
		-1.0, 2.0, 0.5, 1.0,    0.1, 1.0, 0.5,// NODE 11

		-1.0, 2.0, 0.5, 1.0,    0.3, 1.0, 0.5,// NODE 11
		-0.5, 2.0, 1.0, 1.0,    0.1, 0.1, 0.5,// NODE 10
		-0.5, 0.0, 1.0, 1.0,    0.1, 1.0, 0.1,// NODE 2


		-1.0, 0.0, 0.5, 1.0,	0.0, 0.6, 0.0,// NODE 3
		-1.0, 0.0, -0.5, 1.0,	1.0, 0.3, 0.0,// NODE 4
		-1.0, 2.0, -0.5, 1.0,	1.0, 0.0, 0.3,// NODE 12
		
		-1.0, 2.0, -0.5, 1.0,	1.0, 0.0, 0.6,// NODE 12
		-1.0, 2.0, 0.5, 1.0,	1.0, 0.5, 0.0,// NODE 11
		-1.0, 0.0, 0.5, 1.0,	0.1, 0.0, 0.0,// NODE 3
		
        //BLUE
		-1.0, 0.0, -0.5, 1.0,   0.0, 0.5, 1.0,// NODE 4
		-0.5, 0.0, -1.0, 1.0,   0.2, 0.3, 1.0,// NODE 5
		-0.5, 2.0, -1.0, 1.0,   0.0, 0.75, 1.0,// NODE 13

		-0.5, 2.0, -1.0, 1.0,   0.1, 0.1, 1.0,// NODE 13
		-1.0, 2.0, -0.5, 1.0,   0.1, 0.1, 1.0,// NODE 12
		-1.0, 0.0, -0.5, 1.0,   0.1, 0.1, 1.0,// NODE 4

		-0.5, 0.0, -1.0, 1.0,	1.0, 0.2, 0.76,// NODE 5
		0.5, 0.0, -1.0, 1.0,	1.0, 0.0, 0.0,// NODE 6
		0.5, 2.0, -1.0, 1.0,	1.0, 0.0, 0.0,// NODE 14
		
		0.5, 2.0, -1.0, 1.0,	1.0, 0.0, 0.75,// NODE 14
		-0.5, 2.0, -1.0, 1.0,	1.0, 0.0, 0.4,// NODE 13
		-0.5, 0.0, -1.0, 1.0,	1.0, 0.0, 0.75,// NODE 5
			
		
		//CYAN
		0.5, 0.0, -1.0, 1.0,	0.0, 0.5, 1.0,// NODE 6
		1.0, 0.0, -0.5, 1.0, 	0.0, 1.0, 1.0,// NODE 7
		1.0, 2.0, -0.5, 1.0, 	0.0, 1.0, 1.0,// NODE 15
		
		1.0, 2.0, -0.5, 1.0, 	0.1, 1.0, 1.0,// NODE 15
		0.5, 2.0, -1.0, 1.0,	0.1, 0.5, 1.0,// NODE 14
		0.5, 0.0, -1.0, 1.0,	0.1, 0.5, 0.1,// NODE 6
	

        1.0, 0.0, -0.5, 1.0,    0.0, 0.0, 1.0,// NODE 7
		1.0, 0.0, 0.5, 1.0,     1.0, 0.0, 1.0,//NODE 0
        1.0, 2.0, 0.5, 1.0,    1.0, 0.1, 0.1, //NODE 8

        1.0, 2.0, 0.5, 1.0,    1.0, 0.1, 0.1, //NODE 8
        1.0, 2.0, -0.5, 1.0,    0.1, 1.0, 1.0,// NODE 15
        1.0, 0.0, -0.5, 1.0,    0.0, 1.0, 1.0,// NODE 7
		

        //Octagonal Pyramid
        //8*3
        /*
        1.0, 0.0, 0.5, 1.0,   0.0, 1.0, 1.0,//NODE 0
		0.5, 0.0, 1.0, 1.0,     0.0, 1.0, 1.0,// NODE 1
		-0.5, 0.0, 1.0, 1.0,    0.0, 1.0, 1.0,// NODE 2
		-1.0, 0.0, 0.5, 1.0,    0.0, 1.0, 1.0,// NODE 3
		-1.0, 0.0, -0.5, 1.0,   0.0, 1.0, 1.0,// NODE 4
		-0.5, 0.0, -1.0, 1.0,   0.0, 1.0, 1.0,// NODE 5
		0.5, 0.0, -1.0, 1.0,    0.0, 1.0, 1.0,// NODE 6
		1.0, 0.0, -0.5, 1.0,    0.0, 1.0, 1.0, // NODE 7
        0.0, 1.0, 0.0, 1.0,     0.0, 1.0, 1.0,//NODE 8
        */

        1.0, 0.0, 0.5, 1.0,     1.0, 0.5, 1.0,//NODE 0
        0.0, 1.0, 0.0, 1.0,     0.5, 1.0, 1.0,//NODE 8
        0.5, 0.0, 1.0, 1.0,     0.0, 0.2, 1.0,// NODE 1

        0.5, 0.0, 1.0, 1.0,     1.0, 1.0, 1.0,// NODE 1
        0.0, 1.0, 0.0, 1.0,     0.5, 1.0, 1.0,//NODE 8
        -0.5, 0.0, 1.0, 1.0,    0.0, 0.2, 1.0,// NODE 2

        -0.5, 0.0, 1.0, 1.0,    0.4, 0.6, 1.0,// NODE 2
        0.0, 1.0, 0.0, 1.0,     0.0, 0.8, 1.0,//NODE 8
		-1.0, 0.0, 0.5, 1.0,    0.35, 0.2, 1.0,// NODE 3

        -1.0, 0.0, 0.5, 1.0,    0.86, 0.53, 1.0,// NODE 3
        0.0, 1.0, 0.0, 1.0,     0.2, .64, 1.0,//NODE 8
		-1.0, 0.0, -0.5, 1.0,   0.36, 0.87, 1.0,// NODE 4

        -1.0, 0.0, -0.5, 1.0,   0.96, 0.78, 1.0,// NODE 4
        0.0, 1.0, 0.0, 1.0,     0.6, 0.54, 1.0,//NODE 8
		-0.5, 0.0, -1.0, 1.0,   0.0, 0.26, 1.0,// NODE 5
		
		-0.5, 0.0, -1.0, 1.0,   0.75, 1.0, 1.0,// NODE 5
        0.0, 1.0, 0.0, 1.0,     0.23, 0.85, 1.0,//NODE 8
		0.5, 0.0, -1.0, 1.0,    0.0, 1.0, 1.0,// NODE 6

        0.5, 0.0, -1.0, 1.0,    0.63, 0.50, 1.0,// NODE 6
        0.0, 1.0, 0.0, 1.0,     0.0, 1.0, 1.0,//NODE 8
		1.0, 0.0, -0.5, 1.0,    0.40, 0.8, 1.0, // NODE 7

        1.0, 0.0, -0.5, 1.0,    0.53, 0.8, 1.0, // NODE 7
        0.0, 1.0, 0.0, 1.0,     0.85, 0.3, 1.0,//NODE 8
        1.0, 0.0, 0.5, 1.0,     0.65, 0.53, 1.0,//NODE 0

		//Spinning star
        //16*3
		/*
        0.0, 0.0, 0.15, 1.0,    //NODE 0
        1.0, 0.0, 0.0, 1.0,     //NODE 1
        .25, .25, 0.0, 1.0,     //NODE 2
        .25, -.25, 0.0, 1.0,    //NODE 3
        0.0, -1.0, 0.0, 1.0,    //NODE 4
        -0.25, -0.25, 0.0, 1.0,  //NODE 5
        -1.0, 0.0, 0.0, 1.0,    //NODE 6
        -.25, .25, 0.0, 1.0,    //NODE 7
        0.0, 1.0, 0.0, 1.0,     //NODE 8
        0.0, 0.0, -0.15, 1.0,   //NODE 9
		*/


        0.0, 0.0, 0.15, 1.0,    1.0, 0.0, 1.0,//NODE 0
        1.0, 0.0, 0.0, 1.0,     0.0, 1.0, 1.0,//NODE 1
        .25, .25, 0.0, 1.0,     0.0, 1.0, 1.0,//NODE 2

        1.0, 0.0, 0.0, 1.0,     0.0, 1.0, 1.0,     //NODE 1
        0.0, 0.0, 0.15, 1.0,    1.0, 0.0, 1.0,//NODE 0
        .25, -.25, 0.0, 1.0,    0.0, 1.0, 1.0,//NODE 3

        .25, -.25, 0.0, 1.0,    0.0, 1.0, 1.0,//NODE 3
        0.0, 0.0, 0.15, 1.0,    1.0, 0.0, 1.0,//NODE 0
        0.0, -1.0, 0.0, 1.0,    0.0, 1.0, 1.0,//NODE 4

        0.0, -1.0, 0.0, 1.0,    0.0, 1.0, 1.0,//NODE 4
        -0.25, -0.25, 0.0, 1.0, 0.0, 1.0, 1.0,//NODE 5
        0.0, 0.0, 0.15, 1.0,    1.0, 0.0, 1.0,//NODE 0

        0.0, 0.0, 0.15, 1.0,    0.0, 1.0, 1.0,   //NODE 0
        -0.25, -0.25, 0.0, 1.0, 0.0, 1.0, 1.0, //NODE 5
        -1.0, 0.0, 0.0, 1.0,    0.0, 1.0, 1.0,//NODE 6

        -1.0, 0.0, 0.0, 1.0,    0.0, 1.0, 1.0, //NODE 6
        -.25, .25, 0.0, 1.0,    0.0, 1.0, 1.0,//NODE 7
         0.0, 0.0, 0.15, 1.0,   0.0, 1.0, 1.0,//NODE 0

        0.0, 0.0, 0.15, 1.0,    0.0, 1.0, 1.0,//NODE 0
        -.25, .25, 0.0, 1.0,    0.0, 1.0, 1.0,//NODE 7
        0.0, 1.0, 0.0, 1.0,     0.0, 1.0, 1.0,//NODE 8

        0.0, 1.0, 0.0, 1.0,     0.0, 1.0, 1.0,//NODE 8
        .25, .25, 0.0, 1.0,     0.0, 1.0, 1.0,//NODE 2
        0.0, 0.0, 0.15, 1.0,    0.0, 1.0, 1.0,//NODE 0

        0.0, 0.0, -0.15, 1.0,   0.0, 1.0, 1.0,//NODE 9
        1.0, 0.0, 0.0, 1.0,     0.0, 1.0, 1.0,//NODE 1
        .25, .25, 0.0, 1.0,     0.0, 1.0, 1.0,//NODE 2

        1.0, 0.0, 0.0, 1.0,     0.0, 1.0, 1.0,//NODE 1
        0.0, 0.0, -0.15, 1.0,   0.0, 1.0, 1.0,//NODE 9
        .25, -.25, 0.0, 1.0,    0.0, 1.0, 1.0,//NODE 3

        .25, -.25, 0.0, 1.0,    0.0, 1.0, 1.0,//NODE 3
        0.0, 0.0, -0.15, 1.0,   0.0, 1.0, 1.0,//NODE 9
        0.0, -1.0, 0.0, 1.0,    0.0, 1.0, 1.0,//NODE 4

        0.0, -1.0, 0.0, 1.0,    0.0, 1.0, 1.0,//NODE 4
        -0.25, -0.25, 0.0, 1.0, 0.0, 1.0, 1.0,//NODE 5
        0.0, 0.0, -0.15, 1.0,   0.0, 1.0, 1.0,//NODE 9

        0.0, 0.0, -0.15, 1.0,   0.0, 1.0, 1.0,//NODE 9
        -0.25, -0.25, 0.0, 1.0, 0.0, 1.0, 1.0,//NODE 5
        -1.0, 0.0, 0.0, 1.0,    0.0, 1.0, 1.0,//NODE 6

        -1.0, 0.0, 0.0, 1.0,    0.0, 1.0, 1.0,//NODE 6
        -.25, .25, 0.0, 1.0,    0.0, 1.0, 1.0,//NODE 7
        0.0, 0.0, -0.15, 1.0,   0.0, 1.0, 1.0,//NODE 9

         0.0, 0.0, -0.15, 1.0,  0.0, 1.0, 1.0,//NODE 9
         -.25, .25, 0.0, 1.0,   0.0, 1.0, 1.0,//NODE 7
        0.0, 1.0, 0.0, 1.0,     0.0, 1.0, 1.0,//NODE 8

        0.0, 1.0, 0.0, 1.0,     0.0, 1.0, 1.0,//NODE 8
        .25, .25, 0.0, 1.0,     0.0, 1.0, 1.0,//NODE 2
        0.0, 0.0, -0.15, 1.0,   0.0, 1.0, 1.0,//NODE 9

        /* 8*3
        1.0, 0.0, 0.5, 1.0,   0.0, 1.0, 1.0,//NODE 0
		0.5, 0.0, 1.0, 1.0,     0.0, 1.0, 1.0,// NODE 1
		-0.5, 0.0, 1.0, 1.0,    0.0, 1.0, 1.0,// NODE 2
		-1.0, 0.0, 0.5, 1.0,    0.0, 1.0, 1.0,// NODE 3
		-1.0, 0.0, -0.5, 1.0,   0.0, 1.0, 1.0,// NODE 4
		-0.5, 0.0, -1.0, 1.0,   0.0, 1.0, 1.0,// NODE 5
		0.5, 0.0, -1.0, 1.0,    0.0, 1.0, 1.0,// NODE 6
		1.0, 0.0, -0.5, 1.0,    0.0, 1.0, 1.0, // NODE 7
        0.0, 0.0, 0.0, 1.0,     0.0, 1.0, 1.0,//NODE 8
        */
        1.0, 0.0, 0.5, 1.0, 1.0, 0.0, 1.0,//NODE 0
        0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,//NODE 8
        0.5, 0.0, 1.0, 1.0, 0.4, 0.2, 1.0,// NODE 1

        0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0,// NODE 1
       0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,//NODE 8
        -0.5, 0.0, 1.0, 1.0, 0.36, 1.0, 1.0,// NODE 2

        -0.5, 0.0, 1.0, 1.0, 0.36, 1.0, 1.0,// NODE 2
        0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,//NODE 8
		-1.0, 0.0, 0.5, 1.0, 0.78, 1.0, 1.0,// NODE 3

        -1.0, 0.0, 0.5, 1.0, 0.65, 1.0, 1.0,// NODE 3
        0.0, 0.0, 0.0, 1.0, 0.89, 1.0, 1.0,//NODE 8
		-1.0, 0.0, -0.5, 1.0, 0.23, 1.0, 1.0,// NODE 4

        -1.0, 0.0, -0.5, 1.0, 0.87, 1.0, 1.0,// NODE 4
        0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,//NODE 8
		-0.5, 0.0, -1.0, 1.0, 0.54, 1.0, 1.0,// NODE 5

		-0.5, 0.0, -1.0, 1.0, 0.69, 1.0, 1.0,// NODE 5
        0.0, 0.0, 0.0, 1.0, 0.42, 1.0, 1.0,//NODE 8
		0.5, 0.0, -1.0, 1.0, 0.63, 1.0, 1.0,// NODE 6

        0.5, 0.0, -1.0, 1.0, 0.56, 1.0, 1.0,// NODE 6
        0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,//NODE 8
		1.0, 0.0, -0.5, 1.0, 0.74, 1.0, 1.0, // NODE 7

        1.0, 0.0, -0.5, 1.0, 0.5, 1.0, 1.0, // NODE 7
        0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,//NODE 8
        1.0, 0.0, 0.5, 1.0, 1.0, 0.0, 1.0,//NODE 0
		]);
	var n = 144;
	
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
	return n;
}

function draw(gl, n, currentAngle, curLength, modelMatrix, u_ModelMatrix) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    modelMatrix.setTranslate(-0.4, -0.4, 0.0);
    modelMatrix.scale(0.15, 0.15, 0.15);
    modelMatrix.translate(0.0, -2.0, 0.0);
    modelMatrix.rotate(currentAngle, 0, 1, 0);
    pushMatrix(modelMatrix); 
    modelMatrix.scale(1, curLength, 1);

    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    //Draw the Octagonal Base
    gl.drawArrays(gl.TRIANGLES, 0, 48);
    
    modelMatrix = popMatrix();
    //Draw the Octagonal Pyramid
    modelMatrix.translate(0.0, 2.0*curLength, 0.0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 48, 24);
    gl.drawArrays(gl.TRIANGLES, 120, 24);

    //Draw the star
    modelMatrix.translate(0.0, 2.0, 0.0);
    modelMatrix.rotate(-currentAngle, 1, 1, 1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 72, 48);

}

function drawTaiFighter(gl, n, currentAngle, wingAngle, modelMatrix, u_ModelMatrix) {
    
    modelMatrix.setTranslate(0.4, 0.4, 0.0);
    modelMatrix.scale(0.15, 0.15, 0.15);
    modelMatrix.translate(xMdragTot * 8, yMdragTot * 8, 0);
    modelMatrix.rotate(currentAngle, 1, 1, 0);

    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 72, 48);
    pushMatrix(modelMatrix);

    modelMatrix.translate(-2.0, 0.0, 0.0);
    modelMatrix.rotate(-90, 0, 0, 1);
    modelMatrix.rotate(wingAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 48, 24);
    gl.drawArrays(gl.TRIANGLES, 120, 24);

    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);

    modelMatrix.translate(2.0, 0.0, 0.0);
    modelMatrix.rotate(90, 0, 0, 1);
    modelMatrix.rotate(wingAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 48, 24);
    gl.drawArrays(gl.TRIANGLES, 120, 24);
}

function drawArm(gl, n, currentAngle,currentTopAngle, modelMatrix, u_ModelMatrix) {
    modelMatrix.setTranslate(0.4, -0.4, 0.0);
    modelMatrix.scale(0.1, 0.1, 0.1);
    
    modelMatrix.translate(translateArmX, translateArmY, 0.0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, 48);

    modelMatrix.scale(.75, .75, .75);
    modelMatrix.rotate(25, 1, 0, 1);
    modelMatrix.rotate(currentAngle, 1, 0, 1);
    modelMatrix.translate(0.0, -2.0, 0.0);
    
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, 48);

    
    
    modelMatrix.rotate(180, 0, 0, 1);
    modelMatrix.translate(0.0, 0.5, 0.0);
    modelMatrix.rotate(currentTopAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 48, 24);
}

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animateCheckpoint(angle, now) {
    //==============================================================================
    // Calculate the elapsed time
    
    var elapsed = now - g_last;
    
    
    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle %= 360;
}

function animateLength(curLength, now) {
    var elapsed = now - g_last;

    var newLength;

    if (curLength < userStretch && LENGTH_STEP > 0)
        newLength = curLength + (LENGTH_STEP * elapsed) / 1000.0;
    else if ((curLength >= userStretch && LENGTH_STEP > 0) || (curLength <= userStretch && LENGTH_STEP < 0))
        newLength = curLength;
    else if(LENGTH_STEP < 0)
        newLength = curLength + (LENGTH_STEP * elapsed) / 1000.0;

    return newLength;
}

function animateTaiFighter(angle, now) {
    //==============================================================================
    // Calculate the elapsed time

    var elapsed = now - g_last;


    var newAngle = angle + (20.0 * elapsed) / 1000.0;
    return newAngle %= 360;
}

function animateTaiFighterWing(angle, now) {
    //==============================================================================
    // Calculate the elapsed time

    var elapsed = now - g_last;


    var newAngle = angle + (ANGLE_STEP_2 * elapsed) / 1000.0;
    return newAngle %= 360;
}

function animateArm(angle, now) {
    var elapsed = now - g_last;

    // Update the current rotation angle (adjusted by the elapsed time)
    //  limit the angle to move smoothly between +20 and -85 degrees:
    if (angle > 20.0 && ANGLE_STEP_ARM > 0) ANGLE_STEP_ARM = -ANGLE_STEP_ARM;
    if (angle < -85.0 && ANGLE_STEP_ARM < 0) ANGLE_STEP_ARM = -ANGLE_STEP_ARM;
    if(ANGLE_STEP_ARM != 0)
        FORMER_ANGLE_STEP_ARM = ANGLE_STEP_ARM;
    var newAngle = angle + (ANGLE_STEP_ARM * elapsed) / 1000.0;
    return newAngle %= 360;
}

function animateHand(angle, now) {
    //==============================================================================
    // Calculate the elapsed time

    var elapsed = now - g_last;


    var newAngle = angle + (ANGLE_STEP_HAND * elapsed) / 1000.0;
    return newAngle %= 360;
}

function freezeCheckpoint()
{
    if (ANGLE_STEP == 0.0)
        ANGLE_STEP = 45.0;
    else
        ANGLE_STEP = 0.0;
}

function increaseTaiFighterSpin()
{
    ANGLE_STEP_2 += 10.0;
}

function decreaseTaiFighterSpin()
{
    if(ANGLE_STEP_2 > 0.0)
        ANGLE_STEP_2 -= 10.0;
}

function onSubmitStretch()
{
    var oldStretch = userStretch;

    userStretch = document.getElementById("usrStretch").value;
    console.log(userStretch);
    if(userStretch <= 0.5)
    {
        userStretch = 0.5;
    }
    if (userStretch >= 4.0) {
        userStretch = 4.0;
    }

    if (oldStretch > userStretch)
        LENGTH_STEP = -0.5;
    else
        LENGTH_STEP = 0.5;
}

function myMouseDown(ev, gl, canvas) {
    //==============================================================================
    // Called when user PRESSES down any mouse button;
    // 									(Which button?    console.log('ev.button='+ev.button);   )
    // 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
    //		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

    // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
    var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
    var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
    var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
    //  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);

    // Convert to Canonical View Volume (CVV) coordinates too:
    var x = (xp - canvas.width / 2) / 		// move origin to center of canvas and
                           (canvas.width / 2);			// normalize canvas to -1 <= x < +1,
    var y = (yp - canvas.height / 2) /		//										 -1 <= y < +1.
							 (canvas.height / 2);
    //	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);

    isDrag = true;											// set our mouse-dragging flag
    xMclik = x;													// record where mouse-dragging began
    yMclik = y;
}
function myMouseMove(ev, gl, canvas) {
    //==============================================================================
    // Called when user MOVES the mouse with a button already pressed down.
    // 									(Which button?   console.log('ev.button='+ev.button);    )
    // 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
    //		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

    if (isDrag == false) {
        
        return;
    }
    MOUSE_DRAG = true;
    // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
    var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
    var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
    var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge

    // Convert to Canonical View Volume (CVV) coordinates too:
    var x = (xp - canvas.width / 2) / 		// move origin to center of canvas and
                           (canvas.width / 2);			// normalize canvas to -1 <= x < +1,
    var y = (yp - canvas.height / 2) /		//										 -1 <= y < +1.
							 (canvas.height / 2);

    // find how far we dragged the mouse:
    xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
    yMdragTot += (y - yMclik);
    xMclik = x;													// Make next drag-measurement from here.
    yMclik = y;
}

function myMouseUp(ev, gl, canvas) {
    //==============================================================================
    // Called when user RELEASES mouse button pressed previously.
    // 									(Which button?   console.log('ev.button='+ev.button);    )
    // 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
    //		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

    // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
    var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
    var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
    var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge

    // Convert to Canonical View Volume (CVV) coordinates too:
    var x = (xp - canvas.width / 2) / 		// move origin to center of canvas and
                           (canvas.width / 2);			// normalize canvas to -1 <= x < +1,
    var y = (yp - canvas.height / 2) /		//										 -1 <= y < +1.
							 (canvas.height / 2);
    if (MOUSE_DRAG == false) {
        if (ARM_MOVING) {
            ANGLE_STEP_ARM = 0.0;
            ARM_MOVING = false;
        }
        else {
            ANGLE_STEP_ARM = FORMER_ANGLE_STEP_ARM;
            ARM_MOVING = true;
        }
    }
    isDrag = false;
    MOUSE_DRAG = false;// CLEAR our mouse-dragging flag, and
    // accumulate any final bit of mouse-dragging we did:
    xMdragTot += (x - xMclik);
    yMdragTot += (y - yMclik);
}

function myKeyDown(ev) {
    switch (ev.keyCode) {
        case 65://a
            translateArmX -= translateArmStep;
            break;
        case 87: //w
            translateArmY += translateArmStep;
            break;
        case 68://d
            translateArmX += translateArmStep;
            break;
        case 83://s
            translateArmY -= translateArmStep;
            break;
        default:
            console.log("This key doesn't do anything!");
            break;
    }
}

function myKeyUp(ev) {
    //===============================================================================
    // Called when user releases ANY key on the keyboard; captures scancodes well

    console.log('myKeyUp()--keyCode=' + ev.keyCode + ' released.');
}

