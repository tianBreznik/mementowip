import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
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
var date_tw = [];

var mouseX = 0, mouseY = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
let pixelPass, params;
let mouseDown = false;
let scale = 5.0;
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

var first = 0;
function init() {
	const container = document.getElementById( 'container' );
    //const ctx = container.getContext('2d');
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
    //camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 )
	camera.position.z = -height;
    camera.rotation.y = 180 * THREE.Math.DEG2RAD;
    //camera.rotation.z = 180 * THREE.Math.DEG2RAD;
    console.log(camera.rotation)
    //camera.lookAt( new THREE.Vector3(0, 0, 0) )

    var dat_es = loadJSON('sorted_blm_10_minmin_w_pic.json');
    
    //load date lookup table
    date_dictionary = new Map();
    var dict_str = loadTextFileAjaxSync('lookup_date.csv', "application/csv");
    //(dict_str)


    dict_str.split("\n").forEach(line => {
        const [key, val] = line.split(",");
        date_dictionary.set(key, val);   
    });

    //(date_dictionary.get('20')); // value2
    
    const duplicateIds = dat_es
        .map(v => v.conversation_id)
        .filter((v, i, vIds) => vIds.indexOf(v) !== i);

    var lines = {};
    var lines_colors = {};
    lines.keys = duplicateIds;
    lines_colors.keys = duplicateIds

    const axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );

    p_positions = new Float32Array(dat_es.length * 3);
    colors = new Float32Array(dat_es.length * 3);
    for (let i = 0; i < dat_es.length; i++) {
        //(dat_es.float_minute)
        //x
        p_positions[i * 3] =  (((dat_es[i].float_minute + (Math.random() - 0.5) * 2)/60) * 2 -1) * width;
        //y
        p_positions[i * 3 + 1] = ((dat_es[i].float_hour/24.0) * 2 - 1) + (Math.random() - 0.5) * height;
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
    console.log(positionAttribute.count);
	for ( let i = 0, l = positionAttribute.count; i < l; i ++ ) {
        //var color = new THREE.Color();
        //color.setHSL( Math.random() * 0xffffff );
		//color.toArray( colors, i * 3 );
		sizes[ i ] = PARTICLE_SIZE * 1.5;
        let dup_col = lines_colors[dat_es[ i ].conversation_id]
        if(dup_col){
            //console.log("bla");
            colors[i*3 + 0] = dup_col[0].x;
            colors[i*3 + 1] = dup_col[0].y;
            colors[i*3 + 2] = dup_col[0].z;
        } 
        else {
            colors[i * 3 + 0] = Math.random();
            colors[i * 3 + 1] = Math.random();
            colors[i * 3 + 2] = Math.random();
        }
        tw_text[ i ] = dat_es[ i ].text;
        user_name[ i ] = dat_es[ i ]['author.username'];
        user_pfp[ i ] = dat_es[ i ]['author.profile_image_url'];
        auth_name[ i ] = dat_es[ i ]['author.name'];
        user_desc[ i ] = dat_es[ i ]['author.description'];
        like_cnt[ i ] = dat_es[ i ]['public_metrics.like_count'];
        retw_cnt[ i ] = dat_es[ i ]['public_metrics.retweet_count'];
        rply_cnt[ i ] = dat_es[ i ]['public_metrics.reply_count'];
        conv_ids[ i ] = dat_es[ i ].conversation_id;
        date_tw[ i ] = dat_es[ i ].created_at_date;
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
        var line_material = new MeshLineMaterial({color: new THREE.Color(line_col), lineWidth:0.8, opacity:0.6});
        var mesh = new THREE.Mesh(line.geometry, line_material);
        //mesh.raycast = MeshLineRaycast;
        parentTransform.add( mesh );
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

	window.addEventListener( 'resize', onWindowResize );
	window.addEventListener( 'pointermove', onPointerMove );
    window.addEventListener( 'load', typeWriter);
    //document.getElementById("intro").addEventListener("mouseenter", function(  ) {isOnDiv=true;});
    //document.getElementById("intro").addEventListener("mouseout", function(  ) {isOnDiv=false;});
    console.log(camera.position);
    window.addEventListener('mousedown',()=>{
        mouseDown = true
        if(!document.querySelectorAll( ":hover" )[2].className.includes('gui') && !document.querySelectorAll( ":hover" )[2].className.includes('custom-select') && !document.querySelectorAll( ":hover" )[3].className.includes('incognito')){
            console.log("hovering over custom select");
            controls.lock();
        }
    })
    window.addEventListener('mouseup',()=>{
        if(mouseDown){
            mouseDown = false
            controls.unlock()
        }
    })
    window.addEventListener( 'wheel', onWheelScroll, false );
    window.addEventListener("keydown", onDocumentKeyDown, false);
    //experiment
    document.addEventListener("click", closeAllSelect);
    console.log(document.getElementById("selelelect"));
    //document.getElementById("selelelect").addEventListener( "change", new_dat_es);

    params = {
        pixelSize: 32,
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
    pixelPass.uniforms[ 'pixelSize' ].value = 32;
    composer.addPass( pixelPass );

    //controls = new OrbitControls( camera, renderer.domElement );
    const old_rotation_x = camera.rotation.x;
    const old_rotation_y = camera.rotation.y;
    controls = new PointerLockControls(camera, renderer.domElement );
    controls.addEventListener('lock', function(){
        if(!document.querySelectorAll( ":hover" )[3].className.includes('incognito'))
        {
            console.log("mouse clicked")
            console.log(!document.querySelectorAll( ":hover" )[3].className.includes('incognito'));
            if(first == 0){
                camera.rotation.x = mouseY / scale + 180 * THREE.Math.DEG2RAD;
                camera.rotation.z = 180 * THREE.Math.DEG2RAD;
                camera.rotation.y = mouseX / scale;
            }
            else{
                camera.rotation.x += mouseY / scale;
                camera.rotation.y += mouseX / scale;
            }
            console.log(camera.rotation);
            first += 1;
        }
    })
    controls.addEventListener('unlock', function(){
        console.log('freeze')
    })
}

var isOnDiv = false;


function filterById(jsonObject, id) {
    return jsonObject.filter(function(jsonObject) {
        return (jsonObject['conversation_id'] == id);
    });
}

var bttn_click = false;
document.getElementById("continue").onclick = function() {
    bttn_click = true;
    console.log("clicked - classic");
    var fadeOutTarget = document.getElementById("intro");
    var fadeInTargetDate = document.getElementById("date");
    var fadeInTargetThought = document.getElementById("prettythoughts");
    var fadeInTargetSelect = document.getElementsByClassName("select-selected")[0];
    var fadeEffect = setInterval(function () {
        if (!fadeOutTarget.style.opacity) {
            fadeOutTarget.style.opacity = 1;
        }
        if (fadeOutTarget.style.opacity > 0 && fadeInTargetDate.style.opacity < 1 && fadeInTargetThought.style.opacity < 1) {
            fadeOutTarget.style.opacity -= 0.1;
        } else {
            fadeOutTarget.style.display = "none";
            clearInterval(fadeEffect);
        }
    }, 100);

    var op = 0.1;  // initial opacity
    var timer = setInterval(function () {
        if (op >= 1){
            clearInterval(timer);
        }
        fadeInTargetDate.style.opacity = op;
        fadeInTargetDate.style.filter = 'alpha(opacity=' + op * 100 + ")";
        fadeInTargetThought.style.opacity = op;
        fadeInTargetThought.style.filter = 'alpha(opacity=' + op * 100 + ")";
        fadeInTargetSelect.style.opacity = op;
        fadeInTargetSelect.style.filter = 'alpha(opacity=' + op * 100 + ")";
        
        op += op * 0.1;
    }, 50);
};

function onPointerMove( event ) {

	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    //pop up
    const geometry = particles.geometry;
	const attributes = geometry.attributes;


	raycaster.setFromCamera( pointer, camera );
	intersects = raycaster.intersectObject( particles );
    //intersects_lines = raycaster.intersectObjects( parentTransform.children, true )
    

    if(!document.querySelectorAll( ":hover" )[3].className.includes('incognito')){
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
            console.log(conv_ids[ particle.index]);
    
            annotation.children[0].firstChild.src = user_pfp[ particle.index ];
        
            annotation.children[0].lastChild.lastChild.innerHTML = auth_name[ particle.index ];
        
            var newline_tw = tw_text[ particle.index ].split(/\r\n|\r|\n/g);
            //(newline_tw);
            const match = /\r|\n/.exec(tw_text[particle.index].trim());
    
            annotation.children[1].lastChild.innerHTML = user_desc[particle.index];
            annotation.children[1].style.width = `${document.getElementById('header').offsetWidth}px`;
            annotation.children[2].lastChild.innerHTML = newline_tw;
            annotation.children[2].style.width = `${document.getElementById('header').offsetWidth}px`;
            annotation.style.display = `block`;
    
            annotation.children[3].innerHTML = date_tw[particle.index];
    
            /**
             * FIX LATER - ZA SUMNIKE FONT ZRIHTAJ!
             */
            // if(document.getElementById("selelelect") == "#dovolJJ")
            // {
            //     var element_desc = document.getElementById("desc");
            //     element_desc.style.fontFamily = "monospace";
    
            //     var element_tweet = document.getElementById("tweet");
            //     element_tweet.style.fontFamily = "monospace";
            // }
            console.log(like_cnt[particle.index]);
            attributes.size.array[ particle.index ] = PARTICLE_SIZE;
            attributes.size.array[ particle.index ] = PARTICLE_SIZE * like_cnt[particle.index];
            attributes.size.needsUpdate = true;
        }
        else {
            //console.log('not intersecting nothing');
            //attributes.size.array[ particle.index ] = PARTICLE_SIZE * 1.5;
            const annotation = document.querySelector('.annotation');
            annotation.style.display = `none`;
        }
    }
}

function onDocumentMouseMove( event ) {

    camera.rotation.x = mouseY / scale;
    camera.rotation.y = mouseX / scale;
    //camera.rotation.z += 180 * THREE.Math.DEG2RAD;
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function onWheelScroll(event) {
    if(bttn_click){
        camera.position.z += event.deltaY / 5; 
    } 
}

var zoomFactor = 1.03;
function onDocumentKeyDown(event) {
    var keyCode = event.which;
    if(keyCode == 87){
        camera.fov /= zoomFactor;
        camera.updateProjectionMatrix();
    }
    else if(keyCode == 83){
        camera.fov *= zoomFactor;
        camera.updateProjectionMatrix();
    }
}
var camera_date;
function animate() {
    
    updateGUI();
    camera_date = parseInt(365*(camera.position.z + height)/(2*height));
    const date_el = document.querySelector('#date');
    var date_lit = date_dictionary.get(String(camera_date));
    if(typeof date_lit === 'undefined'){
        if(camera_date < 365){
            date_el.innerHTML = 'the before';
        }else{
            date_el.innerHTML = 'the after';
        }
    }
    else{
        date_el.innerHTML = date_dictionary.get(String(camera_date));
    }

	requestAnimationFrame( animate );
	//render();
    if ( params.postprocessing ) {

        composer.render();

    } else {

        renderer.render( scene, camera );

    }
    if(params.pixelSize > 4 && bttn_click){
        params.pixelSize -= 0.1;
    }
    else{
        params.pixelSize = params.pixelSize;
    }
	//stats.update();

}

var prev_intersect = particles[ 0 ];

function render() {
	renderer.render( scene, camera );

}

var i = 0;
var txt = 'TThis tangled mess of lines and points represents the state of our collective discourse on the internet through the lens of tweets on a specific topic categorized under a hashtag. For every hashtag in the dropdown list you see a dataset of tweets pulled for the duration of 2021. Every little point is a tweet you can hover over to see what wisdom the Tweeter had to share with the world and what they think they’re all about (bio). The tweets that are connected by lines are part of the same thread.\nSeriously though, the central premise explored is how far in time a certain piece of news or a news topic/hashtag travels with relation to the concept of “information fatigue”,  which is a form of mental exhaustion arising from being exposed to and trying to assimilate too much information at once from various media, online spaces and everyday life. It leads to individuals becoming numb to it and hence reduces the actual meaningfulness of new information and the aspect of reality it represents. Twitter shaping itself up to become an online representation of our egos unapologetically expressing themselves becomes the ultimate data source for this experiment.\nA sense of incomprehension that often overwhelms me when navigating online spaces. This indeed makes me feel numb and renders my opinion seemingly insignificant in this vast sea of incoherent subjectivity. I feel pressured to define a solid counter stance to every piece of online writing that I come across, and it makes my soul feel expendable and drained. This project is meant to visualize the mess that exists in my mind when I am existing through online cultures.';
var speed = 25;

function typeWriter() {
  if (i < txt.length) {
    if(txt.charAt(i) == '\n'){
        document.getElementById("ptext").innerHTML += '</br></br>';
    }
    else{
        document.getElementById("ptext").innerHTML += txt.charAt(i);
    }
    i++;
    setTimeout(typeWriter, speed);
  }
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

  var x, i, j, l, ll, selElmnt, a, b, c;
/*look for any elements with the class "custom-select":*/
  x = document.getElementsByClassName("custom-select");
  l = x.length;
  for (i = 0; i < l; i++) {
    selElmnt = x[i].getElementsByTagName("select")[0];
    ll = selElmnt.length;
    /*for each element, create a new DIV that will act as the selected item:*/
    a = document.createElement("DIV");
    a.setAttribute("class", "select-selected");
    a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
    x[i].appendChild(a);
    /*for each element, create a new DIV that will contain the option list:*/
    b = document.createElement("DIV");
    b.setAttribute("class", "select-items select-hide");
    for (j = 1; j < ll; j++) {
        /*for each option in the original select element,
        create a new DIV that will act as an option item:*/
        c = document.createElement("DIV");
        c.innerHTML = selElmnt.options[j].innerHTML;
        c.addEventListener("click", function(e) {
        /*when an item is clicked, update the original select box,
        and the selected item:*/
        var y, i, k, s, h, sl, yl;
        s = this.parentNode.parentNode.getElementsByTagName("select")[0];
        sl = s.length;
        h = this.parentNode.previousSibling;
        for (i = 0; i < sl; i++) {
            if (s.options[i].innerHTML == this.innerHTML) {
                s.selectedIndex = i;
                h.innerHTML = this.innerHTML;
                console.log(this.innerHTML);
                //reInitWNewDates
                reInitWNewDates(this.innerHTML);
                y = this.parentNode.getElementsByClassName("same-as-selected");
                yl = y.length;
                for (k = 0; k < yl; k++) {
                    y[k].removeAttribute("class");
                }
                this.setAttribute("class", "same-as-selected");
                break;
            }
        }
        h.click();
    });
    b.appendChild(c);
  }
  x[i].appendChild(b);
  a.addEventListener("click", function(e) {
      /*when the select box is clicked, close any other select boxes,
      and open/close the current select box:*/
      e.stopPropagation();
      closeAllSelect(this);
      this.nextSibling.classList.toggle("select-hide");
      this.classList.toggle("select-arrow-active");
      });
  }

  function closeAllSelect(elmnt) {
    /*a function that will close all select boxes in the document,
    except the current select box:*/
    var x, y, i, xl, yl, arrNo = [];
    x = document.getElementsByClassName("select-items");
    y = document.getElementsByClassName("select-selected");
    xl = x.length;
    yl = y.length;
    for (i = 0; i < yl; i++) {
      if (elmnt == y[i]) {
        arrNo.push(i)
      } else {
        y[i].classList.remove("select-arrow-active");
      }
    }
    for (i = 0; i < xl; i++) {
      if (arrNo.indexOf(i)) {
        x[i].classList.add("select-hide");
      }
    }
  }

function reInitWNewDates(values) {
    console.log(values);
    scene.remove(parentTransform);
    scene.remove(particles);
    camera.position.z = -height;
    //camera.rotation.y = 180 * THREE.Math.DEG2RAD;
    console.log(camera.rotation);
    camera.lookAt( new THREE.Vector3(0, 0, 0) )

    //var dat_es = loadJSON('sorted_blm_10_minmin_w_pic.json');
    switch (values) {
        case "#BlackLivesMatter":
          //Statements executed when the
          //result of expression matches value1
          var dat_es = loadJSON('sorted_blm_10_minmin_w_pic.json');
          break;
        case "#Afghanistan":
          //Statements executed when the
          //result of expression matches value2
          var dat_es = loadJSON('sorted_afgha_10_minmin_w_pic.json');
          break;
        case "#mybodymychoice":
            //Statements executed when the
            //result of expression matches value2
            var dat_es = loadJSON('sorted_mbmc_10_minmin_w_pic.json');
            console.log("#Afghanistan")
            break;
        case "#StopTheSteal":
          //Statements executed when the
          //result of expression matches valueN
          var dat_es = loadJSON('sorted_sst_10_minmin_w_pic.json');
          console.log("#Capitol");
          break;
        case "#FarmersProtest":
          //Statements executed when the
          //result of expression matches valueN
          var dat_es = loadJSON('sorted_farmers_10_minmin_w_pic.json');
          console.log("#Capitol");
          break;
        case "#dovolJJ":
            //Statements executed when the
            //result of expression matches valueN
            var dat_es = loadJSON('sorted_jj_10_minmin_w_pic.json');
            console.log("#Capitol");
            break;
        default:
          //Statements executed when none of
          //the values match the value of the expression
          console.log("def");
          break;
    }
    
    //load date lookup table
    date_dictionary = new Map();
    var dict_str = loadTextFileAjaxSync('lookup_date.csv', "application/csv");
    //(dict_str)


    dict_str.split("\n").forEach(line => {
        const [key, val] = line.split(",");
        date_dictionary.set(key, val);   
    });

    //(date_dictionary.get('20')); // value2
    
    const duplicateIds = dat_es
        .map(v => v.conversation_id)
        .filter((v, i, vIds) => vIds.indexOf(v) !== i);

    var lines = {};
    var lines_colors = {};
    lines.keys = duplicateIds;
    lines_colors.keys = duplicateIds

    const axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );

    p_positions = new Float32Array(dat_es.length * 3);
    colors = new Float32Array(dat_es.length * 3);
    for (let i = 0; i < dat_es.length; i++) {
        //(dat_es.float_minute)
        //x
        p_positions[i * 3] =  (((dat_es[i].float_minute + (Math.random() - 0.5) * 2)/60) * 2 -1) * width;
        //y
        p_positions[i * 3 + 1] = ((dat_es[i].float_hour/24.0) * 2 - 1) + (Math.random() - 0.5) * height;
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
		sizes[ i ] = PARTICLE_SIZE * 1.5;
        let dup_col = lines_colors[dat_es[ i ].conversation_id]
        if(dup_col){
            //console.log("bla");
            colors[i*3 + 0] = dup_col[0].x;
            colors[i*3 + 1] = dup_col[0].y;
            colors[i*3 + 2] = dup_col[0].z;
        } 
        else {
            colors[i * 3 + 0] = Math.random();
            colors[i * 3 + 1] = Math.random();
            colors[i * 3 + 2] = Math.random();
        }
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

}

		