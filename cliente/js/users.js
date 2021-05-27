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
 * version: 20210526
 */

function inicioSesionModal() {
    console.log('inicioSesionModal');
    document.getElementById('gestionUsuarioLista').innerHTML = '<li class="nav-item"><a class="nav-link" href="javascript:inicioSesionModal();">Identificación</a></li><li class="nav-item"><a class="nav-link" href="javascript:registroModal();">Registro</a></li>';
}

function registroModal() {
    console.log('registroModal');
    document.getElementById('gestionUsuarioLista').innerHTML = '<li class="nav-item"><a class="nav-link"  href="javascript:registroModal();">Registro</a></li><li class="nav-item"><a class="nav-link" href="javascript:inicioSesionModal();">Identificación</a></li>';
}