// JavaScript source code
// Credits
// I received help and inspiration for my shaders from the following sources:
//      https://en.wikipedia.org/wiki/Blinn%E2%80%93Phong_shading_model
//          I used the algorithm here to implement Blinn-Phong shading with my already existing variables
// For materials, I used the numbers provided in materials_Ayerdi, but did not use the function calls, and manually wrote them in.



var VSHADER_SOURCE =
'precision highp float;\n' +
  'precision highp int;\n' +

  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +        // Normal

  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +    // Model matrix
  'uniform mat4 u_NormalMatrix;\n' +   // Coordinate transformation matrix of the normal

  //Material uniforms
  'uniform vec3 u_Ks;\n' +  //specular
  'uniform vec3 u_Ke;\n' +  //emissive
  'uniform vec3 u_Ka;\n' +  //ambience
  'uniform vec3 u_Kd; \n' + //diffuse
  'uniform int u_KShiny;\n' + //shinyness


  'uniform vec3 u_HeadlightDiffuse;\n' +
  'uniform vec3 u_HeadlightPosition;\n' +
  'uniform vec3 u_HeadlightSpecular;\n' +

  'uniform vec3 u_LightPosition;\n' +
  'uniform vec3 u_LightDirection;\n' +
  'uniform vec3 u_AmbientLight;\n' +
  'uniform vec3 u_LightDiffuse;\n' +

'varying vec4 v_Color;\n' +
'varying vec3 v_Normal;\n' +
'varying vec3 v_Position;\n' +
'varying vec3 v_Kd;\n' +


 'void main() {\n' +
      'gl_Position = u_ProjMatrix * u_ViewMatrix * a_Position;\n' +
      'v_Position = vec3(u_ViewMatrix * a_Position);\n' +
      'v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
      'v_Color = a_Color;\n' +
      'v_Kd = u_Kd; \n' +
'}\n';
            


var FSHADER_SOURCE =
'precision highp float;\n' +
  'precision highp int;\n' +

  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec3 v_Kd;\n' +

  //Uniforms
  'uniform vec3 u_eyePosWorld; \n' +

  //Material uniforms
  'uniform vec3 u_Ks;\n' +  //specular
  'uniform vec3 u_Ke;\n' +  //emissive
  'uniform vec3 u_Ka;\n' +  //ambience
  'uniform vec3 u_Kd; \n' + //diffuse
  'uniform int u_KShiny;\n' + //shinyness

  //Light uniforms
  'uniform vec3 u_LightDiffuseColor;\n' +     // Diffuse Light color
  'uniform vec3 u_LightPosition;\n' +  // Position of the light source
  'uniform vec3 u_AmbientLight;\n' +   // Ambient light
  'uniform vec3 u_Specular;\n' +

  //Headlight uniforms
  'uniform vec3 u_HeadlightDiffuse;\n' + 
  'uniform vec3 u_HeadlightPosition;\n' +  
  'uniform vec3 u_HeadlightSpecular;\n' +

  //Uniform to switch lighting modes
  'uniform int lightMode;\n' +
  'uniform int headlightOn;\n' +
  'uniform int worldLightOn;\n' +


'void main(){ \n' +
    'vec3 normal = normalize(v_Normal); \n' +
    'vec3 eyeDirection = normalize(u_eyePosWorld.xyz - v_Position); \n' +
    'vec3 lightDirection = normalize(u_LightPosition - v_Position);\n' +
    'vec3 hLightDirection = normalize(u_HeadlightPosition - v_Position);\n' +

    'float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
    'float nDotHl = max(dot(hLightDirection, normal),0.0);\n' +

    'vec3 H = normalize(lightDirection + eyeDirection); \n' +
    'float nDotH = max(dot(H, normal), 0.0); \n' +

	'float e02 = nDotH*nDotH; \n' +
	'float e04 = e02*e02; \n' +
	'float e08 = e04*e04; \n' +
	'float e16 = e08*e08; \n' +
	'float e32 = e16*e16; \n' +
	'float e64 = e32*e32; \n' +
    'vec3 emissive;\n' +
    'vec3 diffuse;\n' +
    'vec3 ambient;\n' +
    'vec3 specular;\n' +
    'vec3 hdiff;\n' +
    'vec3 hspec;\n' +

    'float shineF = float(u_KShiny);\n' +

    'emissive = u_Ke;\n' +
    'ambient = u_AmbientLight * u_Ka;\n' +
    'specular = u_Specular * u_Ks * e32;\n' +
    'diffuse = u_LightDiffuseColor * v_Kd * nDotL;\n' +

    'hdiff = u_HeadlightDiffuse * v_Kd * nDotHl;\n' +
    'hspec = u_HeadlightSpecular * u_Ks * e32;\n' +

    'vec4 fragWorld = vec4(emissive + diffuse + ambient + specular,1.0);\n' +
    'vec4 fragHead = vec4(hdiff + hspec,1.0);\n' +
    'vec4 frag;\n' +
    
    //Blinn-Phong
    'if(lightMode==2){\n' +
        'vec3 halfDirection = normalize(lightDirection);\n' +
        'float ang = max(dot(halfDirection, normal),0.0);\n' +
        'float spec = pow(ang, shineF);\n' +
        'fragWorld = vec4((ambient + emissive + nDotL*diffuse+spec*specular),1.0);\n' +

        'halfDirection = normalize(hLightDirection);\n' +
        'ang = max(dot(halfDirection, normal),0.0);\n' +
        'spec = pow(ang, shineF);\n' +

        'fragHead = vec4((ambient + nDotHl*hdiff+spec*hspec),1.0);\n' +
    '}\n' +

    //Mode 3
    'if(lightMode == 3){\n' +
        'specular = u_Specular * u_Ks * e02;\n' +
        'hspec = u_HeadlightSpecular * u_Ks * e02;\n' +
        'fragWorld = vec4((emissive +ambient + nDotL*diffuse + nDotH*specular),1.0);\n' +
        'fragHead = vec4((ambient + nDotHl*hdiff+specular*hspec),1.0);\n' +

    '}\n' +
    //Mode 4
    'if(lightMode == 4){\n' +
        'vec3 reflectionDirection = reflect(-lightDirection, normal);\n' +
        'float temp = pow(max(dot(reflectionDirection, eyeDirection), 0.0), 0.0);\n' +
        'vec3 spec = u_Specular * u_Ks * temp;\n' +
        'fragWorld = vec4((ambient + spec + diffuse*nDotL + emissive), 1.0);\n' +

        'reflectionDirection = reflect(-hLightDirection, normal);\n' +
        'temp = pow(max(dot(reflectionDirection, eyeDirection), 0.0), 0.0);\n' +
        'hspec = u_HeadlightSpecular * u_Ks * temp;\n' +
        'fragHead = vec4((ambient + hspec + hdiff*nDotHl*e64), 1.0);\n' +

   '}\n' +
    //headlight and world light determine
    'if(headlightOn == 1 && worldLightOn == 1){\n' +
        'frag = fragHead + fragWorld;\n' +
    '}\n' +
    'else if(headlightOn == 1 && worldLightOn == 0){\n' +
        'frag = fragHead;\n' +
    '}\n' +
    'else\n' +
        'frag = fragWorld;\n' +

    'gl_FragColor = frag;\n' +
'}';
/////GLOBAL VARIABLES//////

var floatsPerVertex = 6; //# of Float32Array used for each vertex

// MOUSE DRAG STUFF
var isDrag = false;		// mouse-drag: true when user holds down mouse button
var xMclik = 0.0;			// last mouse button-down position (in CVV coords)
var yMclik = 0.0;
var xMdragTot = 0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot = 0.0;

//Global canvas/gl things
var canvas;
var gl;


var r = 1;
var g = 1;
var b = 1;

var g_EyeX = 0, g_EyeY = 3.0, g_EyeZ = 3.00;
var g_AtX = 0.0, g_AtY = 0.0, g_AtZ = 0.0;

var theta = 0;

var flag = -1;

var u_LightMode;
var lMode = 1;
var maxModes = 4;

var u_ModelMatrix = false;
var u_ViewMatrix = false;
var u_ProjMatrix = false;
var u_NormalMatrix = false;
var u_HeadlightPosition;
var u_HeadlightDiffuse;
var u_HeadlightSpecular;
var u_LightDiffuseColor;
var u_LightPosition;
var u_AmbientLight;
var u_Specular;
var u_EyePosWorld;
var u_Ke;
var u_Ks;
var u_Ka;
var u_Kd;
var u_KShiny;



var viewMatrix = new Matrix4();
var projMatrix = new Matrix4();
var normalMatrix = new Matrix4();

var u_eyePosWorld = false;
//Light control
var headlightOn = true;
var worldLightOn = true;
var hlOn;
var wLOn;


//Variables for user adjusted aspects of world lights
var usrAmbiR = 0.5;
var usrAmbiG = 0.5;
var usrAmbiB = 0.5;
var usrDiffR = 0.2;
var usrDiffG = 0.6;
var usrDiffB = 0.7;
var usrSpecR = 1.0;
var usrSpecG = 0.8;
var usrSpecB = 1.0;
var usrPosX = -2.0;
var usrPosY = 2.0;
var usrPosZ = 5.0;

var currentAngle;
var ANGLE_STEP = 35.0;

var treeAngle;
var TREE_ANGLE_STEP = 15.0;

function main() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    // Get the rendering context for WebGL
    gl = getWebGLContext(canvas);
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
    gl.clearColor(0, 0, 0, 1);

    // Next, register all keyboard events found within our HTML webpage window:
    window.addEventListener("keydown", myKeyDown, false);
    window.addEventListener("keyup", myKeyUp, false);
    window.addEventListener("keypress", myKeyPress, false);

    //uniform matrices
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    u_eyePosWorld = gl.getUniformLocation(gl.program, 'u_eyePosWorld');

    u_LightMode = gl.getUniformLocation(gl.program, 'lightMode');


    u_HeadlightDiffuse = gl.getUniformLocation(gl.program, 'u_HeadlightDiffuse');
    u_HeadlightPosition = gl.getUniformLocation(gl.program, 'u_HeadlightPosition');
    u_HeadlightSpecular = gl.getUniformLocation(gl.program, 'u_HeadlightSpecular');
    u_LightDiffuseColor = gl.getUniformLocation(gl.program, 'u_LightDiffuseColor');
    u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
    u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    u_Specular = gl.getUniformLocation(gl.program, 'u_Specular');
    wLOn = gl.getUniformLocation(gl.program, 'worldLightOn');
    hlOn = gl.getUniformLocation(gl.program, 'headlightOn');

    u_Ke = gl.getUniformLocation(gl.program, 'u_Ke');
    u_Ks = gl.getUniformLocation(gl.program, 'u_Ks');
    u_Ka = gl.getUniformLocation(gl.program, 'u_Ka');
    u_Kd = gl.getUniformLocation(gl.program, 'u_Kd');
    u_KShiny = gl.getUniformLocation(gl.program, 'u_KShiny');
    gl.uniform3f(u_Ks, 1.0, 1.0, 1.0);
    gl.uniform3f(u_Ka, 0.6, 0.3, 0.3);
    gl.uniform3f(u_Kd, 0.3, 0.3, 0.3);


    
    gl.uniform3f(u_HeadlightDiffuse, 1.0, 1.0, 1.0);
    gl.uniform3f(u_HeadlightSpecular, 1.0, 1.0, 1.0);
    gl.uniform1i(wLOn, 1);
    gl.uniform1i(hlOn, 1);
    gl.uniform1i(u_LightMode, lMode);

    currentAngle = 0.0;
    treeAngle = 0.0;

    var tick = function () {
        canvas.width = innerWidth;
        canvas.height = innerHeight *0.75;
        gl.uniform1i(u_LightMode, lMode);
        userValues();
        gl.uniform3f(u_eyePosWorld, g_EyeX, g_EyeY, g_EyeZ);
        animateEverything();

        draw();

        requestAnimationFrame(tick, canvas);
    };
    tick();

}
function makeGroundGrid() {
    //==============================================================================
    // Create a list of vertices that create a large grid of lines in the x,y plane
    // centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

    var xcount = 200;     // # of lines to draw in x,y to make the grid.
    var ycount = 200;
    var xymax = 80.0;     // grid size; extends to cover +/-xymax in x and y.
    var xColr = Math.random()*0.5;  
    var yColr = Math.random() * 0.5; 

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
        gndVerts[j + 3] = xColr;     // red
        gndVerts[j + 4] = yColr;     // grn
        gndVerts[j + 5] = 1;     // blu
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
        gndVerts[j + 3] = xColr;     // red
        gndVerts[j + 4] = yColr;     // grn
        gndVerts[j + 5] = 1;     // blu
    }
}

function makeSphere() {
    //==============================================================================
    // Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
    // equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
    // and connect them as a 'stepped spiral' design (see makeCylinder) to build the
    // sphere from one triangle strip.
    var slices = 41;		// # of slices of the sphere along the z axis. >=3 req'd
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
            }
            else { 	// put odd# vertices around the slice's lower edge;
                // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
                // 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
                sphVerts[j] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts);		// x
                sphVerts[j + 1] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts);		// y
                sphVerts[j + 2] = cos1;			
            }
            if (s == 0) {	// finally, set some interesting colors for vertices:

                sphVerts[j + 3] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts);
                sphVerts[j + 4] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts);
                sphVerts[j + 5] = cos1;
            }
            else if (s == slices - 1) {
                sphVerts[j + 3] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts);
                sphVerts[j + 4] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts);
                sphVerts[j + 5] = cos1;
            }
            else {
                sphVerts[j + 3] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts);
                sphVerts[j + 4] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts);
                sphVerts[j + 5] = cos1;
            }

        }
    }
}

function makeTetrahedron() {
    var c30 = Math.sqrt(0.75);          // == cos(30deg) == sqrt(3) / 2
    var sq2 = Math.sqrt(2.0);
    var sq6 = Math.sqrt(6.0);

    tetVerts = new Float32Array([
    // Vertex coordinates(x,y,z,w) and color (R,G,B) for a new color tetrahedron:
    //    Apex on +z axis; equilateral triangle base at z=0
  /*  Nodes:
       0.0,  0.0, sq2, 1.0,     0.0,  0.0,  1.0,  // Node 0 (apex, +z axis;  blue)
       c30, -0.5, 0.0, 1.0,     1.0,  0.0,  0.0,  // Node 1 (base: lower rt; red)
       0.0,  1.0, 0.0, 1.0,     0.0,  1.0,  0.0,  // Node 2 (base: +y axis;  grn)
      -c30, -0.5, 0.0, 1.0,     1.0,  1.0,  1.0,  // Node 3 (base:lower lft; white)
  */
        // Face 0: (left side)  
       0.0, 0.0, sq2,  sq6, sq2, 1,// Node 0 (apex, +z axis;  blue)
       c30, -0.5, 0.0,  sq6, sq2, 1,// Node 1 (base: lower rt; red)
       0.0, 1.0, 0.0,  sq6, sq2, 1,// Node 2 (base: +y axis;  grn)
        // Face 1: (right side)
       0.0, 0.0, sq2,  -sq6, sq2, 1,// Node 0 (apex, +z axis;  blue)
       0.0, 1.0, 0.0,  -sq6, sq2, 1,// Node 2 (base: +y axis;  grn)
      -c30, -0.5, 0.0,  -sq6, sq2, 1,// Node 3 (base:lower lft; white)
        // Face 2: (lower side)
       0.0, 0.0, sq2,  0, -2 * sq2, 1,// Node 0 (apex, +z axis;  blue) 
      -c30, -0.5, 0.0,  0, -2 * sq2, 1,// Node 3 (base:lower lft; white)
       c30, -0.5, 0.0,  0, -2 * sq2, 1,// Node 1 (base: lower rt; red) 
        // Face 3: (base side)  
      -c30, -0.5, 0.0,  0, 0, -1,// Node 3 (base:lower lft; white)
       0.0, 1.0, 0.0,  0, 0, -1,// Node 2 (base: +y axis;  grn)
       c30, -0.5, 0.0,  0, 0, -1,// Node 1 (base: lower rt; red)

    ]);
}

function makeCube() {

    cubVerts = new Float32Array([
    // Vertex coordinates(x,y,z,w) and color (R,G,B) for a color tetrahedron:
    //    Apex on +z axis; equilateral triangle base at z=0

      // +x face: RED
       1.0, -0.0, -0.2,  1, 0, 0,// Node 3
       1.0, 2.0, -0.2, 1, 0, 0,// Node 2
       1.0, 2.0, 0.2, 1, 0, 0,// Node 4

       1.0, 2.0, 0.2, 1, 0, 0,// Node 4
       1.0, -0.0, 0.2, 1, 0, 0,// Node 7
       1.0, -0.0, -0.2, 1, 0, 0,// Node 3

      // +y face: GREEN
      -1.0, 2.0, -0.2, 0, 1, 0,// Node 1
      -1.0, 2.0, 0.2, 0, 1, 0,// Node 5
       1.0, 2.0, 0.2, 0, 1, 0,// Node 4

       1.0, 2.0, 0.2, 0, 1, 0,// Node 4
       1.0, 2.0, -0.2, 0, 1, 0,// Node 2 
      -1.0, 2.0, -0.2, 0, 1, 0,// Node 1

      // +z face: BLUE
      -1.0, 2.0, 0.2, 0, 0, 1,// Node 5
      -1.0, -0.0, 0.2, 0, 0, 1,// Node 6
       1.0, -0.0, 0.2, 0, 0, 1,// Node 7

       1.0, -0.0, 0.2, 0, 0, 1,// Node 7
       1.0, 2.0, 0.2,  0, 0, 1,// Node 4
      -1.0, 2.0, 0.2,  0, 0, 1,// Node 5

      // -x face: CYAN
      -1.0, -0.0, 0.2,-1, 0, 0,// Node 6 
      -1.0, 2.0, 0.2,  -1, 0, 0,// Node 5 
      -1.0, 2.0, -0.2, -1, 0, 0,// Node 1

      -1.0, 2.0, -0.2, -1, 0, 0,// Node 1
      -1.0, -0.0, -0.2, -1, 0, 0,// Node 0  
      -1.0, -0.0, 0.2, -1, 0, 0,// Node 6  

      // -y face: MAGENTA
       1.0, -0.0, -0.2, 0, -1, 0,// Node 3
       1.0, -0.0, 0.2, 0, -1, 0,// Node 7
      -1.0, -0.0, 0.2, 0, -1, 0,// Node 6

      -1.0, -0.0, 0.2, 0, -1, 0,// Node 6
      -1.0, -0.0, -0.2, 0, -1, 0,// Node 0
       1.0, -0.0, -0.2, 0, -1, 0,// Node 3

       // -z face: YELLOW
       1.0, 2.0, -0.2, 0, 0, -1,// Node 2
       1.0, -0.0, -0.2, 0, 0, -1,// Node 3
      -1.0, -0.0, -0.2,0, 0, -1,// Node 0   

      -1.0, -0.0, -0.2, 0, 0, -1,// Node 0
      -1.0, 2.0, -0.2,  0, 0, -1,// Node 1
       1.0, 2.0, -0.2,  0, 0, -1,// Node 2

    ]);

}

function initVertexBuffers(gl) {
    makeGroundGrid();
    makeSphere();
    makeTetrahedron();
    makeCube();

    mySize = gndVerts.length + sphVerts.length + tetVerts.length + cubVerts.length;

    var nn = mySize / floatsPerVertex;
    console.log('nn is', nn, 'mySize is', mySize, 'floatsPerVertex is', floatsPerVertex);

    var vertices = new Float32Array(mySize);
    //Store the ground plane first
    gndStart = 0;
    for (i = 0, j = 0; j < gndVerts.length; i++, j++) {
        vertices[i] = gndVerts[j];
    }
    //Store the sphere
    sphereStart = i;
    for (j = 0; j < sphVerts.length; i++, j++) {
        vertices[i] = sphVerts[j];
    }
    //Store the sphere
    tetrahedronStart = i;
    for (j = 0; j < tetVerts.length; i++, j++) {
        vertices[i] = tetVerts[j];
    }

    cubeStart = i;
    for (j = 0; j < cubVerts.length; i++, j++) {
        vertices[i] = cubVerts[j];
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
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * floatsPerVertex, 0);
    gl.enableVertexAttribArray(a_Position);
    // Assign the buffer object to a_Color and enable the assignment

    var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
        console.log('Failed to get the storage location of a_Normal');
        return -1;
    }
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    gl.enableVertexAttribArray(a_Normal);

    return mySize / floatsPerVertex;	// return # of vertices
}

function draw() {

    // Clear <canvas> color AND DEPTH buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    //Set the lights
    if (headlightOn) {
        //Set the position of headlight and uniform
        gl.uniform3f(u_HeadlightPosition, g_EyeX, g_EyeY, g_EyeZ);
        gl.uniform1i(hlOn, 1);
    }
    else {
        gl.uniform1i(hlOn, 0);
    }

    if (worldLightOn) {
        gl.uniform1i(wLOn, 1);
        gl.uniform3f(u_AmbientLight, usrAmbiR, usrAmbiG, usrAmbiB);
        gl.uniform3f(u_LightDiffuseColor, usrDiffR, usrDiffG, usrDiffB);
        gl.uniform3f(u_Specular, usrSpecR, usrSpecG, usrSpecB);
        gl.uniform3f(u_LightPosition, usrPosX, usrPosY, usrPosZ);
    }
    else {
        gl.uniform1i(wLOn, 0);
        gl.uniform3f(u_AmbientLight, 0,0,0);
        gl.uniform3f(u_LightDiffuseColor, 0,0,0);
        gl.uniform3f(u_Specular, 0,0,0);
        gl.uniform3f(u_LightPosition, 0,0,0);
    }

    //projMatrix.setPerspective(40, 1, 1, 100);
    
    // Send this matrix to our Vertex and Fragment shaders through the
    // 'uniform' variable u_ProjMatrix:
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
    // Draw in the SECOND of several 'viewports'
    //------------------------------------------
    /*gl.viewport(0,        // Viewport lower-left corner
                0,                              // location(in pixels)
                canvas.width,        // viewport width, height.
                canvas.height);*/

    //----------------------Create, fill UPPER viewport------------------------
    gl.viewport(0,											 				// Viewport lower-left corner
							0, 			// location(in pixels)
  						canvas.width, 					// viewport width,
  						canvas.height);			// viewport height in pixels.

    var vpAspect = canvas.width /			// On-screen aspect ratio for
								(canvas.height);		// this camera: width/height.

    // For this viewport, set camera's eye point and the viewing volume:
    projMatrix.setPerspective(40, 				// fovy: y-axis field-of-view in degrees 	
                                                                          // (top <-> bottom in view frustum)
                                                      vpAspect, // aspect ratio: width/height
                                                      1, 100);	// near, far (always >0)





    // but use a different 'view' matrix:
    viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ, // eye position
                        g_AtX, g_AtY, g_AtZ,                  // look-at point 
                        0, 0, 1);                 // up vector

    

    // Pass the view projection matrix to our shaders:
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniform3f(u_HeadlightPosition, g_EyeX, g_EyeY, g_EyeZ);


    drawMyScene();
}

function drawMyScene() {
    viewMatrix.scale(0.2, 0.2, 0.2);

    pushMatrix(viewMatrix);
    pushMatrix(viewMatrix);
    pushMatrix(viewMatrix);
    pushMatrix(viewMatrix);
    pushMatrix(viewMatrix);

    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.19225, 0.19225, 0.19225);
    gl.uniform3f(u_Kd, 0.50754, 0.50754, 0.507543);
    gl.uniform3f(u_Ks, 0.508273, 0.508273, 0.508273);

    normalMatrix.setInverseOf(viewMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    // shrink the drawing axes 
    //for nicer-looking ground-plane, and
    // Pass the modified view matrix to our shaders:

    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    // Now, using these drawing axes, draw our ground plane: 
    gl.drawArrays(gl.LINES,             // use this drawing primitive, and
                  gndStart / floatsPerVertex, // start at this vertex number, and
                  gndVerts.length / floatsPerVertex);   // draw this many vertices

    viewMatrix = popMatrix();

    //Sphere 1
    viewMatrix.translate(-1, 0.0, 2);
    
    viewMatrix.rotate(currentAngle, 0, 0, 1);
    //viewMatrix.rotate(-currentAngle, 0, 1, 0);
    pushMatrix(viewMatrix);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    normalMatrix.setInverseOf(viewMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    //Material stuff for sphere 1   
    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.05, 0.05, 0.05);
    gl.uniform3f(u_Kd, 0.0, 0.2, 0.6);
    gl.uniform3f(u_Ks,0.1,     0.2,    0.3);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphereStart / floatsPerVertex, sphVerts.length / floatsPerVertex);

    //Sphere 1.2
    viewMatrix = popMatrix();
    viewMatrix.translate(.5, 1, 2);
    viewMatrix.scale(.45, .45, .45);
    viewMatrix.rotate(currentAngle, 0, 1, 0);
    
    pushMatrix(viewMatrix);
    viewMatrix.rotate(currentAngle, 1, 0, 1);
    
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    normalMatrix.setInverseOf(viewMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    //Material stuff for sphere 1.2
    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.329412, 0.223529, 0.027451);
    gl.uniform3f(u_Kd, 0.780392, 0.568627, 0.113725);
    gl.uniform3f(u_Ks, 0.992157, 0.941176, 0.807843);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphereStart / floatsPerVertex, sphVerts.length / floatsPerVertex);

    //Sphere 1.3
    viewMatrix = popMatrix();
    viewMatrix.translate(-.5, -1, 1);
    viewMatrix.scale(.5, .5, .5);
    viewMatrix.rotate(45, 0, 0, 1);
    viewMatrix.rotate(-currentAngle * 2, 1, 1, 0);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    normalMatrix.setInverseOf(viewMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    //Material stuff for sphere 1.3
    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.105882, 0.058824, 0.113725);
    gl.uniform3f(u_Kd, 0.427451, 0.470588, 0.541176);
    gl.uniform3f(u_Ks, 0.333333, 0.333333, 0.521569);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphereStart / floatsPerVertex, sphVerts.length / floatsPerVertex);

    
    //Tetrahedron
    viewMatrix = popMatrix();
    viewMatrix.translate(-5, 0, 0.5);
    viewMatrix.rotate(currentAngle, 0, 0, 1);
    pushMatrix(viewMatrix);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    normalMatrix.setInverseOf(viewMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    //Material stuff for tetraheadron
    //Emerald
    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.0215, 0.1745, 0.0215);
    gl.uniform3f(u_Kd, 0.07568, 0.61424, 0.07568);
    gl.uniform3f(u_Ks, 0.633, 0.727811, 0.633);
    gl.uniform1i(u_KShiny, 76.8);
    gl.drawArrays(gl.TRIANGLES, tetrahedronStart / floatsPerVertex, tetVerts.length / floatsPerVertex);


    //Tet 2
    viewMatrix = popMatrix();
    viewMatrix.translate(0, 0, 1.75);
    viewMatrix.scale(.5, .5, .5);
    viewMatrix.rotate(treeAngle * 1.75, 0, 1, 0);
    pushMatrix(viewMatrix);
    pushMatrix(viewMatrix);
    pushMatrix(viewMatrix);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    normalMatrix.setInverseOf(viewMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    //Material stuff for tetraheadron
    //Emerald
    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.05375, 0.05, 0.06625);
    gl.uniform3f(u_Kd, 0.18275, 0.17, 0.22525);
    gl.uniform3f(u_Ks, 0.332741, 0.328634, 0.346435);
    gl.uniform1i(u_KShiny, 38.4);
    gl.drawArrays(gl.TRIANGLES, tetrahedronStart / floatsPerVertex, tetVerts.length / floatsPerVertex);

    //Tet 3
    viewMatrix = popMatrix();
    viewMatrix.translate(0, 0, 2);
    viewMatrix.scale(.5, .5, .5);
    viewMatrix.rotate(treeAngle * -3, 1, 0, 0);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    normalMatrix.setInverseOf(viewMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    //Material stuff for tetraheadron
    //Emerald
    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.0215, 0.1745, 0.0215);
    gl.uniform3f(u_Kd, 0.07568, 0.61424, 0.07568);
    gl.uniform3f(u_Ks, 0.633, 0.727811, 0.633);
    gl.uniform1i(u_KShiny, 76.8);
    gl.drawArrays(gl.TRIANGLES, tetrahedronStart / floatsPerVertex, tetVerts.length / floatsPerVertex);

    //Tet 4
    viewMatrix = popMatrix();
    viewMatrix.translate(0, 2, 0);
    viewMatrix.scale(.5, .5, .5);
    viewMatrix.rotate(currentAngle, 0, 0, 1);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    normalMatrix.setInverseOf(viewMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    //Material stuff for tetraheadron
    //Chrome
    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.25, 0.25, 0.25);
    gl.uniform3f(u_Kd, 0.4, 0.4, 0.4);
    gl.uniform3f(u_Ks, 0.774597, 0.774597, 0.774597);
    gl.uniform1i(u_KShiny, 76.8);
    gl.drawArrays(gl.TRIANGLES, tetrahedronStart / floatsPerVertex, tetVerts.length / floatsPerVertex);

    //Tet 5
    viewMatrix = popMatrix();
    viewMatrix.translate(0, -2, 0);
    viewMatrix.scale(.5, .5, .5);
    viewMatrix.rotate(currentAngle, 0, 0, 1);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    normalMatrix.setInverseOf(viewMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    //Material stuff for tetraheadron
    //Chrome
    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.25, 0.25, 0.25);
    gl.uniform3f(u_Kd, 0.4, 0.4, 0.4);
    gl.uniform3f(u_Ks, 0.774597, 0.774597, 0.774597);
    gl.uniform1i(u_KShiny, 76.8);
    gl.drawArrays(gl.TRIANGLES, tetrahedronStart / floatsPerVertex, tetVerts.length / floatsPerVertex);

    //Sun*/
    viewMatrix = popMatrix();
    viewMatrix.translate(-4, -5, 2);
    viewMatrix.rotate(currentAngle * 0.3, 0, 0, 1);
    viewMatrix.scale(2,2,2);
    
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    normalMatrix.setInverseOf(viewMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    //Material stuff for sun
    //Gold shiny
    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka,0.24725,  0.2245,   0.0645);
    gl.uniform3f(u_Kd, 0.34615,  0.3143,   0.0903);
    gl.uniform3f(u_Ks, 0.797357, 0.723991, 0.208006);
    gl.uniform1i(u_KShiny, 83.2);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphereStart / floatsPerVertex, sphVerts.length / floatsPerVertex);

    //Sphere Tree Bud 0
    viewMatrix = popMatrix();
    viewMatrix.translate(2, -2, 1);
    viewMatrix.scale(.5, .5, .5);

    viewMatrix.rotate(treeAngle, 1, 1, 0);
    pushMatrix(viewMatrix);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    normalMatrix.setInverseOf(viewMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    //Material stuff for bud 0
    //Emerald
    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.0215, 0.1745, 0.0215);
    gl.uniform3f(u_Kd, 0.07568, 0.61424, 0.07568);
    gl.uniform3f(u_Ks, 0.633, 0.727811, 0.633);
    gl.uniform1i(u_KShiny, 76.8);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphereStart / floatsPerVertex, sphVerts.length / floatsPerVertex);


    //Sphere Tree Bud 1
    viewMatrix = popMatrix();
    viewMatrix.translate(0, 0, 2);
    viewMatrix.scale(.75, .75, .75);
    viewMatrix.rotate(treeAngle, 1, 1, 0);
    pushMatrix(viewMatrix);

    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    normalMatrix.setInverseOf(viewMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    //Material stuff for bud 1
    //Turqoise
    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.1, 0.18725, 0.1745);
    gl.uniform3f(u_Kd, 0.396, 0.74151, 0.69102);
    gl.uniform3f(u_Ks, 0.297254, 0.30829, 0.306678);
    gl.uniform1i(u_KShiny, 12.8);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphereStart / floatsPerVertex, sphVerts.length / floatsPerVertex);

    //Sphere Tree Bud 2
    viewMatrix = popMatrix();
    viewMatrix.translate(0, 0, 2);
    viewMatrix.scale(.75, .75, .75);
    viewMatrix.rotate(treeAngle *2.0, 0, 1, 0);

    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    normalMatrix.setInverseOf(viewMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    //Material stuff for bud 2
    //Ruby
    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.1745, 0.01175, 0.01175);
    gl.uniform3f(u_Kd, 0.61424, 0.04136, 0.04136);
    gl.uniform3f(u_Ks, 0.727811, 0.626959, 0.626959);
    gl.uniform1i(u_KShiny, 76.8);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphereStart / floatsPerVertex, sphVerts.length / floatsPerVertex);


    //Cube
    viewMatrix = popMatrix();
    viewMatrix.translate(3, 3, 0);
    viewMatrix.rotate(currentAngle, 0, 0, 1);
    pushMatrix(viewMatrix);
    viewMatrix.scale(0.5, 0.5, 1);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    normalMatrix.setInverseOf(viewMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    //Material stuff for Cube 1
    //Ruby
    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.1745, 0.01175, 0.01175);
    gl.uniform3f(u_Kd, 0.61424, 0.04136, 0.04136);
    gl.uniform3f(u_Ks, 0.727811, 0.626959, 0.626959);
    gl.uniform1i(u_KShiny, 76.8);
    gl.drawArrays(gl.TRIANGLES, cubeStart / floatsPerVertex, cubVerts.length / floatsPerVertex);
    //Cube 2
    viewMatrix = popMatrix();
    viewMatrix.translate(0, .5, 1.5);
    viewMatrix.rotate(-currentAngle*2, 0, 0, 1);
    viewMatrix.scale(.5, .5, 2);

    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

    normalMatrix.setInverseOf(viewMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    //Material stuff for cube 2
    //Ruby
    gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);
    gl.uniform3f(u_Ka, 0.1745, 0.01175, 0.01175);
    gl.uniform3f(u_Kd, 0.61424, 0.04136, 0.04136);
    gl.uniform3f(u_Ks, 0.727811, 0.626959, 0.626959);
    gl.uniform1i(u_KShiny, 76.8);
    gl.drawArrays(gl.TRIANGLES, cubeStart / floatsPerVertex, cubVerts.length / floatsPerVertex);



}

function myKeyDown(ev) {
    //===============================================================================
    var xd = g_EyeX - g_AtX;
    var yd = g_EyeY - g_AtY;
    var zd = g_EyeZ - g_AtZ;

    var lxy = Math.sqrt(xd * xd + yd * yd);

    var l = Math.sqrt(xd * xd + yd * yd + zd * zd);


    switch (ev.keyCode) {      // keycodes !=ASCII, but are very consistent for 
        //  nearly all non-alphanumeric keys for nearly all keyboards in all countries.
        case 74:    // j
            if (flag == -1) theta = -Math.acos(xd / lxy) + 0.1;
            else theta = theta + 0.1;
            g_AtX = g_EyeX + lxy * Math.cos(theta);
            g_AtY = g_EyeY + lxy * Math.sin(theta);
            flag = 1;
            break;
        case 73:    //i
            g_AtZ = g_AtZ + 0.1;
            break;
        case 76:    // l
            if (flag == -1) theta = -Math.acos(xd / lxy) - 0.1;
            else theta = theta - 0.1;
            g_AtX = g_EyeX + lxy * Math.cos(theta);
            g_AtY = g_EyeY + lxy * Math.sin(theta);
            flag = 1;
            break;
        case 75:    // k
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
        case 72:    //h
            if (headlightOn)
                headlightOn = false;
            else
                headlightOn = true;
            break;

        case 32: //spacebar
            if (worldLightOn)
                worldLightOn = false;
            else
                worldLightOn = true;
            break;

        case 77: //m
            switchModes();
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

var g_last = Date.now();
function animateEverything() {
    //==============================================================================
    // Calculate the elapsed time
    var now = Date.now();
    var elapsed = now - g_last;
    g_last = now;

    currentAngle = currentAngle + (ANGLE_STEP * elapsed) / 1000.0;
    currentAngle %= 360;

    if (treeAngle > 30.0 && TREE_ANGLE_STEP > 0) TREE_ANGLE_STEP = -TREE_ANGLE_STEP;
    if (treeAngle < -65.0 && TREE_ANGLE_STEP < 0) TREE_ANGLE_STEP = -TREE_ANGLE_STEP;
    var newAngle = treeAngle + (TREE_ANGLE_STEP * elapsed) / 1000.0;
    treeAngle = newAngle %= 360;
}

function switchModes() {
    if (lMode == maxModes) {
        lMode = 1;
    }
    else
        lMode++;


    document.getElementById("lMode").innerHTML = "Light Mode: " + lMode;
}

function userValues() {
    var ar, ag, ab, dr, dg, db, sr, sg, sb, px, py, px;

    ar = document.getElementById("AR").value;
    if (isNaN(ar))
    {
        ar = usrAmbiR
        }
    ag = document.getElementById("AG").value;
    if (isNaN(ag))
    {
        ag = usrAmbiG;
    }
    ab = document.getElementById("AB").value;
    if (isNaN(ab)) {
        ab = usrAmbiB
    }
    dr = document.getElementById("DR").value;
    if (isNaN(dr)) {
        dr = usrDiffR;
    }
    dg = document.getElementById("DG").value;
    if (isNaN(dg)) {
        dg = usrDiffG;
    }
    db = document.getElementById("DB").value;
    if (isNaN(db)) {
        db = usrDiffB;
    }
    sr = document.getElementById("SR").value;
    if (isNaN(sr)) {
        sr = usrSpecR;
    }
    sg = document.getElementById("SG").value;
    if (isNaN(sg)) {
        sg = usrSpecG;
    }
    sb = document.getElementById("SB").value;
    if (isNaN(sb)) {
        sb = usrSpecB;
    }
    px = document.getElementById("PX").value;
    if (isNaN(px)) {
        px = usrPosX;
    }
    py = document.getElementById("PY").value;
    if (isNaN(py)) {
        py = usrPosY;
    }
    pz = document.getElementById("PZ").value;
    if (isNaN(pz)) {
        pz = usrPosZ;
    }
    usrAmbiR = ar;
    usrAmbiG = ag;
    usrAmbiB = ab;
    usrDiffR = dr;
    usrDiffG = dg;
    usrDiffB = db;
    usrSpecR = sr;
    usrSpecG = sg;
    usrSpecB = sb;
    usrPosX =  px;
    usrPosY = py;
    usrPosZ = pz;
    
}
