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
 * Professor contributions
 * autor: Pablo
 * version: 20211110
 */

const admin = require('firebase-admin');
const fetch = require('node-fetch');
const Mustache = require('mustache');

const Auxiliar = require('../../../util/auxiliar');
const { dameDocumentoRapida, dameDocumentoDeColeccion } = require('../../../util/bd');
const { todaInfo } = require('../../../util/queries');
const winston = require('../../../util/winston');

async function getContributions(req, res) {
  try {
    const start = Date.now();
    const token = req.headers['x-tokenid'];
    if (token !== null && token !== undefined) {
      admin.auth().verifyIdToken(token)
        .then(async decodeToken => {
          const { uid } = decodeToken;
          dameDocumentoRapida({ uid: uid })
            .then(async docRapida => {
              if (docRapida !== null && docRapida !== undefined && docRapida.rol !== undefined && docRapida.rol > 0 && docRapida.emailVerified) {
                dameDocumentoDeColeccion('contributions', uid)
                  .then(async contributions => {
                    contributions = contributions.contributions;
                    let response = [];
                    let promises = [];
                    contributions.forEach(contribution => {
                      const query = Auxiliar.creaOptions(todaInfo(contribution.iri));
                      promises.push(fetch(Mustache.render(
                        'http://{{{host}}}:{{{port}}}{{{path}}}',
                        {
                          host: query.host,
                          port: query.port,
                          path: query.path
                        }
                      ), {
                        headers: query.headers
                      }).then(response => response.text()));
                    });
                    Promise.all(promises)
                      .then(data => {
                        let i = 0;
                        data.forEach(d => {
                          let resp = {};
                          const info = Auxiliar.procesaJSONSparql(['propiedad', 'valor'], d).pop();
                          let save = true;
                          switch (info.tipo) {
                            case Auxiliar.equivalencias.ctx.prop:
                              resp.type = 'poi';
                              resp.title = info.titulo;
                              resp.text = info.descr;
                              break;
                            case Auxiliar.equivalencias.task.prop:
                              resp.type = 'task';
                              resp.title = info.title;
                              resp.text = info.aTR;
                              break;
                            default:
                              save = false;
                              break;
                          }
                          if (save) {
                            let contri = contributions[i];
                            if (contri.reviews !== undefined && contri.reviews.length > 0) {
                              contri.reviews = contri.reviews.filter(c => { return !c.resolved });
                            }
                            response.push({ ...resp, ...contri });
                          }
                          ++i;
                        });
                        winston.info(Mustache.render(
                          'getContributions || {{{userId}}} || {{{nContributions}}} || {{{time}}}',
                          {
                            userId: uid,
                            nContributions: response.length,
                            time: Date.now() - start
                          }
                        ));
                        if (response.length > 0) {
                          Auxiliar.logHttp(req, res, 200, 'getContributionsL', start).send(JSON.stringify(response.reverse()));
                        } else {
                          Auxiliar.logHttp(req, res, 204, 'getContributionsL', start).end();
                        }
                      })
                      .catch(error => {
                        console.error(error);
                        Auxiliar.logHttp(req, res, 503, 'getContributionsLE', start).send('Problems to recover contribution information');
                      });
                  })
                  .catch(error => {
                    console.error(error);
                    Auxiliar.logHttp(req, res, 503, 'getContributionsLE', start).send('Problems to recover user contributions');
                  });
              } else {
                Auxiliar.logHttp(req, res, 400, 'getContributionsLE', start).send('User did not register or user is not a profesor');
              }
            })
            .catch(error => {
              console.error(error);
              Auxiliar.logHttp(req, res, 400, 'getContributionsLE', start).send('User did not register');
            });
        })
        .catch(error => {
          console.error(error);
          Auxiliar.logHttp(req, res, 400, 'getContributionsLE', start).send('Problems with token id sent');
        })
    } else {
      Auxiliar.logHttp(req, res, 400, 'getContributionsLE', start).send('Missing user token id');
    }
  } catch (error) {
    console.error(error);
    Auxiliar.logHttp(req, res, 500, 'getContributionsLE').end();
  }
}

module.exports = {
  getContributions,
}
