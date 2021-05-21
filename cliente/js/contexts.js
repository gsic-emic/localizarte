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
 * version: 20210520
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
                if (result.length > 0) {
                    for (let json of result) {
                        //Agrego la posición para que la carga de POIs sea inmediata
                        json.posicion = L.latLng(json.lat, json.long);
                        pois.push(json);
                    }
                }
                zonas.push(punto);
            }
        })
        .catch(error => {
            notificaLateralError('Se ha producido un error al descargar la zona: ' + error);
            console.log('error', error)
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
                        let tipo = 'marker-cluster marker-cluster-';
                        const numeroHijos = cluster.getChildCount();
                        if (numeroHijos <= 10) {
                            tipo += '10';
                        } else {
                            if (numeroHijos <= 25) {
                                tipo += '25';
                            } else {
                                if (numeroHijos <= 50) {
                                    tipo += '50';
                                } else {
                                    tipo += '100';
                                }
                            }
                        }
                        return L.divIcon({ html: '<div><span>' + numeroHijos + '<span></div>', className: tipo, iconSize: new L.Point(40, 40) });
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

/**
 * Función para crear un marcador para un punto de interés.
 * 
 * @param {JSONObject} poi Información del punto de interés
 */
function markerPoP(poi) {
    let marker = L.marker(poi.posicion, { icon: iconoMarcadores });
    marker.on('click', () => {
        const puntoInteresModal = document.getElementById('puntoInteres');
        const modal = new bootstrap.Modal(puntoInteresModal);
        tareasContexto(poi.ctx);
        const titulo = document.getElementById('tituloPuntoInteres');
        titulo.innerText = poi.titulo;
        const imagen = document.getElementById('imagenPuntoInteres');
        if (poi.thumb) {
            imagen.src = poi.thumb;
        } else {
            if (poi.imagen) {
                imagen.src = poi.imagen;
            } else {
                imagen.src = './resources/sinFoto.svg';
            }
        }
        imagen.style.display = 'inherit';


        if (poi.descr) {
            const descripcion = document.getElementById('descripcionPuntoInteres');
            descripcion.innerHTML = poi.descr.replaceAll('<a ', '<a target="_blank" ');
        }

        document.getElementById('cerrarModalMarcador').onclick = () => {
            modal.hide();
            cerrarPI()
        };
        document.getElementById('eliminarPI').onclick = () => {
            confirmarEliminacion(poi, 'Eliminación punto de interés', '¿Estás seguro de eliminar el punto de interés?');
            modal.hide();
        };
        document.getElementById('modificarPI').onclick = () => {
            modal.hide();
            modificarPI(poi)
        };
        modal.show();
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
    const direccion = recursoContextoParaElServidor(poi.ctx);
    const peticion = {
        method: 'DELETE',
        redirect: 'follow'
    };

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
                if (response.status === 200) {
                    return response.text();
                }
                notificaLateralError('No se ha podido completar el borrado: ' + response.status);
                return null;
            })
            .then(result => {
                if (result) {
                    pois.splice(i, 1);
                    pintaPOIs(map.getBounds());
                    notificaLateral('Punto de interés eliminado.');
                }
            })
            .catch(error => {
                notificaLateralError('Se ha producido un error: ' + error);
                console.log('error', error)
            });
    }
}

/**
 * Función para modificar un punto de interés.
 * @param {JSONObject} poi Información que se tiene del punto de interés
 */
function modificarPI(poi) {
    const direccion = recursoContextoParaElServidor(poi.ctx);
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
                    notificaLateralError('Se ha producido un error al intentar obtener la información del repositorio: ' + response.status);
                    return null;
            }
        })
        .then(datos => {
            if (datos) {
                document.getElementById("formNPI").reset();
                let modal = new bootstrap.Modal(document.getElementById('nuevoPuntoInteres'));
                const latitud = document.getElementById('latitudNPI');
                const longitud = document.getElementById('longitudNPI');
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
                    ev.preventDefault();
                    let todoOk = true;
                    const mensajes = {
                        tituloNPI: 'El nuevo punto de interés necesita un título',
                        descrNPI: 'El punto de interés necesita una descripción',
                        latitudNPI: 'El punto necesita una latitud',
                        longitudNPI: 'El punto necesita una longitud',
                        imagenNPI: 'La imagen se tiene que proporcionar a través de una URL',
                        licenciaNPI: 'La licencia de la imagen puede ser texto o URL',
                        fuentesNPI: 'Las fuentes de información puden ser texto o URL'
                    };
                    camposObligatorios.forEach(campo => {
                        if (!campo || !campo.value || campo.value.trim() === '') {
                            todoOk = false;
                            campo.placeholder = mensajes[campo.id];
                            campo.className = 'form-control is-invalid';
                        } else {
                            campo.className = 'form-control is-valid';
                        }
                    });

                    camposOpcionales.forEach(campo => {
                        if (campo.id === 'imagenNPI') {
                            if (campo.value && campo.value.trim() !== '' && !validURL(campo.value.trim())) {
                                todoOk = false;
                                campo.placeholder = mensajes[campo.id];
                                campo.value = '';
                                campo.className = 'form-control is-invalid';
                            }
                        } else {
                            if(campo.value && campo.value.trim() !== '') {
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
                        } else {
                            latitud.className = 'form-control is-valid';
                        }
                        if (todoOk) {
                            long = Number(longitud.value.trim());
                            if (long < -180 || long > 180) {
                                todoOk = false;
                                longitud.className = 'form-control is-invalid';
                            } else {
                                longitud.className = 'form-control is-valid';
                            }
                        }
                    }
                    if (todoOk) {
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
                            let headers = new Headers();
                            headers.append('Content-Type', 'application/json');
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
                                            return 'OK';
                                        case 404:
                                            notificaLateralError('El POI no existe en el repositorio');
                                            return null;
                                        case 400:
                                            notificaLateralError('El formato de los datos enviados no es válido.');
                                            return null;
                                        case 500:
                                            notificaLateralError('Error interno del servidor');
                                            return null;
                                        case 503:
                                            notificaLateralError('El repositorio no puede atender a esta petición en este momento.');
                                        default:
                                            notificaLateralError('Se ha producido un error desconocido: ' + response.status);
                                            return null;
                                    }
                                })
                                .then(resultado => {
                                    if (resultado) {
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
                                    }
                                })
                                .catch(error => {
                                    notificaLateralError('Se ha producido un error al actualizar el POI: ' + error);
                                    console.log('error', error)
                                });
                        } else {
                            notificaLateral('No se ha modificado ningún dato');
                        }
                    }
                };
                modal.show();
            }
        }, { once: true })
        .catch(error => {
            notificaLateralError('Se ha producido un error al obtener la información del POI: ' + error);
            console.log('error', error)
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
    const cabecera = '<h4>Punto (' + lat + ', ' + lng + ')</h4>';
    let ta = window.performance.now();
    infoNuevoContexto[ta] = { lat: lat, lng: lng };
    let cuerpo = '<div class="list-group">'
        + '<a class="list-group-item list-group-item-action active" aria-current="true" href="javascript:modalNPI(' + ta + ');">Agregar nuevo POI</a>'
        + '</div>';
    peticionCrafts(lat, lng, cabecera + cuerpo);
    cuerpo = cuerpo + '<div class="mt-2"><h6 style="text-align: left">Cargando puntos cercanos...</h6><div class="progress" style="height: 1px;"><div class="progress-bar" role="progressbar" style="width: 25%;" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div></div></div>';
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
    myHeaders.append('Authorization', 'Bearer ' + tokenCraftLocalizarte);
    let completadoEn = false;
    let completadoEs = false;
    let resultadosEn = null;
    let resultadosEs = null;
    let puntoOrigen = { lat: lat, lng: lng };

    const direccionEn = mustache.render(
        'https://crafts.gsic.uva.es/apis/localizarte/query?id=places-en&latCenter={{{lat}}}&lngCenter={{{lng}}}&halfSideDeg={{{incr}}}&limit={{{lim}}}',
        { lat: lat, lng: lng, incr: 0.005, lim: 20 });
    const direccionEs = mustache.render(
        'https://crafts.gsic.uva.es/apis/localizarte/query?id=places-es&latCenter={{{lat}}}&lngCenter={{{lng}}}&halfSideDeg={{{incr}}}&limit={{{lim}}}',
        { lat: lat, lng: lng, incr: 0.005, lim: 20 });

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
            pintaSugerenciaPois(resultadosEn, completadoEn, resultadosEs, completadoEs, puntoOrigen, contenidoPopup);
        })
        .catch(error => {
            resultadosEn = null; completadoEn = true;
            pintaSugerenciaPois(resultadosEn, completadoEn, resultadosEs, completadoEs, puntoOrigen, contenidoPopup);
            console.log('error', error);
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
            pintaSugerenciaPois(resultadosEn, completadoEn, resultadosEs, completadoEs, puntoOrigen, contenidoPopup);
        })
        .catch(error => {
            resultadosEn = null; completadoEn = true;
            pintaSugerenciaPois(resultadosEn, completadoEn, resultadosEs, completadoEs, puntoOrigen, contenidoPopup);
            console.log('error', error);
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
function pintaSugerenciaPois(resultadosEn, completadoEn, resultadosEs, completadoEs, puntoOrigen, contenidoPopup) {
    if ((completadoEn && !completadoEs) || (!completadoEn && resultadosEs)) {
        if (popup && popup.isOpen()) {
            popup.setContent(contenidoPopup + '<div class="mt-2"><h6 style="text-align:left">Cargando puntos cercanos...</h6><div class="progress" style="height: 1px;"><div class="progress-bar" role="progressbar" style="width: 60%;" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100"></div></div></div>');
        }
    } else {
        if (completadoEn && completadoEs) {
            const resultados = agrupaResultados(resultadosEn, resultadosEs);
            if (resultados) {
                const paraMostrar = masCercanos(puntoOrigen, resultados);
                if (popup && popup.isOpen()) {
                    let nuevoContenido = '<div class="mt-3"><h6 style="text-align: left";>Agregar nuevo POI basado en:</h6><div class="list-group justify-content-center" style="max-width:280px;">';
                    let ta = window.performance.now();
                    paraMostrar.forEach(lugar => {
                        infoNuevoContexto[ta] = lugar;
                        nuevoContenido += '<a class="list-group-item list-group-item-action text-truncate" aria-current="true" href="javascript:modalNPI(' + ta + ');">' + lugar['lab'] + '</a>';
                        ++ta;
                    });
                    nuevoContenido += '</div></div>';
                    popup.setContent(contenidoPopup + nuevoContenido);
                }
            } else {
                popup.setContent(contenidoPopup + '<div class="mt-2"><h6 style="text-align:left">No existen puntos para sugerir.</h6><div class="progress" style="height: 1px;"><div class="progress-bar" role="progressbar" style="width: 100%;" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div></div></div>');
            }
        }
    }
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
    if (resultadosEn && !resultadosEs)
        return resultadosEn;
    if (!resultadosEn && resultadosEs)
        return resultadosEs;
    if (!resultadosEn && !resultadosEs)
        return null;
    let resultados = [];
    resultadosEs.forEach(r => resultados.push(r));
    resultadosEn.forEach(r => {
        //Tengo que comprobar que la versión en Inglés no me devuelva algo que ya tengo en la española
        let iri = r['place'];
        let lab = r['lab'];
        let encontrado = false;
        resultadosEs.some(ven => {
            if (ven['place'] === iri || ven['lab'] === lab) {
                encontrado = true;
                return true;
            }
            return false;
        });
        if (!encontrado)
            resultados.push(r);
    });
    return resultados;
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
 * Función para establecer la clase de un conjunto de objetos a form-control (formularios).
 * 
 * @param {Array} campos Array con las referencias de los objetos del formulario.
 */
function reseteaCamposValidador(campos) {
    campos.forEach(campo => {
        campo.className = 'form-control';
    });
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
        const latitud = document.getElementById('latitudNPI');
        const longitud = document.getElementById('longitudNPI');
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
            document.getElementById('imagenNPI'),
            document.getElementById('licenciaNPI')
        ];

        const nombresServ = {
            tituloNPI: 'lab',
            descrNPI: 'com',
            latitudNPI: 'lat',
            longitudNPI: 'lng',
            fuentesNPI: 'place',
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
                        campo.value = '';
                    }
                    break;
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
            let todoOk = true;
            const mensajes = {
                tituloNPI: 'El nuevo punto de interés necesita un título',
                descrNPI: 'El punto de interés necesita una descripción',
                latitudNPI: 'El punto necesita una latitud',
                longitudNPI: 'El punto necesita una longitud',
                imagenNPI: 'La imagen se tiene que proporcionar a través de una URL',
                licenciaNPI: 'La licencia de la imagen puede ser texto o URL',
                fuentesNPI: 'Las fuentes de información puden ser texto o URL'
            };
            camposObligatorios.forEach(campo => {
                if (!campo || !campo.value || campo.value.trim() === '') {
                    todoOk = false;
                    campo.placeholder = mensajes[campo.id];
                    campo.className = 'form-control is-invalid';
                } else {
                    campo.className = 'form-control is-valid';
                }
            });
            camposOpcionales.forEach(campo => {
                if (campo.id === 'imagenNPI') {
                    if (campo.value && campo.value.trim() !== '' && !validURL(campo.value.trim())) {
                        todoOk = false;
                        campo.placeholder = mensajes[campo.id];
                        campo.value = '';
                        campo.className = 'form-control is-invalid';
                    }
                } else {
                    if(campo.value && campo.value.trim() !== '') {
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
                } else {
                    latitud.className = 'form-control is-valid';
                }
                if (todoOk) {
                    long = Number(longitud.value.trim());
                    if (long < -180 || long > 180) {
                        todoOk = false;
                        longitud.className = 'form-control is-invalid';
                    } else {
                        longitud.className = 'form-control is-valid';
                    }
                }
            }
            if (todoOk) {
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
                                            type: (validURL(ele) ? 'url' : 'string'),
                                            value: ele
                                        });
                                    }
                                });
                                if (fu.length > 0) {
                                    envio[idsParaServ[campoId]] = fu;
                                }
                            }
                            break;
                        default:
                            if (campo.value.trim() !== '') {
                                envio[idsParaServ[campoId]] = campo.value.trim();
                            }
                            break;
                    }
                });
                //TODO cambiar el autor por el del usuario
                envio.autor = 'pablogz@gsic.uva.es';

                //Envío los datos al servidor para que los agregue
                let direccion = direccionServidor + '/contexts';
                let myHeaders = new Headers();
                myHeaders.append("Content-Type", "application/json");
                const requestOptions = {
                    method: 'POST',
                    headers: myHeaders,
                    body: JSON.stringify(envio),
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
                        }
                    })
                    .catch(error => {
                        notificaLateralError('Se ha producido un error en la transmisión. El POI no se ha creado.');
                        console.log('error', error);
                    });
            }
        };
        modal.show();
    }
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
        })
        .catch(error => {
            notificaLateralError('Se ha producido un error al descargar la información del POI: ' + error);
            console.log('error', error)
        });
}