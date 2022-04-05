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
 * Funciones para la gestión inicial del mapa
 * autor: Pablo García Zarza
 * version: 20211112
 */

/** Zonas descargadas */
let zonas;

/** Puntos de interés descargados */
let pois;

/** Valladolid */
const position = L.latLng(41.651981, -4.728561);//Según wikipedia: https://geohack.toolforge.org/geohack.php?language=es&pagename=Valladolid&params=41.651980555556_N_-4.7285611111111_E_type:city (PRUEBAS)

/** Posición inicial */
const posicionCyL = L.latLng(41.383333, -4.45); //Según wikipedia: https://geohack.toolforge.org/geohack.php?language=es&pagename=Castilla_y_Le%C3%B3n&params=41.383333333333_N_-4.45_E_type:city

/** Declaro el popup para agregar */
let popup = null;

/** Lado zona */
const lado = 0.0254;

/** Zonas por descargar */
let faltan;

/** Mapa */
let map;
/** Capa donde se agregan los marcadores. Para facilitar su eliminación */
let capaMarcadores;

/** El usuario ha activado su seguimiento. Se está recuperando su posición */
let siguiendo;
/** Indicador de la posición del usuario */
let indicador;

/** Marcadores representados en el mapa */
let markers = null;

/** Popovers */
let popoverTriggerList;
let popoverList;
/** Tooltips */
let tooltipTriggerList, tooltipList;

let tokenSesion;
let rol;
let dUser;

let app;
let auth, analytics;

const spinnerCentro = document.getElementById('divSpinner');

let answers;

let language;

let geoWatch;

let teselas, teselasM;
let teselasCache;

let ultimaPeticionNPois = 0;
let dpi;

let maxZoom;
let inicioTeselas;

inicio();

/**
 * Función para iniciar el cliente. La creación de esta función está motivada para
 * capturar las posibles excepciones que pudieran ocurrir.
 */
function inicio() {
    zonas = [];
    pois = [];
    answers = [];
    popup = null;
    faltan = 0;

    teselas = null;
    teselasM = null;
    teselasCache = [];

    addClickEvent(['infoNavBar', 'signUpNavBar', 'signInNavBar', 'interruptorProfesor', 'seguir']);

    // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/language
    if (/^es\b/.test(navigator.language)) {
        setLanguage('es');
    } else {
        setLanguage('en');
    }

    map = L.map('mapa',
        {
            zoomControl: false,
            worldCopyJump: true
        });
    map.attributionControl.setPrefix('<a target="_blank" href="https://leafletjs.com/">Leaflet</a>');
    capaMarcadores = L.layerGroup().addTo(map);

    siguiendo = false;
    indicador = null;

    /*L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 3,
        attribution: '&copy; <a target="_blank" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">HOT</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
    }).addTo(map);*/

    /*L.tileLayer('https://api.mapbox.com/styles/v1/pablogz/ckvpj1ed92f7u14phfhfdvkor/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoicGFibG9neiIsImEiOiJja3Z4b3VnaTUwM2VnMzFtdjJ2Mm4zajRvIn0.q0l3ZzhT4BzKafNxdQuSQg', {
        maxZoom: 20,
        minZoom: 4,
        attribution: '&copy; <a target="_blank" href="https://www.mapbox.com/about/maps/">Mapbox</a> | &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" >OpenStreetMap</a> contributors'
    }).addTo(map);*/

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 20,
        minZoom: 4,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    }).addTo(map);

    /*L.tileLayer('', {
        maxZoom: 20,
        minZoom: 3,
        attribution: ''
    }).addTo(map);*/

    maxZoom = map.getMaxZoom();

    // Mapa cargado
    map.on('load', () => {
        if (markers) {
            markers.clearLayers();
        }
        if (teselas) {
            teselas.clearLayers();
        }
        if (teselasM) {
            teselasM.clearLayers();
        }
        if (map.getZoom() >= 13) {
            calculaZonasParaDescargar(map.getBounds());
            pintaPOIs(map.getBounds());
        } else {
            obtenNPOIs();
        }
    });

    //Posición inicial
    map.setView(posicionCyL, 8);//espa, 4.5
    //map.setView([40.7614, -73.9746], 14);

    // El mapa se ve desplazado
    map.on('moveend', () => {
        if (map.getZoom() >= 13) {
            if (markers) {
                markers.clearLayers();
            }
            if (teselas) {
                teselas.clearLayers();
            }
            if (teselasM) {
                teselasM.clearLayers();
            }
            calculaZonasParaDescargar(map.getBounds());
            pintaPOIs(map.getBounds());
        } else {
            if (new Date() - ultimaPeticionNPois > 500) {
                if (markers) {
                    markers.clearLayers();
                }
                if (teselas) {
                    teselas.clearLayers();
                }
                if (teselasM) {
                    teselasM.clearLayers();
                }
                ultimaPeticionNPois = new Date();
                obtenNPOIs();
            }
        }
    });

    // Pulsación con el botón derecho del ratón o tap largo
    map.on('contextmenu', (pos) => {
        if (rol !== null && rol > 0) {
            creacionNuevoContexto(pos);
        }
    });

    popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl)
    });

    tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });

    tokenSesion = null;
    rol = null;
    dUser = null;

    app = firebase.initializeApp(firebaseConfig);
    auth = app.auth();
    //analytics = app.analytics();
    auth.languageCode = language;
    if (auth && auth.currentUser) {
        recuperaDatosUsuarioServidor(null, null, true);
    }

    geoWatch = null;
}



/**
 * Función para obtener la posición del usuario. La primera pulsación activa el seguimiento.
 * Una vez activado el seguimiento: si el mapa está descentrado con una pulsación lo centra;
 * si está centrado deja de obtener la posición del usuario.
 */
function seguir() {
    const iconoCentrar = document.getElementById('imagenSeguir');

    if (geoWatch === null) {
        geoWatch = navigator.geolocation.watchPosition(
            position => {
                if (indicador) {
                    map.removeLayer(indicador);
                } else {
                    iconoCentrar.src = './resources/centrarON.svg';
                    map.setView(L.latLng(position.coords.latitude, position.coords.longitude), 17);
                }
                indicador = L.circle(L.latLng(position.coords.latitude, position.coords.longitude), {
                    radius: Math.max((position.coords.accuracy / 2), 10),
                    stroke: true,
                    opacity: 0.6,
                    fillOpacity: 0.5,
                }).addTo(map);
                siguiendo = true;
            },
            error => {
                if (error.code !== 3) {//TIMEOUT
                    notificaLateralError(error.message);
                }
                navigator.geolocation.clearWatch(geoWatch);
                geoWatch = null;
                iconoCentrar.src = './resources/centrar.svg';
                siguiendo = false;
                if (indicador) {
                    map.removeLayer(indicador);
                }
                indicador = null;
            },
            {
                timeout: 90000,
                maximumAge: 2000,
                enableHighAccuracy: true,
            }
        );
    } else {
        if (indicador && !indicador.getLatLng().equals(map.getCenter(), 0.0001)) {//Tolero error de 10^-4 por cambios de nivel de zum etc.
            map.setView(indicador.getLatLng(), 17);
        } else {
            navigator.geolocation.clearWatch(geoWatch);
            geoWatch = null;
            iconoCentrar.src = './resources/centrar.svg';
            siguiendo = false;
            if (indicador) {
                map.removeLayer(indicador);
            }
            indicador = null;
        }
    }
}

function cambiaVistaProfesor() {
    rol = rol * -1;
    if (rol > 0) {
        document.getElementById('swVistaProfesor').checked = true;
        document.getElementById('labelVistaProfesor').className = "form-check-label colorActivo";
        document.getElementById('gestionUsuarioLista').innerHTML = mustache.render(
            '<li class="nav-item dropdown"><a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false" id="dropdownLanguage">{{{actualLanguage}}}</a><ul class="dropdown-menu dropdown-menu-dark" aria-labelledby="dropdownLanguage"> <li><a class="dropdown-item" href="#" onclick="setLanguage(\'es\');">ES - Español</a></li><li><a class="dropdown-item" href="#" onclick="setLanguage(\'en\');">EN - English</a></li></ul></li><li class="nav-item"><a class="nav-link" href="javascript:mostrarModalContribuciones();" id="contributionsNavBar">{{{contribuciones}}}</a></li><li class="nav-item"><a class="nav-link" href="javascript:gestionarCuenta();" id="userDataNavBar">{{{userData}}}</a></li><li class="nav-item"><a class="nav-link" href="javascript:cerrarSesion();" id="signOutNavBar">{{{signOut}}}</a></li>',
            {
                actualLanguage: language.toUpperCase(),
                contribuciones: translate.contributionsNavBar[language],
                userData: translate.userDataNavBar[language],
                signOut: translate.signOutNavBar[language]
            });
    } else {
        document.getElementById('swVistaProfesor').checked = false;
        document.getElementById('labelVistaProfesor').className = "form-check-label";
        document.getElementById('gestionUsuarioLista').innerHTML = mustache.render(
            '<li class="nav-item dropdown"><a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false" id="dropdownLanguage">{{{actualLanguage}}}</a><ul class="dropdown-menu dropdown-menu-dark" aria-labelledby="dropdownLanguage"> <li><a class="dropdown-item" href="#" onclick="setLanguage(\'es\');">ES - Español</a></li><li><a class="dropdown-item" href="#" onclick="setLanguage(\'en\');">EN - English</a></li></ul></li><li class="nav-item"><a class="nav-link" href="javascript:mostrarModalRespuestas();" id="answersNavBar">{{{respuestas}}}</a></li><li class="nav-item"><a class="nav-link" href="javascript:gestionarCuenta();" id="userDataNavBar">{{{userData}}}</a></li><li class="nav-item"><a class="nav-link" href="javascript:cerrarSesion();" id="signOutNavBar">{{{signOut}}}</a></li>',
            {
                actualLanguage: language.toUpperCase(),
                respuestas: translate.answersNavBar[language],
                userData: translate.userDataNavBar[language],
                signOut: translate.signOutNavBar[language],
            }
        );
    }
}
