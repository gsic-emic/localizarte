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

function tareasContexto(iriContexto, poi) {
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
                    const mostrarAdmin = (rol !== null && rol > 0);
                    const noPuedeRealizar = !(rol !== null && rol <= 0);
                    const esProfe = (rol !== null && rol > 0);
                    for (let i = 0; i < resultados.length; i++) {
                        salta = false;
                        const resultado = resultados[i];
                        let spa = [];
                        resultado.spa.forEach(espacio => spa.push(espacio.spa));
                        if (spa.includes('https://casuallearn.gsic.uva.es/space/physical') && spa.includes('https://casuallearn.gsic.uva.es/space/virtualMap')) {
                            resultado.icon = './resources/movilPortatil.svg';
                            resultado.muestra = true;
                        } else {
                            if (spa.includes('https://casuallearn.gsic.uva.es/space/virtualMap')) {
                                resultado.icon = './resources/portatil.svg';
                                resultado.muestra = true;
                                resultado.cerca = true;
                            } else {
                                if (spa.includes('https://casuallearn.gsic.uva.es/space/physical')) {
                                    resultado.icon = './resources/movil.svg';
                                    if (siguiendo) {
                                        resultado.muestra = true;
                                        if (indicador && map.distance(indicador.getLatLng(), L.latLng(poi.lat, poi.long)) < 200) {
                                            resultado.cerca = true;
                                        } else {
                                            resultado.cerca = false;
                                        }
                                    } else {
                                        resultado.muestra = false;
                                        resultado.cerca = false;
                                    }
                                } else {
                                    resultado.muestra = false;
                                    resultado.icon = '';
                                }
                            }
                        }

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

                        resultado.id = 'b' + ids;
                        resultado.idh = 'h' + ids;
                        resultado.idf = ids;
                        ++ids;
                        resultado.aTR = resultado.aTR.replaceAll('<a ', '<a target="_blank" ');
                        resultado.mostrarAdmin = mostrarAdmin;
                        resultado.noPuedeRealizar = noPuedeRealizar;
                        resultado.esProfe = esProfe;
                        resultados.splice(i, 1, resultado);
                    }
                    tareasPoI = [];
                    resultados.forEach(resultado => {
                        if (resultado.noPuedeRealizar && resultado.esProfe) {//Modo edición. Muestro todo y agrego al vector
                            resultado.poiTitulo = poi.titulo;
                            resultado.poiLat = poi.lat;
                            resultado.poiLong = poi.long;
                            resultado.muestra = true;
                            tareasPoI.push(resultado);
                        } else {
                            if (!resultado.noPuedeRealizar || (resultado.noPuedeRealizar && !resultado.esProfe)) {
                                resultado.poiTitulo = poi.titulo;
                                resultado.poiLat = poi.lat;
                                resultado.poiLong = poi.long;
                                tareasPoI.push(resultado);
                            }
                        }
                    });
                    const salida = mustache.render(
                        '{{#resultados}}{{#muestra}}<div id="{{{idh}}}" class="accordion-item"><h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#{{{id}}}" aria-expanded="false" aria-controls="{{{id}}}"><img class="px-3" src="{{{icon}}}" style="witdth:40;height:40">{{{title}}}</button></h2><div id="{{{id}}}" class="accordion-collapse collapse" aria-labelledby="{{{idh}}}" data-bs-parent="#acordeon"><div class="accordion-body"><div class="d-md-flex flex-md-row py-1 row g-3"><div class="row pb-2"><p>{{{aTR}}}</p></div>{{#mostrarAdmin}}<div class="row py-1  text-white rounded fondoPrimario g-2"><div class="row justify-content"><h6>Gestión de la tarea</h6></div><div class="row g-1 align-items-center justify-content-around my-1"><div class="col my-1 d-flex justify-content-center"><button class="btn btn-outline-warning" onclick="modificarTarea({{{idf}}})">Modificar tarea</button></div><div class="col my-1 d-flex justify-content-center"><button class="btn btn-outline-danger" onclick="eliminaTareaModal({{{idf}}})">Eliminar tarea</button></div></div></div>{{/mostrarAdmin}}<div class="row g-1 py-2"><div class="col my-1 text-center"><button class="btn btn-success"{{#noPuedeRealizar}} disabled>{{#esProfe}}Desactiva vista docente{{/esProfe}}{{^esProfe}}Identifícate para realizar la tarea{{/esProfe}}{{/noPuedeRealizar}}{{^noPuedeRealizar}}{{#cerca}} onclick="realizaTarea({{{idf}}})">Realizar tarea{{/cerca}}{{^cerca}} disabled>Acércate para realizar la tarea{{/cerca}}{{/noPuedeRealizar}}</button></div></div></div></div></div></div>{{/muestra}}{{/resultados}}',
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


let tareasPoI;

function realizaTarea(idTarea) {
    reseteaRealizaTarea();
    if (tareasPoI !== null) {
        let tareaL, tarea;
        tareasPoI.some(t => {
            if (t.idf === idTarea) {
                tareaL = t;
                return true;
            }
            return false;
        });
        if (tareaL !== null) {
            //Primero recupero la información completa del servidor:
            let inicioT, finT;
            const direccion = recursoTareaParaElServidor(tareaL.task);
            const options = {
                method: 'GET',
                redirect: 'follow'
            };

            fetch(direccion, options)
                .then(response => {
                    switch (response.status) {
                        case 200:
                            return response.json();
                        case 404:
                        case 400:
                        case 500:
                            return response.text();
                        default:
                            return null;
                    }
                })
                .then(result => {
                    if (result !== null) {
                        if (typeof result !== 'string') {
                            tarea = result;
                            console.log(tarea);
                            modalPOI.hide();
                            modalPOI = null;
                            const modal = new bootstrap.Modal(document.getElementById('realizarTareaModal'));
                            document.getElementById('tituloRealizaTarea').innerText = tareaL.title;
                            document.getElementById('atrRealizaTarea').innerHTML = tarea.aTR;
                            if (tarea.thumb && tarea.thumb !== null && tarea.thumb !== undefined) {
                                document.getElementById('imgRepoRealizaTarea').src = tarea.thumb;
                                document.getElementById('colImgRepoRealizaTarea').removeAttribute('hidden');
                            } else {
                                document.getElementById('colImgRepoRealizaTarea').setAttribute('hidden', true);
                                document.getElementById('imgRepoRealizaTarea').src = '';
                            }
                            tarea.aT = tarea.aT.replaceAll('https://casuallearn.gsic.uva.es/answerType/', '');
                            let muestraModal = true;
                            switch (tarea.aT) {
                                case 'shortText':
                                case 'text':
                                    document.getElementById('lblnotasRealizaTarea').innerHTML = 'Indica tu respuesta';
                                    document.getElementById('tbnotasRealizaTarea').placeholder = 'Mi respuesta es...';
                                    break;
                                case 'photo':
                                    document.getElementById('contenendorCamara').removeAttribute('hidden');
                                    document.getElementById('finalizarTarea').setAttribute('disabled', 'true');
                                    break;
                                case 'photoAndText':
                                    document.getElementById('lblnotasRealizaTarea').innerHTML = 'Indica tu respuesta';
                                    document.getElementById('tbnotasRealizaTarea').placeholder = 'Mi respuesta es...';
                                    document.getElementById('contenendorCamara').removeAttribute('hidden');
                                    document.getElementById('finalizarTarea').setAttribute('disabled', 'true');
                                    break;
                                case 'mcq':
                                    //Cambio los string de las opciones. Puede que algún distractor sea la respuesta correcta!!
                                    let vector = [];
                                    vector.push(mustache.render(
                                        '<div class="my-1 form-check"><input class="form-check-input" type="radio" name="mcqRealizaTarea" value="{{{valor}}}" id="rbmcq{{{aleatorio}}}"><label class="form-check-label" for="rbmcq{{{aleatorio}}}">{{{valor}}}</label></div>',
                                        { valor: tarea.correctMcq, aleatorio: Math.random() }
                                    ));
                                    const masOpciones = ['distractor1', 'distractor2', 'distractor3'];
                                    masOpciones.forEach(distractor => {
                                        if (tarea[distractor] !== tarea.correctMcq) {
                                            vector.push(mustache.render(
                                                '<div class="my-1 form-check"><input class="form-check-input" type="radio" name="mcqRealizaTarea" value="{{{valor}}}" id="rbmcq{{{aleatorio}}}"><label class="form-check-label" for="rbmcq{{{aleatorio}}}">{{{valor}}}</label></div>',
                                                { valor: tarea[distractor], aleatorio: Math.random() }
                                            ));
                                        }
                                    });
                                    vector = vector.sort(() => Math.random() - Math.random())
                                    vector.forEach(element => {
                                        document.getElementById('mcqOpcionesRealizaTarea').innerHTML += element;
                                    });
                                    document.getElementById('contenedorMcqRealizaTarea').removeAttribute('hidden');
                                    break;
                                case 'trueFalse':
                                    document.getElementById('contenedorvFRealizaTarea').removeAttribute('hidden');
                                    break;
                                default:
                                    muestraModal = false;
                                    notificaLateralError('Tipo de tarea no soportado.');
                                    break;
                            }
                            if (muestraModal) {
                                document.getElementById('finalizarTarea').onclick = ev => {
                                    ev.preventDefault();
                                    let todoOk = true;
                                    let valor;
                                    switch (tarea.aT) {
                                        case 'shortText':
                                        case 'text':
                                            valor = document.getElementById('tbnotasRealizaTarea').value;
                                            if (!valor || valor === null || typeof valor !== 'string' || valor.trim() === '') {
                                                todoOk = false;
                                                document.getElementById('tbnotasRealizaTarea').className = 'form-control is-invalid';
                                            } else {
                                                document.getElementById('tbnotasRealizaTarea').className = 'form-control is-valid';
                                            }
                                            break;
                                        case 'photo':
                                            if (document.getElementById('foto').src === '') {
                                                todoOk = false;
                                                document.getElementById('lblSinRealizarFoto').removeAttribute('hidden');
                                            } else {
                                                document.getElementById('lblSinRealizarFoto').setAttribute('hidden', 'true');
                                            }
                                            break;
                                        case 'photoAndText':
                                            //Tengo que comprobar que tenga foto
                                            //Tengo que comprobar que el tenga texto
                                            valor = document.getElementById('tbnotasRealizaTarea').value;
                                            if (!valor || valor === null || typeof valor !== 'string' || valor.trim() === '') {
                                                todoOk = false;
                                                document.getElementById('tbnotasRealizaTarea').className = 'form-control is-invalid';
                                            } else {
                                                document.getElementById('tbnotasRealizaTarea').className = 'form-control is-valid';
                                            }
                                            if (document.getElementById('foto').src === '') {
                                                todoOk = false;
                                                document.getElementById('lblSinRealizarFoto').removeAttribute('hidden');
                                            } else {
                                                document.getElementById('lblSinRealizarFoto').setAttribute('hidden', 'true');
                                            }
                                            break;
                                        case 'mcq':
                                            //Tengo que comprobar que un rb esté marcado
                                            const radios = document.getElementsByName('mcqRealizaTarea');
                                            let seleccionadoUno = false;
                                            for (let i = 0, tama = radios.length; i < tama; i++) {
                                                if (radios[i].checked) {
                                                    seleccionadoUno = true;
                                                    break;
                                                }
                                            }
                                            if (!seleccionadoUno) {
                                                todoOk = false;
                                                for (let i = 0, tama = radios.length; i < tama; i++) {
                                                    const radio = radios[i];
                                                    radio.className = 'form-check-input is-invalid'
                                                    if (radio.checked) {
                                                        seleccionadoUno = true;
                                                        break;
                                                    }
                                                }
                                            }
                                            break;
                                        case 'trueFalse':
                                            //Tengo que comprobar que un rb esté marcado de los de vf
                                            const rbVR = document.getElementsByName('vFRealizaTarea');
                                            let unoPulsado = false;
                                            for (let i = 0, tama = rbVR.length; i < tama; i++) {
                                                if (rbVR[i].checked) {
                                                    unoPulsado = true;
                                                    break;
                                                }
                                            }
                                            if (!unoPulsado) {
                                                todoOk = false;
                                                for (let i = 0, tama = rbVR.length; i < tama; i++) {
                                                    rbVR[i].className = 'form-check-input is-invalid';
                                                }
                                            } else {
                                                for (let i = 0, tama = rbVR.length; i < tama; i++) {
                                                    rbVR[i].className = 'form-check-input';
                                                }
                                            }
                                            break;
                                        default:
                                            break;
                                    }
                                    if (todoOk) {

                                        let respuesta = {};
                                        finT = (new Date()).getTime();
                                        respuesta.endTime = finT;
                                        respuesta.timeAns = finT - inicioT;

                                        switch (tarea.aT) {
                                            case 'photo':
                                            case 'photoAndText':
                                                respuesta.photoAns = document.getElementById('foto').src;
                                                break;
                                            case 'mcq':
                                                //Tengo que comprobar que un rb esté marcado
                                                const radios = document.getElementsByName('mcqRealizaTarea');
                                                for (let i = 0, tama = radios.length; i < tama; i++) {
                                                    if (radios[i].checked) {
                                                        respuesta.choAns = radios[i].value;
                                                        break;
                                                    }
                                                }
                                                break;
                                            case 'trueFalse':
                                                //Tengo que comprobar que un rb esté marcado de los de vf
                                                const rbVR = document.getElementsByName('vFRealizaTarea');
                                                for (let i = 0, tama = rbVR.length; i < tama; i++) {
                                                    if (rbVR[i].checked) {
                                                        respuesta.choAns = rbVR[i].value;
                                                        break;
                                                    }
                                                }
                                                break;
                                            default:
                                                break;
                                        }
                                        const valor = document.getElementById('tbnotasRealizaTarea').value.trim();
                                        if (valor !== '') {
                                            respuesta.textAns = valor;
                                        }
                                        respuesta.task = tarea.task;
                                        respuesta.poi = tarea.hasContext;
                                        respuesta.poiTitulo = tareaL.poiTitulo;
                                        respuesta.poiLat = Number(tareaL.poiLat);
                                        respuesta.poiLong = Number(tareaL.poiLong);
                                        respuesta.aT = tarea.aT;

                                        let enviar = {};
                                        enviar.token = tokenSesion;
                                        enviar.respuesta = respuesta;

                                        const direccion = mustache.render('{{{direccionServidor}}}/answers', { direccionServidor: direccionServidor });
                                        let myHeaders = new Headers();
                                        myHeaders.append("Content-Type", "application/json");
                                        const options = {
                                            method: 'POST',
                                            headers: myHeaders,
                                            body: JSON.stringify(enviar),
                                            redirect: 'follow',
                                        };

                                        fetch(direccion, options)
                                            .then(response => {
                                                switch (response.status) {
                                                    case 201:
                                                        return response.json();
                                                    case 400:
                                                        return response.text();
                                                    default:
                                                        return `Error ${response.status} al enviar la respuesta`;
                                                }
                                            })
                                            .then(datos => {
                                                if (typeof datos !== 'string') {
                                                    modal.hide();
                                                    //Se le intenta dar realimentación al usuario
                                                    switch (tarea.aT) {
                                                        case 'mcq':
                                                            if (respuesta.choAns === tarea.correctMcq) {
                                                                notificaLateral('¡Respuesta correcta!<br>Respuesta almacenada.');
                                                            } else {
                                                                notificaLateralError(mustache.render(
                                                                    'Respuesta errónea :_(<br>La correcta era {{{correcta}}}.<br>Respuesta almacenada.',
                                                                    { correcta: tarea.correctMcq.toLowerCase() }
                                                                ));
                                                            }
                                                            break;
                                                        case 'trueFalse':
                                                            //Tengo que comprobar que un rb esté marcado de los de vf
                                                            if (respuesta.choAns === tarea.rE) {
                                                                notificaLateral('¡Respuesta correcta!<br>Respuesta almacenada.');
                                                            } else {
                                                                notificaLateralError(mustache.render(
                                                                    'Respuesta errónea :_(<br>Tenías que haber seleccionado {{{correcta}}}.<br>Respuesta almacenada.',
                                                                    { correcta: (tarea.rE === 'False') ? 'falso' : 'verdadero' }
                                                                ));
                                                            }
                                                            break;
                                                        default:
                                                            notificaLateral('Respuesta almacenada.');
                                                            break;
                                                    }
                                                } else {
                                                    notificaLateralError(`Error ${datos} al enviar la respuesta`);
                                                }
                                            });
                                    }
                                }
                                modal.show();
                                inicioT = (new Date()).getTime();
                            }
                        } else {
                            notificaLateralError(mustache.render(
                                'Error recuperando la información de la tarea: {{{respuesta}}}',
                                { respuesta: result }
                            ));
                        }
                    } else {
                        notificaLateralError('Error desconocido al obtener la información de la tarea.');
                    }
                })
                .catch(error => {
                    notificaLateralError('Error desconocido al obtener la información de la tarea.');
                });
        }
    } else {
        notificaLateralError("No se ha encontrado la tarea a realizar en la base de datos local");
    }
}

function eliminaTareaModal(idTarea) {
    if (tareasPoI !== null) {
        let tareaL, tarea;
        tareasPoI.some(t => {
            if (t.idf === idTarea) {
                tareaL = t;
                return true;
            }
            return false;
        });
        console.log(tareaL);
    } else {
        notificaLateralError("No se ha encontrado la información de la tarea a modificar en local");
    }
}

function modificarTarea(idTarea) {
    if (tareasPoI !== null) {
        let tareaL, tarea;
        tareasPoI.some(t => {
            if (t.idf === idTarea) {
                tareaL = t;
                return true;
            }
            return false;
        });
        console.log(tareaL);
    } else {
        notificaLateralError("No se ha encontrado la información de la tarea a modificar en local");
    }
}

function reseteaRealizaTarea() {
    document.getElementById('finalizarTarea').removeAttribute('disabled');
    document.getElementById('contenedorvFRealizaTarea').setAttribute('hidden', 'true');
    document.getElementById('contenedorMcqRealizaTarea').setAttribute('hidden', 'true');
    document.getElementById('contenendorCamara').setAttribute('hidden', 'true');
    document.getElementById('colImgRepoRealizaTarea').setAttribute('hidden', true);
    document.getElementById('imgRepoRealizaTarea').src = '';
    document.getElementById('lblnotasRealizaTarea').innerHTML = 'Agrega alguna nota si lo deseas';
    document.getElementById('tbnotasRealizaTarea').value = '';
    document.getElementById('tbnotasRealizaTarea').placeholder = 'Pienso que...';
    document.getElementById('tbnotasRealizaTarea').className = 'form-control';
    document.getElementById('foto').src = '';
    document.getElementById('lblSinRealizarFoto').setAttribute('hidden', 'true');
    document.getElementById('resultadoCaptura').setAttribute('hidden', 'true');
    document.getElementById('btIniciarCamara').removeAttribute('hidden');
    document.getElementById('mcqOpcionesRealizaTarea').innerHTML = '';
}

function nuevaTarea(idPoi) {
    const modal = new bootstrap.Modal(document.getElementById('nuevaTareaModal'));
    document.getElementById("formNT").reset();
    const camposTarea = [
        document.getElementById("selectTipoRespuesta"),
        document.getElementById("tituloNT"),
        document.getElementById("textoAsociadoNT"),
        document.getElementsByName("cbEspacio")
    ];
    const selector = document.getElementById("selectTipoRespuesta");

    ocultarOpcionesEspecificasEspacio(true, true);
    selector.onchange = () => {
        switch (selector.value) {
            case 'tRVF':
                ocultarOpcionesEspecificasEspacio(false, true);

                break;
            case 'tRMcq':
                ocultarOpcionesEspecificasEspacio(true, false);

                break;
            default:
                ocultarOpcionesEspecificasEspacio(true, true);
                break;
        }
    };

    document.getElementById("enviarNT").onclick = (ev) => {
        ev.preventDefault();

        let todoOk = true;
        const mensajes = {
            tituloNT: 'La tarea necesita un título.',
            textoAsociadoNT: 'La tarea necesita una descripción textual',
            cbEspacio: 'Se tiene que seleccionar uno o más espacios para realizar la tarea',
            selectTipoRespuesta: 'Se tiene que seleccionar un tipo de respuesta'
        }
        const selectValido = [
            'tRVF',
            'tRMcq',
            'tRTexto',
            'tRTextoCorto',
            'tRFoto',
            'tRFotoTexto',
            'tRMultiFotos',
            'tRMultiFotosTexto',
            'tRVideo',
            'tRSinRespuesta',
            'tRVideoTexto'
        ];

        const equivalencias = {
            textoAsociadoNT: 'aTR',
            tituloNT: 'title',
            rVMCQ: 'correct',
            rD1MCQ: 'distractor1',
            rD2MCQ: 'distractor2',
            rD3MCQ: 'distractor3'
        };
        let alguno = false;
        const respuestasMcq = [
            document.getElementById('rVMCQ'),
            document.getElementById('rD1MCQ'),
            document.getElementById('rD2MCQ'),
            document.getElementById('rD3MCQ')
        ];
        camposTarea.forEach(campo => {
            if (campo.id === undefined && campo.length > 1) {
                campo.forEach(c => {
                    if (c.checked) {
                        alguno = true;
                    }
                });
            } else {
                switch (campo.id) {
                    case 'selectTipoRespuesta':
                        if (selectValido.includes(campo.value)) {
                            campo.className = 'form-select is-valid';
                            if (campo.value === 'tRVF') {
                                if (document.getElementById('rbVFVNT').checked || document.getElementById('rbVFFNT').checked) {
                                    document.getElementById('rbVFVNT').className = 'form-check-input is-valid';
                                    document.getElementById('rbVFFNT').className = 'form-check-input is-valid';
                                } else {
                                    todoOk = false;
                                    document.getElementById('rbVFVNT').className = 'form-check-input is-invalid';
                                    document.getElementById('rbVFFNT').className = 'form-check-input is-invalid';
                                }
                            } else {
                                if (campo.value === 'tRMcq') {
                                    respuestasMcq.forEach(campo => {
                                        if (campo && campo.value && campo.value.trim() !== '') {
                                            campo.className = 'form-control is-valid';
                                        } else {
                                            todoOk = false;
                                            campo.className = 'form-control is-invalid';
                                        }
                                    });
                                }
                            }
                        } else {
                            todoOk = false;
                            campo.className = 'form-select is-invalid';
                        }
                        break;
                    default:
                        if (!campo || !campo.value || campo.value.trim() === '') {
                            todoOk = false;
                            campo.placeholder = mensajes[campo.id];
                            campo.className = 'form-control is-invalid';
                        } else {
                            campo.className = 'form-control is-valid';
                        }
                        break;
                }
            }
        });
        if (alguno) {
            document.getElementsByName('cbEspacio').forEach(cb => cb.className = 'form-check-input is-valid');
        } else {
            todoOk = false;
            document.getElementsByName('cbEspacio').forEach(cb => cb.className = 'form-check-input  is-invalid');
        }
        if (todoOk) {
            let envio = {};
            camposTarea.forEach(campo => {
                if (campo.id === undefined && campo.length > 1) {
                    //Espacios
                    let spa = [];
                    campo.forEach(c => {
                        if (c.checked) {
                            switch (c.id) {
                                case 'cbEspacio1':
                                    spa.push({ spa: 'espacioFisico' });
                                    break;
                                case 'cbEspacio2':
                                    spa.push({ spa: 'espacioMapaVirtual' });
                                    break;
                                case 'cbEspacio3':
                                    spa.push({ spa: 'espacioWeb' });
                                    break;
                                default:
                                    break;
                            }
                        }
                    });
                    if (spa.length > 0) {
                        envio.espacios = spa;
                    }
                } else {
                    switch (campo.id) {
                        case 'selectTipoRespuesta':
                            envio.aT = campo.value;
                            if (campo.value === 'tRVF') {
                                if (document.getElementById('rbVFVNT').checked) {
                                    envio.rE = 'true';
                                } else {
                                    envio.rE = 'false';
                                }
                            } else {
                                if (campo.value === 'tRMcq') {
                                    respuestasMcq.forEach(campo => {
                                        envio[equivalencias[campo.id]] = campo.value.trim();
                                    });
                                }
                            }
                            break;
                        case 'tituloNT':
                            let intermedio = {};
                            intermedio.value = campo.value.trim();
                            //TODO cambiar cuando haya distintos idiomas
                            intermedio.lang = "es";
                            envio[equivalencias[campo.id]] = intermedio;
                            break;
                        default:
                            envio[equivalencias[campo.id]] = campo.value.trim();
                            break;
                    }
                }
            });
            envio.hasContext = idPoi;
            //TODO cambiar por el usuario que esté registrado
            //envio.autor = 'pablogz@gsic.uva.es';

            //Realizo el envío al servidor
            let heads = new Headers();
            heads.append("Content-Type", "application/json");

            const peticion = {
                method: 'POST',
                headers: heads,
                body: JSON.stringify({ token: tokenSesion, datos: envio }),
                redirect: 'follow'
            };

            const direccion = mustache.render('{{{dir}}}/tasks', { dir: direccionServidor });

            fetch(direccion, peticion)
                .then(response => {
                    switch (response.status) {
                        case 201:
                            return { codigo: 201, mensaje: response.json() };
                        case 400:
                        case 403:
                        case 409:
                        case 500:
                        case 503:
                            return response.text();
                        default:
                            notificaLateralError(mustache.render('Error desconocido: {{{codigo}}}', { codigo: response.status }));
                            return null;
                    }
                })
                .then(result => {
                    if (result) {
                        if (typeof result !== 'string') {
                            notificaLateral('Tarea creada en el POI');
                            modal.hide();
                        } else {
                            notificaLateralError(result);
                        }
                    }
                })
                .catch(error => {
                    console.log('error', error);
                    notificaLateralError('Error desconocido');
                });
        }
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

const webcamElement = document.getElementById('webcam');
const canvasElement = document.getElementById('canvas');
const webcam = new Webcam(webcamElement, 'enviroment', canvasElement);
const mCamara = new bootstrap.Modal(document.getElementById('modalCamara'));

function inicioCamara() {
    webcam.start()
        .then(result => {
            console.log(`Modo de la cámara: ${result}`);
        })
        .catch(err => {
            console.log(err);
        });
}
function paraCamara() {
    webcam.stop();
    mCamara.hide();
}
function capturaCamara() {
    let captura = webcam.snap();
    let foto = document.getElementById("foto");

    const options = { maxSizeMB: 0.2, maxWithOrHeight: 1920, useWebWorker: true };

    imageCompression.getFilefromDataUrl(captura)
        .then(file => {
            imageCompression(file, options)
                .then(compress => {
                    imageCompression.getDataUrlFromFile(compress)
                        .then(dataUrl => {
                            foto.src = dataUrl;
                            document.getElementById('btIniciarCamara').setAttribute('hidden', true);
                            document.getElementById('resultadoCaptura').removeAttribute('hidden');
                            document.getElementById('finalizarTarea').removeAttribute('disabled');
                            paraCamara();
                        })
                        .catch(error => console.log(error));
                })
                .catch(error => console.log(error));
        })
        .catch(error => console.log(error));
}

function reversoCamara() {
    webcam.flip();
    webcam.start();
}
