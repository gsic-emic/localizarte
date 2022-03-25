import 'package:chest/helpers/colors_custo.dart';
import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

import 'managers/map.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
        title: 'CHEST',
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: const MyMap(),
        theme: ThemeData(
            primaryColor: ColorsCusto.pBlue,
            primaryColorDark: ColorsCusto.pBlue[900],
            primaryColorLight: ColorsCusto.pBlue[100],
            fontFamily: "OpenSans",
            snackBarTheme: const SnackBarThemeData(
                backgroundColor: ColorsCusto.pBlue,
                contentTextStyle: TextStyle(color: Colors.white)),
            textTheme: const TextTheme(
              bodySmall: TextStyle(fontSize: 14, color: Colors.black),
              bodyMedium: TextStyle(fontSize: 17, color: Colors.black),
              bodyLarge: TextStyle(fontSize: 20, color: Colors.black),
            ),
            appBarTheme: const AppBarTheme(
                backgroundColor: ColorsCusto.pBlue,
                foregroundColor: Colors.white),
            floatingActionButtonTheme: const FloatingActionButtonThemeData(
                backgroundColor: ColorsCusto.pBlue)));
  }
}
