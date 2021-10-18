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
    return await client.db(Config.nombreBD).collection(coleccion).insertOne(documento);
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

async function uidYaRegistrado(uid) {
    conectaBD();
    if (await client.db(Config.nombreBD).collection('rapida').findOne({ uid: uid }))
        return true;
    else
        return false;
}

async function dameColeccionUsuario(email) {
    conectaBD();
    const documento = await dameDocumentoRapida({ email: email });
    if (documento && documento.uid)
        return documento.uid;
    else
        return null;
}

async function dameDocumentoRapida(objetoABuscar) {
    conectaBD();
    return await client.db(Config.nombreBD).collection('rapida').findOne(objetoABuscar);
}

async function dameCorreoSiProfe(token) {
    conectaBD();
    const documento = await client.db(Config.nombreBD).collection('rapida').findOne({ sesion: token });
    let email = null;
    if (documento && documento.email && documento.uid) {
        email = documento.email;
    }
    if (email !== null) {
        const datosUsuario = await dameDatosDeColeccion(documento.uid);
        if (datosUsuario && datosUsuario.rol && datosUsuario.rol === 1) {
            return email;
        } else {
            return null;
        }
    }
}

async function dameDatosDeColeccion(coleccion) {
    return dameTareaDeColeccion('datos', coleccion);
}

async function dameDocumentoDeColeccion(idDoc, coleccion) {
    conectaBD();
    return await client.db(Config.nombreBD).collection(coleccion).findOne({ _id: idDoc });
}

async function dameTareaDeColeccion(tarea, coleccion) {
    conectaBD();
    return await client.db(Config.nombreBD).collection(coleccion).findOne({ idTarea: tarea });
}

async function correoVerificado(uid, verificado) {
    const update = {
        $set: {
            emailVerified: verificado
        }
    };
    conectaBD();
    client.db(Config.nombreBD).collection('rapida').updateOne({ uid: uid }, update);
}

async function modificaDocumentoDeColeccion(cambios, idDocumento, coleccion) {
    const update = {
        $set: cambios
    };
    conectaBD();
    return await client.db(Config.nombreBD).collection(coleccion).updateOne({ _id: idDocumento }, update);
}

module.exports = {
    dameColeccion,
    desconectaBD,
    guardaDocumentoEnColeccion,
    nuevoUsuarioEnColeccionRapida,
    usuarioYaRegistrado,
    uidYaRegistrado,
    correoVerificado,
    dameDocumentoRapida,
    //dameColeccionUsuario,
    dameDatosDeColeccion,
    dameTareaDeColeccion,
    dameDocumentoDeColeccion,
    //abreSesion,
    //cierraSesion,
    //dameColeccionToken,
    //dameCorreoSiProfe,
    modificaDocumentoDeColeccion,
}