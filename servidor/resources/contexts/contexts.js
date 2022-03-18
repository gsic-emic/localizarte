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
 * version: 20211109
 */

const Http = require('http');
const admin = require('firebase-admin');
const Mustache = require('mustache');
const winston = require('../../util/winston');
const fetch = require('node-fetch');

const Queries = require('../../util/queries');
const Auxiliar = require('../../util/auxiliar');
const Configuracion = require('../../util/config');
const { dameDocumentoRapida } = require('../../util/bd');
const { response } = require('express');

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
    const start = Date.now();
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
              ['ctx', 'lat', 'long', 'titulo', 'descr', 'autor', 'imagen', 'dbpedia'],
              Buffer.concat(chunks).toString(),
            );
            if (resultados && resultados.length > 0) {
              winston.info(Mustache.render(
                'getPOIZone || {{{lat}}} - {{{lng}}} || {{{nPOI}}} || {{{time}}}',
                {
                  lat: lat,
                  lng: long,
                  nPOI: resultados.length,
                  time: Date.now() - start
                }
              ));
              Auxiliar.logHttp(req, res, 200, 'getPOIZoneL', start).json(resultados);
            } else {
              winston.info(Mustache.render(
                'getPOIZone || {{{lat}}} - {{{lng}}} || 0 || {{{time}}}',
                {
                  lat: lat,
                  lng: long,
                  time: Date.now() - start
                }
              ));
              Auxiliar.logHttp(req, res, 204, 'getPOIZoneL', start).end();
            }
          });
        };
        Http.request(options, consulta).end();
      } else { Auxiliar.logHttp(req, res, 400, 'getPOIZoneLE', start).send('La latitud y la longitud deben ser números válidos.'); }
    } else { Auxiliar.logHttp(req, res, 400, 'getPOIZoneLE', start).send('Se tiene que enviar como query la posición más al noroeste de la cuadrícula: URL/contexts?lat=<lat>&long=<long>'); }
  } catch (e) {
    Auxiliar.logHttp(req, res, 500, 'getPOIZoneLE').end();
  }
}

/**
 * Método para crear un nuevo contexto en el sistema. Los datos base son latitud (lat),
 * longitud (long), titulo (titulo), descripción (descr) y autor (autor). Puede incluir
 * más campos como imágen (imagen) y licencia (licencia) o fuentes de información (fuentes).
 * Las fuentes de información pueden ser varias (vendrán en un jsonarray). Cada elemento del
 * jsonarray (jsonobject) tendrá typo (url o string) y value.
 *
 * @param {Request} req Request
 * @param {Response} res Response
 */
async function nuevoContexto(req, res) {
  try {
    const start = Date.now();
    const token = req.headers['x-tokenid'];
    admin.auth().verifyIdToken(token)
      .then(async decodedToken => {
        if (decodedToken) {
          const { uid, email, email_verified } = decodedToken;
          if (email_verified) {
            const { body } = req;
            // Compruebo que se han enviado los datos básicos
            if (body && body.datos) {
              const emailAutor = email.split('@')[0];
              dameDocumentoRapida({ uid: uid })
                .then(docRapida => {
                  if (docRapida.rol > 0) {//Es profesor
                    const nCtx = body.datos;
                    if (nCtx && nCtx !== null) {
                      nCtx.autor = emailAutor;
                    }
                    if (nCtx && nCtx.lat && nCtx.long && nCtx.titulo && nCtx.descr && nCtx.autor) {
                      // Adapto los datos obligatorios a sus tipos y compruebo que sean válidos
                      const { lat } = nCtx;
                      const { long } = nCtx;
                      const titulo = nCtx.titulo;
                      const descr = nCtx.descr;
                      const autor = nCtx.autor.trim();
                      if (Auxiliar.latitudValida(lat) && Auxiliar.longitudValida(long)
                        && titulo && descr && autor) {
                        // Creo la posible IRI y compruebo que no exista en el repositorio
                        let tituloIRI;
                        titulo.some(t => {
                          tituloIRI = t.value.replace(/ /g, '_');
                          if (t.lang === 'es') {
                            return true;
                          }
                          return false;
                        });
                        const iri = Auxiliar.nuevoIriContexto(tituloIRI, lat, long);
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
                                    datosContexto[t] = (nCtx[t] === 'string') ? nCtx[t].trim() : nCtx[t];
                                    break;
                                }
                              }
                              options = Auxiliar.creaOptionsAuth(
                                Queries.nuevoContexto(datosContexto, true),
                                Configuracion.usuarioSPARQLAuth,
                                Configuracion.contrasenhaSPARQLAuth
                              );
                              // Realizo la inserción en el repositorio
                              const insercion = (responseI) => {
                                chunks = [];
                                responseI.on('data', (chunk) => {
                                  chunks.push(chunk);
                                });
                                responseI.on('end', () => {
                                  resultados = Auxiliar.procesaJSONSparql(['callret-0'], Buffer.concat(chunks).toString());
                                  if (resultados.length > 0) {
                                    winston.info(Mustache.render(
                                      'postPOI || {{{uid}}} || {{{idPOI}}} || {{{body}}} || {{{time}}}',
                                      {
                                        uid: uid,
                                        idPOI: iri,
                                        body: JSON.stringify(body.datos),
                                        time: Date.now() - start
                                      }
                                    ));
                                    res.location(iri);
                                    Auxiliar.logHttp(req, res, 201, 'postPOIL', start).send(JSON.stringify({ ctx: iri }));
                                  } else Auxiliar.logHttp(req, res, 503, 'postPOILE', start).send('El repositorio no es capaz de insertar el nuevo contexto');
                                });
                              };
                              Http.request(options, insercion).end();
                              //Para cuando solucione lo del post
                              //https://nodejs.org/api/http.html#httprequestoptions-callback
                              /*const insercion = Http.request(options, (responseI) => {
                                chunks = [];
                                responseI.on('data', (chunk) => {
                                  console.log(chunk.toString());
                                  chunks.push(chunk);
                                });
                                responseI.on('end', () => {
                                  resultados = Auxiliar.procesaJSONSparql(['callret-0'], Buffer.concat(chunks).toString());
                                  if (resultados.length > 0) {
                                    winston.info(Mustache.render(
                                      'postPOI || {{{uid}}} || {{{idPOI}}} || {{{body}}} || {{{time}}}',
                                      {
                                        uid: uid,
                                        idPOI: iri,
                                        body: JSON.stringify(body.datos),
                                        time: Date.now() - start
                                      }
                                    ));
                                    res.location(iri);
                                    Auxiliar.logHttp(req, res, 201, 'postPOIL', start).send(JSON.stringify({ ctx: iri }));
                                  } else Auxiliar.logHttp(req, res, 503, 'postPOILE', start).send('El repositorio no es capaz de insertar el nuevo contexto');
                                });
                              });
                              insercion.write(Queries.nuevoContexto(datosContexto, false));
                              insercion.end();*/
                            } else { Auxiliar.logHttp(req, res, 409, 'postPOILE', start).send('Se produce un conflicto con el nombre del contexto y la posición puesto que ya existe en el repositorio'); }
                          });
                        };
                        Http.request(options, consulta).end();
                      } else { Auxiliar.logHttp(req, res, 400, 'postPOILE', start).send('La latitud y la longitud deben ser números válidos. Los strings no pueden estar vacíos'); }
                    } else { Auxiliar.logHttp(req, res, 400, 'postPOILE', start).send('Se deben enviar los siguientes campos en el cuerpo de la petición como un JSONObject: "lat", "long", "titulo", "autor", "descr".'); }
                  } else { Auxiliar.logHttp(req, res, 403, 'postPOILE', start).send('El usuario no tiene rol de docente'); }
                })
                .catch(error => {
                  console.error(error);
                  Auxiliar.logHttp(req, res, 500, 'postPOILE', start).send('Error al recuperar la información de la base de datos');
                });
            } else { Auxiliar.logHttp(req, res, 400, 'postPOILE', start).send('Se tienen que enviar los datos del nuevo contexto'); }
          } else { Auxiliar.logHttp(req, res, 403, 'postPOILE', start).send('El email no está verificado'); }
        } else { Auxiliar.logHttp(req, res, 400, 'postPOILE', start).send('Error en la decodificación del token'); }
      })
      .catch(error => {
        console.error(error);
        Auxiliar.logHttp(req, res, 500, 'postPOILE', start).send('Error al decodificar el token');
      });
  } catch (e) {
    Auxiliar.logHttp(req, res, 500, 'postPOILE').end();
  }
}

function nPois(req, res) {
  try {
    const start = Date.now();
    //const min = 0.0254;
    const north = parseFloat(req.query.north);
    const south = parseFloat(req.query.south);
    const east = parseFloat(req.query.east);
    const west = parseFloat(req.query.west);
    if (typeof north === 'number' &&
      typeof south === 'number' &&
      typeof east === 'number' &&
      typeof west === 'number' &&
      north > south && north <= 90 && south >= -90 &&
      east > west && east <= 180 && west >= -180) {
      const query = Auxiliar.creaOptions(Queries.nPois(north, east, south, west));
      fetch(Mustache.render(
        'http://{{{host}}}:{{{port}}}{{{path}}}',
        {
          host: query.host,
          port: query.port,
          path: query.path
        }
      ), {
        headers: query.headers
      }).then(response => {
        switch (response.status) {
          case 200:
            return response.text();
          default:
            return null;
        }
      }).then(response => {
        if (response !== null) {
          let data = Auxiliar.procesaJSONSparql(['pois'], response).pop();
          if (data === null) {
            data = {};
            data.pois = 0;
          }
          data.latC = (north - south) / 2 + south;
          data.longC = (east - west) / 2 + west;
          Auxiliar.logHttp(req, res, 200, 'getNPoisL', start).send(JSON.stringify(data));
        } else {
          Auxiliar.logHttp(req, res, 400, 'getNPoisLE').send('Error en los valores enviados');
        }
      }).catch(error => {
        console.log(error);
        Auxiliar.logHttp(req, res, 500, 'getNPoisLE').send('Error en el procesado de los datos del punto SPARQL');
      });
    } else {
      Auxiliar.logHttp(req, res, 400, 'getNPoisLE').send('Error en los valores enviados');
    }
  } catch (error) {
    console.log(error);
    Auxiliar.logHttp(req, res, 500, 'getNPoisLE').end();
  }
}

/*async function nPois(req, res) {
  try {
    const start = Date.now();
    const min = 0.0254;
    const north = parseFloat(req.query.north);
    const south = parseFloat(req.query.south);
    const east = parseFloat(req.query.east);
    const west = parseFloat(req.query.west);
    if (typeof north === 'number' &&
      typeof south === 'number' &&
      typeof east === 'number' &&
      typeof west === 'number' &&
      north > south && north <= 90 && south >= -90 &&
      east > west && east <= 180 && west >= -180) {
      const difLat = north - south;
      const difLon = Math.abs(east - west);
      let divLat = 4, divLon = divLat;
      while (divLat > 1) {
        if (difLat / divLat < min)
          --divLat;
        else
          break;
      }
      while (divLon > 1) {
        if (difLon / divLon < min)
          --divLon;
        else
          break;
      }
      let promises = [];
      let requests = [];
      let response = [];
      for (let i = 0; i < divLon; i++) {
        let long0 = (i * (difLon / divLon)) + west;
        let long1 = Math.min((((i + 1) * (difLon / divLon)) + west), east);
        for (let j = 0; j < divLat; j++) {
          let lat0 = (j * (difLat / divLat) + south);
          let lat1 = Math.min(((j + 1) * (difLat / divLat) + south), north);
          const query = Auxiliar.creaOptions(Queries.nPois(lat1, long1, lat0, long0));
          requests.push({
            north: lat1,
            east: long1,
            south: lat0,
            west: long0,
            latC: (lat1 - lat0) / 2 + lat0,
            lonC: (long1 - long0) / 2 + long0,
          });
          promises.push(fetch(Mustache.render(
            'http://{{{host}}}:{{{port}}}{{{path}}}',
            {
              host: query.host,
              port: query.port,
              path: query.path
            }
          ), {
            headers: query.headers
          }).then(response => response.text()));
          Promise.all(promises)
            .then(data => {
              let i = 0;
              if (data.length === promises.length) {
                data.forEach(p => {
                  const info = Auxiliar.procesaJSONSparql(['pois'], p).pop();

                  if (typeof parseInt(info.pois) === 'number') {
                    response.push({ nPois: parseInt(info.pois), ...requests[i] });
                  }
                  ++i;
                });
                if (response.length > 0) {
                  Auxiliar.logHttp(req, res, 200, 'getNPoisL', start).send(JSON.stringify(response));
                } else {
                  Auxiliar.logHttp(req, res, 204, 'getNPoisL', start).end();
                }
              }
            })
            .catch(error => {
              console.log(error);
              res.sendStatus(401);
            });
        }
      }
    } else {
      Auxiliar.logHttp(req, res, 400, 'getNPoisLE').send('Error en los valores enviados');
    }
  } catch (e) {
    Auxiliar.logHttp(req, res, 500, 'getNPoisLE').end();
  }
}*/

module.exports = {
  obtenContextos,
  nuevoContexto,
  nPois,
};
