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
* version: 20211109
*/

/**
* Objeto con las palabras claves usadas en el cliente para referirse a
* propiedades del repositorio de triplas. También tiene el tipo del valor
* de la propiedad
*/
const URI = require("uri-js");
const Mustache = require('mustache');

const Configuracion = require('./config');
const winston = require('./winston');

/** Equivalencias cliente al servidor */
const equivalencias = {
  tipo: {
    prop: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    abr: 'a',
    tipo: 'uri',
  },
  lat: {
    prop: 'http://www.w3.org/2003/01/geo/wgs84_pos#lat',
    abr: 'geo:lat',
    tipo: 'decimal',
  },
  long: {
    prop: 'http://www.w3.org/2003/01/geo/wgs84_pos#long',
    abr: 'geo:long',
    tipo: 'decimal',
  },
  titulo: {
    prop: 'http://www.w3.org/2000/01/rdf-schema#label',
    abr: 'rdfs:label',
    tipo: 'string',
  },
  descr: {
    prop: 'http://www.w3.org/2000/01/rdf-schema#comment',
    abr: 'rdfs:comment',
    tipo: 'string',
  },
  autor: {
    prop: 'http://purl.org/dc/elements/1.1/creator',
    abr: 'dc:creator',
    tipo: 'string',
  },
  hasContext: {
    prop: 'https://casuallearn.gsic.uva.es/property/hasContext',
    abr: 'clp:hasContext',
    tipo: 'uri',
  },
  imagen: {
    prop: 'https://casuallearn.gsic.uva.es/property/image',
    abr: 'clp:image',
    tipo: 'uri',
  },
  thumb: {
    prop: 'http://es.dbpedia.org/ontology/thumbnail',
    abr: 'dbo:thumbnail',
    tipo: 'uri',
  },
  thumbnail: {
    prop: 'http://es.dbpedia.org/ontology/thumbnail',
    abr: 'dbo:thumbnail',
    tipo: 'uri',
  },
  aTR: {
    prop: 'https://casuallearn.gsic.uva.es/property/associatedTextResource',
    abr: 'clp:associatedTextResource',
    tipo: 'string',
  },
  aT: {
    prop: 'https://casuallearn.gsic.uva.es/property/answerType',
    abr: 'clp:answerType',
    tipo: 'uri',
  },
  cP: {
    prop: 'https://casuallearn.gsic.uva.es/property/cognitiveProcess',
    abr: 'clp:cognitiveProcess',
    tipo: 'uri',
  },
  kD: {
    prop: 'https://casuallearn.gsic.uva.es/property/knowledgeDimension',
    abr: 'clp:knowledgeDimension',
    tipo: 'uri',
  },
  topic: {
    prop: 'http://purl.org/dc/elements/1.1/subject',
    abr: 'dc:subject',
    tipo: 'uriString',
  },
  iri: {
    prop: 'iri',
    tipo: 'uri',
  },
  ctx: {
    prop: 'https://casuallearn.gsic.uva.es/ontology/physicalSpace',
    abr: 'clo:physicalSpace',
    tipo: 'uri',
  },
  license: {
    prop: 'http://purl.org/dc/terms/license',
    tipo: 'uriString',
  },
  task: {
    prop: 'https://casuallearn.gsic.uva.es/ontology/task',
    abr: 'clo:task',
    tipo: 'uri',
  },
  fuente: {
    prop: 'http://www.w3.org/2000/01/rdf-schema#seeAlso',
    abr: 'rdfs:seeAlso',
    tipo: 'uriString',
  },
  title: {
    prop: 'https://casuallearn.gsic.uva.es/property/title',
    abr: 'clp:title',
    tipo: 'string'
  },
  spa: {
    prop: 'https://casuallearn.gsic.uva.es/property/space',
    abr: 'clp:space',
    tipo: 'uri',
  },
  tRTexto: {
    prop: 'https://casuallearn.gsic.uva.es/answerType/text',
    tipo: 'uri'
  },
  tRMultiFotosTexto: {
    prop: 'https://casuallearn.gsic.uva.es/answerType/multiplePhotosAndText',
    tipo: 'uri',
  },
  tRFoto: {
    prop: 'https://casuallearn.gsic.uva.es/answerType/photo',
    tipo: 'uri',
  },
  tRFotoTexto: {
    prop: 'https://casuallearn.gsic.uva.es/answerType/photoAndText',
    tipo: 'uri',
  },
  tRMultiFotos: {
    prop: 'https://casuallearn.gsic.uva.es/answerType/multiplePhotos',
    tipo: 'uri',
  },
  tRTextoCorto: {
    prop: 'https://casuallearn.gsic.uva.es/answerType/shortText',
    tipo: 'uri',
  },
  tRSinRespuesta: {
    prop: 'https://casuallearn.gsic.uva.es/answerType/noAnswer',
    tipo: 'uri',
  },
  tRVideo: {
    prop: 'https://casuallearn.gsic.uva.es/answerType/video',
    tipo: 'uri',
  },
  tRVideoTexto: {
    prop: 'https://casuallearn.gsic.uva.es/answerType/videoAndText',
    tipo: 'uri',
  },
  tRVF: {
    prop: 'https://casuallearn.gsic.uva.es/answerType/trueFalse',
    tipo: 'uri',
  },
  tRMcq: {
    prop: 'https://casuallearn.gsic.uva.es/answerType/mcq',
    tipo: 'uri',
  },
  espacioFisico: {
    prop: 'https://casuallearn.gsic.uva.es/space/physical',
    tipo: 'uri',
  },
  espacioMapaVirtual: {
    prop: 'https://casuallearn.gsic.uva.es/space/virtualMap',
    tipo: 'uri',
  },
  espacioWeb: {
    prop: 'https://casuallearn.gsic.uva.es/space/web',
    tipo: 'uri',
  },
  broader: {
    prop: 'http://www.w3.org/2004/02/skos/core#broader',
    tipo: 'uri',
  },
  categoria: {
    prop: 'http://www.w3.org/2004/02/skos/core#Concept',
    abr: 'skos:Concept',
    tipo: 'uri',
  },
  licencia: {
    prop: 'http://purl.org/dc/elements/1.1/rights',
    abr: 'dc:rights',
    tipo: 'uri',
  },
  distractor1: {
    prop: 'https://casuallearn.gsic.uva.es/property/distractor1',
    abr: 'clp:distractor1',
    tipo: 'string',
  },
  distractor2: {
    prop: 'https://casuallearn.gsic.uva.es/property/distractor2',
    abr: 'clp:distractor2',
    tipo: 'string',
  },
  distractor3: {
    prop: 'https://casuallearn.gsic.uva.es/property/distractor3',
    abr: 'clp:distractor3',
    tipo: 'string',
  },
  correctMcq: {
    prop: 'https://casuallearn.gsic.uva.es/property/correct',
    abr: 'clp:correct',
    tipo: 'string',
  },
  rE: {
    prop: 'https://casuallearn.gsic.uva.es/property/expectedAnswer',
    abr: 'clp:expectedAnswer',
    tipo: 'string',
  },
};

const tipoRespuetasSoportados = ['tRTexto', 'tRMultiFotosTexto', 'tRFoto', 'tRMultiFoto', 'tRFotoTexto', 'tRMultiFotos', 'tRTextoCorto', 'tRTextoCorto', 'tRSinRespuesta', 'tRVideo', 'tRVideoTexto', 'tRVF', 'tRMcq'];

const espaciosSoportados = ['espacioFisico', 'espacioMapaVirtual', 'espacioWeb'];

/**
* Función para comprobar si los espacios que ha enviado el cliente están soportados
*
* @param {Object} spa Puede ser un objeto o directamente un String
*/
function compruebaEspacios(spa) {
  try {
    if (typeof spa !== 'string') {
      let soportados = true;
      spa.some(espacio => {
        if (!espaciosSoportados.includes(espacio.spa)) {
          soportados = false;
          return true;
        }
        return false;
      });
      return soportados;
    } else {
      return espaciosSoportados.includes(spa);
    }
  } catch (e) {
    return false;
  }
}

/**
* Función para crear los datos necesarios para realizar una consulta
*
* @param {String} query Consulta que se desea realizar
* @param {String} user Usuario
* @param {String} pass Contraseña
* @returns Objeto con la información para realizar la consulta
*/
function creaOptionsAuth(query, user, pass) {
  return {
    host: Configuracion.direccionSPARQL,
    path: `/sparql-auth?query=${query}`,
    port: Configuracion.puertoSPARQL,
    headers: { Accept: 'application/sparql-results+json', Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}` },
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
    host: Configuracion.direccionSPARQL,
    path: `/sparql?default-graph-uri=&query=${query}`,
    port: Configuracion.puertoSPARQL,
    headers: { Accept: 'application/sparql-results+json' },
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
  const r = JSON.parse(resultados);
  const variables = r.head.vars;
  let continuaProcesado = true;
  for (const valor of nombreVariables.values()) {
    if (!variables.includes(valor)) {
      continuaProcesado = false;
      break;
    }
  }
  if (continuaProcesado) {
    const datos = r.results.bindings;
    const salida = [];
    let intermedio;
    if (Object.keys(nombreVariables).length == 2 && nombreVariables.includes('propiedad') && nombreVariables.includes('valor')) {
      intermedio = {};
      let posicion;
      for (const dato of datos.values()) {
        posicion = -1;
        let i = 0;
        let equi;
        for (const d of Object.keys(equivalencias)) {
          equi = equivalencias[d];
          if (equi.prop == dato.propiedad.value) {
            posicion = i;
            break;
          } else {
            ++i;
          }
        }
        if (posicion > -1) {
          // intermedio[equi['prop']] = dato.valor.value;
          if (intermedio[(Object.keys(equivalencias))[posicion]]) {
            intermedio[(Object.keys(equivalencias))[posicion]] = intermedio[(Object.keys(equivalencias))[posicion]] + ' ;' + dato.valor.value;
          } else {
            intermedio[(Object.keys(equivalencias))[posicion]] = dato.valor.value;
          }
        }
      }
      if (Object.keys(intermedio).length > 0) { salida.push(intermedio); }
    } else {
      for (const dato of datos.values()) {
        intermedio = {};
        for (const variable of nombreVariables) {
          try {
            // intermedio[(equivalencias[variable])['prop']] = dato[variable].value;
            if (intermedio[variable]) {
              intermedio[variable] = intermedio[variable] + ';' + dato[variable].value;
            } else {
              intermedio[variable] = dato[variable].value;
            }
          } catch (e) {
            //intermedio[variable] = dato[variable].value;
            continue;
          }
        }
        salida.push(intermedio);
      }
    }
    return salida;
  }
  return null;
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

/**
* Función para averiguar si una cadena de texto está vacía o es nula.
*
* @param {String} string Cadena de texto
* @returns Verdadero si el string está vacío o es nulo y false en cualquier otro caso
*/
function isEmpty(string) {
  return string === '';
}

function nuevoIriContexto(nombreContexto, latitud, longitud) {
  return Mustache.render(
    'https://casuallearn.gsic.uva.es/context/{{{titulo}}}/{{{long}}}/{{{lat}}}',
    {
      titulo: nombreContexto.replace(/[^a-zA-Z:_]/g, ''),
      long: longitud,
      lat: latitud
    });
}

/**
* Función para crear el identificador de una tarea con el nombre del contexto y
* el de la propia tarea
*
* @param {Objeto} nombreContexto Nombre del contexto
* @param {Objeto} nombreTarea Nombre de la tarea
* @returns Identificador de la tarea.
*/
function nuevoIriTarea(nombreContexto, nombreTarea) {
  return Mustache.render(
    'https://casuallearn.gsic.uva.es/{{{nCtx}}}/{{{nTask}}}',
    {
      nCtx: nombreContexto.trim().replace(/\s/g, '_').replace(/[^a-zA-Z:_]/g, ''),
      nTask: nombreTarea.replace(/[^a-zA-Z:_]/g, '').toLowerCase()
    }
  );
}

/**
* https://stackoverflow.com/a/5717133
* @param {String} str
*/
function validURL(str) {
  const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return !!pattern.test(str);
}

function validIRI(str) {
  return !(URI.parse(str, { iri: true }).scheme === undefined);
}


function existeObjeto(objeto) {
  return typeof objeto === 'object' && objeto !== null;
}

function logHttp(_req, _res, statusCode, label, start) {
  _res.status(statusCode);
  winston.http(Mustache.render(
    '{{{label}}} || {{{statusCode}}} || {{{path}}} {{{method}}} {{{ip}}} || {{{time}}}',
    {
      label: label,
      statusCode: statusCode,
      path: _req.originalUrl,
      method: _req.method,
      ip: _req.ip,
      time: Date.now() - start,
    }
  ));
  return _res;
}

module.exports = {
  creaOptions,
  creaOptionsAuth,
  procesaJSONSparql,
  longitudValida,
  latitudValida,
  numeroStringIRI,
  equivalencias,
  isEmpty,
  nuevoIriContexto,
  nuevoIriTarea,
  validURL,
  tipoRespuetasSoportados,
  espaciosSoportados,
  compruebaEspacios,
  existeObjeto,
  validIRI,
  logHttp,
};
