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
 * Gestión de peticiones relacionadas con la colección "tareas".
 * autor: Pablo García Zarza
 * version: 20210615
 */

const Http = require('http');
const Mustache = require('mustache');
const Queries = require('../../util/queries');
const Auxiliar = require('../../util/auxiliar');
const Configuracion = require('../../util/config');
const DB = require('../../util/bd');

/**
 * Método para obtener las tareas incluidas en un contexto.
 *
 * @param {Object} req Request
 * @param {Object} res Response
 */
function dameTareas(req, res) {
  try {
    let { context } = req.query;
    if (context) {
      context = context.trim();
      const options = Auxiliar.creaOptions(Queries.tareasContexto(context));
      const consulta = function (response) {
        const chunks = [];
        response.on('data', (chunk) => {
          chunks.push(chunk);
        });
        response.on('end', () => {
          const resultados = Auxiliar.procesaJSONSparql(
            ['task', 'aT', 'thumb', 'aTR', 'spa', 'title'],
            Buffer.concat(chunks).toString(),
          );
          if (resultados && resultados.length > 0) {
            let salida = [];
            let iris = [];
            resultados.forEach(resultado => {
              if (iris.includes(resultado.task)) {
                let posicion = -1;
                salida.some((s, i) => {
                  if (s.task === resultado.task) {
                    posicion = i;
                    return true;
                  }
                  return false;
                });
                if (posicion > -1) {
                  if (typeof salida[posicion].spa === 'string') {
                    salida[posicion].spa = [{ spa: salida[posicion].spa }, { spa: resultado.spa }];
                  } else {
                    salida[posicion].spa.push({ spa: resultado.spa });
                  }
                }
              } else {
                iris.push(resultado.task);
                resultado.spa = [{ spa: resultado.spa }];
                salida.push(resultado);
              }
            });

            res.json(salida);
          }
          else res.sendStatus(204);
        });
      };
      Http.request(options, consulta).end();
    } else { res.status(400).send('Se tiene que enviar el identificador de un contexto como parámetro: URL/tasks?constest=<IRIcontext>'); }
  } catch (error) {
    res.sendStatus(500);
  }
}

/**
 * Función para crear una nueva tarea en el sistema. Se crea un identificador único en base al
 * contexto y al título que proporcione el usuario.
 *
 * @param {Object} req Request
 * @param {Object} res Response
 */
async function creaTarea(req, res) {
  try {
    let { body } = req;
    if (body && body.token && body.datos) {
      const emailAutor = await DB.dameCorreoSiProfe(body.token);
      if (emailAutor !== null) {
        body = body.datos;
        if (body !== null) {
          body.autor = emailAutor;
        }
        // Obligatorios: contexto, titulo, descripción textual de la tarea, tipo respuesta, autor, espacio
        // Dependiendo del espacio y el tipo de tarea se pueden tener valores adicionales como respuesta correcta
        // y opciones falsas
        if (body && body.hasContext && body.title && body.aTR && body.aT && body.autor && body.espacios) {
          const hasContext = body.hasContext.trim();
          const titulo = body.title;
          const aTR = body.aTR.trim();
          const aT = body.aT.trim();
          const autor = body.autor.trim();
          const { espacios } = body;
          if (!Auxiliar.isEmpty(hasContext) && !Auxiliar.isEmpty(titulo)
            && !Auxiliar.isEmpty(aTR) && !Auxiliar.isEmpty(aT)
            && !Auxiliar.isEmpty(autor) && !Auxiliar.isEmpty(espacios)) {
            if (Auxiliar.tipoRespuetasSoportados.includes(aT) && Auxiliar.compruebaEspacios(espacios)) {
              // Antes de continuar compruebo si existe el contexto y obtengo su nombre para crear el IRI
              let options = Auxiliar.creaOptions(Queries.tituloContexto(hasContext));
              let consulta = function (resp) {
                let datos = [];
                resp.on('data', (dato) => {
                  datos.push(dato);
                });
                resp.on('end', () => {
                  let resultados = Auxiliar.procesaJSONSparql(['titulo'], Buffer.concat(datos).toString());
                  if (resultados) {
                    resultados = resultados.pop();
                    if (resultados && resultados.titulo) {
                      // Creo el IRI para la nueva tarea
                      let tituloIRI;
                      if (titulo.length > 0) {
                        titulo.some(t => {
                          tituloIRI = t.value;
                          if (t.lang === 'es') {
                            return true;
                          }
                          return false;
                        });
                      } else {
                        if (typeof titulo === 'string') {
                          tituloIRI = titulo;
                        } else {
                          tituloIRI = titulo.value;
                        }
                      }
                      const iri = Auxiliar.nuevoIriTarea(resultados.titulo, tituloIRI);
                      // Compruebo que el iri no exista ya:
                      options = Auxiliar.creaOptions(Queries.tipoIRI(iri));
                      consulta = function (resp1) {
                        datos = [];
                        resp1.on('data', (dato) => {
                          datos.push(dato);
                        });
                        resp1.on('end', () => {
                          resultados = Auxiliar.procesaJSONSparql(['tipo'], Buffer.concat(datos).toString());
                          if (resultados.length == 0) {
                            // La tarea se puede crear ya el identificador no está en uso
                            const datosTarea = {
                              iri,
                            };
                            for (const t in body) {
                              if (typeof body[t] === 'string') {
                                datosTarea[t] = body[t].trim();
                              } else {
                                datosTarea[t] = body[t];
                              }
                            }
                            options = Auxiliar.creaOptionsAuth(
                              Queries.nuevaTarea(datosTarea),
                              Configuracion.usuarioSPARQLAuth,
                              Configuracion.contrasenhaSPARQLAuth
                            );
                            consulta = function (respIns) {
                              datos = [];
                              respIns.on('data', (dato) => {
                                datos.push(dato);
                              });
                              respIns.on('end', () => {
                                resultados = Auxiliar.procesaJSONSparql(['callret-0'], Buffer.concat(datos).toString());
                                if (resultados.length > 0) {
                                  res.location(iri);
                                  res.status(201).send(JSON.stringify({ iri: iri }));
                                } else {
                                  res.status(503).send('El repositorio no ha podido almacenar la nueva tarea');
                                }
                              });
                            };
                            Http.request(options, consulta).end();
                          } else {
                            res.status(409).send('El identificador de la tarea ya se está utilizando en el repositorio');
                          }
                        });
                      };
                      Http.request(options, consulta).end();
                    } else {
                      res.status(400).send('El contexto al que se intenta asociar la tarea no existe o no dispone de título');
                    }
                  } else {
                    res.status(400).send('El contexto al que se intenta asociar la tarea no existe');
                  }
                });
              };
              Http.request(options, consulta).end();
            } else {
              res.status(400).send(Mustache.render(
                'El tipo de respuesta y espacio tienen que ser soportados por el sistema.\nTipos respuesta: {{{aT}}}\nEspacios: {{{spa}}}',
                {
                  aT: Auxiliar.tipoRespuetasSoportados.toString(),
                  spa: Auxiliar.espaciosSoportados.toString(),
                }
              ));
            }
          } else {
            res.status(400).send('La petición tiene que tener los siguientes campos en el cuerpo de la petición: hasConstext, titulo, aTR, , tR, autor, espacio. No pueden estar vacíos.');
          }
        } else {
          res.status(400).send('La petición tiene que tener los siguientes campos en el cuerpo de la petición: hasConstext, titulo, aTR, , tR, autor');
        }
      } else {
        res.status(403).send('El usuario tiene rol de docente');
      }
    } else {
      res.status(400).send('Se tiene que enviar el token de sesión junto con los datos de la tarea');
    }
  } catch (e) {
    res.status(500).send('Se ha capturado una excepción en la creación de la tarea en el servidor');
  }
}

module.exports = { dameTareas, creaTarea };
