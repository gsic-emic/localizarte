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
 * Funciones para la gestión de las tareas.
 * autor: Pablo García Zarza
 * version: 20210520
 */

function tareasContexto(iriContexto) {
    const direccion = mustache.render('{{{direccionServidor}}}/tasks?context={{{iri}}}', { direccionServidor: direccionServidor, iri: iriContexto });
    const opcionesPeticion = {
        method: 'GET',
        redirect: 'follow'
    };

    fetch(direccion, opcionesPeticion)
        .then(respuesta => {
            switch (respuesta.status) {
                case 200:
                    return respuesta.json();
                case 204:
                    return [];
                case 400:
                    notificaLateralError('No se ha enviado el identificador del POI.');
                    return null;
                case 500:
                    notificaLateralError('Error interno del servidor');
                    return null;
                default:
                    notificaLateralError(mustache.render(
                        'Error desconocido: {{{status}}}',
                        { status: respuesta.status })
                    );
                    return null;
            }
        })
        .then(resultados => {
            if (resultados && modalOpen(document.getElementById('puntoInteres'))) {
                const espacioTareas = document.getElementById('espacioTareas');
                if (resultados.length === 0) {
                    espacioTareas.innerHTML = '<h6>POI sin tareas asociadas</h6>';
                } else {
                    let ids = Math.trunc(window.performance.now() * 1000000000);
                    let numero = 1;
                    for (let i = 0; i < resultados.length; i++) {
                        salta = false;
                        const resultado = resultados[i];
                        if (resultado.spa === 'https://casuallearn.gsic.uva.es/space/physical') {
                            resultado.icon = './resources/movil.svg';
                            if (siguiendo) {
                                resultado.muestra = true;
                            } else {
                                resultado.muestra = false;
                            }
                        } else {
                            resultado.icon = './resources/portatil.svg';
                            resultado.muestra = true;
                        }
                        if (resultado.muestra) {
                            let textoAT;
                            switch (resultado.aT) {
                                case 'https://casuallearn.gsic.uva.es/answerType/multiplePhotos':
                                    textoAT = 'Realiza varias fotografías';
                                    break;
                                case 'https://casuallearn.gsic.uva.es/answerType/multiplePhotosAndText':
                                    textoAT = 'Realiza varias fotografías y responde a una pregunta'
                                    break;
                                case 'https://casuallearn.gsic.uva.es/answerType/noAnswer':
                                    textoAT = 'Información';
                                    break;
                                case 'https://casuallearn.gsic.uva.es/answerType/photo':
                                    textoAT = 'Realiza una fotografía';
                                    break;
                                case 'https://casuallearn.gsic.uva.es/answerType/photoAndText':
                                    textoAT = 'Realiza una fotografía y responde una pregunta';
                                    break;
                                case 'https://casuallearn.gsic.uva.es/answerType/shortText':
                                    textoAT = 'Responde brevemente a una pregunta';
                                    break;
                                case 'https://casuallearn.gsic.uva.es/answerType/text':
                                    textoAT = 'Responde a una pregunta';
                                    break;
                                case 'https://casuallearn.gsic.uva.es/answerType/video':
                                    textoAT = 'Graba un vídeo';
                                    break;
                                case 'https://casuallearn.gsic.uva.es/answerType/mcq':
                                    textoAT = 'Selecciona la respuesta correcta';
                                    break;
                                case 'https://casuallearn.gsic.uva.es/answerType/trueFalse':
                                    textoAT = '¿Verdadero o falso?';
                                    break;
                                default:
                                    textoAT = 'Tipo de pregunta desconocido';
                                    break;
                            }
                            resultado.title = mustache.render('{{{textoAT}}}{{#title}} - {{{title}}}{{/title}}', { textoAT: textoAT, title: resultado.title });
                            ++numero;
                            resultado.id = 'b' + ids;
                            resultado.idh = 'h' + ids;
                            ++ids;
                        }
                        resultado.aTR = resultado.aTR.replaceAll('<a ', '<a target="_blank" ');
                        resultados.splice(i, 1, resultado);
                    }
                    const salida = mustache.render(
                        '{{#resultados}}{{#muestra}}<div id="{{{idh}}}" class="accordion-item"><h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#{{{id}}}" aria-expanded="false" aria-controls="{{{id}}}"><img class="px-3" src="{{{icon}}}" style="witdth:40;height:40">{{{title}}}</button></h2><div id="{{{id}}}" class="accordion-collapse collapse" aria-labelledby="{{{idh}}}" data-bs-parent="#acordeon"><div class="accordion-body"><div class="d-md-flex flex-md-row py-1 row g-3"><div class="row pb-2"><p>{{{aTR}}}</p></div><div class="row py-1 bg-light g-2"><div class="row justify-content"><h6>Gestión de la tarea</h6></div><div class="row g-1 align-items-center justify-content-around my-1"><div class="col my-1 d-flex justify-content-center"><button class="btn btn-outline-warning">Modificar tarea</button></div><div class="col my-1 d-flex justify-content-center"><button class="btn btn-outline-danger">Eliminar tarea</button></div></div></div><div class="row g-1 py-2"><div class="col my-1 d-flex justify-content-center"><button class="btn btn-success">Realizar tarea</button></div></div></div></div></div></div>{{/muestra}}{{/resultados}}',
                        { resultados: resultados }
                    );
                    espacioTareas.innerHTML = mustache.render(
                        '<div class="accordion" id="acordeon">{{{salida}}}</div>',
                        { salida: salida }
                    );
                }
            }
        })
        .catch(error => console.log('error', error));
}

function nuevaTarea(idPoi) {
    const modal = new bootstrap.Modal(document.getElementById('nuevaTareaModal'));
    document.getElementById("formNT").reset();
    const camposTarea = [
        document.getElementById("tituloNT"),
        document.getElementById("textoAsociadoNT"),
        document.getElementsByName("rbEspacio"),
        document.getElementById("selectTipoRespuesta")
    ];
    const selector = document.getElementById("selectTipoRespuesta");
    //selector.setAttribute('disabled', true);
    ocultarOpcionesEspecificasEspacio(true, true);
    selector.onchange = () => {
        switch (selector.value) {
            case 'trueFalse':
                ocultarOpcionesEspecificasEspacio(false, true);

                break;
            case 'mcq':
                ocultarOpcionesEspecificasEspacio(true, false);

                break;
            default:
                ocultarOpcionesEspecificasEspacio(true, true);
                break;
        }
    };


    /*document.getElementsByName("rbEspacio").forEach(rb => {
        rb.onclick = () => {
            let continua = true;
            switch (rb.value) {
                case 'physical':
                    selector.innerHTML = '<option selected>Selecciona un tipo</option><option value="text">Texto</option><option value="shortText">Texto corto</option><option value="photo">Fotografía</option><option value="photoAndText">Fotografía y texto</option><option value="multiplePhotos">Múltiple fotografías</option><option value="multiplePhotosAndText">Múltiples fotos y texto</option><option value="video">Vídeo</option>';
                    selector.removeAttribute('disabled');
                    break;
                case 'virtualMap':
                    selector.innerHTML = '<option selected>Selecciona un tipo</option><option value="text">Texto</option><option value="trueFalse">Verdadero o falso</option><option value="mcq">Pregunta opción múltiple</option>';
                    selector.removeAttribute('disabled');
                    break;
                default:
                    continua = false;
                    break;
            }
            if (continua) {
                ocultarOpcionesEspecificasEspacio(true, true);
                selector.onchange = () => {
                    switch (selector.value) {
                        case 'trueFalse':
                            ocultarOpcionesEspecificasEspacio(false, true);

                            break;
                        case 'mcq':
                            ocultarOpcionesEspecificasEspacio(true, false);

                            break;
                        default:
                            ocultarOpcionesEspecificasEspacio(true, true);
                            break;
                    }
                };
            }
        };
    });*/

    document.getElementById("enviarNT").onclick = (ev) => {
        ev.preventDefault();
        console.log("pulsado enviar");
        //Tengo que comprobar los valores.
        //Tengo que crear un JSON aceptado por el servidor
        //Notificar la correcta/incorrecta creacion
        //Cargar el modal del pi para que el usuario pueda ver el efecto de su acción
    }

    modal.show();
}

function ocultarOpcionesEspecificasEspacio(tRTF, tRMCQ) {
    if (tRTF) {
        document.getElementById("tRverdaderoFalso").setAttribute('hidden', true);
    } else {
        document.getElementById("tRverdaderoFalso").removeAttribute('hidden');
    }
    if (tRMCQ) {
        document.getElementById("tRMCQ").setAttribute('hidden', true);
    } else {
        document.getElementById("tRMCQ").removeAttribute('hidden');
    }
    if (tRTF && tRMCQ) {
        document.getElementById("tRcamposExtra").setAttribute('hidden', true);
    } else {
        document.getElementById("tRcamposExtra").removeAttribute('hidden');
    }
}
