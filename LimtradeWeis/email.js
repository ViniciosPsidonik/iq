const SMTPServer = require('smtp-server').SMTPServer;
const MailParser = require('mailparser').MailParser;

// Configurações do servidor SMTP
const server = new SMTPServer({
    // Opções de configuração
    authOptional: true, // Permite autenticação opcional
    onData: (stream, session, callback) => {
        // Processar e-mail recebido
        const mailparser = new MailParser();

        mailparser.on('end', mail => {
            console.log('E-mail recebido:', mail);
            // Aqui você pode adicionar lógica para manipular o e-mail recebido

            // Responder ao cliente SMTP
            callback();
        });

        // Fazer parse do stream do e-mail
        stream.pipe(mailparser);
    }
});

// Iniciar o servidor SMTP na porta 25
server.listen(25, 'localhost', () => {
    console.log('Servidor SMTP iniciado e ouvindo na porta 25');
});
