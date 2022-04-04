import 'dart:math';

import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:simple_mustache/simple_mustache.dart';

class Task {
  late String _id, _aT, _thumb, _aTR, _icon, _title;
  bool _tthumb = false;
  late List _spa;
  late bool _empty, _vfC;

  Task.empty() {
    _id = "";
    _aT = "";
    _thumb = "";
    _aTR = "";
    _icon = "";
    _title = "";
    _spa = [];
    _empty = true;
    _vfC = Random.secure().nextBool();
  }

  Task(context, id, aT, thumb, aTR, sp, title) {
    _empty = false;
    _vfC = Random.secure().nextBool();
    (id is String) ? _id = id : throw Exception('id problem');
    (aT is String) ? _aT = aT : throw Exception('aT problem');
    (aTR is String)
        ? _aTR = aTR
        : (aTR is List)
            ? _aTR = aTR[0]
            : throw Exception('aTR problem');
    if (thumb is String) {
      _tthumb = true;
      _thumb = thumb;
    } else {
      if (thumb == null) {
        thumb = "";
      } else {
        throw Exception('thumb problem');
      }
    }
    List s = (sp is String) ? [sp] : sp;
    _spa = [];
    for (int j = 0, tama2 = s.length; j < tama2; j++) {
      final item = s[j];
      _spa.add((item is String) ? item : item['spa']);
    }
    if (_spa.contains('https://casuallearn.gsic.uva.es/space/physical') &&
        _spa.contains('https://casuallearn.gsic.uva.es/space/virtualMap')) {
      _icon = 'images/movilPortatil.svg';
    } else {
      if (_spa.contains('https://casuallearn.gsic.uva.es/space/physical')) {
        _icon = 'images/movil.svg';
      } else {
        if (_spa.contains('https://casuallearn.gsic.uva.es/space/virtualMap')) {
          _icon = 'images/portatil.svg';
        } else {
          throw Exception('icon problem');
        }
      }
    }
    String textoAT;
    switch (aT) {
      case 'https://casuallearn.gsic.uva.es/answerType/multiplePhotos':
        textoAT = AppLocalizations.of(context)!.textoAT0;
        break;
      case 'https://casuallearn.gsic.uva.es/answerType/multiplePhotosAndText':
        textoAT = AppLocalizations.of(context)!.textoAT1;
        break;
      case 'https://casuallearn.gsic.uva.es/answerType/noAnswer':
        textoAT = AppLocalizations.of(context)!.textoAT2;
        break;
      case 'https://casuallearn.gsic.uva.es/answerType/photo':
        textoAT = AppLocalizations.of(context)!.textoAT3;
        break;
      case 'https://casuallearn.gsic.uva.es/answerType/photoAndText':
        textoAT = AppLocalizations.of(context)!.textoAT4;
        break;
      case 'https://casuallearn.gsic.uva.es/answerType/shortText':
        textoAT = AppLocalizations.of(context)!.textoAT5;
        break;
      case 'https://casuallearn.gsic.uva.es/answerType/text':
        textoAT = AppLocalizations.of(context)!.textoAT6;
        break;
      case 'https://casuallearn.gsic.uva.es/answerType/video':
        textoAT = AppLocalizations.of(context)!.textoAT7;
        break;
      case 'https://casuallearn.gsic.uva.es/answerType/mcq':
        textoAT = AppLocalizations.of(context)!.textoAT8;
        break;
      case 'https://casuallearn.gsic.uva.es/answerType/trueFalse':
        textoAT = AppLocalizations.of(context)!.textoAT9;
        break;
      default:
        textoAT = AppLocalizations.of(context)!.textoAT10;
        throw Exception('textoAT problem');
    }
    _title = Mustache(map: {"tAT": textoAT, "tt": (/*title ??*/ false)})
        .convert("{{tAT}}{{#tt}} - {{tt}}{{/tt}}");
  }

  bool isOnlyGeolocated() {
    return _spa.contains('https://casuallearn.gsic.uva.es/space/physical') &&
        !_spa.contains('https://casuallearn.gsic.uva.es/space/virtualMap');
  }

  bool get isEmpty => !_empty;
  String get id => _id;

  String get aT => _aT;
  set aT(String aT) => _aT = aT;

  String get thumb => (_tthumb) ? _thumb : "";
  set thumb(String thumb) {
    _thumb = thumb;
    _tthumb = true;
  }

  String get aTR => _aTR;
  set aTR(String aTR) => _aTR = aTR;

  String get icon => _icon;
  set icon(String icon) => _icon = icon;

  String get title => _title;
  set title(String title) => _title = title;

//TODO
  String get mcqCA => "";
  set mcqCA(String t) {}
  String get mcqW1 => "";
  set mcqW1(String t) {}
  String get mcqW2 => "";
  set mcqW2(String t) {}
  String get mcqW3 => "";
  set mcqW3(String t) {}
  bool get vfC => _vfC;
  set vfC(bool t) => _vfC = t;
}
