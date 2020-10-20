// JavaScript source code


// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +

  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +

  'uniform vec3 u_LightColor;\n' +
  'uniform vec3 u_LightDirection;\n' +
  'uniform vec3 u_AmbientLight;\n' +
  'varying vec4 v_Color;\n' +

  'uniform mat4 u_ProjMatrix;\n' +

  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * a_Position;\n' +
  '  vec3 lightDirection = normalize(vec3(0.0,1.0,0.0));\n' +
  '  vec3 normal = normalize(vec3(u_NormalMatrix*a_Normal));\n' +
  '  float nDotL = max(dot(u_LightDirection, normal), 0.0);\n' +
  '  vec3 diffuse = u_LightColor * vec3(a_Color) * nDotL;\n' +
  '  vec3 ambient = u_AmbientLight * a_Color.rgb;\n' +
  '  v_Color = vec4(diffuse + ambient, a_Color.a);\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

var floatsPerVertex = 9;  // # of Float32Array elements used for each vertex

//Rotation steps
var ANGLE_STEP = 45.0;
var ANGLE_STAR_STEP = 25.0;
var SABER_ANGLE_STEP = 50.0;

//Translation and scale steps
var FLEET_MOVE_STEP = 2.0;
var FLEET_MOVE_STEPX = Math.cos(3.0);
var FLEET_MOVE_STEPY = Math.sin(3.0);
var LENGTH_STEP = 0.5;
var SABER_LENGTH_STEP = 0.75;

var saberStretch = 1.0;
var userStretch = 1.0;
var fleetMoving = false;

var g_last = 0.0;

var r = 1;
var g = 1;
var b = 1;
var g_EyeX = 0, g_EyeY = 6, g_EyeZ = 3.00;

var g_AtX = 0.0, g_AtY = 0.0, g_AtZ = 0.0;


var theta = 0;

var flag = -1;

var translateFleetX = 0.0;
var translateFleetY = 0.0;
var translateFleetZ = 0.0;


function main() {
    //==============================================================================
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');
    canvas.width = innerWidth;
    canvas.height = innerWidth * 0.75 / 2;
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

    // NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
    // unless the new Z value is closer to the eye than the old one..
    //  gl.depthFunc(gl.LESS);       // WebGL default setting:
    gl.enable(gl.DEPTH_TEST);

    // Set the vertex coordinates and color (the blue triangle is in the front)
    var n = initVertexBuffers(gl);

    if (n < 0) {
        console.log('Failed to specify the vertex information');
        return;
    }

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1);

    // Get the graphics system storage locations of
    // the uniform variables u_ViewMatrix and u_ProjMatrix.
    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
    var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');

    // set the light color
    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);
    var lightDirection = new Vector3([-0.5, 0, 1]);
    lightDirection.normalize();
    gl.uniform3fv(u_LightDirection, lightDirection.elements);


    if (!u_ViewMatrix || !u_ProjMatrix) {
        console.log('Failed to get u_ViewMatrix or u_ProjMatrix');
        return;
    }


    // Create a JavaScript matrix to specify the view transformation
    var viewMatrix = new Matrix4();
    var projMatrix = new Matrix4();
    var normalMatrix = new Matrix4();

    


    window.addEventListener("keydown", myKeyDown, false);
    window.addEventListener("keyup", myKeyUp, false);
    window.addEventListener("keypress", myKeyPress, false);

    
    var starAngle = 0.0;
    var saberAngle = 0.0;
    var sithFlipAngle = 0.0;

    var curLength = 1.0;
    var saberLength = 1.0;

    var tick = function () {
        canvas.width = innerWidth;
        canvas.height = innerWidth * 0.75 / 2;
        initVertexBuffers(gl);
        var now = Date.now();
        starAngle = animateStar(starAngle, now);
        curLength = animateLength(curLength, now);
        saberAngle = animateSaber(saberAngle, now);
        saberLength = animateSaberLength(saberLength, now);
        animateFleet(now);
        animateSithMove(now);
        animateSithArm(now);
        g_last = now;

        draw(gl, starAngle, u_ViewMatrix, viewMatrix, u_ProjMatrix, projMatrix, canvas, u_NormalMatrix, normalMatrix,
            curLength, saberAngle, saberLength);   // Draw the triangles
        requestAnimationFrame(tick, canvas);
        // Request that the browser re-draw the webpage
    };
    tick();
}

    function makeGroundGrid() {
        //==============================================================================
        // Create a list of vertices that create a large grid of lines in the x,y plane
        // centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

        var xcount = 100;     // # of lines to draw in x,y to make the grid.
        var ycount = 100;
        var xymax = 100.0;     // grid size; extends to cover +/-xymax in x and y.
        var xColr = new Float32Array([r, g, 0]);  // bright yellow
        var yColr = new Float32Array([0, g, 0]);  // bright green.

        // Create an (global) array to hold this ground-plane's vertices:
        gndVerts = new Float32Array(floatsPerVertex * 2 * (xcount + ycount));
        // draw a grid made of xcount+ycount lines; 2 vertices per line.

        var xgap = xymax / (xcount - 1);    // HALF-spacing between lines in x,y;
        var ygap = xymax / (ycount - 1);    // (why half? because v==(0line number/2))

        // First, step thru x values as we make vertical lines of constant-x:
        for (v = 0, j = 0; v < 2 * xcount; v++, j += floatsPerVertex) {
            if (v % 2 == 0) {  // put even-numbered vertices at (xnow, -xymax, 0)
                gndVerts[j] = -xymax + (v) * xgap;  // x
                gndVerts[j + 1] = -xymax;               // y
                gndVerts[j + 2] = 0.0;                  // z
            }
            else {        // put odd-numbered vertices at (xnow, +xymax, 0).
                gndVerts[j] = -xymax + (v - 1) * xgap;  // x
                gndVerts[j + 1] = xymax;                // y
                gndVerts[j + 2] = 0.0;                  // z
            }
            gndVerts[j + 3] = xColr[0];     // red
            gndVerts[j + 4] = xColr[1];     // grn
            gndVerts[j + 5] = xColr[2];     // blu

            gndVerts[j + 6] = 0;     
            gndVerts[j + 7] = 0;     
            gndVerts[j + 8] = 1;     
        }
        // Second, step thru y values as wqe make horizontal lines of constant-y:
        // (don't re-initialize j--we're adding more vertices to the array)
        for (v = 0; v < 2 * ycount; v++, j += floatsPerVertex) {
            if (v % 2 == 0) {    // put even-numbered vertices at (-xymax, ynow, 0)
                gndVerts[j] = -xymax;               // x
                gndVerts[j + 1] = -xymax + (v) * ygap;  // y
                gndVerts[j + 2] = 0.0;                  // z
            }
            else {          // put odd-numbered vertices at (+xymax, ynow, 0).
                gndVerts[j] = xymax;                // x
                gndVerts[j + 1] = -xymax + (v - 1) * ygap;  // y
                gndVerts[j + 2] = 0.0;                  // z
            }
            gndVerts[j + 3] = yColr[0];     // red
            gndVerts[j + 4] = yColr[1];     // grn
            gndVerts[j + 5] = yColr[2];     // blu

            gndVerts[j + 6] = 0;     
            gndVerts[j + 7] = 0;     
            gndVerts[j + 8] = 1;     
        }
    }

    function makeSphere() {
        //==============================================================================
        // Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
        // equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
        // and connect them as a 'stepped spiral' design (see makeCylinder) to build the
        // sphere from one triangle strip.
        var slices = 32;		// # of slices of the sphere along the z axis. >=3 req'd
        // (choose odd # or prime# to avoid accidental symmetry)
        var sliceVerts = 41;	// # of vertices around the top edge of the slice
        // (same number of vertices on bottom of slice, too)
        var topColr = new Float32Array([0.5, 0.5, 0.5]);	// North Pole:
        var equColr = new Float32Array([.3, .3, .3]);	// Equator:    
        var botColr = new Float32Array([1, 1, 1]);	// South Pole: 
        var sliceAngle = Math.PI / slices;	// lattitude angle spanned by one slice.

        // Create a (global) array to hold this sphere's vertices:
        sphVerts = new Float32Array(((slices * 2 * sliceVerts) - 2) * floatsPerVertex);
        // # of vertices * # of elements needed to store them. 
        // each slice requires 2*sliceVerts vertices except 1st and
        // last ones, which require only 2*sliceVerts-1.

        // Create dome-shaped top slice of sphere at z=+1
        // s counts slices; v counts vertices; 
        // j counts array elements (vertices * elements per vertex)
        var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
        var sin0 = 0.0;
        var cos1 = 0.0;
        var sin1 = 0.0;
        var j = 0;							// initialize our array index
        var isLast = 0;
        var isFirst = 1;
        for (s = 0; s < slices; s++) {	// for each slice of the sphere,
            // find sines & cosines for top and bottom of this slice
            if (s == 0) {
                isFirst = 1;	// skip 1st vertex of 1st slice.
                cos0 = 1.0; 	// initialize: start at north pole.
                sin0 = 0.0;
            }
            else {					// otherwise, new top edge == old bottom edge
                isFirst = 0;
                cos0 = cos1;
                sin0 = sin1;
            }								// & compute sine,cosine for new bottom edge.
            cos1 = Math.cos((s + 1) * sliceAngle);
            sin1 = Math.sin((s + 1) * sliceAngle);
            // go around the entire slice, generating TRIANGLE_STRIP verts
            // (Note we don't initialize j; grows with each new attrib,vertex, and slice)
            if (s == slices - 1) isLast = 1;	// skip last vertex of last slice.
            for (v = isFirst; v < 2 * sliceVerts - isLast; v++, j += floatsPerVertex) {
                if (v % 2 == 0) {				// put even# vertices at the the slice's top edge
                    // (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
                    // and thus we can simplify cos(2*PI(v/2*sliceVerts))  
                    sphVerts[j] = sin0 * Math.cos(Math.PI * (v) / sliceVerts);
                    sphVerts[j + 1] = sin0 * Math.sin(Math.PI * (v) / sliceVerts);
                    sphVerts[j + 2] = cos0;
                    //sphVerts[j + 3] = 1.0;
                }
                else { 	// put odd# vertices around the slice's lower edge;
                    // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
                    // 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
                    sphVerts[j] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts);		// x
                    sphVerts[j + 1] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts);		// y
                    sphVerts[j + 2] = cos1;																				// z
                    //sphVerts[j + 3] = 1.0;																				// w.		
                }
                if (s == 0) {	// finally, set some interesting colors for vertices:
                    sphVerts[j + 3] = topColr[0];
                    sphVerts[j + 4] = topColr[1];
                    sphVerts[j + 5] = topColr[2];

                    sphVerts[j + 6] = 0;
                    sphVerts[j + 7] = 0;
                    sphVerts[j + 8] = -1;
                }
                else if (s == slices - 1) {
                    sphVerts[j + 3] = botColr[0];
                    sphVerts[j + 4] = botColr[1];
                    sphVerts[j + 5] = botColr[2];

                    sphVerts[j + 6] = 0;
                    sphVerts[j + 7] = 0;
                    sphVerts[j + 8] = 1;
                }
                else {
                    var num = Math.random();
                    sphVerts[j + 3] = equColr[0]; 
                    sphVerts[j + 4] = equColr[1]; 
                    sphVerts[j + 5] = equColr[2];
                    sphVerts[j + 6] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts);
                    sphVerts[j + 7] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts);
                    sphVerts[j + 8] = cos1;
                }

            }
        }
    }

    function makeCylinder() {
        //==============================================================================
        // Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
        // 'stepped spiral' design described in notes.
        // Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
        //
        var ctrColr = new Float32Array([0.8, 0.2, 0.5]);	// dark gray
        var topColr = new Float32Array([0.545, 0.2705, 0.0745]);	
        var botColr = new Float32Array([0.5, 0.7, 0.7]);	// light blue
        var capVerts = 16;	// # of vertices around the topmost 'cap' of the shape
        var botRadius = 1.0;		// radius of bottom of cylinder (top always 1.0)

        // Create a (global) array to hold this cylinder's vertices;
        cylVerts = new Float32Array(((capVerts * 6) - 2) * floatsPerVertex);
        // # of vertices * # of elements needed to store them. 

        // Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
        // v counts vertices: j counts array elements (vertices * elements per vertex)
        for (v = 1, j = 0; v < 2 * capVerts; v++, j += floatsPerVertex) {
            // skip the first vertex--not needed.
            if (v % 2 == 0) {				// put even# vertices at center of cylinder's top cap:
                cylVerts[j] = 0.0; 			// x,y,z,w == 0,0,1,1
                cylVerts[j + 1] = 0.0;
                cylVerts[j + 2] = 1.0;
                //cylVerts[j + 3] = 1.0;			// r,g,b = topColr[]
                cylVerts[j + 3] = ctrColr[0];
                cylVerts[j + 4] = ctrColr[1];
                cylVerts[j + 5] = ctrColr[2];
            }
            else { 	// put odd# vertices around the top cap's outer edge;
                // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
                // 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
                cylVerts[j] = Math.cos(Math.PI * (v - 1) / capVerts);			// x
                cylVerts[j + 1] = Math.sin(Math.PI * (v - 1) / capVerts);			// y
                //	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
                //	 can simplify cos(2*PI * (v-1)/(2*capVerts))
                cylVerts[j + 2] = 1.0;	// z
                //cylVerts[j + 3] = 1.0;	// w.
                // r,g,b = topColr[]
                cylVerts[j + 3] = topColr[0];
                cylVerts[j + 4] = topColr[1];
                cylVerts[j + 5] = topColr[2];
            }
            cylVerts[j + 6] = 1;
            cylVerts[j + 7] = 1;
            cylVerts[j + 8] = 1;
        }
        // Create the cylinder side walls, made of 2*capVerts vertices.
        // v counts vertices within the wall; j continues to count array elements
        for (v = 0; v < 2 * capVerts; v++, j += floatsPerVertex) {
            if (v % 2 == 0)	// position all even# vertices along top cap:
            {
                cylVerts[j] = Math.cos(Math.PI * (v) / capVerts);		// x
                cylVerts[j + 1] = Math.sin(Math.PI * (v) / capVerts);		// y
                cylVerts[j + 2] = 1.0;	// z
                //cylVerts[j + 3] = 1.0;	// w.
                // r,g,b = topColr[]
                cylVerts[j + 3] = topColr[0];
                cylVerts[j + 4] = topColr[1];
                cylVerts[j + 5] = topColr[2];

            }
            else		// position all odd# vertices along the bottom cap:
            {
                cylVerts[j] = botRadius * Math.cos(Math.PI * (v - 1) / capVerts);		// x
                cylVerts[j + 1] = botRadius * Math.sin(Math.PI * (v - 1) / capVerts);		// y
                cylVerts[j + 2] = -1.0;	// z
                //cylVerts[j + 3] = 1.0;	// w.
                // r,g,b = topColr[]
                cylVerts[j + 3] = botColr[0];
                cylVerts[j + 4] = botColr[1];
                cylVerts[j + 5] = botColr[2];

            }
            cylVerts[j + 6] = 1;
            cylVerts[j + 7] = 1;
            cylVerts[j + 8] = 1;
        }
        // Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
        // v counts the vertices in the cap; j continues to count array elements
        for (v = 0; v < (2 * capVerts - 1) ; v++, j += floatsPerVertex) {
            if (v % 2 == 0) {	// position even #'d vertices around bot cap's outer edge
                cylVerts[j] = botRadius * Math.cos(Math.PI * (v) / capVerts);		// x
                cylVerts[j + 1] = botRadius * Math.sin(Math.PI * (v) / capVerts);		// y
                cylVerts[j + 2] = -1.0;	// z
                //cylVerts[j + 3] = 1.0;	// w.
                // r,g,b = topColr[]
                cylVerts[j + 3] = botColr[0];
                cylVerts[j + 4] = botColr[1];
                cylVerts[j + 5] = botColr[2];
            }
            else {				// position odd#'d vertices at center of the bottom cap:
                cylVerts[j] = 0.0; 			// x,y,z,w == 0,0,-1,1
                cylVerts[j + 1] = 0.0;
                cylVerts[j + 2] = -1.0;
                //cylVerts[j + 3] = 1.0;			// r,g,b = botColr[]
                cylVerts[j + 3] = botColr[0];
                cylVerts[j + 4] = botColr[1];
                cylVerts[j + 5] = botColr[2];
            }
            cylVerts[j + 6] = 1;
            cylVerts[j + 7] = 1;
            cylVerts[j + 8] = 1;
        }
    }

    function makeHexagon() {

        var red = .376;
        var green = .376;
        var blue = .376;
        var or = 1;
        var og = 1;
        var ob = 1;

        hexVerts = new Float32Array([
            1, 0, 0, red, green, blue, 1, 1, 1,
            .5, 1, 0, red, green, blue, 1, 1, 1,
            0, 0, 0, or, og, ob, 1, 1, 1,

            .5, 1, 0, red, green, blue, 1, 1, 1,
            -.5, 1, 0, red, green, blue, 1, 1, 1,
            0, 0, 0, or, og, ob, 1, 1, 1,

            -.5, 1, 0, red, green, blue, 1, 1, 1,
            -1, 0, 0, red, green, blue, 1, 1, 1,
            0, 0, 0, or, og, ob, 1, 1, 1,

            -1, 0, 0, red, green, blue, 1, 1, 1,
            -.5, -1, 0, red, green, blue, 1, 1, 1,
            0, 0, 0, or, og, ob, 1, 1, 1,

            -.5, -1, 0, red, green, blue, 1, 1, 1,
            .5, -1, 0, red, green, blue, 1, 1, 1,
            0, 0, 0, or, og, ob, 1, 1, 1,

            .5, -1, 0, red, green, blue, 1, 1, 1,
            1, 0, 0, red, green, blue, 1, 1, 1,
            0, 0, 0, or, og, ob, 1, 1, 1,

            //Connection
            1, 0, 0, red, green, blue, 1, 1, 1,
            1, 0, -.25, red, green, blue, 1, 1, 1,
            .5, 1, -.25, red, green, blue, 1, 1, 1,
            .5, 1, 0, red, green, blue, 1, 1, 1,
            .5, 1, -.25, red, green, blue, 1, 1, 1,
            1, 0, 0, red, green, blue, 1, 1, 1,

            .5, 1, 0, red, green, blue, 1, 1, 1,
            .5, 1, -.25, red, green, blue, 1, 1, 1,
            -.5, 1, -.25, red, green, blue, 1, 1, 1,
            -.5, 1, 0, red, green, blue, 1, 1, 1,
            -.5, 1, -.25, red, green, blue, 1, 1, 1,
            .5, 1, 0, red, green, blue, 1, 1, 1,

            -.5, 1, 0, red, green, blue, 1, 1, 1,
            -.5, 1, -.25, red, green, blue, 1, 1, 1,
            -1, 0, -.25, red, green, blue, 1, 1, 1,
            -1, 0, 0, red, green, blue, 1, 1, 1,
            -1, 0, -.25, red, green, blue, 1, 1, 1,
            -.5, 1, 0, red, green, blue, 1, 1, 1,

            -1, 0, 0, red, green, blue, 1, 1, 1,
            -1, 0, -.25, red, green, blue, 1, 1, 1,
            -.5, -1, -.25, red, green, blue, 1, 1, 1,
            -.5, -1, 0, red, green, blue, 1, 1, 1,
            -.5, -1, -.25, red, green, blue, 1, 1, 1,
            -1, 0, 0, red, green, blue, 1, 1, 1,

            -.5, -1, 0, red, green, blue, 1, 1, 1,
            -.5, -1, -.25, red, green, blue, 1, 1, 1,
            .5, -1, -.25, red, green, blue, 1, 1, 1,
            .5, -1, 0, red, green, blue, 1, 1, 1,
            .5, -1, -.25, red, green, blue, 1, 1, 1,
            -.5, -1, 0, red, green, blue, 1, 1, 1,

            .5, -1, 0, red, green, blue, 1, 1, 1,
            .5, -1, -.25, red, green, blue, 1, 1, 1,
            1, 0, -.25, red, green, blue, 1, 1, 1,
            1, 0, 0, red, green, blue, 1, 1, 1,
            1, 0, -.25, red, green, blue, 1, 1, 1,
            .5, -1, 0, red, green, blue, 1, 1, 1,

            //Negative side
            1, 0, -.25, red, green, blue, 1, 1, 1,
            .5, 1, -.25, red, green, blue, 1, 1, 1,
            0, 0, -.25, or, og, ob, 1, 1, 1,

            .5, 1, -.25, red, green, blue, 1, 1, 1,
            -.5, 1, -.25, red, green, blue, 1, 1, 1,
            0, 0, -.25, or, og, ob, 1, 1, 1,

            -.5, 1, -.25, red, green, blue, 1, 1, 1,
            -1, 0, -.25, red, green, blue, 1, 1, 1,
            0, 0, -.25, or, og, ob, 1, 1, 1,

            -1, 0, -.25, red, green, blue, 1, 1, 1,
            -.5, -1, -.25, red, green, blue, 1, 1, 1,
            0, 0, -.25, or, og, ob, 1, 1, 1,

            -.5, -1, -.25, red, green, blue, 1, 1, 1,
            .5, -1, -.25, red, green, blue, 1, 1, 1,
            0, 0, -.25, or, og, ob, 1, 1, 1,

            .5, -1, -.25, red, green, blue, 1, 1, 1,
            1, 0, -.25, red, green, blue, 1, 1, 1,
            0, 0, -.25, or, og, ob, 1, 1, 1,

        ]);
    }
    function makeCone() {
        //==============================================================================
        // Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
        // 'stepped spiral' design described in notes.
        // Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
        //
        var ctrColr = new Float32Array([1, 1, 1]);	
        var topColr = new Float32Array([0.752, 0.752, 0.752]);
        var botColr = new Float32Array([0.5, 0.5, 0.5]);	
        var capVerts = 16;	// # of vertices around the topmost 'cap' of the shape
        var botRadius = 0.1;		// radius of bottom of cylinder (top always 1.0)

        // Create a (global) array to hold this cylinder's vertices;
        coneVerts = new Float32Array(((capVerts * 6) - 2) * floatsPerVertex);
        // # of vertices * # of elements needed to store them. 

        // Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
        // v counts vertices: j counts array elements (vertices * elements per vertex)
        for (v = 1, j = 0; v < 2 * capVerts; v++, j += floatsPerVertex) {
            // skip the first vertex--not needed.
            if (v % 2 == 0) {				// put even# vertices at center of cylinder's top cap:
                coneVerts[j] = 0.0; 			// x,y,z,w == 0,0,1,1
                coneVerts[j + 1] = 0.0;
                coneVerts[j + 2] = 1.0;
                //coneVerts[j + 3] = 1.0;			// r,g,b = topColr[]
                coneVerts[j + 3] = ctrColr[0];
                coneVerts[j + 4] = ctrColr[1];
                coneVerts[j + 5] = ctrColr[2];
            }
            else { 	// put odd# vertices around the top cap's outer edge;
                // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
                // 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
                coneVerts[j] = Math.cos(Math.PI * (v - 1) / capVerts);			// x
                coneVerts[j + 1] = Math.sin(Math.PI * (v - 1) / capVerts);			// y
                //	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
                //	 can simplify cos(2*PI * (v-1)/(2*capVerts))
                coneVerts[j + 2] = 1.0;	// z
                //coneVerts[j + 3] = 1.0;	// w.
                // r,g,b = topColr[]
                coneVerts[j + 3] = topColr[0];
                coneVerts[j + 4] = topColr[1];
                coneVerts[j + 5] = topColr[2];
            }
            coneVerts[j + 6] = 1;
            coneVerts[j + 7] = 1;
            coneVerts[j + 8] = 1;
        }
        // Create the cylinder side walls, made of 2*capVerts vertices.
        // v counts vertices within the wall; j continues to count array elements
        for (v = 0; v < 2 * capVerts; v++, j += floatsPerVertex) {
            if (v % 2 == 0)	// position all even# vertices along top cap:
            {
                coneVerts[j] = Math.cos(Math.PI * (v) / capVerts);		// x
                coneVerts[j + 1] = Math.sin(Math.PI * (v) / capVerts);		// y
                coneVerts[j + 2] = 1.0;	// z
                //coneVerts[j + 3] = 1.0;	// w.
                // r,g,b = topColr[]
                coneVerts[j + 3] = topColr[0];
                coneVerts[j + 4] = topColr[1];
                coneVerts[j + 5] = topColr[2];
            }
            else		// position all odd# vertices along the bottom cap:
            {
                coneVerts[j] = botRadius * Math.cos(Math.PI * (v - 1) / capVerts);		// x
                coneVerts[j + 1] = botRadius * Math.sin(Math.PI * (v - 1) / capVerts);		// y
                coneVerts[j + 2] = -1.0;	// z
                //coneVerts[j + 3] = 1.0;	// w.
                // r,g,b = topColr[]
                coneVerts[j + 3] = botColr[0];
                coneVerts[j + 4] = botColr[1];
                coneVerts[j + 5] = botColr[2];
            }
            coneVerts[j + 6] = 1;
            coneVerts[j + 7] = 1;
            coneVerts[j + 8] = 1;
        }
        // Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
        // v counts the vertices in the cap; j continues to count array elements
        for (v = 0; v < (2 * capVerts - 1) ; v++, j += floatsPerVertex) {
            if (v % 2 == 0) {	// position even #'d vertices around bot cap's outer edge
                coneVerts[j] = botRadius * Math.cos(Math.PI * (v) / capVerts);		// x
                coneVerts[j + 1] = botRadius * Math.sin(Math.PI * (v) / capVerts);		// y
                coneVerts[j + 2] = -1.0;	// z
                //coneVerts[j + 3] = 1.0;	// w.
                // r,g,b = topColr[]
                coneVerts[j + 3] = botColr[0];
                coneVerts[j + 4] = botColr[1];
                coneVerts[j + 5] = botColr[2];
            }
            else {				// position odd#'d vertices at center of the bottom cap:
                coneVerts[j] = 0.0; 			// x,y,z,w == 0,0,-1,1
                coneVerts[j + 1] = 0.0;
                coneVerts[j + 2] = -1.0;
                //coneVerts[j + 3] = 1.0;			// r,g,b = botColr[]
                coneVerts[j + 3] = botColr[0];
                coneVerts[j + 4] = botColr[1];
                coneVerts[j + 5] = botColr[2];
            }
            coneVerts[j + 6] = 1;
            coneVerts[j + 7] = 1;
            coneVerts[j + 8] = 1;
        }
    }

    function makeStar() {
        starVerts = new Float32Array([
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


        0.0, 0.0, 0.15, 1.0, 0.0, 1.0, 1, 1, 1,
        1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        .25, .25, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,

        1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        0.0, 0.0, 0.15, 1.0, 0.0, 1.0, 1, 1, 1,
        .25, -.25, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,

        .25, -.25, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        0.0, 0.0, 0.15, 1.0, 0.0, 1.0, 1, 1, 1,
        0.0, -1.0, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,

        0.0, -1.0, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        -0.25, -0.25, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        0.0, 0.0, 0.15, 1.0, 0.0, 1.0, 1, 1, 1,

        0.0, 0.0, 0.15, 0.0, 1.0, 1.0, 1, 1, 1,
        -0.25, -0.25, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        -1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,

        -1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        -.25, .25, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        0.0, 0.0, 0.15, 0.0, 1.0, 1.0, 1, 1, 1,

        0.0, 0.0, 0.15, 0.0, 1.0, 1.0, 1, 1, 1,
        -.25, .25, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,

        0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        .25, .25, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        0.0, 0.0, 0.15, 0.0, 1.0, 1.0, 1, 1, 1,

        0.0, 0.0, -0.15, 0.0, 1.0, 1.0, 1, 1, 1,
        1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        .25, .25, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,

        1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        0.0, 0.0, -0.15, 0.0, 1.0, 1.0, 1, 1, 1,
        .25, -.25, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,

        .25, -.25, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        0.0, 0.0, -0.15, 0.0, 1.0, 1.0, 1, 1, 1,
        0.0, -1.0, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,

        0.0, -1.0, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        -0.25, -0.25, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        0.0, 0.0, -0.15, 0.0, 1.0, 1.0, 1, 1, 1,

        0.0, 0.0, -0.15, 0.0, 1.0, 1.0, 1, 1, 1,
        -0.25, -0.25, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        -1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,

        -1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        -.25, .25, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        0.0, 0.0, -0.15, 0.0, 1.0, 1.0, 1, 1, 1,

         0.0, 0.0, -0.15, 0.0, 1.0, 1.0, 1, 1, 1,
         -.25, .25, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,

        0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        .25, .25, 0.0, 0.0, 1.0, 1.0, 1, 1, 1,
        0.0, 0.0, -0.15, 0.0, 1.0, 1.0, 1, 1, 1,
        ]);
    }

    function makeAxes() {
        axesVerts = new Float32Array([
        -100, 0, 0, 5 * r, 0, 0, 0, 0, 1,
    100, 0, 0, 5 * r, 0, 0, 0, 1, 1,
     0, -100, 0, 0, 5 * g, 0, 0, 0, 1,
    0, 100, 0, 0, 5 * g, 0, 1, 0, 1,
     0, 0, -100, 0, 0, 5 * b, 0, 0, 1,
    0, 0, 100, 0, 0, 5 * b, 1, 1, 0,
        ]);
    }

    function makeRedCylinder() {
        //==============================================================================
        // Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
        // 'stepped spiral' design described in notes.
        // Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
        //
        var ctrColr = new Float32Array([1.0, 0.0, 0.0]);	// dark gray
        var topColr = new Float32Array([1.0, 0.0, 0.0]);
        var botColr = new Float32Array([1.0, 0.0, 0.0]);	// light blue
        var capVerts = 16;	// # of vertices around the topmost 'cap' of the shape
        var botRadius = 1.0;		// radius of bottom of cylinder (top always 1.0)

        // Create a (global) array to hold this cylinder's vertices;
        redCylVerts = new Float32Array(((capVerts * 6) - 2) * floatsPerVertex);
        // # of vertices * # of elements needed to store them. 

        // Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
        // v counts vertices: j counts array elements (vertices * elements per vertex)
        for (v = 1, j = 0; v < 2 * capVerts; v++, j += floatsPerVertex) {
            // skip the first vertex--not needed.
            if (v % 2 == 0) {				// put even# vertices at center of cylinder's top cap:
                redCylVerts[j] = 0.0; 			// x,y,z,w == 0,0,1,1
                redCylVerts[j + 1] = 0.0;
                redCylVerts[j + 2] = 1.0;
                //redCylVerts[j + 3] = 1.0;			// r,g,b = topColr[]
                redCylVerts[j + 3] = ctrColr[0];
                redCylVerts[j + 4] = ctrColr[1];
                redCylVerts[j + 5] = ctrColr[2];
            }
            else { 	// put odd# vertices around the top cap's outer edge;
                // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
                // 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
                redCylVerts[j] = Math.cos(Math.PI * (v - 1) / capVerts);			// x
                redCylVerts[j + 1] = Math.sin(Math.PI * (v - 1) / capVerts);			// y
                //	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
                //	 can simplify cos(2*PI * (v-1)/(2*capVerts))
                redCylVerts[j + 2] = 1.0;	// z
                //redCylVerts[j + 3] = 1.0;	// w.
                // r,g,b = topColr[]
                redCylVerts[j + 3] = topColr[0];
                redCylVerts[j + 4] = topColr[1];
                redCylVerts[j + 5] = topColr[2];
            }
            redCylVerts[j + 6] = 1;
            redCylVerts[j + 7] = 1;
            redCylVerts[j + 8] = 1;
        }
        // Create the cylinder side walls, made of 2*capVerts vertices.
        // v counts vertices within the wall; j continues to count array elements
        for (v = 0; v < 2 * capVerts; v++, j += floatsPerVertex) {
            if (v % 2 == 0)	// position all even# vertices along top cap:
            {
                redCylVerts[j] = Math.cos(Math.PI * (v) / capVerts);		// x
                redCylVerts[j + 1] = Math.sin(Math.PI * (v) / capVerts);		// y
                redCylVerts[j + 2] = 1.0;	// z
                //redCylVerts[j + 3] = 1.0;	// w.
                // r,g,b = topColr[]
                redCylVerts[j + 3] = topColr[0];
                redCylVerts[j + 4] = topColr[1];
                redCylVerts[j + 5] = topColr[2];
            }
            else		// position all odd# vertices along the bottom cap:
            {
                redCylVerts[j] = botRadius * Math.cos(Math.PI * (v - 1) / capVerts);		// x
                redCylVerts[j + 1] = botRadius * Math.sin(Math.PI * (v - 1) / capVerts);		// y
                redCylVerts[j + 2] = -1.0;	// z
                //redCylVerts[j + 3] = 1.0;	// w.
                // r,g,b = topColr[]
                redCylVerts[j + 3] = botColr[0];
                redCylVerts[j + 4] = botColr[1];
                redCylVerts[j + 5] = botColr[2];
            }
            redCylVerts[j + 6] = 1;
            redCylVerts[j + 7] = 1;
            redCylVerts[j + 8] = 1;
        }
        // Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
        // v counts the vertices in the cap; j continues to count array elements
        for (v = 0; v < (2 * capVerts - 1) ; v++, j += floatsPerVertex) {
            if (v % 2 == 0) {	// position even #'d vertices around bot cap's outer edge
                redCylVerts[j] = botRadius * Math.cos(Math.PI * (v) / capVerts);		// x
                redCylVerts[j + 1] = botRadius * Math.sin(Math.PI * (v) / capVerts);		// y
                redCylVerts[j + 2] = -1.0;	// z
                //redCylVerts[j + 3] = 1.0;	// w.
                // r,g,b = topColr[]
                redCylVerts[j + 3] = botColr[0];
                redCylVerts[j + 4] = botColr[1];
                redCylVerts[j + 5] = botColr[2];
            }
            else {				// position odd#'d vertices at center of the bottom cap:
                redCylVerts[j] = 0.0; 			// x,y,z,w == 0,0,-1,1
                redCylVerts[j + 1] = 0.0;
                redCylVerts[j + 2] = -1.0;
                //redCylVerts[j + 3] = 1.0;			// r,g,b = botColr[]
                redCylVerts[j + 3] = botColr[0];
                redCylVerts[j + 4] = botColr[1];
                redCylVerts[j + 5] = botColr[2];
            }
            redCylVerts[j + 6] = 1;
            redCylVerts[j + 7] = 1;
            redCylVerts[j + 8] = 1;
        }
    }

    function makeBlackCylinder() {
        //==============================================================================
        // Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
        // 'stepped spiral' design described in notes.
        // Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
        //
        var ctrColr = new Float32Array([1.0, 0.0, 0.0]);	// dark gray
        var topColr = new Float32Array([0.2, 0.2, 0.2]);
        var botColr = new Float32Array([0.2, 0.2, 0.2]);	// light blue
        var capVerts = 16;	// # of vertices around the topmost 'cap' of the shape
        var botRadius = 1.0;		// radius of bottom of cylinder (top always 1.0)

        // Create a (global) array to hold this cylinder's vertices;
        blackCylVerts = new Float32Array(((capVerts * 6) - 2) * floatsPerVertex);
        // # of vertices * # of elements needed to store them. 

        // Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
        // v counts vertices: j counts array elements (vertices * elements per vertex)
        for (v = 1, j = 0; v < 2 * capVerts; v++, j += floatsPerVertex) {
            // skip the first vertex--not needed.
            if (v % 2 == 0) {				// put even# vertices at center of cylinder's top cap:
                blackCylVerts[j] = 0.0; 			// x,y,z,w == 0,0,1,1
                blackCylVerts[j + 1] = 0.0;
                blackCylVerts[j + 2] = 1.0;
                //blackCylVerts[j + 3] = 1.0;			// r,g,b = topColr[]
                blackCylVerts[j + 3] = ctrColr[0];
                blackCylVerts[j + 4] = ctrColr[1];
                blackCylVerts[j + 5] = ctrColr[2];
            }
            else { 	// put odd# vertices around the top cap's outer edge;
                // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
                // 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
                blackCylVerts[j] = Math.cos(Math.PI * (v - 1) / capVerts);			// x
                blackCylVerts[j + 1] = Math.sin(Math.PI * (v - 1) / capVerts);			// y
                //	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
                //	 can simplify cos(2*PI * (v-1)/(2*capVerts))
                blackCylVerts[j + 2] = 1.0;	// z
                //blackCylVerts[j + 3] = 1.0;	// w.
                // r,g,b = topColr[]
                blackCylVerts[j + 3] = topColr[0];
                blackCylVerts[j + 4] = topColr[1];
                blackCylVerts[j + 5] = topColr[2];
            }
            blackCylVerts[j + 6] = 1;
            blackCylVerts[j + 7] = 1;
            blackCylVerts[j + 8] = 1;
        }
        // Create the cylinder side walls, made of 2*capVerts vertices.
        // v counts vertices within the wall; j continues to count array elements
        for (v = 0; v < 2 * capVerts; v++, j += floatsPerVertex) {
            if (v % 2 == 0)	// position all even# vertices along top cap:
            {
                blackCylVerts[j] = Math.cos(Math.PI * (v) / capVerts);		// x
                blackCylVerts[j + 1] = Math.sin(Math.PI * (v) / capVerts);		// y
                blackCylVerts[j + 2] = 1.0;	// z
                //blackCylVerts[j + 3] = 1.0;	// w.
                // r,g,b = topColr[]
                blackCylVerts[j + 3] = topColr[0];
                blackCylVerts[j + 4] = topColr[1];
                blackCylVerts[j + 5] = topColr[2];
            }
            else		// position all odd# vertices along the bottom cap:
            {
                blackCylVerts[j] = botRadius * Math.cos(Math.PI * (v - 1) / capVerts);		// x
                blackCylVerts[j + 1] = botRadius * Math.sin(Math.PI * (v - 1) / capVerts);		// y
                blackCylVerts[j + 2] = -1.0;	// z
                //blackCylVerts[j + 3] = 1.0;	// w.
                // r,g,b = topColr[]
                blackCylVerts[j + 3] = botColr[0];
                blackCylVerts[j + 4] = botColr[1];
                blackCylVerts[j + 5] = botColr[2];
            }
            blackCylVerts[j + 6] = 1;
            blackCylVerts[j + 7] = 1;
            blackCylVerts[j + 8] = 1;
        }
        // Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
        // v counts the vertices in the cap; j continues to count array elements
        for (v = 0; v < (2 * capVerts - 1) ; v++, j += floatsPerVertex) {
            if (v % 2 == 0) {	// position even #'d vertices around bot cap's outer edge
                blackCylVerts[j] = botRadius * Math.cos(Math.PI * (v) / capVerts);		// x
                blackCylVerts[j + 1] = botRadius * Math.sin(Math.PI * (v) / capVerts);		// y
                blackCylVerts[j + 2] = -1.0;	// z
                //blackCylVerts[j + 3] = 1.0;	// w.
                // r,g,b = topColr[]
                blackCylVerts[j + 3] = botColr[0];
                blackCylVerts[j + 4] = botColr[1];
                blackCylVerts[j + 5] = botColr[2];
            }
            else {				// position odd#'d vertices at center of the bottom cap:
                blackCylVerts[j] = 0.0; 			// x,y,z,w == 0,0,-1,1
                blackCylVerts[j + 1] = 0.0;
                blackCylVerts[j + 2] = -1.0;
                //blackCylVerts[j + 3] = 1.0;			// r,g,b = botColr[]
                blackCylVerts[j + 3] = botColr[0];
                blackCylVerts[j + 4] = botColr[1];
                blackCylVerts[j + 5] = botColr[2];
            }
            blackCylVerts[j + 6] = 1;
            blackCylVerts[j + 7] = 1;
            blackCylVerts[j + 8] = 1;
        }
    }
    function initVertexBuffers(gl) {
        //==============================================================================
        makeCylinder();
        makeSphere();
        makeHexagon();
        makeCone();
        makeStar();
        // Make our 'ground plane'; can you make a'torus' shape too?
        // (recall the 'basic shapes' starter code...)
        makeGroundGrid();
        makeAxes();
        makeRedCylinder();
        makeBlackCylinder();

        // How much space to store all the shapes in one array?
        // (no 'var' means this is a global variable)
        mySize = cylVerts.length + sphVerts.length + hexVerts.length + coneVerts.length + starVerts.length + gndVerts.length + axesVerts.length + redCylVerts.length + blackCylVerts.length;

        // How many vertices total?
        var nn = mySize / floatsPerVertex;
        console.log('nn is', nn, 'mySize is', mySize, 'floatsPerVertex is', floatsPerVertex);

        // Copy all shapes into one big Float32 array:
        var vertices = new Float32Array(mySize);
        // Copy them:  remember where to start for each shape:
        cylinderStart = 0;              // we store the forest first.
        for (i = 0, j = 0; j < cylVerts.length; i++, j++) {
            vertices[i] = cylVerts[j];
        }

        sphereStart = i;           // next we'll store the sphere
        for (j = 0; j < sphVerts.length; i++, j++) {
            vertices[i] = sphVerts[j];
        }

        hexStart = i;
        for (k = 0; k < hexVerts.length; i++, k++) {
            vertices[i] = hexVerts[k];
        }
        
        coneStart = i;
        for (k = 0; k < coneVerts.length; i++, k++) {
            vertices[i] = coneVerts[k];
        }

        starStart = i;
        for (k = 0; k < starVerts.length; i++, k++) {
            vertices[i] = starVerts[k];
        }

        gndStart = i;           // next we'll store the ground-plane;
        for (j = 0; j < gndVerts.length; i++, j++) {
            vertices[i] = gndVerts[j];
        }

        axesStart = i;
        for (j = 0; j < axesVerts.length; i++, j++) {
            vertices[i] = axesVerts[j];
        }

        redCylStart = i;
        for (j = 0; j < redCylVerts.length; i++, j++) {
            vertices[i] = redCylVerts[j];
        }

        blackCylStart = i;
        for (j = 0; j < blackCylVerts.length; i++, j++) {
            vertices[i] = blackCylVerts[j];
        }
        // Create a vertex buffer object (VBO)
        var vertexColorbuffer = gl.createBuffer();
        if (!vertexColorbuffer) {
            console.log('Failed to create the buffer object');
            return -1;
        }

        // Write vertex information to buffer object
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        var FSIZE = vertices.BYTES_PER_ELEMENT;


        // Assign the buffer object to a_Position and enable the assignment
        var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
        if (a_Position < 0) {
            console.log('Failed to get the storage location of a_Position');
            return -1;
        }
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 9, 0);
        gl.enableVertexAttribArray(a_Position);

        // Assign the buffer object to a_Color and enable the assignment
        var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
        if (a_Color < 0) {
            console.log('Failed to get the storage location of a_Color');
            return -1;
        }
        gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 9, FSIZE * 3);
        gl.enableVertexAttribArray(a_Color);

        // Assign the buffer object to a_Normal and enable the assignment
        var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
        if (a_Normal < 0) {
            console.log('Failed to get the storage location of a_Normal');
            return -1;
        }
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 9, FSIZE * 6);
        gl.enableVertexAttribArray(a_Normal);


        return mySize / floatsPerVertex; // return # of vertices
    }

    function draw(gl, currentAngle, u_ViewMatrix, viewMatrix, u_ProjMatrix, projMatrix, canvas, u_NormalMatrix, normalMatrix, curLength,saberAngle, saberLength) {
        //==============================================================================

        // Clear <canvas> color AND DEPTH buffer
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        projMatrix.setPerspective(40, 1, 1, 100);

        // Send this matrix to our Vertex and Fragment shaders through the
        // 'uniform' variable u_ProjMatrix:
        gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
        // Draw in the SECOND of several 'viewports'
        //------------------------------------------
        gl.viewport(0,        // Viewport lower-left corner
                    0,                              // location(in pixels)
                    innerWidth / 2,        // viewport width, height.
                    innerWidth * 0.75 / 2);

        // but use a different 'view' matrix:
        viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ, // eye position
                            g_AtX, g_AtY, g_AtZ,                  // look-at point 
                            0, 0, 1);                 // up vector

        // Pass the view projection matrix to our shaders:
        gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

        // Draw the scene:
        drawMyScene(gl, currentAngle, u_ViewMatrix, viewMatrix, u_NormalMatrix, normalMatrix, curLength, saberAngle, saberLength);

        projMatrix.setOrtho(-3, 3, -3, 3, 0, 30.0);
        gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
        // Draw in the THIRD of several 'viewports'
        //------------------------------------------
        gl.viewport(innerWidth/ 2,         // Viewport lower-left corner
                    0,     // location(in pixels)
                    innerWidth / 2,        // viewport width, height.
                    innerWidth * 0.75 / 2);

        // but use a different 'view' matrix:
        viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ,  // eye position,
                              g_AtX, g_AtY, g_AtZ,                // look-at point,
                              0, 0, 1);               // 'up' vector.

        // Pass the view projection matrix to our shaders:
        gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

        // Draw the scene:
        drawMyScene(gl, currentAngle, u_ViewMatrix, viewMatrix, u_NormalMatrix, normalMatrix, curLength, saberAngle, saberLength);
    }

    function drawMyScene(myGL, currentAngle, myu_ViewMatrix, myViewMatrix, u_NormalMatrix, normalMatrix, curLength, saberAngle, saberLength) {
        
        myViewMatrix.scale(0.2, 0.2, 0.2);
        myViewMatrix.translate(0.0, 0.0, -0.5);

        normalMatrix.setInverseOf(myViewMatrix);
        normalMatrix.transpose();
        myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

        // shrink the drawing axes 
        //for nicer-looking ground-plane, and
        // Pass the modified view matrix to our shaders:
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);

        // Now, using these drawing axes, draw our ground plane: 
        myGL.drawArrays(myGL.LINES,             // use this drawing primitive, and
                      gndStart / floatsPerVertex, // start at this vertex number, and
                      gndVerts.length / floatsPerVertex);   // draw this many vertices
        
        pushMatrix(myViewMatrix);
        pushMatrix(myViewMatrix);
        pushMatrix(myViewMatrix);
        pushMatrix(myViewMatrix);
        pushMatrix(myViewMatrix);
        pushMatrix(myViewMatrix);
        pushMatrix(myViewMatrix);
        

        //Axes
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.LINES, axesStart / floatsPerVertex, axesVerts.length / floatsPerVertex);

        //Draw the deathStar
        myViewMatrix = popMatrix();
        myViewMatrix.scale(2, 2, 2);
        myViewMatrix.translate(2, -1.5, 1);
        normalMatrix.setInverseOf(myViewMatrix);
        normalMatrix.transpose();
        pushMatrix(normalMatrix);
        myViewMatrix.rotate(-currentAngle, 0, 0, 1);
        normalMatrix.setInverseOf(myViewMatrix);
        normalMatrix.transpose();
        myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLE_STRIP, sphereStart / floatsPerVertex, sphVerts.length/floatsPerVertex);

        
        myViewMatrix.translate(1, 0, 1);
        myViewMatrix.rotate(-130, 0, 1, 0);
        myViewMatrix.scale(.5, .5, .25);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.LINES, coneStart / floatsPerVertex, coneVerts.length / floatsPerVertex);

        normalMatrix = popMatrix();
        myGL.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

        //Draw the Tie Fighter Fleet
        myViewMatrix = popMatrix();
        myViewMatrix.scale(.5, .5, .5);
        myViewMatrix.translate(-5, 0, 0);
        myViewMatrix.translate(translateFleetX, translateFleetY * 2, translateFleetZ);
        myViewMatrix.scale(.65, .65, .65);
        pushMatrix(myViewMatrix);
        pushMatrix(myViewMatrix);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLE_STRIP, sphereStart / floatsPerVertex, sphVerts.length / floatsPerVertex);

        myViewMatrix.translate(1.5, 0, 0);
        myViewMatrix.rotate(-90, 0, 1, 0);
        myViewMatrix.scale(1, .65, 1);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLE_STRIP, coneStart / floatsPerVertex, coneVerts.length / floatsPerVertex);

        myViewMatrix.translate(0, 0, -1);
        myViewMatrix.scale(2, 2.65, 2);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLES, hexStart / floatsPerVertex, hexVerts.length / floatsPerVertex);

        myViewMatrix = popMatrix();
        myViewMatrix.translate(-1.5, 0, 0);
        myViewMatrix.rotate(90, 0, 1, 0);
        myViewMatrix.scale(1, .65, 1);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLE_STRIP, coneStart / floatsPerVertex, coneVerts.length / floatsPerVertex);

        myViewMatrix.translate(0, 0, -1);
        myViewMatrix.scale(2, 2.65, 2);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLES, hexStart / floatsPerVertex, hexVerts.length / floatsPerVertex);

        //Second Tie Fighter
        myViewMatrix = popMatrix();
        myViewMatrix.translate(-5, -5, 0);
        pushMatrix(myViewMatrix);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLE_STRIP, sphereStart / floatsPerVertex, sphVerts.length / floatsPerVertex);

        myViewMatrix.translate(1.5, 0, 0);
        myViewMatrix.rotate(-90, 0, 1, 0);
        myViewMatrix.scale(1, .65, 1);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLE_STRIP, coneStart / floatsPerVertex, coneVerts.length / floatsPerVertex);

        myViewMatrix.translate(0, 0, -1);
        myViewMatrix.scale(2, 2.65, 2);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLES, hexStart / floatsPerVertex, hexVerts.length / floatsPerVertex);

        myViewMatrix = popMatrix();
        myViewMatrix.translate(-1.5, 0, 0);
        myViewMatrix.rotate(90, 0, 1, 0);
        myViewMatrix.scale(1, .65, 1);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLE_STRIP, coneStart / floatsPerVertex, coneVerts.length / floatsPerVertex);

        myViewMatrix.translate(0, 0, -1);
        myViewMatrix.scale(2, 2.65, 2);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLES, hexStart / floatsPerVertex, hexVerts.length / floatsPerVertex);


        //Draw the checkpoint platform
        //Bottom star
        myViewMatrix = popMatrix();
        myViewMatrix.translate(-5, 10, 0);
        pushMatrix(myViewMatrix);

        myViewMatrix.rotate(currentAngle, 0, 0, 1);
        //myViewMatrix.rotate(90, 0, 1, 0);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLES, starStart / floatsPerVertex, starVerts.length / floatsPerVertex);


        //Cone
        myViewMatrix = popMatrix();
        myViewMatrix.translate(0, 0, 0.75);
        pushMatrix(myViewMatrix);
        myViewMatrix.scale(1, 1, .5);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLE_STRIP, coneStart / floatsPerVertex, coneVerts.length / floatsPerVertex);
        

        //Cylinder base
        myViewMatrix = popMatrix();
        myViewMatrix.translate(0, 0, .5+curLength/2);
        myViewMatrix.scale(1, 1, .5);
        pushMatrix(myViewMatrix);
        myViewMatrix.scale(1, 1, curLength);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLE_STRIP, cylinderStart / floatsPerVertex, cylVerts.length / floatsPerVertex);

        //Platform
        myViewMatrix = popMatrix();
        myViewMatrix.translate(0, 0, 1 * curLength);
        myViewMatrix.scale(1.75, 1.75, .25);
        pushMatrix(myViewMatrix);

        myViewMatrix.rotate(-currentAngle * .5, 0, 0, 1);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLE_STRIP, cylinderStart / floatsPerVertex, cylVerts.length / floatsPerVertex);

        
        //Draw the Sith
        //Right leg
        myViewMatrix = popMatrix();
        myViewMatrix.translate(-.65, 0, 1);
        myViewMatrix.translate(sithMoveX, 0, 0);
        myViewMatrix.rotate(sithArmAngle, 0, 0, 1);
        myViewMatrix.scale(.05, .05, 3);
        
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLE_STRIP, cylinderStart / floatsPerVertex, cylVerts.length / floatsPerVertex);
        //Left leg
        myViewMatrix.translate(2.5, 0, 0);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLE_STRIP, cylinderStart / floatsPerVertex, cylVerts.length / floatsPerVertex);
        //Torso
        myViewMatrix.translate(-1, 0, 1.5);
        
        pushMatrix(myViewMatrix);
        pushMatrix(myViewMatrix);
        pushMatrix(myViewMatrix);
        pushMatrix(myViewMatrix);
        myViewMatrix.scale(2.3, 1.5, .5);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLE_STRIP, blackCylStart / floatsPerVertex, blackCylVerts.length / floatsPerVertex);

        //Axes
        myViewMatrix.scale(.07, .1, .05);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.LINES, axesStart / floatsPerVertex, axesVerts.length / floatsPerVertex);

        //Right arm
        myViewMatrix = popMatrix();
        myViewMatrix.translate(-4.5, 0, .25);
        myViewMatrix.scale(2.5, .05, .1);
        myViewMatrix.rotate(90, 0, 1, 0);
        
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLE_STRIP, coneStart / floatsPerVertex, coneVerts.length / floatsPerVertex);
        //Left arm
        myViewMatrix = popMatrix();
        myViewMatrix.translate(4.5, 0, .25);
        myViewMatrix.scale(2.5, .05, .1);
        myViewMatrix.rotate(-90, 0, 1, 0);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLE_STRIP, coneStart / floatsPerVertex, coneVerts.length / floatsPerVertex);
        //Saber handle
        myViewMatrix = popMatrix();
        myViewMatrix.translate(7.0, 0, .25);
        myViewMatrix.scale(.56, .56, .15);
        myViewMatrix.rotate(saberAngle, 1, 0, 0);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLE_STRIP, cylinderStart / floatsPerVertex, cylVerts.length / floatsPerVertex);
        //Saber
        myViewMatrix.scale(.75, .75, 5 * saberLength);
        myViewMatrix.translate(0, 0, 1.0);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLE_STRIP, redCylStart / floatsPerVertex, redCylVerts.length / floatsPerVertex);
        //Head
        myViewMatrix = popMatrix();
        myViewMatrix.translate(0, 0, 1.0);
        myViewMatrix.scale(2, 2, 2 * (1 / 7));
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLE_STRIP, sphereStart / floatsPerVertex, sphVerts.length / floatsPerVertex);


        //Star Field
        myViewMatrix = popMatrix();
        myViewMatrix.translate(5, 5, 0);
        myViewMatrix.scale(.75, .75, 1);
        myViewMatrix.rotate(currentAngle, 0, 1, 1);

        pushMatrix(myViewMatrix);
        pushMatrix(myViewMatrix);
        pushMatrix(myViewMatrix);

        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLES, starStart / floatsPerVertex, starVerts.length / floatsPerVertex);

        
        myViewMatrix.translate(2, 2, 0);
        myViewMatrix.rotate(currentAngle*5, 1, 0, 0);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLES, starStart / floatsPerVertex, starVerts.length / floatsPerVertex);

        myViewMatrix = popMatrix();
        myViewMatrix.translate(-2, -2, 0);
        myViewMatrix.rotate(currentAngle*9, 1, 1, 0);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLES, starStart / floatsPerVertex, starVerts.length / floatsPerVertex);

        myViewMatrix = popMatrix();
        myViewMatrix.translate(2, -2, 0);
        myViewMatrix.rotate(currentAngle*8, 1, 0, 1);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLES, starStart / floatsPerVertex, starVerts.length / floatsPerVertex);

        myViewMatrix = popMatrix();
        myViewMatrix.translate(-2, 2, 0);
        myViewMatrix.rotate(currentAngle*.5, 0, 1, 0);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLES, starStart / floatsPerVertex, starVerts.length / floatsPerVertex);


        //Stacked objects
        myViewMatrix = popMatrix();
        myViewMatrix.translate(0, 1, 0);
        myViewMatrix.rotate(saberAngle, 0, 0, 1);

        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLES, hexStart / floatsPerVertex, hexVerts.length / floatsPerVertex);

        myViewMatrix.translate(0, 0, .5);
        myViewMatrix.scale(.5, .5, 1);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLES, hexStart / floatsPerVertex, hexVerts.length / floatsPerVertex);

        myViewMatrix.translate(0, 0, .5);
        myViewMatrix.scale(.5, .5, 1);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLES, hexStart / floatsPerVertex, hexVerts.length / floatsPerVertex);

        myViewMatrix.translate(0, 0, .5);
        myViewMatrix.scale(.5, .5, 1);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLES, hexStart / floatsPerVertex, hexVerts.length / floatsPerVertex);


        //Star tree
        myViewMatrix = popMatrix();
        myViewMatrix.translate(-3, -5, 0);
        myViewMatrix.rotate(-90, 0, 1, 0);
        myViewMatrix.rotate(currentAngle, 1, 0, 0);

        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLES, starStart / floatsPerVertex, starVerts.length / floatsPerVertex);

        myViewMatrix.translate(2, 0, 0);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLES, starStart / floatsPerVertex, starVerts.length / floatsPerVertex);

        myViewMatrix.translate(2, 0, 0);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLES, starStart / floatsPerVertex, starVerts.length / floatsPerVertex);


        myViewMatrix.translate(0, 2, 0);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLES, starStart / floatsPerVertex, starVerts.length / floatsPerVertex);

        myViewMatrix.translate(0, -4, 0);
        myGL.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);
        myGL.drawArrays(myGL.TRIANGLES, starStart / floatsPerVertex, starVerts.length / floatsPerVertex);



    }

    function onSubmitStretch() {
        var oldStretch = userStretch;

        userStretch = document.getElementById("usrStretch").value;
        console.log(userStretch);
        if (userStretch <= 0.5) {
            userStretch = 0.5;
        }
        if (userStretch >= 5.0) {
            userStretch = 5.0;
        }

        if (oldStretch > userStretch)
            LENGTH_STEP = -0.5;
        else
            LENGTH_STEP = 0.5;
    }

    function releaseFleet() {
        if (fleetMoving) {
            fleetMoving = false;
            FLEET_MOVE_STEP = 0.0;
        }
        else {
            fleetMoving = true;
            FLEET_MOVE_STEP = 5.0;

        }
    }

    function resetFleet() {
        translateFleetX = translateFleetY = translateFleetZ = 0.0;
    }

    function animateFleet(now) {
        var elapsed = now - g_last;
        if (fleetMoving) {
            translateFleetX += (FLEET_MOVE_STEP * elapsed) / 1000.0;
            translateFleetY += (FLEET_MOVE_STEP * elapsed) / 1000.0;
            translateFleetZ += (FLEET_MOVE_STEP * elapsed) / 1000.0;
        }
    }

    function animateStar(angleS, now) {
        var elapsed = now - g_last;

        var newAngle = angleS + (ANGLE_STAR_STEP * elapsed) / 1000.0;

        return newAngle %= 360;
    }

    function animateLength(curLength, now) {
        var elapsed = now - g_last;

        var newLength;

        if (curLength < userStretch && LENGTH_STEP > 0)
            newLength = curLength + (LENGTH_STEP * elapsed) / 1000.0;
        else if ((curLength >= userStretch && LENGTH_STEP > 0) || (curLength <= userStretch && LENGTH_STEP < 0))
            newLength = curLength;
        else if (LENGTH_STEP < 0)
            newLength = curLength + (LENGTH_STEP * elapsed) / 1000.0;

        return newLength;
    }

    function sabStretchClick() {
        var oldStretch = saberStretch;

        if (oldStretch >= 1.0) {
            SABER_LENGTH_STEP = -0.75;
            saberStretch = 0.001;
        }

        else {
            SABER_LENGTH_STEP = 0.75;
            saberStretch = 1.0;
        }
    }

    function animateSaber(angle, now) {
        var elapsed = now - g_last;

        if (angle > 30.0 && SABER_ANGLE_STEP > 0) SABER_ANGLE_STEP = -SABER_ANGLE_STEP;
        if (angle < -85.0 && SABER_ANGLE_STEP < 0) SABER_ANGLE_STEP = -SABER_ANGLE_STEP;
        if (SABER_ANGLE_STEP != 0)
            FORMER_ANGLE_STEP_ARM = SABER_ANGLE_STEP;
        var newAngle = angle + (SABER_ANGLE_STEP * elapsed) / 1000.0;
        return newAngle %= 360;
    }

    function animateSaberLength(saberLength, now) {
        var elapsed = now - g_last;

        var newLength;

        if (saberLength < saberStretch && SABER_LENGTH_STEP > 0)
            newLength = saberLength + (SABER_LENGTH_STEP * elapsed) / 1000.0;
        else if ((SABER_LENGTH_STEP > 0 && saberLength >= 1.0) || (SABER_LENGTH_STEP < 0 && saberLength <= saberStretch))
            newLength = saberLength;
        else if (SABER_LENGTH_STEP < 0)
            newLength = saberLength + (SABER_LENGTH_STEP * elapsed) / 1000.0;

        return newLength;

    }

    var sithMoving = false;
    var sithMoveXStep = 0.5;
    var sithMoveX = 0.0;
    function moveSith() {
        if (sithMoving) {
            sithMoving = false;
            sithMoveXStep = 0.0;
        }
        else {
            sithMoving = true;
            sithMoveXStep = 0.5;
        }
    }

    var posReached = false;
    var negReached = true;
    function animateSithMove(now) {
        var elapsed = now - g_last;
        if (sithMoving) {
            if (sithMoveX >= 1.2)
            {
                posReached = true;
                negReached = false;
            }

            if (sithMoveX <= 0) {
                negReached = true;
                posReached = false;
            }

            if (!posReached)
                sithMoveX += (sithMoveXStep * elapsed) / 1000.0;
            else if (!negReached)
                sithMoveX += (-sithMoveXStep * elapsed) / 1000.0;
        }
    }

    var sithArmBending = false;
    function bendSithArm() {
        if (sithArmBending)
            sithArmBending = false;
        else
            sithArmBending = true;
    }

    var sithArmAngle = 0.0;
    var sithArmStep = 60.0;
    function animateSithArm(now) {
        var elapsed = g_last - now;
        var newAngle = 0;
        if (sithArmBending) {
            if (sithArmAngle > 30.0 && sithArmStep > 0)
                sithArmStep = -sithArmStep;
            if (sithArmAngle < -70 && sithArmStep < 0)
                sithArmStep = -sithArmStep;
            newAngle = sithArmAngle + (sithArmStep * elapsed) / 1000.0;
        }
        sithArmAngle = newAngle;
    }


    function myKeyDown(ev, gl, u_ViewMatrix, viewMatrix) {
        //===============================================================================
        var xd = g_EyeX - g_AtX;
        var yd = g_EyeY - g_AtY;
        var zd = g_EyeZ - g_AtZ;

        var lxy = Math.sqrt(xd * xd + yd * yd);

        var l = Math.sqrt(xd * xd + yd * yd + zd * zd);


        switch (ev.keyCode) {      // keycodes !=ASCII, but are very consistent for 
            //  nearly all non-alphanumeric keys for nearly all keyboards in all countries.
            case 74:    // left-arrow key
                if (flag == -1) theta = -Math.acos(xd / lxy) + 0.1;
                else theta = theta + 0.1;
                g_AtX = g_EyeX + lxy * Math.cos(theta);
                g_AtY = g_EyeY + lxy * Math.sin(theta);
                flag = 1;
                break;
            case 73:    //i
                g_AtZ = g_AtZ + 0.1;
                break;
            case 76:    // right-arrow key
                if (flag == -1) theta = -Math.acos(xd / lxy) - 0.1;
                else theta = theta - 0.1;
                g_AtX = g_EyeX + lxy * Math.cos(theta);
                g_AtY = g_EyeY + lxy * Math.sin(theta);
                flag = 1;
                break;
            case 75:    // down-arrow key
                g_AtZ = g_AtZ - 0.1;
                break;

            case 87:    // w
                g_AtX = g_AtX - 0.1 * (xd / l);
                g_AtY = g_AtY - 0.1 * (yd / l);
                g_AtZ = g_AtZ - 0.1 * (zd / l);

                g_EyeX = g_EyeX - 0.1 * (xd / l);
                g_EyeY = g_EyeY - 0.1 * (yd / l);
                g_EyeZ = g_EyeZ - 0.1 * (zd / l);
                break;

            case 83:    // s
                g_AtX = g_AtX + 0.1 * (xd / l);
                g_AtY = g_AtY + 0.1 * (yd / l);
                g_AtZ = g_AtZ + 0.1 * (zd / l);

                g_EyeX = g_EyeX + 0.1 * (xd / l);
                g_EyeY = g_EyeY + 0.1 * (yd / l);
                g_EyeZ = g_EyeZ + 0.1 * (zd / l);

                break;

            case 68:    // a
                g_EyeX = g_EyeX - 0.1 * yd / lxy;
                g_EyeY = g_EyeY + 0.1 * xd / lxy;
                g_AtX -= 0.1 * yd / lxy;
                g_AtY += 0.1 * xd / lxy;

                break;
            case 65:    // d
                g_EyeX = g_EyeX + 0.1 * yd / lxy;
                g_EyeY = g_EyeY - 0.1 * xd / lxy;
                g_AtX += 0.1 * yd / lxy;
                g_AtY -= 0.1 * xd / lxy;

                break;

            case 32:
                moveSith();
                break;

            case 70:
                bendSithArm();
                break;

        }
    }
    function myKeyUp(ev) {
        //===============================================================================
        // Called when user releases ANY key on the keyboard; captures scancodes well

        console.log('myKeyUp()--keyCode=' + ev.keyCode + ' released.');
    }
    function myKeyPress(ev) {
        //===============================================================================
        // Best for capturing alphanumeric keys and key-combinations such as 
        // CTRL-C, alt-F, SHIFT-4, etc.
        console.log('myKeyPress():keyCode=' + ev.keyCode + ', charCode=' + ev.charCode +
                              ', shift=' + ev.shiftKey + ', ctrl=' + ev.ctrlKey +
                              ', altKey=' + ev.altKey +
                              ', metaKey(Command key or Windows key)=' + ev.metaKey);
    }


