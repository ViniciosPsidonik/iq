const WebSocket = require('ws');

// Configurações do servidor WebSocket
const serverPort = 7681; // Porta do servidor WebSocket

// Criar o servidor WebSocket
const server = new WebSocket.Server({ port: serverPort });

// Evento de conexão de cliente
server.on('connection', (socket) => {
  console.log('Novo cliente conectado');

  // Evento de recebimento de mensagem do cliente
  socket.on('message', (message) => {
    console.log('Mensagem recebida:', message);

    // Processar a mensagem recebida, se necessário...

    // Enviar uma resposta para o cliente
    socket.send('Resposta do servidor');
  });

  // Evento de fechamento da conexão do cliente
  socket.on('close', () => {
    console.log('Cliente desconectado');
  });
});
server.on('error', err => {
    console.log(err);
})

server.on('listening', err => {
    console.log(err);
})


console.log(`Servidor WebSocket ouvindo na porta ${serverPort}`);
