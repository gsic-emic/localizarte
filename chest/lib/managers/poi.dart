import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:http/http.dart' as http;
import 'package:simple_mustache/simple_mustache.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:latlong2/latlong.dart';

import '../helpers/colors_custo.dart';
import '../helpers/config.dart';
import '../helpers/poi.dart';
import '../helpers/task.dart';

class InfoPOI extends StatelessWidget {
  final POI poi;
  final bool locatiON;
  final LatLng userPosition;

  const InfoPOI(this.poi, this.locatiON, this.userPosition, {Key? key})
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
    Size size = MediaQuery.of(context).size;
    double sizeF =
        2 * (max(size.width, size.height) / min(size.width, size.height));
    int nCol =
        (MediaQuery.of(context).orientation == Orientation.portrait) ? 1 : 2;
    bool teacher = true;
    return Scaffold(
      floatingActionButton: (teacher)
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
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                        content:
                            Text(AppLocalizations.of(context)!.agregarTarea)));
                  },
                  heroTag: null,
                )
              ],
            ))
          : Container(),
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
                    color: Colors.black26),
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
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 15.0, vertical: 10.0),
                    child: Column(children: [
                      Row(
                        children: [
                          Flexible(
                              child: Text(
                            poi.descr,
                            style: _textStyle,
                          ))
                        ],
                      ),
                    ]),
                  ),
                  FutureBuilder<List>(
                    future: _tasks(poi.id),
                    builder:
                        (BuildContext context, AsyncSnapshot<List> snapshot) {
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
                            if (locatiON == false) {
                              if (!task.isOnlyGeolocated()) {
                                allData.add(task);
                              }
                            } else {
                              allData.add(task);
                            }
                          } catch (e) {
                            print(e);
                          }
                        }
                        return GridView.builder(
                            physics: const NeverScrollableScrollPhysics(),
                            shrinkWrap: true,
                            itemCount: allData.length,
                            padding: const EdgeInsets.all(15.0),
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
                                  onTap: () {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                            backgroundColor: ColorsCusto.pBlue,
                                            content: Text(
                                                AppLocalizations.of(context)!
                                                    .porHacer)));
                                  },
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.start,
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
                                                    const EdgeInsets.all(15.0),
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
                                                    const EdgeInsets.all(15.0),
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
                  )
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
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                  content:
                      Text("La información ha sido enviada al servidor.")));
            }
          },
        ),
        appBar: AppBar(
          title: Text(AppLocalizations.of(context)!.tNPoi),
        ),
        body: Padding(
            padding: const EdgeInsets.all(15.0),
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
                        if (v == null || v.isEmpty) {
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
                        if (v == null || v.isEmpty) {
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
                            v.isEmpty ||
                            double.tryParse(v) == null) {
                          return AppLocalizations.of(context)!
                              .latitudNPIExplica;
                        }
                        poi.lat = double.parse(v);
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
                            v.isEmpty ||
                            double.tryParse(v) == null) {
                          return AppLocalizations.of(context)!
                              .longitudNPIExplica;
                        }
                        poi.lng = double.parse(v);
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
                        if (v == null || Uri.parse(v).isAbsolute) {
                          return AppLocalizations.of(context)!
                              .fuentesNPIExplica;
                        }
                        poi.fuentes = v;
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
                        if (v == null || Uri.tryParse(v) != null) {
                          return AppLocalizations.of(context)!.imagenNPIExplica;
                        }
                        if (v.isNotEmpty) {
                          poi.imagen = v;
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
