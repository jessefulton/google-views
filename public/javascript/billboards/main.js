var MAX_QUEUE_SIZE = 15;

//
// 1. TODO: when one item in queue, textures are deleted after loaded (same query is "current" AND "next")
//


//==================
//==== Main App ====
//==================
var Viz = function() {
	this.currentSearch = null;
	this.nextSearch = null;
	this.socket = null;
	
	this.scene;
	this.container;
	this.camera;
	this.renderer;
	this.textureCache = new TextureCache();
	
	this.animatingObjects = [];
	this.queue = new SearchQueue();

};

Viz.prototype.init = function(onComplete) {
	var self = this;

	console.log('initializing scene');
	self.initScene(function() {
		console.log('initializing sockets');
		self.initSockets(function() {
			//self.next();
			onComplete();
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
		//trying to set full queue
		if (!newTerm) {
			if (self.queue.isEmpty()){
				self.queue.set(fullQueue, self.scene);
			}
		}
		else {
			self.queue.add(newTerm, self.scene);
		}
		if (self.currentSearch == null) {
			self.next();
		}
	});
	
	this.socket.on('progress', function(obj, numProcessed, total) {
		self.queue.markProgress(obj.query, (numProcessed / total));
		//console.log(obj.query + ": " + numProcessed + "/" + total);
	});
}

Viz.prototype.initScene = function(onComplete) {
	this.container = document.createElement( 'div' );
	document.body.appendChild( this.container );
	
	this.scene = new THREE.Scene();
	//this.scene.fog = new THREE.Fog( 0xffffff, 0.00025 );
	//this.scene.fog = new THREE.FogExp2( 0xefd1b5, 0.0025 );
	//this.scene.fog = new THREE.Fog( 0xffffff, 10, 1000 );
	
	this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
	this.camera.position.z = -5;
	this.camera.position.y = 0;
	this.camera.position.x = 0;	
	this.camera.lookAt( this.scene.position );
	this.scene.add( this.camera );

	
	this.scene.add(new THREE.AmbientLight(0x333333));

	// create a point light
	var pointLight = new THREE.PointLight( 0xCCCCCC);
	pointLight.position.x = 0;
	pointLight.position.y = -10;
	pointLight.position.z = -10;
	this.scene.add(pointLight);
/*
	var light = new THREE.SpotLight();
	light.position.set( 17, 33, 16 );
	this.scene.add(light);
*/

	
	
	
	
	var text3d = new THREE.TextGeometry( "submitted queries", {
		size: .15,
		height: .01,
		curveSegments: 2,
		font: "helvetiker",
		bevelThickness: .002,
		bevelSize: .0015,
		bevelEnabled: true
	});
	
	text3d.computeBoundingBox();
	//var centerOffset = -0.5 * ( text3d.boundingBox.max.x - text3d.boundingBox.min.x );

	//var textMaterial = new THREE.MeshLambertMaterial( { color: 0xFF0078 } ) ;
	
	var textMaterial = 
			new THREE.MeshPhongMaterial( { ambient: 0xC0C0C0, color: 0x29e8ff, specular: 0xffffff, shininess: 50, shading: THREE.SmoothShading, "overdraw": true });
	
	var text = new THREE.Mesh( text3d, textMaterial );

	text.doubleSided = false;

	text.position.x = 3.5;
	
	text.position.z = -2;

	//text.rotation.x = Math.PI/10;
	
	
	text.rotation.y = Math.PI;
	text.rotation.z = Math.PI/2;
	
	this.scene.add(text);
	
	
	
	this.renderer = new THREE.WebGLRenderer( { antialias: true } );
	this.renderer.setSize( window.innerWidth, window.innerHeight);
	this.renderer.setClearColor( 0x222222, 1 );
	this.renderer.autoClear = false;

	this.renderer.domElement.style.position = "relative";
	this.container.appendChild( this.renderer.domElement );
	
	//document.addEventListener( 'mousemove', onDocumentMouseMove, false );

	THREEx.WindowResize(this.renderer, this.camera, this.container);
	console.log('finished scene');
	console.log(this.scene.fog);
	onComplete();
}

Viz.prototype.loadSearchResults = function(data) {
	var self = this;
	var _scene = this.scene;
	

	var oldSearch = this.currentSearch;
	console.log("old search");
	console.log(oldSearch);
	
	this.currentSearch = new SearchResults(data, function(sr) {
		console.log("Creating search results");
		console.log(sr);
		if (oldSearch) {
			oldSearch.removeFrom(_scene, function() {
				sr.addTo(_scene, function() {
					window.setTimeout(function() {self.next();}, 50000);
				});
				oldSearch = null;
			});
		}
		else {
			sr.addTo(_scene, function() {
				window.setTimeout(function() {self.next();}, 50000);
			});
		}
	});
}

Viz.prototype.getTextures = function(term, cb) {
	console.log("ORIGINAL TERM " + term);
	this.socket.emit('queryTextures', term, cb);
}

Viz.prototype.next = function() {
	if (!this.queue.isEmpty()) {
		var term = this.queue.next();
		console.log("Viz.next: looking up " + term);
		var self = this;
		this.getTextures(term, function(data) {
			if (!data || data.length == 0) {
				self.next();
			}
			else {
				//console.log("data for " + term);
				//console.log(data);
				self.loadSearchResults(data);
			}
		});
	}
}

Viz.prototype.animate = function() {

}

Viz.prototype.tick = function(deltaTime, totalTime) {
	if (this.currentSearch) {
		this.currentSearch.tick(deltaTime, totalTime);
	}
}

//~~~ TODO: SAME THING WITH MATERIALS ~~~//
//======================
//==== TextureCache ====
//======================
var TextureCache = function() {
	this.textures = {};
}

TextureCache.prototype.add = function(url, texture) {
	this.textures[url] = texture;
}

TextureCache.prototype.has = function(url) {
	return !!(this.textures[url]);
}

TextureCache.prototype.get = function(url) {
	return this.textures[url];
}

TextureCache.prototype.remove = function(url) {
	//console.log("Trying to remove texture " + url);
	//console.log("Trying to remove texture " + url);
	if (this.textures[url]) {
		//console.log('removing...');
		var tex = this.textures[url];
		this.textures[url] = null;
		delete this.textures[url];
		app.renderer.deallocateTexture( tex );
		//console.log('removed!');
	}
}

TextureCache.prototype.clear = function() {
	for(var key in this.textures) {
		this.remove(this.textures[key]);
	}
}


//~~~ TODO: create generic cache ~~~//
//======================
//==== MaterialCache ====
//======================
var MaterialCache = function() {
	this.textures = {};
}

MaterialCache.prototype.add = function(url, texture) {
	this.textures[url] = texture;
}

MaterialCache.prototype.has = function(url) {
	return !!(this.textures[url]);
}

MaterialCache.prototype.get = function(url) {
	return this.textures[url];
}

MaterialCache.prototype.remove = function(url) {
	//console.log("Trying to remove texture " + url);
	//console.log("Trying to remove texture " + url);
	if (this.textures[url]) {
		//console.log('removing...');
		var tex = this.textures[url];
		this.textures[url] = null;
		delete this.textures[url];
		app.renderer.deallocateTexture( tex );
		//console.log('removed!');
	}
}

MaterialCache.prototype.clear = function() {
	for(var key in this.textures) {
		this.remove(this.textures[key]);
	}
}


//===================
//==== Billboard ====
//===================
var Billboard = function(opts, onload) {
	this.obj = new THREE.Object3D();
	this.numBars = opts.divisions ? opts.divisions : 1;
	this.divisionSpacing = opts.divisionSpacing ? opts.divisionSpacing : 0;
	this.height = opts.height ? opts.height : 1;
	this.width = opts.width ? opts.width : 1;
	this.textureUrls = opts.textures;
	
	this._build();
	var self = this;
	this._texture(function() {
		if (onload) { onload(); }	
	});
	
	
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
		
		
		//console.log("setting up animation for bar");
		//console.log(bar);
		
		var current	= { y: 0 };
		var anim1 = anim2 = new TWEEN.Tween(current)
			.to({y: Math.PI*2*5 }, 150000)
			//.delay(userOpts.delay)
			//.easing(TWEEN.Easing.Exponential.EaseOut)
			.onUpdate(function() {
				bar.rotation.y = current.y;
			});
	
		
		
		//anim1.chain(anim2);
		//anim2.chain();
		anim1.start();
		
		
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

			if (!this.textureUrls[j]) {
				texturesLoaded+= this.numBars;
				if (texturesLoaded >= texturesToLoad) {
						onComplete();
					}
				continue;
			}
			
			var imgTex;
			if (app.textureCache.has(this.textureUrls[j])) {
				//console.log('loading texture from cache...');
				imgTex = app.textureCache.get(this.textureUrls[j]);
				texturesLoaded+= this.numBars;
				if (texturesLoaded >= texturesToLoad) {
					onComplete();
				}
			}
			else {
				var self = this;

				var imgTex = THREE.ImageUtils.loadTexture(
					this.textureUrls[j]
					, THREE.UVMapping
					, function(image) {
						texturesLoaded += self.numBars;
						//imgTex.image = null;
						image = null;
	
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
				imgTex.minFilter = imgTex.magFilter = THREE.LinearFilter;
				app.textureCache.add(this.textureUrls[j], imgTex);
			}

			

			//console.log("BILLBOARD LOAD: " + this.textureUrls[j]);
			var imgMat = new THREE.MeshBasicMaterial( { color: 0xdddddd, map: imgTex } );
			var face = (j>=2) ? j+2 : j;
			this.obj.children[i].geometry.materials[face] = imgMat;
			
			
			//console.log(this.obj.children[i].geometry.materials);
			

			//this.obj.children[i].geometry.materials[face].map.offset.x = texWidth*(-i - 1.5);

			//this.obj.children[i].geometry.materials[face].map.needsUpdate = true;
			
			
		}
	}

}

Billboard.prototype.isLoaded = function() {
	for(var i=0; i<faces.length; i++) {
		if (!faces.isLoaded()) { return false; }
	}
	return true;
}



Billboard.prototype.tick = function(deltaTime, totalTime) {


}

Billboard.prototype.deallocate = function() {
	//console.log(this.obj);
	for (var i=0; i<this.obj.children.length; i++) {
		var mesh = this.obj.children[i];
		//console.log(mesh);
		for (var j=0; j<mesh.geometry.materials.length; j++) {
			var mat = mesh.geometry.materials[j];
			if (mat.map) {
				//console.log("deallocated " + mat.map);
				app.renderer.deallocateTexture( mat.map )
			}
			else { 
				//console.log("No texture on material");
				//console.log(mat); 
			}
		}
		app.renderer.deallocateObject(mesh);
	}
	for (var i=0; i<this.textureUrls.length; i++) {
		app.textureCache.remove(this.textureUrls[i]);
	}
}

//=======================
//==== SearchResults ====
//=======================
var SearchResults = function(cfg, onload) {
	//this.term = cfg.term;
	//this.rawData = cfg.data;
	this.obj = new THREE.Object3D();
	this.rawData = cfg;
	
	
	//TODO: CACHE TEXTURES & MESHES BY URL, RATHER THAN GENERATING NEW FOR EACH CUBE FACE
	
	this.billboards = [];
	this.bbHeight = 1.5;
	this.bbWidth = 1.5;
	//this.obj = new THREE.Object3D();
	//console.log('creating search results...');
	//console.log(cfg);
	
	//TODO: add anim to onload	
	this._load(onload ? onload : function() {});
	
}

SearchResults.prototype._load = function(onload) {
	var _self = this;
	var numToLoad = this.rawData.length;
	var numLoaded = 0;
	var _width = this.bbWidth;
	var _height = this.bbHeight;
	for (var i=0; i<this.rawData.length; i++) {
		//console.log(this.rawData[i]);
		var bb = new Billboard({"textures":this.rawData[i], "width": this.bbWidth, "height": this.bbHeight }, function() {
			numLoaded++;
			//console.log("loaded billboard " + numLoaded + "/" + numToLoad);
			if (numLoaded >= numToLoad) {
				onload(_self);
			}
		});
		bb.obj.position.x = (Math.floor(i/2)*_width - (_width/2)) - (_width * 2.5);
		bb.obj.position.y = (_height/2) * ((i % 2 == 0) ? 1 : -1);
		this.billboards.push(bb);
		this.obj.add(bb.obj);
	}
}

SearchResults.prototype._destroy = function() {

}

SearchResults.prototype.tick = function(deltaTime, totalTime) {
	for (var i=0; i<this.billboards.length; i++) {
		this.billboards[i].tick(deltaTime, totalTime);
	}
}

SearchResults.prototype.addTo = function(scn, onComplete) {
	var theGroup = this.obj;
	theGroup.position.z = 500;
	
	//console.log("Animating search results");
	//console.log(theGroup);
	
	var current	= { z: 500 };
	var anim = new TWEEN.Tween(current)
		.to({z: 0 }, 5000)
		//.delay(userOpts.delay)
		.easing(TWEEN.Easing.Exponential.EaseOut)
		.onUpdate(function() {
			theGroup.position.z = current.z;
		});

	anim.onComplete(onComplete)
	
	
	//anim.chain(rota);
	anim.start();
	
	
	scn.add(this.obj);
}

SearchResults.prototype.removeFrom = function(scn, cb) {

	var theGroup = this.obj;
	var self = this;
	theGroup.position.z = 0;
	
	//console.log("Animating removal of search results");
	//console.log(theGroup);
	
	var current	= { z: 0 };
	var anim = new TWEEN.Tween(current)
		.to({z: 500 }, 5000)
		//.delay(userOpts.delay)
		.easing(TWEEN.Easing.Exponential.EaseIn)
		.onUpdate(function() {
			theGroup.position.z = current.z;
		});

	anim.onComplete(function() {
	
		for(var i=0; i<self.billboards.length; i++) {
			self.billboards[i].deallocate();
		}
	
		scn.remove(theGroup);
		if (cb) { cb(); }
	})
	
	anim.start();
		

}

//=====================
//==== SearchQueue ====
//=====================
SearchQueue = function(app) {
	this.app = app;
	this.data = [];
	this.objs = {};
	this.maxLength = 20;
	this.fontSize = .1;
	this.lineHeight = this.fontSize * 1.5;
}

SearchQueue.prototype.isEmpty = function() { 
	//console.log(this.data);
	return this.data.length == 0; 
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
SearchQueue.prototype.markProgress = function(term, pct) {

	//get color, adjust alpha
	var theObj;
	console.log("setting " + term + " text to opacity " + pct);
	if ( !!(theObj=this.objs[term]) ) {
		theObj.material.opacity = pct;
	}

}

var QUEUE_OFFSET_Y = -0.25;

SearchQueue.prototype.next = function() {
	
	/*
	var oldObj = this.objs[this.data[this.data.length-1].term];
	oldObj.scale.x = 1;
	oldObj.scale.y = 1;
	oldObj.scale.z = 1;

	var nextObj = this.objs[this.data[0].term];
	nextObj.scale.x = 2;
	nextObj.scale.y = 2;
	nextObj.scale.z = 2;

	
	console.log(oldObj);
	*/
	
	for (var i=0; i<this.data.length; i++) {
		
		var theObj = this.objs[this.data[i].query];


		var toPosition = { y: (1 * (i-1)* this.lineHeight)+QUEUE_OFFSET_Y, z: -2, x: 3.2 };
		if (i == 0) {
			toPosition = { y: (1 * (i-1)* this.lineHeight)+(QUEUE_OFFSET_Y/4), z: -3.9, x: 1.15 }
		}

		animatePosition(theObj, toPosition, 5000, function() {
			//console.log("ANIMATED POSITION");
		});
		//theObj.position.y = 1 * i* this.lineHeight;
	}
	var termInfo = this.data.shift();
	this.data.push(termInfo);
	var word = termInfo.query;
	
	console.log("Searchqueue.next() term: " + word);
			
	return word;
}

function animatePosition(obj, to, duration, onComplete) {
	
	var current = {x: obj.position.x, y: obj.position.y, z: obj.position.z};
	
	//console.log("animatePosition");
	//console.log(obj);
	
	var anim = new TWEEN.Tween(current)
		.to(to, duration)
		//.delay(userOpts.delay)
		//.easing(TWEEN.Easing['Quintic']['InOut'])
		.onUpdate(function() {
			obj.position.x = current.x;
			obj.position.y = current.y;
			obj.position.z = current.z;
		});

	if (onComplete) {
		anim.onComplete(onComplete);
	}
	
	anim.start();
}


SearchQueue.prototype.add = function(termInfo, scene) {
	var word = termInfo.query;
	console.log("adding to queue: " + word);
	//add to queue
	//add to scene

	if(!this.objs[word]) {
		this.data.push(termInfo);
		if (this.data.length > this.maxLength) {
			console.log("TOO MANY!");
		}
	
		var obj = this.createTextObj(termInfo);
		
		obj.position.y = (1 * this.data.length * this.lineHeight)+QUEUE_OFFSET_Y;
		obj.position.x = 0;
		obj.position.z = -20;
		this.objs[word] = obj;
		
		scene.add(obj);
		

		var current	= { x:-10, z: -10 };
		var anim = new TWEEN.Tween(current)
			.to({z: -2, x: 5 }, 5000)
			//.delay(userOpts.delay)
			//.easing(TWEEN.Easing['Quintic']['InOut'])
			.onUpdate(function() {
				obj.position.z = current.z;
				obj.position.x = current.x;
			});

		anim.onComplete(function() {
			console.log('finished animating query term');
			//scn.remove(current.obj);
			//anim.stop();
		})
		
		anim.start();
	}
	else {
		for (var i=0; i<this.data.length; i++) {
			if (this.data[i].query == termInfo.query) {
				this.data[i] = termInfo;
				break;
			}
		}
	}
	
	
	if (this.data.length > MAX_QUEUE_SIZE) {
		//remove the third item in the queue, not the last
		var removing = 	this.data.splice(2,1);
		//var removing = this.data.shift();
		this.remove(removing[0], app.scene);
	}
	
}


SearchQueue.prototype.colorize = function (word) {
	if (typeof(word) == "object") {
		word = termInfo.query;
	}
	
	//get word from object collection
	
	//mesh.material.ambient | mesh.material.color
	//THREE.Color (.r .g .b)
	
}

var TEXT_MATERIALS = [
	new THREE.MeshLambertMaterial( { color: 0xFF0000 })
	, new THREE.MeshLambertMaterial( { color: 0xFFFF00 })
	, new THREE.MeshLambertMaterial( { color: 0x00FF00 })
	, new THREE.MeshLambertMaterial( { color: 0x0000FF })
];

var INACTIVE_MATERIAL = 	new THREE.MeshPhongMaterial( { ambient: 0xC0C0C0, color: 0x000000, specular: 0xffffff, shininess: 50, shading: THREE.SmoothShading, "overdraw": true });

SearchQueue.prototype.createTextObj = function(termInfo) {

	//console.log(termInfo);

	var word = termInfo.query;
	
	var colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00];
	var c = colors[Math.floor(Math.random()*colors.length)];

	var color = (termInfo.processState == "complete") ? 0xC0C0C0 : c;
	var scolor = (termInfo.processState == "complete") ? c : 0xC0C0C0;
	
	var text3d = new THREE.TextGeometry( word, {
		size: this.fontSize,
		height: .01,
		curveSegments: 2,
		font: "catulli",
		
		bevelThickness: .002,
		bevelSize: .0015,
		bevelEnabled: true
	});
	
	text3d.computeBoundingBox();
	//var centerOffset = -0.5 * ( text3d.boundingBox.max.x - text3d.boundingBox.min.x );

	var textMaterial = (termInfo.processState == "complete") ? TEXT_MATERIALS[Math.floor(Math.random()*TEXT_MATERIALS.length)] : new THREE.MeshLambertMaterial( { color: (colors[Math.floor(Math.random()*colors.length)]) } ) ;

	if (termInfo.processState != "complete") {
		console.log("adjusting opacity for term " + word );
		textMaterial.opacity = 0.1;
	}

	var text = new THREE.Mesh( text3d, textMaterial );

	text.doubleSided = false;

	//text.position.x = centerOffset;
	//text.position.y = 100;
	//text.position.z = 0;

	//text.rotation.x = 0;
	
	
	text.rotation.y = Math.PI;
	
	//text.lookAt(app.camera.position);
	
	//console.log(text);
	
	return text;
}

SearchQueue.prototype.remove = function(termInfo, scene) {
	var word = termInfo.query;
	//remove from queue
	//remove from scene
	var obj = this.objs[word];
	if (obj) {
		scene.remove(obj);
		delete this.objs[word];
		for (var i=0; i<this.data.length; i++) {
			if (this.data[i].query == word) {
				this.data.splice(i,1);
				return;
			}
		}
	}
}






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
	

//window.setInterval(function() { app.next(); }, 15000);
	


	function animate() {
		requestAnimationFrame( animate );
		render();
		TWEEN.update();
	}


	var lastFrameTime;
	var totalTime = 0;

	function render() {
		var now = Date.now() / 1000;
		if (!lastFrameTime) { lastFrameTime = Date.now()/1000; }
		var deltaTime = now - lastFrameTime; //change in seconds

		//app.tick(deltaTime, totalTime);
		//app.camera.lookAt( app.scene.position );
		app.renderer.render( app.scene, app.camera );
		lastFrameTime = now;
		totalTime += deltaTime;
	}


	window.setTimeout(function(){ window.location.reload(); }, 6*60*60*1000);



}
