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
 * Gestión de peticiones relacionadas con el recurso "usuario".
 * autor: Pablo García Zarza
 * version: 20211109
 */


const admin = require('firebase-admin');
const Mustache = require('mustache');

const { uidYaRegistrado, nuevoUsuarioEnColeccionRapida, guardaDocumentoEnColeccion, correoVerificado, dameDocumentoRapida, dameDocumentoDeColeccion, modificaDocumentoDeColeccion } = require('../../util/bd');
const winston = require('../../util/winston');
const Auxiliar = require('../../util/auxiliar');

/**
 * Function to add or update a user in the server. In request header the client must had sent a token in the field x-tokenid.
 * 
 * @param {Object} req Request
 * @param {Object} res Response
 */
async function putUser(req, res) {
    try {
        const start = Date.now();
        const token = req.headers['x-tokenid'];
        const { body } = req;

        admin.auth().verifyIdToken(token)
            .then(async decodedToken => {
                const { uid, email_verified } = decodedToken;
                if (uid && uid !== '') {
                    uidYaRegistrado(uid)
                        .then(async yaRegistrado => {
                            if (yaRegistrado) {
                                //Update user's values
                                if(email_verified) {
                                    const {name, surname} = body;
                                    modificaDocumentoDeColeccion(
                                        {
                                            name: name, 
                                            surname: surname, 
                                            lastUpdate: Date.now()
                                        }, 'userData', uid)
                                        .then(respuestaBD => {
                                            if(respuestaBD.modifiedCount > 0) {
                                                winston.info(Mustache.render(
                                                    'putUser || updateUser || {{{idUser}}} || {{{time}}} ',
                                                    {
                                                        idUser: uid,
                                                        time: Date.now() - start
                                                    }
                                                ));
                                                Auxiliar.logHttp(req, res, 200, 'putUserL', start).send(JSON.stringify({
                                                    name: name,
                                                    surname: surname
                                                }));
                                            } else {
                                                Auxiliar.logHttp(req, res, 512, 'putUserLE', start).send('No se han modificado todos los campos');
                                            }
                                        })
                                        .catch(error => {
                                            console.error(error);
                                            Auxiliar.logHttp(req, res, 500, 'putUserLE', start).send('Error en la actualización');
                                        });
                                } else {
                                    Auxiliar.logHttp(req, res, 400, 'putUserLE', start).send('El usuario no ha verificado su dirección de correo');
                                }
                            } else {
                                admin.auth().getUser(uid)
                                    .then(async user => {
                                        const { email, nombre, apellido } = body;
                                        nuevoUsuarioEnColeccionRapida({
                                            uid: uid,
                                            emailVerified: user.emailVerified,
                                            rol: 0,
                                            creationDate: Date.now()
                                        });
                                        guardaDocumentoEnColeccion(
                                            {
                                                _id: 'userData',
                                                name: nombre,
                                                surname: apellido,
                                                lastUpdate: Date.now(),
                                                email: email
                                            },
                                            uid);
                                            winston.info(Mustache.render(
                                                'putUser || newUser || {{{idUser}}} || {{{time}}} ',
                                                {
                                                    idUser: uid,
                                                    time: Date.now() - start
                                                }
                                            ));
                                            Auxiliar.logHttp(req, res, 201, 'putUserL', start).send(JSON.stringify({
                                            emailVerified: user.emailVerified
                                        }));
                                    })
                                    .catch(error => {
                                        Auxiliar.logHttp(req, res, 400, 'putUserLE', start).send(error);
                                    });
                            }
                        })
                        .catch(e => {
                            console.error(e);
                            Auxiliar.logHttp(req, res, 400, 'putUserLE', start).end();
                        });
                } else {
                    Auxiliar.logHttp(req, res, 400, 'putUserLE', start).end();
                }
            })
            .catch(error => {
                Auxiliar.logHttp(req, res, 400, 'putUserLE', start).send(error);
            });
    } catch (e) {
        Auxiliar.logHttp(req, res, 500, 'putUserLE').end();
    }
}

/**
 * Function to get the information of a user. In request header the client must had sent a token in the field x-tokenid.
 * @param {Object} req Request
 * @param {Object} res Response
 */
async function getInfoUser(req, res) {
    try {
        const start = Date.now();
        const token = req.headers['x-tokenid'];
        admin.auth().verifyIdToken(token)
            .then(async decodedToken => {
                const { uid, email_verified } = decodedToken;
                if (email_verified) {
                    uidYaRegistrado(uid)
                        .then(yaRegistrado => {
                            if (yaRegistrado) {
                                dameDocumentoRapida({ uid: uid })
                                    .then(datosRapida => {
                                        dameDocumentoDeColeccion('userData', uid)
                                            .then(datosUsuario => {
                                                correoVerificado(uid, email_verified);
                                                winston.info(Mustache.render(
                                                    'getUser || {{{userId}}} || {{{time}}}',
                                                    {
                                                        userId: uid,
                                                        time: Date.now() - start
                                                    }
                                                ));
                                                Auxiliar.logHttp(req, res, 200, 'getUserL', start).send({
                                                    rol: datosRapida.rol,
                                                    name: datosUsuario.name,
                                                    surname: datosUsuario.surname,
                                                    email: datosUsuario.email
                                                });
                                            })
                                            .catch(error => {
                                                console.error(error);
                                                Auxiliar.logHttp(req, res, 400, 'getUserLE', start).end();
                                            });
                                    })
                                    .catch(error => {
                                        console.error(error);
                                        Auxiliar.logHttp(req, res, 400, 'getUserLE', start).end();
                                    });
                            } else {
                                Auxiliar.logHttp(req, res, 404, 'getUserLE', start).end();
                            }
                        })
                        .catch(error => {
                            console.error(error);
                            Auxiliar.logHttp(req, res, 400, 'getUserLE', start).end();
                        });
                } else {
                    Auxiliar.logHttp(req, res, 404, 'getUserLE', start).end();
                }
            })
            .catch(error => {
                console.log(error);
                Auxiliar.logHttp(req, res, 400, 'getUserLE', start).end();
            });
    } catch (e) {
        Auxiliar.logHttp(req, res, 500, 'getUserLE').end();
    }
}

module.exports = {
    putUser,
    getInfoUser,
}