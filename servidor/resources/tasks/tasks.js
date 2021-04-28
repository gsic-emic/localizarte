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
 * version: 20210428
 */

const Queries = require('../../util/queries');
const Auxiliar = require('../../util/auxiliar');
const Http = require('http');

function dameTareas(req, res) {
  try {
    var contexto = req.query.context;
    if(contexto){
      contexto = contexto.trim();
      const options = Auxiliar.creaOptions(Queries.tareasContexto(contexto));
      consulta = function (response) {
        var chunks = [];
        response.on('data', function (chunk) {
          chunks.push(chunk);
        });
        response.on('end', function () {
          var resultados = Auxiliar.procesaJSONSparql(
            ['task', 'aT', 'thumb', 'aTR'],
            Buffer.concat(chunks).toString());
          if (resultados && resultados.length > 0) res.json(resultados);
          else res.sendStatus(204);
        });
      };
      Http.request(options, consulta).end();
    }
  } catch (error) {
    console.error(error);
  }
}

module.exports = {dameTareas}