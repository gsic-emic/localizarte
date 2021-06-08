const { MongoClient } = require('mongodb');

const Config = require('./config');

const client = new MongoClient(
    Config.mongoDireccion,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

async function conectaBD() {
    if (!client.isConnected())
        await client.connect();
}

async function desconectaBD() {
    await client.close();
}

function dameColeccion(coleccion) {
    conectaBD();
    return client.db(Config.nombreBD).collection(coleccion);
}

async function guardaDocumentoEnColeccion(documento, coleccion) {
    conectaBD();
    await client.db(Config.nombreBD).collection(coleccion).insertOne(documento);
}

async function nuevoUsuarioEnColeccionRapida(documento) {
    conectaBD();
    await client.db(Config.nombreBD).collection('rapida').insertOne(documento);
}

async function usuarioYaRegistrado(email) {
    conectaBD();
    if (await client.db(Config.nombreBD).collection('rapida').findOne({ email: email }))
        return true;
    else
        return false;
}

async function dameColeccionUsuario(email) {
    conectaBD();
    const documento = await client.db(Config.nombreBD).collection('rapida').findOne({ email: email });
    if (documento && documento.uid)
        return documento.uid;
    else
        return null;
}

async function dameDatosDeColeccion(coleccion) {
    return dameTareaDeColeccion('datos', coleccion);
}

async function dameTareaDeColeccion(tarea, coleccion) {
    conectaBD();
    return await client.db(Config.nombreBD).collection(coleccion).findOne({ idTarea: tarea });
}

async function abreSesion(valor, email) {
    const update = {
        $set: {
            sesion: valor
        }
    };
    conectaBD();
    return await client.db(Config.nombreBD).collection('rapida').updateOne({ email: email }, update);
}

async function cierraSesion(token) {
    const update = {
        $set: {
            sesion: ''
        }
    };
    conectaBD();
    return await client.db(Config.nombreBD).collection('rapida').updateOne({ sesion: token }, update);
}

module.exports = {
    dameColeccion,
    desconectaBD,
    guardaDocumentoEnColeccion,
    nuevoUsuarioEnColeccionRapida,
    usuarioYaRegistrado,
    dameColeccionUsuario,
    dameDatosDeColeccion,
    dameTareaDeColeccion,
    abreSesion,
    cierraSesion,
}