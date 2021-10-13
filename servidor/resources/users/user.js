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
 * version: 20211012
 */


const admin = require('firebase-admin');
const { uidYaRegistrado, nuevoUsuarioEnColeccionRapida, guardaDocumentoEnColeccion, correoVerificado, dameDocumentoRapida, dameDocumentoDeColeccion } = require('../../util/bd');


async function putUser(req, res) {
    try {
        const uid = req.params.user.trim();
        const { body } = req;

        if (uid && uid !== '') {
            uidYaRegistrado(uid)
                .then(yaRegistrado => {
                    if (yaRegistrado) {
                        //Update user's values
                        //Agregar el instante de modificación
                        res.sendStatus(200);
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
                                res.status(201).send(JSON.stringify({
                                    emailVerified: user.emailVerified
                                }));
                            })
                            .catch(error => {
                                res.status(400).send(error);
                            });
                    }
                })
                .catch(e => {
                    console.error(e);
                    res.sendStatus(400);
                });
        } else {
            res.sendStatus(400);
        }
    } catch (e) {
        res.sendStatus(500);
    }
}

async function getInfoUser(req, res) {
    try {
        const token = req.params.user;
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
                                                res.status(200).send({
                                                    rol: datosRapida.rol,
                                                    name: datosUsuario.name,
                                                    surname: datosUsuario.surname,
                                                    email: datosUsuario.email
                                                });
                                            })
                                            .catch(error => {
                                                console.error(error);
                                                res.sendStatus(400);
                                            });
                                    })
                                    .catch(error => {
                                        console.error(error);
                                        res.sendStatus(400);
                                    });
                            } else {
                                res.sendStatus(404);
                            }
                        })
                        .catch(error => {
                            console.error(error);
                            res.sendStatus(400);
                        });
                } else {
                    res.sendStatus(404);
                }
            })
            .catch(error => {
                console.log(error);
                res.sendStatus(400);
            });
    } catch (e) {
        res.sendStatus(500);
    }
}

module.exports = {
    putUser,
    getInfoUser,
}