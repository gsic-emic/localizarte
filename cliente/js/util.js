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
 * Funciones auxiliares utilizadas en el cliente de LocalizARTE.
 * autor: Pablo García Zarza
 * version: 20210525
 */

/**
 * Función para crear un IRI capaz de resolver por el servidor para manejar un contexto específico.
 * 
 * @param {String} iri IRI del contexto
 * @returns Identificador formateado
 */
function recursoContextoParaElServidor(iri) {
    return iri.replace('https://casuallearn.gsic.uva.es/context/', direccionServidor + '/contexts/');
}

//TODO revisar qué pasa con los optional
/**
 * Función para formatear los resltaudos del punto SPARQL.
 * 
 * @param {Array} vars Variables que debe tener cada objeto
 * @param {Array} bindings Cada uno de los resultados
 * @returns Resultados formateados que se han obtenido del punto SPARQL
 */
function parseadorResultadosSparql(vars, bindings) {
    let salida = [];
    let intermedio = {};
    let cada;
    bindings.forEach(binding => {
        intermedio = {};
        vars.forEach(v => {
            cada = binding[v];
            switch (cada['type']) {
                case 'typed-literal':
                    intermedio[v] = Number(cada['value']);
                    break;
                default:
                    intermedio[v] = cada['value'];
                    break;
            }
        });
        salida.push(intermedio);
    });
    return salida;
}

/**
 * Función para obtener los N (5 como máximo por defecto) lugares más cercanos a un punto.
 * 
 * @param {JSONObject} posicion Compuesta por latitud (lat) y longitud (lng).
 * @param {Array} lugares Lista de lugares (que tendrán lat y lng) que se desea filtrar.
 * @param {Integer} maximo Número máximo de resultados que se devuelven
 * @returns Lugares más cercanos
 */
function masCercanos(posicion, lugares, maximo = 5) {
    let lugaresPrima = [];
    let distancias = [];
    let d;
    let salida = [];
    lugares.forEach(lugar => {
        d = distanciaDosPuntos(posicion, lugar);
        lugar['distancia'] = d;
        distancias.push(d);
        lugaresPrima.push(lugar);
    });
    distancias = distancias.sort((a, b) => a - b);

    distancias.some(distancia => {
        lugaresPrima.some(lugar => {
            if (distancia === lugar['distancia']) {
                let guarda = true;
                salida.forEach(l => {
                    if (l.place === lugar.place || (l.lat === lugar.lat && l.lng === lugar.lng)) {
                        guarda = false;
                    }
                });
                if (guarda) {
                    salida.push(lugar);
                    return true;
                } 
            }
        });
        if (salida.length >= maximo) {
            return true;
        }
    });
    return salida;
}

/**
 * Función para obtener la distancia (aprox) entre dos puntos. Hace uso de la biblioteca
 * Leaflet.
 * 
 * @param {JSON} p1 Primer punto
 * @param {JSON} p2 Segundo punto
 * @returns Aproximación de la distancia en metros entre dos puntos
 */
function distanciaDosPuntos(p1, p2) {
    return map.distance(L.latLng(p1.lat, p1.lng), L.latLng(p2.lat, p2.lng));
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
    return ((str.includes('www.') || (str.includes('https://') || (str.includes('http://')))) && !str.includes(' '));
}

/**
 * Función para mostrar al usuario una notificación a través de un Toast.
 * 
 * @param {String} mensaje Mensaje
 */
function notificaLateral(mensaje) {
    let toast = new bootstrap.Toast(document.getElementById('notificacionLateral'));
    document.getElementById('mensajeNotificacionLateral').innerHTML = mensaje;
    toast.show();
}

/**
 * Función para mostrar al usuario un mensaje de error a través de un Toast.
 * 
 * @param {String} mensaje Mensaje de error
 */
function notificaLateralError(mensaje) {
    let toast = new bootstrap.Toast(document.getElementById('notificacionLateralError'));
    document.getElementById('mensajeNotificacionLateralError').innerHTML = mensaje;
    toast.show();
}

/**
 * Función para determinar si un modal está abierto o no.
 * 
 * @param {Object} modal Elemento del documento que contiene al modal
 * @returns Verdadero si está abierto o falso si no lo está
 */
function modalOpen(modal) {
    return modal.className.includes('show');
}