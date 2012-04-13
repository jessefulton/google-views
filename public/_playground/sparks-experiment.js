threexSparks	= new THREEx.Sparks({
	maxParticles	: 400,
	counter		: new SPARKS.SteadyCounter(300)
});

// setup the emitter
var emitter	= threexSparks.emitter();

var initColorSize	= function(){
	this.initialize = function( emitter, particle ){
		particle.target.color().setHSV(0.3, 0.9, 0.4);
		particle.target.size(15);
	};
};


emitter.addInitializer(new initColorSize());
emitter.addInitializer(new SPARKS.Position( new SPARKS.LineZone( new THREE.Vector3(-5,0,0),new THREE.Vector3(5,0,0) ) ) );
emitter.addInitializer(new SPARKS.Lifetime(.2, 1));
emitter.addInitializer(new SPARKS.Velocity(new SPARKS.PointZone(new THREE.Vector3(0,0,100))));

emitter.addAction(new SPARKS.Age());
emitter.addAction(new SPARKS.Move());
emitter.addAction(new SPARKS.RandomDrift(0,100,5000));
emitter.addAction(new SPARKS.Accelerate(0,-2,10));

