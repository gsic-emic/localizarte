class POI {
  late String _id, _titulo, _descr, _autor, _imagen;
  late double _lat, _long;
  bool _timagen = false;

  String getId() => _id;
  String getTitulo() => _titulo;
  String getDescr() => _descr;
  String getAutor() => _autor;
  String getImagen() => _imagen;
  bool isImagen() => _timagen;
  double getLat() => _lat;
  double getLng() => _long;

  POI(id, lat, long, titulo, descr, autor, imagen) {
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
      throw Exception('lat problem');
    }
    if (long is String) {
      try {
        _long = double.parse(long);
      } catch (e) {
        throw Exception('long problem');
      }
    } else {
      throw Exception('long problem');
    }
    if (titulo is String) {
      _titulo = titulo;
    } else {
      throw Exception('ctx problem');
    }
    if (descr is String) {
      _descr = descr;
    } else {
      throw Exception('ctx problem');
    }
    if (autor is String) {
      _autor = autor;
    } else {
      throw Exception('ctx problem');
    }
    if (imagen is String) {
      _imagen = imagen;
      _timagen = true;
    } else {
      if (imagen != null) {
        throw Exception('ctx problem');
      } else {
        _imagen = "";
      }
    }
  }
}
