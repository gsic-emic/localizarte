/*
Copyright 2021 GSIC-EMIC Research Group, Universidad de Valladolid (Spain)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * Gestión de peticiones relacionadas con el recurso "contexto".
 * autor: Pablo García Zarza
 * version: 20210428
 */

const Queries = require('../../util/queries');
const Auxiliar = require('../../util/auxiliar');
const Http = require('http');

/**
 * Método para controlar las consultas que hagan los usuarios para obtener la información de 
 * un contexto. El identificador del contexto deberá indicarse en el cuerpo de este para evitar 
 * problemas con las divisiones de los recursos.
 * 
 * @param {Request} req Petición del cliente
 * @param {Response} res Respuesta del servidor
 */
function dameContexto(req, res) {
  try {
    var iri = req.body;
    if (iri && iri.iri) {
      iri = iri.iri;
      if (typeof iri === 'string')
        var options = Auxiliar.creaOptions(Queries.todaInfo(iri));
      consulta = function (response) {
        var chunks = [];
        response.on('data', function (chunk) {
          chunks.push(chunk);
        });
        response.on('end', function () {
          var resultados = Auxiliar.procesaJSONSparql(
            ['propiedad', 'valor'],
            Buffer.concat(chunks).toString());
          if (resultados.length > 0) {
            resultados = resultados.pop();
            resultados['ctx'] = iri;
            res.json(resultados);
          }
          else res.status(404).send('El contexto no existe en el repositorio');
        });
      };
      Http.request(options, consulta).end();
    } else {
      res.status(400).send('El cuerpo del mensaje debe tener un JSONObject del tipo {"iri":"idContexto"}');
    }
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
}

/**
 * Método para controlar las peticiones de borrado de un contexto que realicen los usuarios. 
 * El identificador del contexto deberá indicarse en el cuerpo de este para evitar problemas 
 * con las divisiones de los recursos.
 * 
 * @param {Request} req Petición del cliente
 * @param {Response} res Respuesta del servidor
 */
function eliminaContexto(req, res) {
  try {
    var iri = req.body;
    if (iri && iri.iri) {
      iri = iri.iri;
      if (typeof iri === 'string') {
        var options = Auxiliar.creaOptions(Queries.todaInfo(iri));
        consulta = function (response) {
          var chunks = [];
          response.on('data', function (chunk) {
            chunks.push(chunk);
          });
          response.on('end', function () {
            var resultados = Auxiliar.procesaJSONSparql(
              ['propiedad', 'valor'],
              Buffer.concat(chunks).toString());
            if (resultados.length > 0) {
              resultados = resultados.pop();
              resultados['iri'] = iri;
              //Ya tenemos toda la información a eliminar
              options = Auxiliar.creaOptionsAuth(Queries.eliminaContexto(resultados), 'pablo', 'pablo');
              //Realizo la eliminación
              borrado = function (response) {
                var chunks = [];
                response.on('data', function (chunk) {
                  chunks.push(chunk);
                });
                response.on('end', function () {
                  var resultados = Auxiliar.procesaJSONSparql(['callret-0'], Buffer.concat(chunks).toString());
                  if (resultados.length > 0) {
                    res.sendStatus(200);
                  }
                  else res.status(503).send('El repositorio no puede eliminar el contexto');
                });
              };
              Http.request(options, borrado).end();
            }
            else res.status(404).send('La IRI no existe en el repositorio o no es un contexto');
          });
        };
        Http.request(options, consulta).end();
      }
      else res.status(400).send('Solo es posible eliminar un contexto en cada petición');
    } else
      res.status(400).send('El cuerpo del mensaje debe tener un JSONObject del tipo {"iri":"idContexto"}');
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
}

function actualizaContexto(req, res) {
  try {
    const body = req.body;
    if (body && body.actual && body.actual.iri && body.modificados) {
      const iri = body.actual.iri;
      //Recupero toda la información del servidor para comprobar que es la misma que ha enviado el usuario
      var options = Auxiliar.creaOptions(Queries.todaInfo(iri));
      consulta = function (response) {
        var chunks = [];
        response.on('data', function (chunk) {
          chunks.push(chunk);
        });
        response.on('end', function () {
          var resultados = Auxiliar.procesaJSONSparql(
            ['propiedad', 'valor'],
            Buffer.concat(chunks).toString());
          if (resultados.length > 0) {
            resultados = resultados.pop();
            resultados['iri'] = iri;
            var actual = body.actual;
            //Ahora compruebo que son iguales
            var iguales = true;
            for (const enviado in actual) {
              //let enviadoT = (Auxiliar.equivalencias[enviado])['prop'];
              if (!resultados[enviado] || resultados[enviado] != actual[enviado]) {
                res.status(400).send('Los datos actuales no coinciden con los del repositorio');
                iguales = false;
                break;
              }
            }
            if (iguales) {
              /* Si llego aquí es que la información actual del usuario era correcta. Ahora tengo 
               * que comprobar si se necesitan realizar actualizaciones, inserciones, eliminaciones o
               * todas ellas */
              var modificados = body.modificados;
              //Compruebo que keys están presentes en modificados y actuales. Sera actualizaciones o 
              //eliminaciones. El resto serán inserciones
              var inserciones = {};
              var eliminaciones = {};
              var actualizaciones = {};

              for (const mod in modificados) {
                if (!actual[mod]) {
                  inserciones[mod] = modificados[mod];
                } else {
                  if (modificados[mod].trim() == '')
                    eliminaciones[mod] = resultados[(Auxiliar.equivalencias[mod])['prop']];
                  else {
                    actualizaciones[mod] = {
                      'anterior': actual[mod],
                      'nuevo': modificados[mod]
                    }
                  }
                }
              }
              const query = Queries.actualizaValoresContexto(iri, inserciones, eliminaciones, actualizaciones);
              //Realizo la petición al punto sparql
              options = Auxiliar.creaOptionsAuth(query, 'pablo', 'pablo');
              borrado = function (response) {
                var chunks = [];
                response.on('data', function (chunk) {
                  chunks.push(chunk);
                });
                response.on('end', function () {
                  var resultados = Auxiliar.procesaJSONSparql(['callret-0'], Buffer.concat(chunks).toString());
                  if (resultados.length > 0) {
                    res.sendStatus(200);
                  }
                  else res.status(503).send('El repositorio no puede eliminar el contexto');
                });
              };
              Http.request(options, borrado).end();
            }
          } else {
            res.status(404).send('El contexto no existe en el repositorio');
          }
        });
      };
      Http.request(options, consulta).end();
    } else {
      res.status(400).send('Se tiene que enviar un JSON en el cuerpo que contenta la etiqueta actual y modificados. En actual se indicará toda la información actual del contexto. En modificados los valores que se van a agregar o a modificar.');
    }
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
}


module.exports = { dameContexto, eliminaContexto, actualizaContexto }