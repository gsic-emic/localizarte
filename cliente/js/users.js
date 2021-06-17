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
 * version: 20210608
 */

function inicioSesionUsuario() {
    const modal = new bootstrap.Modal(document.getElementById('inicioSesionModal'));
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
        inicioPass: 'Se necesita una contraseña'
    };
    const equivalencias = {
        inicioMail: 'email',
        inicioPass: 'pass'
    }


    document.getElementById("inicioEnviar").onclick = (ev) => {
        ev.preventDefault();
        let todoOk = true;
        camposObligatorios.forEach(campo => {
            switch (campo.id) {
                case 'inicioPass':
                    if (!campo || !campo.value) {
                        todoOk = false;
                        campo.placeholder = mensajes[campo.id];
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

            let myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");

            let requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: JSON.stringify(envio),
                redirect: 'follow'
            };

            const direccion = mustache.render('{{{dir}}}/sesiones', { dir: direccionServidor });

            fetch(direccion, requestOptions)
                .then(response => {
                    switch (response.status) {
                        case 201:
                            return response.json();
                        case 403:
                            return response.text();
                        default:
                            notificaLateralError(mustache.render('Error desconocido: {{{codigo}}}', { codigo: response.status }));
                            return null;
                    }
                })
                .then(result => {
                    if (result) {
                        if (typeof result !== 'string') {
                            notificaLateral('Hola de nuevo');
                            tokenSesion = result.sesion;
                            rol = result.rol;
                            if (rol > 0) {
                                document.getElementById('interruptorProfesor').removeAttribute('hidden');
                                if (!document.getElementById('swVistaProfesor').checked) {
                                    document.getElementById('swVistaProfesor').checked = true;
                                }
                            } else {
                                document.getElementById('interruptorProfesor').setAttribute('hidden', 'true');
                            }
                            document.getElementById('gestionUsuarioLista').innerHTML = '<li class="nav-item"><a class="nav-link" href="javascript:cerrarSesion();">Cerrar sesión</a></li><li class="nav-item"><a class="nav-link" href="javascript:gestionarCuenta();">Gestión cuenta</a></li>';
                            modal.hide();
                        } else {
                            notificaLateralError(result);
                        }
                    }
                })
                .catch(error => {
                    console.log('error', error);
                    notificaLateralError('Se ha producido un error desconocido');
                });
        }
    }
    modal.show();
}

function registroUsuario() {
    const modal = new bootstrap.Modal(document.getElementById('nuevoUsuarioModal'));
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
        registroMail: 'Se necesita una dirección de correo',
        registroPass: 'Se necesita una contraseña',
        registroNombre: 'Se necesita un nombre',
        registroApellido: 'Se necesita un apellido'
    };
    const equivalencias = {
        registroMail: 'email',
        registroPass: 'pass',
        registroNombre: 'nombre',
        registroApellido: 'apellido'
    }
    document.getElementById('registroEnviar').onclick = ev => {
        ev.preventDefault();
        let todoOk = true;
        camposObligatorios.forEach(campo => {
            switch (campo.id) {
                case 'registroPass':
                    if (!campo || !campo.value) {
                        todoOk = false;
                        campo.placeholder = mensajes[campo.id];
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
            campos.forEach(campo => {
                campo.className = 'form-control';
            });
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
            camposOpcionales.forEach(campo => {
                if (campo.value && campo.value.trim() !== '') {
                    envio[equivalencias[campo.id]] = campo.value.trim();
                }
            });

            let myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");

            let requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: JSON.stringify(envio),
                redirect: 'follow'
            };

            const direccion = mustache.render('{{{dir}}}/users', { dir: direccionServidor });

            fetch(direccion, requestOptions)
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
                    if (result) {
                        if (typeof result === 'string') {
                            notificaLateralError('El usuario ya se ha registrado previamente en LocalizARTE');
                            modal.hide();
                        } else {
                            notificaLateral('Usuario registrado correctamente en LocalizARTE');
                            tokenSesion = result.sesion;
                            rol = result.rol;
                            document.getElementById('gestionUsuarioLista').innerHTML = '<li class="nav-item"><a class="nav-link" href="javascript:cerrarSesion();">Cerrar sesión</a></li><li class="nav-item"><a class="nav-link" href="javascript:gestionarCuenta();">Gestión cuenta</a></li>';
                            modal.hide();
                        }
                    }
                })
                .catch(error => {
                    console.log('error', error);
                    notificaLateralError('Se ha producido un error desconocido');
                });
        }
    }
    modal.show();
}

function cerrarSesion() {
    const modal = new bootstrap.Modal(document.getElementById('confirmarCerrar'));
    document.getElementById('aceptaCerrarSesion').onclick = ev => {
        ev.preventDefault();
        if (tokenSesion != null) {
            var requestOptions = {
                method: 'DELETE',
                redirect: 'follow'
            };

            const direccion = mustache.render('{{{dir}}}/sesiones/{{{token}}}', { dir: direccionServidor, token: tokenSesion });
            fetch(direccion, requestOptions)
                .then(response => {
                    switch (response.status) {
                        case 200:
                            return { codigo: 200 };
                        default:
                            notificaLateralError(mustache.render('Error desconocido: {{{codigo}}}', { codigo: response.status }));
                            return null;
                    }
                })
                .then(result => {
                    if (result) {
                        document.getElementById('gestionUsuarioLista').innerHTML = '<li class="nav-item"><a class="nav-link"  href="javascript:registroUsuario();">Registro</a></li><li class="nav-item"><a class="nav-link" href="javascript:inicioSesionUsuario();">Identificación</a></li>';
                        tokenSesion = null;
                        if (rol !== 0) {
                            document.getElementById('interruptorProfesor').setAttribute('hidden', true);
                        }
                        rol = null;
                        modal.hide();
                        notificaLateral('Sesión cerrada correctamente');
                    }
                })
                .catch(error => {
                    console.log('error', error);
                    notificaLateralError('Se ha producido un error desconocido');
                });
        } else {
            document.getElementById('gestionUsuarioLista').innerHTML = '<li class="nav-item"><a class="nav-link"  href="javascript:registroUsuario();">Registro</a></li><li class="nav-item"><a class="nav-link" href="javascript:inicioSesionUsuario();">Identificación</a></li>';
            rol = null;
            modal.hide();
        }

    };
    modal.show();
}

function gestionarCuenta() {
    console.log('gestionCuenta')
}