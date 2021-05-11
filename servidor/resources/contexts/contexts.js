/* eslint-disable guard-for-in */
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
 * Gestión de peticiones relacionadas con la colección "contextos".
 * autor: Pablo García Zarza
 * version: 20210429
 */

const Http = require('http');
const Queries = require('../../util/queries');
const Auxiliar = require('../../util/auxiliar');

/**
 * Método para obtener los contextos de una zona. Como queries el cliente deberá proporcionar la
 * longitud (long) y la latitud (lat). El sistema crea una cuadrícula de lado 0.0254 grados y
 * devuelve los resultados al cliente.
 *
 * @param {Request} req Request
 * @param {Response} res Response
 */
function obtenContextos(req, res) {
  try {
    const lado = 0.0254;
    const { lat } = req.query;
    const { long } = req.query;
    if (lat && long) {
      const norte = parseFloat(lat);
      const oeste = parseFloat(long);
      if (Auxiliar.latitudValida(norte) && Auxiliar.longitudValida(oeste)) {
        const options = Auxiliar.creaOptions(Queries.contextosZona({
          norte, sur: norte - lado, este: oeste + lado, oeste,
        }));
        const consulta = (response) => {
          const chunks = [];
          response.on('data', (chunk) => {
            chunks.push(chunk);
          });
          response.on('end', () => {
            const resultados = Auxiliar.procesaJSONSparql(
              ['ctx', 'lat', 'long', 'titulo', 'descr', 'autor', 'imagen'],
              Buffer.concat(chunks).toString(),
            );
            if (resultados && resultados.length > 0) {
              res.json(resultados);
            } else { res.sendStatus(204); }
          });
        };
        Http.request(options, consulta).end();
      } else { res.status(400).send('La latitud y la longitud deben ser números válidos.'); }
    } else { res.status(400).send('Se tiene que enviar como query la posición más al noroeste de la cuadrícula: URL/contexts?lat=<lat>&long=<long>'); }
  } catch (e) {
    res.sendStatus(500);
  }
}

/**
 * Método para crear un nuevo contexto en el sistema. En esta prueba solo recibo latitud,
 * longitud, titulo, descripción y autor. Posteriormente se podrán incluir más campos.
 *
 * @param {Request} req Request
 * @param {Response} res Response
 */
function nuevoContexto(req, res) {
  try {
    console.log(req.body);
    const nCtx = req.body;
    // Compruebo que se han enviado los datos básicos
    if (nCtx && nCtx.lat && nCtx.long && nCtx.titulo && nCtx.descr && nCtx.autor) {
      // Adapto los datos obligatorios a sus tipos y compruebo que sean válidos
      const { lat } = nCtx;
      const { long } = nCtx;
      const titulo = nCtx.titulo.trim();
      const descr = nCtx.descr.trim();
      const autor = nCtx.autor.trim();
      if (Auxiliar.latitudValida(lat) && Auxiliar.longitudValida(long)
        && titulo && descr && autor) {
        // Creo la posible IRI y compruebo que no exista en el repositorio
        const iri = `https://casuallearn.gsic.uva.es/context/${titulo.replace(/ /g, '_')
          }/${Auxiliar.numeroStringIRI(long)
          }/${Auxiliar.numeroStringIRI(lat)}`;
        console.log(iri);
        let options = Auxiliar.creaOptions(Queries.tipoIRI(iri));
        const consulta = (response) => {
          let chunks = [];
          response.on('data', (chunk) => {
            chunks.push(chunk);
          });
          response.on('end', () => {
            let resultados = Auxiliar.procesaJSONSparql(['tipo'], Buffer.concat(chunks).toString());
            if (resultados.length == 0) {
              // El iri no existe en el repositorio así que sigo
              const datosContexto = {
                iri,
              };
              for (const t in nCtx) {
                switch (t) {
                  case 'lat':
                  case 'long':
                    datosContexto[t] = nCtx[t];
                    break;
                  default:
                    datosContexto[t] = nCtx[t].trim();
                    break;
                }
              }
              options = Auxiliar.creaOptionsAuth(Queries.nuevoContexto(datosContexto), 'pablo', 'pablo');
              // Realizo la inserción en el repositorio
              const insercion = (responseI) => {
                chunks = [];
                responseI.on('data', (chunk) => {
                  chunks.push(chunk);
                });
                responseI.on('end', () => {
                  resultados = Auxiliar.procesaJSONSparql(['callret-0'], Buffer.concat(chunks).toString());
                  if (resultados.length > 0) {
                    res.location(iri);
                    res.status(201).send(JSON.stringify({ ctx: iri }));
                  } else res.status(503).send('El repositorio no es capaz de insertar el nuevo contexto');
                });
              };
              Http.request(options, insercion).end();
            } else { res.status(409).send('Se produce un conflicto con el nombre del contexto y la posición puesto que ya existe en el repositorio'); }
          });
        };
        Http.request(options, consulta).end();
      } else { res.status(400).send('La latitud y la longitud deben ser números válidos. Los strings no pueden estar vacíos'); }
    } else { res.status(400).send('Se deben enviar los siguientes campos en el cuerpo de la petición como un JSONObject: "lat", "long", "titulo", "autor", "descr".'); }
  } catch (e) {
    res.sendStatus(500);
  }
}

module.exports = { obtenContextos, nuevoContexto };
