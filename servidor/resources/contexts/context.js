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
 * version: 20210615
 */

const Http = require('http');
const Mustache = require('mustache');
const admin = require('firebase-admin');

const Queries = require('../../util/queries');
const Auxiliar = require('../../util/auxiliar');
const Configuracion = require('../../util/config');
const { dameDocumentoRapida } = require('../../util/bd');

/**
 * Método para controlar las consultas que hagan los usuarios para obtener la información de
 * un contexto. El identificador del contexto deberá indicarse en el cuerpo de este para evitar
 * problemas con las divisiones de los recursos.
 *
 * @param {Request} req Petición del cliente
 * @param {Response} res Respuesta del servidor
 */

function creaIri(a, b, c) {
  if (a && b && c) {
    return Mustache.render(
      'https://casuallearn.gsic.uva.es/context/{{{a}}}/{{{b}}}/{{{c}}}',
      {
        a: a,
        b: b,
        c: c
      });
  }
  return null;
}

/**
 * Función para obtener toda la información disponible de un POI
 *
 * @param {Request} req Petición del cliente
 * @param {Response} res Respuesta del servidor
 */
function dameContexto(req, res) {
  try {
    const iri = creaIri(req.params.a, req.params.b, req.params.c);
    if (iri) {
      if (typeof iri === 'string') {
        const options = Auxiliar.creaOptions(Queries.todaInfo(iri));
        const consulta = (response) => {
          const chunks = [];
          response.on('data', (chunk) => {
            chunks.push(chunk);
          });
          response.on('end', () => {
            let resultados = Auxiliar.procesaJSONSparql(['propiedad', 'valor'], Buffer.concat(chunks).toString());
            if (resultados.length > 0) {
              resultados = resultados.pop();
              resultados.ctx = iri;
              res.json(resultados);
            } else { res.status(404).send('El contexto no existe en el repositorio'); }
          });
        };
        Http.request(options, consulta).end();
      } else {
        res.status(400).send('La IRI se tiene que proporcionar como un string');
      }
    } else {
      res.status(400).send('El cuerpo del mensaje debe tener un JSONObject del tipo {"iri":"idContexto"}');
    }
  } catch (e) {
    res.sendStatus(500);
  }
}

/**
 * Método para controlar las peticiones de borrado de un contexto que realicen los usuarios.
 *
 * @param {Request} req Petición del cliente
 * @param {Response} res Respuesta del servidor
 */
async function eliminaContexto(req, res) {
  try {
    const token = req.headers['x-tokenid'];
    admin.auth().verifyIdToken(token)
      .then(async decodedToken => {
        if (decodedToken) {
          const { uid, email_verified, email } = decodedToken;
          if (email_verified) {
            dameDocumentoRapida({ uid: uid })
              .then(docRapida => {
                if (docRapida.rol > 0) {//Es profesor
                  const iri = creaIri(req.params.a, req.params.b, req.params.c);
                  if (typeof iri === 'string') {
                    let options = Auxiliar.creaOptions(Queries.todaInfo(iri));
                    const consulta = (response) => {
                      let chunks = [];
                      response.on('data', (chunk) => {
                        chunks.push(chunk);
                      });
                      response.on('end', () => {
                        let resultados = Auxiliar.procesaJSONSparql(['propiedad', 'valor'], Buffer.concat(chunks).toString());
                        if (resultados.length > 0) {
                          resultados = resultados.pop();
                          resultados.iri = iri;
                          // Ya tenemos toda la información a eliminar
                          if (resultados.autor === email) {
                            options = Auxiliar.creaOptionsAuth(
                              Queries.eliminaContexto(resultados),
                              Configuracion.usuarioSPARQLAuth,
                              Configuracion.contrasenhaSPARQLAuth
                            );
                            // Realizo la eliminación
                            const borrado = (responseB) => {
                              chunks = [];
                              responseB.on('data', (chunk) => {
                                chunks.push(chunk);
                              });
                              responseB.on('end', () => {
                                resultados = Auxiliar.procesaJSONSparql(['callret-0'], Buffer.concat(chunks).toString());
                                if (resultados.length > 0) {
                                  res.sendStatus(200);
                                } else res.status(503).send('El repositorio no puede eliminar el contexto');
                              });
                            };
                            Http.request(options, borrado).end();
                          } else {
                            res.status(403).send('No puedes eliminar un POI si no eres el creador');
                          }
                        } else { res.status(404).send('La IRI no existe en el repositorio o no es un contexto'); }
                      });
                    };
                    Http.request(options, consulta).end();
                  } else { res.status(400).send('El cuerpo del mensaje debe tener un JSONObject del tipo {"iri":"idContexto"}.'); }
                } else { res.status(403).send('El usuario no tiene rol de docente'); }
              })
              .catch(error => {
                console.error(error);
                res.status(500).send('Error al recuperar el rol del docente');
              });
          } else { res.status(400).send('El correo del usuario no se ha verificado'); }
        } else { res.status(400).send('No se ha podido decodificar el token'); }
      })
      .catch(error => {
        console.error(error);
        res.sendStatus(500);
      });
  } catch (e) {
    res.sendStatus(500);
  }
}

/**
 * Función para modificar un contexto que exista en el cliente.
 *
 * @param {Object} req Request
 * @param {Object} res Response
 */
async function actualizaContexto(req, res) {
  try {
    const token = req.headers['x-tokenid'];
    admin.auth().verifyIdToken(token)
      .then(async decodedToken => {
        if (decodedToken) {
          const { uid, email_verified, email } = decodedToken;
          if (email_verified) {
            dameDocumentoRapida({ uid: uid })
              .then(docRapida => {
                if (docRapida.rol > 0) {//Es profesor
                  const { body } = req;
                  if (body && body.actual && body.actual.iri && body.modificados) {
                    const iri = creaIri(req.params.a, req.params.b, req.params.c);
                    // Recupero toda la info. del servidor para comprobar que es la misma del usuario
                    let options = Auxiliar.creaOptions(Queries.todaInfo(iri));
                    const consulta = (response) => {
                      let chunks = [];
                      response.on('data', (chunk) => {
                        chunks.push(chunk);
                      });
                      response.on('end', () => {
                        let resultados = Auxiliar.procesaJSONSparql(['propiedad', 'valor'], Buffer.concat(chunks).toString());
                        if (resultados && resultados.length > 0) {
                          resultados = resultados.pop();
                          resultados.iri = iri;
                          const { actual } = body;
                          if (resultados.autor === email) {
                            // Ahora compruebo que son iguales
                            let iguales = true;
                            if (Object.keys(actual).length == Object.keys(resultados).length) {
                              for (const enviado in actual) {
                                if (!resultados[enviado] || resultados[enviado] != actual[enviado]) {
                                  res.status(400).send('Los datos actuales no coinciden con los del repositorio');
                                  iguales = false;
                                  break;
                                }
                              }
                            } else {
                              res.status(400).send('Los datos actuales no coinciden con los del repositorio');
                              iguales = false;
                            }
                            if (iguales) {
                              /* Si llego aquí es que la información actual del usuario era correcta. Ahora tengo
                               * que comprobar si se necesitan realizar actualizaciones, inserciones, eliminaciones
                               * o todas ellas */
                              const { modificados } = body;
                              // Compruebo que keys están presentes en modificados y actuales. Sera actualizaciones
                              // o eliminaciones. El resto serán inserciones
                              const inserciones = {};
                              const eliminaciones = {};
                              const actualizaciones = {};

                              for (const mod in modificados) {
                                if (!actual[mod]) {
                                  inserciones[mod] = modificados[mod];
                                } else if (modificados[mod].trim() == '') {
                                  //eliminaciones[mod] = resultados[(Auxiliar.equivalencias[mod]).prop];
                                  eliminaciones[mod] = resultados[mod];
                                } else {
                                  actualizaciones[mod] = {
                                    anterior: actual[mod],
                                    nuevo: modificados[mod],
                                  };
                                }
                              }

                              // Realizo la petición al punto sparql
                              options = Auxiliar.creaOptionsAuth(
                                Queries.actualizaValoresContexto(
                                  iri, inserciones, eliminaciones, actualizaciones,
                                ),
                                Configuracion.usuarioSPARQLAuth,
                                Configuracion.contrasenhaSPARQLAuth
                              );
                              const borrado = (responseB) => {
                                chunks = [];
                                responseB.on('data', (chunk) => {
                                  chunks.push(chunk);
                                });
                                responseB.on('end', () => {
                                  resultados = Auxiliar.procesaJSONSparql(['callret-0'], Buffer.concat(chunks).toString());
                                  if (resultados.length > 0) {
                                    res.sendStatus(200);
                                  } else res.status(503).send('El repositorio no puede eliminar el contexto');
                                });
                              };
                              Http.request(options, borrado).end();
                            }
                          } else {
                            res.status(403).send('El POI pertenece a otro usuario. No se puede modificar.');
                          }
                        } else {
                          res.status(404).send('El contexto no existe en el repositorio');
                        }
                      });
                    };
                    Http.request(options, consulta).end();

                  } else {
                    res.status(400).send('Se tiene que enviar un JSON en el cuerpo que contenta la etiqueta actual y modificados. También se tiene que indicar el token de sesión.');
                  }
                }
              })
              .catch(error => {
                res.status(500).send('Error al recuperar el rol del usuario');
              });
          } else { res.status(403).send('El usuario no tiene rol de docente'); }
        } else { res.status(500).send('Problemas con el token enviado'); }
      })
      .catch(error => {
        res.status(500).send('Problemas con la decodificación del token.');
      });
  } catch (e) {
    res.sendStatus(500);
  }
}

module.exports = {
  dameContexto,
  eliminaContexto,
  actualizaContexto
};
