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
 * Funciones para la gestión de los contextos.
 * autor: Pablo García Zarza
 * version: 20210615
 */

/** Icono personalizado para los marcadores */
const iconoMarcadores = L.icon({
    iconSize: [24, 48],
    iconUrl: './resources/marcadorL.svg'
});

/**
 * Objecto donde se agrupa la información de las distintas opciones que
 * tiene el usuario cuando vaya a agregar un nuevo POI. Se guarda la
 * información junto con un identificador.
 */
let infoNuevoContexto = {};


/**
 * Función para comprobar qué cuadrículas tiene que obtener del servidor.
 *
 * @param {LatLngBounds} zona Límites del mapa
 */
function calculaZonasParaDescargar(zona) {
    const pI = puntoInicio([zona.getNorth(), zona.getWest()]);
    const c = cuadriculas(pI, zona.getSouthEast());
    let pLng, pLat, puntoComprobacion, encontrado;
    faltan = 0;
    for (let i = 0; i < c.ch; i++) {
        pLng = pI.lng + (i * lado);
        for (let j = 0; j < c.cv; j++) {
            pLat = pI.lat - (j * lado);
            puntoComprobacion = L.latLng(pLat, pLng);
            encontrado = false;
            for (let zona of zonas) {
                if (zona.equals(puntoComprobacion)) {
                    encontrado = true;
                    break;
                }
            }
            if (!encontrado) {
                peticionZona(puntoComprobacion, zona);
            }
        }
    }
}

/**
 * Función para obtener el punto desde el que se va tiene que realizar las comprobaciones
 * de las áreas. Depende de la porción del mapa mostrado.
 *
 * @param {Array} puntos Array de dos elementos: la latitud más al norte y la longitud al
 * oeste.
 * @returns Punto desde que se tendría que comprobar las zonas
 */
function puntoInicio(puntos) {
    let s = [];
    let esquina, gradosMax;
    for (let i = 0; i < 2; i++) {
        esquina = (i == 0) ?
            posicionCyL.lat - Math.floor((posicionCyL.lat - puntos[i]) / lado) * lado :
            posicionCyL.lng - Math.ceil((posicionCyL.lng - puntos[i]) / lado) * lado;
        gradosMax = (i + 1) * 90;
        if (Math.abs(esquina) > gradosMax) {
            if (esquina > gradosMax) {
                esquina = gradosMax;
            } else {
                if (esquina < (-1 * gradosMax)) {
                    esquina = (-1 * gradosMax);
                }
            }
        }
        s.push(esquina);
    }
    return L.latLng(s[0], s[1]);
}

/**
 * Función para calcular el número de cuadrículas que se van a tener que comprobar
 * posteriormente.
 *
 * @param {LatLng} noroeste Posición al noroeste
 * @param {LatLng} sureste Posición al sueste
 * @returns Número de cuadrículas en vertical y horizontal que se muestran en el mapa
 * desde la posición inicial.
 */
function cuadriculas(noroeste, sureste) {
    return {
        cv: Math.ceil((noroeste.lat - sureste.lat) / lado),
        ch: Math.ceil((sureste.lng - noroeste.lng) / lado),
    };
}

/**
 * Función para obtener del servidor las zonas que no están almacenadas en el cliente.
 *
 * @param {LatLng} punto Posición desde la que se genera la zona en el servidor.
 * @param {LatLngBounds} zona Mapa mostrado
 */
function peticionZona(punto, zona) {
    const direccion = mustache.render(
        '{{{dirServ}}}/contexts?lat={{{lat}}}&long={{{lng}}}',
        { dirServ: direccionServidor, lat: punto.lat, lng: punto.lng });

    const opciones = {
        method: 'GET',
        redirect: 'follow'
    };

    ++faltan;

    fetch(direccion, opciones)
        .then(response => {
            switch (response.status) { //Compruebo el estado
                case 200: //Ok
                    return response.json();
                case 204: //Zona sin POIs. Paso un JSON vacío
                    return JSON.parse('{}');
                default: //Error. Por ahora no se lo muestro al user
                    return null;
            }
        })
        .then(result => {
            if (result) {
                let encontrado = false;
                for (let zona of zonas) {
                    if (zona.equals(punto)) {
                        encontrado = true;
                        break;
                    }
                }
                if (!encontrado) {
                    if (result.length > 0) {
                        for (let json of result) {
                            //Agrego la posición para que la carga de POIs sea inmediata
                            json.posicion = L.latLng(json.lat, json.long);
                            pois.push(json);
                        }
                    }
                    zonas.push(punto);
                }
            }
        })
        .catch(error => {
            /*notificaLateralError(mustache.render(
                'Se ha producido un error al descargar la zona: {{{error}}}',
                { error: error }));*/
            console.error('error', error)
        })
        .finally(() => { //Siempre decremento por si tengo que pintar
            faltan = (faltan <= 0) ? 0 : faltan - 1;
            if (faltan <= 0) {
                pintaPOIs(zona);
            }
        });
}

/**
 * Función para pintar los POIs de la zona del mapa que se muestra por
 * pantalla.
 *
 * @param {LatLngBounds} zona Zona que se está mostrando en la pantalla
 */
function pintaPOIs(zona) {
    if (faltan <= 0) {
        if (markers) {
            markers.clearLayers();
        } else {
            markers = L.markerClusterGroup(
                {//Icono personaliza para las agrupaciones
                    iconCreateFunction: (cluster) => {
                        const numeroHijos = cluster.getChildCount();
                        let tipo;
                        if (numeroHijos <= 7) {
                            tipo = '10';
                        } else {
                            if (numeroHijos <= 15) {
                                tipo = '25';
                            } else {
                                if (numeroHijos <= 40) {
                                    tipo = '50';
                                } else {
                                    tipo = '100';
                                }
                            }
                        }
                        return L.divIcon({
                            html: mustache.render('<div><span>{{{numeroHijos}}}</span></div>', { numeroHijos: numeroHijos }),
                            className: mustache.render('marker-cluster marker-cluster-{{{tipo}}}', { tipo: tipo }),
                            iconSize: new L.Point(40, 40)
                        });
                    },
                    maxClusterRadius: 40
                }
            );
        }
        let poi;
        for (let i = 0; i < pois.length; i++) {
            poi = pois[i];
            if (zona.contains(poi.posicion)) {
                markerPoP(poi);
            }
        }
        map.addLayer(markers);
    }
}

let modalInfo = false;
let modalPOI;
/**
 * Función para crear un marcador para un punto de interés.
 *
 * @param {JSONObject} poi Información del punto de interés
 */
function markerPoP(poi) {
    let marker = L.marker(poi.posicion, { icon: iconoMarcadores });
    marker.on('click', () => {
        const puntoInteresModal = document.getElementById('puntoInteres');
        modalPOI = new bootstrap.Modal(puntoInteresModal);
        tareasContexto(poi.ctx, poi);
        if (rol !== null && rol > 0) {
            document.getElementById('administracionPOI').removeAttribute('hidden');
        } else {
            document.getElementById('administracionPOI').setAttribute('hidden', true);
        }
        const titulo = document.getElementById('tituloPuntoInteres');
        titulo.innerText = poi.titulo;
        const imagen = document.getElementById('imagenPuntoInteres');
        const pieImagen = document.getElementById('licenciaImagenPuntoInteres');
        const enlaceLicencia = document.getElementById('enlaceLicenciaImagenPuntoInteres');
        if (poi.thumb) {
            if (poi.thumb.includes('http://')) {
                imagen.src = poi.thumb.replace('http://', 'https://');
            } else {
                imagen.src = poi.thumb;
            }
            if (poi.thumb.includes('/Special:FilePath/')) {
                let aux = poi.thumb.replace('/Special:FilePath/', '/File:').replace('http://', 'https://');
                enlaceLicencia.setAttribute('href', aux);
                pieImagen.hidden = false;
            } else {
                enlaceLicencia.setAttribute('href', '#');
                pieImagen.hidden = true;
            }
        } else {
            if (poi.imagen) {
                if (poi.imagen.includes('http://')) {
                    imagen.src = poi.imagen.replace('http://', 'https://');
                } else {
                    imagen.src = poi.imagen;
                }
                if (poi.imagen.includes('/Special:FilePath/')) {
                    let aux = poi.imagen.replace('/Special:FilePath/', '/File:').replace('http://', 'https://');
                    enlaceLicencia.setAttribute('href', aux);
                    pieImagen.hidden = false;
                } else {
                    enlaceLicencia.setAttribute('href', '#');
                    pieImagen.hidden = true;
                }
            } else {
                imagen.src = './resources/sinFoto.svg';
                enlaceLicencia.setAttribute('href', '#');
                pieImagen.hidden = true;
            }
        }
        imagen.style.display = 'inherit';

        if (poi.descr) {
            const descripcion = document.getElementById('descripcionPuntoInteres');
            descripcion.innerHTML = poi.descr.replaceAll('<a ', '<a target="_blank" ');
        }

        document.getElementById('cerrarModalMarcador').onclick = () => {
            modalPOI.hide();
            cerrarPI()
        };

        document.getElementById('eliminarPI').onclick = () => {
            confirmarEliminacion(poi, 'Eliminación punto de interés', '¿Estás seguro de eliminar el punto de interés?');
            modalPOI.hide();
        };

        document.getElementById('modificarPI').onclick = () => {
            modalPOI.hide();
            modificarPI(poi)
        };

        document.getElementById('agregarTarea').onclick = () => {
            modalPOI.hide();
            nuevaTarea(poi.ctx);
        }

        modalPOI.show();
    }, { once: true });
    markers.addLayer(marker);
}

/**
 * Función para cerrar la información del punto de interés.
 */
function cerrarPI() {
    const imagen = document.getElementById('imagenPuntoInteres');
    imagen.src = '';
    imagen.style.display = 'none';
}

/**
 * Función para mostrar un diálogo de confirmación de la acción de borrado
 *
 * @param {Object} poi Información del punto de interés a eliminar
 * @param {String} titulo Texto que se va a mostrar en la cabecera del modal
 * @param {String} mensaje Texto que se va a mostrar en el cuerpo del modal
 */
function confirmarEliminacion(poi, titulo, mensaje) {
    let modal = new bootstrap.Modal(document.getElementById('confirmarBorrar'));
    document.getElementById('tituloConfirmacion').innerHTML = titulo;
    document.getElementById('mensajeConfirmacion').innerHTML = mensaje;
    document.getElementById('aceptaBorrar').onclick = () => {
        modal.hide();
        eliminarPI(poi);
    };
    modal.show();
}

/**
 * Función para eliminar un punto de interés del sistema.
 *
 * @param {JSONObject} poi Información del punto de interés
 */
function eliminarPI(poi) {
    estadoBotones([], false);
    auth.currentUser.getIdToken()
        .then(idToken => {
            let cabeceras = new Headers();
            cabeceras.append("x-tokenid", idToken);
            const peticion = {
                headers: cabeceras,
                method: 'DELETE',
                redirect: 'follow'
            };
            const direccion = mustache.render(
                '{{{dir}}}',
                {
                    dir: recursoContextoParaElServidor(poi.ctx)
                }
            );

            let encontrado = false;
            let i;
            for (i = 0; i < pois.length; i++) {
                if (pois[i].ctx == poi.ctx) {
                    encontrado = true;
                    break;
                }
            }
            if (encontrado) {
                fetch(direccion, peticion)
                    .then(response => {
                        switch (response.status) {
                            case 200:
                                return { ok: 'ok' };
                            case 400:
                            case 401:
                            case 403:
                            case 404:
                                return response.text();
                            default:
                                notificaLateralError(mustache.render(
                                    'No se ha podido completar el borrado: {{{status}}}',
                                    { status: response.status }));
                                return null;
                        }
                    })
                    .then(result => {
                        if (result) {
                            if (typeof result === 'string') {
                                notificaLateralError(mustache.render('Error: {{{txt}}}', { txt: result }));
                            } else {
                                pois.splice(i, 1);
                                pintaPOIs(map.getBounds());
                                notificaLateral('Punto de interés eliminado.');
                            }
                        }
                        estadoBotones([], true);
                    })
                    .catch(error => {
                        estadoBotones([], true);
                        notificaLateralError(mustache.render(
                            'Se ha producido un error: {{{error}}}',
                            { error: error }));
                        console.error('error', error);
                    });
            } else {
                estadoBotones([], true);
                notificaLateralError('No se ha encontrado el POI en el almacén local.')
            }
        })
        .catch(error => {
            estadoBotones([], true);
            notificaLateralError('El usuario no se encuentra identificado. Inicie sesión.');
            console.error('error', error);
        });
}

/**
 * Función para modificar un punto de interés.
 * @param {JSONObject} poi Información que se tiene del punto de interés
 */
function modificarPI(poi) {
    const direccion = mustache.render(
        '{{{dir}}}',
        {
            dir: recursoContextoParaElServidor(poi.ctx)
        }
    );
    const options = {
        method: 'GET',
        redirect: 'follow'
    };

    fetch(direccion, options)
        .then(response => {
            switch (response.status) {
                case 200:
                    return response.json();
                default:
                    notificaLateralError(mustache.render(
                        'Se ha producido un error al intentar obtener la información del repositorio: {{{status}}}',
                        { status: response.status }));
                    return null;
            }
        })
        .then(datos => {
            if (datos) {
                document.getElementById("formNPI").reset();
                let modal = new bootstrap.Modal(document.getElementById('nuevoPuntoInteres'));
                const botonEnviar = document.getElementById('enviarNPI');
                document.getElementById('tituloModalNPI').innerText = 'Edición del punto de interés';

                const camposObligatorios = [
                    document.getElementById('tituloNPI'),
                    document.getElementById('descrNPI'),
                    document.getElementById('latitudNPI'),
                    document.getElementById('longitudNPI')
                ];
                const camposOpcionales = [
                    document.getElementById('fuentesNPI'),
                    document.getElementById('imagenNPI'),
                    document.getElementById('licenciaNPI')
                ];

                const nombresServ = {
                    tituloNPI: 'titulo',
                    descrNPI: 'descr',
                    latitudNPI: 'lat',
                    longitudNPI: 'long',
                    fuentesNPI: 'fuente',
                    imagenNPI: 'imagen',
                    licenciaNPI: 'license'
                };
                const campos = camposObligatorios.concat(camposOpcionales);
                let campoId;
                campos.forEach(campo => {
                    campoId = campo.id;
                    switch (campoId) {
                        case 'descrNPI':
                            if (nombresServ[campoId] in datos) {
                                campo.value = datos[nombresServ[campoId]];
                            } else {
                                campo.setAttribute('value', '');
                            }
                            break;
                        case 'latitudNPI':
                        case 'longitudNPI':
                            campo.removeAttribute('readonly');
                        default:
                            if (nombresServ[campoId] in datos) {
                                campo.setAttribute('value', datos[nombresServ[campoId]]);
                            } else {
                                campo.setAttribute('value', '');
                            }
                            break;
                    }
                });

                document.getElementById('cerrarModalNPI').onclick = (ev) => {
                    reseteaCamposValidador(campos);
                };

                botonEnviar.onclick = (ev) => {
                    //Primero compruebo que los datos son correctos.
                    //Tiene que tener título, descripción, latitud y longitud
                    estadoBotones([botonEnviar], false);
                    ev.preventDefault();

                    if (compruebaCamposModalNPI()) {
                        reseteaCamposValidador(campos);
                        //Tengo que comprobar qué campos ha modificado
                        let modificados = {};
                        campos.forEach(campo => {
                            campoId = campo.id;
                            let valor;
                            switch (campoId) {
                                case 'fuentesNPI':
                                    valor = '';
                                    if (campo.value.trim() !== '') {
                                        const vf = campo.value.trim().split(';');
                                        vf.forEach(f => {
                                            f = f.trim();
                                            if (valor === '') {
                                                valor += f;
                                            } else {
                                                valor += ' ;' + f;
                                            }
                                        });
                                    }
                                    break;
                                default:
                                    valor = campo.value.trim();
                                    break;
                            }
                            //Si la key no está en lo que envía el cliente será una creación.
                            //Para el resto de casos será una modificación o una eliminación (se envía un string vacío).
                            if (nombresServ[campoId] in datos) {
                                //Modificación o eliminación
                                if (datos[nombresServ[campoId]] !== valor) {
                                    modificados[nombresServ[campoId]] = valor;
                                }
                            } else {
                                //Creación
                                if (valor !== '') {
                                    modificados[nombresServ[campoId]] = valor;
                                }
                            }
                        });
                        if (Object.keys(modificados).length > 0) {
                            datos.iri = datos.ctx;
                            delete datos.ctx;
                            const enviar = JSON.stringify({
                                actual: datos,
                                modificados: modificados
                            });
                            auth.currentUser.getIdToken()
                                .then(idToken => {
                                    let headers = new Headers();
                                    headers.append('Content-Type', 'application/json');
                                    headers.append("x-tokenid", idToken);
                                    const opciones = {
                                        method: 'PUT',
                                        headers: headers,
                                        body: enviar,
                                        redirect: 'follow'
                                    };
                                    fetch(direccion, opciones)
                                        .then(response => {
                                            switch (response.status) {
                                                case 200:
                                                    return { codigo: 200, mensaje: 'OK' };
                                                case 400:
                                                case 403:
                                                case 404:
                                                case 503:
                                                    return response.text();
                                                default:
                                                    notificaLateralError(mustache.render(
                                                        'Se ha producido un error desconocido: {{{status}}}',
                                                        { status: response.status }));
                                                    return null;
                                            }
                                        })
                                        .then(resultado => {
                                            if (resultado !== null) {
                                                if (typeof resultado !== 'string') {
                                                    //POI modificado en el servidor
                                                    //Lo elimino de la memoria local
                                                    (Object.entries(modificados)).forEach(([modK, modV]) => {
                                                        if (modV === '' && (modK in poi)) {//Se elimina el valor
                                                            delete poi[modK];
                                                        } else {
                                                            poi[modK] = modV;
                                                        }
                                                    });
                                                    pois.some((p, i) => {
                                                        if (p.ctx === poi.ctx) {
                                                            pois.splice(i, 1);
                                                            return true;
                                                        } else {
                                                            return false;
                                                        }
                                                    });
                                                    //Lo vuelvo a agregar y pinto:
                                                    pois.push(poi);
                                                    pintaPOIs(map.getBounds());
                                                    modal.hide();
                                                    notificaLateral('Punto actualizado');
                                                } else {
                                                    notificaLateralError(resultado);
                                                }
                                            }
                                            estadoBotones([botonEnviar], true);
                                        })
                                        .catch(error => {
                                            notificaLateralError(mustache.render(
                                                'Se ha producido un error al actualizar el POI: {{{error}}}',
                                                { error: error }));
                                            console.error('error', error)
                                        });
                                })
                                .catch(error => {
                                    estadoBotones([botonEnviar], true);
                                    console.error(error);
                                    notificaLateralError('No se ha modificado ningún dato.');
                                });
                        } else {
                            estadoBotones([botonEnviar], true);
                            notificaLateral('No se ha modificado ningún dato');
                        }
                    } else {
                        estadoBotones([botonEnviar], true);
                    }
                };
                modal.show();
            }
        }, { once: true })
        .catch(error => {
            notificaLateralError(mustache.render(
                'Se ha producido un error al obtener la información del POI: {{{error}}}',
                { error: error }));
            console.error('error', error)
        });
}

/**
 * Función para crear un popup en el mapa cuando el usuario ha pulsado sobre el.
 *
 * @param {Object} pos Pulsación en el mapa
 */
function creacionNuevoContexto(pos) {
    const lat = Number((pos.latlng.lat).toFixed(5));
    const lng = Number((pos.latlng.lng).toFixed(5));
    const cabecera = mustache.render(
        '<h4>Punto ({{{lat}}},{{{lng}}})</h4>',
        { lat: lat, lng: lng });
    let ta = window.performance.now();
    infoNuevoContexto[ta] = { lat: lat, lng: lng };
    let cuerpo = mustache.render(
        '<div class="list-group"><a class="list-group-item list-group-item-action active" aria-current="true" href="javascript:modalNPI({{{ta}}});">Agregar nuevo POI</a></div>',
        { ta: ta });
    peticionCrafts(lat, lng, mustache.render('{{{cabecera}}}{{{cuerpo}}}', { cabecera: cabecera, cuerpo: cuerpo }));
    cuerpo = mustache.render(
        '{{{cuerpo}}}<div class="mt-2"><h6 style="text-align: left">Cargando puntos cercanos...</h6><div class="progress" style="height: 1px;"><div class="progress-bar" role="progressbar" style="width: 25%;" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div></div></div>',
        { cuerpo: cuerpo });
    popup = L.popup(
        autoClose = true,
        closeButton = false,
        maxWidth = 300
    ).setLatLng(pos.latlng).setContent(cabecera + cuerpo).openOn(map);
}

/**
 * Función para recuperar los puntos cercanos que existen cerca del punto donde haya pulsado
 * el usuario.
 *
 * @param {Float} lat Latitud origen
 * @param {Float} lng Longitud origen
 * @param {String} contenidoPopup Contenido que se está mostrando en el popup
 */
function peticionCrafts(lat, lng, contenidoPopup) {
    const myHeaders = new Headers();
    myHeaders.append('Authorization', mustache.render(
        'Bearer {{{token}}}',
        { token: tokenCraftLocalizarte }));
    let completadoEn = false;
    let completadoEs = false;
    let resultadosEn = null;
    let resultadosEs = null;
    let puntoOrigen = { lat: lat, lng: lng };

    const incr = (map.getMaxZoom() - map.getZoom() + 1) / 400;

    const direccionEn = mustache.render(
        'https://crafts.gsic.uva.es/apis/localizarteV2/query?id=places-en&latCenter={{{lat}}}&lngCenter={{{lng}}}&halfSideDeg={{{incr}}}&isNotType=http://dbpedia.org/ontology/PopulatedPlace&limit={{{lim}}}',
        {
            lat: lat,
            lng: lng,
            incr: incr,
            lim: 200
        }
    );
    const direccionEs = mustache.render(
        'https://crafts.gsic.uva.es/apis/localizarteV2/query?id=places-es&latCenter={{{lat}}}&lngCenter={{{lng}}}&halfSideDeg={{{incr}}}&isNotType=http://dbpedia.org/ontology/PopulatedPlace&limit={{{lim}}}',
        {
            lat: lat,
            lng: lng,
            incr: incr,
            lim: 200
        }
    );

    const requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    fetch(direccionEn, requestOptions)
        .then(response => {
            switch (response.status) {
                case 200:
                    return response.json();
                default:
                    notificaLateralError('Error en la obtención de los POIs de DBpedia.org');
                    return null;
            }
        })
        .then(result => {
            if (result && result.results.bindings.length > 0) {
                resultadosEn = parseadorResultadosSparql(result.head.vars, result.results.bindings);
            } else {
                resultadosEn = null;
            }
            completadoEn = true;
            sugerenciasGeneralesPois(resultadosEn, completadoEn, resultadosEs, completadoEs, puntoOrigen, contenidoPopup);
        })
        .catch(error => {
            resultadosEn = null; completadoEn = true;
            sugerenciasGeneralesPois(resultadosEn, completadoEn, resultadosEs, completadoEs, puntoOrigen, contenidoPopup);
            console.error('error', error);
        });

    fetch(direccionEs, requestOptions)
        .then(response => {
            switch (response.status) {
                case 200:
                    return response.json();
                default:
                    notificaLateralError('Error en la obtención de los POIs de es.DBpedia.org');
                    return null;
            }
        })
        .then(result => {
            if (result && result.results.bindings.length > 0) {
                resultadosEs = parseadorResultadosSparql(result.head.vars, result.results.bindings);
            } else {
                resultadosEs = null;
            }
            completadoEs = true;
            sugerenciasGeneralesPois(resultadosEn, completadoEn, resultadosEs, completadoEs, puntoOrigen, contenidoPopup);
        })
        .catch(error => {
            resultadosEn = null; completadoEn = true;
            sugerenciasGeneralesPois(resultadosEn, completadoEn, resultadosEs, completadoEs, puntoOrigen, contenidoPopup);
            console.error('error', error);
        });
}

/**
 * Función para pintar los lugares sugeridos cuando se ha completado la búsqueda en las distintas versiones
 * de la DBpedia.
 *
 * @param {Object} resultadosEn Resultados que se han obtenido de DBpedia
 * @param {Boolean} completadoEn Indica si se ha completado la petición a DBpedia
 * @param {Object} resultadosEs Resultados que se han obtenido de es.DBpedia
 * @param {Boolean} completadoEs Indica si se ha completado la petición a es.DBpedia
 * @param {Object} puntoOrigen Objeto con la latitud (lat) y longitud (lng) donde ha pulstado el usuario
 * @param {String} contenidoPopup Frase que se está mostrando en el popup
 */
function sugerenciasGeneralesPois(resultadosEn, completadoEn, resultadosEs, completadoEs, puntoOrigen, contenidoPopup) {
    if ((completadoEn && !completadoEs) || (!completadoEn && resultadosEs)) {
        if (popup && popup.isOpen()) {
            popup.setContent(mustache.render(
                '{{{contenidoPopup}}}<div class="mt-2"><h6 style="text-align:left">Cargando puntos cercanos...</h6><div class="progress" style="height: 1px;"><div class="progress-bar" role="progressbar" style="width: 60%;" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100"></div></div></div>',
                { contenidoPopup: contenidoPopup }));
        }
    } else {
        if (completadoEn && completadoEs) {
            const resultados = agrupaResultados(resultadosEn, resultadosEs);
            if (resultados) {
                const paraMostrar = masCercanos(puntoOrigen, resultados);
                popup.setContent(mustache.render(
                    '{{{contenidoPopup}}}<div class="mt-2"><h6 style="text-align:left">Cargando puntos cercanos...</h6><div class="progress" style="height: 1px;"><div class="progress-bar" role="progressbar" style="width: 80%;" aria-valuenow="80" aria-valuemin="0" aria-valuemax="100"></div></div></div>',
                    { contenidoPopup: contenidoPopup }));

                let puntosEn = [];
                let puntosEs = [];

                paraMostrar.forEach(ele => {
                    switch (ele.version) {
                        case 'es':
                            puntosEs.push({ punto: ele.place.replace('http://es.dbpedia.org/resource/', 'p:') });
                            break;
                        case 'en':
                            puntosEn.push({ punto: ele.place.replace('http://dbpedia.org/resource/', 'p:') });
                            break;
                        default:
                            break;
                    }
                });

                const myHeaders = new Headers();
                myHeaders.append('Authorization', mustache.render(
                    'Bearer {{{token}}}',
                    { token: tokenCraftLocalizarte }));
                let completadoEn = false;
                let completadoEs = false;
                let resultadosEn = null;
                let resultadosEs = null;
                let infoEs = null, infoEn = null;
                if (puntosEs.length > 0) {
                    infoEs = mustache.render(
                        'https://crafts.gsic.uva.es/apis/localizarteV2/resources?id=Place-es&ns=http://es.dbpedia.org/resource/&nspref=p{{#puntosEs}}&iris={{{punto}}}{{/puntosEs}}',
                        { puntosEs: puntosEs });
                } else {
                    completadoEs = true;
                }
                if (puntosEn.length > 0) {
                    infoEn = mustache.render(
                        'https://crafts.gsic.uva.es/apis/localizarteV2/resources?id=Place-en&ns=http://dbpedia.org/resource/&nspref=p{{#puntosEn}}&iris={{{punto}}}{{/puntosEn}}',
                        { puntosEn: puntosEn });
                } else {
                    completadoEn = true;
                }

                if (completadoEn && completadoEs) {
                    pintaSugerenciaPois(null, true, null, true, null, contenidoPopup);
                } else {
                    const requestOptions = {
                        method: 'GET',
                        headers: myHeaders,
                        redirect: 'follow'
                    };

                    if (infoEn) {
                        fetch(infoEn, requestOptions)
                            .then(response => {
                                switch (response.status) {
                                    case 200:
                                        return response.json();
                                    default:
                                        notificaLateralError('Error en la obtención de los POIs de DBpedia.org (info final)');
                                        return null;
                                }
                            })
                            .then(results => {
                                resultadosEn = results;
                                completadoEn = true;
                                pintaSugerenciasPois(resultadosEn, completadoEn, resultadosEs, completadoEs, paraMostrar, contenidoPopup);
                            })
                            .catch(error => {
                                resultadosEn = null; completadoEn = true;
                                pintaSugerenciasPois(resultadosEn, completadoEn, resultadosEs, completadoEs, paraMostrar, contenidoPopup);
                                console.error('error', error);
                            });
                    } else {
                        pintaSugerenciasPois(resultadosEn, completadoEn, resultadosEs, completadoEs, paraMostrar, contenidoPopup);
                    }
                    if (infoEs) {
                        fetch(infoEs, requestOptions)
                            .then(response => {
                                switch (response.status) {
                                    case 200:
                                        return response.json();
                                    default:
                                        notificaLateralError('Error en la obtención de los POIs de es.DBpedia.org (info final)');
                                        return null;
                                }
                            })
                            .then(results => {
                                resultadosEs = results;
                                completadoEs = true;
                                pintaSugerenciasPois(resultadosEn, completadoEn, resultadosEs, completadoEs, paraMostrar, contenidoPopup);
                            })
                            .catch(error => {
                                resultadosEs = null; completadoEs = true;
                                pintaSugerenciasPois(resultadosEn, completadoEn, resultadosEs, completadoEs, paraMostrar, contenidoPopup);
                                console.error('error', error);
                            });
                    } else {
                        pintaSugerenciasPois(resultadosEn, completadoEn, resultadosEs, completadoEs, paraMostrar, contenidoPopup);
                    }
                }
            } else {
                popup.setContent(mustache.render(
                    '{{{contenidoPopup}}}<div class="mt-2"><h6 style="text-align:left">No existen puntos para sugerir.</h6><div class="progress" style="height: 1px;"><div class="progress-bar" role="progressbar" style="width: 100%;" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div></div></div>',
                    { contenidoPopup: contenidoPopup }));
            }
        }
    }
}

function pintaSugerenciasPois(resultadosEn, completadoEn, resultadosEs, completadoEs, posicionPuntos, contenidoPopup) {
    if ((completadoEn && !completadoEs) || (!completadoEn && resultadosEs)) {
        if (popup && popup.isOpen()) {
            popup.setContent(mustache.render(
                '{{{contenidoPopup}}}<div class="mt-2"><h6 style="text-align:left">Cargando puntos cercanos...</h6><div class="progress" style="height: 1px;"><div class="progress-bar" role="progressbar" style="width: 90%;" aria-valuenow="90" aria-valuemin="0" aria-valuemax="100"></div></div></div>',
                { contenidoPopup: contenidoPopup }));
        }
    } else {
        if (completadoEn && completadoEs) {
            if (posicionPuntos) {
                const resultados = agrupaResultadosFinales(resultadosEn, resultadosEs, posicionPuntos);
                if (resultados) {
                    if (popup && popup.isOpen()) {
                        let nuevoContenido = '<div class="mt-3"><h6 style="text-align: left";>Agregar nuevo POI basado en:</h6><div class="list-group justify-content-center" style="max-width:280px;">';
                        let ta = window.performance.now(), etiqueta, lang;
                        resultados.forEach(lugar => {
                            infoNuevoContexto[ta] = lugar;
                            if (lugar.label.length > 0) {
                                lugar.label.some(l => {
                                    //const eti = l.label;
                                    lang = Object.keys(l)[0];
                                    etiqueta = Object.values(l)[0];
                                    if (lang === 'es')
                                        return true;
                                    return false;
                                });
                            } else {
                                etiqueta = Object.values(lugar.label)[0];
                            }
                            for (let index = 0; index < lugar.label.length; index++) {
                                const eti = lugar.label[index];
                                lang = Object.keys(eti)[0];
                                etiqueta = Object.values(eti)[0];
                                if (lang === 'es') {
                                    break;
                                }
                            }
                            nuevoContenido = mustache.render(
                                '{{{nuevoContenido}}}<a class="list-group-item list-group-item-action text-truncate" aria-current="true" href="javascript:modalNPI({{{ta}}});">{{{etiqueta}}}</a>',
                                {
                                    nuevoContenido: nuevoContenido,
                                    ta: ta,
                                    etiqueta: etiqueta
                                });
                            ++ta;
                        });
                        popup.setContent(mustache.render(
                            '{{{contenidoPopup}}}{{{nuevoContenido}}}</div></div>',
                            { contenidoPopup: contenidoPopup, nuevoContenido: nuevoContenido }));
                    }
                }
            }
        }
    }
}

function agrupaResultadosFinales(resultadosEn, resultadosEs, posicionPuntos) {
    let salida = null, todos = [], distancias = [];
    if (resultadosEn) {
        agregaPosicion(resultadosEn, posicionPuntos, 'en').forEach(ren => {
            todos.push(ren);
            distancias.push(ren.distancia);
        });
    }
    if (resultadosEs) {
        agregaPosicion(resultadosEs, posicionPuntos, 'es').forEach(res => {
            todos.push(res);
            distancias.push(res.distancia);
        });
    }

    if (todos.length > 0) {
        salida = [];
        distancias = distancias.sort((a, b) => a - b);
        distancias.forEach(d => {
            todos.some(t => {
                if (t.distancia === d) {
                    salida.push(t);
                    return true;
                }
                return false;
            });
        });
    }

    return salida;
}

function agregaPosicion(resultados, todosLosDatos, version) {
    let salida = [];
    let resultIri;
    resultados.forEach(result => {
        resultIri = result.iri;
        todosLosDatos.some(r => {
            if (r.version === version && resultIri === r.place) {
                result.lat = r.lat;
                result.lng = r.lng;
                result.distancia = r.distancia;
                result.version = r.version;
                salida.push(result);
            }
            return false;
        });
    });
    return salida;
}


/**
 * Función para agrupar los resultados obtenidos de las consultas a la DBpedia. Da preferencia
 * a los resultados de la versión española (compara por iri y etiqueta).
 *
 * @param {Object} resultadosEn Resultados de la versión internacional
 * @param {Object} resultadosEs Resultados de la versión española.
 * @returns Resultados agrupados y aplicado la preferencia por la española.
 */
function agrupaResultados(resultadosEn, resultadosEs) {
    let salida = [];

    if (!resultadosEn && !resultadosEs) {
        salida = null;
    } else {
        if (resultadosEn && !resultadosEs) {
            resultadosEn.forEach(r => {
                r.version = 'en';
                salida.push(r);
            });
        } else {
            if (!resultadosEn && resultadosEs) {
                resultadosEs.forEach(r => {
                    r.version = 'es';
                    salida.push(r);
                });
            } else {
                resultadosEs.forEach(r => {
                    r.version = 'es';
                    salida.push(r);
                });
                resultadosEn.forEach(r => {
                    //Tengo que comprobar que la versión en Inglés no me devuelva algo que ya tengo en la española
                    let iri = r['place'];
                    let encontrado = false;
                    resultadosEs.some(ven => {
                        if (ven['place'] === iri) {
                            encontrado = true;
                            return true;
                        }
                        return false;
                    });
                    if (!encontrado) {
                        r.version = 'en';
                        salida.push(r);
                    }
                });
            }
        }
    }

    return salida;
}

/**
 * Función para pasar al modal la información sobre la selección del usuario
 * que ha realizado sobre el popup utilizado para agregar POIs.
 *
 * @param {Number} id Identificador de la opción seleccionada por el usuario
 * @returns Datos de la opción seleccionada por el usuario
 */
function datosNuevoContexto(id) {
    const datos = infoNuevoContexto[id];
    infoNuevoContexto = {};
    return datos;
}

/**
 * Función para crear el modal para la creación de un punto de interés. Carga la información
 * que se le pase mediante el identificador en el formulario.
 *
 * @param {Number} id Identificador de los datos en el vector infoNuevoContexto
 */
function modalNPI(id) {
    const datos = datosNuevoContexto(id);
    if (popup && popup.isOpen()) {
        document.getElementById("formNPI").reset();
        popup.remove();
        let modal = new bootstrap.Modal(document.getElementById('nuevoPuntoInteres'));
        const botonEnviar = document.getElementById('enviarNPI');
        document.getElementById('tituloModalNPI').innerText = 'Nuevo punto de interés';


        const camposObligatorios = [
            document.getElementById('tituloNPI'),
            document.getElementById('descrNPI'),
            document.getElementById('latitudNPI'),
            document.getElementById('longitudNPI')
        ];
        const camposOpcionales = [
            document.getElementById('fuentesNPI'),
            document.getElementById('licenciaNPI'),
            document.getElementById('imagenNPI')
        ];

        const imagenLicencia = [
            { imagen: document.getElementById('imagenNPI') },
            { licencia: document.getElementById('licenciaNPI') }
        ];

        const nombresServ = {
            tituloNPI: 'label',
            descrNPI: 'comment',
            latitudNPI: 'lat',
            longitudNPI: 'lng',
            fuentesNPI: 'iri',
            imagenNPI: 'image',
            licenciaNPI: 'license'
        };

        const campos = camposObligatorios.concat(camposOpcionales);
        let campoId, dato;
        campos.forEach(campo => {
            campoId = campo.id;
            switch (campoId) {
                case 'licenciaNPI'://Ahora puede venir dentro de la imagen
                    if (nombresServ[campoId] in datos) {
                        campo.setAttribute('value', datos[nombresServ[campoId]]);
                    } else {
                        if (datos.image && datos.image.length > 0) {
                            break;
                        } else {
                            campo.setAttribute('value', '');
                        }
                    }
                    break;
                case 'descrNPI':
                    if (nombresServ[campoId] in datos) {
                        dato = datos[nombresServ[campoId]];
                        if (dato.length && dato.length > 0) {//Más de un idioma
                            dato.some(d => {
                                campo.value = Object.values(d)[0];
                                if (Object.keys(d)[0] === 'es') {
                                    return true;
                                }
                                return false;
                            });
                        } else {
                            if (typeof dato !== 'string') {
                                campo.value = Object.values(dato)[0];
                            } else {
                                campo.value = dato;
                            }
                        }
                    } else {
                        campo.value = '';
                    }
                    break;
                case 'tituloNPI':
                    if (nombresServ[campoId] in datos) {
                        dato = datos[nombresServ[campoId]];
                        if (dato.length && dato.length > 0) {//Más de un idioma
                            dato.some(d => {
                                campo.setAttribute('value', Object.values(d)[0]);
                                if (Object.keys(d)[0] === 'es') {
                                    return true;
                                }
                                return false;
                            });
                        } else {
                            if (typeof dato !== 'string') {
                                campo.setAttribute('value', Object.values(dato)[0]);
                            } else {
                                campo.setAttribute('value', dato);
                            }
                        }
                    } else {
                        campo.setAttribute('value', '');
                    }
                    break;
                case 'imagenNPI':
                    if (nombresServ[campoId] in datos) {
                        dato = datos.image;
                        if (dato.length && dato.length > 0) {
                            document.getElementById('imagenNPI').setAttribute('value', dato.iri);
                            document.getElementById('licenciaNPI').setAttribute('value', dato.rights);

                        } else {
                            if (typeof dato !== 'string') {
                                document.getElementById('imagenNPI').setAttribute('value', dato.iri);
                                if (dato.iri.includes('commons.wikimedia.org/wiki/Special:FilePath')) {
                                    document.getElementById('licenciaNPI').setAttribute('value', dato.iri.replace('commons.wikimedia.org/wiki/Special:FilePath/', 'commons.wikimedia.org/wiki/File:').replaceAll('?width=300', ''));
                                }
                            } else {
                                document.getElementById('imagenNPI').setAttribute('value', dato);
                                if (dato.iri.includes('commons.wikimedia.org/wiki/Special:FilePath')) {
                                    document.getElementById('licenciaNPI').setAttribute('value', dato.iri.replace('commons.wikimedia.org/wiki/Special:FilePath/', 'commons.wikimedia.org/wiki/File:').replaceAll('?width=300', ''));
                                }
                            }
                        }
                    } else {
                        document.getElementById('imagenNPI').setAttribute('value', '');
                        document.getElementById('licenciaNPI').setAttribute('value', '');
                    }
                    break
                case 'latitudNPI':
                case 'longitudNPI':
                    campo.setAttribute('readonly', true);
                default:
                    if (nombresServ[campoId] in datos) {
                        campo.setAttribute('value', datos[nombresServ[campoId]]);
                    } else {
                        campo.setAttribute('value', '');
                    }
                    break;
            }
        });

        document.getElementById('cerrarModalNPI').onclick = (ev) => {
            reseteaCamposValidador(campos);
        };

        botonEnviar.onclick = (ev) => {
            ev.preventDefault();
            estadoBotones([botonEnviar], false);

            if (compruebaCamposModalNPI()) {
                reseteaCamposValidador(campos);
                const idsParaServ = {
                    tituloNPI: 'titulo',
                    descrNPI: 'descr',
                    latitudNPI: 'lat',
                    longitudNPI: 'long',
                    fuentesNPI: 'fuentes',
                    imagenNPI: 'imagen',
                    licenciaNPI: 'license'
                };
                let envio = {};
                campos.forEach(campo => {
                    campoId = campo.id;
                    switch (campoId) {
                        case 'latitudNPI':
                        case 'longitudNPI':
                            envio[idsParaServ[campoId]] = Number(campo.value.trim());
                            break;
                        case 'fuentesNPI':
                            if (campo.value.trim() !== '') {
                                const vf = campo.value.trim().split(';');
                                let ele;
                                let fu = [];
                                vf.forEach(elem => {
                                    ele = elem.trim();
                                    if (ele && ele !== '') {
                                        fu.push({
                                            //type: (validURL(ele) ? 'url' : 'string'),
                                            fuente: ele
                                        });
                                    }
                                });
                                if (fu.length > 0) {
                                    envio[idsParaServ[campoId]] = fu;
                                }
                            }
                            break;
                        case 'tituloNPI':
                        case 'descrNPI':
                            envio[idsParaServ[campoId]] = [{
                                lang: 'es',
                                value: campo.value.trim()
                            }];
                            dato = datos[nombresServ[campoId]];
                            if (dato && dato.length && dato.length > 0) {//Más de un idioma
                                dato.some(d => {
                                    if (Object.keys(d)[0] !== 'es') {
                                        envio[idsParaServ[campoId]].push({
                                            lang: Object.keys(d)[0],
                                            value: Object.values(d)[0]
                                        });
                                    }
                                });
                            }
                            break;
                        default:
                            if (campo.value.trim() !== '') {
                                envio[idsParaServ[campoId]] = campo.value.trim();
                            }
                            break;
                    }
                });

                //Envío los datos al servidor para que los agregue
                const direccion = mustache.render(
                    '{{{direccionServidor}}}/contexts',
                    { direccionServidor: direccionServidor }
                );
                auth.currentUser.getIdToken()
                    .then(idToken => {
                        let myHeaders = new Headers();
                        myHeaders.append("Content-Type", "application/json");
                        myHeaders.append("x-tokenid", idToken);
                        const requestOptions = {
                            method: 'POST',
                            headers: myHeaders,
                            body: JSON.stringify({ datos: envio }),
                            redirect: 'follow',
                        };
                        fetch(direccion, requestOptions)
                            .then(response => {
                                switch (response.status) {
                                    case 201:
                                        return response.json();
                                    case 400:
                                        notificaLateralError('No se han enviado los datos obligatorios o la latitud y la longitud no son números válidos. El POI no se ha creado.');
                                        return null;
                                    case 409:
                                        notificaLateralError('Se ha producido un conflicto al crear el identificador del nuevo POI. El POI no se ha creado.');
                                        return null;
                                    case 500:
                                        notificaLateralError('Se ha producido una excepción en el servidor. El POI no se ha creado.');
                                        return null;
                                    case 503:
                                        notificaLateralError('El repositorio del sistema no se encuentra en estos momentos operativo. El POI no se ha creado.');
                                        return null;
                                    default:
                                        return null;
                                }
                            })
                            .then(data => {
                                if (data) {
                                    peticionInfoPoi(data.ctx, true, modal);
                                } else {
                                    estadoBotones([botonEnviar], true);
                                }
                            })
                            .catch(error => {
                                estadoBotones([botonEnviar], true);
                                notificaLateralError('Se ha producido un error en la transmisión. El POI no se ha creado.');
                                console.error('error', error);
                            });
                    })
                    .catch(error => {
                        estadoBotones([botonEnviar], true);
                        notificaLateralError('Se ha producido un error.');
                        console.error(error);
                    })
            } else {
                estadoBotones([botonEnviar], true);
            }
        };
        modal.show();
    }
}

function compruebaCamposModalNPI() {
    const latitud = document.getElementById('latitudNPI');
    const longitud = document.getElementById('longitudNPI');

    const camposObligatorios = [
        document.getElementById('tituloNPI'),
        document.getElementById('descrNPI'),
        latitud,
        longitud
    ];
    const camposOpcionales = [
        document.getElementById('fuentesNPI'),
        document.getElementById('licenciaNPI'),
        document.getElementById('imagenNPI')
    ];

    let todoOk = true;
    const mensajes = {
        tituloNPI: 'El punto de interés necesita un título',
        descrNPI: 'El punto de interés necesita una descripción',
        latitudNPI: 'El punto necesita una latitud',
        longitudNPI: 'El punto necesita una longitud',
        imagenNPI: 'La imagen se tiene que proporcionar a través de una URL',
        licenciaNPI: 'La licencia de la imagen puede ser texto o URL',
        fuentesNPI: 'Las fuentes de información pueden ser texto o URL'
    };
    camposObligatorios.forEach(campo => {
        if (!campo || !campo.value || campo.value.trim() === '') {
            todoOk = false;
            campo.placeholder = mensajes[campo.id];
            document.getElementById(campo.id + 'Invalid').innerHTML = mensajes[campo.id];
            campo.className = 'form-control is-invalid';
        } else {
            document.getElementById(campo.id + 'Invalid').innerHTML = '';
            campo.className = 'form-control is-valid';
        }
    });
    camposOpcionales.forEach(campo => {
        if (campo.id === 'imagenNPI') {
            if (campo.value && campo.value.trim() !== '' && !validIRI(campo.value.trim())) {
                todoOk = false;
                document.getElementById(campo.id + 'Invalid').innerHTML = mensajes[campo.id];
                campo.placeholder = mensajes[campo.id];
                campo.value = '';
                campo.className = 'form-control is-invalid';
            }
        } else {
            if (campo.value && campo.value.trim() !== '') {
                document.getElementById(campo.id + 'Invalid').innerHTML = '';
                campo.className = 'form-control is-valid';
            }
        }
    });

    let lat, long;
    if (todoOk) {
        lat = Number(latitud.value.trim());
        if (lat < -90 || lat > 90) {
            todoOk = false;
            latitud.className = 'form-control is-invalid';
            document.getElementById(latitud.id + 'Invalid').innerHTML = mensajes[latitud.id];
        } else {
            latitud.className = 'form-control is-valid';
            document.getElementById(latitud.id + 'Invalid').innerHTML = '';
        }
        if (todoOk) {
            long = Number(longitud.value.trim());
            if (long < -180 || long > 180) {
                todoOk = false;
                longitud.className = 'form-control is-invalid';
                document.getElementById(longitud.id + 'Invalid').innerHTML = mensajes[longitud.id];
            } else {
                longitud.className = 'form-control is-valid';
                document.getElementById(longitud.id + 'Invalid').innerHTML = '';
            }
        }
    }
    return todoOk;
}

/**
 * Solicitud para la obtención de toda la información de un POI
 *
 * @param {String} iri Identificador del POI
 * @param {Boolean} guardaPinta Indica si se tiene que llamar para
 * volver a pintar los marcadores del mapa y guardar el resultado
 * en la caché. Con false se devuelve la info del servidor.
 * @param {Object} modal Modal que se debe ocultar cuando se finalice la petición.
 */
function peticionInfoPoi(iri, guardaPinta, modal) {
    const direccion = recursoContextoParaElServidor(iri);
    const options = {
        method: 'GET',
        redirect: 'follow'
    };

    fetch(direccion, options)
        .then(response => {
            switch (response.status) {
                case 200:
                    return response.json();
                case 404: //No existía
                    return JSON.parse({});
                default:
                    return null;
            }
        })
        .then(result => {
            if (result) {
                if (guardaPinta) {
                    result.posicion = L.latLng(result.lat, result.long);
                    pois.push(result);
                    pintaPOIs(map.getBounds());
                    modal.hide();
                    notificaLateral('Punto de interés creado.');
                }
            }
            estadoBotones([document.getElementById('enviarNPI')], true);
        })
        .catch(error => {
            notificaLateralError(mustache.render(
                'Se ha producido un error al descargar la información del POI: {{{error}}}',
                { error: error }));
            estadoBotones([document.getElementById('enviarNPI')], true);
            console.error('error', error)
        });
}
