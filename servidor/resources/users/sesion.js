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

const DB = require('../../util/bd')

/**
 * Cierre de sesión.
 * autor: Pablo García Zarza
 * version: 20210608
 */

async function logout(req, res) {
    try {
        const { sesion } = req.params;
        const resultado = await DB.cierraSesion(sesion);
        if (resultado && resultado.modifiedCount === 1) {
            res.sendStatus(200);
        } else {
            res.sendStatus(400);
        }
    } catch (error) { res.sendStatus(500); }
}

module.exports = {
    logout,
}
