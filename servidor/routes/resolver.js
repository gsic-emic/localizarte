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
 * Creación de las rutas del servidor.
 * autor: Pablo
 * version: 20210613
 */

const express = require('express');

const Ruter = express.Router();

const winston = require('../util/winston');
const Contexts = require('../resources/contexts/contexts');
const Context = require('../resources/contexts/context');
const Tasks = require('../resources/tasks/tasks');
const Task = require('../resources/tasks/task');
const Answers = require('../resources/answers/answers');

const Users = require('../resources/users/users');
const User = require('../resources/users/user');
//const Sesiones = require('../resources/users/sesiones');
//const Sesion = require('../resources/users/sesion');


// Paths
const recursos = {
  contextos: '/contexts/',
  /* contexto: '/contexts/:context', */
  contexto: '/contexts/:a/:b/:c',
  tareas: '/tasks/',
  tarea: '/tasks/:a/:b',
  rutas: '/rutes/',
  ruta: '/rutes/:rute',
  users: '/users/',
  user: '/users/user',
  respuestas: '/users/user/answers/',
  respuesta: '/users/user/answers/:answer',
};

// Se envía el código de estado para una operación no implementada
const envia405 = (req, res) => {
  winston.http(`405 || Método no implementado - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  res.status(405).send('Operación no implementada para el recurso o la colección')
};

// Contextos
Ruter.route(recursos.contextos)
  .get((req, res) => Contexts.obtenContextos(req, res))
  .post((req, res) => Contexts.nuevoContexto(req, res))
  .all(envia405);

// Contexto
Ruter.route(recursos.contexto)
  .get((req, res) => Context.dameContexto(req, res))
  .put((req, res) => Context.actualizaContexto(req, res))
  .delete((req, res) => Context.eliminaContexto(req, res))
  .all(envia405);

// Tareas
Ruter.route(recursos.tareas)
  .get((req, res) => Tasks.dameTareas(req, res))
  .post((req, res) => Tasks.creaTarea(req, res))
  .all(envia405);

// Tarea
Ruter.route(recursos.tarea)
  .get((req, res) => Task.dameTarea(req, res))
  .put((req, res) => Task.actualizaTarea(req, res))
  .delete((req, res) => Task.eliminaTarea(req, res))
  .all(envia405);

// Creación y obtención de usuarios
Ruter.route(recursos.users)
  //.get((req, res) => Users.dameUsuarios(req, res))
  //.post((req, res) => Users.newUser(req, res))
  .all(envia405);

Ruter.route(recursos.user)
  .put((req, res) => User.putUser(req, res))
  .get((req, res) => User.getInfoUser(req, res))
  .all(envia405);

// Gestión de sesiones
/*Ruter.route(recursos.sesiones)
  .post((req, res) => Sesiones.login(req, res))
  .all(envia405);

Ruter.route(recursos.sesion)
  .delete((req, res) => Sesion.logout(req, res))
  .all(envia405);*/

// Respuestas
//TODO tengo que cambiar el token por la cabecera x-idtoken
Ruter.route(recursos.respuestas)
  //.post((req, res) => Answers.nuevaRespuesta(req, res))
  //.get((req, res) => Answers.dameRespuestas(req, res))
  .all(envia405);

module.exports = Ruter;
