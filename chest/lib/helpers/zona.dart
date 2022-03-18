import 'package:chest/helpers/poi.dart';
import 'package:flutter_map/plugin_api.dart';
import 'package:latlong2/latlong.dart';

class TeselaPoi {
  final double _lado = 0.0254;
  final int _unDia = 1000*60*60*24;
  late List<POI> _pois;
  late double _north, _west;
  late DateTime _update;
  late LatLngBounds _bounds;
  TeselaPoi(this._north, this._west, pois) {
    _bounds = LatLngBounds(
        LatLng(_north, _west), LatLng(_north - _lado, _west + _lado));
    _update = DateTime.now();
    _pois = [...pois];
  }

  TeselaPoi.withoutPois(double north, double west) {
    TeselaPoi(north, west, <POI>[]);
  }

  updateED() {
    _update = DateTime.now();
  }

  bool isValid() {
    return DateTime.now().isBefore(DateTime.fromMillisecondsSinceEpoch(
        _update.millisecondsSinceEpoch + _unDia));
  }

  List<POI> getPois() {
    return _pois;
  }

  bool isEqual(LatLng punto) {
    return (punto.latitude == _north && punto.longitude == _west);
  }

  bool checkIfContains(pointOrBound) {
    if (pointOrBound is LatLng) {
      return _bounds.contains(pointOrBound);
    } else {
      if (pointOrBound is LatLngBounds) {
        return _bounds.containsBounds(pointOrBound);
      } else {
        return false;
      }
    }
  }
}
