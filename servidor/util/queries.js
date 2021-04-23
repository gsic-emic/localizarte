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
 * version: 20210422
 */

var Mustache = require('mustache');

/**
 * Función para crear el path con el que solicitar los contextos de una zona.
 * 
 * @param {Object} puntos Contendrá cuatro números para identificar el norte, sur, este y oeste
 * @returns Query con la solicitud de los contextos
 */
function contextosZona(puntos) {
    var query = Mustache.render(
        "prefix cl: <https://casuallearn.gsic.uva.es/property/> "
        + "prefix sch: <https://schema.org/> " 
        + "select ?ctx ?lat ?long ?titulo ?descr ?autor where {" 
        + "?ctx geo:lat ?lat ; " 
        +   "geo:long ?long ; "
        +   "rdfs:label ?titulo ; "
        +   "rdfs:comment ?descr ;"
        +   "dc:creator ?autor . "
        + "filter ("
        +   "(xsd:decimal(?lat) > {{{sur}}}) && "
        +   "(xsd:decimal(?lat) <= {{{norte}}}) && "
        +   "(xsd:decimal(?long) >= {{{oeste}}}) && "
        +   "(xsd:decimal(?long) < {{{este}}})).} "
        ,puntos);
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
function nuevoContexto(datosContexto){
    var query = Mustache.render(
        "insert data {"
        + "graph <http://localizarte.gsic.uva.es> { "
        + "<{{{iri}}}> a <https://casuallearn.gsic.uva.es/ontology/physicalSpace>; "
        + "geo:long {{{long}}} ; "
        + "geo:lat {{{lat}}} ; "
        + "rdfs:label '''{{{titulo}}}''' ; "
        + "rdfs:comment '''{{{descr}}}''' ; "
        + "dc:creator '''{{{autor}}}''' . }}"
        , datosContexto);
    return encodeURIComponent(query);
}

/**
 * Función para obtener la información de un contexto registrado en el sistema.
 * 
 * @param {String} iriContexto Identificador del contexto
 * @returns Query formateada
 */
function infoContexto(iriContexto) {
    var query = "prefix cl: <https://casuallearn.gsic.uva.es/property/> "
        + "prefix sch: <https://schema.org/> " 
        + "select ?lat ?long ?titulo ?descr ?autor ?tipo where {" 
        + "<" + iriContexto + "> a ?tipo ; "
        +   "geo:lat ?lat ; " 
        +   "geo:long ?long ; "
        +   "rdfs:label ?titulo ; "
        +   "rdfs:comment ?descr ;"
        +   "dc:creator ?autor . }";
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
        "delete data {"
        + "graph <http://localizarte.gsic.uva.es> { "
        + "<{{{iri}}}> a <https://casuallearn.gsic.uva.es/ontology/physicalSpace>; "
        + "geo:long {{{long}}} ; "
        + "geo:lat {{{lat}}} ; "
        + "rdfs:label '''{{{titulo}}}''' ; "
        + "rdfs:comment '''{{{descr}}}''' ; "
        + "dc:creator '''{{{autor}}}''' . }}"
        , info);
    return encodeURIComponent(query);
}

module.exports = {contextosZona, tipoIRI, nuevoContexto, infoContexto, eliminaContexto}