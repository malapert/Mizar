define(['./MizarUtilitary'], function(MizarUtilitary){

describe("Mizar (Core API)", function () {
	jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000; //60000;
	var mizar;

	beforeEach(function () {
		mizar = MizarUtilitary.initMizar();
	});

	it("display globe with elevation", function (done) {
		var planetContext = mizar.ContextFactory.create(mizar.CONTEXT.Planet,{mode:"3d"});
		var bmLayer = mizar.LayerFactory.create(
						mizar.LAYER.WMS,
						{ baseUrl : "http://demonstrator.telespazio.com/wmspub",
						  layers  : "BlueMarble,esat"
						});
		planetContext.setBaseImagery( bmLayer );

		var elevationLayer = mizar.LayerFactory.create(
			mizar.LAYER.WCSElevation,
			{ baseUrl:"http://demonstrator.telespazio.com/wcspub", coverage: "GTOPO", version: "1.0.0"});
		planetContext.setBaseElevation( elevationLayer );

		MizarUtilitary.compareImage("globe_elevation", 10000, done);
	});

	it("display globe with elevation and a JSON sample file", function (done) {

		var planetContext = mizar.ContextFactory.create(mizar.CONTEXT.Planet,{mode:"3d"});
		var bmLayer = mizar.LayerFactory.create(
						mizar.LAYER.WMS,
						{ baseUrl : "http://demonstrator.telespazio.com/wmspub",
						  layers  : "BlueMarble,esat"
						});
		planetContext.setBaseImagery( bmLayer );

		var elevationLayer = mizar.LayerFactory.create(
			mizar.LAYER.WCSElevation,
			{ baseUrl:"http://demonstrator.telespazio.com/wcspub", coverage: "GTOPO", version: "1.0.0"});
		planetContext.setBaseElevation( elevationLayer );

		var vectorLayer = mizar.LayerFactory.create(mizar.LAYER.Vector,{
			style : mizar.DrawingFactory.createFeatureStyle({
				fillColor: [1.0,1.0,1.0,1.0],
				strokeColor: [1.0,0.0,0.0,1.0],
				fill: false
			}),
			url : "mizar/examples/geojson/europe.json"
		});

		mizar.addPlanetLayer( vectorLayer );

		MizarUtilitary.compareImage("globe_elevation_jsonfile", 10000, done);
	});

	it("display Hips layer", function (done) {
		var skyContext = mizar.ContextFactory.create(mizar.CONTEXT.Sky);

		var cdsLayer = mizar.LayerFactory.create(mizar.LAYER.Hips, { baseUrl: "http://healpix.ias.u-psud.fr/DSSColorNew/"} );
		skyContext.setBaseImagery( cdsLayer );

		skyContext.navigation.zoomTo([41.26875,0.703981]);

		MizarUtilitary.compareImage("sky_base", 10000, done);
	});

	it("display Sky and Planet", function (done) {
		var skyContext = mizar.ContextFactory.create(mizar.CONTEXT.Sky);

		var cdsLayer = mizar.LayerFactory.create(mizar.LAYER.Hips, { baseUrl: "http://healpix.ias.u-psud.fr/DSSColorNew/"} );
		skyContext.setBaseImagery( cdsLayer );

		var planetContext = mizar.ContextFactory.create(mizar.CONTEXT.Planet,{mode:"3d"});
		var bmLayer = mizar.LayerFactory.create(
						mizar.LAYER.WMS,
						{ baseUrl : "http://idoc-wmsmars.ias.u-psud.fr/cgi-bin/mapserv?map=/home/cnes/mars/mars.map",
						  layers  : "themis_day_ir_100m"
						});
		planetContext.setBaseImagery( bmLayer );

		MizarUtilitary.compareImage("sky_and_planet", 10000, done);
	});

	/*
	it("should have the defaut Field of view define in options", function () {
		expect(lmizar.getCurrentFov()).toEqual([20,20]);
	});

	it("shoud be able to change the Field of view", function (done) {
		// fovInDegrees range [0, 180]
		lmizar.setZoom(90);
		compareImage("zoom", 5000, done);
	});

	it("shoud be able to change position in hms/dms", function (done) {
		// Go to M31 hms/dms
		lmizar.goTo("0:42:14.33 41:16:7.5");
		compareImage("goto1", 5000, done);
	});

	it("shoud be able to change position in decimal degree", function (done) {
		// Go to M31 decimal degree
		lmizar.goTo("11.11 41.3");
		compareImage("goto2", 5000, done);
	});

	it("shoud be able to change position with object name", function (done) {
		// Go to M31 with object name
		lmizar.goTo("m31", function(response){ console.log(response.features) });
		compareImage("goto3", 5000, done);
	});

	it("shoud be able to change sky to planet context", function (done) {
		// Go to Mars
		lmizar.viewPlanet("Mars");
		compareImage("planet", 5000, done);
	});

	it("shoud be able to change planet to sky context", function (done) {
		// Go to Mars
		lmizar.viewPlanet("Mars");
		// return to sky mode
		lmizar.toggleMode();
		compareImage("base", 5000, done);
	});
	*/


});
});
