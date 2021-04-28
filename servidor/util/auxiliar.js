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
 * version: 20210428
 */

/**
 * Objeto con las palabras claves usadas en el cliente para referirse a 
 * propiedades del repositorio de triplas. También tiene el tipo del valor
 * de la propiedad
 */
const equivalencias = {
  'tipo': {
    'prop': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    'tipo': 'uri'
  },
  'lat': {
    'prop': 'http://www.w3.org/2003/01/geo/wgs84_pos#lat',
    'tipo': 'decimal'
  },
  'long': {
    'prop': 'http://www.w3.org/2003/01/geo/wgs84_pos#long',
    'tipo': 'decimal'
  },
  'titulo': {
    'prop': 'http://www.w3.org/2000/01/rdf-schema#label',
    'tipo': 'string'
  },
  'descr': {
    'prop': 'http://www.w3.org/2000/01/rdf-schema#comment',
    'tipo': 'string'
  },
  'autor': {
    'prop': 'http://purl.org/dc/elements/1.1/creator',
    'tipo': 'string'
  },
  'hasContext': {
    'prop': 'https://casuallearn.gsic.uva.es/property/hasContext',
    'tipo': 'uri'
  },
  'imagen': {
    'prop': 'https://casuallearn.gsic.uva.es/property/image',
    'tipo': 'uri'
  },
  'thumb': {
    'prop': 'http://es.dbpedia.org/ontology/thumbnail',
    'tipo': 'uri'
  },
  'aTR': {
    'prop': 'https://casuallearn.gsic.uva.es/property/associatedTextResource',
    'tipo': 'string'
  },
  'aT': {
    'prop': 'https://casuallearn.gsic.uva.es/property/answerType',
    'tipo': 'uri'
  },
  'cP': {
    'prop': 'https://casuallearn.gsic.uva.es/property/cognitiveProcess',
    'tipo': 'uri'
  },
  'kD': {
    'prop': 'https://casuallearn.gsic.uva.es/property/knowledgeDimension',
    'tipo': 'uri'
  },
  'topic': {
    'prop': 'http://purl.org/dc/elements/1.1/subject',
    'tipo': 'string'
  },
  'iri': {
    'prop': 'iri',
    'tipo': 'uri'
  },
  'ctx': {
    'prop': 'https://casuallearn.gsic.uva.es/ontology/physicalSpace',
    'tipo': 'uri'
  },
  'license': {
    'prop': 'http://purl.org/dc/terms/license',
    'tipo': 'uri'
  },
  'task':{
    'prop': 'https://casuallearn.gsic.uva.es/ontology/task',
    'tipo': 'uri'
  }
}

/**
 * Función para crear los datos necesarios para realizar una consulta
 * 
 * @param {String} query Consulta que se desea realizar
 * @param {String} user Usuario
 * @param {String} pass Contraseña
 * @returns 
 */
function creaOptionsAuth(query, user, pass) {
  return {
    host: '127.0.0.1',
    path: '/sparql-auth?query=' + query,
    port: 8890,
    headers: { 'Accept': 'application/sparql-results+json', 'Authorization': 'Basic ' + Buffer.from(user + ':' + pass).toString('base64') }
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
    headers: { 'Accept': 'application/sparql-results+json' }
  };
}

/**
 * Función para procesar un JSONObject que provenga de un punto SPARQL cuando 
 * se establezcan las variables que se quieran consultar. Comprueba 
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
  for (let valor of nombreVariables.values()) {
    if (!variables.includes(valor)) {
      continuaProcesado = false;
      break;
    }
  }
  if (continuaProcesado) {
    var datos = resultados.results.bindings;
    var salida = [];
    var intermedio;
    if (Object.keys(nombreVariables).length == 2 && nombreVariables.includes('propiedad') && nombreVariables.includes('valor')) {
      intermedio = {};
      var posicion;
      for (let dato of datos.values()) {
        posicion = -1;
        let i = 0;
        let equi;
        for (let d of Object.keys(equivalencias)) {
          equi = equivalencias[d];
          if (equi['prop'] == dato.propiedad.value) {
            posicion = i;
            break;
          } else {
            ++i;
          }
        }
        if (posicion > -1) {
          //intermedio[equi['prop']] = dato.valor.value;
          intermedio[(Object.keys(equivalencias))[posicion]] = dato.valor.value;
        }
      }
      if (Object.keys(intermedio).length > 0)
        salida.push(intermedio);
    } else {
      for (let dato of datos.values()) {
        intermedio = {};
        for (let variable of nombreVariables) {
          try {
            //intermedio[(equivalencias[variable])['prop']] = dato[variable].value;
            intermedio[variable] = dato[variable].value;
          } catch (e) {
            intermedio[variable] = dato[variable].value;
          }
        }
        salida.push(intermedio);
      }
    }
    return salida;
  } else {
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
  return numero.toString().replace('.', '').replace('-', '');
}

module.exports = { creaOptions, creaOptionsAuth, procesaJSONSparql, longitudValida, latitudValida, numeroStringIRI, equivalencias }