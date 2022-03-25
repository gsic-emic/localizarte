import 'dart:async';
import 'dart:collection';
import 'dart:convert';
import 'dart:io';
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

import '../helpers/config.dart';
import '../helpers/zona.dart';
import '../managers/poi.dart';
import '../helpers/colors_custo.dart';
import '../helpers/poi.dart';
import '../helpers/user.dart' as user;
import './user.dart';

class MyMap extends StatefulWidget {
  const MyMap({Key? key}) : super(key: key);

  @override
  State<StatefulWidget> createState() => _MyMap();
}

class _MyMap extends State<MyMap> with TickerProviderStateMixin {
  final double maxZum = 19;
  final double lado = 0.0254;
  List<Marker> _myMarkers = <Marker>[];
  List<Marker> _myPosition = <Marker>[];
  List<TeselaPoi> lpoi = <TeselaPoi>[];
  late int faltan;
  bool userR = false;
  late user.User usuario;
  bool _cargaInicial = true;

  final _contributionStyle = const TextStyle(
    fontSize: 10.0,
    color: Colors.black,
    backgroundColor: Colors.black26,
  );

  late MapController mapController;
  late StreamSubscription<MapEvent> strSubMap;

  @override
  void initState() {
    super.initState();
    usuario = user.User.noLogin();
    mapController = MapController();
    mapController.onReady.then((value) => {});
    strSubMap = mapController.mapEventStream
        .where((event) =>
            event is MapEventMoveEnd || event is MapEventDoubleTapZoomEnd)
        .listen((event) {
      checkMarkerType();
    });
  }

  @override
  void dispose() {
    strSubMap.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton(
          tooltip: AppLocalizations.of(context)!.mUbicacion,
          child: Icon(
            Icons.adjust,
            color: useLocation ? Colors.blue[300] : Colors.white,
          ),
          onPressed: () => locationUser()),
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
        actions: (!userR)
            ? [
                IconButton(
                  onPressed: () {
                    usuario = User.logInUser();
                    userR = usuario.getUsername().isNotEmpty;
                    setState(() {});
                  },
                  icon: const Icon(Icons.login),
                  tooltip: AppLocalizations.of(context)!.iniciarSes,
                ),
                PopupMenuButton(
                    color: ColorsCusto.pBlue,
                    tooltip: AppLocalizations.of(context)!.mOpt,
                    itemBuilder: (context) => [
                          PopupMenuItem(
                              onTap: () => ScaffoldMessenger.of(context)
                                  .showSnackBar(SnackBar(
                                      content: Text(
                                          AppLocalizations.of(context)!
                                              .porHacer))),
                              child: Row(children: [
                                Container(
                                    padding: const EdgeInsets.all(10),
                                    child: const Icon(Icons.info)),
                                Text(
                                  AppLocalizations.of(context)!.infor,
                                  style: const TextStyle(color: Colors.white),
                                )
                              ])),
                        ]),
              ]
            : (usuario.getRol() <= 0)
                ? [
                    IconButton(
                      onPressed: () {},
                      icon: const Icon(Icons.task),
                      tooltip: AppLocalizations.of(context)!.respuestas,
                    ),
                    PopupMenuButton(
                        color: ColorsCusto.pBlue,
                        tooltip: AppLocalizations.of(context)!.mOpt,
                        itemBuilder: (context) => [
                              PopupMenuItem(
                                  onTap: () {},
                                  child: Row(children: [
                                    Container(
                                        padding: const EdgeInsets.all(10),
                                        child: const Icon(Icons.settings)),
                                    Text(
                                      AppLocalizations.of(context)!.ajustes,
                                      style:
                                          const TextStyle(color: Colors.white),
                                    ),
                                  ])),
                              PopupMenuItem(
                                  onTap: () {},
                                  child: Row(children: [
                                    Container(
                                        padding: const EdgeInsets.all(10),
                                        child: const Icon(Icons.person)),
                                    Text(
                                      AppLocalizations.of(context)!.cerrarSes,
                                      style:
                                          const TextStyle(color: Colors.white),
                                    ),
                                  ])),
                              PopupMenuItem(
                                  child: Row(children: [
                                Container(
                                    padding: const EdgeInsets.all(10),
                                    child: const Icon(Icons.logout)),
                                Text(
                                  AppLocalizations.of(context)!.cerrarSes,
                                  style: const TextStyle(color: Colors.white),
                                )
                              ])),
                              PopupMenuItem(
                                  child: Row(children: [
                                Container(
                                    padding: const EdgeInsets.all(10),
                                    child: const Icon(Icons.info)),
                                Text(
                                  AppLocalizations.of(context)!.infor,
                                  style: const TextStyle(color: Colors.white),
                                )
                              ])),
                            ]),
                  ]
                : [
                    IconButton(
                      onPressed: () {},
                      icon: const Icon(Icons.app_registration_outlined),
                      tooltip: AppLocalizations.of(context)!.contrib,
                    ),
                    PopupMenuButton(
                        color: ColorsCusto.pBlue,
                        tooltip: AppLocalizations.of(context)!.mOpt,
                        itemBuilder: (context) => [
                              PopupMenuItem(
                                  onTap: () {},
                                  child: Row(children: [
                                    Container(
                                        padding: const EdgeInsets.all(10),
                                        child: const Icon(Icons.settings)),
                                    Text(
                                      AppLocalizations.of(context)!.ajustes,
                                      style:
                                          const TextStyle(color: Colors.white),
                                    ),
                                  ])),
                              PopupMenuItem(
                                  onTap: () {},
                                  child: Row(children: [
                                    Container(
                                        padding: const EdgeInsets.all(10),
                                        child: const Icon(Icons.person)),
                                    Text(
                                      AppLocalizations.of(context)!.cerrarSes,
                                      style:
                                          const TextStyle(color: Colors.white),
                                    ),
                                  ])),
                              PopupMenuItem(
                                  child: Row(children: [
                                Container(
                                    padding: const EdgeInsets.all(10),
                                    child: const Icon(Icons.logout)),
                                Text(
                                  AppLocalizations.of(context)!.cerrarSes,
                                  style: const TextStyle(color: Colors.white),
                                )
                              ])),
                              PopupMenuItem(
                                  child: Row(children: [
                                Container(
                                    padding: const EdgeInsets.all(10),
                                    child: const Icon(Icons.info)),
                                Text(
                                  AppLocalizations.of(context)!.infor,
                                  style: const TextStyle(color: Colors.white),
                                )
                              ])),
                            ]),
                  ],
      ),
      body: FlutterMap(
        options: MapOptions(
            center: LatLng(41.6529, -4.72839),
            //center: LatLng(43.608, 1.443),
            zoom: 16.0,
            maxZoom: maxZum,
            minZoom: 10,
            interactiveFlags: InteractiveFlag.pinchZoom |
                InteractiveFlag.doubleTapZoom |
                InteractiveFlag.drag,
            enableScrollWheel: true,
            onLongPress: (tapPosition, position) => longPress(position),
            onPositionChanged: (mapPos, vF) => funInicial(mapPos, vF),
            pinchZoomThreshold: 1.0,
            plugins: [
              MarkerClusterPlugin(),
            ]),
        // nonRotatedLayers: [], Problemas al mover.
        //Mejor no usar y pasar a quitar la rotación con interactiveFlags
        children: [
          TileLayerWidget(
              options: TileLayerOptions(
            minZoom: 1,
            maxZoom: 20,
            urlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
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
          )),
          MarkerLayerWidget(
            options: MarkerLayerOptions(markers: _myPosition),
          ),
          MarkerClusterLayerWidget(
              options: MarkerClusterLayerOptions(
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
                    border: Border.all(color: ColorsCusto.cRed[900]!, width: 2),
                  ),
                  child: Center(
                    child: Text(
                      markers.length.toString(),
                      style: TextStyle(
                          color: (tama <= 5) ? Colors.black : Colors.white),
                    ),
                  ));
            },
          )),
        ],
        mapController: mapController,
      ),
    );
  }

  Future<void> longPress(LatLng pos) async {
    if (mapController.zoom >= 15) {
      _animatedMapMove(pos, mapController.zoom);
      POI poi = await showDialog(
          context: context,
          barrierDismissible: true,
          builder: (context) => SimpleDialog(
                  title: Text(
                    Mustache(map: {
                      "point": AppLocalizations.of(context)!.point,
                      "lat": pos.latitude.toStringAsFixed(5),
                      "lng": pos.longitude.toStringAsFixed(5)
                    }).convert("{{point}} ({{lat}}, {{lng}})"),
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                  children: [
                    Padding(
                        padding:
                            const EdgeInsets.only(top: 5, left: 10, right: 10),
                        child: SizedBox(
                            width: 500,
                            height: 55,
                            child: ElevatedButton(
                              onPressed: () {
                                Navigator.pop(
                                    context,
                                    POI.onlyPosition(
                                        pos.latitude, pos.longitude));
                              },
                              child: Text(
                                AppLocalizations.of(context)!.addPOI,
                              ),
                              style: ButtonStyle(
                                  backgroundColor: MaterialStateProperty.all(
                                      ColorsCusto.pBlue),
                                  foregroundColor:
                                      MaterialStateProperty.all(Colors.white)),
                            ))),
                    const Padding(padding: EdgeInsets.all(10)),
                    Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        child: Text(
                          AppLocalizations.of(context)!.addPOIsug,
                          style: const TextStyle(fontSize: 16),
                          textAlign: TextAlign.start,
                        )),
                    puntosCercanos(pos),
                  ])).then((value) {
        if (value == null) {
          return POI.empty();
        } else {
          return value;
        }
      });

      if (!poi.isEmpty) {
        await Navigator.push(
          context,
          MaterialPageRoute<void>(
            builder: (BuildContext context) => FormPOI(poi),
            fullscreenDialog: false,
          ),
        );
        //TODO: tengo que limpiar la zona para descargar los nuevos datos del servidor
        checkMarkerType();
      }
    }
  }

  Future<List> _poiNearSug(LatLng pos) {
    final double incr = (maxZum - mapController.zoom + 1) / 400;
    final String q1 = Mustache(map: {
      "lat": pos.latitude,
      "lng": pos.longitude,
      "incr": incr,
      "lim": 800
    }).convert(
        "https://crafts.gsic.uva.es/apis/localizarteV2/query?id=places-en&latCenter={{lat}}&lngCenter={{lng}}&halfSideDeg={{incr}}&isNotType=http://dbpedia.org/ontology/PopulatedPlace&limit={{lim}}");

    return http
        .get(Uri.parse(q1), headers: {
          "Authorization": Mustache(map: {"token": Config().tokenCraft})
              .convert("Bearer {{token}}")
        })
        .then((response) =>
            (response.statusCode == 200) ? json.decode(response.body) : null)
        .then((datos) => (datos != null) ? datos["results"]["bindings"] : []);
  }

  Future<List<POI>>? _moreInfoSug(LatLng pos, List<NearSug> nearSug) {
    nearSug.sort((NearSug a, NearSug b) => a.distance.compareTo(b.distance));
    Iterable<NearSug> reducida = nearSug.getRange(0, min(nearSug.length, 5));
    if (reducida.isNotEmpty) {
      String q2 =
          "https://crafts.gsic.uva.es/apis/localizarteV2/resources?id=Place-en&ns=http://dbpedia.org/resource/&nspref=p";
      for (NearSug r in reducida) {
        q2 = Mustache(map: {
          "salida": q2,
          "punto": r.place.replaceFirst("http://dbpedia.org/resource/", "p:")
        }).convert("{{salida}}&iris={{punto}}");
      }
      return http
          .get(Uri.parse(q2), headers: {
            "Authorization": Mustache(map: {"token": Config().tokenCraft})
                .convert("Bearer {{token}}")
          })
          .then((response) =>
              (response.statusCode == 200) ? json.decode(response.body) : null)
          .then((datos) {
            if (datos != null) {
              List<POI> listaPOI = [];
              POI poi;
              for (Map<String, dynamic> dato in datos) {
                try {
                  POISug poiSug = POISug(dato["iri"].toString(), dato["label"],
                      dato["comment"], dato["categories"], dato["image"]);

                  String currentLang = Platform.localeName;
                  if (currentLang.contains("_")) {
                    currentLang = currentLang.split("_")[0];
                  }

                  for (NearSug ns in reducida) {
                    poi = POI.empty();
                    if (poiSug.place == ns.place) {
                      /*List lLabel = dato["label"];
                      String label = ns.place;
                      for (int i = 0, tama = lLabel.length; i < tama; i++) {
                        Map<String, dynamic> m = lLabel[i];
                        if (m.containsKey("en")) {
                          label = m["en"].toString();
                        }
                      }
                      List lComment = dato["comment"];
                      String comment = ns.place;
                      for (int i = 0, tama = lComment.length; i < tama; i++) {
                        Map<String, dynamic> m = lComment[i];
                        if (m.containsKey("en")) {
                          comment = m["en"].toString();
                        }
                      }*/
                      String label;
                      if (poiSug.label(currentLang).isNotEmpty) {
                        label = poiSug.label(currentLang);
                      } else {
                        if (poiSug.labels.length == 1) {
                          label = poiSug.labels[0].value;
                        } else {
                          label = "";
                        }
                      }
                      String comment;
                      if (poiSug.comment(currentLang).isNotEmpty) {
                        comment = poiSug.comment(currentLang);
                      } else {
                        if (poiSug.comments.length == 1) {
                          comment = poiSug.comments[0].value;
                        } else {
                          comment = "";
                        }
                      }
                      poi = POI(
                          ns.place,
                          ns.lat,
                          ns.lng,
                          label,
                          comment,
                          "pablogz",
                          (poiSug.images.isNotEmpty)
                              ? poiSug.images[0].image
                              : "",
                          (poiSug.images.isNotEmpty)
                              ? (poiSug.images[0].hasLicense
                                  ? poiSug.images[0].license
                                  : "")
                              : "",
                          ns.place);
                      listaPOI.add(poi);
                      break;
                    }
                  }
                } catch (e) {
                  print(e.toString());
                }
              }
              return listaPOI;
            } else {
              return [];
            }
          });
    } else {
      return null;
    }
  }

  List<String> moreNear(LatLng pos, List<NearSug> nearSug) {
    return [];
  }

  Widget puntosCercanos(LatLng pos) {
    return FutureBuilder<List>(
      future: _poiNearSug(pos),
      builder: (BuildContext context, AsyncSnapshot<List> snapshot) {
        if (snapshot.hasData && !snapshot.hasError && snapshot.data != null) {
          if (snapshot.data!.isNotEmpty) {
            final List<NearSug> nearSug = [];
            var data = snapshot.data;
            for (Map<String, dynamic> d in data!) {
              nearSug.add(NearSug(
                  d["place"]!["value"],
                  double.parse(d["lat"]!["value"]),
                  double.parse(d["lng"]!["value"]),
                  pos));
            }
            return FutureBuilder<List<POI>>(
              future: _moreInfoSug(pos, nearSug),
              builder:
                  (BuildContext context, AsyncSnapshot<List<POI>> snapshot) {
                if (snapshot.hasData &&
                    !snapshot.hasError &&
                    snapshot.data != null) {
                  List<POI>? listPOI = snapshot.data;
                  final double ratio = (MediaQuery.of(context).orientation ==
                          Orientation.portrait)
                      ? (2 *
                              max(MediaQuery.of(context).size.width,
                                  MediaQuery.of(context).size.height)) /
                          (min(MediaQuery.of(context).size.width,
                              MediaQuery.of(context).size.height))
                      : 9;
                  final double altura = 85.0 * listPOI!.length;
                  return SizedBox(
                      height: altura,
                      width: MediaQuery.of(context).size.width,
                      child: GridView.builder(
                        physics: const NeverScrollableScrollPhysics(),
                        shrinkWrap: true,
                        itemCount: listPOI.length,
                        padding: const EdgeInsets.all(10),
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          childAspectRatio: ratio,
                          crossAxisCount: 1,
                        ),
                        itemBuilder: (BuildContext context, int index) {
                          POI poi = listPOI[index];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            decoration: BoxDecoration(
                                shape: BoxShape.rectangle,
                                border: Border.all(
                                    color: ColorsCusto.pBlue, width: 2),
                                borderRadius: const BorderRadius.all(
                                    Radius.elliptical(5, 5))),
                            child: TextButton(
                                child: Text(
                                  poi.titulo,
                                  textAlign: TextAlign.center,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                style: ButtonStyle(
                                    foregroundColor: MaterialStateProperty.all(
                                        Colors.black)),
                                onPressed: () {
                                  Navigator.pop(context, poi);
                                }),
                          );
                        },
                      ));
                } else {
                  return LinearProgressIndicator(
                    color: ColorsCusto.pBlue,
                    backgroundColor: ColorsCusto.pBluet[100],
                  );
                }
              },
            );
          } else {
            return LinearProgressIndicator(
                color: ColorsCusto.pBlue,
                backgroundColor: ColorsCusto.pBluet[100]);
          }
        } else {
          return LinearProgressIndicator(
              color: ColorsCusto.pBlue,
              backgroundColor: ColorsCusto.pBluet[100]);
        }
      },
    );
  }

  funInicial(MapPosition mapPos, bool vF) {
    if (!vF && _cargaInicial) {
      _cargaInicial = false;
      checkMarkerType();
    }
  }

  void checkCurrentMap(mapBounds) {
    //return;
    _myMarkers = <Marker>[];
    if (mapBounds is LatLngBounds) {
      LatLng pI = startPointCheck(mapBounds.northWest);
      HashMap c = buildTeselas(pI, mapBounds.southEast);
      double pLng, pLat;
      LatLng puntoComprobacion;
      bool encontrado;
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
      'dirAdd': Config().direccionServidor,
      'north': nW.latitude,
      'west': nW.longitude
    })
        //.convert('https://chest.gsic.uva.es/servidor/contexts/?lat={{north}}&long={{west}}');
        .convert('{{dirAdd}}/contexts/?lat={{north}}&long={{west}}');
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
                p['descr'], p['autor'], p['imagen'], "", "");
            pois.add(poi);
          } catch (e) {
            //El poi está mal formado
            print(e.toString());
          }
        }
        faltan = (faltan > 0) ? faltan - 1 : 0;
        lpoi.add(TeselaPoi(nW.latitude, nW.longitude, pois));
        addMarkers2Map(pois, mapBounds);
      }
    }).onError((error, stackTrace) {
      print(error.toString());
      return null;
    });
  }

  void addMarkers2Map(List<POI> pois, LatLngBounds mapBounds) {
    List<POI> visiblePois = <POI>[];
    for (POI poi in pois) {
      if (mapBounds.contains(LatLng(poi.lat, poi.lng))) {
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
            poi.titulo.replaceAllMapped(RegExp(r'[^A-Z]'), (m) => "");
        final String iniciales =
            intermedio.substring(0, min(3, intermedio.length));
        late Container icono;
        if (poi.hasImagen == true &&
            poi.imagen
                .contains('commons.wikimedia.org/wiki/Special:FilePath/')) {
          String imagen = poi.imagen.replaceFirst('http://', 'https://');
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
                LatLng(poi.lat, poi.lng),
            builder: (context) => FloatingActionButton(
                  tooltip: poi.titulo,
                  heroTag: null,
                  elevation: 0,
                  backgroundColor: (ColorsCusto.cRed[900])!,
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (BuildContext context) => InfoPOI(
                            poi,
                            useLocation,
                            ((useLocation)
                                ? LatLng(currentLocation.latitude!,
                                    currentLocation.longitude!)
                                : LatLng(0, 0))),
                        fullscreenDialog: true,
                      ),
                    );
                    mapController.move(
                        LatLng(poi.lat, poi.lng), mapController.zoom);
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
  late LocationData currentLocation;

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
          currentLocation = v;
          _animatedMapMove(LatLng(v.latitude!, v.longitude!), maxZum - 1);
          useLocation = true;
        }
      });
      l = location.onLocationChanged.listen((LocationData ld) {
        _myPosition = [];
        if (ld.accuracy is double &&
            ld.latitude is double &&
            ld.longitude is double) {
          currentLocation = ld;
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
    } else {
      l.cancel();
      useLocation = false;
      _myPosition = [];
      setState(() {});
    }
  }

  ///https://github.com/fleaflet/flutter_map/blob/master/example/lib/pages/animated_map_controller.dart
  void _animatedMapMove(LatLng destLocation, double destZoom) {
    // Create some tweens. These serve to split up the transition from one location to another.
    // In our case, we want to split the transition be<tween> our current map center and the destination.
    final _latTween = Tween<double>(
        begin: mapController.center.latitude, end: destLocation.latitude);
    final _lngTween = Tween<double>(
        begin: mapController.center.longitude, end: destLocation.longitude);
    final _zoomTween = Tween<double>(begin: mapController.zoom, end: destZoom);

    // Create a animation controller that has a duration and a TickerProvider.
    var controller = AnimationController(
        duration: const Duration(milliseconds: 500), vsync: this);
    // The animation determines what path the animation will take. You can try different Curves values, although I found
    // fastOutSlowIn to be my favorite.
    Animation<double> animation =
        CurvedAnimation(parent: controller, curve: Curves.fastOutSlowIn);

    controller.addListener(() {
      mapController.move(
          LatLng(_latTween.evaluate(animation), _lngTween.evaluate(animation)),
          _zoomTween.evaluate(animation));
    });

    animation.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        controller.dispose();
        checkMarkerType();
      } else if (status == AnimationStatus.dismissed) {
        controller.dispose();
      }
    });

    controller.forward();
  }

  void checkMarkerType() {
    if (mapController.zoom >= 14) {
      checkCurrentMap(mapController.bounds);
    } else {
      if (_myMarkers.isNotEmpty) {
        _myMarkers = [];
        setState(() {});
      }
    }
  }
}
