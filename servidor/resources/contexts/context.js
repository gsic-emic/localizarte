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
 * version: 20210422
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
    var iri = req.body;
    if(iri && iri.iri){
        iri = iri.iri;
        if(iri.length > 1)
            iri = iri[0];
            var options = Auxiliar.creaOptions(Queries.infoContexto(iri));
            consulta = function(response){
                var chunks = [];
                response.on('data', function(chunk){
                    chunks.push(chunk);
                });
                response.on('end', function (){
                    var resultados = Auxiliar.procesaJSONSparql(
                        ['lat','long','titulo','descr','autor'],
                        Buffer.concat(chunks).toString());
                    if(resultados.length > 0) {
                        resultados = resultados.pop();
                        resultados['ctx'] = iri;
                        res.json(resultados);
                    }
                    else res.sendStatus(204);
                });
            };
            Http.request(options, consulta).end();
    }else{
        res.status(400).send('El cuerpo del mensaje debe tener un JSONObject del tipo {"iri":"idContexto"}');
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
    var iri = req.body;
    if(iri && iri.iri){
        iri = iri.iri;
        if(typeof iri === 'string'){
            var options = Auxiliar.creaOptions(Queries.infoContexto(iri));
            consulta = function(response){
                var chunks = [];
                response.on('data', function(chunk){
                    chunks.push(chunk);
                });
                response.on('end', function (){
                    var resultados = Auxiliar.procesaJSONSparql(
                        ['lat','long','titulo','descr','autor','tipo'],
                        Buffer.concat(chunks).toString());
                    if(resultados.length > 0) {
                        resultados = resultados.pop();
                        resultados['iri'] = iri;
                        //Ya tenemos toda la información a eliminar
                        options = Auxiliar.creaOptionsAuth(Queries.eliminaContexto(resultados),'pablo','pablo');
                        //Realizo la eliminación
                        borrado = function(response){
                            var chunks = [];
                            response.on('data', function(chunk){
                            chunks.push(chunk);
                            });
                            response.on('end', function (){
                            var resultados = Auxiliar.procesaJSONSparql(['callret-0'], Buffer.concat(chunks).toString());
                            if(resultados.length > 0) {
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
    }else
        res.status(400).send('El cuerpo del mensaje debe tener un JSONObject del tipo {"iri":"idContexto"}');
}

function actualizaContexto(req, res) {
    res.sendStatus(501);
}

module.exports = {dameContexto, eliminaContexto, actualizaContexto}