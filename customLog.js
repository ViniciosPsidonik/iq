const originalConsoleLog = console.log;

function customLog(...args) {
    // args[0] = "[LOG]:" + args[0];
    writeLog(args)
    originalConsoleLog.apply(console, args);
}

let filePath = ""

function setFilePath(path) {
    console.log(path);
    filePath = path
}

function writeLog(logs) {
    const fs = require('fs');

    // Caminho para o arquivo txt
    // console.log(logs);
    // Texto a ser acrescentado

    for (let index = 0; index < logs.length; index++) {
        // console.error('logs')
        let textoAAdicionar = (JSON.stringify(logs[index]) + '\n').replace('"', '')

        // console.error(textoAAdicionar)
        // Verifica se o arquivo já existe
        if (textoAAdicionar.includes('||'))
            if (fs.existsSync(filePath)) {
                // Se o arquivo já existe, acrescente o texto a ele
                fs.appendFileSync(filePath, textoAAdicionar, (err) => {
                    if (err) {
                        console.error('Erro ao acrescentar texto ao arquivo:', err);
                    } else {
                        // console.log('Texto acrescentado com sucesso!');
                    }
                });
            } else {
                // Se o arquivo não existe, crie o arquivo e escreva o texto
                fs.writeFileSync(filePath, textoAAdicionar, (err) => {
                    if (err) {
                        console.error('Erro ao criar o arquivo e escrever o texto:', err);
                    } else {
                        // console.log('Arquivo criado e texto escrito com sucesso!');
                    }
                });
            }
    }
}

module.exports = { customLog, setFilePath };