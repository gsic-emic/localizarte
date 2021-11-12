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
 * Creación y obtención de respuestas
 * autor: Pablo García Zarza
 * version: 20210613
 */

const { v4: uuidv4 } = require('uuid');

const DB = require('../../../util/bd');
const Auxiliar = require('../../../util/auxiliar');
const Configuracion = require('../../../util/config');

/**
 * Función para la creación de una respuesta en la colección de un usuario. No permite la creación si el usuario había respondido a la tarea previamente.
 * 
 * @param {Object} req Petición
 * @param {Object} res Respuesta
 */
async function nuevaRespuesta(req, res) {
  const { body } = req;
  if (body && body !== null && body.token && body.respuesta) {
    const { token, respuesta } = body;
    if (token && token !== null && token.trim() !== '') {
      const { task, poi, poiTitulo, poiLat, poiLong, endTime, timeAns, aT } = respuesta; //datos obligatorios
      if (task !== null && typeof task === 'string' && poi !== null && typeof poi === 'string' && poiTitulo !== null && typeof poiTitulo === 'string' && poiLat !== null && typeof poiLat === 'number' && poiLong !== null && typeof poiLong === 'number' && endTime !== null && typeof endTime === 'number' && timeAns !== null && typeof timeAns === 'number' && aT !== null && typeof aT === 'string') {
        let continua = true;
        let photoAns, textAns, choAns;
        switch (aT) {
          case 'photo':
            photoAns = respuesta.photoAns;
            if (!photoAns || photoAns === null || photoAns === '') {
              continua = false;
            }
            break;
          case 'photoAndText':
            photoAns = respuesta.photoAns;
            if (!photoAns || photoAns === null || photoAns === '') {
              continua = false;
            }
            textAns = respuesta.textAns;
            if (!textAns || textAns === null || textAns.trim() === '') {
              continua = false;
            }
            break;
          case 'shortText':
          case 'text':
            textAns = respuesta.textAns;
            if (!textAns || textAns === null || textAns.trim() === '') {
              continua = false;
            }
            break;
          case 'mcq':
          case 'trueFalse':
            choAns = respuesta.choAns;
            if (!choAns || choAns === null || choAns.trim() === '') {
              continua = false;
            }
            break;
          default:
            break;
        }
        if (continua) {
          const nombreColecc = await DB.dameColeccionToken(token);
          if (nombreColecc !== null) {
            //Ya tengo el identificador de la colección del usuario
            //Compruebo que no se haya realizado la tarea previamente
            const deberiaSerNull = await DB.dameTareaDeColeccion(task, nombreColecc);
            if(deberiaSerNull === null){
              //Guardo la respuesta en la BDD
              respuesta.uid = uuidv4();
              respuesta.idTarea = task;
              delete respuesta.task;
              const enBD = await DB.guardaDocumentoEnColeccion(respuesta, nombreColecc);
              if(enBD.insertedCount === 1){
                res.status(201).send({answerId: respuesta.uid});
              } else {
                res.status(500).send('No se ha podido almacenar en la BDD');
              }
            }else{
              res.status(400).send("El usuario ya había respondido a esta pregunta previamente");
            }
          } else {
            res.sendStatus(403);
          }
        } else {
          res.status(400).send('Dependiendo del tipo de respuesta esperado se necesitan enviar parámetros adicionales.');
        }
      } else {
        res.status(400).send('La respuesta tiene que tener obligatoriamente task, poi, poititulo, poiLat, poiLong, endTime, timeAns, aT');
      }
    } else {
      res.status(400).send('El token no puede ser null o vacío');
    }
  } else {
    res.status(400).send('En el JSON se tiene que indicar el token de sesión y la respuesta como un JSON');
  }
}

function dameRespuestas(req, res) {
  res.sendStatus(418);
}

module.exports = {
  nuevaRespuesta,
  dameRespuestas,
}