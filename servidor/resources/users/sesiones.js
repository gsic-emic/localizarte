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
 * Gestión de inicio.
 * autor: Pablo García Zarza
 * version: 20210608
 */

const Bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const DB = require('../../util/bd');

async function login(req, res) {
    try {
        if (req && req.body && req.body.email && req.body.pass) {
            const { email, pass } = req.body;
            const nombreColleccion = await DB.dameColeccionUsuario(email.trim());
            if (nombreColleccion !== null) {
                const datos = await DB.dameDatosDeColeccion(nombreColleccion);
                if (datos !== null) {
                    Bcrypt.compare(pass, datos.pass, async (err, result) => {
                        if (result) {
                            const token = uuidv4();
                            const resultado = await DB.abreSesion(token, email.trim());
                            if (resultado && resultado.modifiedCount === 1) {
                                res.status(201).send({ sesion: token, rol: datos.rol });
                            } else {
                                res.sendStatus(503);
                            }
                        } else {
                            res.status(403).send("Error en el usuario o en la contraseña");
                        }
                    });
                } else {
                    res.status(403).send("Error en el usuario o en la contraseña");
                }
            } else {
                res.status(403).send("Error en el usuario o en la contraseña");
            }
        }

    } catch (error) {
        res.status(500).send(error.toString());
    }
}

module.exports = {
    login,
}
