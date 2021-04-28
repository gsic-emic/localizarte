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
 * Formateo de las consultas SPARQL.
 * autor: Pablo García Zarza
 * version: 20210428
 */

var Mustache = require('mustache');
const Auxiliar = require('../util/auxiliar');

/**
 * Función para crear el path con el que solicitar los contextos de una zona.
 * 
 * @param {Object} puntos Contendrá cuatro números para identificar el norte, sur, este y oeste
 * @returns Query con la solicitud de los contextos
 */
function contextosZona(puntos) {
  var query = Mustache.render(
    "select ?ctx ?lat ?long ?titulo ?descr ?autor where {"
    + "?ctx geo:lat ?lat ; "
    + "geo:long ?long ; "
    + "rdfs:label ?titulo ; "
    + "rdfs:comment ?descr ;"
    + "dc:creator ?autor . "
    + "filter ("
    + "(xsd:decimal(?lat) > {{{sur}}}) && "
    + "(xsd:decimal(?lat) <= {{{norte}}}) && "
    + "(xsd:decimal(?long) >= {{{oeste}}}) && "
    + "(xsd:decimal(?long) < {{{este}}})).} "
    , puntos);
  return encodeURIComponent(query);
}

/**
 * Función para crear la query con la que se obtiene el tipo de un objeto
 * 
 * @param {String} id IRI que se va a comprobar
 * @returns Query formateada
 */
function tipoIRI(id) {
  var query = "select ?tipo where {<" + id + "> a ?tipo}";
  return encodeURIComponent(query);
}

/**
 * Función para obtener la petición que se utilizará para realizar una inserción.
 * 
 * @param {Object} datosContexto Mapa que contendrá los datos necesarios para hacer la inserción
 * @returns Petición codificada
 */
function nuevoContexto(datosContexto) {
  var query = "with <http://localizarte.gsic.uva.es> insert { "
    + "<" + datosContexto['iri'] + "> a <https://casuallearn.gsic.uva.es/ontology/physicalSpace>; ";
  var primero = true;
  let propiedad;
  for (let t in datosContexto) {
    try {
      if (t != 'iri') {
        propiedad = (Auxiliar.equivalencias[t])['prop'];
        if (primero) {
          primero = false;
        } else {
          query += "; "
        }
        query += "<" + propiedad + "> "
          + formatoTiposDatos((Auxiliar.equivalencias[t])['tipo'], datosContexto[t]);
      }
    } catch (e) {
      continue;
    }
  }
  query += '}';
  return encodeURIComponent(query);
}

/**
 * Función para obtener la información de un contexto registrado en el sistema.
 * 
 * @param {String} iriContexto Identificador del contexto
 * @returns Query formateada
 */
function infoContexto(iriContexto) {
  var query = "select ?lat ?long ?titulo ?descr ?autor ?tipo where {"
    + "<" + iriContexto + "> a ?tipo ; "
    + "geo:lat ?lat ; "
    + "geo:long ?long ; "
    + "rdfs:label ?titulo ; "
    + "rdfs:comment ?descr ;"
    + "dc:creator ?autor . }";
  return encodeURIComponent(query);
}

/**
 * Función para obtener toda la información que se tenga del objeto.
 * 
 * @param {String} iri Identificador del objeto 
 * @returns Query preparada para enviar al punto SPARQL
 */
function todaInfo(iri) {
  var query = "select ?propiedad ?valor where { "
    + "<" + iri + "> ?propiedad ?valor }";
  return encodeURIComponent(query);
}

/**
 * Función para obtener la query con la que eliminar un contexto del repositorio.
 * 
 * @param {Object} info Parámetros del contexto a borrar
 * @returns Query formateada
 */
function eliminaContexto(info) {
  var query = Mustache.render(
    "with <http://localizarte.gsic.uva.es> "
    + "delete where { <{{{iri}}}> a <https://casuallearn.gsic.uva.es/ontology/physicalSpace> ; ?a ?b }"
    , info);
  return encodeURIComponent(query);
}

/**
 * Función para crear una query en la que se solicitará la inserción y eliminación de datos.
 * 
 * @param {String} iri Identificador del contexto
 * @param {Object} inserciones Objeto con los identificadores de las inserciones
 * @param {Object} eliminaciones Objeto con los identificadores de las eliminaciones
 * @param {Object} modificaciones Objeto con las modificaciones. En su interior se encuentra el valor anterior y el nuevo
 * @returns Query para realizar la solicitud de borrados y creaciones para un iri específico
 */
function actualizaValoresContexto(iri, inserciones, eliminaciones, modificaciones) {
  var query = "with <http://localizarte.gsic.uva.es>";
  var tama2 = Object.keys(modificaciones).length > 0;
  if (Object.keys(eliminaciones).length > 0 || Object.keys(modificaciones).length > 0) {
    query += "delete {"
    query += "<" + iri + "> ";
    query += contenidoInsertDelete(eliminaciones, null, tama2, false);
    query += contenidoInsertDelete(modificaciones, 'anterior', tama2, true);
  }
  if (Object.keys(inserciones).length > 0 || Object.keys(modificaciones).length > 0) {
    query += "insert { <" + iri + "> ";
    query += contenidoInsertDelete(inserciones, null, tama2, false);
    query += contenidoInsertDelete(modificaciones, 'nuevo', tama2, true);
  }
  return encodeURIComponent(query);
}

/**
 * Función para obtener una parte de una query para hacer una inserción o una eliminación
 * 
 * @param {Object} array Datos con los que se completará la petición
 * @param {String} extra Palabra con la que se extraen partes de los datos del array o null 
 *                       si no se tiene que extraer nada
 * @param {Boolean} tama2 Verdadero si el tamaño del vector de datos modificados es mayor que 0
 * @param {Boolean} final Variable para saber si hay que poner un cierre de llaves puesto 
 *                        que hay que cerrar la inserción o la eliminación
 * @returns Parte de la query formateada
 */
function contenidoInsertDelete(array, extra, tama2, final) {
  let query = "";
  let tama = Object.keys(array).length;
  let d;
  let valor;
  for (let i = 0; i < tama; i++) {
    d = Object.keys(array)[i];
    query += "<" + (Auxiliar.equivalencias[d])['prop'] + "> ";
    valor = (extra) ? (array[d])[extra] : (array[d]);
    query += formatoTiposDatos((Auxiliar.equivalencias[d])['tipo'], valor);
    if (final) {
      if (i != (tama - 1))
        query += "; ";
    } else {
      if (tama2 || i < (tama - 1))
        query += "; ";
    }
  }
  if (final) query += "} "
  return query;
}

function formatoTiposDatos(tipo, valor) {
  switch (tipo) {
    case 'string':
      return "'''" + valor + "''' ";
    case 'decimal':
      return valor + " ";
    default:
      return "<" + valor + "> ";
  }
}

function tareasContexto(iriContexto) {
  var query = "prefix cl: <https://casuallearn.gsic.uva.es/property/> "
    + "select ?task ?aT ?aTR ?thumb where { "
    + "?task a <https://casuallearn.gsic.uva.es/ontology/task>; "
    + "cl:hasContext <" + iriContexto + ">; "
    + "cl:answerType ?aT; "
    + "cl:associatedTextResource ?aTR. "
    + "optional{?task <http://es.dbpedia.org/ontology/thumbnail> ?thumb} } "
  return encodeURIComponent(query);
}

module.exports = {
  contextosZona, tipoIRI, nuevoContexto, infoContexto, todaInfo, eliminaContexto, actualizaValoresContexto,
  tareasContexto
}