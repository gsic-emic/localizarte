import 'package:flutter/material.dart';

class ColorsCusto {
  static const MaterialColor pBlue = MaterialColor(
    _pBlueValue,
    <int, Color>{
      100: Color(0xFF324045),
      500: Color(_pBlueValue),
      900: Color(0xFF000000)
    },
  );
  static const MaterialColor pBluet = MaterialColor(
    _pBlueValue,
    <int, Color>{
      100: Color(0x99324045),
      500: Color(0x990c191e),
      900: Color(0x99000000)
    },
  );
  static const int _pBlueValue = 0xFF0c191e;

  static const MaterialColor cRed = MaterialColor(
    _cRed,
    <int, Color>{
      100: Color(0xFFe0567c),
      300: Color(0xffdb3e69),
      500: Color(_cRed),
      700: Color(0xffd30e44),
      900: Color(0xFFbd0c27)
    },
  );
  static const int _cRed = 0xffd72656;
}
