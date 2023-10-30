const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const db = require('./db.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const client = new Client({
    authStrategy: new LocalAuth()
});

app.listen(port, () => {
    console.log(`La aplicación está escuchando en el puerto ${port}`);
});

db.connect()
    .then(() => {
        console.log('Conectado a la base de datos');
    })
    .catch((err) => {
        console.log('Error al conectar a la base de datos: ', err);
    });

const regex = /^Pedido (\d+)$/;

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Conexión exitosa');
});

client.on('message', async (message) => {
    console.log(message.body);
    const match = message.body.match(regex);

    if (match) {
        const numeroPedido = match[1];

        try {
            const result = await db.query(
                `SELECT est_descri FROM tesis.Pedido
                LEFT JOIN tesis.Estado ON ped_estado = est_codigo
                WHERE ped_codigo = ${numeroPedido};`
            );

            if (result.length > 0) {
                const estadoPedido = JSON.stringify(result[0][0]["est_descri"]);
                console.log(estadoPedido);
                const responseMessage = `Estado pedido: ${estadoPedido}`;                
                client.sendMessage(message.from, responseMessage);
            } else {
                client.sendMessage(message.from, "No se encontró el pedido especificado.");
            }
        } catch (error) {
            console.error('Error al consultar la base de datos:', error);
            client.sendMessage(message.from, "Ocurrió un error al consultar la base de datos.");
        }
    } else {
        client.sendMessage(message.from, 'El formato del mensaje debe ser "Pedido NÚMERO_PEDIDO" Ejemplo: Pedido 1524. Por favor, asegúrate de incluir la palabra "Pedido" seguida de un espacio y el número de pedido.');
    }
});

client.initialize();
