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
 * Gestión de los usuarios en el cliente de LocalizARTE.
 * autor: Pablo García Zarza
 * version: 20211018
 */

function inicioSesionUsuario() {
    const modal = new bootstrap.Modal(document.getElementById('inicioSesionModal'));
    const btInicio = document.getElementById('inicioEnviar');
    const btCambiarPass = document.getElementById('cambiarpass');
    const botones = [btInicio, btCambiarPass];
    const camposObligatorios = [
        document.getElementById('inicioMail'),
        document.getElementById('inicioPass')
    ];
    document.getElementById('formInicio').reset();
    camposObligatorios.forEach(campo => {
        campo.className = 'form-control';
        campo.value = '';
    });
    const mensajes = {
        inicioMail: 'Se necesita una dirección de correo',
        inicioMailFormatoMal: 'Se necesita una dirección de correo válida',
        inicioPass: 'Se necesita una contraseña',
    };
    const equivalencias = {
        inicioMail: 'email',
        inicioPass: 'pass'
    }

    btCambiarPass.onclick = (ev) => {
        ev.preventDefault();
        estadoBotones(botones, false);
        let todoOk = true;
        const campo = document.getElementById('inicioMail');
        if (!campo || !campo.value || campo.value.trim() === '') {
            todoOk = false;
            campo.placeholder = mensajes[campo.id];
            document.getElementById(campo.id + 'Invalid').innerHTML = mensajes[campo.id];
            campo.className = 'form-control is-invalid';
        } else {
            if (!validateEmail(campo.value)) {
                todoOk = false;
                campo.placeholder = mensajes.inicioMailFormatoMal;
                document.getElementById(campo.id + 'Invalid').innerHTML = mensajes.inicioMailFormatoMal;
                campo.className = 'form-control is-invalid';
            } else {
                campo.className = 'form-control is-valid';
            }
        }

        if (todoOk) {
            camposObligatorios.forEach(campo => {
                campo.className = 'form-control';
            });
            modal.hide();
            notificaLateral('Si la cuenta existe se ha enviado un email para que puedas cambiar la contraseña.');
            auth.sendPasswordResetEmail(campo.value).then(() => { }).catch(() => { });
        }
        estadoBotones(botones, true);
    }


    btInicio.onclick = (ev) => {
        ev.preventDefault();
        estadoBotones(botones, false);
        let todoOk = true;
        camposObligatorios.forEach(campo => {
            switch (campo.id) {
                case 'inicioPass':
                    if (!campo || !campo.value) {
                        todoOk = false;
                        campo.placeholder = mensajes[campo.id];
                        document.getElementById(campo.id + 'Invalid').innerHTML = mensajes[campo.id];
                        campo.className = 'form-control is-invalid';
                    } else {
                        campo.className = 'form-control is-valid';
                    }
                    break;
                case 'inicioMail':
                    if (!campo || !campo.value || campo.value.trim() === '' || !validateEmail(campo.value)) {
                        todoOk = false;
                        campo.placeholder = mensajes[campo.id];
                        document.getElementById(campo.id + 'Invalid').innerHTML = mensajes[campo.id];
                        campo.className = 'form-control is-invalid';
                    } else {
                        campo.className = 'form-control is-valid';
                    }
                    break;
                default:
                    break;
            }
        });
        if (todoOk) {
            camposObligatorios.forEach(campo => {
                campo.className = 'form-control';
            });
            let envio = {};
            camposObligatorios.forEach(campo => {
                switch (campo.id) {
                    case 'inicioPass':
                        envio[equivalencias[campo.id]] = campo.value;
                        break;
                    default:
                        envio[equivalencias[campo.id]] = campo.value.trim();
                        break;
                }
            });

            auth.signInWithEmailAndPassword(envio.email, envio.pass)
                .then(userCredential => {
                    if (userCredential.user.emailVerified) {
                        //Solicito la info al servidor de este usuario. Se la solicito a través de un token
                        auth.currentUser.getIdToken()
                            .then(idToken => {
                                let cabeceras = new Headers();
                                cabeceras.append("x-tokenid", idToken);
                                var opciones = {
                                    headers: cabeceras,
                                    method: 'GET',
                                    redirect: 'follow'
                                };
                                const direccion = mustache.render(
                                    '{{{dir}}}/users/user',
                                    {
                                        dir: direccionServidor
                                    });

                                fetch(direccion, opciones)
                                    .then(response => {
                                        switch (response.status) {
                                            case 200:
                                                return response.json();
                                            case 400:
                                            case 404:
                                                cerrarSesionFirebase(true);
                                                notificaLateralError('No se ha encontrado al usuario');
                                                return null;
                                            default:
                                                notificaLateralError(mustache.render('Error desconocido: {{{codigo}}}', { codigo: response.status }));
                                                return null;
                                        }
                                    })
                                    .then(result => {
                                        if (result && result.rol !== undefined && result.email !== undefined) {
                                            dUser = result;
                                            rol = result.rol;
                                            notificaLateral(mustache.render(
                                                'Hola de nuevo {{{nombre}}}',
                                                {
                                                    nombre: dUser.name
                                                }));
                                            if (rol > 0) {
                                                document.getElementById('interruptorProfesor').removeAttribute('hidden');
                                                if (!document.getElementById('swVistaProfesor').checked) {
                                                    document.getElementById('swVistaProfesor').checked = true;
                                                    document.getElementById('gestionUsuarioLista').innerHTML = '<li class="nav-item"><a class="nav-link" href="javascript:mostrarModalContribuciones();">Contribuciones</a></li><li class="nav-item"><a class="nav-link" href="javascript:gestionarCuenta();">Datos del usuario</a></li><li class="nav-item"><a class="nav-link" href="javascript:cerrarSesion();">Cerrar sesión</a></li>';
                                                }
                                            } else {
                                                document.getElementById('interruptorProfesor').setAttribute('hidden', 'true');
                                                document.getElementById('gestionUsuarioLista').innerHTML = '<li class="nav-item"><a class="nav-link" href="javascript:mostrarModalRespuestas();">Respuestas</a></li><li class="nav-item"><a class="nav-link" href="javascript:gestionarCuenta();">Datos del usuario</a></li><li class="nav-item"><a class="nav-link" href="javascript:cerrarSesion();">Cerrar sesión</a></li>';
                                            }
                                        }
                                        estadoBotones(botones, true);
                                        modal.hide();
                                    })
                                    .catch(error => {
                                        console.error('error', error);
                                        estadoBotones(botones, true);
                                        modal.hide();
                                        notificaLateralError('Error desconocido');
                                    });
                            })
                            .catch(error => {
                                estadoBotones(botones, true);
                                modal.hide();
                                notificaLateralError('Error desconocido: ' + error.code);
                                cerrarSesionFirebase(true);
                            });
                    } else {
                        auth.currentUser.sendEmailVerification();
                        estadoBotones(botones, true);
                        modal.hide();
                        notificaLateralError('Verifica la dirección de correo antes de iniciar sesión. Te hemos vuelto a enviar un correo de confirmación.');
                        cerrarSesionFirebase(true);
                    }
                })
                .catch(error => {
                    switch (error.code) {
                        case 'auth/user-not-found':
                        case 'auth/wrong-password':
                            estadoBotones(botones, true);
                            notificaLateralError('Error en la dirección de correo o en la contraseña.');
                            camposObligatorios.forEach(campo => {
                                campo.value = '';
                                campo.placeholder = mensajes[campo.id];
                                document.getElementById(campo.id + 'Invalid').innerHTML = mensajes[campo.id];
                                campo.className = 'form-control is-invalid';
                            });
                            break;
                        default:
                            estadoBotones(botones, true);
                            modal.hide();
                            notificaLateralError('Error desconocido.');
                            break;
                    }
                });
        } else {
            estadoBotones(botones, true);
        }
    }
    modal.show();
}

function registroUsuario() {
    const modal = new bootstrap.Modal(document.getElementById('nuevoUsuarioModal'));
    document.getElementById('tituloModalnuevoUsuarioModal').innerHTML = 'Nuevo usuario';
    const btRegistroEnviar = document.getElementById('registroEnviar');
    btRegistroEnviar.innerHTML = 'Registrar';
    const botones = [btRegistroEnviar];
    const campos = [
        document.getElementById('registroMail'),
        document.getElementById('registroPass'),
        document.getElementById('registroNombre'),
        document.getElementById('registroApellido')
    ];
    const camposObligatorios = [
        document.getElementById('registroMail'),
        document.getElementById('registroPass')
    ];
    camposObligatorios.forEach(campo => {
        campo.disabled = false;
    });
    document.getElementById('camposObligatoriosRegistroLabel').innerHTML = '* Campos obligatorios';
    const camposOpcionales = [
        document.getElementById('registroNombre'),
        document.getElementById('registroApellido')
    ];
    document.getElementById('formRegistro').reset();
    campos.forEach(campo => {
        campo.className = 'form-control';
        campo.value = '';
    });
    const mensajes = {
        registroMail: 'Se necesita una dirección de correo válida',
        registroMailYaRegistrado: 'Dirección de correo utilizada previamente',
        registroPass: 'Se necesita una contraseña',
        registroPassCorta: 'Mínimo contraseñas de 6 caracteres',
        registroNombre: 'Se necesita un nombre',
        registroApellido: 'Se necesita un apellido'
    };
    const equivalencias = {
        registroMail: 'email',
        registroPass: 'pass',
        registroNombre: 'nombre',
        registroApellido: 'apellido'
    }
    btRegistroEnviar.onclick = ev => {
        ev.preventDefault();
        estadoBotones(botones, false);
        let todoOk = true;
        camposObligatorios.forEach(campo => {
            switch (campo.id) {
                case 'registroPass':
                    if (!campo || !campo.value) {
                        todoOk = false;
                        campo.placeholder = mensajes[campo.id];
                        document.getElementById('registroPassInvalid').innerHTML = mensajes['registroPass'];
                        campo.className = 'form-control is-invalid';
                    } else {
                        if (campo.value.length >= 6) {
                            campo.className = 'form-control is-valid';
                        } else {
                            todoOk = false;
                            campo.placeholder = mensajes[campo.id];
                            document.getElementById('registroPassInvalid').innerHTML = mensajes['registroPassCorta'];
                            campo.className = 'form-control is-invalid';
                        }
                    }
                    break;
                case 'registroMail':
                    if (!campo || !campo.value || campo.value.trim() === '' || !validateEmail(campo.value)) {
                        todoOk = false;
                        campo.placeholder = mensajes['registroMail'];
                        document.getElementById('registroMailInvalid').innerHTML = mensajes['registroMail'];
                        campo.className = 'form-control is-invalid';
                    } else {
                        campo.className = 'form-control is-valid';
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
        });
        if (todoOk) {
            let envio = {};
            let datosFirebase = {};
            campos.forEach(campo => {
                campo.className = 'form-control';
            });
            camposObligatorios.forEach(campo => {
                switch (campo.id) {
                    case 'registroPass':
                        datosFirebase[equivalencias[campo.id]] = campo.value;
                        break;
                    default:
                        envio[equivalencias[campo.id]] = campo.value.trim();
                        datosFirebase[equivalencias[campo.id]] = campo.value.trim();
                        break;
                }
            });
            camposOpcionales.forEach(campo => {
                if (campo.value && campo.value.trim() !== '') {
                    envio[equivalencias[campo.id]] = campo.value.trim();
                }
            });

            auth.createUserWithEmailAndPassword(datosFirebase.email, datosFirebase.pass)
                .then((userCredential) => {
                    let cabeceras = new Headers();
                    cabeceras.append("Content-Type", "application/json");

                    auth.currentUser.getIdToken()
                        .then(idToken => {
                            cabeceras.append("x-tokenid", idToken);
                            let peticion = {
                                method: 'PUT',
                                headers: cabeceras,
                                body: JSON.stringify(envio), //Envío la dirección de correo y si nos lo ha facilitado, el nombre y el apellido
                                redirect: 'follow'
                            };

                            const direccion = mustache.render(
                                '{{{dir}}}/users/user',
                                {
                                    dir: direccionServidor,
                                });

                            fetch(direccion, peticion)
                                .then(response => {
                                    switch (response.status) {
                                        case 201:
                                            return response.json();
                                        case 400:
                                            return response.text();
                                        default:
                                            notificaLateralError(mustache.render('Error desconocido: {{{codigo}}}', { codigo: response.status }));
                                            return null;
                                    }
                                })
                                .then(result => {
                                    if (result) {//Si es null no se entra en esta condición
                                        if (typeof result === 'string') {
                                            notificaLateralError(result);
                                        } else {
                                            auth.currentUser.sendEmailVerification();//Envío correo de verificación a la cuenta del usuario
                                            if (result.verifiedEmail)
                                                notificaLateral('Ya estás registrado. Inicia sesión para comenzar a usar LocalizARTE');
                                            else
                                                notificaLateral('Se te ha enviado un correo para verificar el email. Después de verificarlo podrás identificarte.');
                                        }
                                    }
                                    estadoBotones(botones, true);
                                    modal.hide();
                                    cerrarSesionFirebase(true);
                                })
                                .catch(error => {
                                    estadoBotones(botones, true);
                                    console.error('error', error);
                                    notificaLateralError('Se ha producido un error desconocido');
                                });

                        })
                        .catch(error => {
                            estadoBotones(botones, true);
                            notificaLateralError('Error desconocido: ' + error.code);
                            cerrarSesionFirebase(true);
                            modal.hide();
                        });
                })
                .catch((error) => {
                    switch (error.code) {
                        case 'auth/email-already-in-use':
                            modal.hide();
                            notificaLateralError(mustache.render('Error: {{{texto}}}', { texto: mensajes['registroMailYaRegistrado'] }));
                            break;
                        case 'auth/invalid-password':
                            campo = document.getElementById('registroPass');
                            campo.placeholder = mensajes['registroPassCorta'];
                            document.getElementById('registroPassInvalid').innerHTML = mensajes['registroPassCorta'];
                            campo.className = 'form-control is-invalid';
                            break;
                        default:
                            modal.hide();
                            notificaLateralError(mustache.render('Error: {{{codigoError}}}', { codigoError: error.code }));
                            break;
                    }
                    estadoBotones(botones, true);
                }
                );
        } else {
            estadoBotones(botones, true);
        }
    }
    modal.show();
}

function cerrarSesionFirebase(silencio = false) {
    auth.signOut()
        .then(() => {
            if (!silencio) {
                notificaLateral("Se ha cerrado la sesión correctamente.")
            }
        })
        .catch((error) => {
            if (!silencio) {
                notificaLateral(mustache.render(
                    'Error al cerrar sesión: {{{codError}}}',
                    {
                        codError: error.status
                    }
                ));
            }
        });
}

function cerrarSesion() {
    const modal = new bootstrap.Modal(document.getElementById('confirmarCerrar'));
    document.getElementById('aceptaCerrarSesion').onclick = ev => {
        ev.preventDefault();
        document.getElementById('gestionUsuarioLista').innerHTML = '<li class="nav-item"><a class="nav-link" href="javascript:informacionDatos();">Información</a></li><li class="nav-item"><a class="nav-link"  href="javascript:registroUsuario();">Registro</a></li><li class="nav-item"><a class="nav-link" href="javascript:inicioSesionUsuario();">Identificación</a></li>';
        dUser = null;
        if (rol !== 0) {
            document.getElementById('interruptorProfesor').setAttribute('hidden', true);
        }
        rol = null;
        cerrarSesionFirebase(false);
        modal.hide();
    };
    modal.show();
}

function gestionarCuenta() {
    const modal = new bootstrap.Modal(document.getElementById('nuevoUsuarioModal'));
    if (rol > 0) {
        document.getElementById('tituloModalnuevoUsuarioModal').innerHTML = 'Cuenta de docente';
        document.getElementById('camposObligatoriosRegistroLabel').innerHTML = '';
    } else {
        document.getElementById('tituloModalnuevoUsuarioModal').innerHTML = 'Datos del usuario';
        document.getElementById('camposObligatoriosRegistroLabel').innerHTML = 'Si quieres disponer de una cuenta de docente para poder crear nuevos POI y tareas educativas envía un correo electrónico a la dirección <em>localizarte@gsic.uva.es</em> para que el equipo de LocalizARTE se pueda poner en contacto contigo.';
    }
    const campoNombre = document.getElementById('registroNombre');
    if (dUser.name !== undefined) {
        campoNombre.value = dUser.name;
    }
    const campoApellido = document.getElementById('registroApellido');
    if (dUser.surname !== undefined) {
        campoApellido.value = dUser.surname;
    }
    const campoEmail = document.getElementById('registroMail');
    campoEmail.value = dUser.email;
    const campoPass = document.getElementById('registroPass');
    campoPass.value = 'noEsTuContraseña';
    const camposNoModificables = [campoEmail, campoPass];
    camposNoModificables.forEach(campo => {
        campo.disabled = true;
    });
    const btRegistroEnviar = document.getElementById('registroEnviar');
    const botones = [btRegistroEnviar];
    btRegistroEnviar.innerHTML = 'Actualizar';
    btRegistroEnviar.onclick = ev => {
        ev.preventDefault();
        estadoBotones(botones, false);
        estadoBotones(botones, true);
        nuevoNombre = campoNombre.value.trim();
        nuevoApellido = campoApellido.value.trim();
        if (dUser.name === nuevoNombre && dUser.surname === nuevoApellido) {
            notificaLateralError('No has modificado ningún valor');
            estadoBotones(botones, true);
            modal.hide();
        } else {
            envio = {
                name: nuevoNombre,
                surname: nuevoApellido
            };

            let cabeceras = new Headers();
            cabeceras.append("Content-Type", "application/json");

            auth.currentUser.getIdToken()
                .then(idToken => {
                    cabeceras.append("x-tokenid", idToken);
                    let peticion = {
                        method: 'PUT',
                        headers: cabeceras,
                        body: JSON.stringify(envio), //Envío la dirección de correo y si nos lo ha facilitado, el nombre y el apellido
                        redirect: 'follow'
                    };
                    const direccion = mustache.render(
                        '{{{dir}}}/users/user',
                        {
                            dir: direccionServidor,
                        });

                    fetch(direccion, peticion)
                        .then(response => {
                            switch (response.status) {
                                case 200:
                                    return response.json();
                                case 400:
                                    return response.text();
                                default:
                                    notificaLateralError(mustache.render('Error desconocido: {{{codigo}}}', { codigo: response.status }));
                                    return null;
                            }
                        })
                        .then(result => {
                            if (result) {
                                if (typeof result === 'string') {
                                    notificaLateralError(result);
                                } else {
                                    dUser.name = nuevoNombre;
                                    dUser.surname = nuevoApellido;
                                    notificaLateral('Datos del usuario actualizados');
                                }
                            }
                            estadoBotones(botones, true);
                            modal.hide();
                        })
                        .catch(error => {
                            estadoBotones(botones, true);
                            modal.hide();
                            notificaLateralError(mustache.render(
                                'Error: {{{e}}}',
                                {
                                    e: error
                                }
                            ));
                        });
                })
                .catch(error => {
                    estadoBotones(botones, true);
                    modal.hide();
                    notificaLateralError(mustache.render(
                        'Error: {{{e}}}',
                        {
                            e: error
                        }
                    ));
                });
        }
    }
    modal.show();
}

function mostrarModalContribuciones() {
    console.log('mostrarModalContribuciones()');
}
