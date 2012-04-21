
var container;
var camera, renderer, startTime;
var mouseX = 0, mouseY = 0;


//SEARCH RESULTS LOAD QUEUE 
var _queueData = [
	{"term": "foo"
		, "data": [
					[ "/rendered/2f1c4e96-8aac-83ad-009f-b0b1443a8142-tex.jpg", "/rendered/3ad20227-fe24-5d59-b179-b3b6fde0d6c4-tex.jpg", "/rendered/3b1dd42e-ff4f-4888-b6ef-d7b7a84df4b7-tex.jpg", "/rendered/4acf6ddb-3088-1fb1-5c45-1ecd578a68e7-tex.jpg" ]
					, [ "/rendered/7b9899a3-3a92-b68d-72d1-cc1aa56e0253-tex.jpg", "/rendered/45afb6d8-6f37-efa2-48e0-2d0469647c65-tex.jpg", "/rendered/62d1e32f-64df-adc0-24d6-a38929021d7e-tex.jpg", "/rendered/68bd3e22-1965-aeaf-5b06-6b6458831884-tex.jpg"]
					, [ "/rendered/2f1c4e96-8aac-83ad-009f-b0b1443a8142-tex.jpg", "/rendered/3ad20227-fe24-5d59-b179-b3b6fde0d6c4-tex.jpg", "/rendered/3b1dd42e-ff4f-4888-b6ef-d7b7a84df4b7-tex.jpg", "/rendered/4acf6ddb-3088-1fb1-5c45-1ecd578a68e7-tex.jpg" ]
					, [ "/rendered/7b9899a3-3a92-b68d-72d1-cc1aa56e0253-tex.jpg", "/rendered/45afb6d8-6f37-efa2-48e0-2d0469647c65-tex.jpg", "/rendered/62d1e32f-64df-adc0-24d6-a38929021d7e-tex.jpg", "/rendered/68bd3e22-1965-aeaf-5b06-6b6458831884-tex.jpg"]
					, [ "/rendered/2f1c4e96-8aac-83ad-009f-b0b1443a8142-tex.jpg", "/rendered/3ad20227-fe24-5d59-b179-b3b6fde0d6c4-tex.jpg", "/rendered/3b1dd42e-ff4f-4888-b6ef-d7b7a84df4b7-tex.jpg", "/rendered/4acf6ddb-3088-1fb1-5c45-1ecd578a68e7-tex.jpg" ]
					, [ "/rendered/7b9899a3-3a92-b68d-72d1-cc1aa56e0253-tex.jpg", "/rendered/45afb6d8-6f37-efa2-48e0-2d0469647c65-tex.jpg", "/rendered/62d1e32f-64df-adc0-24d6-a38929021d7e-tex.jpg", "/rendered/68bd3e22-1965-aeaf-5b06-6b6458831884-tex.jpg"]
					, [ "/rendered/2f1c4e96-8aac-83ad-009f-b0b1443a8142-tex.jpg", "/rendered/3ad20227-fe24-5d59-b179-b3b6fde0d6c4-tex.jpg", "/rendered/3b1dd42e-ff4f-4888-b6ef-d7b7a84df4b7-tex.jpg", "/rendered/4acf6ddb-3088-1fb1-5c45-1ecd578a68e7-tex.jpg" ]
					, [ "/rendered/7b9899a3-3a92-b68d-72d1-cc1aa56e0253-tex.jpg", "/rendered/45afb6d8-6f37-efa2-48e0-2d0469647c65-tex.jpg", "/rendered/62d1e32f-64df-adc0-24d6-a38929021d7e-tex.jpg", "/rendered/68bd3e22-1965-aeaf-5b06-6b6458831884-tex.jpg"]
					, [ "/rendered/2f1c4e96-8aac-83ad-009f-b0b1443a8142-tex.jpg", "/rendered/3ad20227-fe24-5d59-b179-b3b6fde0d6c4-tex.jpg", "/rendered/3b1dd42e-ff4f-4888-b6ef-d7b7a84df4b7-tex.jpg", "/rendered/4acf6ddb-3088-1fb1-5c45-1ecd578a68e7-tex.jpg" ]
					, [ "/rendered/7b9899a3-3a92-b68d-72d1-cc1aa56e0253-tex.jpg", "/rendered/45afb6d8-6f37-efa2-48e0-2d0469647c65-tex.jpg", "/rendered/62d1e32f-64df-adc0-24d6-a38929021d7e-tex.jpg", "/rendered/68bd3e22-1965-aeaf-5b06-6b6458831884-tex.jpg"]
				]
	}
];

//MAIN APP
var Viz = function() {
	this.currentSearch = null;
	this.nextSearch = null;
	this.socket = null;
	
	this.scene;
	this.container;
	this.camera;
	this.renderer;
	
	this.animatingObjects = [];
	this.queue = new SearchQueue();

};

Viz.prototype.init = function(onComplete) {
	var self = this;
	console.log('initializing sockets');
	this.initSockets(function() {
		console.log('initializing scene');
		self.initScene(function() {
			console.log('search results');
			self.loadSearchResults(onComplete);
		});
	});
}

Viz.prototype.initSockets = function (onComplete) {
	var self = this;
	this.socket = io.connect(window.location.protocol + "//" + window.location.hostname);
	this.socket.on('connect', function() { 
		onComplete();
	});
	this.socket.on('queue', function (newTerm, fullQueue) {
		if (!newTerm) {
			self.queue.set(fullQueue, self.scene);
		}
		else {
			self.queue.add(newTerm, self.scene);
		}
	});
}

Viz.prototype.initScene = function(onComplete) {
	this.container = document.createElement( 'div' );
	document.body.appendChild( this.container );
	
	this.scene = new THREE.Scene();
	
	this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
	this.camera.position.z = -5;
	this.camera.position.y = 0;
	this.camera.position.x = 0;	
	this.scene.add( this.camera );
		

	
	this.scene.add(new THREE.AmbientLight(0xFFFFFF));

	// create a point light
	var pointLight = new THREE.PointLight( 0xFF0000);
	pointLight.position.x = -30;
	pointLight.position.y = -20;
	pointLight.position.z = 0;
	this.scene.add(pointLight);


	var light = new THREE.SpotLight();
	light.position.set( 17, 33, 16 );
	this.scene.add(light);
	
	
	
	this.renderer = new THREE.WebGLRenderer( { antialias: true } );
	this.renderer.setSize( window.innerWidth, window.innerHeight);
	this.renderer.setClearColor( 0x666666, 1 );
	this.renderer.autoClear = false;

	this.renderer.domElement.style.position = "relative";
	this.container.appendChild( this.renderer.domElement );
	
	//document.addEventListener( 'mousemove', onDocumentMouseMove, false );

	THREEx.WindowResize(this.renderer, this.camera, this.container);
	console.log('finished scene');
	onComplete();
}

Viz.prototype.loadSearchResults = function(onComplete) {
	var _scene = this.scene;
	var rawSearch = _queueData[0];
	this.currentSearch = new SearchResults(rawSearch, function(sr) {
		console.log("SEARCH LOADED FROM VIZ");
		console.log(sr);
		sr.addTo(_scene);
		onComplete();
	});
}

/*
Viz.prototype._init = function() {
	var rawSearch = _queueData.shift();
	var self = this;
	var _scene = this.scene;
	this.currentSearch = new SearchResults(rawSearch, function(sr) {
		console.log("SEARCH LOADED FROM VIZ");
		console.log(sr);
		sr.addTo(_scene);
	});
	self.animate();
	_queueData.push(rawSearch);
}
*/

Viz.prototype.getTextures = function(cb) {
	socket.emit('queryTextures', function(textures) {
		console.log(textures);
		cb(textures);
	});
}

Viz.prototype.next = function() {

}

Viz.prototype.animate = function() {

}

Viz.prototype.tick = function(deltaTime) {
	this.currentSearch.tick(deltaTime);
}



//BILLBOARD
var Billboard = function(opts, onload) {
	this.obj = new THREE.Object3D();
	this.numBars = opts.divisions ? opts.divisions : 4;
	this.divisionSpacing = opts.divisionSpacing ? opts.divisionSpacing : 0;
	this.height = opts.height ? opts.height : 1;
	this.width = opts.width ? opts.width : 1;
	this.textureUrls = opts.textures;
	
	this._build();
	this._texture(onload ? onload : function() {});
	
	
};

Billboard.prototype._build = function() {
	var barWidth = this.width/this.numBars;
			
	for (var i=0; i<this.numBars; i++) {
		var materials = [];
		for (var j=0; j<6; j++) { materials.push(
			new THREE.MeshPhongMaterial( { ambient: 0x555555, color: 0x555555, specular: 0xffffff, shininess: 50, shading: THREE.SmoothShading }  )
		); }

		var geometry = new THREE.CubeGeometry(barWidth, this.height, barWidth, 0, 0, 0, materials);

		var bar = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial());
		bar.position.set(0,0,0);
		bar.rotation.set(0,0,0); //(0,rota,0);
		bar.updateMatrix();
		bar.translateX(i * (barWidth + this.divisionSpacing));
		this.obj.add(bar);
	}
}

Billboard.prototype._texture = function(onComplete) {
	var texturesToLoad = this.textureUrls.length * this.numBars;
	var texturesLoaded = 0;
	
	//console.log(this);
	
	var texWidth = 1/this.numBars;
	for (var j=0; j<this.textureUrls.length; j++) {
		for (var i=0; i<this.numBars; i++) {
			var offset = texWidth*(-i - 1);
			//offset = Math.random();

			//console.log("BILLBOARD LOAD: " + this.textureUrls[j]);

			var imgTex = THREE.ImageUtils.loadTexture(
				this.textureUrls[j]
				, THREE.UVMapping
				, function(image) {
					texturesLoaded++;
					//console.log("___LOADED TEXTURE " + texturesLoaded + "/" + texturesToLoad);
					if (texturesLoaded >= texturesToLoad) {
						onComplete();
					}
			});
			//console.log(offset);

			//imgTex.wrapT = THREE.RepeatWrapping;
			imgTex.repeat.set( texWidth, 1 );
			imgTex.offset.x = offset;
			imgTex.needsUpdate = true;
			imgTex.wrapS = imgTex.wrapT = THREE.RepeatWrapping;
			var imgMat = new THREE.MeshBasicMaterial( { color: 0xdddddd, map: imgTex } );
			imgTex.minFilter = imgTex.magFilter = THREE.LinearFilter;

			var face = (j>=2) ? j+2 : j;
			this.obj.children[i].geometry.materials[face] = imgMat;
		}
	}

}

Billboard.prototype.isLoaded = function() {
	for(var i=0; i<faces.length; i++) {
		if (!faces.isLoaded()) { return false; }
	}
	return true;
}
Billboard.prototype.tick = function(deltaTime, rate) {
	if (!rate) { rate = .1; }
	
	var period = .25; //rotations per second
	var fullRotation = (Math.PI*2);
	var amt = (fullRotation * period * deltaTime) * rate;
	for(var i=0; i<this.obj.children.length; i++) {
		this.obj.children[i].rotation.y += amt;
	}
}


//SEARCH RESULTS
var SearchResults = function(cfg, onload) {
	this.term = cfg.term;
	this.rawData = cfg.data;
	this.billboards = [];
	//this.obj = new THREE.Object3D();
	console.log('creating search results...');
	this._load(onload ? onload : function() {});
}

SearchResults.prototype._load = function(onload) {
	var _self = this;
	var numToLoad = this.rawData.length;
	var numLoaded = 0;
	for (var i=0; i<this.rawData.length; i++) {
		console.log(this.rawData[i]);
		this.billboards.push(new Billboard({"textures":this.rawData[i]}, function() {
			numLoaded++;
			console.log("loaded billboard " + numLoaded + "/" + numToLoad);
			if (numLoaded >= numToLoad) {
				onload(_self);
			}
		}));
	}
}

SearchResults.prototype._destroy = function() {

}

SearchResults.prototype.tick = function(deltaTime) {
	for (var i=0; i<this.billboards.length; i++) {
		this.billboards[i].tick(deltaTime);
	}
}

SearchResults.prototype.addTo = function(scn) {
	var _width = 1;
	var _height = 1;
	
	for (var i=0; i<this.billboards.length; i++) {
		var bb = this.billboards[i].obj;
		
		bb.position.x = (Math.floor(i/2) - (_width/2)) - 2.5;
		bb.position.y = (_height/2) * ((i % 2 == 0) ? 1 : -1);
		scn.add(bb);
	}
}



SearchQueue = function(app) {
	this.app = app;
	this.data = [];
	this.objs = {};
	this.maxLength = 20;
}
SearchQueue.prototype.set = function(words, scene) {
	//ensure array
	if( Object.prototype.toString.call( words ) === '[object Array]' ) {
		console.log("setting queue to " + words);
		this.data = [];
		for (var i=0; i<words.length; i++) {
			this.add(words[i], scene);
		}
	}
}

SearchQueue.prototype.next = function() {
	var word = this.data.shift();
	this.data.push(word);
	return word;
}


SearchQueue.prototype.add = function(word, scene) {
	console.log("adding to queue: " + word);
	//add to queue
	//add to scene
	
	if(!this.objs[word]) {
		this.data.push(word);
		if (this.data.length > this.maxLength) {
			console.log("TOO MANY!");
		}
	
		var obj = this.createTextObj(word);
		
		obj.position.y = -1 * this.data.length;
		obj.position.x = 5;
		this.objs[word] = obj;
		
		scene.add(obj);
	}				
}

SearchQueue.prototype.createTextObj = function(word) {
		var text3d = new THREE.TextGeometry( word, {
			size: 1,
			height: .1,
			curveSegments: 2,
			font: "helvetiker"
		});
		
		text3d.computeBoundingBox();
		//var centerOffset = -0.5 * ( text3d.boundingBox.max.x - text3d.boundingBox.min.x );

		var textMaterial = new THREE.MeshBasicMaterial( { color: Math.random() * 0xffffff, overdraw: true } );
		var text = new THREE.Mesh( text3d, textMaterial );

		text.doubleSided = false;

		//text.position.x = centerOffset;
		//text.position.y = 100;
		//text.position.z = 0;

		//text.rotation.x = 0;
		
		
		text.rotation.y = Math.PI;
		return text;
}

SearchQueue.prototype.remove = function(word, scene) {
	//remove from queue
	//remove from scene
	var obj = this.objs[word];
	if (obj) {
		scene.remove(obj);
		delete this.objs[word];
		for (var i=0; i<this.data.length; i++) {
			if (this.data[i] == word) {
				this.data.splice(i,1);
				return;
			}
		}
	}
}





/*
		var theText = "Hello three.js! :)";

		var text3d = new THREE.TextGeometry( theText, {
			size: 80,
			height: 20,
			curveSegments: 2,
			font: "helvetiker"

		});

		text3d.computeBoundingBox();
		var centerOffset = -0.5 * ( text3d.boundingBox.max.x - text3d.boundingBox.min.x );

		var textMaterial = new THREE.MeshBasicMaterial( { color: Math.random() * 0xffffff, overdraw: true } );
		text = new THREE.Mesh( text3d, textMaterial );

		text.doubleSided = false;

		text.position.x = centerOffset;
		text.position.y = 100;
		text.position.z = 0;

		text.rotation.x = 0;
		text.rotation.y = Math.PI * 2;

		parent = new THREE.Object3D();
		parent.add( text );

		scene.add( parent );
*/


if ( ! Detector.webgl ) Detector.addGetWebGLMessage();


//textures are currently 512x512... should we do 1024x1024?




init();



var app;
var searchQueue;

function init() {
	app = new Viz();
	
	app.init(function() {
		animate();
	
	});
	


	


	function animate() {
		requestAnimationFrame( animate );
		render();
	}


	var lastFrameTime;
	var totalTime = 0;

	function render() {
		var now = Date.now() / 1000;
		if (!lastFrameTime) { lastFrameTime = Date.now()/1000; }
		var deltaTime = now - lastFrameTime;

		var rate = .1;
		
		var period = .25; //rotations per second
		var fullRotation = (Math.PI*2);
		var amt = (fullRotation * period * deltaTime) * rate;
		//console.log(deltaTime);
		var pause = (Math.cos((totalTime * (Math.PI/period) * period) * rate)) > 0;
		//pause = false;

		if (!pause) {
			app.tick(deltaTime);
		}
		app.camera.lookAt( app.scene.position );
		app.renderer.render( app.scene, app.camera );
		lastFrameTime = now;
		totalTime += deltaTime;
	}


}

/*
function onDocumentMouseMove(event) {

	mouseX = ( event.clientX - (window.innerWidth/2) );
	mouseY = ( event.clientY - (window.innerHeight/2) );

}
*/