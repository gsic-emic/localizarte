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
 * version: 20211019
 */

const Http = require('http');
const Mustache = require('mustache');
const admin = require('firebase-admin');

const Auxiliar = require('../../util/auxiliar');
const Queries = require('../../util/queries');
const Configuracion = require('../../util/config');
const { dameDocumentoRapida } = require('../../util/bd');

function creaIri(a, b) {
  if (a && b) {
    return Mustache.render('https://casuallearn.gsic.uva.es/{{{a}}}/{{{b}}}',
      {
        a: a,
        b: b
      }
    );
  }
}

/**
 * Función para obtener toda la información de una tarea
 *
 * @param {Object} req Request
 * @param {Object} res Response
 */
function dameTarea(req, res) {
  try {
    const iri = creaIri(req.params.a, req.params.b);
    if (iri) {
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
      res.sendStatus(400, 'El cliente no ha enviado una IRI válida');
    }
  } catch (e) {
    res.sendStatus(500, 'Excepción capturada en el servidor');
  }
}

/**
 * Función para actualizar los datos de una tarea del repositorio. También puede utilizarse
 * para agregar nuevos datos o eliminar alguno de los existentes.
 *
 * @param {Object} req Request
 * @param {Object} res Response
 */
async function actualizaTarea(req, res) {
  try {
    admin.auth().verifyIdToken(req.headers['x-tokenid'])
      .then(async decodedToken => {
        const { body } = req;
        if (body && body.actual && body.actual.iri && body.modificados) {
          const { uid, email_verified, email } = decodedToken;
          if (email_verified) {
            dameDocumentoRapida({ uid: uid })
              .then(docRapida => {
                if (docRapida.rol > 0) {
                  const iri = creaIri(req.params.a, req.params.b);
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
                        if (result.autor === email) {
                          let iguales = true;
                          if (Object.keys(actual).length === Object.keys(result).length) {
                            for (const enviado in actual) {
                              if (!result[enviado] || result[enviado] != actual[enviado]) {
                                iguales = false;
                                break;
                              }
                            }
                          } else {
                            res.status(400).send('Los datos actuales no coinciden con los del repositorio');
                            iguales = false
                          }
                          if (iguales) {
                            const { modificados } = body;
                            const inserciones = {};
                            const eliminaciones = {};
                            const actualizaciones = {};

                            for (const mod in modificados) {
                              if (!actual[mod]) {
                                inserciones[mod] = modificados[mod];
                              } else if (Auxiliar.isEmpty(modificados[mod].trim())) {
                                eliminaciones[mod] = result[mod];
                              } else {
                                if (actual[mod] !== modificados[mod]) {
                                  actualizaciones[mod] = {
                                    anterior: actual[mod],
                                    nuevo: modificados[mod],
                                  };
                                }
                              }
                            }
                            options = Auxiliar.creaOptionsAuth(
                              Queries.actualizaValoresTareas(
                                iri, inserciones, eliminaciones, actualizaciones,
                              ),
                              Configuracion.usuarioSPARQLAuth,
                              Configuracion.contrasenhaSPARQLAuth
                            );
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
                          res.status(403).send('La tarea pertenece a otro usuario. No se puede modificar.');
                        }
                      } else {
                        res.status(404).send('La tarea no se encuentra en el repositorio de triplas.');
                      }
                    });
                  };
                  Http.request(options, consulta).end();
                } else {
                  res.status(403).send('El usuario no tiene rol de docente');
                }
              })
              .catch(error => {
                console.error(error);
                res.status(500).send('Error al recuperar el rol del usuario');
              });
          } else { res.status(400).send('El email no está verificado.'); }
        } else { res.status(400).send('Se debe enviar un JSON en el cuerpo con los valores actuales y los que se desea modificar'); }
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('Problemas con la decodificación del token.');
      });

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
async function eliminaTarea(req, res) {
  try {
    const iri = creaIri(req.params.a, req.params.b);
    if (iri) {
      admin.auth().verifyIdToken(req.headers['x-tokenid'])
        .then(async decodeToken => {
          if (decodeToken) {
            const { uid, email_verified, email } = decodeToken;
            if (email_verified) {
              dameDocumentoRapida({ uid: uid })
                .then(docRapida => {
                  if (docRapida.rol > 0) {
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
                          if (resultados.autor === email) {
                            options = Auxiliar.creaOptionsAuth(
                              Queries.eliminaTarea(iri),
                              Configuracion.usuarioSPARQLAuth,
                              Configuracion.contrasenhaSPARQLAuth
                            );
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
                            res.status(403).send('La tarea pertenece a otro usuario. No se puede eliminar.');
                          }
                        } else {
                          res.status(404).send('La tarea no existe en el repositorio de triplas');
                        }
                      });
                    };
                    Http.request(options, consulta).end();
                  } else { res.status(403).send('El usuario no tiene rol de docente'); }
                })
                .catch(error => {
                  console.error(error);
                  res.status(500).send('Error al recuperar el rol del usuario');
                });
            }
          } else { res.status(400).send('No se ha podido decodificar el token.'); }
        })
        .catch(error => {
          console.error(error);
          res.sendStatus(500);
        });
    } else { res.status(400).send('En el cuerpo de la petición tiene que existir un JSON con el parámetro iri.'); }
  } catch (e) {
    res.sendStatus(500);
  }
}

module.exports = {
  dameTarea,
  actualizaTarea,
  eliminaTarea,
};
