import 'dart:async';
import 'dart:collection';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_map/plugin_api.dart';
import 'package:flutter_map_marker_cluster/flutter_map_marker_cluster.dart';
import 'package:flutter_svg/svg.dart';
import 'package:latlong2/latlong.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:simple_mustache/simple_mustache.dart';
import 'package:http/http.dart' as http;
import 'package:location/location.dart';

import 'package:chest/helpers/zona.dart';
import 'package:chest/managers/poi.dart';
import 'package:chest/helpers/colors_custo.dart';
import '../helpers/poi.dart';

class MyMap extends StatefulWidget {
  const MyMap({Key? key}) : super(key: key);

  @override
  State<StatefulWidget> createState() => _MyMap();
}

class _MyMap extends State<MyMap> {
  final double maxZum = 19;
  final double lado = 0.0256;
  List<Marker> _myMarkers = <Marker>[];
  List<Marker> _myPosition = <Marker>[];
  List<TeselaPoi> lpoi = <TeselaPoi>[];
  late int faltan;

  final _contributionStyle = const TextStyle(
    fontSize: 10.0,
    color: Colors.black,
    backgroundColor: Colors.black26,
  );

  late MapController mapController;
  late StreamSubscription<MapEvent> strSubMapMovEnd, strSubMapFlyEnd;

  @override
  void initState() {
    mapController = MapController();
    mapController.onReady.then((value) => {});
    strSubMapMovEnd = mapController.mapEventStream
        .where((event) => event is MapEventMoveEnd)
        .listen((event) {
      checkCurrentMap(mapController.bounds);
    });
    strSubMapFlyEnd = mapController.mapEventStream
        .where((event) => event is MapEventFlingAnimationEnd)
        .listen((event) {
      checkCurrentMap(mapController.bounds);
    });
    super.initState();
  }

  @override
  void dispose() {
    strSubMapMovEnd.cancel();
    strSubMapFlyEnd.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: Row(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              SvgPicture.asset(
                'images/logo.svg',
                height: 32,
              ),
              Container(
                  padding: const EdgeInsets.all(8.0),
                  child: Text(AppLocalizations.of(context)!.chest)),
            ],
          ),
          actions: [
            Row(
              children: [
                TextButton(
                  child: const Icon(Icons.menu, color: Colors.white),
                  onPressed: () => {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                        backgroundColor: ColorsCusto.pBlue,
                        content: Text(AppLocalizations.of(context)!.porHacer)))
                  },
                )
              ],
            )
          ],
          //backgroundColor: const Color.fromARGB(255, 4, 26, 65),
          backgroundColor: ColorsCusto.pBlue,
        ),
        body: Stack(children: [
          FlutterMap(
            options: MapOptions(
                center: LatLng(41.6529, -4.72839),
                zoom: 17.0,
                maxZoom: maxZum,
                minZoom: 15,
                pinchZoomThreshold: 1.0,
                enableScrollWheel: true,
                onLongPress: (tapPosition, position) =>
                    pruebaPulsacionLarga(position),
                onPositionChanged: (mapPos, vF) => funInicial(mapPos, vF),
                plugins: [
                  MarkerClusterPlugin(),
                ]),
            nonRotatedLayers: [
              TileLayerOptions(
                maxZoom: 20,
                urlTemplate:
                    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                /*urlTemplate:
                    "https://api.mapbox.com/styles/v1/pablogz/ckvpj1ed92f7u14phfhfdvkor/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoicGFibG9neiIsImEiOiJja3Z4b3VnaTUwM2VnMzFtdjJ2Mm4zajRvIn0.q0l3ZzhT4BzKafNxdQuSQg",*/
                subdomains: ['a', 'b', 'c'],
                backgroundColor: Colors.grey,
                attributionBuilder: (c) {
                  return Text(
                    AppLocalizations.of(c)!.contribOSM,
                    style: _contributionStyle,
                  );
                },
              ),
              MarkerLayerOptions(
                markers: _myPosition,
              ),
              MarkerClusterLayerOptions(
                maxClusterRadius: 75,
                centerMarkerOnClick: false,
                disableClusteringAtZoom: maxZum.toInt(),
                size: const Size(52, 52),
                markers: _myMarkers,
                fitBoundsOptions:
                    const FitBoundsOptions(padding: EdgeInsets.all(0)),
                polygonOptions: PolygonOptions(
                    borderColor: (ColorsCusto.pBluet[500])!,
                    color: (ColorsCusto.pBluet[100])!,
                    borderStrokeWidth: 1),
                builder: (context, markers) {
                  int tama = markers.length;
                  int intensidad;
                  if (tama <= 5) {
                    intensidad = 300;
                  } else {
                    if (tama <= 15) {
                      intensidad = 500;
                    } else {
                      intensidad = 700;
                    }
                  }
                  return Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(52),
                        color: ColorsCusto.cRed[intensidad],
                        border:
                            Border.all(color: ColorsCusto.cRed[900]!, width: 2),
                      ),
                      child: Center(
                        child: Text(
                          markers.length.toString(),
                          style: TextStyle(
                              color: (tama <= 5) ? Colors.black : Colors.white),
                        ),
                      ));
                },
              ),
              //MarkerLayerOptions(markers: _myMarkers)
            ],
            mapController: mapController,
          ),
          Container(
              margin: const EdgeInsets.only(bottom: 48, right: 24),
              alignment: Alignment.bottomRight,
              child: FloatingActionButton(
                child: Icon(
                  Icons.adjust,
                  color: useLocation ? Colors.blue[300] : Colors.white,
                ),
                onPressed: () => locationUser(),
                backgroundColor: ColorsCusto.pBlue,
              ))
        ]));
  }

  void pruebaPulsacionLarga(LatLng pos) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        backgroundColor: ColorsCusto.pBlue,
        content: Text(Mustache(map: {
          'mlat': AppLocalizations.of(context)!.latitud,
          'lat': round(pos.latitude, decimals: 3),
          'mlng': AppLocalizations.of(context)!.longitud,
          'lng': round(pos.longitude, decimals: 3)
        }).convert('{{mlat}}: {{lat}}\n{{mlng}}: {{lng}}'))));
  }

  funInicial(MapPosition mapPos, bool vF) {
    if (!vF) {
      checkCurrentMap(mapPos.bounds);
    }
  }

  void checkCurrentMap(mapBounds) {
    //return;
    _myMarkers = <Marker>[];
    if (mapBounds is LatLngBounds) {
      LatLng pI = startPointCheck(mapBounds.northWest);
      HashMap c = buildTeselas(pI, mapBounds.southEast);
      var pLng, pLat, puntoComprobacion, encontrado;
      faltan = 0;

      for (int i = 0; i < c["ch"]; i++) {
        pLng = pI.longitude + (i * lado);
        for (int j = 0; j < c["cv"]; j++) {
          pLat = pI.latitude - (j * lado);
          puntoComprobacion = LatLng(pLat, pLng);
          encontrado = false;
          late TeselaPoi tp;
          for (tp in lpoi) {
            if (tp.isEqual(puntoComprobacion)) {
              encontrado = true;
              break;
            }
          }
          if (!encontrado || !tp.isValid()) {
            ++faltan;
            newZone(puntoComprobacion, mapBounds);
          } else {
            addMarkers2Map(tp.getPois(), mapBounds);
          }
        }
      }
    }
  }

  LatLng startPointCheck(final LatLng nW) {
    final LatLng posRef = LatLng(41.6529, -4.72839);
    double esquina, gradosMax;
    var s = <double>[];
    for (var i = 0; i < 2; i++) {
      esquina = (i == 0)
          ? posRef.latitude -
              (((posRef.latitude - nW.latitude) / lado)).floor() * lado
          : posRef.longitude -
              (((posRef.longitude - nW.longitude) / lado)).ceil() * lado;
      gradosMax = (i + 1) * 90;
      if (esquina.abs() > gradosMax) {
        if (esquina > gradosMax) {
          esquina = gradosMax;
        } else {
          if (esquina < (-1 * gradosMax)) {
            esquina = (-1 * gradosMax);
          }
        }
      }
      s.add(esquina);
    }
    return LatLng(s[0], s[1]);
  }

  /// Calcula el número de teselas que se van a mostrar en la pantalla actual
  /// nw Noroeste
  /// se Sureste
  HashMap<String, int> buildTeselas(LatLng nw, LatLng se) {
    HashMap<String, int> hm = HashMap<String, int>();
    hm["cv"] = ((nw.latitude - se.latitude) / lado).ceil();
    hm["ch"] = ((se.longitude - nw.longitude) / lado).ceil();
    return hm;
  }

  void newZone(LatLng nW, LatLngBounds mapBounds) {
    final String stringUri = Mustache(map: {
      'north': nW.latitude,
      'west': nW.longitude
    }).convert(
        'https://chest.gsic.uva.es/servidor/contexts/?lat={{north}}&long={{west}}');
    print(stringUri);

    http.get(Uri.parse(stringUri)).then((response) {
      switch (response.statusCode) {
        case 200:
          return json.decode(response.body);
        default:
          return null;
      }
    }).then((data) {
      if (data != null) {
        List<POI> pois = <POI>[];
        for (var p in data) {
          try {
            final POI poi = POI(p['ctx'], p['lat'], p['long'], p['titulo'],
                p['descr'], p['autor'], p['imagen']);
            pois.add(poi);
          } catch (e) {
            //El poi está mal formado
          }
        }
        faltan = (faltan > 0) ? faltan - 1 : 0;
        lpoi.add(TeselaPoi(nW.latitude, nW.longitude, pois));
        addMarkers2Map(pois, mapBounds);
      }
    });
  }

  void addMarkers2Map(List<POI> pois, LatLngBounds mapBounds) {
    List<POI> visiblePois = <POI>[];
    for (POI poi in pois) {
      if (mapBounds.contains(LatLng(poi.getLat(), poi.getLng()))) {
        visiblePois.add(poi);
      } /*else {
        print(Mustache(map: {
          "n": mapBounds.north,
          "e": mapBounds.east,
          "s": mapBounds.south,
          "w": mapBounds.west,
          "lat": poi.getLat(),
          "lng": poi.getLng(),
          "t": poi.getTitulo()
        }).convert("{{t}}: [{{lat}},{{lng}}] -> [[{{n}},{{w}}],[{{s}},{{e}}]]"));
      }*/
    }
    if (visiblePois.isNotEmpty) {
      for (POI poi in visiblePois) {
        final String intermedio =
            poi.getTitulo().replaceAllMapped(RegExp(r'[^A-Z]'), (m) => "");
        final String iniciales =
            intermedio.substring(0, min(3, intermedio.length));
        late Container icono;
        if (poi.isImagen() == true &&
            poi
                .getImagen()
                .contains('commons.wikimedia.org/wiki/Special:FilePath/')) {
          String imagen = poi.getImagen().replaceFirst('http://', 'https://');
          if (!imagen.contains('width=')) {
            imagen = Mustache(map: {'url': imagen})
                .convert('{{url}}?width=50&height=50');
          }
          icono = Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: (ColorsCusto.cRed[900])!, width: 2),
                image: DecorationImage(
                    image: Image.network(
                      imagen,
                      errorBuilder: (context, error, stack) => Center(
                          child: Text(iniciales, textAlign: TextAlign.center)),
                    ).image,
                    fit: BoxFit.cover)),
          );
        } else {
          icono = Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: (ColorsCusto.cRed[900])!, width: 2),
              color: (ColorsCusto.cRed[900])!,
            ),
            child: Center(child: Text(iniciales, textAlign: TextAlign.center)),
            width: 52,
            height: 52,
          );
        }
        _myMarkers.add(Marker(
            width: 52,
            height: 52,
            point:
                //LatLng(double.parse(p['lat']), double.parse(p['long'])),
                LatLng(poi.getLat(), poi.getLng()),
            builder: (context) => FloatingActionButton(
                  tooltip: poi.getTitulo(),
                  heroTag: null,
                  elevation: 0,
                  backgroundColor: (ColorsCusto.cRed[900])!,
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (BuildContext context) => InfoPOI(poi),
                        fullscreenDialog: true,
                      ),
                    );
                    mapController.move(
                        LatLng(poi.getLat(), poi.getLng()), mapController.zoom);
                  },
                  child: icono,
                )));
      }
    }
    if (faltan == 0) {
      setState(() {});
    }
  }

  late StreamSubscription<LocationData> l;
  bool useLocation = false;

  Future<void> locationUser() async {
    if (!useLocation) {
      //https://pub.dev/packages/location
      Location location = Location();
      bool _serviceEnabled;
      PermissionStatus _permissionGranted;

      _serviceEnabled = await location.serviceEnabled();
      if (!_serviceEnabled) {
        _serviceEnabled = await location.requestService();
        if (!_serviceEnabled) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              backgroundColor: ColorsCusto.cRed,
              content: Text(AppLocalizations.of(context)!
                  .serviciosLocalizacionDescativados)));
          return;
        }
      }

      _permissionGranted = await location.hasPermission();
      if (_permissionGranted == PermissionStatus.denied) {
        _permissionGranted = await location.requestPermission();
        if (_permissionGranted != PermissionStatus.granted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              backgroundColor: ColorsCusto.cRed,
              content: Text(
                  AppLocalizations.of(context)!.aceptarPermisosUbicacion)));
          return;
        }
      }

      location.getLocation().then((v) {
        if (v.latitude is double && v.longitude is double) {
          mapController.move(LatLng(v.latitude!, v.longitude!), maxZum - 1);
        }
      });
      l = location.onLocationChanged.listen((LocationData ld) {
        _myPosition = [];
        if (ld.accuracy is double &&
            ld.latitude is double &&
            ld.longitude is double) {
          double ac = max(ld.accuracy! / 2, 20);
          _myPosition.add(Marker(
              width: ac,
              height: ac,
              point: LatLng(ld.latitude!, ld.longitude!),
              builder: (context) => Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(ac),
                    color: Colors.blue[300]?.withOpacity(0.65),
                  ),
                  child: Center(
                    child: Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          color: ColorsCusto.pBlue[500],
                          border: Border.all(color: Colors.white, width: 3),
                        )),
                  ))));
          setState(() {});
        }
      });
      useLocation = true;
    } else {
      l.cancel();
      useLocation = false;
      _myPosition = [];
      setState(() {});
    }
  }
}
