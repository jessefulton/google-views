
			if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

			var container, stats;

			var composerScene, composer1, composer2, composer3, composer4;

			var cameraOrtho, cameraPerspective, sceneModel, sceneBG, renderer, mesh, directionalLight;

			var halfWidth, halfHeight, fullWidth, fullHeight;

			var materialColor, material2D, quadBG, quadMask, renderScene;

			var rtParameters;

			var delta = 0.01;

			init();
			animate();

			function init() {

				container = document.getElementById( 'container' );
				fullWidth = container.offsetWidth;
				fullHeight = container.offsetHeight;
				halfWidth = fullWidth / 2;
				halfHeight = fullHeight / 2;

				//

				sceneModel = new THREE.Scene();
				sceneBG = new THREE.Scene();

				//

				cameraOrtho = new THREE.OrthographicCamera( -halfWidth, halfWidth, halfHeight, -halfHeight, -10000, 10000 );
				cameraOrtho.position.z = 100;

				cameraPerspective = new THREE.PerspectiveCamera( 50, fullWidth / fullHeight, 1, 10000 );
				//cameraPerspective.position.z = 900;

				sceneModel.add( cameraPerspective );
				sceneBG.add( cameraPerspective );

				//

				directionalLight = new THREE.DirectionalLight( 0xffffff );
				directionalLight.position.set( 3, 2, 5 ).normalize();
				sceneModel.add( directionalLight );

				loader = new THREE.JSONLoader( true );
				document.body.appendChild( loader.statusDomElement );
				//loader.load( "/_playground/three.js/examples/obj/leeperrysmith/LeePerrySmith.js", function( geometry ) { createMesh( geometry, sceneModel, 100 ) } );
				
				/*
				var cubematerials = [];

				for ( var i = 0; i < 6; i ++ ) {
					cubematerials.push( new THREE.MeshBasicMaterial( { color: Math.random() * 0xffffff } ) );

				}
				*/
				
				createMesh(new THREE.CubeGeometry(20, 20, 20, 4, 4, 4), sceneModel, 10);
				

				//

				var materialColor = new THREE.MeshBasicMaterial( { color: 0xFFFF00, depthTest: false } );
				var plane = new THREE.PlaneGeometry( 1, 1 );

				quadBG = new THREE.Mesh( plane, materialColor );
				quadBG.position.z = -500;
				quadBG.scale.set( fullWidth, fullHeight, 1 );
				sceneBG.add( quadBG );

				//

				var sceneMask = new THREE.Scene();

				var plane = new THREE.PlaneGeometry( 1, 1 );

				quadMask = new THREE.Mesh( plane, new THREE.MeshBasicMaterial( { color: 0xffaa00 } )  );
				quadMask.position.z = -300;
				quadMask.scale.set( halfWidth, halfHeight, 1 );
				sceneMask.add( quadMask );

				//

				renderer = new THREE.WebGLRenderer( { antialias: false } );
				renderer.setSize( fullWidth, fullHeight );
				renderer.setClearColorHex( 0x000000, 1 );
				renderer.autoClear = false;

				//

				renderer.gammaInput = true;
				renderer.gammaOutput = true;

				//

				container.appendChild( renderer.domElement );

				//

				stats = new Stats();
				stats.domElement.style.position = 'absolute';
				stats.domElement.style.top = '0px';
				//container.appendChild( stats.domElement );

				//

				var shaderBleach = THREE.ShaderExtras[ "bleachbypass" ];
				var shaderSepia = THREE.ShaderExtras[ "sepia" ];
				var shaderVignette = THREE.ShaderExtras[ "vignette" ];
				var shaderScreen = THREE.ShaderExtras[ "screen" ];

				var effectBleach = new THREE.ShaderPass( shaderBleach );
				var effectSepia = new THREE.ShaderPass( shaderSepia );
				var effectVignette = new THREE.ShaderPass( shaderVignette );
				var effectScreen = new THREE.ShaderPass( shaderScreen );

				effectBleach.uniforms[ "opacity" ].value = 0.95;

				effectSepia.uniforms[ "amount" ].value = 0.9;

				effectVignette.uniforms[ "offset" ].value = 0.95;
				effectVignette.uniforms[ "darkness" ].value = 1.6;

				var effectBloom = new THREE.BloomPass( 0.5 );
				var effectFilm = new THREE.FilmPass( 0.35, 0.025, 648, false );
				var effectFilmBW = new THREE.FilmPass( 0.35, 0.5, 2048, true );
				var effectDotScreen = new THREE.DotScreenPass( new THREE.Vector2( 0, 0 ), 0.5, 0.8 );

				var effectHBlur = new THREE.ShaderPass( THREE.ShaderExtras[ "horizontalBlur" ] );
				var effectVBlur = new THREE.ShaderPass( THREE.ShaderExtras[ "verticalBlur" ] );
				effectHBlur.uniforms[ 'h' ].value = 2 / ( halfWidth );
				effectVBlur.uniforms[ 'v' ].value = 2 / ( halfHeight );

				var effectColorify1 = new THREE.ShaderPass( THREE.ShaderExtras[ "colorify" ] );
				var effectColorify2 = new THREE.ShaderPass( THREE.ShaderExtras[ "colorify" ] );
				effectColorify1.uniforms[ 'color' ].value.setRGB( 1, 0.8, 0.8 );
				effectColorify2.uniforms[ 'color' ].value.setRGB( 1, 0.75, 0.5 );

				var clearMask = new THREE.ClearMaskPass();
				var renderMask = new THREE.MaskPass( sceneModel, cameraPerspective );
				var renderMaskInverse = new THREE.MaskPass( sceneModel, cameraPerspective );

				renderMaskInverse.inverse = true;

				//effectFilm.renderToScreen = true;
				//effectFilmBW.renderToScreen = true;
				//effectDotScreen.renderToScreen = true;
				//effectBleach.renderToScreen = true;
				effectVignette.renderToScreen = true;
				//effectScreen.renderToScreen = true;

				//

				rtParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: true };

				var rtWidth  = halfWidth;
				var rtHeight = halfHeight;

				//

				var renderBackground = new THREE.RenderPass( sceneBG, cameraOrtho );
				var renderModel = new THREE.RenderPass( sceneModel, cameraPerspective );

				renderModel.clear = false;

				composerScene = new THREE.EffectComposer( renderer, new THREE.WebGLRenderTarget( rtWidth * 2, rtHeight * 2, rtParameters ) );

				composerScene.addPass( renderBackground );
				composerScene.addPass( renderModel );
				//composerScene.addPass( renderMaskInverse );
				//composerScene.addPass( effectHBlur );
				//composerScene.addPass( effectVBlur );
				//composerScene.addPass( clearMask );

				//

				renderScene = new THREE.TexturePass( composerScene.renderTarget2 );

				//

				composer1 = new THREE.EffectComposer( renderer, new THREE.WebGLRenderTarget( rtWidth, rtHeight, rtParameters ) );

				composer1.addPass( renderScene );
				composer1.addPass( renderMask );
				composer1.addPass( effectFilmBW );
				composer1.addPass( clearMask );
				composer1.addPass( effectVignette );

				//

				composer2 = new THREE.EffectComposer( renderer, new THREE.WebGLRenderTarget( rtWidth, rtHeight, rtParameters ) );

				composer2.addPass( renderScene );
				composer2.addPass( effectDotScreen );
				composer2.addPass( renderMask );
				composer2.addPass( effectColorify1 );
				composer2.addPass( clearMask );
				composer2.addPass( renderMaskInverse );
				composer2.addPass( effectColorify2 );
				composer2.addPass( clearMask );
				composer2.addPass( effectVignette );

				//

				composer3 = new THREE.EffectComposer( renderer, new THREE.WebGLRenderTarget( rtWidth, rtHeight, rtParameters ) );

				composer3.addPass( renderScene );
				//composer3.addPass( renderMask );
				composer3.addPass( effectSepia );
				composer3.addPass( effectFilm );
				//composer3.addPass( clearMask );
				composer3.addPass( effectVignette );

				//

				composer4 = new THREE.EffectComposer( renderer, new THREE.WebGLRenderTarget( rtWidth, rtHeight, rtParameters ) );

				composer4.addPass( renderScene );
				//composer4.addPass( renderMask );
				composer4.addPass( effectBloom );
				composer4.addPass( effectFilm );
				composer4.addPass( effectBleach );
				//composer4.addPass( clearMask );
				composer4.addPass( effectVignette );

				//

				//onWindowResize();

				renderScene.uniforms[ "tDiffuse" ].texture = composerScene.renderTarget2;

				window.addEventListener( 'resize', onWindowResize, false );

			}

			function onWindowResize( event ) {
				
				fullWidth = container.offsetWidth;
				fullHeight = container.offsetHeight;
				halfWidth = fullWidth / 2;
				halfHeight = fullHeight / 2;
				
				renderer.setSize( fullWidth, fullHeight);

				cameraPerspective.aspect = fullWidth / fullHeight;
				cameraPerspective.updateProjectionMatrix();

				cameraOrtho.left = -halfWidth;
				cameraOrtho.right = halfWidth;
				cameraOrtho.top = halfHeight;
				cameraOrtho.bottom = -halfHeight;

				cameraOrtho.updateProjectionMatrix();

				composerScene.reset( new THREE.WebGLRenderTarget( halfWidth * 2, halfHeight * 2, rtParameters ) );

				composer1.reset( new THREE.WebGLRenderTarget( halfWidth, halfHeight, rtParameters ) );
				composer2.reset( new THREE.WebGLRenderTarget( halfWidth, halfHeight, rtParameters ) );
				composer3.reset( new THREE.WebGLRenderTarget( halfWidth, halfHeight, rtParameters ) );
				composer4.reset( new THREE.WebGLRenderTarget( halfWidth, halfHeight, rtParameters ) );

				renderScene.uniforms[ "tDiffuse" ].texture = composerScene.renderTarget2;

				quadBG.scale.set( fullWidth, fullHeight, 1 );
				quadMask.scale.set( halfWidth, halfHeight, 1 );

			}

			function getText( id ) {

				return document.getElementById( id ).textContent;

			}

			function createMesh( geometryyyy, scene, scale ) {
				var planeWidth = 10;
				var numPlanes = 10;
				var rotationAmt = (Math.PI*2)/numPlanes;
				var r = (planeWidth/2) / (Math.tan(rotationAmt/2)); //distance from center point to center of plane
				

				var combined = new THREE.Geometry();
				var geometry = new THREE.PlaneGeometry( planeWidth, planeWidth ); //new THREE.CubeGeometry(7, 7, 0, 0, 0, 0);
				
				
				//(1/Math.tan(rotationAmt/2)) = r/plane
				
				console.log("r=" + r);
				
				for (var i=0; i<numPlanes; i++) {
					var rotation = rotationAmt * i;
					var m = new THREE.Mesh( geometry );
					m.position.set(0,0,0);
					m.rotation.set(0,rotation,0);
	
    			    m.updateMatrix();
    			    
    			    //m.translateX(5);
    			    m.translateZ(-r);
					//m.rotateY(rotation);
					
					//m.position.x = Math.cos(rotation) * r;
					//m.position.z = Math.sin(rotation) * r;
					
					/*				
					var mat = new THREE.Matrix4();
                    mat.setRotationY((Math.PI * 2) * r);
                    mat.setTranslation(1, 1, 2);
					
					
					m.matrix.multiplySelf(obj.matrix)
					*/
					/*
					m.rotation.y = rotation;
					m.position.x = r;
					//m.position.z = r*i/10;

					
					var newCubeMatrix = m.matrix;
					newCubeMatrix.identity();
					newCubeMatrix.multiplySelf(THREE.Matrix4.rotationYMatrix(m.rotation.y));
					newCubeMatrix.multiplySelf(THREE.Matrix4.translationMatrix(m.position.x, m.position.y, m.position.z));

					m.updateMatrix();					
					*/
					
					//m.lookAt(m.position, new THREE.vector3(0,0,0), new THREE.vector3(0,1,0));
					//console.log("x: " + m.position.x + "; z: " + m.position.z);
					
					THREE.GeometryUtils.merge( combined, m );
				}
				/*
				var mesh1 = new THREE.Mesh( geometry );
				mesh1.position.x = 7;
				mesh1.rotation.x= Math.PI * .25;
				mesh1.rotation.y= Math.PI * .25;
				//mesh1.rotation.z= Math.PI * .25;
				mesh1.position.x = 7;
				
				var mesh2 = new THREE.Mesh( geometry );
				mesh2.position.y = 7;
				
				var mesh3 = new THREE.Mesh( geometry );
				mesh3.position.z = 7;
				
				
				THREE.GeometryUtils.merge( combined, mesh1 );
				THREE.GeometryUtils.merge( combined, mesh2 );
				THREE.GeometryUtils.merge( combined, mesh3 );
				*/
				
				mesh = new THREE.Mesh( combined, new THREE.MeshBasicMaterial( { color: 0xff0000 } ) );
				//mesh.rotation.x = Math.PI*.2;
				//mesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial( { color: 0xcc0000, specular: 0xFF6666}) );

				mesh.position.set( 0, 0, 0 );
				mesh.scale.set( scale, scale, scale );

				scene.add( mesh );

				loader.statusDomElement.style.display = "none";

			}

			//

			function animate() {

				requestAnimationFrame( animate );

				render();
				stats.update();

			}

			function render() {

				var time = Date.now() * 0.0004;

				if ( mesh ) mesh.rotation.y = -time;

				renderer.setViewport( 0, 0, 2 * halfWidth, 2 * halfHeight );

				renderer.clear();
				composerScene.render( delta );

				renderer.setViewport( 0, 0, halfWidth, halfHeight );
				composer1.render( delta );

				renderer.setViewport( halfWidth, 0, halfWidth, halfHeight );
				composer2.render( delta );

				renderer.setViewport( 0, halfHeight, halfWidth, halfHeight );
				composer3.render( delta );

				renderer.setViewport( halfWidth, halfHeight, halfWidth, halfHeight );
				composer4.render( delta );

			}



/*
	var SCREEN_WIDTH = window.innerWidth;
	var SCREEN_HEIGHT = window.innerHeight;

	var container;

	var camera, scene, renderer;

	var mouseX = 0, mouseY = 0;

	var windowHalfX = window.innerWidth / 2;
	var windowHalfY = window.innerHeight / 2;

	var clouds = [
		[
			"/rendered/2f1c4e96-8aac-83ad-009f-b0b1443a8142-tex.jpg"
			, "/rendered/3ad20227-fe24-5d59-b179-b3b6fde0d6c4-tex.jpg"
			, "/rendered/3b1dd42e-ff4f-4888-b6ef-d7b7a84df4b7-tex.jpg"
			, "/rendered/4acf6ddb-3088-1fb1-5c45-1ecd578a68e7-tex.jpg"
			, "/rendered/4dedfa13-0968-89e0-6512-ddea3e181e5e-tex.jpg"
			, "/rendered/7ba9f92f-0864-5d71-e5e5-67aa3a774485-tex.jpg"
			, "/rendered/7e1a03f4-4d6a-800f-8e31-21b62990a4c9.jpg"
		]
		, [
			"/rendered/3dad0f72-3022-ed22-42ed-f3775af6f8ba-tex.jpg"
			, "/rendered/3efe00b8-f89d-1319-a01a-56994c820120-tex.jpg"
			, "/rendered/7b9899a3-3a92-b68d-72d1-cc1aa56e0253-tex.jpg"
			, "/rendered/45afb6d8-6f37-efa2-48e0-2d0469647c65-tex.jpg"
			, "/rendered/62d1e32f-64df-adc0-24d6-a38929021d7e-tex.jpg"
			, "/rendered/68bd3e22-1965-aeaf-5b06-6b6458831884-tex.jpg"
			, "/rendered/71e254b4-4c2b-b5b5-bace-8676ca2dd56c-tex.jpg"
		]
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

*/