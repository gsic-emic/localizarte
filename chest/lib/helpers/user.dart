import 'package:chest/helpers/task.dart';

class User {
  late String _username;
  late List<Task> _cT = [];
  late int _rol;

  User(this._username, this._rol, this._cT);

  User.witoutTasks(this._username, this._rol) {
    _cT = <Task>[];
  }

  User.noLogin() {
    _username = "";
    _rol = -1;
    _cT = <Task>[];
  }

  String getUsername() => _username;
  int getRol() => _rol;
  List<Task> getResponses() => _cT;
}
