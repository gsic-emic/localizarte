import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:simple_mustache/simple_mustache.dart';

class Task {
  late BuildContext context;
  late String id, aT, thumb, aTR, icon, title;
  bool tthumb = false;
  late List spa;
  late int espaciosPosibles;
  Task(this.context, id, aT, thumb, aTR, sp, title) {
    (id is String) ? this.id = id : throw Exception('id problem');
    (aT is String) ? this.aT = aT : throw Exception('aT problem');
    (aTR is String)
        ? this.aTR = aTR
        : (aTR is List)
            ? this.aTR = aTR[0]
            : throw Exception('aTR problem');
    if (thumb is String) {
      tthumb = true;
      this.thumb = thumb;
    } else {
      if (thumb == null) {
        thumb = "";
      } else {
        throw Exception('thumb problem');
      }
    }
    List s = (sp is String) ? [sp] : sp;
    spa = [];
    for (int j = 0, tama2 = s.length; j < tama2; j++) {
      final item = s[j];
      spa.add((item is String) ? item : item['spa']);
    }
    if (spa.contains('https://casuallearn.gsic.uva.es/space/physical') &&
        spa.contains('https://casuallearn.gsic.uva.es/space/virtualMap')) {
      icon = 'images/movilPortatil.svg';
    } else {
      if (spa.contains('https://casuallearn.gsic.uva.es/space/physical')) {
        icon = 'images/movil.svg';
      } else {
        if (spa.contains('https://casuallearn.gsic.uva.es/space/virtualMap')) {
          icon = 'images/portatil.svg';
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
    this.title = Mustache(map: {"tAT": textoAT, "tt": (/*title ??*/ false)})
        .convert("{{tAT}}{{#tt}} - {{tt}}{{/tt}}");
  }

  bool isOnlyGeolocated() {
    return spa.contains('https://casuallearn.gsic.uva.es/space/physical') &&
        !spa.contains('https://casuallearn.gsic.uva.es/space/virtualMap');
  }
}
