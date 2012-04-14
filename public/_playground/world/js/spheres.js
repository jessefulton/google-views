var Playground	= Playground	|| {};

var sphereMeshes	= [];

Playground.Spheres	= function(cfg)
{
	this._material	= new THREE.MeshNormalMaterial();
	//this._material	= new THREE.MeshLambertMaterial();
	this._meshes	= [];
	this.config(cfg);
}

Playground.Spheres.prototype.destroy	= function()
{
	while( this._meshes.length )	this._removeOne();
}

Playground.Spheres.prototype.meshes	= function()
{
	return this._meshes;
}


Playground.Spheres.prototype.config	= function(cfg)
{
	while( this._meshes.length != cfg.quantity ){
		if( this._meshes.length < cfg.quantity ){
			this._addOne(cfg);
		}else{
			this._removeOne();
		}
	}
	
	var restitution	= cfg.restitution;
	this._meshes.forEach(function(mesh){
		microphysics.body(mesh).restitution= restitution; 
	})
}

Playground.Spheres.prototype._removeOne	= function()
{
	var mesh	= this._meshes.shift();
	if( !mesh )	return;
	scene.removeChild(mesh);
	microphysics.unbindMesh(mesh);
}

Playground.Spheres.prototype._addOne	= function(cfg)
{
	var restitution	= cfg.restitution;
	var radius	= 20 + Math.random()*50;
	radius	= 1;
	var geometry	= new THREE.SphereGeometry(radius, 15, 15);
	var mesh	= new THREE.Mesh(geometry, this._material);
	mesh.position.x	= (2*Math.random()-1) * 10;
	mesh.position.y	= (2*Math.random()-1) * 10;
	mesh.position.z	= (2*Math.random()-1) * 10;
	scene.addChild(mesh);

	sphereMeshes.push(mesh);
	this._meshes.push(mesh);

	microphysics.bindMesh(mesh, {
		physics	: {
			restitution	: restitution			
		}
	});
	
	// initial speed
	var speed	= new THREE.Vector3(2*Math.random()-1, 2*Math.random()-1, 2*Math.random()-1)
				.normalize().multiplyScalar(5);
	microphysics.body(mesh).setVelocity(speed.x, speed.y, speed.z);	
}
