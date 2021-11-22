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
 * version: 20211112
 */

/**
 * Función para crear un IRI capaz de resolver por el servidor para manejar un contexto específico.
 * 
 * @param {String} iri IRI del contexto
 * @returns Identificador formateado
 */
function recursoContextoParaElServidor(iri) {
    return iri.replace('https://casuallearn.gsic.uva.es/context/', `${direccionServidor}/contexts/`);
}

function recursoTareaParaElServidor(iri) {
    return iri.replace('https://casuallearn.gsic.uva.es/', `${direccionServidor}/tasks/`);
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

/**
 * Función para comprobar que un email puede ser válido. Obtenida de: https://stackoverflow.com/a/46181
 * 
 * @param {String} email 
 * @returns Verdadero si la dirección de correo tiene un formato correcto.
 */
function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Función para activar o desactivar los botones de un modal.
 * 
 * @param {Array} botones Vector con los botones que se van activar o desactivar.
 * @param {Boolean} activar Indica si los botones tienen que estar activos y spinner oculto (true) o al revés (false)
 */
function estadoBotones(botones, activar) {
    if (botones) {
        botones.forEach(boton => {
            boton.disabled = !activar;
        });
        if (activar) {
            spinnerCentro.className = 'centroOFF';
        } else {
            spinnerCentro.className = 'centroON';
        }
    }
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

function conversionTipoTareaSC(valor) {
    switch (valor) {
        case 'https://casuallearn.gsic.uva.es/answerType/multiplePhotos':
            return 'tRMultiFotos';
        case 'https://casuallearn.gsic.uva.es/answerType/multiplePhotosAndText':
            return 'tRMultiFotosTexto';
        case 'https://casuallearn.gsic.uva.es/answerType/noAnswer':
            return 'tRSinRespuesta';
        case 'https://casuallearn.gsic.uva.es/answerType/photo':
            return 'tRFoto';
        case 'https://casuallearn.gsic.uva.es/answerType/photoAndText':
            return 'tRFotoTexto';
        case 'https://casuallearn.gsic.uva.es/answerType/shortText':
            return 'tRTextoCorto';
        case 'https://casuallearn.gsic.uva.es/answerType/text':
            return 'tRTexto';
        case 'https://casuallearn.gsic.uva.es/answerType/video':
            return 'tRVideo';
        case 'https://casuallearn.gsic.uva.es/answerType/trueFalse':
            return 'tRVF';
        case 'https://casuallearn.gsic.uva.es/answerType/mcq':
            return 'tRMcq';
        default:
            return null;
    }
}

function conversionTipoTareaCS(valor) {
    switch (valor) {
        case 'tRMultiFotos':
            return 'https://casuallearn.gsic.uva.es/answerType/multiplePhotos';
        case 'tRMultiFotosTexto':
            return 'https://casuallearn.gsic.uva.es/answerType/multiplePhotosAndText';
        case 'tRSinRespuesta':
            return 'https://casuallearn.gsic.uva.es/answerType/noAnswer';
        case 'tRFoto':
            return 'https://casuallearn.gsic.uva.es/answerType/photo';
        case 'tRFotoTexto':
            return 'https://casuallearn.gsic.uva.es/answerType/photoAndText';
        case 'tRTextoCorto':
            return 'https://casuallearn.gsic.uva.es/answerType/shortText';
        case 'tRTexto':
            return 'https://casuallearn.gsic.uva.es/answerType/text';
        case 'tRVideo':
            return 'https://casuallearn.gsic.uva.es/answerType/video';
        case 'tRVF':
            return 'https://casuallearn.gsic.uva.es/answerType/trueFalse';
        case 'tRMcq':
            return 'https://casuallearn.gsic.uva.es/answerType/mcq';
        default:
            return null;
    }
}

function translateInterface() {
    if (language !== 'es' && language !== 'en') {
        language = 'en';
    }

    const contentHTML = [
        document.getElementById('infoNavBar'),
        document.getElementById('signUpNavBar'),
        document.getElementById('signInNavBar'),
        document.getElementById('signOutNavBar'),
        document.getElementById('contributionsNavBar'),
        document.getElementById('answersNavBar'),
        document.getElementById('userDataNavBar'),
        document.getElementById('dropdownLanguage'),
        document.getElementById('modalInfoTitulo'),
        document.getElementById('modalInfoQueEsLocalizarte0'),
        document.getElementById('modalInfoQueEsLocalizarte1'),
        document.getElementById('modalInfoDatosAbiertos0'),
        document.getElementById('modalInfoDatosAbiertos1'),
        document.getElementById('modalInfoDatosAbiertos2'),
        document.getElementById('modalInfoGSIC0'),
        document.getElementById('modalInfoGSIC1'),
        document.getElementById('modalPOIAdministracionPOI'),
        document.getElementById('agregarTarea'),
        document.getElementById('modificarPI'),
        document.getElementById('eliminarPI'),
        document.getElementById('enlaceLicenciaImagenPuntoInteres'),
        document.getElementById('aceptaBorrar'),
        document.getElementById('cerrarBorrar'),
        document.getElementById('modalNuevoPuntoInteresTitle'),
        document.getElementById('modalNuevoPuntoInteresIdentificadorUnico'),
        document.getElementById('modalNuevoPuntoInteresDescription'),
        document.getElementById('modalNuevoPuntoInteresFuentes'),
        document.getElementById('modalNuevoPuntoInteresVariasFuentes'),
        document.getElementById('latitudNPI'),
        document.getElementById('longitudNPI'),
        document.getElementById('imagenNPILabel'),
        document.getElementById('licenciaNPILabel'),
        document.getElementById('modalNuevoPuntosInteresCamposObligatorios'),
        document.getElementById('enviarNPI'),
        document.getElementById('selectTipoRespuestaLabel'),
        document.getElementById('selectTipoRespuestaEnunciado'),
        document.getElementById('selectTipoRespuestaVF'),
        document.getElementById('selectTipoRespuestaMcq'),
        document.getElementById('selectTipoRespuestaTexto'),
        document.getElementById('selectTipoRespuestaShortText'),
        document.getElementById('selectTipoRespuestaPhoto'),
        document.getElementById('selectTipoRespuestaPhotoText'),
        document.getElementById('selectTipoRespuestaMultiPhotos'),
        document.getElementById('selectTipoRespuestaMultiPhotosText'),
        document.getElementById('selectTipoRespuestaVideo'),
        document.getElementById('selectTipoRespuestaSR'),
        document.getElementById('selectTipoRespuestaVideoText'),
        document.getElementById('tituloNTLabel'),
        document.getElementById('tituloNTExplica'),
        document.getElementById('textAsociadoNTLabel'),
        document.getElementById('verdaderoNTDivLabel'),
        document.getElementById('rbVFVNTVLabel'),
        document.getElementById('rbVFFNTLabel'),
        document.getElementById('rVMCQLabel'),
        document.getElementById('rD1MCQLabel'),
        document.getElementById('rD2MCQLabel'),
        document.getElementById('rD1MCQLabel'),
        document.getElementById('cbEspacioDivLabel'),
        document.getElementById('rbEspacio1Label'),
        document.getElementById('rbEspacio2Label'),
        document.getElementById('rbEspacio3Label'),
        document.getElementById('modalNuevaTareaObligatorios'),
        document.getElementById('enviarNT'),
        document.getElementById('modalIniciaSesionTitle'),
        document.getElementById('inicioMailLabel'),
        document.getElementById('inicioPassLabel'),
        document.getElementById('cambiarpass'),
        document.getElementById('inicioEnviar'),
        document.getElementById('registroMailLabel'),
        document.getElementById('registroPassLabel'),
        document.getElementById('registroNombreLabel'),
        document.getElementById('registroApellidoLabel'),
        document.getElementById('registroEnviar'),
        document.getElementById('modalConfirmarCierreTitle'),
        document.getElementById('modalConfirmarCierreAsk'),
        document.getElementById('aceptaCerrarSesion'),
        document.getElementById('lblnotasRealizaTareaLabel'),
        document.getElementById('mcqOpcionesRealizaTareaLabel'),
        document.getElementById('vFOpcionesRealizaTareaLabel'),
        document.getElementById('vF1RealizaTareaLabel'),
        document.getElementById('vF2RealizaTareaLabel'),
        document.getElementById('lblSinRealizarFoto'),
        document.getElementById('finalizarTarea'),
        document.getElementById('labelVistaProfesor'),
        document.getElementById('newLinkURLLabel'),
        document.getElementById('newLinkURLInvalid'),
        document.getElementById('newLinkTextLabel'),
        document.getElementById('newLinkTextInvalid'),
        document.getElementById('newLinkModalCancelar'),
        document.getElementById('newLinkModalInsertar'),
        document.getElementById('cbPoliPrivLabel'),
        document.getElementById('navbarItemVersion'),
    ];

    const placeHolders = [
        document.getElementById('tituloNPI'),
        document.getElementById('descrNPI'),
        document.getElementById('fuentesNPI'),
        document.getElementById('licenciaNPI'),
        document.getElementById('tituloNT'),
        document.getElementById('textoAsociadoNT'),
        document.getElementById('rVMCQ'),
        document.getElementById('rD1MCQ'),
        document.getElementById('rD2MCQ'),
        document.getElementById('rD3MCQ'),
        document.getElementById('tbnotasRealizaTarea'),
        document.getElementById('newLinkURL'),
        document.getElementById('newLinkText'),
    ];

    const popovers = [
        document.getElementById('cbEspacioDivPopover'),
    ];

    const tooltips = [
        document.getElementById('btInsertarLinkNPI'),
        document.getElementById('btInsertarLinkNT'),
    ];

    contentHTML.forEach(element => {
        try {
            element.innerHTML = translate[element.id][language];
        } catch (error) {
            console.error('contentHTML', error);
        }
    });
    placeHolders.forEach(element => {
        try {
            element.placeholder = translate[element.id][language];
        } catch (error) {
            console.error('placeHolder', error);
        }
    });

    popovers.forEach(element => {
        try {
            element.setAttribute('data-bs-content', translate[element.id][language]);
        } catch (error) {
            console.error('popover', error);
        }
    });

    tooltips.forEach(element => {
        try {
            element.setAttribute('data-bs-original-title', translate[element.id][language]);
        } catch (error) {
            console.error('tooltip', error);
        }
    });

}

function setLanguage(lng) {
    language = ((lng === 'es') ? 'es' : 'en');
    translateInterface();
}

function insertarLink(textArea) {
    const linkModal = new bootstrap.Modal(document.getElementById('newLinkModal'));
    const insertar = document.getElementById('newLinkModalInsertar');
    const cancelar = document.getElementById('newLinkModalCancelar');
    const cuadroEnlace = document.getElementById('newLinkURL');
    const cuadroTexto = document.getElementById('newLinkText');
    const cuadros = [cuadroEnlace, cuadroTexto];

    cuadros.forEach(cuadro => {
        cuadro.className = 'form-control';
        cuadro.value = '';
    });

    insertar.onclick = (ev) => {
        ev.preventDefault();
        let todoOk = true;
        cuadros.forEach(cuadro => {
            if (!cuadro || !cuadro.value || cuadro.value.trim() === '') {
                todoOk = false;
                cuadro.className = 'form-control is-invalid';
            } else {
                if (cuadro.id === 'newLinkURL' && !validURL(cuadro.value.trim())) {
                    todoOk = false;
                    cuadro.className = 'form-control is-invalid';
                } else {
                    cuadro.className = 'form-control is-valid';
                }
            }
        });

        if (todoOk) {
            let texto, url;
            cuadros.forEach(cuadro => {
                switch (cuadro.id) {
                    case 'newLinkURL':
                        url = cuadro.value.trim();
                        break;
                    case 'newLinkText':
                        texto = cuadro.value.trim();
                        break;
                    default:
                        break;
                }
            });
            textArea.value = mustache.render(
                '{{{anterior}}}<a href="{{{enlace}}}">{{{texto}}}</a>',
                {
                    anterior: textArea.value,
                    enlace: url,
                    texto: texto
                }
            );
            linkModal.hide();
        }
    };

    cancelar.onclick = (ev) => {
        ev.preventDefault();
        linkModal.hide();
    };

    linkModal.show();
}
