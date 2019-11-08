"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

//imports
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const bodyParser = require("body-parser");

//init
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
const app = express();
const main = express();
main.use('/api/v1', app);
main.use(bodyParser.json());
exports.webApi = functions.https.onRequest(main);

//methods
app.get('/warmup', async (request, response) => {
    response.send('Warming up friendssssssssss.');
});

app.get('/warmupes', (request, response) => {
    admin.firestore().doc("vuelos").get()
        .then(snapshot => {
            const data = snapshot.data()
            response.send(data)
        }).catch(error => {
            response.status(426).send(error);
        })
});

app.post('/vuelos', async (request, response) => {
    try {
        const { winner, losser, title } = request.body;
        const data = {
            losser,
            title, winner
        }

        const fightRef = await db.collection('vuelos').add(data);
        const fight = await fightRef.get();

        response.json({
            id: fightRef.id,
            data: fight.data()
        });

    } catch (error) {

        response.status(500).send(error);

    }
});

app.get('/vuelos/:id', async (request, response) => {
    try {
        const fightId = request.params.id;

        if (!fightId) throw new Error('vuelos ID is required');

        const fight = await db.collection('vuelos').doc(fightId).get();

        if (!fight.exists) {
            throw new Error('vuelos doesnt exist.')
        }

        response.json({
            id: fight.id,
            data: fight.data()
        });

    } catch (error) {

        response.status(500).send(error);

    }
});

app.get('/vuelos', async (request, response) => {
    try {

        const fightQuerySnapshot = await db.collection('vuelos').get();
        const fights = [];
        fightQuerySnapshot.forEach(
            (doc) => {
                fights.push({
                    id: doc.id,
                    data: doc.data()
                });
            }
        );

        response.json(fights);

    } catch (error) {

        response.status(500).send(error);

    }

});

app.put('/vuelos/:id', async (request, response) => {
    try {

        const fightId = request.params.id;
        const title = request.body.title;

        if (!fightId) throw new Error('id is blank');

        if (!title) throw new Error('Title is required');

        const data = {
            title
        };
        const fightRef = await db.collection('vuelos')
            .doc(fightId)
            .set(data, { merge: true });

        response.json({
            id: fightId,
            data
        })


    } catch (error) {

        response.status(500).send(error);

    }

});

app.delete('/vuelos/:id', async (request, response) => {
    try {

        const fightId = request.params.id;

        if (!fightId) throw new Error('id is blank');

        await db.collection('vuelos')
            .doc(fightId)
            .delete();

        response.json({
            id: fightId,
        })


    } catch (error) {

        response.status(500).send(error);

    }

});

//SEPRO FUNCTIONS

app.post('/login', async (request, response) => {
    try {
        const { email, pass } = request.body;
        const data = { email, pass }
        console.log(data);
        await db.collection('users')
            .where('email', '==', data.email)
            .where('pass', '==', data.pass).get()
            .then(snapshot => {
                if (snapshot.empty) {
                    console.log('no hay usuarios con esas credenciales');
                    response.status(400).response.send("no hay usuarios con esas credenciales");
                    return;
                }
                snapshot.forEach(doc => {
                    console.log(doc.id, '=>', doc.data());
                    console.log('si se encontro un usuario')
                    if (data.email == "laura@gmail.com" && data.pass == "laura123") {
                        console.log('el usuario es admin')
                        response.status(200).send("ADMIN"); //////////////////
                    } else {
                        response.status(200).send("USER"); //////////////////
                    }
                });
            })
            .catch(err => {
                console.log('error obteniendo usuarios', err);
                throw new Error('error obteniendo usuarios')
            });
    } catch (error) {
        response.status(500).send(error);
    }
});

app.post('/registro', async (request, response) => {
    try {
        //body
        const { email, nombres, pass } = request.body;

        //variables
        const datahojaVida = { nombres }
        const dataToValidate = { email, pass }
        const validatedData = validateDataRegistro(dataToValidate, response)

        if (validatedData) {
            console.log('validateData no existe')
            //se crea la hoja de vida
            const crearHV = await db.collection('hojaVida').add(datahojaVida);
            const creado = await crearHV.get();
            const hojaVidaId = creado.id
            const dataUser = { email, pass, hojaVidaId }

            //se crea el usuario
            await db.collection('users').add(dataUser).then(result => {
                console.log('usario creado')
                //response.send("OKSEPRO");
                response.status(200).json({
                    id: hojaVidaId
                }); ///////////////////////////////////////

            }).catch(err => {
                console.log('no se pudo crear')
                response.status(400).send("no se pudo crear");
                return;
            })
        }
    } catch (error) {
        console.log('error catch')
        response.status(500).send(error);
    }
});

async function validateDataRegistro(dataToValidate, response) {
    var validateData
    await db.collection('users')
        .where('email', '==', dataToValidate.email)
        .where('pass', '==', dataToValidate.pass).get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.log('se puede crear');
                validateData = true
            }
            snapshot.forEach(doc => {
                validateData = false
                console.log('no se puede crear, ya existe')
                response.status(400).send("este usuario ya existe");
            });
        })
        .catch(err => {
            validateData = false
            console.log('error creando usuarios', err);
            throw new Error('error creando usuarios')
        });
    return validateData
}

