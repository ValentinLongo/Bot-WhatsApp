const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const db = require('./db.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const client = new Client({
    authStrategy: new LocalAuth()
});

const estados = {}; // Almacena los estados por número de teléfono

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

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Conexión exitosa');
});

client.on('message', async (message) => {
    const from = message.from;
    const numeroPedidoRegex = /^(\d+)$/;
    const numeroDocumentoRegex = /^(\d+)$/;

    if (!estados[from]) {
        // Si no hay un estado para este número
        client.sendMessage(from, 'Seleccione 1 para buscar por número de pedido o 2 para buscar por número de documento');
        estados[from] = 'SELECT_TYPE'; // Establecer el estado como 'SELECT_TYPE'
    } else {
        const currentState = estados[from];

        switch (currentState) {
            case 'SELECT_TYPE':
                if (message.body === '1') {
                    estados[from] = 'PEDIDO_NUMBER';
                    client.sendMessage(from, 'Envíe el número de pedido');
                } else if (message.body === '2') {
                    estados[from] = 'DOCUMENT_NUMBER';
                    client.sendMessage(from, 'Envíe el número de documento');
                } else {
                    client.sendMessage(from, 'Por favor, seleccione 1 o 2');
                }
                break;

        case 'PEDIDO_NUMBER':
            const match = message.body.match(numeroPedidoRegex);
            if (match) {
                const numeroPedido = match[1];
                try {
                    const result = await db.query(
                        `SELECT est_descri FROM tesis.Pedido
                        LEFT JOIN tesis.Estado ON ped_estado = est_codigo
                        LEFT JOIN tesis.Usuario ON ped_usuario = usu_codigo
                        WHERE ped_codigo = ${numeroPedido};`
                    );
                    if (result.length > 0) {
                        const estadoPedido = JSON.stringify(result[0][0]["est_descri"]);
                        client.sendMessage(from, `Estado del pedido: ${estadoPedido}`);
                    } else {
                        client.sendMessage(from, "No se encontró el pedido especificado.");
                    }
                } catch (error) {
                    if (error.message.includes('No se encontró el pedido')) {
                        client.sendMessage(from, "No se encontró el pedido especificado.");
                    } else {
                        console.error('Error al consultar la base de datos:', error);
                        client.sendMessage(from, "Ocurrió un error al consultar la base de datos.");
                    }
                }
                delete estados[from];
            } else {
                client.sendMessage(from, 'Por favor, envíe un número de pedido válido');
            }
            break;

        case 'DOCUMENT_NUMBER':
            const matchDocumento = message.body.match(numeroDocumentoRegex);
            if (matchDocumento) {
                const numeroDocumento = matchDocumento[1];
                try {
                    const result = await db.query(
                        `SELECT est_descri FROM tesis.Pedido
                        LEFT JOIN tesis.Estado ON ped_estado = est_codigo
                        LEFT JOIN tesis.Usuario ON ped_usuario = usu_codigo
                        WHERE usu_dni = ${numeroDocumento};`
                    );
                    if (result.length > 0) {
                        const estadoPedido = JSON.stringify(result[0][0]["est_descri"]);
                        client.sendMessage(from, `Estado del pedido: ${estadoPedido}`);
                    } else {
                        client.sendMessage(from, "No se encontró el documento especificado.");
                    }
                } catch (error) {
                    if (error.message.includes('No se encontró el documento')) {
                        client.sendMessage(from, "No se encontró el documento especificado.");
                    } else {
                        console.error('Error al consultar la base de datos:', error);
                        client.sendMessage(from, "Ocurrió un error al consultar la base de datos.");
                    }
                }
                delete estados[from];
            } else {
                client.sendMessage(from, 'Por favor, envíe un número de documento válido');
            }
            break;
        }
    }
});

client.initialize();
