import 'dart:convert';
import 'dart:math';

import 'package:chest/managers/task.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_svg/svg.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';
import 'package:http/http.dart' as http;
import 'package:simple_mustache/simple_mustache.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';

import '../helpers/colors_custo.dart';
import '../helpers/config.dart';
import '../helpers/poi.dart';
import '../helpers/task.dart';
import '../main.dart';
import '../helpers/widget_facto.dart';

class InfoPOI extends StatelessWidget {
  final POI poi;
  final bool locatiON;
  final LatLng userPosition;
  final bool profe;

  const InfoPOI(this.poi, this.locatiON, this.userPosition, this.profe,
      {Key? key})
      : super(key: key);
  final _textStyle = const TextStyle(
    fontSize: 18.0,
    color: Colors.black,
  );
  final _cardTextStyle = const TextStyle(
    fontSize: 15.0,
    color: Colors.black,
  );

  @override
  Widget build(BuildContext context) {
    MapOptions mapOptions;
    String distance;
    if (locatiON) {
      mapOptions = MapOptions(
        bounds: LatLngBounds(LatLng(poi.lat, poi.lng),
            LatLng(userPosition.latitude, userPosition.longitude)),
        boundsOptions: const FitBoundsOptions(padding: EdgeInsets.all(30.0)),
        interactiveFlags: InteractiveFlag.none,
        enableScrollWheel: false,
      );
      poi.setDistance(LatLng(userPosition.latitude, userPosition.longitude));
      double d = poi.distance;
      if (d > 1000) {
        distance = (d / 1000).toStringAsPrecision(3) + "km";
      } else {
        distance = d.toInt().toString() + "m";
      }
    } else {
      mapOptions = MapOptions(
        maxZoom: 16.0,
        center: LatLng(poi.lat, poi.lng),
        minZoom: 16.0,
        interactiveFlags: InteractiveFlag.none,
        enableScrollWheel: false,
      );
      distance = "";
    }
    Size size = MediaQuery.of(context).size;
    double sizeF =
        2 * (max(size.width, size.height) / min(size.width, size.height));
    int nCol =
        (MediaQuery.of(context).orientation == Orientation.portrait) ? 1 : 2;
    return Scaffold(
      floatingActionButton: (profe)
          ? (Column(
              mainAxisAlignment: MainAxisAlignment.end,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                FloatingActionButton.small(
                  child: const Icon(Icons.delete),
                  tooltip: AppLocalizations.of(context)!.borrarPOI,
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                        content:
                            Text(AppLocalizations.of(context)!.borrarPOI)));
                  },
                  heroTag: null,
                  backgroundColor: ColorsCusto.cRed,
                ),
                Container(
                  height: 10,
                ),
                FloatingActionButton.small(
                  child: const Icon(Icons.edit),
                  tooltip: AppLocalizations.of(context)!.editarPOI,
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                        content:
                            Text(AppLocalizations.of(context)!.editarPOI)));
                  },
                  heroTag: null,
                ),
                Container(
                  height: 10,
                ),
                FloatingActionButton.extended(
                  icon: const Icon(Icons.add),
                  label: Text(AppLocalizations.of(context)!.agregarTarea),
                  onPressed: () async {
                    await Navigator.push(
                      context,
                      MaterialPageRoute<void>(
                        builder: (BuildContext context) =>
                            FormTask(Task.empty()),
                        fullscreenDialog: false,
                      ),
                    );
                  },
                  heroTag: null,
                )
              ],
            ))
          : (poi.hasExtraInfo)
              ? (FloatingActionButton.extended(
                  onPressed: () async {
                    if (!await launch(poi.extraInfo)) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                        content:
                            Text(AppLocalizations.of(context)!.noLanzarURL),
                        backgroundColor: ColorsCusto.cRed,
                      ));
                    }
                  },
                  label: Text(AppLocalizations.of(context)!.moreInfo),
                  icon: const Icon(Icons.info)))
              : (const SizedBox(
                  height: 0,
                  width: 0,
                )),
      body: CustomScrollView(
        slivers: <Widget>[
          SliverAppBar(
            pinned: true,
            snap: false,
            floating: false,
            expandedHeight: 180.0,
            backgroundColor: ColorsCusto.pBlue,
            flexibleSpace: FlexibleSpaceBar(
                centerTitle: true,
                titlePadding: EdgeInsets.zero,
                title: Container(
                    width: 30000,
                    padding: const EdgeInsets.symmetric(
                        vertical: 10.0, horizontal: 5.0),
                    child: Text(
                      poi.titulo,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                    ),
                    color: Colors.black38),
                background: poi.hasImagen == true
                    ? Image.network(poi.imagen,
                        /*loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) {
                            return child;
                          } else {
                            return Container(
                                width: 180,
                                height: 180,
                                padding: const EdgeInsets.symmetric(
                                    vertical: 20.0, horizontal: 100.0),
                                child: CircularProgressIndicator(
                                  color: ColorsCusto.pBlue[100],
                                ));
                          }
                        },*/
                        errorBuilder: (ctx, obj, stack) => Container(),
                        fit: BoxFit.cover,
                        height: 180)
                    : Container()),
          ),
          SliverPadding(
              padding: EdgeInsets.zero,
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  SafeArea(
                    right: true,
                    left: true,
                    top: false,
                    bottom: false,
                    minimum: const EdgeInsets.all(15.0),
                    child: Column(children: [
                      SizedBox(
                          height: 150,
                          child: FlutterMap(
                            options: mapOptions,
                            children: [
                              TileLayerWidget(
                                  options: TileLayerOptions(
                                /*urlTemplate:
                                    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",*/
                                urlTemplate:
                                    "https://api.mapbox.com/styles/v1/pablogz/ckvpj1ed92f7u14phfhfdvkor/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoicGFibG9neiIsImEiOiJja3Z4b3VnaTUwM2VnMzFtdjJ2Mm4zajRvIn0.q0l3ZzhT4BzKafNxdQuSQg",
                                subdomains: ['a', 'b', 'c'],
                                backgroundColor: Colors.grey,
                                attributionBuilder: (c) {
                                  return Text(
                                    AppLocalizations.of(c)!.contribOSM,
                                    style: const TextStyle(
                                      fontSize: 10.0,
                                      color: Colors.black,
                                      backgroundColor: Colors.black26,
                                    ),
                                  );
                                },
                              )),
                              PolylineLayerWidget(
                                options: PolylineLayerOptions(polylines: [
                                  locatiON
                                      ? Polyline(
                                          isDotted: true,
                                          points: [
                                            LatLng(poi.lat, poi.lng),
                                            LatLng(userPosition.latitude,
                                                userPosition.longitude)
                                          ],
                                          gradientColors: [
                                            ColorsCusto.cRed,
                                            ColorsCusto.pBlue,
                                          ],
                                          strokeWidth: 5.0)
                                      : Polyline(points: [])
                                ]),
                              ),
                              MarkerLayerWidget(
                                options: MarkerLayerOptions(markers: [
                                  Marker(
                                      width: 24,
                                      height: 24,
                                      point: LatLng(poi.lat, poi.lng),
                                      builder: (context) => Container(
                                              decoration: BoxDecoration(
                                            borderRadius:
                                                BorderRadius.circular(25),
                                            color: ColorsCusto.cRed,
                                          ))),
                                  locatiON
                                      ? Marker(
                                          point: LatLng(userPosition.latitude,
                                              userPosition.longitude),
                                          builder: (context) => Center(
                                                child: Container(
                                                    width: 24,
                                                    height: 24,
                                                    decoration: BoxDecoration(
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                              12),
                                                      color: ColorsCusto
                                                          .pBlue[500],
                                                      border: Border.all(
                                                          color: Colors.white,
                                                          width: 3),
                                                    )),
                                              ))
                                      : Marker(
                                          width: 1,
                                          height: 1,
                                          builder: (context) => Container(
                                              color: Colors.transparent),
                                          point: (LatLng(0, 0))),
                                  locatiON
                                      ? Marker(
                                          width: 60,
                                          height: 20,
                                          point: LatLng(
                                              ((max(
                                                              poi.lat,
                                                              userPosition
                                                                  .latitude) -
                                                          min(
                                                              poi.lat,
                                                              userPosition
                                                                  .latitude)) /
                                                      2) +
                                                  min(poi.lat,
                                                      userPosition.latitude),
                                              ((max(
                                                              poi.lng,
                                                              userPosition
                                                                  .longitude) -
                                                          min(
                                                              poi.lng,
                                                              userPosition
                                                                  .longitude)) /
                                                      2) +
                                                  min(poi.lng,
                                                      userPosition.longitude)),
                                          builder: (context) => Container(
                                                decoration: BoxDecoration(
                                                    color: Colors.white,
                                                    border: Border.all(
                                                        color:
                                                            ColorsCusto.pBlue,
                                                        width: 2),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            2)),
                                                child: Center(
                                                    child: Text(
                                                  distance,
                                                  style: const TextStyle(
                                                      color: ColorsCusto.pBlue,
                                                      fontSize: 12),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.clip,
                                                )),
                                              ))
                                      : Marker(
                                          width: 1,
                                          height: 1,
                                          builder: (context) => Container(
                                              color: Colors.transparent),
                                          point: (LatLng(0, 0))),
                                ]),
                              ),
                            ],
                          )),
                      Row(
                        children: [
                          Flexible(
                              child: Padding(
                                  padding: const EdgeInsets.only(top: 15),
                                  child: HtmlWidget(poi.descr,
                                      factoryBuilder: () => MyWidgetFactory()

                                      /*Text(
                                    poi.descr,
                                    style: _textStyle,
                                  )*/
                                      )))
                        ],
                      ),
                    ]),
                  ),
                  SafeArea(
                      right: true,
                      left: true,
                      top: false,
                      bottom: false,
                      minimum: const EdgeInsets.symmetric(horizontal: 15.0),
                      child: FutureBuilder<List>(
                        future: _tasks(poi.id),
                        builder: (BuildContext context,
                            AsyncSnapshot<List> snapshot) {
                          if (snapshot != null &&
                              snapshot.hasData &&
                              !snapshot.hasError) {
                            final List? allDataP = snapshot.data;

                            List<Task> allData = [];
                            for (int i = 0, tama = allDataP!.length;
                                i < tama;
                                i++) {
                              try {
                                Map inter = allDataP[i];
                                Task task = Task(
                                    context,
                                    inter['task'],
                                    inter['aT'],
                                    inter['thumb'],
                                    inter['aTR'],
                                    inter['spa'],
                                    inter['title']);
                                if (profe) {
                                  allData.add(task);
                                } else {
                                  if (!locatiON) {
                                    if (!task.isOnlyGeolocated()) {
                                      allData.add(task);
                                    }
                                  } else {
                                    allData.add(task);
                                  }
                                }
                              } catch (e) {
                                print(e);
                              }
                            }
                            return GridView.builder(
                                physics: const NeverScrollableScrollPhysics(),
                                shrinkWrap: true,
                                itemCount: allData.length,
                                padding: const EdgeInsets.only(bottom: 15.0),
                                gridDelegate:
                                    SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: nCol,
                                  childAspectRatio: sizeF,
                                ),
                                itemBuilder: (BuildContext context, int index) {
                                  Task task = allData[index];
                                  return Card(
                                    elevation: 2.0,
                                    child: InkWell(
                                      splashColor: ColorsCusto.pBlue[100],
                                      onTap: () async {
                                        await Navigator.push(
                                            context,
                                            MaterialPageRoute<void>(
                                                builder:
                                                    (BuildContext context) =>
                                                        InfoTask(task, poi),
                                                fullscreenDialog: false));
                                      },
                                      child: Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.start,
                                        crossAxisAlignment:
                                            CrossAxisAlignment.center,
                                        children: [
                                          Expanded(
                                              flex: 0,
                                              child: Column(
                                                mainAxisAlignment:
                                                    MainAxisAlignment.center,
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.center,
                                                children: [
                                                  Container(
                                                    padding:
                                                        const EdgeInsets.all(
                                                            15.0),
                                                    child: SvgPicture.asset(
                                                      task.icon,
                                                      height: 36,
                                                    ),
                                                  )
                                                ],
                                              )),
                                          Expanded(
                                              flex: 1,
                                              child: Column(
                                                mainAxisAlignment:
                                                    MainAxisAlignment.center,
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Container(
                                                    padding:
                                                        const EdgeInsets.all(
                                                            15.0),
                                                    child: Text(
                                                      task.title,
                                                      softWrap: true,
                                                      maxLines: 2,
                                                      overflow:
                                                          TextOverflow.ellipsis,
                                                      style: _cardTextStyle,
                                                    ),
                                                  )
                                                ],
                                              ))
                                        ],
                                      ),
                                    ),
                                  );
                                });
                          } else {
                            return Container();
                          }
                        },
                      ))
                ]),
              ))
        ],
      ),
    );
  }

  Future<List> _tasks(idPoi) {
    final String query = Mustache(map: {
      'dirAdd': Config().direccionServidor,
      'poi': idPoi,
    }).convert('{{dirAdd}}/tasks?context={{poi}}');
    return http.get(Uri.parse(query)).then((response) =>
        (response.statusCode == 200) ? json.decode(response.body) : null);
  }
}

class FormPOI extends StatelessWidget {
  final POI poi;

  const FormPOI(this.poi, {Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final _thisKey = GlobalKey<FormState>();
    return Scaffold(
        floatingActionButton: FloatingActionButton.extended(
          icon: const Icon(Icons.publish),
          label: Text(AppLocalizations.of(context)!.enviarNPI),
          onPressed: () {
            if (_thisKey.currentState!.validate()) {
              //TODO enviar la info al servidor

              //TODO cuando está bien
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                  content: Text(AppLocalizations.of(context)!.infoRegistrada)));
            }
          },
        ),
        appBar: AppBar(
          title: Text(AppLocalizations.of(context)!.tNPoi),
        ),
        body: SafeArea(
            right: true,
            left: true,
            top: false,
            bottom: false,
            minimum: const EdgeInsets.all(15.0),
            child: Form(
                key: _thisKey,
                child: SingleChildScrollView(
                    child: Column(
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    TextFormField(
                      maxLines: 1,
                      decoration: InputDecoration(
                          labelText: AppLocalizations.of(context)!.tituloNPI,
                          labelStyle: Theme.of(context).textTheme.bodySmall,
                          focusedBorder: const UnderlineInputBorder(
                              borderSide:
                                  BorderSide(color: ColorsCusto.pBlue))),
                      cursorColor: ColorsCusto.pBlue,
                      textCapitalization: TextCapitalization.sentences,
                      initialValue: poi.isValid ? poi.titulo : "",
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) {
                          return AppLocalizations.of(context)!.tituloNPIExplica;
                        }
                        poi.titulo = v;
                        return null;
                      },
                    ),
                    TextFormField(
                      decoration: InputDecoration(
                          labelText: AppLocalizations.of(context)!.descrNPI,
                          labelStyle: Theme.of(context).textTheme.bodySmall,
                          focusedBorder: const UnderlineInputBorder(
                              borderSide:
                                  BorderSide(color: ColorsCusto.pBlue))),
                      cursorColor: ColorsCusto.pBlue,
                      textCapitalization: TextCapitalization.sentences,
                      minLines: 1,
                      maxLines: 5,
                      initialValue: poi.isValid ? poi.descr : "",
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) {
                          return AppLocalizations.of(context)!.descrNPIExplica;
                        }
                        poi.descr = v;
                        return null;
                      },
                    ),
                    TextFormField(
                      maxLines: 1,
                      readOnly: true,
                      decoration: InputDecoration(
                          labelText: AppLocalizations.of(context)!.latitudNPI,
                          labelStyle: Theme.of(context).textTheme.bodySmall,
                          focusedBorder: const UnderlineInputBorder(
                              borderSide:
                                  BorderSide(color: ColorsCusto.pBlue))),
                      cursorColor: ColorsCusto.pBlue,
                      initialValue: poi.isEmpty ? "" : poi.lat.toString(),
                      validator: (v) {
                        if (v == null ||
                            v.trim().isEmpty ||
                            double.tryParse(v.trim()) == null) {
                          return AppLocalizations.of(context)!
                              .latitudNPIExplica;
                        }
                        poi.lat = double.parse(v.trim());
                        return null;
                      },
                    ),
                    TextFormField(
                      maxLines: 1,
                      readOnly: true,
                      decoration: InputDecoration(
                          labelText: AppLocalizations.of(context)!.longitudNPI,
                          labelStyle: Theme.of(context).textTheme.bodySmall,
                          focusedBorder: const UnderlineInputBorder(
                              borderSide:
                                  BorderSide(color: ColorsCusto.pBlue))),
                      cursorColor: ColorsCusto.pBlue,
                      initialValue: poi.isEmpty ? "" : poi.lng.toString(),
                      validator: (v) {
                        if (v == null ||
                            v.trim().isEmpty ||
                            double.tryParse(v.trim()) == null) {
                          return AppLocalizations.of(context)!
                              .longitudNPIExplica;
                        }
                        poi.lng = double.parse(v.trim());
                        return null;
                      },
                    ),
                    TextFormField(
                      maxLines: 1,
                      decoration: InputDecoration(
                          labelText: AppLocalizations.of(context)!.fuentesNPI,
                          labelStyle: Theme.of(context).textTheme.bodySmall,
                          focusedBorder: const UnderlineInputBorder(
                              borderSide:
                                  BorderSide(color: ColorsCusto.pBlue))),
                      cursorColor: ColorsCusto.pBlue,
                      initialValue: poi.isValid ? poi.fuentes : "",
                      validator: (v) {
                        if (v == null || Uri.parse(v.trim()).isAbsolute) {
                          return AppLocalizations.of(context)!
                              .fuentesNPIExplica;
                        }
                        poi.fuentes = v.trim();
                        return null;
                      },
                    ),
                    TextFormField(
                      maxLines: 1,
                      decoration: InputDecoration(
                          labelText:
                              AppLocalizations.of(context)!.imagenNPILabel,
                          labelStyle: Theme.of(context).textTheme.bodySmall,
                          focusedBorder: const UnderlineInputBorder(
                              borderSide:
                                  BorderSide(color: ColorsCusto.pBlue))),
                      cursorColor: ColorsCusto.pBlue,
                      initialValue: poi.isValid ? poi.imagen : "",
                      validator: (v) {
                        if (v == null || Uri.tryParse(v.trim()) != null) {
                          return AppLocalizations.of(context)!.imagenNPIExplica;
                        }
                        if (v.isNotEmpty) {
                          poi.imagen = v.trim();
                        }
                        return null;
                      },
                    ),
                    TextFormField(
                      maxLines: 1,
                      decoration: InputDecoration(
                          labelText: AppLocalizations.of(context)!.licenciaNPI,
                          labelStyle: Theme.of(context).textTheme.bodySmall,
                          focusedBorder: const UnderlineInputBorder(
                              borderSide:
                                  BorderSide(color: ColorsCusto.pBlue))),
                      cursorColor: ColorsCusto.pBlue,
                      initialValue: poi.isValid ? poi.licencia : "",
                      validator: (v) {
                        if (v == null) {
                          return AppLocalizations.of(context)!
                              .licenciaNPIExplica;
                        }
                        if (v.isNotEmpty) {
                          poi.licencia = v;
                        }
                        return null;
                      },
                    ),
                  ],
                )))));
  }
}

class NewPoi extends StatefulWidget {
  final LatLng pos;
  final List<POI> nearPois;
  final double incr;
  const NewPoi(this.pos, this.nearPois, this.incr, {Key? key})
      : super(key: key);

  @override
  State<StatefulWidget> createState() => _NewPoi();
}

class _NewPoi extends State<NewPoi> {
  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
        initialIndex: 0,
        length: 3,
        child: Scaffold(
            appBar: AppBar(
              title: Text(
                Mustache(map: {
                  "point": AppLocalizations.of(context)!.point,
                  "lat": widget.pos.latitude.toStringAsFixed(5),
                  "lng": widget.pos.longitude.toStringAsFixed(5)
                }).convert("{{point}} ({{lat}}, {{lng}})"),
                style:
                    const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              bottom: TabBar(indicatorColor: Colors.white, tabs: [
                Tab(
                  icon: Tooltip(
                      message: AppLocalizations.of(context)!
                          .puntosYaExistentesExShort,
                      child: const Icon(Icons.content_paste_search)),
                ),
                Tab(
                  icon: Tooltip(
                      message: AppLocalizations.of(context)!.lodPoiExShort,
                      child: const Icon(Icons.cloud_download)),
                ),
                Tab(
                    icon: Tooltip(
                        message: AppLocalizations.of(context)!.nPoiExShort,
                        child: const Icon(Icons.draw))),
              ]),
            ),
            body: TabBarView(children: [
              SafeArea(
                minimum: const EdgeInsets.all(15.0),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: [
                      Text(
                        AppLocalizations.of(context)!.puntosYaExistentesEx,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(
                        height: 15,
                      ),
                      puntosExistentes()
                    ],
                  ),
                ),
              ),
              SafeArea(
                minimum: const EdgeInsets.all(15.0),
                child: SingleChildScrollView(
                    child: Column(
                  children: [
                    Text(
                      AppLocalizations.of(context)!.lodPoiEx,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(
                      height: 15,
                    ),
                    puntosCercanos(widget.pos)
                  ],
                )),
              ),
              SafeArea(
                minimum: const EdgeInsets.all(15.0),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: [
                      Text(
                        AppLocalizations.of(context)!.nPoiEx,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(
                        height: 15,
                      ),
                      Container(
                          margin: const EdgeInsets.symmetric(horizontal: 5),
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              minimumSize: const Size.fromHeight(55),
                            ),
                            onPressed: () async {
                              Navigator.pop(context);
                              await Navigator.push(
                                  context,
                                  MaterialPageRoute<void>(
                                      builder: (BuildContext context) =>
                                          FormPOI(POI.onlyPosition(
                                              widget.pos.latitude,
                                              widget.pos.longitude)),
                                      fullscreenDialog: false));
                            },
                            child: Text(
                              AppLocalizations.of(context)!.addPOI,
                            ),
                          ))
                    ],
                  ),
                ),
              ),
            ])));
  }

  Future<List> _poiNearSug(LatLng pos) {
    final String q1 = Mustache(map: {
      "lat": pos.latitude,
      "lng": pos.longitude,
      "incr": widget.incr,
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
    List<NearSug> rep = [];
    for (NearSug ns in nearSug) {
      for (POI poi in widget.nearPois) {
        if (poi.lat == ns.lat && poi.lng == ns.lng) {
          rep.add(ns);
        } else {
          if (ns.distance > 500) {
            rep.add(ns);
          }
        }
      }
    }
    for (NearSug ns in rep) {
      nearSug.remove(ns);
    }
    nearSug.sort((NearSug a, NearSug b) => a.distance.compareTo(b.distance));
    Iterable<NearSug> reducida = nearSug.getRange(0, min(nearSug.length, 10));
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

                  for (NearSug ns in reducida) {
                    poi = POI.empty();
                    if (poiSug.place == ns.place) {
                      String label;
                      if (poiSug.label(MyApp.currentLang).isNotEmpty) {
                        label = poiSug.label(MyApp.currentLang);
                      } else {
                        if (poiSug.labels.length == 1) {
                          label = poiSug.labels[0].value;
                        } else {
                          break;
                        }
                      }
                      String comment;
                      if (poiSug.comment(MyApp.currentLang).isNotEmpty) {
                        comment = poiSug.comment(MyApp.currentLang);
                      } else {
                        if (poiSug.comments.length == 1) {
                          comment = poiSug.comments[0].value;
                        } else {
                          break;
                        }
                      }
                      //TODO userID
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
                      poi.setDistance(widget.pos);
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
    int nCol =
        (MediaQuery.of(context).orientation == Orientation.portrait) ? 1 : 2;
    return FutureBuilder<List>(
      future: _poiNearSug(pos),
      builder: (BuildContext context, AsyncSnapshot<List> snapshot) {
        if (snapshot.hasData &&
            !snapshot.hasError &&
            snapshot.connectionState == ConnectionState.done) {
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
                  /*final double ratio = (MediaQuery.of(context).orientation ==
                          Orientation.portrait)
                      ? (2 *
                              max(MediaQuery.of(context).size.width,
                                  MediaQuery.of(context).size.height)) /
                          (min(MediaQuery.of(context).size.width,
                              MediaQuery.of(context).size.height))
                      : 6;*/
                  final Size size = MediaQuery.of(context).size;
                  final double ratio = 2 *
                      (max(size.width, size.height) /
                          min(size.width, size.height));
                  return GridView.builder(
                    physics: const NeverScrollableScrollPhysics(),
                    shrinkWrap: true,
                    itemCount: listPOI!.length,
                    padding: const EdgeInsets.all(5),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      childAspectRatio: ratio,
                      crossAxisCount: nCol,
                    ),
                    itemBuilder: (BuildContext context, int index) {
                      POI poi = listPOI[index];
                      return Container(
                        margin: const EdgeInsets.only(
                            bottom: 10, right: 5, left: 5),
                        decoration: BoxDecoration(
                            shape: BoxShape.rectangle,
                            border:
                                Border.all(color: ColorsCusto.pBlue, width: 2),
                            borderRadius: const BorderRadius.all(
                                Radius.elliptical(5, 5))),
                        child: ElevatedButton(
                            style: ButtonStyle(
                              padding:
                                  MaterialStateProperty.all(EdgeInsets.zero),
                            ),
                            child: Column(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceEvenly,
                                children: [
                                  Text(
                                    poi.titulo,
                                    textAlign: TextAlign.center,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  Text(
                                    Mustache(map: {"d": poi.distance.toInt()})
                                        .convert("{{d}}m"),
                                    textAlign: TextAlign.end,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ]),

                            /*Stack(
                              children: [
                                (poi.hasImagen == true)
                                    ? SizedBox.expand(
                                        child: Image.network(
                                        poi.imagen,
                                        fit: BoxFit.cover,
                                        errorBuilder: (BuildContext ctx,
                                            Object obj, StackTrace? stack) {
                                          poi.imagen = "";
                                          return Container();
                                        },
                                        loadingBuilder: (BuildContext context,
                                            Widget child,
                                            ImageChunkEvent? ice) {
                                          if (ice == null) {
                                            return child;
                                          } else {
                                            return Container();
                                          }
                                        },
                                      ))
                                    : Container(
                                        color: ColorsCusto.pBlue,
                                      ),
                                (poi.hasImagen)
                                    ? Align(
                                        alignment: Alignment.bottomCenter,
                                        child: Text(
                                          poi.titulo,
                                          style: TextStyle(
                                              backgroundColor:
                                                  ColorsCusto.pBluet[900]),
                                          textAlign: TextAlign.center,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ))
                                    : Center(
                                        child: Text(
                                        poi.titulo,
                                        style: TextStyle(
                                            backgroundColor:
                                                ColorsCusto.pBluet[900]),
                                        textAlign: TextAlign.center,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ))
                              ],
                            ),*/
                            onPressed: () async {
                              Navigator.pop(context);
                              await Navigator.push(
                                  context,
                                  MaterialPageRoute<void>(
                                      builder: (BuildContext context) =>
                                          FormPOI(poi),
                                      fullscreenDialog: false));
                            }),
                      );
                    },
                  );
                  /*return SizedBox(
                      width: MediaQuery.of(context).size.width,
                      child: GridView.builder(
                        physics: const NeverScrollableScrollPhysics(),
                        shrinkWrap: true,
                        itemCount: listPOI!.length,
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
                            child: ElevatedButton(
                                child: Text(
                                  poi.titulo,
                                  textAlign: TextAlign.center,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                onPressed: () async {
                                  Navigator.pop(context);
                                  await Navigator.push(
                                      context,
                                      MaterialPageRoute<void>(
                                          builder: (BuildContext context) =>
                                              FormPOI(poi),
                                          fullscreenDialog: false));
                                }),
                          );
                        },
                      ));*/
                } else {
                  if (!snapshot.hasError &&
                      snapshot.data == null &&
                      snapshot.connectionState == ConnectionState.none) {
                    return Text(AppLocalizations.of(context)!.withoutLOD);
                  } else {
                    return LinearProgressIndicator(
                      color: ColorsCusto.pBlue,
                      backgroundColor: ColorsCusto.pBluet[100],
                    );
                  }
                }
              },
            );
          } else {
            return Text(AppLocalizations.of(context)!.withoutLOD);
          }
        } else {
          return LinearProgressIndicator(
              color: ColorsCusto.pBlue,
              backgroundColor: ColorsCusto.pBluet[100]);
        }
      },
    );
  }

  puntosExistentes() {
    int nCol =
        (MediaQuery.of(context).orientation == Orientation.portrait) ? 1 : 2;
    List<POI> np = [];
    for (POI poi in widget.nearPois) {
      poi.setDistance(widget.pos);
      if (poi.distance <= 500) {
        np.add(poi);
      }
    }
    if (np.isNotEmpty) {
      np.sort((POI a, POI b) => a.distance.compareTo(b.distance));
      List<POI> reducida = np.getRange(0, np.length).toList();
      /*final double ratio =
          (MediaQuery.of(context).orientation == Orientation.portrait)
              ? (2 *
                      max(MediaQuery.of(context).size.width,
                          MediaQuery.of(context).size.height)) /
                  (min(MediaQuery.of(context).size.width,
                      MediaQuery.of(context).size.height))
              : 6;*/
      final Size size = MediaQuery.of(context).size;
      final double ratio =
          2 * (max(size.width, size.height) / min(size.width, size.height));
      return GridView.builder(
          physics: const NeverScrollableScrollPhysics(),
          shrinkWrap: true,
          itemCount: reducida.length,
          padding: const EdgeInsets.only(top: 10),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            childAspectRatio: ratio,
            crossAxisCount: nCol,
          ),
          itemBuilder: (BuildContext context, int index) {
            POI poi = reducida[index];
            return Container(
              margin: const EdgeInsets.only(bottom: 10, right: 5, left: 5),
              decoration: BoxDecoration(
                  shape: BoxShape.rectangle,
                  border: Border.all(color: ColorsCusto.pBlue, width: 2),
                  borderRadius:
                      const BorderRadius.all(Radius.elliptical(5, 5))),
              child: ElevatedButton(
                  style: ButtonStyle(
                    padding: MaterialStateProperty.all(EdgeInsets.zero),
                  ),
                  child: Stack(
                    children: [
                      (poi.hasImagen == true)
                          ? SizedBox.expand(
                              child: Image.network(
                              poi.imagen,
                              fit: BoxFit.cover,
                              errorBuilder: (BuildContext ctx, Object obj,
                                  StackTrace? stack) {
                                poi.imagen = "";
                                return Container();
                              },
                              loadingBuilder: (BuildContext context,
                                  Widget child, ImageChunkEvent? ice) {
                                if (ice == null) {
                                  return child;
                                } else {
                                  return Container();
                                }
                              },
                            ))
                          : Container(
                              color: ColorsCusto.pBlue,
                            ),
                      Container(color: Colors.black45),
                      Center(
                          child: Column(
                              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                            Text(
                              poi.titulo,
                              textAlign: TextAlign.center,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              Mustache(map: {"d": poi.distance.toInt()})
                                  .convert("{{d}}m"),
                              textAlign: TextAlign.end,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ]))
                    ],
                  ),
                  onPressed: () async {
                    Navigator.pop(context);
                    await Navigator.push(
                        context,
                        MaterialPageRoute<void>(
                            builder: (BuildContext context) =>
                                InfoPOI(poi, false, LatLng(0, 0), true),
                            fullscreenDialog: false));
                  }),
            );
          });
    } else {
      return Text(AppLocalizations.of(context)!.withoutLOD);
    }
  }
}
