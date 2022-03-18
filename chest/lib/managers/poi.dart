import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:http/http.dart' as http;
import 'package:simple_mustache/simple_mustache.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

import '../helpers/colors_custo.dart';
import '../helpers/poi.dart';
import '../helpers/task.dart';

class ManagePOI {
  static List<POI> pois = [];
}

class InfoPOI extends StatelessWidget {
  const InfoPOI(this.poi, {Key? key}) : super(key: key);
  final _titleStyle = const TextStyle(fontSize: 22.0, color: Colors.black);
  final _textStyle = const TextStyle(
    fontSize: 18.0,
    color: Colors.black,
  );
  final _cardTextStyle = const TextStyle(
    fontSize: 15.0,
    color: Colors.black,
  );

  final POI poi;

  @override
  Widget build(BuildContext context) {
    Size size = MediaQuery.of(context).size;
    double sizeF =
        2 * (max(size.width, size.height) / min(size.width, size.height));
    int nCol =
        (MediaQuery.of(context).orientation == Orientation.portrait) ? 1 : 2;
    return Scaffold(
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
                      poi.getTitulo(),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                    ),
                    color: Colors.black26),
                background: poi.isImagen() == true
                    ? Image.network(poi.getImagen(),
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
                            poi.getDescr(),
                            style: _textStyle,
                          ))
                        ],
                      ),
                    ]),
                  ),
                  FutureBuilder<List>(
                    future: _tasks(poi.getId()),
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
                            allData.add(task);
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
      'poi': idPoi,
    }).convert('https://chest.gsic.uva.es/servidor/tasks?context={{poi}}');
    return http.get(Uri.parse(query)).then((response) =>
        (response.statusCode == 200) ? json.decode(response.body) : null);
  }
}
