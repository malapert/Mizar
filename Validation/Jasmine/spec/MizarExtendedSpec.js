define(['./MizarUtilitary'], function(MizarUtilitary){

describe("Mizar (Extended Core API)", function () {
	jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000; //60000;
	var mizar;

	beforeEach(function () {
		MizarUtilitary.prepareMizar();
	});

	it("Date line 3D", function (done) {
		var mizar = new Mizar({
				canvas : "MizarCanvas",
				planetContext : {mode:"3d",continuousRendering:true}
			});

		MizarUtilitary.setMizar(mizar);

		var bingLayer = mizar.LayerFactory.create(mizar.LAYER.Bing,{imageSet:"AerialWithLabels", key: "Ar7-_U1iwNtChqq64tAQsOfO8G7FwF3DabvgkQ1rziC4Z9zzaKZlRDWJTKTOPBPV"});
		mizar.setPlanetBaseImagery( bingLayer );

		var vectorLayer = mizar.LayerFactory.create(mizar.LAYER.Vector);
		var feature = { type: "Feature",
					geometry: { type: "Polygon",
							coordinates: [ [ [179.34, 70.2],
											[-178.72, 70.06],
											[179.47, 67.02],
											[177.79, 63.52],
											[176.52, 60.4],
											[175.18, 60.52],
											[176.3, 63.64],
											[177.78, 67.15],
											[179.34, 70.2] ] ]
							}
				};
		vectorLayer.addFeature(feature);


		mizar.addPlanetLayer( vectorLayer );

		mizar.planetContext.navigation.zoomTo([176.52, 60.4],3000000,1);

		MizarUtilitary.compareImage("date_line_3d", 10000, done);
	});

	it("Date line 2D", function (done) {
		var mizar = new Mizar({
				canvas : "MizarCanvas",
				planetContext : {mode:"2d", projection: "Mercator", continuousRendering:true}
			});

		MizarUtilitary.setMizar(mizar);

		var bingLayer = mizar.LayerFactory.create(mizar.LAYER.Bing,{imageSet:"AerialWithLabels", key: "Ar7-_U1iwNtChqq64tAQsOfO8G7FwF3DabvgkQ1rziC4Z9zzaKZlRDWJTKTOPBPV"});
		mizar.setPlanetBaseImagery( bingLayer );

	var vectorLayer = mizar.LayerFactory.create(mizar.LAYER.Vector, {
				style : mizar.DrawingFactory.createFeatureStyle({
					fillColor: [1.,1.,1.,1.],
					strokeColor: [0.3,0.3,0.3,1.],
					fill: true
				})
			});
		var feature = { type: "Feature",
					geometry: { type: "Polygon",
							coordinates: [ [ [179.34, 70.2],
											[-178.72, 70.06],
											[179.47, 67.02],
											[177.79, 63.52],
											[176.52, 60.4],
											[175.18, 60.52],
											[176.3, 63.64],
											[177.78, 67.15],
											[179.34, 70.2] ] ]
							}
				};
		vectorLayer.addFeature(feature);


		mizar.addPlanetLayer( vectorLayer );

		mizar.planetContext.navigation.zoomTo([176.52, 67.4],3000000,1);

		MizarUtilitary.compareImage("date_line_2d_east", 2000, function() {
			mizar.planetContext.navigation.zoomTo([-178.52, 67.4],3000000,1);
			MizarUtilitary.compareImage("date_line_2d_west", 2000, done);
		});
	});

	it("Extrude animation", function (done) {

		var mizar = new Mizar({
				canvas :"MizarCanvas",
				planetContext : {
					lighting: false,
					tileErrorTreshold: 3,
					continuousRendering: true
				}
			});

			MizarUtilitary.setMizar(mizar);

			var callback = function() {
				// Start animation 2s after
				setTimeout(function() {
					animation.start();
				}, 2000);
			};

			// Add some vector layer
			var extrusionScale = 0.21;
			var vectorLayer = mizar.LayerFactory.create(mizar.LAYER.Vector,{
				style : mizar.DrawingFactory.createFeatureStyle({
					fillColor: [1.0,1.0,1.0,1.0],
					fill: true,
					strokeColor: [0,0,0,1],
					extrude: mizar.planetContext.planet.coordinateSystem.geoide.realPlanetRadius/10, // Extrude max value
					extrusionScale: extrusionScale
				}),
				url: "data/land.json",
				callback: callback
			});

			// Generate random country indices
			var countriesToExtrude = [53, 92, 1, 94, 139, 112, 129, 105, 132, 109, 95, 128, 51, 15, 130];
			var nbCountries = 177;

			var animation = mizar.AnimationFactory.createSegmented(
				1000,
				// Value setter
				function(value) {
					for ( var i=0; i<countriesToExtrude.length; i++ )
					{
						// Extract feature for the given country
						var feature = vectorLayer.features[countriesToExtrude[i]];
						var featureStyle = feature.properties.style;
						if ( !featureStyle )
						{
							featureStyle = mizar.DrawingFactory.createFeatureStyle(vectorLayer.style);
							vectorLayer.modifyFeatureStyle( feature, featureStyle );
						}
						featureStyle.setExtrusionScale(value);
					}
					// Uncomment to extrude all !
					//vectorLayer.style.extrusionScale = value;
				});

			animation.addSegment(
				0.0, extrusionScale,
				1.0, 2,
				function(t, a, b) {
					return mizar.getUtilityNumeric().lerp(t, a, b);
				} 
			);

			mizar.planetContext.planet.addAnimation(animation);

			mizar.addPlanetLayer( vectorLayer );
			vectorLayer.setVisible(true);


			MizarUtilitary.compareImage("extrude_animation", 10000, done);

});

it("Flat Context", function (done) {
	var mizar = new Mizar({
		canvas:"MizarCanvas",
		planetContext : {
			lighting: false,
			tileErrorTreshold: 3,
			continuousRendering: true,
			projection: {geoideName:"WGS84",projectionName:"Mercator"},
			navigation: {
				mouse: {
					zoomOnDblClick: true
				}
			}
		}
	});

	MizarUtilitary.setMizar(mizar);

	projections = ["Plate","August","Mollweide","Aitoff","Azimuth"];

	// Add tile wireframe layer to visualize coordinate system vertices
	var wireframeLayer = mizar.LayerFactory.create(mizar.LAYER.TileWireframe);
	mizar.addPlanetLayer(wireframeLayer);

	var blueMarbleLayer = mizar.LayerFactory.create(mizar.LAYER.WMS,{ baseUrl: "http://demonstrator.telespazio.com/wmspub", layers: "BlueMarble" });
	mizar.setPlanetBaseImagery( blueMarbleLayer );

	// Add some vector layer
	var vectorLayer;
	var featureCollection;


	var styleN = mizar.DrawingFactory.createFeatureStyle({
		label: "NORTH",
		pointMaxSize: 4000
	});
	var styleS = mizar.DrawingFactory.createFeatureStyle({
		label: "SOUTH",
		pointMaxSize: 4000
	});
	var layer = mizar.LayerFactory.create(mizar.LAYER.Vector,{ style: styleN });
	mizar.addPlanetLayer(layer);
	layer.addFeature({
		geometry: { type: "Point",
		coordinates: [0,45]
		}
	});
	layer.addFeature({
		geometry: {
			type: "Point",
			coordinates: [0,-45]
		},
		properties: {
			style: styleS
		}
	});

	var indexProjection = 0;

	var change = function() {
		// Reset vector layer features
		vectorLayer.removeAllFeatures();
		mizar.planetContext.planet.setCoordinateSystem(mizar.CoordinateSystemFactory.create({geoideName:"WGS84",projectionName:projections[indexProjection]}));
		vectorLayer.addFeatureCollection(featureCollection);

		//console.log("#"+indexProjection+" = "+projections[indexProjection]);
		indexProjection++;
		if (indexProjection < projections.length) {
			setTimeout(change,1000);
		} else {
			MizarUtilitary.compareImage("flat context", 4000, done);
		}
	}

	var callback = function(data) {
		featureCollection = data;
		setTimeout(change, 1000);
	};

	vectorLayer = mizar.LayerFactory.create(mizar.LAYER.Vector,{
		style : mizar.DrawingFactory.createFeatureStyle({
			fillColor: [1.0,1.0,1.0,1.0],
			strokeColor: [0.3,0.3,0.3,1.0],
			fill: true
		}),
		url: "data/land.json",
		callback: callback

	});
	mizar.addPlanetLayer( vectorLayer );
	vectorLayer.setVisible(true);

});



it("Ground overlay", function (done) {
	// Create Mizar
	var mizar = new Mizar({
			canvas :"MizarCanvas",
			planetContext : {
				mode:"3d",
				atmosphere: false,
				lighting: false,
				tileErrorTreshold: 3,
				continuousRendering: true}
		});
	MizarUtilitary.setMizar(mizar);

	var blueMarbleLayer = mizar.LayerFactory.create(mizar.LAYER.WMS,{ baseUrl: "http://demonstrator.telespazio.com/wmspub", layers: "BlueMarble" });
	mizar.setPlanetBaseImagery( blueMarbleLayer );

	var elevationLayer = mizar.LayerFactory.create(mizar.LAYER.WCSElevation,{ baseUrl:"http://demonstrator.telespazio.com/wcspub", coverage: "GTOPO", version: "1.0.0"});
	mizar.setBaseElevation( elevationLayer );

	var go1 = mizar.LayerFactory.create(mizar.LAYER.GroundOverlay, { image:"data/mizar.jpg", quad: [ [-1,45], [-2,46], [0,48], [1,47]  ], opacity: 0.5, flipY: false });
	mizar.addPlanetLayer( go1 );

	var go2 = mizar.LayerFactory.create(mizar.LAYER.GroundOverlay, { image:"data/mizar.jpg", quad: [ [10,40], [18,40], [15,48], [10,45] ] });
	mizar.addPlanetLayer( go2 );

	mizar.planetContext.navigation.zoomTo([2,46]);

	MizarUtilitary.compareImage("ground overlay", 10000, done);

});

it("Hips", function (done) {

	// Create Mizar
	var mizar = new Mizar({
			canvas :"MizarCanvas",
			skyContext : {
				showWireframe: false,
				continuousRendering: true}
		});

	MizarUtilitary.setMizar(mizar);

	// Add HEALPUIX
	var cdsLayer = mizar.LayerFactory.create(mizar.LAYER.Hips,{ baseUrl: "http://healpix.ias.u-psud.fr/DSSColorNew/"});
	mizar.setSkyBaseImagery( cdsLayer );

	MizarUtilitary.compareImage("hips", 10000, done);

});


it("Raster overlay", function (done) {

	// Create Mizar
	var mizar = new Mizar({canvas :"MizarCanvas"});

	MizarUtilitary.setMizar(mizar);
	
	var planetContext =	mizar.ContextFactory.create(mizar.CONTEXT.Planet);	
		
	var blueMarbleLayer = mizar.LayerFactory.create(mizar.LAYER.WMS,{ baseUrl: "http://idoc-wmsmars.ias.u-psud.fr/cgi-bin/mapserv?map=/home/cnes/mars/mars.map", layers: "viking" });
	mizar.setPlanetBaseImagery( blueMarbleLayer );

	var elevationLayer = mizar.LayerFactory.create(mizar.LAYER.WCSElevation,{ baseUrl:"http://idoc-wcsmars.ias.u-psud.fr/wcsmap", coverage: "MARSTOPO_16", version: "1.0.0"});
	mizar.setBaseElevation( elevationLayer );

	setTimeout(function() {
		var overlay = mizar.LayerFactory.create(mizar.LAYER.WMS, { baseUrl: "http://idoc-wmsmars.ias.u-psud.fr/cgi-bin/mapserv?map=/home/cnes/mars/mars.map", layers: "themis_day_ir_100m" });
		overlay.setOpacity(0.5);
		mizar.addPlanetLayer( overlay );
		
		MizarUtilitary.compareImage("raster_overlay_3d", 5000, function() {
			mizar.planetContext.setCoordinateSystem(mizar.CoordinateSystemFactory.create({geoideName:"WGS84",projectionName:"Plate"}));
			MizarUtilitary.compareImage("raster_overlay_2d", 5000, done);
		});

	}, 1000 );

	

});

});
});
