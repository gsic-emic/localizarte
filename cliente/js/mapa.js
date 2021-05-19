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
 * version: 20210518
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


inicio();

/**
 * Función para iniciar el cliente. La creación de esta función está motivada para 
 * capturar las posibles excepciones que pudieran ocurrir.
 */
function inicio() {
    zonas = [];
    pois = [];
    popup = null;
    faltan = 0;
    map = L.map('mapa');
    capaMarcadores = L.layerGroup().addTo(map);

    siguiendo = false;
    indicador = null;

    // Mapa cargado
    map.on('load', () => {
        if (map.getZoom() > 13) {
            calculaZonasParaDescargar(map.getBounds());
            pintaPOIs(map.getBounds());
        } else {
            if (map.getZoom() < 11) {
                if (markers) {
                    markers.clearLayers();
                }
            }
        }
    });

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '<a href="https://casuallearn.gsic.uva.es" target="_blank">CasualLearn</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">HOT</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
    }).addTo(map);

    //Posición inicial
    map.setView(posicionCyL, 4.5);//4.5

    // El mapa se ve desplazado
    map.on('moveend', () => {
        if (map.getZoom() > 13) {
            calculaZonasParaDescargar(map.getBounds());
            pintaPOIs(map.getBounds());
        } else {
            if (map.getZoom() < 11) {
                if (markers) {
                    markers.clearLayers();
                }
            }
        }
    });

    // Pulsación con el botón derecho del ratón o tap largo
    map.on('contextmenu', (pos) => {
        creacionNuevoContexto(pos);
    });
}


/**
 * Función para obtener la posición del usuario. La primera pulsación activa el seguimiento. 
 * Una vez activado el seguimiento: si el mapa está descentrado con una pulsación lo centra;
 * si está centrado deja de obtener la posición del usuario.
 */
function seguir() {
    const iconoCentrar = document.getElementById('imagenSeguir');
    if (!siguiendo) {

        map.locate({
            setView: false,
            maxZoom: 19,
            watch: true,
        });

        map.on('locationfound', (e) => {
            if (indicador) {
                map.removeLayer(indicador);
            } else {
                iconoCentrar.src = './resources/centrarON.svg';
                map.setView(e.latlng, 17);
            }
            indicador = L.circle(e.latlng, {
                radius: (e.accuracy / 2),
                stroke: true,
                opacity: 0.6,
                fillOpacity: 0.5,
            }).addTo(map);
            siguiendo = true;
        });

        map.on('locationerror', (e) => {
            alert(e.message);
            siguiendo = false;
            indicador = null;
            map.stopLocate();
        });
    } else {
        if (indicador && !indicador.getLatLng().equals(map.getCenter(), 0.0001)) {//Tolero error de 10^-4 por cambios de nivel de zum etc.
            map.setView(indicador.getLatLng(), map.getZoom());
        } else {
            map.stopLocate();
            iconoCentrar.src = './resources/centrar.svg';
            siguiendo = false;
            if (indicador) {
                map.removeLayer(indicador);
            }
            indicador = null;
        }
    }
}
