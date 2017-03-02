define(['./MizarUtilitary'], function(MizarUtilitary){

describe("Mizar (Projection)", function () {
	jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000; //60000;
	var mizar;

	beforeEach(function () {
		mizar = MizarUtilitary.initMizar();
	});

	it("can handle north pole azimuth coordinate system", function () {
		var azimuthProj = mizar.CoordinateSystemFactory.create({geoideName:"WGS84",projectionName:"Azimuth"});

		var dest,src;

		dest = azimuthProj.fromGeoTo3D([0,90]);
		expect(dest).toBeCloseTo([0,0,0]);

		dest = azimuthProj.fromGeoTo3D([18,43]);
		src = azimuthProj.from3DToGeo(dest);
		expect(src).toBeCloseTo([18,43,0]);

		dest = azimuthProj.fromGeoTo3D([110,43]);
		src = azimuthProj.from3DToGeo(dest);
		expect(src).toBeCloseTo([110,43,0]);

		dest = azimuthProj.fromGeoTo3D([110,-25]);
		src = azimuthProj.from3DToGeo(dest);
		expect(src).toBeCloseTo([110,-25,0]);
	});

	it("can handle south pole azimuth coordinate system", function () {
		var azimuthProj = mizar.CoordinateSystemFactory.create({geoideName:"WGS84",projectionName:"Azimuth",pole: 'south'});

		var dest,src;

		dest = azimuthProj.fromGeoTo3D([0,-90]);
		expect(dest).toBeCloseTo([0,0,0]);

		dest = azimuthProj.fromGeoTo3D([18,-43]);
		src = azimuthProj.from3DToGeo(dest);
		expect(src).toBeCloseTo([18,-43,0]);

		dest = azimuthProj.fromGeoTo3D([110,-43]);
		src = azimuthProj.from3DToGeo(dest);
		expect(src).toBeCloseTo([110,-43,0]);

		dest = azimuthProj.fromGeoTo3D([110,-25]);
		src = azimuthProj.from3DToGeo(dest);
		expect(src).toBeCloseTo([110,-25,0]);
	});

	it("can display north pole azimuth coordinate system", function (done) {

		var planetContext = mizar.ContextFactory.create(mizar.CONTEXT.Planet,{
				projection : {geoideName:"WGS84",projectionName:"Azimuth"}
		});

		var blueMarbleLayer = mizar.LayerFactory.create(mizar.LAYER.WMS,{ baseUrl: "http://demonstrator.telespazio.com/wmspub", layers: "BlueMarble" });
		mizar.setPlanetBaseImagery( blueMarbleLayer );

		MizarUtilitary.compareImage("azimuth_north", 2000, done);
	});

	it("can display south pole azimuth coordinate system", function (done) {

		var planetContext = mizar.ContextFactory.create(mizar.CONTEXT.Planet,{
				projection: {geoideName:"WGS84",projectionName:"Azimuth",pole: "south"}
		});

		var blueMarbleLayer = mizar.LayerFactory.create(mizar.LAYER.WMS,{ baseUrl: "http://demonstrator.telespazio.com/wmspub", layers: "BlueMarble" });
		mizar.setPlanetBaseImagery( blueMarbleLayer );

		MizarUtilitary.compareImage("azimuth_south", 2000, done);
	});

	it("can zoom to a place with different projections", function (done) {

		var planetContext = mizar.ContextFactory.create(mizar.CONTEXT.Planet,{
				projection: mizar.CoordinateSystemFactory.create({geoideName:"WGS84",projectionName:"Azimuth",pole: "north"})
		});

		var blueMarbleLayer = mizar.LayerFactory.create(mizar.LAYER.WMS,{ baseUrl: "http://demonstrator.telespazio.com/wmspub", layers: "BlueMarble" });
		mizar.setPlanetBaseImagery( blueMarbleLayer );

		MizarUtilitary.compareImage("azimuth_north", 2000, function() {
			planetContext.navigation.zoomTo([1.433333,43.600000], 2000000, 2000, function() {
				MizarUtilitary.compareImage("toulouse azimuth", 3000, function() {

					planetContext.setCoordinateSystem(mizar.CoordinateSystemFactory.create({geoideName:"WGS84",projectionName:"Plate"}));

					MizarUtilitary.compareImage("toulouse plate", 4000, function() {

						planetContext.setCoordinateSystem(mizar.CoordinateSystemFactory.create({geoideName:"WGS84"}));
						MizarUtilitary.compareImage("toulouse globe", 3000, done);
					});

				});


			});
		});

	});

});
});
