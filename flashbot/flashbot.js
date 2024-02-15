var XLSX_CALC = require('xlsx-calc');
const colors = require('colors')
const fs = require('fs')
const moment = require('moment')
var XLSX = require('xlsx');
var workbook = XLSX.readFile('./Massaniello.xlsx');
var XLSX_CALC = require('xlsx-calc');
var worksheet = workbook.Sheets['Calculadora']
// XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
let amount = 0
let fsConfig = fs.readFileSync('config.json')
let config = JSON.parse(fsConfig)
let veefe = config.veefe
let operations = config.operations
let operationsMap = new Map()
operations.forEach((valor, chave) => {
    if (!valor.result)
        operationsMap.set(valor.id, { result: valor.result })
});

console.log(operationsMap);


function modifyCell(cellString, value) {
    if (value == undefined) {
        worksheet[cellString] = value;
    } else if (typeof worksheet[cellString] != "undefined") {
        worksheet[cellString].v = value;
    } else {
        XLSX.utils.sheet_add_aoa(worksheet, [[value]], { origin: cellString });
    }
}

function getCell(cellString) {
    if (typeof worksheet[cellString] != "undefined") {
        return worksheet[cellString].v
    } else {
        return undefined
    }
}

const getamount = async () => {

    // modifyCell('N' + 12, config.lastAmount);
    for (let index = 0; index < veefe.length; index++) {
        const element = veefe[index];

        // console.log(element);
        modifyCell('C' + countMass, element);

        countMass++

    }
    XLSX_CALC(workbook, { continue_after_error: true, log_error: false });

    amount = parseFloat(getCell('D' + countMass))
    console.log('Banca=', getCell('N12'));
    console.log(amount);

    // console.log(getCell('I' + 3))
    // console.log(getCell('F' + 3))
    // console.log(getCell('N' + 12))

}


let countMass = 3
amount = parseFloat(getCell('D' + countMass))
// console.log(amount);
let diffWinLoss = 0
async function winMass() {
    modifyCell('C' + countMass, 'W');
    await XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
    veefe += 'W'
    let Vee = 0
    let Efee = 0
    for (let index = 0; index < veefe.length; index++) {
        const element = veefe[index];
        if (element == 'W') {
            Vee++
        } else {
            Efee++
        }
    }
    // || Vee == Efee

    if (getCell('I' + countMass) == '◄◄' || ((Vee == Efee || Vee > Efee) && Vee + Efee > 25)) {

        for (let index = countMass; index >= 0; index--) {
            modifyCell('C' + countMass, '');
        }

        // modifyCell('N' + 12, getCell('F' + countMass));
        await XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
        cicleSession = 0;
        countMass = 3;
        if (config.conta)
            veefe = ""
        amount = parseFloat(getCell('D' + countMass)) > 0 ? parseFloat(getCell('D' + countMass)) : parseFloat(getCell('D' + countMass)) * -1;
        console.log(`${moment().format('HH:MM:SS')} || Ciclo com Ganhoo!! `.green)
    } else {
        countMass++;
        amount = parseFloat(getCell('D' + countMass)) > 0 ? parseFloat(getCell('D' + countMass)) : parseFloat(getCell('D' + countMass)) * -1;
    }

    setOperations();
    config.veefe = veefe
    console.log(veefe);
    // config.lastAmount = parseFloat(getCell('N12'))
    win++
    diffWinLoss++
    // if (config.conta == "real")
    fs.writeFile('config.json', JSON.stringify(config, null, 4), async err => {
        // console.log(err || 'Arquivo salvo');
        // if (win >= 5) {
        await sendValor();
        console.log(`${moment().format('HH:MM:SS')} || Win - Novo Amount: ${amount}`.green);
        if (diffWinLoss >= 5) {
            // notify('Stop', `Stop WIN Alcançado...`);
            await desligaBot();
            setTimeout(() => {
                console.log('Stop WIN Alcançado...')
                process.exit(1)
            }, 3000);
        }
    });


    console.log(amount);

}

let win = 0
let loss = 0

async function desligaBot() {
    await client.invoke(
        new Api.messages.SendMessage({
            peer: entityBot,
            message: `/valor 2`,
        }));
    await client.invoke(
        new Api.messages.SendMessage({
            peer: entityBot,
            message: `/desligar`,
        }));
}

function lossMass(winloss) {
    modifyCell('C' + countMass, winloss);
    XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
    countMass++;
    veefe += 'L'
    amount = parseFloat(getCell('D' + countMass)) > 0 ? parseFloat(getCell('D' + countMass)) : parseFloat(getCell('D' + countMass)) * -1;
    console.log(amount);
    setOperations();
    console.log(veefe);
    config.veefe = veefe
    loss++
    diffWinLoss--
    // if (config.conta == "real")
    fs.writeFile('config.json', JSON.stringify(config, null, 4), async err => {
        // console.log(err || 'Arquivo salvo');
        // if (loss >= 3) {
        await sendValor();
        console.log(`${moment().format('HH:MM:SS')} || Loss - Novo Amount: ${amount}`.red);
        if (loss <= -3) {
            // notify('Stop', `Stop WIN Alcançado...`);
            await desligaBot();
            setTimeout(() => {
                console.log('Stop Loss Alcançado...')
                process.exit(1)
            }, 3000);
        }
    });


}
getamount()

const { Api, TelegramClient } = require('telegram')
const { StringSession } = require('telegram/sessions')
const input = require('input')

const { Logger } = require("telegram/extensions");
const { NewMessage } = require("telegram/events");
const { NewMessageEvent } = require("telegram/events/NewMessage");
const { DeletedMessage } = require("telegram/events/DeletedMessage");
const { EditedMessage } = require("telegram/events/EditedMessage");
const { Message } = require("telegram/tl/custom/message");

const apiId = 1537314;
const apiHash = "1855b411a187811b71f333d904d725d9";
const stringSession = new StringSession("");



async function eventPrint(event) {
    // console.log(event);
    const message = event.message.message;
    // console.log(message);
    const messageLines = message.split('\n')
    for (let index = 0; index < messageLines.length; index++) {
        const line = messageLines[index];
        if (line.includes('TAXA ATUAL:') && !line.includes('ABORTADO') || line.includes('ORIGEM SINAL: COPY_AOVIVO') && !line.includes('ABORTADO')) {
            console.log('======================');
            console.log('CreateD');
            const opId = event.message.id
            if (message.includes('LUCRO:')) {
                operationsMap.set(opId, { result: 'W' })
                await doMassanielo(opId, 'W');
            } else if (message.includes('PREJUÍZO:')) {
                operationsMap.set(opId, { result: 'L' })
                await doMassanielo(opId, 'L');
            } else {
                operationsMap.set(opId, { result: '' })
            }
            console.log('Operation:', opId);
        }
    }
}

async function eventPrintE(event) {
    const message = event.message.message;
    // console.log(event);
    // console.log(message);
    const messageLines = message.split('\n')
    for (let index = 0; index < messageLines.length; index++) {
        const line = messageLines[index];
        if (line.includes('TAXA ATUAL:') && !line.includes('ABORTADO') || line.includes('ORIGEM SINAL: COPY_AOVIVO') && !line.includes('ABORTADO')) {
            console.log('======================');
            console.log('Edited');
            const opId = event.message.id
            console.log('Operation:', opId);
            if (operationsMap.has(opId)) {
                let oppp = operationsMap.get(opId)
                if (!oppp.result) {
                    if (message.includes('LUCRO:')) {
                        oppp.result = 'W';
                        operationsMap.set(opId, oppp)
                        await doMassanielo(opId, 'W');
                    } else if (message.includes('PREJUÍZO:')) {
                        oppp.result = 'L';
                        operationsMap.set(opId, oppp)
                        await doMassanielo(opId, 'L');
                    }
                }
            } else {
                console.log('Id nao encontrado -', opId);
            }
        }
    }
}
// console.log(message.id);
// console.log(event.className)
// startttt(message.message, message.id);
// Checks if it's a private message (from user or bot)
// if (event.isPrivate) {
//     // prints sender id
//     console.log(message.senderId);
//     // read message
//     if (message.text == "hello") {
//         const sender = await message.getSender();
//         console.log("sender is", sender);
//         await client.sendMessage(sender, {
//             message: `hi your id is ${message.senderId}`,
//         });
//     }
// }

async function doMassanielo(opId, result) {
    try {

        if (result == 'W') {
            winMass();
        } else {
            lossMass('L');
        }

    } catch (error) {
        console.log(error);
    }
}

function setOperations() {
    operations = [];
    for (var [key, value] of operationsMap) {
        operations.push({ id: key, result: value.result });
    }
    config.operations = operations;
}

async function sendValor() {
    // // const sender = await message.getSender();
    // client.invoke(new Api.messages.SendMessage({
    //     perr: entityBot,
    //     message: `/valor ${amount.toFixed(2)}`
    // }))
    console.log('Enviando Valor...');
    const result = await client.invoke(
        new Api.messages.SendMessage({
            peer: entityBot,
            message: `/valor ${amount.toFixed(2)}`,

        }))
    // console.log(result);
    // await client.sendMessage(sender, {
    //     message: `/valor ${amount.toFixed(2)}`,
    // });
}

async function eventPrintD(event) {

    console.log('======================');
    const message = event.message;
    console.log(event);
    console.log('Deleted');
    // startttt(message.message, message.id);
    // let ids = []
    // for (let join = 0; join < taxasEmperium.length; join++) {
    //     const element = taxasEmperium[join];
    //     if (element.id == event.message.id) {
    //         ids.push(join)
    //     }
    // }

    // for (let index = 0; index < ids.length; index++) {
    //     const element = ids[index];
    //     console.log('Retirando id===', element);
    //     taxasEmperium.splice(element, 1);
    // }
    // UpdateEditChannelMessage
    // Checks if it's a private message (from user or bot)
    // if (event.isPrivate) {
    //     // prints sender id
    //     console.log(message.senderId);
    //     // read message
    //     if (message.text == "hello") {
    //         const sender = await message.getSender();
    //         console.log("sender is", sender);
    //         await client.sendMessage(sender, {
    //             message: `hi your id is ${message.senderId}`,
    //         });
    //     }
    // }
}

let client
(async () => {
    console.log("Loading interactive example...");
    client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });
    await client.start({
        phoneNumber: '+5554992563317',
        password: async () => await input.text("Please enter your password: "),
        phoneCode: async () =>
            await input.text("Please enter the code you received: "),
        onError: (err) => {
            console.log(err)
            console.log('Error mandando novamente');
            setTimeout(() => {
                sendValor()
            }, 1000);
        },
    });
    console.log("You should now be connected.");
    // console.log(client.session.save()); // Save this string to avoid logging in again
    // await client.sendMessage("me", { message: "Hello!" });
    entityBot = await client.getEntity('flash_kbot')
    // sendValor(client)
    // console.log(entityBot);

    // console.log(result);
    client.addEventHandler(eventPrint, new NewMessage({}))
    client.addEventHandler(eventPrintD, new DeletedMessage({}))
    client.addEventHandler(eventPrintE, new EditedMessage({}))

    await sendValor();

})();

let entityBot 
