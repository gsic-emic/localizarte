import 'package:chest/helpers/colors_custo.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:universal_io/io.dart';

import 'managers/map.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  /// Contorla el idioma de la aplicación.
  static String currentLang = "en";
  static final List<String> langs = ["es", "en"];

  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    //Idioma de la aplicación
    String aux = Platform.localeName;
    if (aux.contains("_")) {
      aux = aux.split("_")[0];
    }
    if (langs.contains(aux)) {
      currentLang = aux;
    }

    return MaterialApp(
        title: 'CHEST',
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: const MyMap(),
        theme: ThemeData(
            toggleableActiveColor: ColorsCusto.pBlue,
            primaryColor: ColorsCusto.pBlue,
            primaryColorDark: ColorsCusto.pBlue[900],
            primaryColorLight: ColorsCusto.pBlue[100],
            fontFamily: "OpenSans",
            snackBarTheme: SnackBarThemeData(
                backgroundColor: ColorsCusto.pBlue,
                contentTextStyle: const TextStyle(color: Colors.white),
                actionTextColor: Colors.blue[300]),
            textTheme: const TextTheme(
              bodySmall: TextStyle(fontSize: 14, color: Colors.black),
              bodyMedium: TextStyle(fontSize: 17, color: Colors.black),
              bodyLarge: TextStyle(fontSize: 20, color: Colors.black),
            ),
            appBarTheme: const AppBarTheme(
                backgroundColor: ColorsCusto.pBlue,
                foregroundColor: Colors.white),
            floatingActionButtonTheme: const FloatingActionButtonThemeData(
                backgroundColor: ColorsCusto.pBlue),
            elevatedButtonTheme: ElevatedButtonThemeData(
              style: ButtonStyle(
                  backgroundColor: MaterialStateProperty.all(ColorsCusto.pBlue),
                  foregroundColor: MaterialStateProperty.all(Colors.white)),
            )));
  }
}
