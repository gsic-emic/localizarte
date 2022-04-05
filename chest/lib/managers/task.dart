import 'package:chest/helpers/widget_facto.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:simple_mustache/simple_mustache.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';
import 'package:camera/camera.dart';

import '../helpers/colors_custo.dart';
import '../helpers/poi.dart';
import '../helpers/task.dart';
import '../helpers/widget_facto.dart';

class FormTask extends StatefulWidget {
  final Task task;
  const FormTask(this.task, {Key? key}) : super(key: key);

  @override
  State<StatefulWidget> createState() => _FormTask();
}

class _FormTask extends State<FormTask> {
  late bool _spaFis, _spaVir, _error, _fabExt, _rgtf;
  late GlobalKey<FormState> _thisKey;
  late int _extraFields;
  late String drop;
  late ScrollController _controller;

  @override
  void initState() {
    super.initState();
    _thisKey = GlobalKey<FormState>();
    _spaFis = false;
    _spaVir = false;
    _error = false;
    _fabExt = true;
    _rgtf = widget.task.vfC;
    _controller = ScrollController();
    drop = "";
    _extraFields = 0;

    _controller.addListener(() {
      if (_controller.offset > _controller.position.minScrollExtent) {
        setState(() => _fabExt = false);
      } else {
        setState(() => _fabExt = true);
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    List<String> selects = [
      "",
      AppLocalizations.of(context)!.selectTipoRespuestaVF,
      AppLocalizations.of(context)!.selectTipoRespuestaMcq,
      AppLocalizations.of(context)!.selectTipoRespuestaTexto,
      AppLocalizations.of(context)!.selectTipoRespuestaShortText,
      AppLocalizations.of(context)!.selectTipoRespuestaPhoto,
      AppLocalizations.of(context)!.selectTipoRespuestaPhotoText,
      AppLocalizations.of(context)!.selectTipoRespuestaMultiPhotos,
      AppLocalizations.of(context)!.selectTipoRespuestaMultiPhotosText,
      AppLocalizations.of(context)!.selectTipoRespuestaVideo,
      AppLocalizations.of(context)!.selectTipoRespuestaVideoText,
      AppLocalizations.of(context)!.selectTipoRespuestaSR,
    ];

    Map<String, String> selects2uri = {
      AppLocalizations.of(context)!.selectTipoRespuestaVF: 'trueFalse',
      AppLocalizations.of(context)!.selectTipoRespuestaMcq: 'mcq',
      AppLocalizations.of(context)!.selectTipoRespuestaTexto: 'text',
      AppLocalizations.of(context)!.selectTipoRespuestaShortText: 'shortText',
      AppLocalizations.of(context)!.selectTipoRespuestaPhoto: 'photo',
      AppLocalizations.of(context)!.selectTipoRespuestaPhotoText:
          'photoAndText',
      AppLocalizations.of(context)!.selectTipoRespuestaMultiPhotos:
          'multiplePhotos',
      AppLocalizations.of(context)!.selectTipoRespuestaMultiPhotosText:
          'multiplePhotosAndText',
      AppLocalizations.of(context)!.selectTipoRespuestaVideo: 'video',
      AppLocalizations.of(context)!.selectTipoRespuestaVideoText:
          'videoAndText',
      AppLocalizations.of(context)!.selectTipoRespuestaSR: 'noAnswer'
    };
    return Scaffold(
        floatingActionButton: FloatingActionButton.extended(
          icon: _fabExt ? const Icon(Icons.publish) : null,
          label: _fabExt
              ? Text(AppLocalizations.of(context)!.enviarTask)
              : const Icon(Icons.publish),
          tooltip: AppLocalizations.of(context)!.enviarTask,
          onPressed: () {
            bool spa = _spaFis || _spaVir;
            setState(() => _error = !spa);
            if (_thisKey.currentState!.validate() && spa) {
              if (widget.task.aTR ==
                  'https://casuallearn.gsic.uva.es/answerType/trueFalse') {
                widget.task.vfC = _rgtf;
              }
              //TODO send task to server
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                  content: Text(AppLocalizations.of(context)!.infoRegistrada)));
            }
          },
        ),
        appBar: AppBar(
          title: Text(AppLocalizations.of(context)!.nTask),
        ),
        body: SafeArea(
          child: Padding(
              padding: const EdgeInsets.all(15.0),
              child: Form(
                  key: _thisKey,
                  child: SingleChildScrollView(
                    controller: _controller,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        DropdownButtonFormField(
                          decoration: InputDecoration(
                              labelText: AppLocalizations.of(context)!
                                  .selectTipoRespuestaLabel,
                              labelStyle: Theme.of(context).textTheme.bodySmall,
                              focusedBorder: const UnderlineInputBorder(
                                  borderSide:
                                      BorderSide(color: ColorsCusto.pBlue))),
                          value: drop,
                          onChanged: (String? nv) {
                            setState(() {
                              drop = nv!;
                              if (drop ==
                                  AppLocalizations.of(context)!
                                      .selectTipoRespuestaVF) {
                                _extraFields = 1;
                              } else {
                                if (drop ==
                                    AppLocalizations.of(context)!
                                        .selectTipoRespuestaMcq) {
                                  _extraFields = 2;
                                } else {
                                  _extraFields = 0;
                                }
                              }
                            });
                          },
                          items: selects
                              .map<DropdownMenuItem<String>>((String value) {
                            return DropdownMenuItem(
                              value: value,
                              child: Text(value),
                            );
                          }).toList(),
                          validator: (v) {
                            if (v == null ||
                                v.toString().isEmpty ||
                                !selects2uri.containsKey(v)) {
                              return AppLocalizations.of(context)!
                                  .selectTipoRespuestaEnunciado;
                            }
                            widget.task.aTR = Mustache(map: {
                              "t": selects2uri[v]
                            }).convert(
                                "https://casuallearn.gsic.uva.es/answerType/{{t}}");
                            return null;
                          },
                        ),
                        TextFormField(
                            maxLines: 1,
                            decoration: InputDecoration(
                                labelText:
                                    AppLocalizations.of(context)!.tituloNTLabel,
                                labelStyle:
                                    Theme.of(context).textTheme.bodySmall,
                                focusedBorder: const UnderlineInputBorder(
                                    borderSide:
                                        BorderSide(color: ColorsCusto.pBlue))),
                            cursorColor: ColorsCusto.pBlue,
                            textCapitalization: TextCapitalization.sentences,
                            initialValue:
                                widget.task.isEmpty ? "" : widget.task.title,
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) {
                                return AppLocalizations.of(context)!.tituloNT;
                              }
                              widget.task.title = v;
                              return null;
                            }),
                        TextFormField(
                          decoration: InputDecoration(
                              labelText: AppLocalizations.of(context)!
                                  .textAsociadoNTLabel,
                              labelStyle: Theme.of(context).textTheme.bodySmall,
                              focusedBorder: const UnderlineInputBorder(
                                  borderSide:
                                      BorderSide(color: ColorsCusto.pBlue))),
                          cursorColor: ColorsCusto.pBlue,
                          textCapitalization: TextCapitalization.sentences,
                          minLines: 1,
                          maxLines: 5,
                          initialValue:
                              widget.task.isEmpty ? "" : widget.task.aT,
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) {
                              return AppLocalizations.of(context)!
                                  .textoAsociadoNT;
                            }
                            widget.task.aT = v;
                            return null;
                          },
                        ),
                        (_extraFields == 1)
                            ? Column(
                                children: [
                                  RadioListTile<bool>(
                                      contentPadding: const EdgeInsets.all(0),
                                      title: Text(AppLocalizations.of(context)!
                                          .rbVFVNTVLabel),
                                      value: true,
                                      groupValue: _rgtf,
                                      onChanged: (bool? v) {
                                        setState(() => _rgtf = v!);
                                      }),
                                  RadioListTile<bool>(
                                      contentPadding: const EdgeInsets.all(0),
                                      title: Text(AppLocalizations.of(context)!
                                          .rbVFFNTLabel),
                                      value: false,
                                      groupValue: _rgtf,
                                      onChanged: (bool? v) {
                                        setState(() => _rgtf = v!);
                                      }),
                                ],
                              )
                            : (_extraFields == 2)
                                ? Column(
                                    children: [
                                      TextFormField(
                                          maxLines: 1,
                                          decoration: InputDecoration(
                                              labelText:
                                                  AppLocalizations.of(context)!
                                                      .rVMCQLabel,
                                              labelStyle: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall,
                                              focusedBorder:
                                                  const UnderlineInputBorder(
                                                      borderSide: BorderSide(
                                                          color: ColorsCusto
                                                              .pBlue))),
                                          cursorColor: ColorsCusto.pBlue,
                                          textCapitalization:
                                              TextCapitalization.sentences,
                                          initialValue: widget.task.isEmpty
                                              ? ""
                                              : widget.task.mcqCA,
                                          validator: (v) {
                                            if (v == null || v.trim().isEmpty) {
                                              return AppLocalizations.of(
                                                      context)!
                                                  .rVMCQ;
                                            }
                                            widget.task.mcqCA = v;
                                            return null;
                                          }),
                                      TextFormField(
                                          maxLines: 1,
                                          decoration: InputDecoration(
                                              labelText:
                                                  AppLocalizations.of(context)!
                                                      .rD1MCQLabel,
                                              labelStyle: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall,
                                              focusedBorder:
                                                  const UnderlineInputBorder(
                                                      borderSide: BorderSide(
                                                          color: ColorsCusto
                                                              .pBlue))),
                                          cursorColor: ColorsCusto.pBlue,
                                          textCapitalization:
                                              TextCapitalization.sentences,
                                          initialValue: widget.task.isEmpty
                                              ? ""
                                              : widget.task.mcqW1,
                                          validator: (v) {
                                            if (v == null || v.trim().isEmpty) {
                                              return AppLocalizations.of(
                                                      context)!
                                                  .rD1MCQ;
                                            }
                                            widget.task.mcqW1 = v;
                                            return null;
                                          }),
                                      TextFormField(
                                          maxLines: 1,
                                          decoration: InputDecoration(
                                              labelText:
                                                  AppLocalizations.of(context)!
                                                      .rD2MCQLabel,
                                              labelStyle: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall,
                                              focusedBorder:
                                                  const UnderlineInputBorder(
                                                      borderSide: BorderSide(
                                                          color: ColorsCusto
                                                              .pBlue))),
                                          cursorColor: ColorsCusto.pBlue,
                                          textCapitalization:
                                              TextCapitalization.sentences,
                                          initialValue: widget.task.isEmpty
                                              ? ""
                                              : widget.task.mcqW2,
                                          validator: (v) {
                                            if (v == null || v.trim().isEmpty) {
                                              return AppLocalizations.of(
                                                      context)!
                                                  .rD2MCQ;
                                            }
                                            widget.task.mcqW2 = v;
                                            return null;
                                          }),
                                      TextFormField(
                                          maxLines: 1,
                                          decoration: InputDecoration(
                                              labelText:
                                                  AppLocalizations.of(context)!
                                                      .rD3MCQLabel,
                                              labelStyle: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall,
                                              focusedBorder:
                                                  const UnderlineInputBorder(
                                                      borderSide: BorderSide(
                                                          color: ColorsCusto
                                                              .pBlue))),
                                          cursorColor: ColorsCusto.pBlue,
                                          textCapitalization:
                                              TextCapitalization.sentences,
                                          initialValue: widget.task.isEmpty
                                              ? ""
                                              : widget.task.mcqW3,
                                          validator: (v) {
                                            if (v == null || v.trim().isEmpty) {
                                              return AppLocalizations.of(
                                                      context)!
                                                  .rD3MCQ;
                                            }
                                            widget.task.mcqW3 = v;
                                            return null;
                                          }),
                                    ],
                                  )
                                : const SizedBox(
                                    height: 0,
                                    width: 0,
                                  ),
                        Row(
                            mainAxisAlignment: MainAxisAlignment.start,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Padding(
                                  padding: const EdgeInsets.only(top: 15.0),
                                  child: Text(
                                    AppLocalizations.of(context)!
                                        .cbEspacioDivLabel,
                                    style:
                                        Theme.of(context).textTheme.bodySmall,
                                    textAlign: TextAlign.start,
                                  )),
                              Tooltip(
                                child: const Padding(
                                    padding:
                                        EdgeInsets.only(top: 15.0, left: 10.0),
                                    child: Icon(
                                      Icons.help,
                                      color: ColorsCusto.pBlue,
                                    )),
                                message: AppLocalizations.of(context)!
                                    .cbEspacioDivPopover,
                              )
                            ]),
                        CheckboxListTile(
                            contentPadding: const EdgeInsets.all(0),
                            value: _spaFis,
                            onChanged: (v) {
                              setState(() {
                                _spaFis = v!;
                              });
                            },
                            title: Text(
                                AppLocalizations.of(context)!.rbEspacio1Label)),
                        CheckboxListTile(
                            contentPadding: const EdgeInsets.all(0),
                            value: _spaVir,
                            onChanged: (v) {
                              setState(() {
                                _spaVir = v!;
                              });
                            },
                            title: Text(
                                AppLocalizations.of(context)!.rbEspacio2Label)),
                        (_error)
                            ? Row(
                                mainAxisAlignment: MainAxisAlignment.start,
                                children: [
                                    Text(
                                      AppLocalizations.of(context)!
                                          .cbEspacioDivError,
                                      style: TextStyle(
                                          color: Colors.red[700], fontSize: 14),
                                    )
                                  ])
                            : const SizedBox(
                                height: 0,
                                width: 0,
                              )
                      ],
                    ),
                  ))),
        ));
  }
}

class InfoTask extends StatefulWidget {
  final POI poi;
  final Task task;
  const InfoTask(this.task, this.poi, {Key? key}) : super(key: key);

  @override
  State<StatefulWidget> createState() => _InfoTask();
}

class _InfoTask extends State<InfoTask> {
  CameraController? cameraController;
  late List<CameraDescription> cameras;

  @override
  void initState() {
    super.initState();
    availableCameras().then((allCameras) {
      cameras = allCameras;

      cameraController = CameraController(cameras[0], ResolutionPreset.max);
      cameraController!.initialize().then((_) {
        if (!mounted) {
          return;
        }
        setState(() {});
      });
    });
  }

  @override
  void dispose() {
    cameraController!.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
          title: Tooltip(
              message: widget.task.title,
              child: Text(
                widget.task.title,
              ))),
      body: SafeArea(
          minimum: const EdgeInsets.all(15),
          left: true,
          right: true,
          child: SingleChildScrollView(
              child: Column(
            children: [
              Row(children: [
                Flexible(
                    child: HtmlWidget(
                  widget.task.aTR,
                  factoryBuilder: () => MyWidgetFactory(),
                ))
              ]),
              SizedBox(height: 400, child: _containerCamera())
            ],
          ))),
    );
  }

  Widget _containerCamera() {
    if (cameraController == null || !cameraController!.value.isInitialized) {
      return Text('Cargando');
    } else {
      return AspectRatio(
        aspectRatio: cameraController!.value.aspectRatio,
        child: CameraPreview(cameraController!),
      );
    }
  }
}
