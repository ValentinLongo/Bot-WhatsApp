const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Conexión exitosa');
});

client.on('message', message => {
    console.log(message.body);

    // Puedes responder a mensajes aquí
    if (message.body.toLowerCase() === 'hola') {
        client.sendMessage(message.from, 'Hola, soy un bot');
    }
});

client.initialize();
