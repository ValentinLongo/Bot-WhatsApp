const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const db = require('./db.js');

// Crea una instancia de la clase Client para el bot de WhatsApp
const client = new Client({
    authStrategy: new LocalAuth() // Utiliza la autenticación local
});

// Importa el módulo express para crear una aplicación web
const express = require('express');
const app = express();

// Define rutas y controladores de Express aquí

// Define el puerto en el que se ejecutará la aplicación, usando 3000 como valor predeterminado
const port = process.env.PORT || 3000;

// Inicia la aplicación y comienza a escuchar en el puerto especificado
app.listen(port, () => {
    console.log(`La aplicación está escuchando en el puerto ${port}`);
});

// Conecta a la base de datos
db.connect()
    .then(() => {
        console.log('Conectado a la base de datos');
    })
    .catch((err) => {
        console.log('Error al conectar a la base de datos: ', err);
    });

// Configura un evento para mostrar el código QR de autenticación
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

// Configura un evento que se dispara cuando el cliente de WhatsApp está listo
client.on('ready', () => {
    console.log('Conexión exitosa');
});

// Configura un evento que se dispara cuando se recibe un mensaje
client.on('message', message => {
    console.log(message.body);

    // Puedes responder a mensajes aquí
    if (message.body.toLowerCase() === 'hola') {
        client.sendMessage(message.from, 'Hola, soy un bot');
    }
});

// Inicializa el cliente de WhatsApp
client.initialize();
