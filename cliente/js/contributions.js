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
 * Related functions with teacher contributions.
 * author: Pablo García Zarza
 * version: 20211112
 */

function mostrarModalContribuciones() {
    if (rol > 0) {
        estadoBotones([], false);
        const modal = new bootstrap.Modal(document.getElementById('contributionsModal'));
        document.getElementById('titleContributionsModal').innerHTML = translate.mContribuciones[language];
        auth.currentUser.getIdToken()
            .then(idToken => {
                let headers = new Headers();
                headers.append("x-tokenid", idToken);
                let request = {
                    method: 'GET',
                    headers: headers,
                    redirect: 'follow'
                };
                const addr = mustache.render(
                    '{{{dir}}}/users/user/contributions',
                    {
                        dir: direccionServidor,
                    });
                fetch(addr, request)
                    .then(response => {
                        switch (response.status) {
                            case 200:
                                return response.json();
                            case 204:
                                return [];
                            default:
                                notificaLateralError(mustache.render('Error: {{{codigo}}}', { codigo: response.status }));
                                return null;
                        }
                    })
                    .then(result => {
                        if (result !== null) {
                            if (result.length > 0) {
                                const resultsFinal = [];
                                result.forEach(r => {
                                    let inter = {};
                                    inter.title = r.title;
                                    inter.text = r.text;
                                    inter.uid = r.uid;
                                    /*switch (r.type) {
                                        case 'poi':
                                            inter.type = ' list-group-item-secondary';
                                            break;
                                        case 'task':
                                            inter.type = ' list-group-item-info';
                                            break;
                                        default:
                                            inter.type = '';
                                            break;
                                    }*/
                                    if (r.reviews !== undefined && r.reviews.length > 0) {
                                        inter.nReviews = r.reviews.length;
                                        inter.reviews = r.reviews;
                                        inter.showNReviews = true;
                                    } else {
                                        inter.showNReviews = false;
                                    }
                                    resultsFinal.push(inter);
                                });
                                const body = mustache.render(
                                    '<ul class="list-group list-group-flush">{{#resultsFinal}}<li class="list-group-item"><div class=" d-flex justify-content-between align-items-center"><div class="me-auto"><div class="mb-1"><b>{{{title}}}</b></div><div class="mb-1">{{{text}}}</div></div>{{#showNReviews}}<a aria-expanded="false" data-bs-toggle="collapse" role="button" href="#collapse{{{uid}}}"><span class="badge bg-danger rounded-pill">{{{nReviews}}}</span></a>{{/showNReviews}}</div>{{#showNReviews}}<div class="collapse" id="collapse{{{uid}}}"><ol class="list-group list-group-numbered">{{#reviews}}<li class="list-group-item">{{{uid}}}</li>{{/reviews}}</ol></div>{{/showNReviews}}</li>{{/resultsFinal}}</ul>',
                                    {
                                        resultsFinal: resultsFinal
                                    });
                                document.getElementById('bodyContributionsModal').innerHTML = body;
                                modal.show();
                            } else {
                                notificaLateral();
                            }
                        }
                        estadoBotones([], true);
                    })
                    .catch(error => {
                        estadoBotones([], true);
                        notificaLateralError(mustache.render('Error: {{{e}}}', { e: error }));
                    });
            })
            .catch(error => {
                estadoBotones([], true);
                notificaLateralError(mustache.render('Error: {{{e}}}', { e: error }));
            });
    }
}