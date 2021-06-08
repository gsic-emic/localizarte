/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
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
 * version: 202100519
 */

const Mustache = require('mustache');
const Auxiliar = require('./auxiliar');

/**
 * Función para crear el path con el que solicitar los contextos de una zona.
 *
 * @param {Object} puntos Contendrá cuatro números para identificar el norte, sur, este y oeste
 * @returns Query con la solicitud de los contextos
 */
function contextosZona(puntos) {
  const query = Mustache.render(
    'select ?ctx ?lat ?long ?titulo ?descr ?autor ?imagen where {?ctx geo:lat ?lat ; geo:long ?long ; rdfs:label ?titulo ; rdfs:comment ?descr ; dc:creator ?autor . optional { ?ctx <https://casuallearn.gsic.uva.es/property/image> ?imagen . } filter ((xsd:decimal(?lat) > {{{sur}}}) && (xsd:decimal(?lat) <= {{{norte}}}) && (xsd:decimal(?long) >= {{{oeste}}}) && (xsd:decimal(?long) < {{{este}}})).} ',
    puntos,
  );
  return encodeURIComponent(query);
}

/**
 * Función para crear la query con la que se obtiene el tipo de un objeto
 *
 * @param {String} id IRI que se va a comprobar
 * @returns Query formateada
 */
function tipoIRI(id) {
  const query = Mustache.render(
    'select ?tipo where {<{{{id}}}> a ?tipo}',
    { id: id });
  return encodeURIComponent(query);
}

/**
 * Función para obtener un valor en el formato adecuado para introducirlo en
 * el repositorio de triplas.
 *
 * @param {String} tipo Formato que se desea para el valor
 * @param {Object} valor Valor a introducir
 * @returns Valor formateado adecuado
 */
function formatoTiposDatos(tipo, valor) {
  switch (tipo) {
    case 'string':
      return `'''${valor}''' `;
    case 'decimal':
      return `${valor} `;
    case 'uriString':
      return (Auxiliar.validIRI(valor)) ? `<${valor}> ` : `'''${valor}''' `;
    default:
      return `<${valor}> `;
  }
}

/**
 * Función para crear la query con la que insertar datos de un objeto en el repositorio de
 * triplas.
 *
 * @param {Object} datosObjeto Los datos que se van a utilizar para crear la petición.
 * @param {String} tipoObjeto El tipo de objeto con el que se pretenden insertar los datos
 * @returns Query con la que realizar la consulta
 */
function nuevoObjeto(datosObjeto, tipoObjeto) {
  let query = Mustache.render(
    'with <http://localizarte.gsic.uva.es> insert {<{{{iri}}}> a <{{{tipoObjeto}}}>; ',
    {
      iri: datosObjeto.iri,
      tipoObjeto: tipoObjeto
    });
  let primero = true;
  let sigue = true;
  for (const t in datosObjeto) {
    try {
      if (t === 'iri') {
        continue;
      }
      switch (t) {
        case 'titulo':
        case 'descr':
        case 'title':
          let vector = datosObjeto[t];
          if (typeof vector === 'string') {
            vector = {
              value: vector,
              lang: 'es'
            };
          }
          if (!Array.isArray(vector)) {
            vector = [vector];
          }
          vector.forEach(v => {
            if (!Auxiliar.isEmpty(v.value.trim()) && !Auxiliar.isEmpty(v.lang.trim())) {
              if (primero) {
                primero = false;
              } else {
                query = Mustache.render(
                  '{{{query}}}; ',
                  { query: query }
                );
              }
              query = Mustache.render(
                '{{{query}}}{{{predicado}}} {{{objeto}}}@{{{idioma}}}',
                {
                  query: query,
                  predicado: (Auxiliar.equivalencias[t]).abr,
                  objeto: formatoTiposDatos((Auxiliar.equivalencias[t]).tipo, v.value.trim()).trim(),
                  idioma: v.lang
                })
            }
          });
          break;
        case 'fuentes':
          const { fuentes } = datosObjeto;
          fuentes.forEach((fuente) => {
            if (primero) {
              primero = false;
            } else {
              query = Mustache.render(
                '{{{query}}}; ',
                { query: query }
              );
            }
            query = Mustache.render(
              '{{{query}}}{{{predicado}}} {{{valor}}} ',
              {
                query: query,
                predicado: (Auxiliar.equivalencias.fuente).abr,
                valor: formatoTiposDatos('uriString', fuente.fuente),
              }
            );
          });
          break;
        case 'aT':
          if (primero) {
            primero = false;
          } else {
            query = Mustache.render(
              '{{{query}}}; ',
              { query: query }
            );
          }
          query = Mustache.render(
            '{{{query}}}{{{predicado}}} {{{valor}}}',
            {
              query: query,
              predicado: Auxiliar.equivalencias[t].abr,
              valor: formatoTiposDatos('uriString', Auxiliar.equivalencias[datosObjeto[t]].prop)
            }
          )
          break;
        case 'espacios':
          let { espacios } = datosObjeto;
          if (typeof espacios === 'string') {
            espacios = [{ spa: espacios }];
          }
          espacios.forEach(espacio => {
            if (primero) {
              primero = false;
            } else {
              query = Mustache.render(
                '{{{query}}}; ',
                { query: query }
              );
            }
            query = Mustache.render(
              '{{{query}}}{{{predicado}}} {{{valor}}}',
              {
                query: query,
                predicado: Auxiliar.equivalencias.spa.abr,
                valor: formatoTiposDatos('uri', Auxiliar.equivalencias[espacio.spa].prop)
              }
            );
          });
          break;
        case 'thumbnail':
          if (primero) {
            primero = false;
          } else {
            query = Mustache.render(
              '{{{query}}}; ',
              { query: query }
            );
          }
          const { thumbnail } = datosObjeto;
          if (!Auxiliar.isEmpty(thumbnail.iri)) {
            query = Mustache.render(
              '{{{query}}}clp:thumbnail {{{iriThumb}}}',
              {
                query: query,
                iriThumb: formatoTiposDatos((Auxiliar.equivalencias[t]).tipo, thumbnail.iri)
              }
            );
          }
          break;
        case 'categorias':
          const { categorias } = datosObjeto;
          categorias.forEach(c => {
            if (primero) {
              primero = false;
            } else {
              query = Mustache.render(
                '{{{query}}}; ',
                { query: query }
              );
            }
            query = Mustache.render(
              '{{{query}}}{{{propCategoria}}} {{{valorCategoria}}}',
              {
                query: query,
                propCategoria: Auxiliar.equivalencias['topic'].abr,
                valorCategoria: formatoTiposDatos((Auxiliar.equivalencias['topic']).tipo, c.categoria)
              }
            );
          });
          break;
        default:
          if (primero) {
            primero = false;
          } else {
            query = Mustache.render(
              '{{{query}}}; ',
              { query: query }
            );
          }
          query = Mustache.render(
            '{{{query}}}<{{{propiedad}}}> {{{valor}}}',
            {
              query: query,
              propiedad: (Auxiliar.equivalencias[t]).prop,
              valor: formatoTiposDatos((Auxiliar.equivalencias[t]).tipo, datosObjeto[t]),
            }
          );
          break;
      }
    } catch (e) {
      console.log(e);
      sigue = false;
    }
  }
  //Agregamos inserciones extras:
  if (sigue && (Auxiliar.existeObjeto(datosObjeto.thumbnail) || Auxiliar.existeObjeto(datosObjeto.categorias))) {
    if (Auxiliar.existeObjeto(datosObjeto.thumbnail)) {
      const thumbnail = datosObjeto.thumbnail;
      query = Mustache.render(
        '{{{query}}}{{#licencia}}.<{{{iriThumb}}}> a dbo:Image ; <{{{propLicencia}}}> {{{valorLicencia}}}{{/licencia}}',
        {
          query: query,
          licencia: !Auxiliar.isEmpty(thumbnail.iri.trim()) && !Auxiliar.isEmpty(thumbnail.licencia.trim()),
          iriThumb: thumbnail.iri.trim(),
          propLicencia: Auxiliar.equivalencias.licencia.prop,
          valorLicencia: formatoTiposDatos((Auxiliar.equivalencias.licencia.tipo), thumbnail.licencia)
        }
      );
    }
    if (Auxiliar.existeObjeto(datosObjeto.categorias)) {
      const categorias = datosObjeto.categorias;
      categorias.forEach(categoria => {
        const { broaders } = categoria;
        const { etiqueta } = categoria;
        let broadersFormados, etiquetaFormada;
        let tieneBroaders, tieneEtiqueta;
        if (Auxiliar.existeObjeto(broaders)) {
          tieneBroaders = true;
          broadersFormados = " ; skos:broader"
          const tama = broaders.length;
          const tamaMenos = tama - 1;
          for (let i = 0; i < tama; i++) {
            if (i == tamaMenos) {
              broadersFormados = Mustache.render(
                '{{{broadersFormados}}} <{{{broader}}}>',
                {
                  broadersFormados: broadersFormados,
                  broader: broaders[i].broader
                });
            } else {
              broadersFormados = Mustache.render(
                '{{{broadersFormados}}} <{{{broader}}}>,',
                {
                  broadersFormados: broadersFormados,
                  broader: broaders[i].broader
                });
            }
          }
        } else {
          tieneBroaders = false;
          broadersFormados = "";
        }
        if (Auxiliar.existeObjeto(etiqueta)) {
          tieneEtiqueta = true;
          etiquetaFormada = " ; rdfs:label ";
          let valorEtiqueta;
          etiqueta.some(etiq => {
            valorEtiqueta = "'''" + etiq.value + "'''@" + etiq.lang;
            if (etiq.lang === 'en') {
              return true;
            } else {
              return false;
            }
          });
          etiquetaFormada = Mustache.render(
            ' ; rdfs:label {{{valorEtiqueta}}} ',
            { valorEtiqueta: valorEtiqueta }
          );
        } else {
          tieneEtiqueta = false;
          etiquetaFormada = "";

        }
        query = Mustache.render(
          '{{{query}}}.<{{{iriCategoria}}}> a skos:Concept{{#tieneEtiqueta}}{{{etiqueta}}}{{/tieneEtiqueta}}{{#tieneBroaders}}{{{broadersFormados}}} {{/tieneBroaders}}',
          {
            query: query,
            iriCategoria: categoria.categoria,
            tieneEtiqueta: tieneEtiqueta,
            etiqueta: etiquetaFormada,
            tieneBroaders: tieneBroaders,
            broadersFormados: broadersFormados
          }
        );
      });
    }
  }

  query = Mustache.render('{{{query}}}}', { query: query });
  console.log(query);
  return encodeURIComponent(query);
}

/**
 * Función para obtener la petición que se utilizará para realizar una inserción de un contexto.
 *
 * @param {Object} datosContexto Mapa que contendrá los datos necesarios para hacer la inserción
 * @returns Petición codificada
 */
function nuevoContexto(datosContexto) {
  return nuevoObjeto(datosContexto, 'https://casuallearn.gsic.uva.es/ontology/physicalSpace');
}

/**
 * Función para obtener la petición que se utilizará para realizar una inserción de una tarea.
 *
 * @param {Object} datosTarea Datos que se desean agregar a la tarae
 * @returns Query formada para la inserción de los datos de la tarea
 */
function nuevaTarea(datosTarea) {
  return nuevoObjeto(datosTarea, 'https://casuallearn.gsic.uva.es/ontology/task');
}

/**
 * Función para obtener la información de un contexto registrado en el sistema.
 *
 * @param {String} iriContexto Identificador del contexto
 * @returns Query formateada
 */
function infoContexto(iriContexto) {
  const query = Mustache.render('select ?lat ?long ?titulo ?descr ?autor ?tipo where {<{{{iriContexto}}}> a ?tipo ; geo:lat ?lat ; geo:long ?long ; rdfs:label ?titulo ; rdfs:comment ?descr ; dc:creator ?autor }', { iriContexto: iriContexto });
  return encodeURIComponent(query);
}

/**
 * Función para obtener toda la información que se tenga del objeto.
 *
 * @param {String} iri Identificador del objeto
 * @returns Query preparada para enviar al punto SPARQL
 */
function todaInfo(iri) {
  const query = Mustache.render('select ?propiedad ?valor where { <{{{iri}}}> ?propiedad ?valor }', { iri: iri });
  return encodeURIComponent(query);
}

/**
 * Función para eliminar las triplas relacionas con el objeto que se indique.
 *
 * @param {String} iri Identificador del objeto a eliminar
 * @param {String} tipo Tipo del objeto
 * @returns Query formateada para solicitar la eliminación de las triplas de ese iri
 */
function eliminaObjeto(iri, tipo) {
  const query = Mustache.render(
    'with <http://localizarte.gsic.uva.es> delete where { <{{{iri}}}> a <{{{tipo}}}> ; ?a ?b }',
    {
      iri: iri,
      tipo: tipo
    });
  return encodeURIComponent(query);
}

/**
 * Función para obtener la query con la que eliminar un contexto del repositorio.
 *
 * @param {Object} info Parámetros del contexto a borrar
 * @returns Query formateada
 */
function eliminaContexto(info) {
  return eliminaObjeto(info.iri, 'https://casuallearn.gsic.uva.es/ontology/physicalSpace');
}

/**
 * Función para obtener la query con la que eliminar una tarea del repositorio.
 * @param {String} iri Identificador de la tarea a eliminar
 * @returns Query formateada
 */
function eliminaTarea(iri) {
  return eliminaObjeto(iri, 'https://casuallearn.gsic.uva.es/ontology/task');
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
  let query = '';
  let tama = Object.keys(array).length;
  let v = 0;
  if ('fuente' in array) {
    if (extra) {
      v = Object.keys(((array['fuente'])[extra]).split(';')).length;
    } else {
      v = Object.keys(array['fuente'].split(';')).length;
    }
  }
  let d;
  //let valor;
  for (let i = 0; i < tama; i++) {
    d = Object.keys(array)[i];
    if (d === 'fuente') {
      const fue = (extra) ? (array[d])[extra].split(';') : array[d].split(';');
      let t = 0;
      fue.forEach(f => {
        /*query += `<http://www.w3.org/2000/01/rdf-schema#seeAlso> `;
        query += formatoTiposDatos('uriString', f.trim());
        if (t < (v - 1)) {
          query += `; `;
        }*/
        query = Mustache.render(
          '{{{query}}}<http://www.w3.org/2000/01/rdf-schema#seeAlso> {{{valor}}}{{{siguiente}}}',
          {
            query: query,
            valor: formatoTiposDatos('uriString', f.trim()),
            siguiente: (t < (v - 1)) ? '; ' : ''
          }
        );
        ++t;
      });
    } else {
      /*query += `<${(Auxiliar.equivalencias[d]).prop}> `;
      valor = (extra) ? (array[d])[extra] : (array[d]);
      query += formatoTiposDatos((Auxiliar.equivalencias[d]).tipo, valor);*/
      query = Mustache.render(
        '{{{query}}}<{{{propiedad}}}> {{{valor}}}',
        {
          query: query,
          propiedad: (Auxiliar.equivalencias[d]).prop,
          valor: formatoTiposDatos((Auxiliar.equivalencias[d]).tipo, (extra) ? (array[d])[extra] : (array[d]))
        }
      );
    }
    /*if (final) {
      if (i != (tama - 1)) query += '; ';
    } else if (tama2 || i < (tama - 1)) query += '; ';*/
    if (final) {
      if (i != (tama - 1)) query = Mustache.render('{{{query}}}; ', { query: query });
    } else if (tama2 || i < (tama - 1)) query = Mustache.render('{{{query}}}; ', { query: query });
  }
  if (final) query = Mustache.render('{{{query}}}} ', { query: query });
  return query;
}

/**
 * Función para crear una query en la que se solicitará la inserción y eliminación de datos.
 *
 * @param {String} iri Identificador del contexto
 * @param {Object} inserciones Objeto con los identificadores de las inserciones
 * @param {Object} eliminaciones Objeto con los identificadores de las eliminaciones
 * @param {Object} modificaciones Objeto de modificaciones. Tiene el valor anterior y el nuevo
 * @returns Query para realizar la solicitud de borrados y creaciones para un iri específico
 */
function actualizaValoresContexto(iri, inserciones, eliminaciones, modificaciones) {
  let query = 'with <http://localizarte.gsic.uva.es>';
  const tama2 = Object.keys(modificaciones).length > 0;
  if (Object.keys(eliminaciones).length > 0 || Object.keys(modificaciones).length > 0) {
    query += 'delete {';
    query += `<${iri}> `;
    query += contenidoInsertDelete(eliminaciones, null, tama2, false);
    query += contenidoInsertDelete(modificaciones, 'anterior', tama2, true);
  }
  if (Object.keys(inserciones).length > 0 || Object.keys(modificaciones).length > 0) {
    query += `insert { <${iri}> `;
    query += contenidoInsertDelete(inserciones, null, tama2, false);
    query += contenidoInsertDelete(modificaciones, 'nuevo', tama2, true);
  }
  console.log(query);
  return encodeURIComponent(query);
}

function actualizaValoresTareas(iri, inserciones, eliminaciones, modificaciones) {
  return actualizaValoresContexto(iri, inserciones, eliminaciones, modificaciones);
}

/**
 * Función para obtener las tareas asociadas a un contexto concreto.
 *
 * @param {String} iriContexto Identificador del contexto
 * @returns La query para realizar una consulta sobre las tareas de un contexto
 */
function tareasContexto(iriContexto) {
  const query = Mustache.render(
    'prefix cl: <https://casuallearn.gsic.uva.es/property/> select ?task ?aT ?aTR ?thumb ?spa ?title where { ?task a <https://casuallearn.gsic.uva.es/ontology/task>; cl:hasContext <{{{iriContexto}}}>; cl:answerType ?aT; cl:associatedTextResource ?aTR ; cl:space ?spa . optional{?task <http://es.dbpedia.org/ontology/thumbnail> ?thumb .} optional{?task <https://casuallearn.gsic.uva.es/property/title> ?title} } ',
    { iriContexto: iriContexto });
  return encodeURIComponent(query);
}

/**
 * Función para recuperar la propiedad label de un objeto que sea un contexto.
 *
 * @param {String} iri Identificador del contexto
 * @returns Query para realizar una consulta sobre la propiedad label de un contexto
 */
function tituloContexto(iri) {
  const query = Mustache.render('select ?titulo where { <{{{iri}}}> a <https://casuallearn.gsic.uva.es/ontology/physicalSpace> ; rdfs:label ?titulo }', { iri: iri });
  return encodeURIComponent(query);
}

module.exports = {
  contextosZona,
  tipoIRI,
  nuevoContexto,
  infoContexto,
  todaInfo,
  eliminaContexto,
  actualizaValoresContexto,
  tareasContexto,
  tituloContexto,
  nuevaTarea,
  eliminaTarea,
  actualizaValoresTareas,
};
