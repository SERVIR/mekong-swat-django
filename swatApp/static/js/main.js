
/*****************************************************************************
 * FILE:    SWAT Viewer MAIN JS
 * DATE:    3/28/18
 * AUTHOR: Spencer McDonald
 * COPYRIGHT:
 * LICENSE:
 *****************************************************************************/

/*****************************************************************************
 *                      LIBRARY WRAPPER
 *****************************************************************************/
var LIBRARY_OBJECT = (function() {
    // Wrap the library in a package function
    "use strict"; // And enable strict mode for this library
    /************************************************************************
     *                      MODULE LEVEL / GLOBAL VARIABLES
     *************************************************************************/
    var public_interface,
        geoserver_url = 'https://thredds.servirglobal.net/geoserver/wms/',
        gs_workspace = 'swat',
        basin_layer,
        streams_layer,
        stations_layer,
        lulc_layer,
        soil_layer,
        featureOverlayStream,
        upstreamOverlayStream,
        featureOverlaySubbasin,
        upstreamOverlaySubbasin,
        upstream_lulc,
        upstream_soil,
        rch_map,
        sub_map,
//        hru_map,
        lulc_map,
        soil_map,
        nasaaccess_map,
        layers,
        wms_source,
        wms_layer,
        current_layer,
        map,
        cart;
     var monthOrDay= 'Daily';

    /************************************************************************
     *                    PRIVATE FUNCTION DECLARATIONS
     *************************************************************************/
    var getCookie,
        init_map,
        init_rch_map,
        init_sub_map,
//        init_hru_map,
        init_lulc_map,
        init_soil_map,
        init_nasaaccess_map,
        init_events,
        update_selectors,
        get_time_series,
        get_HRUs,
        add_to_cart,
        download,
        lulc_compute,
        soil_compute,
        get_upstream,
        save_json,
        clip_rasters,
        add_streams,
        add_basins,
        add_stations,
        add_lulc,
        add_soil,
        clearLayers,
        toggleLayers,
        updateTab,
        updateView,
        reset_all,
        nasaaccess_validate,
        nasaaccess,
        init_all,
        add_to_cart_lulc,
        add_to_cart_soil,
        getStationDetails,
    setDates;
       var nexgdpp=[];

    /************************************************************************
     *                    PRIVATE FUNCTION IMPLEMENTATIONS
     *************************************************************************/

    //Get a CSRF cookie for request
    getCookie = function (name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    //find if method is csrf safe
    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    //add csrf token to appropriate ajax requests
    $(function () {
        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                    xhr.setRequestHeader("X-CSRFToken", getCookie("csrftoken"));
                }
            }
        });
    }); //document ready


    //send data to database with error messages
    function ajax_update_database(ajax_url, ajax_data) {
        //backslash at end of url is required
        if (ajax_url.substr(-1) !== "/") {
            ajax_url = ajax_url.concat("/");
        }
        //update database
        var xhr = jQuery.ajax({
            type: "POST",
            url: ajax_url,
            dataType: "json",
            data: ajax_data
        });
        xhr.done(function (data) {
            if ("success" in data) {
                // console.log("success");
            } else {
                console.log(xhr.responseText);
            }
        })
            .fail(function (xhr, status, error) {
                console.log(xhr.responseText);
            });

        return xhr;
    }

    init_map = function () {
//      Initialize all the initial map elements (projection, basemap, layers, center, zoom)
        var projection = ol.proj.get('EPSG:4326');
        var baseLayer = new ol.layer.Tile({
            source: new ol.source.BingMaps({
                key: '5TC0yID7CYaqv3nVQLKe~xWVt4aXWMJq2Ed72cO4xsA~ApdeyQwHyH_btMjQS1NJ7OHKY8BK-W-EMQMrIavoQUMYXeZIQOUURnKGBOC7UCt4',
                imagerySet: 'AerialWithLabels' // Options 'Aerial', 'AerialWithLabels', 'Road'
            })
        });

        var view = new ol.View({
            center: [0, 0],
            projection: projection,
            zoom: 1
        });
        wms_source = new ol.source.ImageWMS();

        wms_layer = new ol.layer.Image({
            source: wms_source
        });

        layers = [baseLayer];

        map = new ol.Map({
            target: document.getElementById("map"),
            layers: layers,

            view: view
        });

        map.crossOrigin = 'anonymous';


    };

    init_rch_map = function () {
//      Initialize all the initial map elements (projection, basemap, layers, center, zoom)
        var projection = ol.proj.get('EPSG:4326');
        var baseLayer = new ol.layer.Tile({
            source: new ol.source.BingMaps({
                key: '5TC0yID7CYaqv3nVQLKe~xWVt4aXWMJq2Ed72cO4xsA~ApdeyQwHyH_btMjQS1NJ7OHKY8BK-W-EMQMrIavoQUMYXeZIQOUURnKGBOC7UCt4',
                imagerySet: 'AerialWithLabels' // Options 'Aerial', 'AerialWithLabels', 'Road'
            })
        });

        featureOverlayStream = new ol.layer.Vector({
            source: new ol.source.Vector()
        });


        var view = new ol.View({
            center: [0, 0],
            projection: projection,
            zoom: 1
        });

        wms_source = new ol.source.ImageWMS();

        wms_layer = new ol.layer.Image({
            source: wms_source
        });

        layers = [baseLayer, featureOverlayStream];

        rch_map = new ol.Map({
            target: document.getElementById("rch_map"),
            layers: layers,
            view: view
        });

        map.crossOrigin = 'anonymous';

    };

    init_sub_map = function () {
//      Initialize all the initial map elements (projection, basemap, layers, center, zoom)
        var projection = ol.proj.get('EPSG:4326');
        var baseLayer = new ol.layer.Tile({
            source: new ol.source.BingMaps({
                key: '5TC0yID7CYaqv3nVQLKe~xWVt4aXWMJq2Ed72cO4xsA~ApdeyQwHyH_btMjQS1NJ7OHKY8BK-W-EMQMrIavoQUMYXeZIQOUURnKGBOC7UCt4',
                imagerySet: 'AerialWithLabels' // Options 'Aerial', 'AerialWithLabels', 'Road'
            })
        });

        featureOverlaySubbasin = new ol.layer.Vector({
            source: new ol.source.Vector()
        });


        var view = new ol.View({
            center: [0, 0],
            projection: projection,
            zoom: 1
        });

        wms_source = new ol.source.ImageWMS();

        wms_layer = new ol.layer.Image({
            source: wms_source
        });

        layers = [baseLayer, featureOverlaySubbasin];

        sub_map = new ol.Map({
            target: document.getElementById("sub_map"),
            layers: layers,
            view: view
        });

        map.crossOrigin = 'anonymous';

    };

//    init_hru_map = function() {
////      Initialize all the initial map elements (projection, basemap, layers, center, zoom)
//        var projection = ol.proj.get('EPSG:4326');
//        var baseLayer = new ol.layer.Tile({
//            source: new ol.source.BingMaps({
//                key: '5TC0yID7CYaqv3nVQLKe~xWVt4aXWMJq2Ed72cO4xsA~ApdeyQwHyH_btMjQS1NJ7OHKY8BK-W-EMQMrIavoQUMYXeZIQOUURnKGBOC7UCt4',
//                imagerySet: 'AerialWithLabels' // Options 'Aerial', 'AerialWithLabels', 'Road'
//            })
//        });
//
//        featureOverlaySubbasin = new ol.layer.Vector({
//            source: new ol.source.Vector()
//        });
//
//
//        var view = new ol.View({
//            center: [0, 0],
//            projection: projection,
//            zoom: 5.5
//        });
//
//        wms_source = new ol.source.ImageWMS();
//
//        wms_layer = new ol.layer.Image({
//            source: wms_source
//        });
//
//        layers = [baseLayer, featureOverlaySubbasin];
//
//        hru_map = new ol.Map({
//            target: document.getElementById("hru_map"),
//            layers: layers,
//            view: view
//        });
//
//        map.crossOrigin = 'anonymous';
//
//    };

    init_lulc_map = function () {
//      Initialize all the initial map elements (projection, basemap, layers, center, zoom)
        var projection = ol.proj.get('EPSG:4326');
        var baseLayer = new ol.layer.Tile({
            source: new ol.source.BingMaps({
                key: '5TC0yID7CYaqv3nVQLKe~xWVt4aXWMJq2Ed72cO4xsA~ApdeyQwHyH_btMjQS1NJ7OHKY8BK-W-EMQMrIavoQUMYXeZIQOUURnKGBOC7UCt4',
                imagerySet: 'AerialWithLabels' // Options 'Aerial', 'AerialWithLabels', 'Road'
            })
        });

        featureOverlayStream = new ol.layer.Vector({
            source: new ol.source.Vector()
        });


        var view = new ol.View({
            center: [0, 0],
            projection: projection,
            zoom: 1
        });

        wms_source = new ol.source.ImageWMS();

        wms_layer = new ol.layer.Image({
            source: wms_source
        });

        layers = [baseLayer, featureOverlaySubbasin];

        lulc_map = new ol.Map({
            target: document.getElementById("lulc_map"),
            layers: layers,
            view: view
        });

        map.crossOrigin = 'anonymous';

    };

    init_soil_map = function () {
//      Initialize all the initial map elements (projection, basemap, layers, center, zoom)
        var projection = ol.proj.get('EPSG:4326');
        var baseLayer = new ol.layer.Tile({
            source: new ol.source.BingMaps({
                key: '5TC0yID7CYaqv3nVQLKe~xWVt4aXWMJq2Ed72cO4xsA~ApdeyQwHyH_btMjQS1NJ7OHKY8BK-W-EMQMrIavoQUMYXeZIQOUURnKGBOC7UCt4',
                imagerySet: 'AerialWithLabels' // Options 'Aerial', 'AerialWithLabels', 'Road'
            })
        });

        featureOverlayStream = new ol.layer.Vector({
            source: new ol.source.Vector()
        });


        var view = new ol.View({
            center: [0, 0],
            projection: projection,
            zoom: 1
        });

        wms_source = new ol.source.ImageWMS();

        wms_layer = new ol.layer.Image({
            source: wms_source
        });

        layers = [baseLayer, featureOverlaySubbasin];

        soil_map = new ol.Map({
            target: document.getElementById("soil_map"),
            layers: layers,
            view: view
        });

        map.crossOrigin = 'anonymous';

    };

    init_nasaaccess_map = function () {
//      Initialize all the initial map elements (projection, basemap, layers, center, zoom)
        var projection = ol.proj.get('EPSG:4326');
        var baseLayer = new ol.layer.Tile({
            source: new ol.source.BingMaps({
                key: '5TC0yID7CYaqv3nVQLKe~xWVt4aXWMJq2Ed72cO4xsA~ApdeyQwHyH_btMjQS1NJ7OHKY8BK-W-EMQMrIavoQUMYXeZIQOUURnKGBOC7UCt4',
                imagerySet: 'AerialWithLabels' // Options 'Aerial', 'AerialWithLabels', 'Road'
            })
        });

        featureOverlayStream = new ol.layer.Vector({
            source: new ol.source.Vector()
        });


        var view = new ol.View({
            center: [0, 0],
            projection: projection,
            zoom: 1
        });

        wms_source = new ol.source.ImageWMS();

        wms_layer = new ol.layer.Image({
            source: wms_source
        });

        layers = [baseLayer, featureOverlaySubbasin];

        nasaaccess_map = new ol.Map({
            target: document.getElementById("nasaaccess_map"),
            layers: layers,
            view: view
        });

        map.crossOrigin = 'anonymous';

    };
    setDates=function(slice){
         if( slice === "rcp85" || slice=== "rcp45") {
                $("#nex_from").datepicker("destroy");
               $("#nex_to").datepicker("destroy");
            $('#nex_from').datepicker({
                //..
                format: "yyyy-mm-dd",
                autoclose: true,
                language: 'en',
                startDate: '2006-01-01',
            });
            $('#nex_to').datepicker({
                //..
                autoclose: true,
                format: "yyyy-mm-dd",
                language: 'en',
                startDate: "2006-01-01"
            });

        }
        else {
              $("#nex_from").datepicker("destroy");
               $("#nex_to").datepicker("destroy");
            $('#nex_from').datepicker({
                //..
                format: "yyyy-mm-dd",
                autoclose: true,
                language: 'en',
                startDate: "1950-01-01",
                endDate: "2005-12-31"
            });
            $('#nex_to').datepicker({
                //..
                autoclose: true,
                format: "yyyy-mm-dd",
                language: 'en',
                startDate: "1950-01-01",
                endDate: "2005-12-31"
            });
        }
    };

    init_events = function () {

       setDates('rcp45');

        $( "#nex_slice" ).change(function() {
          setDates($('#nex_slice :selected').text());
        });


        map.on("singleclick", function (evt) {


            if (map.getTargetElement().style.cursor == "pointer") {

                if (!$('#error').hasClass('hidden')) {
                    $('#error').addClass('hidden')
                }

                reset_all();
                    var store = $('#watershed_select option:selected').val().split('|')[1]
                    var reach_store_id = gs_workspace + ':' + store + '-reach'
                    var basin_store_id = gs_workspace + ':' + store + '-subbasin'


                    var clickCoord = evt.coordinate;
                    var view = map.getView();
                    var viewResolution = view.getResolution();
                    try {
                        var wms_url = current_layer.getSource().getGetFeatureInfoUrl(evt.coordinate, viewResolution, view.getProjection(), {'INFO_FORMAT': 'application/json'}); //Get the wms url for the clicked point
                        if (wms_url) {

                            //Retrieving the details for clicked point via the url
                            $.ajax({
                                type: "GET",
                                url: wms_url,
                                dataType: 'json',
                                success: function (result) {
                                    if (parseFloat(result["features"].length < 1)) {
                                        $('#error').html('<p class="alert alert-danger" style="text-align: center"><strong>An unknown error occurred while retrieving the data. Please try again</strong></p>');
                                        $('#error').removeClass('hidden');

                                        setTimeout(function () {
                                            $('#error').addClass('hidden')
                                        }, 5000);
                                    }
                                    var streamID = parseFloat(result["features"][0]["properties"]["Subbasin"]);
                                    sessionStorage.setItem('streamID', streamID)
                                    var watershed = $('#watershed_select option:selected').val().split('|')[1]
                                    sessionStorage.setItem('watershed', watershed)
                                    var watershed_id = $('#watershed_select option:selected').val().split('|')[0]
                                    sessionStorage.setItem('watershed_id', watershed_id)
                                    $('#rch_tab').addClass('active');
                                    $('#sub_tab').removeClass('active');
                                    $('#lulc_tab').removeClass('active');
                                    if (sessionStorage.lulc_avail === 'Yes') {
                                        // $('#clip_lulc').attr('disabled', false)
                                        $('#clip_and_compute_lulc').attr('disabled', false)

                                        // $('#lulc_compute').attr('disabled', true)
                                    }
                                    $('#soil_tab').removeClass('active');
                                    if (sessionStorage.soil_avail === 'Yes') {
                                        // $('#clip_soil').attr('disabled', false)
                                        // $('#soil_compute').attr('disabled', true)
                                        $('#clip_and_compute_soil').attr('disabled', false)
                                    }
                                    $('#nasaaccess_tab').removeClass('active');
                                    $('#datacart_tab').removeClass('active');
                                    $('#rch_link').addClass('active');
                                    $('#sub_link').removeClass('active');
                                    $('#lulc_link').removeClass('active');
                                    $('#soil_link').removeClass('active');
                                    $('#nasaaccess_link').removeClass('active');
                                    $('#datacart_link').removeClass('active');
                                     $("#data-modal").show();

                                    console.log("before upstream")
                                    get_upstream(reach_store_id, basin_store_id, watershed, watershed_id, streamID, sessionStorage.userId,clickCoord);

                                }
                            });
                        }
                    } catch (err) {
                        alert("Please click on a watershed.")

                    }
             //   }
            }
        });

        map.on('pointermove', function (evt) {
            if (evt.dragging) {
                return;
            }
            var pixel = map.getEventPixel(evt.originalEvent);
            var hit = map.forEachLayerAtPixel(pixel, function (layer) {
                if (layer != layers[0] && layer != layers[1]) {
                    current_layer = layer;
                    return true;
                }
            });
            map.getTargetElement().style.cursor = hit ? 'pointer' : '';
        });
    }

    get_upstream = function (reach_store_id, basin_store_id, watershed, watershed_id, streamID, userId,clickCoord) {
                            document.getElementById("data-modal").style.display="none";

        console.log(watershed)
        console.log(watershed_id)
        console.log(userId)
        console.log(streamID)
        $.ajax({
            type: "POST",
            url: '/apps/swat2/get_upstream/',
            data: {
                'watershed': watershed,
                'watershed_id': watershed_id,
                'streamID': streamID,
                'id': userId
            },
            success: function (data) {
                console.log(data)
                    var container = document.getElementById('popup');
                    var content = document.getElementById('popup-content');
                    var closer = document.getElementById('popup-closer');
                    container.style.display = "none";
                if(data.error === "error") {
                    // $("#data-modal").hide();

                    var view = map.getView();
                    var viewResolution = view.getResolution();

                    var popup = new ol.Overlay({
                        element: document.getElementById('popup')
                    });
                    map.addOverlay(popup);
                    popup.setPosition(clickCoord);


                    closer.onclick = function () {
                        popup.setPosition(undefined);
                        closer.blur();
                        return false;
                    };


                    var station_url = stations_layer.getSource().getGetFeatureInfoUrl(clickCoord, viewResolution, view.getProjection(), {'INFO_FORMAT': 'application/json'}); //Get the wms url for the clicked point
                    $.ajax({
                        type: "GET",
                        url: station_url,
                        dataType: 'json',
                        success: function (result) {
                            if (parseFloat(result["features"].length < 1)) {
                                $('#error').html('<p class="alert alert-danger" style="text-align: center"><strong>An unknown error occurred while retrieving the data. Please try again</strong></p>');
                                $('#error').removeClass('hidden');

                                setTimeout(function () {
                                    $('#error').addClass('hidden')
                                }, 5000);
                            }
                            if (result["features"][0]) {
                                var station_name = result["features"][0]["properties"]["Name"];
                                //         var station_details = getStationDetails(station_name);
                                var i = 0;

                                for (i = 0; i < stations.length; i++) {
                                    if (stations[i].Name === station_name) {
                                        container.style.display = "block";
                                        //return stations[i];
                                        var Station_code = stations[i].Station_code;
                                        var River = stations[i].River;
                                        var Lmb_id = stations[i].Lmb_id;
                                        var Name = stations[i].Name;
                                        var point_x = stations[i].point_x;
                                        var point_y = stations[i].point_y;
                                        var URL = stations[i].URL === "" ? "Unavailable" : '<a href="' + stations[i].URL + '" target="_blank">' + stations[i].URL + '</a>';
                                        content.innerHTML = '<table class="station_class"><tr><td>Station Name</td><td>' + station_name + '</td></tr><tr><td>Station Code</td><td>' + Station_code + '' +
                                            '</td></tr><tr><td>River</td><td>' + River + '</td></tr><tr><td>Lmb ID</td><td>' + Lmb_id + '</td></tr><tr><td>Point X</td><td>' + point_x + '</td></tr>' +
                                            '<tr><td>Point Y</td><td>' + point_y + '</td></tr><tr><td>URL</td><td>' + URL + '</td></tr></table>';
                                    }
                                }
                            }
                        }

                    });
                }
                else {
                                        document.getElementById("data-modal").style.display="block";

                    container.style.display = "none";
                    // jQuery.noConflict();
                    // $ = jQuery;
                    // $("#data-modal").show();
                    var upstreams = data.upstreams
                    var outletID = sessionStorage.streamID
                    sessionStorage.setItem('upstreams', upstreams)
                    var cql_filter;
                    if (upstreams.length > 376) {
                        cql_filter = 'Subbasin=' + streamID.toString();
                    } else {
                        cql_filter = 'Subbasin=' + streamID.toString();
                        for (var i = 1; i < upstreams.length; i++) {
                            cql_filter += ' OR Subbasin=' + upstreams[i].toString();
                        }
                    }
                    var reach_url = geoserver_url + 'ows?service=wfs&version=2.0.0&request=getfeature&typename=' + reach_store_id + '&CQL_FILTER=Subbasin=' + streamID + '&outputFormat=application/json&srsname=EPSG:4326&,EPSG:4326'
                    var upstream_reach_url = geoserver_url + 'ows?service=wfs&version=2.0.0&request=getfeature&typename=' + reach_store_id + '&CQL_FILTER=' + cql_filter + '&outputFormat=application/json&srsname=EPSG:4326&,EPSG:4326'
                    var streamVectorSource = new ol.source.Vector({
                        format: new ol.format.GeoJSON(),
                        url: reach_url,
                        strategy: ol.loadingstrategy.bbox
                    });

                    featureOverlayStream = new ol.layer.Vector({
                        source: streamVectorSource,
                        style: new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                color: '#f44242',
                                width: 3
                            })
                        })

                    });

                    var upstreamStreamVectorSource = new ol.source.Vector({
                        format: new ol.format.GeoJSON(),
                        url: upstream_reach_url,
                        strategy: ol.loadingstrategy.bbox
                    });

                    upstreamOverlayStream = new ol.layer.Vector({
                        source: upstreamStreamVectorSource,
                        style: new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                color: '#42c5f4',
                                width: 2
                            })
                        })
                    });

                    rch_map.addLayer(upstreamOverlayStream);
                    rch_map.addLayer(featureOverlayStream);


                    var basin_url = geoserver_url + 'ows?service=wfs&version=2.0.0&request=getfeature&typename=' + basin_store_id + '&CQL_FILTER=Subbasin=' + streamID + '&outputFormat=application/json&srsname=EPSG:4326&,EPSG:4326'
                    var upstream_basin_url = geoserver_url + 'ows?service=wfs&version=2.0.0&request=getfeature&typename=' + basin_store_id + '&CQL_FILTER=' + cql_filter + '&outputFormat=application/json&srsname=EPSG:4326&,EPSG:4326'
                    var upstreamSubbasinVectorSource = new ol.source.Vector({
                        format: new ol.format.GeoJSON(),
                        url: upstream_basin_url,
                        strategy: ol.loadingstrategy.bbox
                    });

                    var color = '#ffffff';
                    color = ol.color.asArray(color);
                    color = color.slice();
                    color[3] = 0;

                    upstreamOverlaySubbasin = new ol.layer.Vector({
                        source: upstreamSubbasinVectorSource,
                        style: new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                color: '#ffffff',
                                width: 2
                            }),
                            fill: new ol.style.Fill({
                                color: color
                            })
                        })
                    });

                    var subbasinVectorSource = new ol.source.Vector({
                        format: new ol.format.GeoJSON(),
                        url: basin_url,
                        strategy: ol.loadingstrategy.bbox
                    });

                    var color = '#ffffff';
                    color = ol.color.asArray(color);
                    color = color.slice();
                    color[3] = .5;

                    featureOverlaySubbasin = new ol.layer.Vector({
                        source: subbasinVectorSource,
                        style: new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                color: '#c10000',
                                width: 3
                            }),
                            fill: new ol.style.Fill({
                                color: color
                            })
                        })
                    });
                    sub_map.addLayer(upstreamOverlaySubbasin);
                    sub_map.addLayer(featureOverlaySubbasin);
                    soil_map.addLayer(upstreamOverlaySubbasin);
                    lulc_map.addLayer(upstreamOverlaySubbasin);

                    save_json(upstream_basin_url, upstream_reach_url, data);

                    nasaaccess_map.addLayer(upstreamOverlaySubbasin);

                }
            },
            error:
            function (request, status, error) {
               alert(request.responseText);
    }
        });
    }

    save_json = function (upstream_basin_url, upstream_reach_url, data) {
        $.getJSON(upstream_reach_url, function (data) {
            var upstreamJson = data;
            upstreamJson['uniqueId'] = sessionStorage.userId
            upstreamJson['featureType'] = 'reach'
            upstreamJson['outletID'] = sessionStorage.streamID
            upstreamJson['watershed'] = sessionStorage.watershed
            $.ajax({
                type: 'POST',
                url: "/apps/swat2/save_json/",
                data: JSON.stringify(upstreamJson),
                success: function (result) {
                    if (result.error == 'error') {
                        alert("Please click on a watershed.")
                    } else {
                        var bbox = result.bbox
                        var srs = result.srs
                        var new_extent = ol.proj.transformExtent(bbox, srs, 'EPSG:4326');
                        sessionStorage.setItem('streamExtent', new_extent)
                        var center = ol.extent.getCenter(new_extent)
                        var view = new ol.View({
                            center: center,
                            projection: 'EPSG:4326',
                            extent: new_extent,
                            zoom: 8
                        });

                        rch_map.updateSize();
                        rch_map.getView().fit(sessionStorage.streamExtent.split(',').map(Number), rch_map.getSize());
                        sub_map.updateSize();
                        sub_map.getView().fit(sessionStorage.streamExtent.split(',').map(Number), sub_map.getSize());
                        lulc_map.updateSize();
                        lulc_map.getView().fit(sessionStorage.streamExtent.split(',').map(Number), lulc_map.getSize());
                        soil_map.updateSize();
                        soil_map.getView().fit(sessionStorage.streamExtent.split(',').map(Number), soil_map.getSize());
                        nasaaccess_map.updateSize();
                        nasaaccess_map.getView().fit(sessionStorage.streamExtent.split(',').map(Number), nasaaccess_map.getSize());


                        var newrow = '<tr><td>reach_upstream</td><td>JSON</td><td>' + sessionStorage.streamID + '</td></tr>'
                        $('#tBodySpatial').append(newrow);
                    }
                }
            })
        })
        $.getJSON(upstream_basin_url, function (data) {
            var upstreamJson = data;
            upstreamJson['uniqueId'] = sessionStorage.userId
            upstreamJson['featureType'] = 'basin'
            upstreamJson['outletID'] = sessionStorage.streamID
            upstreamJson['watershed'] = sessionStorage.watershed
            $.ajax({
                type: 'POST',
                url: "/apps/swat2/save_json/",
                data: JSON.stringify(upstreamJson),
                success: function (result) {
                    var bbox = result.bbox
                    var srs = result.srs
                    var new_extent = ol.proj.transformExtent(bbox, srs, 'EPSG:4326');
                    sessionStorage.setItem('basinExtent', new_extent)
                    var center = ol.extent.getCenter(new_extent)
                    var view = new ol.View({
                        center: center,
                        projection: 'EPSG:4326',
                        extent: new_extent,
                        zoom: 8
                    });

                    sub_map.updateSize();
                    sub_map.getView().fit(sessionStorage.basinExtent.split(',').map(Number), sub_map.getSize());
                    lulc_map.updateSize();
                    lulc_map.getView().fit(sessionStorage.basinExtent.split(',').map(Number), lulc_map.getSize());
                    soil_map.updateSize();
                    soil_map.getView().fit(sessionStorage.basinExtent.split(',').map(Number), soil_map.getSize());
                    nasaaccess_map.updateSize();
                    nasaaccess_map.getView().fit(sessionStorage.basinExtent.split(',').map(Number), nasaaccess_map.getSize());


                    var newrow = '<tr><td>basin_upstream</td><td>JSON</td><td>' + sessionStorage.streamID + '</td></tr>'
                    $('#tBodySpatial').append(newrow);

                }
            })
        })
    }

    clip_rasters = function (raster_type) {

        var watershed = sessionStorage.watershed
        var userId = sessionStorage.userId
        var outletID = sessionStorage.streamID
        if (raster_type == 'lulc') {
            $('#lulc-loading').removeClass('hidden')
        } else if (raster_type == 'soil') {
            $('#soil-loading').removeClass('hidden')
        }
        $.ajax({
            type: "POST",
            url: '/apps/swat2/clip_rasters/',
            data: {
                'watershed': watershed,
                'userId': userId,
                'outletID': outletID,
                'raster_type': raster_type
            },
            success: function (data) {
                if (data.raster_type == 'lulc') {
                    lulc_map.removeLayer(upstreamOverlaySubbasin)
                    // $('#clip_lulc').attr("disabled", true)
                    // $('#lulc_compute').attr("disabled", false)
                    $('#clip_and_compute_lulc').attr("disabled", false);
                    var lulc_store = watershed + '_upstream_lulc_' + outletID
                    var lulc_store_id = gs_workspace + ':' + lulc_store
                    var style = watershed + '-' + data.raster_type

                    //     Set the wms source to the url, workspace, and store for the subbasins of the selected watershed
                    var lulc_wms_source = new ol.source.ImageWMS({
                        url: geoserver_url,
                        params: {'LAYERS': lulc_store_id, 'STYLES': style},
                        serverType: 'geoserver',
                        crossOrigin: 'Anonymous'
                    });
                    upstream_lulc = new ol.layer.Image({
                        source: lulc_wms_source
                    });
                    $('#lulc-loading').addClass('hidden')
                    lulc_map.addLayer(upstream_lulc);
                    lulc_map.addLayer(upstreamOverlaySubbasin);
                    var newrow = '<tr>><td>lulc</td><td>TIFF</td><td>' + sessionStorage.streamID + '</td</tr>'
                    $('#tBodySpatial').append(newrow);
                    lulc_compute("lulc");
                }
                if (data.raster_type == 'soil') {
                    soil_map.removeLayer(upstreamOverlaySubbasin)
                    // $('#clip_soil').attr("disabled", true)
                    // $('#soil_compute').attr("disabled", false)
                    $('#clip_and_compute_soil').attr("disabled", false);
                    var soil_store = watershed + '_upstream_soil_' + outletID
                    var soil_store_id = gs_workspace + ':' + soil_store
                    var style = watershed + '-' + data.raster_type

                    //     Set the wms source to the url, workspace, and store for the subbasins of the selected watershed
                    var soil_wms_source = new ol.source.ImageWMS({
                        url: geoserver_url,
                        params: {'LAYERS': soil_store_id, 'STYLES': style},
                        serverType: 'geoserver',
                        crossOrigin: 'Anonymous'
                    });

                    upstream_soil = new ol.layer.Image({
                        source: soil_wms_source
                    });
                    $('#soil-loading').addClass('hidden')
                    soil_map.addLayer(upstream_soil);
                    soil_map.addLayer(upstreamOverlaySubbasin);
                    var newrow = '<tr>><td>soil</td><td>TIFF</td><td>' + sessionStorage.streamID + '</td</tr>'
                    $('#tBodySpatial').append(newrow);
                    soil_compute("soil");
                }
            }
        })
    }

    add_streams = function () {
//      add the streams for the selected watershed
        var store =sessionStorage.watershed + '-reach'
        var store_id = gs_workspace + ':' + store

//      Set the style for the streams layer
        var sld_string = '<StyledLayerDescriptor version="1.0.0"><NamedLayer><Name>' + store_id + '</Name><UserStyle><FeatureTypeStyle><Rule>\
            <Name>rule1</Name>\
            <Title>Blue Line</Title>\
            <Abstract>A solid blue line with a 2 pixel width</Abstract>\
            <LineSymbolizer>\
                <Stroke>\
                    <CssParameter name="stroke">#1500ff</CssParameter>\
                    <CssParameter name="stroke-width">1.2</CssParameter>\
                </Stroke>\
            </LineSymbolizer>\
            </Rule>\
            </FeatureTypeStyle>\
            </UserStyle>\
            </NamedLayer>\
            </StyledLayerDescriptor>';
//      Set the wms source to the url, workspace, and store for the streams of the selected watershed
        wms_source = new ol.source.ImageWMS({
            url: geoserver_url,
            params: {'LAYERS': store_id, 'SLD_BODY': sld_string},
            serverType: 'geoserver',
            crossOrigin: 'Anonymous'
        });

        streams_layer = new ol.layer.Image({
            source: wms_source
        });

//      add streams to the map

        map.addLayer(streams_layer);

    };

    add_basins = function () {
//      add the basins for the selected watershed
        var store = sessionStorage.watershed + '-subbasin'
        var store_id = gs_workspace + ':' + store
//      Set the style for the subbasins layer
        var sld_string = '<StyledLayerDescriptor version="1.0.0"><NamedLayer><Name>' + store_id + '</Name><UserStyle><FeatureTypeStyle><Rule>\
            <PolygonSymbolizer>\
            <Name>rule1</Name>\
            <Title>Watersheds</Title>\
            <Abstract></Abstract>\
            <Fill>\
              <CssParameter name="fill">#adadad</CssParameter>\
              <CssParameter name="fill-opacity">.3</CssParameter>\
            </Fill>\
            <Stroke>\
              <CssParameter name="stroke">#ffffff</CssParameter>\
              <CssParameter name="stroke-width">.5</CssParameter>\
            </Stroke>\
            </PolygonSymbolizer>\
            </Rule>\
            </FeatureTypeStyle>\
            </UserStyle>\
            </NamedLayer>\
            </StyledLayerDescriptor>';

//      Set the wms source to the url, workspace, and store for the subbasins of the selected watershed
        wms_source = new ol.source.ImageWMS({
            url: geoserver_url,
            params: {'LAYERS': store_id, 'SLD_BODY': sld_string},
            serverType: 'geoserver',
            crossOrigin: 'Anonymous'
        });

        basin_layer = new ol.layer.Image({
            source: wms_source
        });

//      add subbasins to the map
        map.addLayer(basin_layer);

    }

    add_stations = function () {
//      add the streams for the selected watershed
        var store =sessionStorage.watershed + '-stations'
        var store_id = gs_workspace + ':' + store

//      Set the wms source to the url, workspace, and store for the streams of the selected watershed
        wms_source = new ol.source.ImageWMS({
            url: geoserver_url,
            params: {'LAYERS': store_id},
            serverType: 'geoserver',
            crossOrigin: 'Anonymous'
        });

        stations_layer = new ol.layer.Image({
            source: wms_source
        });

//      add streams to the map
        map.addLayer(stations_layer);

    };

    add_lulc = function() {
//      add the lulc layer for the selected watershed
        var store =sessionStorage.watershed + '-lulc'
        var store_id = gs_workspace + ':' + store
        var style = store


//      Set the wms source to the url, workspace, and store for the lulc layer of the selected watershed
        wms_source = new ol.source.ImageWMS({
            url: geoserver_url,
            params: {'LAYERS': store_id, 'STYLE': style},
            serverType: 'geoserver',
            crossOrigin: 'Anonymous'
        });

        lulc_layer = new ol.layer.Image({
            source: wms_source
        });

//      add lulc layer to the map
        map.removeLayer(streams_layer);

        map.addLayer(lulc_layer);
        if((!$(".watershedToggle .toggle").hasClass( "off" ))) {
            map.addLayer(streams_layer);
        }
        var img = document.createElement('img');
        img.src = geoserver_url + '?request=GetLegendGraphic&version=1.1.0&format=image/png&width=10&height=10&layer=' + store_id + '&LEGEND_OPTIONS=bgColor:0xefefef;fontSize:12';
        document.getElementById('legend_container').appendChild(img);


    }


    add_soil = function() {
//      add the soil layer for the selected watershed
        var store = sessionStorage.watershed + '-soil'
        var store_id = gs_workspace + ':' + store
        var style = store

//      Set the wms source to the url, workspace, and store for the soil layer of the selected watershed
        wms_source = new ol.source.ImageWMS({
            url: geoserver_url,
            params: {'LAYERS': store_id, 'STYLE': style},
            serverType: 'geoserver',
            crossOrigin: 'Anonymous'
        });

        soil_layer = new ol.layer.Image({
            source: wms_source
        });

//      add soil layer to the map
        map.removeLayer(streams_layer);

        map.addLayer(soil_layer);
        if((!$(".watershedToggle .toggle").hasClass( "off" ))) {
            map.addLayer(streams_layer);

        }
        var img = document.createElement('img');
        img.src = geoserver_url + '?request=GetLegendGraphic&version=1.1.0&format=image/png&width=10&height=10&layer=' + store_id + '&LEGEND_OPTIONS=bgColor:0xefefef;fontSize:12;labelMargin:15;fontStyle:Italic;';
        document.getElementById('legend_container').appendChild(img);

    }


    clearLayers = function() {
           $('#legend_container > img').remove();
        map.removeLayer(soil_layer);
        map.removeLayer(lulc_layer);
        map.removeLayer(basin_layer);
        map.removeLayer(streams_layer);
        map.removeLayer(stations_layer);
    }


    toggleLayers = function() {
   $('#legend_container').hide();
            if((!$(".watershedToggle .toggle").hasClass( "off" ))) {
                add_streams();
            }
            else {
                map.removeLayer(streams_layer);
            }
       if (($('#lulcOption').is(':checked'))  && (!$(".stationToggle .toggle").hasClass("off"))) {
                $('#legend_container > img').remove();
                 $('#legend_container').show();
                add_lulc();
                // add_basins();
                // add_streams();
                add_stations();
                            //    document.getElementById("legend_container").style.display="block";

            } else if (($('#soilOption').is(':checked')) && (!$(".basinToggle .toggle").hasClass("off")) && (!$(".stationToggle .toggle").hasClass("off"))) {
                $('#legend_container > img').remove();
                 $('#legend_container').show();
                add_soil();
                add_basins();
                // add_streams();
                add_stations();
                               //  document.getElementById("legend_container").style.display="block";


            } else if (($('#noneOption').is(':checked')) && (!$(".basinToggle .toggle").hasClass("off")) && (!$(".stationToggle .toggle").hasClass("off"))) {
                $('#legend_container > img').remove();
                add_basins();
                // add_streams();
                add_stations();
                // document.getElementById("legend_container").style.display="none";
            } else if (($('#lulcOption').is(':checked')) && (!$(".basinToggle .toggle").hasClass("off")) && ($(".stationToggle .toggle").hasClass("off"))) {
                $('#legend_container > img').remove();
                 $('#legend_container').show();
                add_lulc();
                add_basins();
                // add_streams();
            } else if (($('#soilOption').is(':checked')) && (!$(".basinToggle .toggle").hasClass("off")) && ($(".stationToggle .toggle").hasClass("off"))) {
                $('#legend_container > img').remove();
                 $('#legend_container').show();
                add_soil();
                add_basins();
                // add_streams();
            } else if (($('#noneOption').is(':checked')) && (!$(".basinToggle .toggle").hasClass("off")) && ($(".stationToggle .toggle").hasClass("off"))) {
                $('#legend_container > img').remove();
                add_basins();
                // add_streams();
            } else if (($('#lulcOption').is(':checked')) && ($(".basinToggle .toggle").hasClass("off")) && (!$(".stationToggle .toggle").hasClass("off"))) {
                $('#legend_container > img').remove();
                 $('#legend_container').show();
                add_lulc();
                // add_streams();
                add_stations();
            } else if (($('#soilOption').is(':checked')) && ($(".basinToggle .toggle").hasClass("off")) && (!$(".stationToggle .toggle").hasClass("off"))) {
                $('#legend_container > img').remove();
                 $('#legend_container').show();
                add_soil();
                // add_streams();
                add_stations();
            } else if (($('#noneOption').is(':checked')) && ($(".basinToggle .toggle").hasClass("off")) && (!$(".stationToggle .toggle").hasClass("off"))) {
                $('#legend_container > img').remove();
                // add_streams();
                add_stations();

            } else if (($('#lulcOption').is(':checked')) && ($(".basinToggle .toggle").hasClass("off")) && ($(".stationToggle .toggle").hasClass("off"))) {
                $('#legend_container > img').remove();
                 $('#legend_container').show();
                add_lulc();
                // add_streams();
            } else if (($('#soilOption').is(':checked')) && ($(".basinToggle .toggle").hasClass("off")) && ($(".stationToggle .toggle").hasClass("off"))) {
                $('#legend_container > img').remove();
                 $('#legend_container').show();
                add_soil();
                // add_streams();
            } else if (($('#noneOption').is(':checked')) && ($(".basinToggle .toggle").hasClass("off")) && ($(".stationToggle .toggle").hasClass("off"))) {
                $('#legend_container > img').remove();
                // add_streams();
            }


    }


    updateTab = function() {
        if ($('#rch_link').hasClass('active')) {
                   $('#download_data').addClass('hidden')
             $('#nasaaccess').addClass('hidden')
            $('#rch_compute').removeClass('hidden')
            rch_map.updateSize();
            rch_map.getView().fit(sessionStorage.streamExtent.split(',').map(Number), rch_map.getSize());
        } else if ($('#sub_link').hasClass('active')) {
                   $('#download_data').addClass('hidden')
             $('#nasaaccess').addClass('hidden')
            $('#sub_compute').removeClass('hidden')
            sub_map.updateSize();
            sub_map.getView().fit(sessionStorage.basinExtent.split(',').map(Number), sub_map.getSize());
        } else if ($("#lulc_link").hasClass('active')) {
                   $('#download_data').addClass('hidden')
             $('#nasaaccess').addClass('hidden')
            // $('#clip_lulc').removeClass('hidden')
            // $('#lulc_compute').removeClass('hidden')
             $('#clip_and_compute_lulc').removeClass('hidden')
            lulc_map.updateSize();
            lulc_map.getView().fit(sessionStorage.basinExtent.split(',').map(Number), lulc_map.getSize());
        } else if ($('#soil_link').hasClass('active')) {
                   $('#download_data').addClass('hidden')
             $('#nasaaccess').addClass('hidden')
            // $('#clip_soil').removeClass('hidden')
            // $('#soil_compute').removeClass('hidden')
    $('#clip_and_compute_soil').removeClass('hidden')
            soil_map.updateSize();
            soil_map.getView().fit(sessionStorage.basinExtent.split(',').map(Number), soil_map.getSize());
        } else if ($('#nasaaccess_link').hasClass('active')) {
                $('#download_data').removeClass('hidden')
              $('#download_zip').addClass('hidden')
              $('#nasaaccess').removeClass('hidden')
            nasaaccess_map.updateSize();
            nasaaccess_map.getView().fit(sessionStorage.basinExtent.split(',').map(Number), nasaaccess_map.getSize());
        } else if ($('#datacart_tab').hasClass('active')) {
            $('#downloadData').addClass('hidden')
                 $('#download_data').addClass('hidden')
             $('#nasaaccess').addClass('hidden')
               $('#download_zip').removeClass('hidden')
        }
    }


    updateView = function() {
        var store = sessionStorage.watershed;
        console.log(store);
        var store_id = gs_workspace + ':' + store + '-reach'
        var layerParams
        var layer_xml
        var bbox
        var srs
        var wmsCapUrl = geoserver_url + '?service=WMS&version=1.1.1&request=GetCapabilities&'
        console.log(wmsCapUrl)
//      Get the extent and projection of the selected watershed and set the map view to fit it
        $.ajax({
            type: "GET",
            url: wmsCapUrl,
            dataType: 'xml',
            success: function (xml) {
//          var layers = xml.getElementsByTagName("Layer");
                var parser = new ol.format.WMSCapabilities();
                var result = parser.read(xml);
                var layers = result['Capability']['Layer']['Layer']
                for (var i=0; i<layers.length; i++) {
                    if(layers[i].Title == store + '-subbasin') {
                        layer_xml = xml.getElementsByTagName('Layer')[i+1]
                        layerParams = layers[i]
                    }
                }
                console.log(layer_xml);
                srs = layer_xml.getElementsByTagName('SRS')[0].innerHTML
                bbox = layerParams.BoundingBox[0].extent
                var new_extent = ol.proj.transformExtent(bbox, srs, 'EPSG:4326');
                var center = ol.extent.getCenter(new_extent)
                var view = new ol.View({
                    center: center,
                    projection: 'EPSG:4326',
                    extent: new_extent,
                    zoom: 10
                });

                map.setView(view)
                map.getView().fit(new_extent, map.getSize());
            }
        });
    }

    get_time_series = function(watershed_id, watershed, start, end, parameters, streamID, fileType) {
//      Function to pass selected dates, parameters, and streamID to the rch data parser python function and then plot the data

//      AJAX call to the timeseries python controller to run the rch data parser function
        $.ajax({
            type: 'POST',
            url: '/apps/swat2/timeseries/',
            data: {
                'watershed_id': watershed_id,
                'watershed': watershed,
                'startDate': start,
                'endDate': end,
                'parameters': parameters,
                'streamID': streamID,
                'monthOrDay': monthOrDay,
                'fileType': fileType
            },
            error: function () {
                $('#error').html('<p class="alert alert-danger" style="text-align: center"><strong>An unknown error occurred while retrieving the data. Please try again</strong></p>');
                $('#error').removeClass('hidden');
                $('#view-reach-loading').addClass('hidden')

                setTimeout(function () {
                    $('#error').addClass('hidden')
                }, 5000);
            },
            success: function (data) {
//              Take the resulting json object from the python function and plot it using the Highcharts API
                data.userId = sessionStorage.userId
                var data_str = JSON.stringify(data)
                sessionStorage.setItem('timeseries', data_str)
                var values = data.Values
                var dates = data.Dates
                var parameters = data.Parameters
                var ns = data.Names
                let names = [...new Set(ns)];
                var reachId = data.ReachID

                var chartContainer

                if (!data.error) {
                    $('#saveData').removeClass('hidden')
                    if (fileType === 'rch') {
                        $('#view-reach-loading').addClass('hidden');
                        $('#rch_chart_container').removeClass('hidden');
                        chartContainer = 'rch_chart_container'
                    } else if (fileType === 'sub') {
                        $('#view-sub-loading').addClass('hidden');
                        $('#sub_chart_container').removeClass('hidden');
                        chartContainer = 'sub_chart_container'
                    }
                }
                var plot_title
                fileType = fileType.toUpperCase()
                var plot_subtitle

                if (parameters.length == 1) {
                    plot_title = 'SWAT ' + fileType.toUpperCase() + ' Data'
                    plot_subtitle = 'BasinID: ' + reachId + ', Parameter: ' + names[0]
                } else {
                    plot_title = 'SWAT ' + fileType.toUpperCase() + ' Data'
                    plot_subtitle = 'BasinID: ' + reachId + ', Parameters: ' + names.toString().split(',').join(', ')
                }

                var seriesOptions = []
                var seriesCounter = 0
                var plot_height = 100/parameters.length - 2
                var plot_height_str = plot_height + '%'
                var top = []
                var yAxes = []
                var colors = ['#002cce','#c10000', '#0e6d00', '#7400ce']
                var data_tag
                if (monthOrDay == 'Monthly') {
                   data_tag = '{point.y:,.1f}'
                } else {
                   data_tag = '{point.y:,.1f}'
                }

                $.each( names, function( i, name ) {
                    seriesOptions[i] = {
                        type: 'area',
                        name: name,
                        data: values[i],
                        yAxis: i,
                        color: colors[i],
                        lineWidth: 1
                    };

                    var plot_top = plot_height * i + 2 * i
                    top.push(plot_top +'%')

                    yAxes[i] = {
                        labels: {
                            align: 'right',
                            x: -3
                        },
                        opposite: false,
                        min: 0,
                        title: {
                          text: name
                        },
                        offset: 0,
                        top: top[i],
                        height: plot_height_str,
                        lineWidth: 1,
                        endOnTick: false,
                        gridLineWidth: 0
                    }


                    seriesCounter += 1;

                    if (seriesCounter === names.length) {
                        Highcharts.setOptions({
                            lang: {
                                thousandsSep: ','
                            }
                        });
                        Highcharts.stockChart(chartContainer, {

                            rangeSelector: {
                                enabled: false
                            },

                            title: {
                                text: plot_title
                            },

                            subtitle: {
                                text: plot_subtitle
                            },

                            xAxis: {
                                type: 'datetime',
                                startonTick: true
                            },

                            yAxis: yAxes,


                            plotOptions: {
                                series: {
                                    showInNavigator: true
                                }
                            },

                            tooltip: {
                                pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>' + data_tag + '</b>',
                                valueDecimals: 2 ,
                                split: true
                            },

                            series: seriesOptions
                        });
                    }
                });
            }
        });
    };

    add_to_cart = function(){
        $.ajax({
            type: 'POST',
            url: "/apps/swat2/save_file/",
            data: sessionStorage.timeseries,
            success: function(result){
                var fileType = result.FileType
                var newrow = '<tr><td>' + result.FileType + '</td><td>' + result.Parameters + '</td><td>' +
                                result.TimeStep + '</td><td>' + result.Start + '</td><td>' +
                                result.End + '</td><td>' + result.StreamID + '</td></tr>'
                $('#tBodyTS').append(newrow);
                if (fileType === 'rch') {
                    $('#rch_save_success').removeClass('hidden')
                    setTimeout(function () {
                        $('#rch_save_success').addClass('hidden')
                    }, 5000);
                }
                else if (fileType === 'sub') {
                    $('#sub_save_success').removeClass('hidden')
                    setTimeout(function () {
                        $('#sub_save_success').addClass('hidden')
                    }, 5000);
                }

            }
        });
    };
      add_to_cart_soil = function() {
          var userID = sessionStorage.userId;
          $.ajax({
              type: 'POST',
              url: "/apps/swat2/save_file_soil/",
              data: {"userID": userID},
              success: function (result) {
                  var newrow = '<tr><td>soil_key</td><td>TXT</td><td>' + sessionStorage.streamID + '</td></tr>'
                  $('#tBodySpatial').append(newrow);
                  var newrow = '<tr><td>soil_legend</td><td>PNG</td><td>' + sessionStorage.streamID + '</td></tr>'
                  $('#tBodySpatial').append(newrow);
                   $('#soil-pie-loading').addClass('hidden')
                  $('#soil_save_success').removeClass('hidden');
                  setTimeout(function () {
                      $('#soil_save_success').addClass('hidden')
                  }, 5000);
              }
          });
      };

       add_to_cart_lulc = function() {
           var userID = sessionStorage.userId;
           $.ajax({
               type: 'POST',
               url: "/apps/swat2/save_file_lulc/",
               data: {"userID": userID},
               success: function (result) {
                   var newrow = '<tr><td>lulc_key</td><td>TXT</td><td>' + sessionStorage.streamID + '</td></tr>'
                   $('#tBodySpatial').append(newrow);
                   var newrow = '<tr><td>lulc_legend</td><td>PNG</td><td>' + sessionStorage.streamID + '</td></tr>'
                   $('#tBodySpatial').append(newrow);
                    $('#lulc-loading').addClass('hidden')
                   $('#lulc_save_success').removeClass('hidden');
                   setTimeout(function () {
                       $('#lulc_save_success').addClass('hidden')
                   }, 5000);
               }
           });
       };


    soil_compute = function(){
        var watershed = sessionStorage.watershed
        var watershed_id = sessionStorage.watershed_id
        var userID = sessionStorage.userId
        var outletID = sessionStorage.streamID
        var rasterType = 'soil'

        $.ajax({
            type: 'POST',
            url: "/apps/swat2/coverage_compute/",
            data: {
                'userID': userID,
                'outletID': outletID,
                'watershed': watershed,
                'watershed_id': watershed_id,
                'raster_type': rasterType
                },
            success: function(result){
                $('#soil-loading').addClass('hidden')
                var classValues = result.classValues
                var classColors = result.classColors
                var classData = []

                for (var key in classValues){
                    classData.push({'name': key, 'y': classValues[key], 'color': classColors[key]})
                }

                $('#soilPieContainer').removeClass('hidden')
                Highcharts.chart('soilPieContainer', {
                    chart: {
                        plotBackgroundColor: null,
                        plotBorderWidth: null,
                        plotShadow: false,
                        type: 'pie'
                    },
                    title: {
                        text: 'Soil Coverages'
                    },
                    tooltip: {
                        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            cursor: 'pointer',
                            dataLabels: {
                                enabled: false,
                                format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                                style: {
                                    color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                                }
                            },
                            showInLegend: true,
                        }
                    },
                    series: [{
                        name: 'Coverage',
                        colorByPoint: true,
                        data: classData
                    }]
                });
            }
        });
    };

    lulc_compute = function(){
        var watershed = sessionStorage.watershed
        var watershed_id = sessionStorage.watershed_id
        var userID = sessionStorage.userId
        var outletID = sessionStorage.streamID
        var rasterType = 'lulc'

        $.ajax({
            type: 'POST',
            url: "/apps/swat2/coverage_compute/",
            data: {
                'userID': userID,
                'outletID': outletID,
                'watershed': watershed,
                'watershed_id': watershed_id,
                'raster_type': rasterType
                },
            success: function(result){
                $('#lulc-pie-loading').addClass('hidden')
//            plot coverage percentages in pie chart
                var classes = result.classes
                var classValues = result.classValues
                var classColors = result.classColors
                var subclassValues = result.subclassValues
                var subclassColors = result.subclassColors
                var classData = []
                var subclassData = []

                for (var key in classValues){
                    classData.push({'name': key, 'y': classValues[key], 'color': classColors[key], 'drilldown': key})
                }

                var data = []
                for (var key in classValues){
                    for (var newKey in classes){
                        if (classes[newKey] === key){
                            data.push({'name': newKey, 'y': subclassValues[newKey], 'color': subclassColors[newKey]})
                        }
                    }
                    subclassData.push({'name': key, 'id': key, 'data': data})
                    data = []
                }

                $('#lulcPieContainer').removeClass('hidden')
                Highcharts.chart('lulcPieContainer', {
                    chart: {
                        plotBackgroundColor: null,
                        plotBorderWidth: null,
                        plotShadow: false,
                        type: 'pie'
                    },
                    title: {
                        text: 'Land Cover Distribution',
                    },
                    tooltip: {
                        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            cursor: 'pointer',
                            dataLabels: {
                                enabled: false,
                                format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                                style: {
                                    color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                                }
                            },
                            showInLegend: true
                        }
                    },
                    series: [{
                        name: 'Coverage',
                        colorByPoint: true,
                        data: classData
                    }],
                    'drilldown': {
                        drillUpButton: {
                            position: {
                                verticalAlign: 'top'
                            }
                        },
                        'series': subclassData
                    }
                });

            }

        })
    }

    update_selectors = function() {
        console.log($('#watershed_select option:selected').val());
        var userId = sessionStorage.userId
        var watershed = sessionStorage.watershed;//$('#watershed_select option:selected').val().split('|')[1]
        var watershed_id = sessionStorage.watershed_id;//$('#watershed_select option:selected').val().split('|')[0]
        $.ajax({
            type: 'POST',
            url: "/apps/swat2/update_selectors/",
            data: {
                'watershed_id':watershed_id,
                'watershed':watershed,
                'userID': userId,
                },
            success: function(result){
                var wsheds=watershed_id?"Yes":"No";
                var rch = result.rch.exists
                sessionStorage.setItem('rch_avail', rch)
                var sub = result.sub.exists
                sessionStorage.setItem('sub_avail', sub)
                var stations = result.stations.exists
                sessionStorage.setItem('stations_avail', stations)
                var lulc = result.lulc.exists
                sessionStorage.setItem('lulc_avail', lulc)
                var soil = result.soil.exists
                sessionStorage.setItem('soil_avail', soil)
                var nasaaccess = result.nasaaccess.exists
                sessionStorage.setItem('nasaaccess_avail', nasaaccess)

                $('.input-daterange input').each(function() {
                    $(this).datepicker('setDate', null)
                    $(this).datepicker('destroy');
                });


                if (rch === 'Yes') {
                    $('#rch-not-avail').addClass('hidden')
                    $('#rch_query').removeClass('hidden')
                    $('#rch_compute').attr('disabled', false)
                    var rch_start = result.rch.start
                    var rch_end = result.rch.end
                    var rch_vars = result.rch.vars;
                    console.log(rch_vars)
                    var rch_date_options = {
                        format: 'MM d, yyyy',
                        startDate: rch_start,
                        endDate: rch_end,
                        startView: 'decade',
                        minViewMode: 'days',
                        orientation: 'bottom auto'
                    }
                    $('.rch_date').datepicker(rch_date_options);

                    $(".rch_var").html('');
                    rch_vars.forEach(function(schema,i){
                        var new_option = new Option(schema[0],schema[1]);
                        $(".rch_var").append(new_option);
                    });
                } else {
                    $('#rch-not-avail').removeClass('hidden')
                    $('#rch_query').addClass('hidden')
                    $('#rch_compute').attr('disabled', true)
                }

                if (sub === 'Yes') {
                    $('#sub-not-avail').addClass('hidden')
                    $('#sub_query').removeClass('hidden')
                    $('#sub_compute').attr('disabled', false)
                    var sub_start = result.sub.start
                    var sub_end = result.sub.end
                    var sub_vars = result.sub.vars
                    var sub_date_options =  {
                        format: 'MM d, yyyy',
                        startDate: sub_start,
                        endDate: sub_end,
                        startView: 'decade',
                        minViewMode: 'days',
                        orientation: 'bottom auto'
                    }
                    $('.sub_date').datepicker(sub_date_options);

                    $(".sub_var").html('');
                    sub_vars.forEach(function(schema,i){
                        var new_option = new Option(schema[0],schema[1]);
                        $(".sub_var").append(new_option);
                    });
                } else {
                    $('#sub-not-avail').removeClass('hidden')
                    $('#sub_query').addClass('hidden')
                    $('#sub_compute').attr('disabled', true)
                }

                $('.start_date').attr("placeholder", "Start Date")
                $('.end_date').attr("placeholder", "End Date")

                if (stations === 'Yes') {
                    $('.stationToggle').removeClass('hidden')
                } else {
                    $('.stationToggle').addClass('hidden')
                }
                if (wsheds === 'Yes') {
                    $('.watershedToggle').removeClass('hidden')
                } else {
                    $('.watershedToggle').addClass('hidden')
                }

                if (lulc === 'Yes') {
                    $('#lulcOption').attr('disabled', false)
                    $('#lulcToggle').attr('disabled', false)
                    $('#lulc-not-avail').addClass('hidden')
                    // $('#clip_lulc').attr('disabled', false)
                    // $('#lulc_compute').attr('disabled', true)
                        $('#clip_and_compute_lulc').attr("disabled",false);
                    $('#lulcOption').attr('disabled', false)
                } else {
                    $('#lulcOption').attr('disabled', true)
                    $('#lulcToggle').attr('disabled', true)
                    $('#lulc-not-avail').removeClass('hidden')
                    // $('#clip_lulc').attr('disabled', true)
                    // $('#lulc_compute').attr('disabled', true)
                      $('#clip_and_compute_lulc').attr("disabled",true);
                }

                if (soil === 'Yes') {
                    $('#soilOption').attr('disabled', false)
                    $('#soilToggle').attr('disabled', false)
                    $('#soil-not-avail').addClass('hidden')
                    // $('#clip_soil').attr('disabled', false)
                    // $('#soil_compute').attr('disabled', true)
                      $('#clip_and_compute_soil').attr("disabled",false);
                } else {
                    $('#soilOption').attr('disabled', true)
                    $('#soilToggle').attr('disabled', true)
                    $('#soil-not-avail').removeClass('hidden')
                    // $('#clip_soil').attr('disabled', true)
                    // $('#soil_compute').attr('disabled', true)
                      $('#clip_and_compute_soil').attr("disabled",true);
                }
                if (nasaaccess === 'Yes') {
                    $('#na-not-avail').addClass('hidden')
                    // $('#nasaaccess').removeClass('hidden')
                    // $('#download_data').removeClass('hidden')
                } else {
                    $('#na-not-avail').removeClass('hidden')
                     $('#nasaaccess').addClass('hidden')
                       $('#download_data').addClass('hidden')
                }
            }
        })
    }

    nasaaccess_validate = function() {
        var watershed = sessionStorage.watershed
        var start = $('#na_start_pick').val()
        var end = $('#na_end_pick').val()
        var functions = [];
        $('.chk:checked').each(function () {
            functions.push($(this).val());
        });
        console.log(functions);
        if ((watershed === undefined || start === 'Start Date' || end === 'End Date') && functions.includes("NEXgdpp") && functions.length> 1) {
            alert('Please be sure you have selected start and end dates');
        }  else if (($('#nex_from').val()=="" || $('#nex_to').val()=="") &&$("#nex_gdpp").is(':checked'))  {
            alert('Please be sure you have selected all the options');
        }else if (functions.length == 0) {
            alert('Please be sure you have selected start and end dates and at least 1 function')
        } else {
             document.getElementById("cont-modal").style.display="block";
             // $("#cont-modal").show();
        }
    }

    nasaaccess = function() {
//      Get the values from the nasaaccess form and pass them to the run_nasaaccess python controller
        var start = $('#na_start_pick').val();
        var end = $('#na_end_pick').val();
        var functions = [];

        $('.chk:checked').each(function() {
             functions.push( $( this ).val());
             if($( this ).val()=="NEXgdpp") {

             }
        });
        var watershed = sessionStorage.watershed
        var userId = sessionStorage.userId
        var email = $('#id_email').val();
        var streamId = sessionStorage.streamID

        $.ajax({
            type: 'POST',
            url: "/apps/swat2/run_nasaaccess/",
            data: {
                'userId': userId,
                'streamId': streamId,
                'startDate': start,
                'endDate': end,
                'functions': functions,
                'watershed': watershed,
                'email': email,
                'nexgdpp':nexgdpp,
            },
        }).done(function() {
            console.log('NASAaccess functions are running')
        });
    }

    reset_all = function(){
        $('#rch_var_select').val([]).trigger('change');
        // // $('#rch_var_select').attr('placeholder', 'Select Variable(s)')
        //    $('.rch_var').select2({'placeholder':'Select Variable(s)'});
        $('#rch_start_pick').val('')
        $('#rch_end_pick').val('')
        $('#rch_start_pick').attr('placeholder', 'Start Date')
        $('#rch_end_pick').attr('placeholder', 'End Date')
        $('#rch_chart_container').addClass('hidden');
        $('#sub_var_select').val([]).trigger('change');
        // $('#sub_var_select').attr('placeholder', 'Select Variable(s)')
        //     $('#sub_var_select').select2({'placeholder':'Select Variable(s)'});
        $('#sub_start_pick').val('')
        $('#sub_end_pick').val('')
        $('#sub_start_pick').attr('placeholder', 'Start Date')

        $('#sub_end_pick').attr('placeholder', 'End Date')
        $('#sub_chart_container').addClass('hidden');
        $('#lulcPieContainer').addClass('hidden');
        $('#soilPieContainer').addClass('hidden');
        if (sessionStorage.lulc_avail === 'Yes') {
            // $('#clip_lulc').attr('disabled', false)
            // $('#lulc_compute').attr('disabled', true)
              $('#clip_and_compute_lulc').attr("disabled",false);
        }
        if (sessionStorage.soil_avail === 'Yes') {
            // $('#clip_soil').attr('disabled', false)
            // $('#soil_compute').attr('disabled', true)
              $('#clip_and_compute_soil').attr("disabled",false);
        }
        rch_map.removeLayer(featureOverlayStream)
        rch_map.removeLayer(upstreamOverlayStream)
        sub_map.removeLayer(featureOverlaySubbasin)
        sub_map.removeLayer(upstreamOverlaySubbasin)
        lulc_map.removeLayer(upstreamOverlaySubbasin)
        soil_map.removeLayer(upstreamOverlaySubbasin)
        nasaaccess_map.removeLayer(upstreamOverlaySubbasin)
    }



    init_all = function(){
         var xhr = $.ajax({
            type: "POST",
            url: "ws_options",
            dataType: "json",
            data:{}
        });
        xhr.done(function (data) {
            if ("success" in data) {
               var ws= data.ws_options;
               ws.map(function (wshed) {

                   var option=new Option(wshed[0],wshed[1]);
                   $("#watershed_select").append(option);

               });
                $("#watershed_select option[value='Lower Mekong']").prop('selected', true);

                var watershed = $('#watershed_select option:selected').val().split('|')[1];
                console.log(watershed);
                sessionStorage.setItem('watershed', watershed)
                var watershed_id = $('#watershed_select option:selected').val().split('|')[0]
                sessionStorage.setItem('watershed_id', watershed_id)
              // $('#watershed_select').trigger('change');
                console.log(watershed_id)
            } else {
                console.log(xhr.responseText);
            }
        });


        init_map();
        updateView();
        init_rch_map();
        init_sub_map();
        init_lulc_map();
        init_soil_map();
        init_nasaaccess_map();
        init_events();
    };

    /************************************************************************
     *                        DEFINE PUBLIC INTERFACE
     *************************************************************************/

    public_interface = {

    };

    /************************************************************************
     *                  INITIALIZATION / CONSTRUCTOR
     *************************************************************************/
    // Initialization: jQuery function that gets called when
    // the DOM tree finishes loading

    $(function() {

        sessionStorage.setItem('userId', Math.random().toString(36).substr(2,5))
        // var watershed = $('#watershed_select option:selected').val().split('|')[1]
        // sessionStorage.setItem('watershed', watershed)
        // var watershed_id = $('#watershed_select option:selected').val().split('|')[0]
        // sessionStorage.setItem('watershed_id', watershed_id)
        $('input[name=userID]').val(sessionStorage.userId)
        init_all();
        update_selectors();
        toggleLayers();
       // $("#help-modal").modal('show');

        $(".radio").change(function(){
            clearLayers();
            toggleLayers();
        })

        $(".basinToggle").change(function(){
            clearLayers();
            toggleLayers();

        })

        $(".stationToggle").change(function(){
            clearLayers();
            toggleLayers();
        })
         $(".watershedToggle").change(function(){
            clearLayers();
            toggleLayers();
        })


        $('#watershed_select').change(function(){
            var watershed = $('#watershed_select option:selected').val().split('|')[1]
            sessionStorage.setItem('watershed', watershed)
            var watershed_id = $('#watershed_select option:selected').val().split('|')[0]
            sessionStorage.setItem('watershed_id', watershed_id)
            update_selectors();
            clearLayers();
            toggleLayers();
            updateView();
        })

        $(".nav-tabs").click(function(){
            $('#rch_compute').addClass('hidden')
            $('#sub_compute').addClass('hidden')
            // $('#clip_lulc').addClass('hidden')
            // $('#lulc_compute').addClass('hidden')
            // $('#clip_soil').addClass('hidden')
            // $('#soil_compute').addClass('hidden')
            $('#clip_and_compute_lulc').addClass('hidden')
             $('#clip_and_compute_soil').addClass('hidden')
             $('#saveDataLulc').addClass('hidden')
             $('#saveDataSoil').addClass('hidden')
            $('#saveData').addClass('hidden')
            $('#downloadData').addClass('hidden')
            setTimeout(updateTab, 300);
        })

        $("#rch_compute").click(function(){
            $('#view-reach-loading').removeClass('hidden')
            var watershed_id = sessionStorage.watershed_id
            var watershed= sessionStorage.watershed;
 //2014-07-10
            var start = $('#rch_start_pick').val();
            var end =$('#rch_end_pick').val();

            var parameters = []
            $('#rch_var_select option:selected').each(function() {
                parameters.push( $( this ).val());
            });
            var streamID = sessionStorage.streamID
            var fileType = 'rch';

       if ($(".chartToggle .toggle").hasClass( "off" )){
           monthOrDay = 'Daily'
       } else {
           monthOrDay = 'Monthly'
       }
       console.log(monthOrDay);
            get_time_series(watershed_id, watershed, start, end, parameters, streamID, fileType);
        })

        $("#sub_compute").click(function() {

            $('#view-sub-loading').removeClass('hidden')


            var watershed_id = sessionStorage.watershed_id
             var watershed = sessionStorage.watershed

            var start = $('#sub_start_pick').val();
            var end = $('#sub_end_pick').val();
            var parameters = []
            $('#sub_var_select option:selected').each(function () {
                parameters.push($(this).val());
            });
            var streamID = sessionStorage.streamID
            var fileType = 'sub';
            if ($(".subchartToggle .toggle").hasClass("off")) {
                monthOrDay = 'Daily'
            } else {
                monthOrDay = 'Monthly'
            }
            get_time_series(watershed_id, watershed, start, end, parameters, streamID, fileType);
        })

        var span = document.getElementById("help-close");
        span.onclick=function () {
            document.getElementById("help-modal").style.display="none";
             document.getElementsByClassName("modal-backdrop")[0].style.display="none";
        }

         var span = document.getElementById("close");
        span.onclick=function () {
            document.getElementById("data-modal").style.display="none";
             document.getElementsByClassName("modal-backdrop")[0].style.display="none";
        }

        $("#help-modal-btn").click(function(){
           $("#help-modal").show();
        });
          $("#data-modal-btn").click(function(){
           $("#data-modal").show();
        });
           $("#close_tab").click(function(){
           $("#data-modal").hide();
        });

        // $('#clip_lulc').click(function(){
        //     clip_rasters('lulc')
        // })
        //
        // $('#clip_soil').click(function(){
        //     clip_rasters('soil')
        // })
        //
        // $("#lulc_compute").click(function(){
        //     var raster_type = 'lulc'
        //     lulc_compute(raster_type);
        //     $('#lulc-pie-loading').removeClass('hidden')
        // })
        //
        // $("#soil_compute").click(function(){
        //     var raster_type = 'soil'
        //     soil_compute(raster_type);
        //     $('#soil-pie-loading').removeClass('hidden')
        // })

        $("#saveData").click(function(){
            add_to_cart();
        });
          $("#saveDataSoil").click(function(){
            add_to_cart_soil();
        });
            $("#saveDataLulc").click(function(){
            add_to_cart_lulc();
        });
        $("#cont-close").click(function(){
            $("#cont-modal").hide();
        });



         $("#nex_save").click(function(){
             nexgdpp=[];
                var model = $('#nex_model :selected').text();
                 var type = $('#nex_type :selected').text();
                 var slice = $('#nex_slice :selected').text();
                 var start=$('#nex_from').val();
                 var end=$('#nex_to').val();
                 if(start==""||end==""){
                     alert("Please select a start date and end date")
                 }
                 else{
                     $("#nexgdpp-modal").hide();
                 }
                 nexgdpp.push(model);
                 nexgdpp.push(type);
                 nexgdpp.push(slice);
                  nexgdpp.push(start);
                   nexgdpp.push(end);

         })

        $("#nasaaccess").click(function(){
            nasaaccess_validate();
        })

        $('#clip_and_compute_lulc').click(function(){
        $('#saveDataLulc').removeClass('hidden')

            clip_rasters('lulc');
            // var raster_type = 'lulc';
    //        lulc_compute(raster_type);
         //   $('#lulc-pie-loading').removeClass('hidden');
        });

        $('#clip_and_compute_soil').click(function(){
            $('#saveDataSoil').removeClass('hidden')
            clip_rasters('soil');
               //var raster_type = 'soil';
            //soil_compute(raster_type);
      //      $('#soil-pie-loading').removeClass('hidden');
        });

        $("#download_data").click(function(){
            $("#download-modal").show();
        })
        $('#nex_gdpp').click(function(){
            if($(this).is(':checked')){
                 // $("#nexgdpp-modal").show();
                  document.getElementById("nexgdpp-modal").style.display="block";
            }
        });



        $('#na_submit').click(function() {
            if ($("#id_email").val().length==0)
            {
                alert("Please enter an email address");
            }
            else document.getElementById("cont-modal").style.display="none";

            nasaaccess();
        });

    })
    return public_interface;

    // Initialization: jQuery function that gets called when
    // the DOM tree finishes loading

}());// End of package wrapper
// NOTE: that the call operator (open-closed parenthesis) is used to invoke the library wrapper
// function immediately after being parsed.


//    function loadXMLDoc() {
//        var request = new XMLHttpRequest();
//        request.onreadystatechange = function() {
//            if (this.readyState == 4 && this.status == 200) {
//                update_selectors(this);
//            }
//        };
//        request.open("GET", "/static/swat2/watershed_data/watershed_info.xml", true);
//        request.send();
//    };
//
//
//    update_selectors = function(xml) {
//        var watershed, xmlDoc, x, i, watershed_num, start_date, end_date, params_list
//        watershed = $('#watershed_select option:selected').val()
//        xmlDoc = xml.responseXML;
//        x = xmlDoc.getElementsByTagName('watershed');
//        for (i = 0; i< x.length; i++) {
//            var watershed_name = x[i].childNodes[0].innerHTML
//            if (String(watershed_name) === String(watershed)) {
//                watershed_num = i
//            }
//        }
//
//
//        if ($(".toggle").hasClass( "off")) {
//            start_date = xmlDoc.getElementsByTagName("day_start_date")[watershed_num].innerHTML
//            end_date = xmlDoc.getElementsByTagName("day_end_date")[watershed_num].innerHTML
//            var options = {
//                format: 'MM d, yyyy',
//                startDate: start_date,
//                endDate: end_date,
//                startView: 'decade',
//                minViewMode: 'days',
//                orientation: 'bottom auto'
//            }
//            $('.input-daterange input').each(function() {
//                $(this).datepicker('setDate', null)
//                $(this).datepicker('destroy');
//                $(this).datepicker(options);
//            });
//        } else {
//            start_date = xmlDoc.getElementsByTagName("month_start_date")[watershed_num].innerHTML;
//            end_date = xmlDoc.getElementsByTagName("month_end_date")[watershed_num].innerHTML;
//            var options = {
//                format: 'MM yyyy',
//                startDate: start_date,
//                endDate: end_date,
//                startView: 'decade',
//                minViewMode: 'months',
//                orientation: 'bottom auto'
//            }
//            $('.input-daterange input').each(function() {
//                $(this).datepicker('setDate', null)
//                $(this).datepicker('destroy');
//                $(this).datepicker(options);
//            });
//        }
//        $('#rch_start_pick').attr('placeholder', 'Start Date')
//        $('#rch_end_pick').attr('placeholder', 'End Date')
//
//    }
