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
 * Gestión de peticiones relacionadas con la colección "usuarios".
 * autor: Pablo García Zarza
 * version: 20210607
 */

const Bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const DB = require('../../util/bd');

async function dameUsuarios(req, res) {
    try {
        //res.sendStatus(204);

        /*const doc = {prueba2:"ejemplo2"};
        DB.guardaDocumentoEnColeccion(doc, 'a');
        const cursor = DB.dameColeccion('a').find();
        let a = [];
        await cursor.forEach(c => {
            console.log(c);
            a.push(c)
        })
        res.status(200).send(a);*/

        const nombreColleccion = await DB.dameColeccionUsuario('pablogz@gsic.uva.es'.trim());
        if (nombreColleccion !== null) {
            const datos = await DB.dameDatosDeColeccion(nombreColleccion);
            if (datos !== null) {
                Bcrypt.compare("contraseña", datos.pass, (err, result) => {
                    if (result) {
                        res.status(200).send("Usuario y contraseña correctos");
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

    } catch (error) {
        res.status(500).send(error.toString());
    }
}

async function newUser(req, res) {
  try {
    const { body } = req;
    if (body && body.email && body.pass) {
        const { email, pass, nombre, apellido } = body;
        if (!(await DB.usuarioYaRegistrado(email))) {
            Bcrypt.hash(pass, 10, (err, hash) => {
                const uuid = uuidv4();
                const sesion = uuidv4();
                const doc = {
                    email: email.trim(),
                    pass: hash,
                    uid: uuid,
                    rol: 0,
                    idTarea: 'datos'
                };
                if(nombre && nombre.trim() !== '') {
                  doc.nombre = nombre.trim();
                }
                if(apellido && apellido.trim() !== ''){
                  doc.apellido = apellido.trim();
                }
                const doc2 = {
                    sesion: sesion,
                    email: email.trim(),
                    uid: uuid
                }
                DB.guardaDocumentoEnColeccion(doc, uuid);
                DB.nuevoUsuarioEnColeccionRapida(doc2);
                res.status(201).send({ sesion: sesion, rol: 0 });
            });
        } else {
            res.status(400).send('El usuario ya está registrado');
        }
    }
  } catch (e) {
    res.sendStatus(500);
  }
}

module.exports = {
    dameUsuarios,
    newUser,
}
