//Zonas descargadas
let zonas = [];
//Puntos de interés descargados
let pops = [];
//Valladolid
const position = L.latLng(41.651981, -4.728561);//Según wikipedia: https://geohack.toolforge.org/geohack.php?language=es&pagename=Valladolid&params=41.651980555556_N_-4.7285611111111_E_type:city (PRUEBAS)

const posicionCyL = L.latLng(41.383333, -4.45); //Según wikipedia: https://geohack.toolforge.org/geohack.php?language=es&pagename=Castilla_y_Le%C3%B3n&params=41.383333333333_N_-4.45_E_type:city

//Declar el popup para agregar
let popup = null;

//Lado zona
const lado = 0.0254;

//Zonas por descargar
let faltan = 0;

// Mapa
let map = L.map('mapa');
// Capa donde se agregan los marcadores. Para facilitar su eliminación
let capaMarcadores = L.layerGroup().addTo(map);

map.on('load', () => {
    if (map.getZoom() > 13) {
        calculaZonasParaDescargar(map.getBounds());
        pintaPoPs(map.getBounds());
    } else {
        if (capaMarcadores.getLayers()){
            capaMarcadores.clearLayers();
        }
    }
});

L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://casuallearn.gsic.uva.es" target="_blank">CasualLearn</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">HOT</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
}).addTo(map);


//Posición inicial
map.setView(position, 19);//4.5

map.on('moveend', () => {
    if (map.getZoom() > 13) {
        calculaZonasParaDescargar(map.getBounds());
        pintaPoPs(map.getBounds());
    } else {
        if (capaMarcadores.getLayers()){
            capaMarcadores.clearLayers();
        }
    }
});

map.on('contextmenu', (pos) => {
    creacionNuevoContexto(pos);
});
