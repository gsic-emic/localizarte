function creaIRIServidor(location) {
    return location.replace('https://casuallearn.gsic.uva.es/context/', 'http://127.0.0.1:11110/contexts/');
}

function calculaZonasParaDescargar(zona) {
    const pI = puntoInicio([zona.getNorth(), zona.getWest()]);
    const c = cuadriculas(pI, zona.getSouthEast());
    let pLng, pLat, puntoComprobacion, encontrado;
    faltan = 0;
    for (let i = 0; i < c.ch; i++) {
        pLng = pI.lng + (i * lado);
        for (let j = 0; j < c.cv; j++) {
            pLat = pI.lat + (j * lado);
            puntoComprobacion = L.latLng(pLat, pLng);
            encontrado = false;
            for (let zona of zonas) {
                if (zona.equals(puntoComprobacion)) {
                    encontrado = true;
                    break;
                }
            }
            if (!encontrado) {
                peticionZona(puntoComprobacion, zona);
            }
        }
    }
}

function puntoInicio(puntos) {
    let s = [];
    let esquina, gradosMax;
    for (let i = 0; i < 2; i++) {
        esquina = (i == 0) ?
            posicionCyL.lat - Math.floor((posicionCyL.lat - puntos[i]) / lado) * lado :
            posicionCyL.lng - Math.ceil((posicionCyL.lng - puntos[i]) / lado) * lado;
        gradosMax = (i + 1) * 90;
        if (Math.abs(esquina) > gradosMax) {
            if (esquina > gradosMax) {
                esquina = gradosMax;
            } else {
                if (esquina < (-1 * gradosMax)) {
                    esquina = (-1 * gradosMax);
                }
            }
        }
        s.push(esquina);
    }
    return L.latLng(s[0], s[1]);
}

function cuadriculas(noroeste, sureste) {
    return {
        cv: Math.ceil((noroeste.lat - sureste.lat) / lado),
        ch: Math.ceil((sureste.lng - noroeste.lng) / lado),
    };
}

function peticionZona(punto, zona) {
    const direccion = 'http://127.0.0.1:11110/contexts' + '?lat=' + punto.lat + '&long=' + punto.lng;

    var opciones = {
        method: 'GET',
        redirect: 'follow'
    };

    ++faltan;

    fetch(direccion, opciones)
        .then(response => {
            switch (response.status) {
                case 200:
                    return response.json();
                case 204:
                    return JSON.parse('{}');
                default:
                    return null;
            }
        })
        .then(result => {
            if (result) {
                if (result.length > 0) {
                    for (let json of result) {
                        json.posicion = L.latLng(json.lat, json.long);
                        pops.push(json);
                    }
                }
                zonas.push(punto);
                console.log("POP: " + pops.length);
                console.log("ZONAS: " + zonas.length);
            } else {

            }
        })
        .catch(error => console.log('error', error))
        .finally(() => {
            faltan = (faltan <= 0) ? 0 : faltan - 1;
            if (faltan <= 0) {
                pintaPoPs(zona);
            }
        });
}

function pintaPoPs(zona) {
    if (faltan <= 0) {
        let pop;

        capaMarcadores.clearLayers();

        for (let i = 0; i < pops.length; i++) {
            pop = pops[i];
            if (zona.contains(pop.posicion)) {
                markerPoP(pop);
            }
        }
    }
}

function markerPoP(pop) {
    let marker = L.marker(pop.posicion).addTo(capaMarcadores);
    marker.on('click', () => {
        let modal = new bootstrap.Modal(document.getElementById('puntoInteres'));
        const titulo = document.getElementById('tituloPuntoInteres');
        titulo.innerText = pop.titulo;
        const imagen = document.getElementById('imagenPuntoInteres');
        if (pop.thumb) {
            imagen.src = pop.thumb;
            imagen.style.display = 'inherit';
        }
        else {
            if (pop.imagen) {
                imagen.src = pop.imagen;
                imagen.style.display = 'inherit';
            } else {
                imagen.src = './resources/sinFoto.svg';
                imagen.style.display = 'inherit';
            }
        }

        if (pop.descr) {
            const descripcion = document.getElementById('descripcionPuntoInteres');
            descripcion.innerHTML = pop.descr;
        }

        document.getElementById('cerrarModalMarcador').onclick = () => cerrarPI();
        document.getElementById('eliminarPI').onclick = () => {
            eliminarPI(pop);
            modal.hide();
        };
        document.getElementById('modificarPI').onclick = () => modificarPI(pop);
        modal.show();
    }, { once: true });
}

function cerrarPI() {
    const imagen = document.getElementById('imagenPuntoInteres');
    imagen.src = '';
    imagen.style.display = 'none';
}

function eliminarPI(pop) {
    const direccion = creaIRIServidor(pop.ctx);
    const peticion = {
        method: 'DELETE',
        redirect: 'follow'
    };

    let encontrado = false;
    let i;
    for (i = 0; i < pops.length; i++) {
        if (pops[i].ctx == pop.ctx) {
            encontrado = true;
            break;
        }
    }

    if (encontrado) {
        fetch(direccion, peticion)
            .then(response => response.text())
            .then(result => {
                console.log(result);
                pops.splice(i, 1);
                pintaPoPs(map.getBounds());
            })
            .catch(error => console.log('error', error));
    }
}

function modificarPI(pop) {
    console.log(pop);
}

function creacionNuevoContexto(pos) {
    popup = L.popup(
        autoClose = true,
        closeButton = false
    )
        .setLatLng(pos.latlng)
        .setContent('<div<p>('
            + Number((pos.latlng.lat).toFixed(5))
            + ', '
            + Number((pos.latlng.lng).toFixed(5))
            + ')</p><a href="javascript:modalNPI(' + pos.latlng.lat + ',' + pos.latlng.lng + ');" style="padding-end:50%;padding-start:50%;color:black;al">Agregar pop</a>')
        .openOn(map);
    const botonEnviar = document.getElementById('enviarNPI');
    const titulo = document.getElementById('tituloNPI');
    const descr = document.getElementById('descrNPI');
    const imagen = document.getElementById('imagenNPI');
    const licencia = document.getElementById('licenciaNPI');
}


function modalNPI(lat, lng) {
    /*if(popup && popup.isOpen()){
        let modal = new bootstrap.Modal(document.getElementById('nuevoPuntoInteres'));
        const latitud = document.getElementById('latitudNPI');
        latitud.setAttribute('value', lat);
        const longitud = document.getElementById('longitudNPI');
        longitud.setAttribute('value', lng);

        console.log(lat,lng);
        return;
    }*/
    if (popup && popup.isOpen()) {
        document.getElementById("formNPI").reset();
        popup.remove();
        let modal = new bootstrap.Modal(document.getElementById('nuevoPuntoInteres'));
        const latitud = document.getElementById('latitudNPI');
        latitud.setAttribute('value', lat);
        const longitud = document.getElementById('longitudNPI');
        longitud.setAttribute('value', lng);
        const botonEnviar = document.getElementById('enviarNPI');
        const titulo = document.getElementById('tituloNPI');
        const descr = document.getElementById('descrNPI');
        const imagen = document.getElementById('imagenNPI');
        const licencia = document.getElementById('licenciaNPI');
        botonEnviar.addEventListener('click', (ev) => {
            ev.preventDefault();
            let todoOk = true;
            if (!titulo || !titulo.value || titulo.value.trim() === '') {
                todoOk = false;
                titulo.placeholder = 'El nuevo punto de interés necesita un título';
                titulo.className = 'form-control is-invalid';
            } else {
                titulo.className = 'form-control is-valid';
            }
            if (!descr || !descr.value || descr.value.trim() === '') {
                todoOk = false;
                descr.placeholder = 'El punto de interés necesita una descripción';
                descr.className = 'form-control is-invalid';
            } else {
                descr.className = 'form-control is-valid';
            }
            if (!latitud || !latitud.value || latitud.value.trim() === '') {
                todoOk = false;
                latitud.className = 'form-control is-invalid';
            }
            if (!longitud || !longitud.value || longitud.value.trim() === '') {
                todoOk = false;
                longitud.className = 'form-control is-invalid';
            }
            let lat, long;
            if (todoOk) {
                lat = Number(latitud.value.trim());
                if (lat < -90 || lat > 90) {
                    todoOk = false;
                    latitud.className = 'form-control is-invalid';
                }
                if (todoOk) {
                    long = Number(longitud.value.trim());
                    if (long < -180 || long > 180) {
                        todoOk = false;
                        longitud.className = 'form-control is-invalid';
                    }
                }
            }
            if (todoOk) {
                modal.hide();
                let envio = {
                    lat: lat,
                    long: long,
                    titulo: titulo.value.trim(),
                    descr: descr.value.trim(),
                    autor: 'pablogz@gsic.uva.es',
                };
                if (imagen && imagen.value && imagen.value.trim() !== '') {
                    envio.imagen = imagen.value.trim();
                }
                if (licencia && licencia.value && licencia.value.trim() !== '') {
                    envio.licencia = licencia.value.trim();
                }
                envio = JSON.stringify(envio);
                console.log(envio);

                longitud.className = 'form-control';
                latitud.className = 'form-control';
                descr.className = 'form-control';
                titulo.className = 'form-control';
                //Envío los datos al servidor para que los agregue
                let direccion = 'http://127.0.0.1:11110/contexts';
                let myHeaders = new Headers();
                myHeaders.append("Content-Type", "application/json");
                const requestOptions = {
                    method: 'POST',
                    headers: myHeaders,
                    body: envio,
                    redirect: 'follow',
                };

                let location = null;

                fetch(direccion, requestOptions)
                    .then(response => response.json())
                    .then(data => {
                        peticionInfoPoP(data.ctx);
                    })
                    .catch(error => console.log('error', error));
            }
        }, { once: true });
        modal.show();
    }

    function peticionInfoPoP(location) {

        const direccion = creaIRIServidor(location);
        console.log(direccion);
        var xhr = new XMLHttpRequest();

        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
                const respuesta = JSON.parse(this.responseText);
                respuesta.posicion = L.latLng(respuesta.lat, respuesta.long);
                pops.push(respuesta);
                pintaPoPs(map.getBounds());
            }
        });

        xhr.open("GET", direccion);

        xhr.send();
    }
}