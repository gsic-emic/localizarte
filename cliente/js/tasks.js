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
                            resultado.title = mustache.render('Tarea #{{{numero}}}{{#title}} - {{{title}}}{{/title}}', { numero: numero, title: resultado.title });
                            ++numero;
                            resultado.id = 'b' + ids;
                            resultado.idh = 'h' + ids;
                            ++ids;
                        }
                        resultado.aTR = resultado.aTR.replaceAll('<a ', '<a target="_blank" ');
                        resultados.splice(i, 1, resultado);
                    }
                    const salida = mustache.render(
                        '{{#resultados}}{{#muestra}}<div id="{{{idh}}}" class="accordion-item"><h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#{{{id}}}" aria-expanded="false" aria-controls="{{{id}}}"><img class="px-3" src="{{{icon}}}" style="witdth:40;height:40">{{{title}}}</button></h2><div id="{{{id}}}" class="accordion-collapse collapse" aria-labelledby="{{{idh}}}" data-bs-parent="#acordeon"><div class="accordion-body"><div class="d-md-flex flex-md-row py-1 row g-3"><div class="row pb-2"><p>{{{aTR}}}</p></div><div class="row py-1 bg-light g-2"><div class="row justify-content"><h6>Gestión de la tarea</h6></div><div class="row g-2 align-items-center justify-content-around my-1"><div class="col my-1 d-flex justify-content-center"><button class="btn btn-danger">Eliminar tarea</button></div><div class="col my-1 d-flex justify-content-center"><button class="btn btn-warning">Modificar tarea</button></div></div></div><div class="row g-1 py-2"><div class="col my-1 d-flex justify-content-center"><button class="btn btn-success">Realizar tarea</button></div></div></div></div></div>{{/muestra}}{{/resultados}}',
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
        document.getElementById("textoAsociadoNT")
    ];
    modal.show();
}
