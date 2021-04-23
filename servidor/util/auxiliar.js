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
 * Funciones auxiliares.
 * autor: Pablo García Zarza
 * version: 20210422
 */

/**
 * Función para crear los datos necesarios para realizar una consulta
 * 
 * @param {String} query Consulta que se desea realizar
 * @param {String} user Usuario
 * @param {String} pass Contraseña
 * @returns 
 */
function creaOptionsAuth(query,user,pass) {
    return {
        host: '127.0.0.1',
        path: '/sparql-auth?default-graph-uri=&query=' + query,
        port: 8890,
        headers: {'Accept':'application/sparql-results+json','Authorization':'Basic ' + Buffer.from(user+':'+pass).toString('base64')}
      };
}

/**
 * Función para crear el set de datos con el que se realiza un consulta al punto SPARQL
 * 
 * @param {String} query Consulta que se desea realizar
 * @returns Conjunto de datos con los que crear una consulta
 */
function creaOptions(query) {
    return {
        host: '127.0.0.1',
        path: '/sparql?default-graph-uri=&query=' + query,
        port: 8890,
        headers: {'Accept':'application/sparql-results+json'}
      };
}

/**
 * Función para procesar un JSONObject que provenga de un punto SPARQL. Comprueba 
 * que se han obtenido todas las variables solicitadas por el usuario. Devuelve 
 * un JSONArray con los resultados correctamente formateados o null si ha 
 * ocurrido algún problema.
 * 
 * @param {Object} nombreVariables Array de identificadores de la consulta
 * @param {JSONObject} resultados Respuesta obtenida del servidor
 * @returns Datos que se han obtenido del servidor correctamente formateados
 */
function procesaJSONSparql(nombreVariables, resultados) {
    resultados = JSON.parse(resultados);
    var variables = resultados.head.vars;
    var continuaProcesado = true;
    for(let valor of nombreVariables.values()){
        if(!variables.includes(valor)){
            continuaProcesado = false;
            break;
        }
    }
    if(continuaProcesado){
        var datos = resultados.results.bindings;
        var salida = [];
        var intermedio;
        for(let dato of datos.values()){
            intermedio = {};
            for(let variable of nombreVariables){
                intermedio[variable] = dato[variable].value;
            }
            salida.push(intermedio);
        }
        return salida;
    }else{
        return null;
    }
}

/**
 * Función para comprobar si la latitud es un valor válido
 * 
 * @param {Number} lat Latitud
 * @returns Verdadero si el valor es válido
 */
function latitudValida(lat) {
    return typeof lat === 'number' && lat > -90 && lat <= 90;
}

/**
 * Función para comprobar si la longitud es un valor válido
 * 
 * @param {Number} long Longitud
 * @returns Verdadero si el valor es válido
 */
function longitudValida(long) {
    return typeof long === 'number' && long >= -180 && long < 180;
}

/**
 * Función para transformar un número en un String con el formato 
 * utilizado en el repositorio de triplas de CL
 * 
 * @param {Float} numero Número que se va a transformar
 * @returns Número transformado
 */
function numeroStringIRI(numero) {
    return numero.toString().replace('.','').replace('-','');
}


module.exports = {creaOptions,creaOptionsAuth,procesaJSONSparql,longitudValida,latitudValida,numeroStringIRI}