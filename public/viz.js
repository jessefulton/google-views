
	var SCREEN_WIDTH = window.innerWidth;
	var SCREEN_HEIGHT = window.innerHeight;

	var container;

	var camera, scene, renderer;

	var mouseX = 0, mouseY = 0;

	var windowHalfX = window.innerWidth / 2;
	var windowHalfY = window.innerHeight / 2;

	var clouds = [
		["/512.jpg", "/512.jpg", "/512.jpg", "/512.jpg", "/512.jpg", "/512.jpg", "/512.jpg"]
		, ["/512.jpg", "/512.jpg", "/512.jpg", "/512.jpg", "/512.jpg", "/512.jpg", "/512.jpg"]
	];

	var meshes = [];

	if ( ! Detector.webgl ) {
		Detector.addGetWebGLMessage({parent: document.getElementById("webgl")});
	}
	else {
		init();
	}

	function init() {

		container = document.getElementById("webgl");
		SCREEN_WIDTH = container.offsetWidth;
		SCREEN_HEIGHT = container.offsetHeight;
		var windowHalfX = SCREEN_WIDTH / 2;
		var windowHalfY = SCREEN_HEIGHT / 2;

		scene = new THREE.Scene();

		scene.fog = new THREE.Fog( 0xffffff, 10, 1000 );

		camera = new THREE.PerspectiveCamera( 35, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 5000 );
		camera.position.set(0, 0, 10);

		scene.add( camera );
			
		var addFloor = function() {
			// GROUND
			var floorCanvas = document.createElement( "canvas" ),
				floorCanvasContext = floorCanvas.getContext( "2d" );

			floorCanvas.width = floorCanvas.height = 128;

			floorCanvasContext.fillStyle = "#444";
			floorCanvasContext.fillRect( 0, 0, 128, 128 );

			floorCanvasContext.fillStyle = "#fff";
			floorCanvasContext.fillRect( 0, 0, 64, 64);
			floorCanvasContext.fillRect( 64, 64, 64, 64 );

			var floorTexture = THREE.ImageUtils.loadTexture( '/screenshots/textures/google-search.png', THREE.UVMapping, function(image) {
				console.log(image.width);
			});
			//var floorTexture = new THREE.Texture( floorCanvas, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping );
			
			var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture } );

			floorTexture.needsUpdate = true;
			floorTexture.repeat.set( 10000, 10000 );
			floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;

			var geometry = new THREE.PlaneGeometry( 100, 100 );

			var floorMesh = new THREE.Mesh( geometry, floorMaterial );
			floorMesh.rotation.x = -Math.PI / 2;
			floorMesh.scale.set( 1000, 1000, 1000 );
			floorMesh.doubleSided = true;

			floorMesh.position.y = -10;
			floorMesh.position.x = -500;
			scene.add( floorMesh );
		};
			
			
		addFloor();
		
		var addBlockingPlane = function(flip) {
			// GROUND
			var floorCanvas = document.createElement( "canvas" ),
				floorCanvasContext = floorCanvas.getContext( "2d" );

			floorCanvas.width = floorCanvas.height = 128;

			floorCanvasContext.fillStyle = "#444";
			floorCanvasContext.fillRect( 0, 0, 128, 128 );

			floorCanvasContext.fillStyle = "#fff";
			floorCanvasContext.fillRect( 0, 0, 64, 64);
			floorCanvasContext.fillRect( 64, 64, 64, 64 );

			var floorTexture = THREE.ImageUtils.loadTexture( '/screenshots/textures/google-search.png', THREE.UVMapping, function(image) {
				console.log(image.width);
			});
			//var floorTexture = new THREE.Texture( floorCanvas, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping );
			
			var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture } );

			floorTexture.needsUpdate = true;
			floorTexture.repeat.set( 100, 100 );
			floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;

			var geometry = new THREE.PlaneGeometry( 100, 200 );

			var floorMesh = new THREE.Mesh( geometry, floorMaterial );
			floorMesh.rotation.y = Math.PI / 2 * (flip ? -1 : 1);
			floorMesh.position.x = .01 * (flip ? -1 : 1);
			//floorMesh.scale.set( 1000, 1000, 1000 );
			floorMesh.doubleSided = true;

			floorMesh.position.y = -50;
			scene.add( floorMesh );
		}
		
		addBlockingPlane(true);
		addBlockingPlane(false);				
		
		var addImgTex = function(url, x, y, z, cb) {
			var imgTex = THREE.ImageUtils.loadTexture( url, THREE.UVMapping, function( image ) {
				//console.log(image.width);
				//console.log(image.height);
			
				var geometry = new THREE.PlaneGeometry( 1, 1 );

				var THE_MESH = new THREE.Mesh( geometry, imgMat );

				//THE_MESH.scale.x = image.width / 100;
				//THE_MESH.scale.y = image.height / 100;
				THE_MESH.position.set(x,y,z);
				THE_MESH.doubleSided = true;
				scene.add( THE_MESH );
				cb(THE_MESH);
			});
			//imgTex.needsUpdate = true;
			//imgTex.wrapT = THREE.RepeatWrapping;
			imgTex.repeat.set( 1, 1 );
			imgTex.wrapS = imgTex.wrapT = THREE.RepeatWrapping;
			var imgMat = new THREE.MeshBasicMaterial( { color: 0xdddddd, map: imgTex } );

			imgTex.minFilter = imgTex.magFilter = THREE.LinearFilter;
		}

		
		for(var i=0; i<clouds.length; i++) {
			var cloudGroup = clouds[i];
			var mult = (i%2 == 0) ? 1.5 : -1.5;
			for (var j=0; j<cloudGroup.length; j++) {
				addImgTex(cloudGroup[j], (mult * (j+1)), 0, 0, function(theMesh) {
					meshes.push(theMesh);
				});
			}
		}
		
		//addImgTex("/512.jpg", -1, 0, 0); //screenshots/0c8a0d3c-bcba-4890-de23-32a35bbb634d.png");
		//addImgTex("/512.jpg", 1, 0, 0);				
		renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
		renderer.setClearColor( 0x666666, 1 );
		renderer.autoClear = false;

		renderer.domElement.style.position = "relative";
		container.appendChild( renderer.domElement );
		
		document.addEventListener( 'mousemove', onDocumentMouseMove, false );


		animate();

	/*
		window.setInterval(function() {
			if (THE_MESH) {
				scene.remove(THE_MESH);
			}
			addImgTex("screenshots/1bd3316a-3ebf-3381-cac7-44848976f63f.png");
		}, 5000);
	*/

		function animate() {
			requestAnimationFrame( animate );
			render();
		}

		function render() {
			var seconds = Date.now() / 1000;
			var radius = 10;
			var period = 10;

			//angle	= (seconds*Math.PI)/4;
			
			camera.position.x	= Math.cos((seconds/period) * Math.PI) * radius;
			camera.position.z	= (Math.sin((seconds/period) * Math.PI) * 40);
			
			for (var i=0; i<meshes.length; i++) {
				meshes[i].position.y = Math.sin((seconds/period) * i*(Math.PI/meshes.length)) * 1;
				meshes[i].position.z = Math.cos((seconds/period) * i*(Math.PI/meshes.length)) * 1;
			}
			
			//console.log(camera.position.x);
			//camera.position.y	= Math.sin(angle - Math.PI/2) * radius;
			//camera.position.z	= Math.sin(angle - Math.PI/2) * radius;
			

			//camera.position.x += ( mouseX - camera.position.x ) * .05;
			//camera.position.y += ( - ( mouseY - 200) - camera.position.y ) * .05;

			camera.lookAt( scene.position );
			renderer.render( scene, camera );
		}


	}


	function onDocumentMouseMove(event) {

		mouseX = ( event.clientX - windowHalfX );
		mouseY = ( event.clientY - windowHalfY );

	}

