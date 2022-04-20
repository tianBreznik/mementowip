import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { PixelShader } from 'three/examples/jsm/shaders/PixelShader.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

import {
    BufferAttribute,
    BufferGeometry,
} from "three"
let renderer, scene, camera, stats, width, height, buff_geometry, canvas, composer, gui;
let p_positions;
let colors;
var dat_es;
var controls;
let particles;
let parentTransform;
const PARTICLE_SIZE = 20;
let raycaster, intersects, intersects_lines, date_dictionary;
let pointer, INTERSECTED;
width = window.innerWidth;
height = window.innerHeight;

var tw_text = [];
var user_name = [];
var user_pfp = [];
var auth_name = [];
var user_desc = [];
var like_cnt = [];
var retw_cnt = [];
var rply_cnt = [];
var conv_ids = [];

var mouseX = 0, mouseY = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
let pixelPass, params;
const perlin = new ImprovedNoise();


init();
animate();

function updateGUI() {

    pixelPass.uniforms[ 'pixelSize' ].value = params.pixelSize;

}

async function loadFileAndPrintToConsole(url) {
    try {
      const response = await fetch(url);
      var data =  response.text();
      //console.log(data);
      return data;
    } catch (err) {
      //console.error(err);
      return '';
    }
}

function init() {
	const container = document.getElementById( 'container' );
    //const ctx = container.getContext('2d');
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.z = height;

    var dat_es = loadJSON('sorted_blm_10_minmin_w_pic.json');
    
    //load date lookup table
    date_dictionary = new Map();
    var dict_str = loadTextFileAjaxSync('lookup_date.csv', "application/csv");
    console.log(dict_str)


    dict_str.split("\n").forEach(line => {
        const [key, val] = line.split(",");
        date_dictionary.set(key, val);   
    });

    console.log(date_dictionary.get('20')); // value2
    
    const duplicateIds = dat_es
        .map(v => v.conversation_id)
        .filter((v, i, vIds) => vIds.indexOf(v) !== i);

    var lines = {};
    var lines_colors = {};
    lines.keys = duplicateIds;
    lines_colors.keys = duplicateIds
    //console.log(lines['984588315327385600']); 
    //lines['984588315327385600'] = [new THREE.Vector3(1,1,1)];
    //console.log(lines['984588315327385600']);
    //console.log(lines);

    const axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );

    p_positions = new Float32Array(dat_es.length * 3);
    colors = new Float32Array(dat_es.length * 3);
    for (let i = 0; i < dat_es.length; i++) {
        //(dat_es.float_minute)
        //x
        p_positions[i * 3] =  (((dat_es[i].float_minute + (Math.random() - 0.5) * 2)/60) * 2 -1) * width;
        //y
        p_positions[i * 3 + 1] = ((dat_es[i].float_hour/24.0) * 2 - 1) + (Math.random() - 0.5) * 500;
        //z
        p_positions[i * 3 + 2] = ((dat_es[i].date_nr/365) * 2 - 1) * height;

        colors[i * 3 + 0] = Math.random();
        colors[i * 3 + 1] = Math.random();
        colors[i * 3 + 2] = Math.random();

        var line_pos = new THREE.Vector3(p_positions[i*3], p_positions[i*3+1],p_positions[i*3+2]);
        var col_pos = new THREE.Vector3(colors[i*3], colors[i*3 + 1], colors[i*3 + 2]);

        if(duplicateIds.includes(dat_es[i].conversation_id)){
            if (lines[dat_es[i].conversation_id]) {
                lines[dat_es[i].conversation_id].push(line_pos);
                lines_colors[dat_es[i].conversation_id].push(col_pos);
            } else {
                lines[dat_es[i].conversation_id] = [line_pos];
                lines_colors[dat_es[i].conversation_id] = [col_pos];
            }
        }
    }

    //randomize sprite colors
	buff_geometry = new BufferGeometry()
    buff_geometry.setAttribute('position', new BufferAttribute(p_positions, 3))			
	const positionAttribute = buff_geometry.getAttribute( 'position' );

    //const colors = [];
	const sizes = [];
	
    //const tw_urls = [];

    //console.log(dat_es.conversation_id)

	for ( let i = 0, l = positionAttribute.count; i < l; i ++ ) {
        //var color = new THREE.Color();
        //color.setHSL( Math.random() * 0xffffff );
		//color.toArray( colors, i * 3 );
		sizes[ i ] = PARTICLE_SIZE * 0.5;
        tw_text[ i ] = dat_es[ i ].text;
        user_name[ i ] = dat_es[ i ]['author.username'];
        user_pfp[ i ] = dat_es[ i ]['author.profile_image_url'];
        auth_name[ i ] = dat_es[ i ]['author.name'];
        user_desc[ i ] = dat_es[ i ]['author.description'];
        like_cnt[ i ] = dat_es[ i ]['public_metrics.like_count'];
        retw_cnt[ i ] = dat_es[ i ]['public_metrics.retweet_count'];
        rply_cnt[ i ] = dat_es[ i ]['public_metrics.reply_count'];
        conv_ids[ i ] = dat_es[ i ].conversation_id;

	}
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute('position', positionAttribute );
	geometry.setAttribute('customColor', new THREE.Float32BufferAttribute( colors, 3 ) );
	geometry.setAttribute('size', new THREE.Float32BufferAttribute( sizes, 1 ) );
    geometry.setAttribute('likes', new THREE.Float32BufferAttribute(like_cnt, 1));
    geometry.setAttribute('retweets', new THREE.Float32BufferAttribute(retw_cnt, 1));
    geometry.setAttribute('replies', new THREE.Float32BufferAttribute(rply_cnt, 1));
    geometry.setAttribute('conversation_id', new THREE.Float32BufferAttribute(conv_ids, 1));

				
	const material = new THREE.ShaderMaterial( {
		uniforms: {
			color: { value: new THREE.Color( 0xffffff ) },
			pointTexture: { value: new THREE.TextureLoader().load( 'textures/disc.png' ) },
			alphaTest: { value: 0.9 }
		},
		vertexShader: document.getElementById( 'vertexshader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentshader' ).textContent
	});

	particles = new THREE.Points( geometry, material );
	scene.add( particles );
	//lines
    parentTransform = new THREE.Object3D();
    for(var key in lines){

        if(key == 'keys')
        {
            continue;
        }

        var len = lines[key].length;
        var new_noise = new Array(2*len - 1);
        
        var dummy_vec = new THREE.Vector3();
        for(let i=0; i<len;i++){
            new_noise[i*2] = lines[key][i];
        }

        
        for(let j=1; j<new_noise.length - 1; j+=2){
            //console.log(j);
            dummy_vec.addVectors(new_noise[j-1], new_noise[j+1]);
            dummy_vec = dummy_vec.multiplyScalar(0.5);
            new_noise[j] = new THREE.Vector3(
                     dummy_vec.x + 100*perlin.noise(dummy_vec.x, dummy_vec.y, dummy_vec.z)+ Math.random()*50,
                     dummy_vec.y + 100*perlin.noise(dummy_vec.x, dummy_vec.y, dummy_vec.z) + Math.random()* 10,
                     dummy_vec.z + 100*perlin.noise(dummy_vec.x, dummy_vec.y, dummy_vec.z) + Math.random()*10
                );
        }
        //console.log(new_noise);

        //curves not lines
        const curve = new THREE.CatmullRomCurve3(
            new_noise
        );

        var les_points = curve.getPoints( 1000 );
        //var perlined_points = interfill_w_noise(curr_vall);
        var line_geometry = new THREE.BufferGeometry().setFromPoints(les_points);
        var line = new MeshLine();
        line.setGeometry(line_geometry);

        var line_col = 'rgb(' + parseInt(lines_colors[key][0].x*255) + ',' + parseInt(lines_colors[key][0].y*255) + ',' + parseInt(lines_colors[key][0].z*255) + ')';
        //console.log(line_col)
        var line_material = new MeshLineMaterial({color: new THREE.Color(line_col), lineWidth:0.8, opacity:0.6});
        var mesh = new THREE.Mesh(line.geometry, line_material);
        //mesh.raycast = MeshLineRaycast;
        parentTransform.add( mesh );
        //scene.add(mesh);   
    }
    scene.add( parentTransform );

	renderer = new THREE.WebGLRenderer({
        precision: 'highp',
        antialias: true,
        alpha: true
    });
    canvas = renderer.domElement;
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0xffffff, 0);
	container.appendChild( renderer.domElement );
	//
	raycaster = new THREE.Raycaster();
	pointer = new THREE.Vector2();
	//

	//stats = new Stats();
	//container.appendChild( stats.dom );
	//
	window.addEventListener( 'resize', onWindowResize );
	document.addEventListener( 'pointermove', onPointerMove );

    params = {
        pixelSize: 3,
        postprocessing: true
    };
    gui = new GUI();
    gui.add( params, 'pixelSize' ).min( 2 ).max( 32 ).step( 2 );
    gui.add( params, 'postprocessing' );

    composer = new EffectComposer( renderer );
    composer.addPass( new RenderPass( scene, camera ) );

    pixelPass = new ShaderPass( PixelShader );
    pixelPass.uniforms[ 'resolution' ].value = new THREE.Vector2( window.innerWidth, window.innerHeight );
    pixelPass.uniforms[ 'resolution' ].value.multiplyScalar( window.devicePixelRatio );
    pixelPass.uniforms[ 'pixelSize' ].value = 1;
    composer.addPass( pixelPass );
    //document.addEventListener( 'mousemove', onDocumentMouseMove, false );

    //controls = new OrbitControls( camera, renderer.domElement );
    controls = new TrackballControls( camera, renderer.domElement );
    //controls.enableDamping = true;
    //controls.dampingFactor = 0.25;
    //controls.enableZoom = true;
    //controls.autoRotate = true;
}


function filterById(jsonObject, id) {
    return jsonObject.filter(function(jsonObject) {
        return (jsonObject['conversation_id'] == id);
    });
}

// function interfill_w_noise(valls){

// }

function onPointerMove( event ) {
	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    //pop up
    const geometry = particles.geometry;
	const attributes = geometry.attributes;


	raycaster.setFromCamera( pointer, camera );
	intersects = raycaster.intersectObject( particles );
    //intersects_lines = raycaster.intersectObjects( parentTransform.children, true )

    
	if ( intersects.length > 0 ) {

        intersects = intersects.sort( function( a, b ) {
            return a.distanceToRay - b.distanceToRay;
        });
        // if(intersects_lines.length > 0){
        //     intersects_lines = intersects_lines.sort( function( a, b ) {
        //         return a.distanceToRay - b.distanceToRay;
        //     });
        //     var line = intersects_lines[ 0 ];
        //     console.log(line);
        //     line.object.material.linewidth = 5.5;
        // }
        var particle = intersects[ 0 ];


        //console.log( 'got a click on particle', user_name[ particle.index ]);
    
        var glue_vec = new THREE.Vector3(
            attributes.position.array[ particle.index * 3 ],
            attributes.position.array[ particle.index * 3 + 1],
            attributes.position.array[ particle.index * 3 + 2]
        );
    
        glue_vec.project(camera);
    
        glue_vec.x = Math.round((0.5 + glue_vec.x / 2) * (canvas.width / window.devicePixelRatio));
        glue_vec.y = Math.round((0.5 - glue_vec.y / 2) * (canvas.height / window.devicePixelRatio));
    
        const annotation = document.querySelector('.annotation');
        annotation.children[0].lastChild.firstChild.innerHTML = "<strong>" + user_name[ particle.index ] + "</strong> |  ";
        annotation.children[0].lastChild.firstChild.style.color = "#" + Math.floor(Math.random()*16777215).toString(16);
        annotation.style.top = `${glue_vec.y}px`;
        annotation.style.left = `${glue_vec.x}px`;

        annotation.children[0].firstChild.src = user_pfp[ particle.index ];
    
        annotation.children[0].lastChild.lastChild.innerHTML = auth_name[ particle.index ];
    
        annotation.children[2].innerHTML = '<p>' + tw_text[ particle.index ] + '</p>';
        //console.log(annotation.children);
        annotation.style.display = `block`;
    
        attributes.size.array[ particle.index ] = PARTICLE_SIZE;
        attributes.size.array[ particle.index ] = PARTICLE_SIZE * 1.25;
        attributes.size.needsUpdate = true;
    }
    else {
        const annotation = document.querySelector('.annotation');
        annotation.style.display = `none`;
    }
}

function onDocumentMouseMove( event ) {

    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;

}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}
var camera_date;
function animate() {
    
    controls.update();
    updateGUI();
    //p_positions[i * 3 + 2] = ((dat_es[i].date_nr/365) * 2 - 1) * height;
    //365/2 * ((z+h)/2h) = date_nr
    camera_date = parseInt(365*(camera.position.z + height)/(2*height));
    const date_el = document.querySelector('#date');
    var date_lit = date_dictionary.get(String(camera_date));
    if(typeof date_lit === 'undefined'){
        date_el.innerHTML = 'the before'
    }
    else{
        date_el.innerHTML = date_dictionary.get(String(camera_date));
    }
    //console.log(camera_date);

	requestAnimationFrame( animate );
	//render();
    if ( params.postprocessing ) {

        composer.render();

    } else {

        renderer.render( scene, camera );

    }
	//stats.update();

}

var prev_intersect = particles[ 0 ];

function render() {
	renderer.render( scene, camera );

}

function loadJSON(filePath) {
    // Load json file;
    var json = loadTextFileAjaxSync(filePath, "application/json");
    // Parse json
    return JSON.parse(json);
  }   
  
  // Load text with Ajax synchronously: takes path to file and optional MIME type
  function loadTextFileAjaxSync(filePath, mimeType)
  {
    var xmlhttp=new XMLHttpRequest();
    xmlhttp.open("GET",filePath,false);
    if (mimeType != null) {
      if (xmlhttp.overrideMimeType) {
        xmlhttp.overrideMimeType(mimeType);
      }
    }
    xmlhttp.send();
    if (xmlhttp.status==200 && xmlhttp.readyState == 4 )
    {
      return xmlhttp.responseText;
    }
    else {
      // TODO Throw exception
      return null;
    }
  }

		