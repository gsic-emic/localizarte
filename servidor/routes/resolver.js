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
 * version: 20210422
 */

var express = require('express');
var Ruter = express.Router();

const contexts = require('../resources/contexts/contexts');
const context = require('../resources/contexts/context');

//Paths
const recursos = {
    contextos: '/contexts/',
    contexto: '/contexts/:context',
    tareas: '/tasks/',
    tarea: '/tasks/:task',
    rutas: '/rutes/',
    ruta: '/rutes/:rute',
    respuestas: '/answers/',
    respuesta: '/answers/:answer',
    users: '/users/',
    user: '/users/:user'
};

//Se envía el código de estado para una operación no implementada
const envia405 = (req, res) => res.status(405).send('Operación no implementada para el recurso o la colección');

//Contextos
Ruter.route(recursos.contextos)
    .get((req,res) => contexts.obtenContextos(req, res))
    .post((req,res) => contexts.nuevoContexto(req, res))
    .all(envia405);

//Contexto
Ruter.route(recursos.contexto)
    .get((req, res) => context.dameContexto(req, res))
    .put((req, res) => context.actualizaContexto(req, res))
    .delete((req, res) => context.eliminaContexto(req, res))
    .all(envia405);

module.exports = Ruter;