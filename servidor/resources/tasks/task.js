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
 * Gestión de peticiones relacionadas con el recurso "tarea".
 * autor: Pablo García Zarza
 * version: 20210503
 */

const Http = require('http');
const Auxiliar = require('../../util/auxiliar');
const Queries = require('../../util/queries');

/**
 * Función para obtener toda la información de una tarea
 *
 * @param {Object} req Request
 * @param {Object} res Response
 */
function dameTarea(req, res) {
  try {
    if (req.body && req.body.iri) {
      const { iri } = req.body;
      const options = Auxiliar.creaOptions(Queries.todaInfo(iri));
      const consulta = function (respuesta) {
        const datos = [];
        respuesta.on('data', (dato) => {
          datos.push(dato);
        });
        respuesta.on('end', () => {
          let resultados = Auxiliar.procesaJSONSparql(['propiedad', 'valor'], Buffer.concat(datos).toString());
          if (resultados.length > 0) {
            resultados = resultados.pop();
            resultados.task = iri;
            res.json(resultados);
          } else res.status(404).send('La tarea no existe en el repositorio');
        });
      };
      Http.request(options, consulta).end();
    } else {
      res.sendStatus(400);
    }
  } catch (e) {
    res.sendStatus(500);
  }
}

/**
 * Función para actualizar los datos de una tarea del repositorio. También puede utilizarse
 * para agregar nuevos datos o eliminar alguno de los existentes.
 *
 * @param {Object} req Request
 * @param {Object} res Response
 */
function actualizaTarea(req, res) {
  try {
    const { body } = req;
    if (body && body.actual && body.actual.iri && body.modificados) {
      const { iri } = body.actual;
      let options = Auxiliar.creaOptions(Queries.todaInfo(iri));
      let consulta = (respuestaC) => {
        let datos = [];
        respuestaC.on('data', (dato) => {
          datos.push(dato);
        });
        respuestaC.on('end', () => {
          let result = Auxiliar.procesaJSONSparql(['propiedad', 'valor'], Buffer.concat(datos).toString());
          if (result && result.length > 0) {
            result = result.pop();
            result.iri = iri;
            const { actual } = body;
            let iguales = true;
            for (const enviado in actual) {
              if(!result[enviado] || result[enviado] != actual[enviado]) {
                iguales = false;
                break;
              }
            }
            if (iguales) {
              const { modificados } = body;
              const insercciones = {};
              const eliminaciones = {};
              const actualizaciones = {};

              for ( const mod in modificados ) {
                if (!actual[mod]) {
                  insercciones[mod] = modificados[mod];
                } else if (Auxiliar.isEmpty(modificados[mod].trim())) {
                  eliminaciones[mod] = resultados[(Auxiliar.equivalencias[mod]).prop];
                } else {
                  actualizaciones[mod] = {
                    anterior: actual[mod],
                    nuevo: modificados[mod],
                  };
                }
              }
              options = Auxiliar.creaOptionsAuth(Queries.actualizaValoresTareas(
                iri, insercciones, eliminaciones, actualizaciones,
              ), 'pablo', 'pablo');
              consulta = (responseB) => {
                datos = [];
                responseB.on('data', (dato) => {
                  datos.push(dato);
                });
                responseB.on('end', () => {
                  result = Auxiliar.procesaJSONSparql(['callret-0'], Buffer.concat(datos).toString());
                  if (result && result.length > 0) {
                    res.sendStatus(200);
                  } else {
                    res.sendStatus(503);
                  }
                });
              };
              Http.request(options, consulta).end();
            } else {
              res.status(400).send('Los datos que el usuario ha enviado no son los almacenados en el repositorio');
            }
          } else {
            res.status(404).send('La tarea no se encuentra en el repositorio de triplas.');
          }
        });
      };
      Http.request(options, consulta).end();
    } else {
      res.status(400).send('Se debe enviar un JSON en el cuerpo con los valores actuales y los que se desea modificar');
    }
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
}

/**
 * Función para eliminar una tarea que exista en el repositorio
 *
 * @param {Objeto} req Request
 * @param {Objeto} res Response
 */
function eliminaTarea(req, res) {
  try {
    if (req.body && req.body.iri) {
      const iri = (req.body.iri).trim();
      // Compruebo si existe en el repositorio y obtengo su info (para comprobar el autor)
      if (typeof iri === 'string' && !Auxiliar.isEmpty(iri)) {
        let options = Auxiliar.creaOptions(Queries.todaInfo(iri));
        let consulta = (responseD) => {
          let datos = [];
          responseD.on('data', (dato) => {
            datos.push(dato);
          });
          responseD.on('end', () => {
            let resultados = Auxiliar.procesaJSONSparql(['propiedad', 'valor'], Buffer.concat(datos).toString());
            if (resultados.length > 0) {
              resultados = resultados.pop();
              // Por ahora solo nos interesa que exista. En un futuro se harán más comprobaciones
              options = Auxiliar.creaOptionsAuth(Queries.eliminaTarea(iri), 'pablo', 'pablo');
              consulta = (responseB) => {
                datos = [];
                responseB.on('data', (dato) => {
                  datos.push(dato);
                });
                responseB.on('end', () => {
                  resultados = Auxiliar.procesaJSONSparql(['callret-0'], Buffer.concat(datos).toString());
                  if (resultados.length > 0) {
                    res.sendStatus(200);
                  } else {
                    res.sendStatus(503);
                  }
                });
              };
              Http.request(options, consulta).end();
            } else {
              res.status(404).send('La tarea no existe en el repositorio de triplas');
            }
          });
        };
        Http.request(options, consulta).end();
      } else {
        res.status(400).send('Solo es posible eliminar una tarea.');
      }
    } else {
      res.status(400).send('En el cuerpo de la petición tiene que existir un JSON con el parámetro iri');
    }
  } catch (e) {
    res.sendStatus(500);
  }
}

module.exports = {
  dameTarea,
  actualizaTarea,
  eliminaTarea,
};
