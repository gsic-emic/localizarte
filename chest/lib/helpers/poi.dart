import 'package:latlong2/latlong.dart';

class POI {
  late String _id, _titulo, _descr, _autor, _imagen, _fuentes, _licencia;
  late double _lat, _long;
  bool _timagen = false, _isEmpty = true, _isComplete = false;

  POI(id, lat, long, titulo, descr, autor, imagen, licencia, fuentes) {
    if (id is String) {
      _id = id;
    } else {
      throw Exception('ctx problem');
    }
    if (lat is String) {
      try {
        _lat = double.parse(lat);
      } catch (e) {
        throw Exception('lat problem');
      }
    } else {
      if (lat is double) {
        _lat = lat;
      } else {
        throw Exception('lat problem');
      }
    }
    if (long is String) {
      try {
        _long = double.parse(long);
      } catch (e) {
        throw Exception('long problem');
      }
    } else {
      if (long is double) {
        _long = long;
      } else {
        throw Exception('long problem');
      }
    }
    if (titulo is List) {
      _titulo = titulo[0];
    } else {
      if (titulo is String) {
        _titulo = titulo;
      } else {
        throw Exception('titulo problem');
      }
    }
    if (descr is String) {
      _descr = descr;
    } else {
      if (descr is List) {
        _descr = descr[0];
      } else {
        throw Exception('descr problem');
      }
    }
    if (autor is String) {
      _autor = autor;
    } else {
      if (autor is List) {
        _autor = autor[0];
      } else {
        throw Exception('autor problem');
      }
    }
    if (imagen is String) {
      _imagen = imagen;
      _timagen = true;
    } else {
      if (imagen != null) {
        throw Exception('imagen problem');
      } else {
        _imagen = "";
      }
    }
    if (licencia is String) {
      _licencia = licencia;
    } else {
      if (licencia is List) {
        _licencia = licencia[0];
      } else {
        throw Exception('License problem');
      }
    }
    if (fuentes is String) {
      _fuentes = fuentes;
    } else {
      if (fuentes is List) {
        _fuentes = fuentes[0];
      } else {
        throw Exception('fuentes problem');
      }
    }
    _isEmpty = false;
    _isComplete = true;
  }

  POI.empty() {
    _id = "";
    _titulo = "";
    _descr = "";
    _autor = "";
    _imagen = "";
    _licencia = "";
    _fuentes = "";
    _lat = double.infinity;
    _long = double.infinity;
    _timagen = false;
  }

  POI.onlyPosition(this._lat, this._long) {
    _id = "";
    _titulo = "";
    _descr = "";
    _autor = "";
    _imagen = "";
    _licencia = "";
    _fuentes = "";
    _timagen = false;
    _isEmpty = false;
    _isComplete = false;
  }

  String get id => _id;
  set id(String id) {
    assert(id.isNotEmpty);
    _id = id;
  }

  String get titulo => _titulo;
  set titulo(String titulo) {
    assert(titulo.isNotEmpty);
    _titulo = titulo;
  }

  String get descr => _descr;
  set descr(String descr) {
    assert(descr.isNotEmpty);
    _descr = descr;
  }

  String get autor => _autor;
  set autor(String autor) {
    assert(autor.isNotEmpty);
    _autor = autor;
  }

  String get imagen => _imagen;
  set imagen(String imagen) {
    assert(imagen.isNotEmpty);
    _imagen = imagen;
    _timagen = true;
  }

  bool get hasImagen => _timagen;

  double get lat => _lat;
  set lat(double lat) {
    assert(lat >= -90 && lat <= 90);
    _lat = lat;
    if (_isEmpty && _long != double.infinity) {
      _isEmpty = false;
    }
  }

  double get lng => _long;
  set lng(double lng) {
    assert(lng >= -180 && lng <= 180);
    _long = lng;
    if (_isEmpty && _lat != double.infinity) {
      _isEmpty = false;
    }
  }

  String get fuentes => _fuentes;
  set fuentes(String fuentes) {
    _fuentes = fuentes;
  }

  String get licencia => _licencia;
  set licencia(String fuentes) {
    _licencia = fuentes;
  }

  bool get isEmpty => _isEmpty;
  bool get isComplete => _isComplete;
  bool get isValid => !_isEmpty && _isComplete;
}

class NearSug {
  final String _place;
  final double _lat, _lng;
  double _distance = double.infinity;

  NearSug(this._place, this._lat, this._lng, posPul) {
    const Distance d = Distance();
    _distance = d.as(LengthUnit.Meter, posPul, LatLng(_lat, _lng));
  }

  double get lat => _lat;
  double get lng => _lng;
  String get place => _place;

  double get distance => _distance;
}

class POISug {
  late final String _place;
  late List<PairLang> _label, _comment;
  late List<Category> _categories;
  late List<PairImage> _images;

  POISug(this._place, dynamic label, dynamic comment, dynamic categories,
      dynamic images) {
    if (label is String) {
      _label = [PairLang.withoutLang(label)];
    } else {
      _label = [];
      for (Map<String, dynamic> l in label) {
        l.forEach((String key, dynamic value) =>
            _label.add(PairLang(key, value.toString())));
      }
    }

    if (comment is String) {
      _comment = [PairLang.withoutLang(comment)];
    } else {
      _comment = [];
      for (Map<String, dynamic> l in comment) {
        l.forEach((String key, dynamic value) =>
            _comment.add(PairLang(key, value.toString())));
      }
    }

    if (categories is Map<String, dynamic> || categories is List) {
      if (categories is Map) {
        _categories = [
          Category(
              categories["iri"], categories["label"], categories["broader"])
        ];
      } else {
        _categories = [];
        for (Map<String, dynamic> category in categories) {
          _categories.add(Category(
              category["iri"], category["label"], category["broader"]));
        }
      }
    }

    if (images != null) {
      if (images is String) {
        _images = [PairImage.withoutLicense(images)];
      } else {
        if (images is Map<String, dynamic>) {
          if (images.containsKey("iri") && images.containsKey("rights")) {
            _images = [
              PairImage(images["iri"].toString(), images["rights"].toString())
            ];
          } else {
            throw Exception("Error images. Not iri or rights");
          }
        } else {
          if (images is List) {
            _images = [];
            for (Map<String, dynamic> i in images) {
              if (i.containsKey("iri") && i.containsKey("rights")) {
                _images.add(
                    PairImage(i["iri"].toString(), i["rights"].toString()));
              } else {
                if (i.containsKey("iri")) {
                  _images.add(PairImage.withoutLicense(i["iri"].toString()));
                } else {
                  throw Exception("Error images. Not iri");
                }
              }
            }
          } else {
            throw Exception("Error images");
          }
        }
      }
    } else {
      _images = [];
    }
  }
  String get place => _place;
  List<PairLang> get labels => _label;
  String label(lang) {
    for (PairLang la in _label) {
      if (la.hasLang && identical(label, la.lang)) {
        return la.value;
      }
    }
    return "";
  }

  List<PairLang> get comments => _comment;
  String comment(lang) {
    for (PairLang la in _comment) {
      if (lang == la.lang) {
        return la.value;
      }
    }
    return "";
  }

  List<Category> get categories => _categories;

  List<PairImage> get images => _images;
}

class PairLang {
  late String _lang;
  final String _value;
  PairLang(this._lang, this._value);

  PairLang.withoutLang(this._value) {
    _lang = "";
  }

  bool get hasLang => _lang.isEmpty;
  String get lang => _lang;
  String get value => _value;
}

class Category {
  final String _iri;
  late List<PairLang> _label;
  late List<String> _broader;
  Category(this._iri, label, broader) {
    _label = [];
    if (label is String || label is Map || label is List) {
      if (label is String) {
        _label.add(PairLang.withoutLang(label));
      } else {
        if (label is Map) {
          label.forEach((key, value) => _label.add(PairLang(key, value)));
        } else {
          for (Map<String, String> l in label) {
            l.forEach(
                (String key, String value) => _label.add(PairLang(key, value)));
          }
        }
      }
    } else {
      throw Exception("Problem with label");
    }
    if (broader is String || broader is List) {
      if (broader is String) {
        _broader = [broader];
      } else {
        _broader = [...broader];
      }
    } else {
      throw Exception("Problem with broader");
    }
  }

  String get iri => _iri;
  List<PairLang> get label => _label;
  List<String> get broader => _broader;
}

class PairImage {
  late final String _image;
  String _license = "";
  late bool hasLicense;
  PairImage(this._image, this._license) {
    hasLicense = (_license.trim().isNotEmpty);
  }

  PairImage.withoutLicense(this._image) {
    hasLicense = false;
  }

  String get image => _image;
  String get license => _license;
}
