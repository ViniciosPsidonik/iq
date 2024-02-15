
const fs = require('fs')
const WebSocket = require('ws');
const DerivAPI = require('@deriv/deriv-api/dist/DerivAPI');

var XLSX = require('xlsx');
var XLSX_CALC = require('xlsx-calc');
const { log } = require('pkg/lib-es5/log');
var workbook = XLSX.readFile('./MassanielloderivDiffers.xlsx');
var worksheet = workbook.Sheets['Calculadora']
let amount = 0.35
let fsConfig = fs.readFileSync('deriv.json')
let config = JSON.parse(fsConfig)
let veefe = config.veefe
let lastTake = config.lastTake

const colors = require('colors')
// change some cell value
// console.log(getCell('F4'));

let countMass = 3
// console.log(amount);
let profitSession = config.profitSession

// basic.ping().then(console.log);
let balancesss = false
let balance
let win = 0
let loss = 0
let meta = 100
let bancaVirtual = 0

function getCell(cellString) {
    if (typeof worksheet[cellString] != "undefined") {
        return worksheet[cellString].v
    } else {
        return undefined
    }
}
// 1, 410679308775642
function lossMass(winloss) {
    if (winloss == 'L') {
        hasloss = true
        veefe += 'L'
    }
    // barrier = 6
    modifyCell('C' + countMass, winloss);
    XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
    // console.log('F=', getCell('F' + countMass))
    countMass++;
    amount = parseFloat(getCell('D' + countMass)) > 0 ? parseFloat(getCell('D' + countMass)) : parseFloat(getCell('D' + countMass)) * -1;
    if (amount < 0.35) {
        console.log("LOSSSSSSS".red);
        veefe = ''
        take();
    }

    if (winloss == 'L') {
        // config.veefe = veefe
        // config.profitSession = profitSession
        // fs.writeFile('deriv.json', JSON.stringify(config, null, 4), err => {
        //     // console.log(err || 'Arquivo salvo');
        // });
    }
}
let bancaAtual = 0
let hasloss = false
function winMass() {
    lossMass('W')
    veefe += 'W'
    console.log('Balance=', getCell('F' + (countMass - 1)));
    // console.log('Cicle=', getCell('N12') - getCell('F' + (countMass - 1)));
    // || getCell('N12') - getCell('F' + countMass) <= 1
    if (getCell('F' + (countMass - 1)) > getCell('N12') || profitSession >= lastTake) {
        console.log(`Takeeee `.green)
        veefe = ''
        take();
        barrier = 5
        lastTake = profitSession
    }

    // config.veefe = veefe
    // fs.writeFile('deriv.json', JSON.stringify(config, null, 4), err => {
    //     // console.log(err || 'Arquivo salvo');
    // });
}

function take() {
    barrier = 5;
    loss = 0;
    win = 0;

    hasloss = false;
    // let bancaAtual = getCell('F' + (countMass - 1))
    // console.log(`bancaAtual = ${bancaAtual}`);
    // for (let index = countMass; index >= 3; index--) {
    //     modifyCell('C' + countMass, '');
    // }
    // modifyCell('N12', balance.balance.amount.value);
    cicleSession = 0;
    XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
    countMass = 3;
    amount = parseFloat(getCell('D' + countMass)) > 0 ? parseFloat(getCell('D' + countMass)) : parseFloat(getCell('D' + countMass)) * -1;
    // console.log(amount);
    if (balance.balance.amount.value >= meta) {
        console.log('META ATINGIDA...'.green);
        setTimeout(() => {
            // process.exit(1)
        }, 10000);
    }
}

function modifyCell(cellString, value) {
    if (value == undefined) {
        worksheet[cellString] = value;
    } else if (typeof worksheet[cellString] != "undefined") {
        worksheet[cellString].v = value;
    } else {
        XLSX.utils.sheet_add_aoa(worksheet, [[value]], { origin: cellString });
    }
}

let start = true
let barrier = 5

let contract

const openDigitDiff = async (api) => {

    // return new Promise(async (resolve, reject) => {
    // if (!contract)


    // })
}

let mettaa = 0

const getamount = async () => {

    for (let index = 0; index < veefe.length; index++) {
        const element = veefe[index];

        // console.log(element);
        modifyCell('C' + countMass, element);

        countMass++
        if (element == 'L') {
            loss++
            hasloss = true
        } else {
            win++
        }

        // if (index % 10 == 0) {
        //     XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
        //     console.log('xlsss');
        // }
        // console.log(element);
    }
    XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
    amount = parseFloat(getCell('D' + countMass))
    console.log('Banca=', getCell('N12'));
    console.log(amount);
    mettaa = getCell('N12') * 2

    // console.log(getCell('I' + 3))
    // console.log(getCell('F' + 3))
    // console.log(getCell('N' + 12))

}


let ganhaTrade = 0
let canTrade = false
let ativaTicks = false
let counterNine = 0
let lastDigits = [0, 1]
let lasttrywin = false
let proposal = 0
let wing = 0
let lossg = 0
async function buyRec() {
    console.log('biy rec');
    const connection = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=34941');
    const api = new DerivAPI({ connection });

    balance = await api.account('pbZQyrw6BRt0lu5');

    // if (!bancaAtual)
    bancaAtual = balance.balance.amount.value
    if (start) {
        start = false
        // meta = balance.balance.amount.value + 50

        const ticks = await api.ticks('R_10');
        bancaVirtual = parseFloat(getCell('N12'))
        // console.log('aaaaaaaa');
        ticks.onUpdate().subscribe(async tick => {

            let digit = parseInt(tick.raw.quote.toString().slice(-2))
            // lastDigits[1] = lastDigits[0]
            // lastDigits[0] = parseInt(tick.raw.quote.toString().slice(-2))
            // if ((digit == 0 || digit == 1 || digit == 2) && (lastDigits[1] == 0 || lastDigits[1] == 1 || lastDigits[1] == 2)) {
            //     lasttrywin = false
            // } else if ((digit != 0 && digit != 1 && digit != 2) && (lastDigits[1] == 0 || lastDigits[1] == 1 || lastDigits[1] == 2)) {
            //     lasttrywin = true
            // }
            console.log(digit);
            if (ativaTicks) {
                if (digit.toString()[1] == digit.toString()[0]) {
                    counterNine++
                    if (counterNine >= 1) {
                        // console.log('noow');
                        barrier = parseInt(digit.toString()[0])
                        counterNine = 0
                        ativaTicks = false
                        canTrade = true
                    }
                }
                else {
                    counterNine = 0
                }
            } else {
                // barrier = digit
            }
        })

        meta = 9135
        console.log(`Meta = ${meta}`);
        // modifyCell('N12', balance.balance.amount.value);
        cicleSession = 0;
        // XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
        amount = parseFloat(getCell('D' + countMass)).toFixed(2)
        getamount()
        // console.log('amount=', amount);
    }


    // 
    // if (loss + win > 0) {
    if (loss > 0) {
        ativaTicks = true
        waiting = true
        await esperaPoderEntrar()
        waiting = false
    }
    let contract = await contracts();
    console.log('=====================');
    conn = true
    contract.buy().catch(err => {
        console.log(err);
        trade();
    });
    // console.log(contracts);
    startContract(contract, api, connection);

    async function contracts() {
        if (typeof barrier == "undefined") {
            barrier = 5
        }
        console.log('Barrie=', barrier);
        let contract = await api.contract({
            // contract_type: 'DIGITDIFF',
            contract_type: 'DIGITDIFF',
            symbol: 'R_10',
            duration: 1,
            duration_unit: 't',
            currency: 'USD',
            barrier,
            // proposal,
            basis: 'stake',
            amount: parseFloat(amount).toFixed(2)
        }).catch(err => console.log(err));

        return contract;
    }
}
let conn = false
let waiting = false
setInterval(() => {
    if (conn && !waiting) {
        console.log('conn ====== false');
        conn = false
    } else if (!waiting) {
        console.log('denovooooooooo');
        buyRec()
    }
}, 25000);
const esperaPoderEntrar = (type) => {
    return new Promise((resolve, reject) => {
        const intt = setInterval(() => {
            // console.log('esperaPoderEntrar');
            if (canTrade) {
                canTrade = false
                clearInterval(intt)
                return resolve()
            }
        }, 100);
    })
}

function startContract(contract, api, connection) {

    console.log('amount=', amount);
    let counrt = 0
    contract.onUpdate().subscribe(async (contract) => {
        // console.log('issold after');
        // console.log(contract);
        counrt++
        if (counrt > 6)
            console.log(contract);
        if (contract.is_sold) {
            // const intttt = setInterval(() => {
            // console.log('issold');
            if (contract.status == 'won') {
                // if (balance.balance.amount.value > bancaAtual) {
                // console.log(contract.profit);
                // console.log(contract);
                console.log(bancaAtual);
                profitSession += contract.profit.value
                // bancaAtual += profitSession
                wing++
                if (hasloss) {
                    win++;
                    winMass();
                } else if (!ganhaTrade) {
                    ganhaTrade = contract.profit.value;
                    console.log('ganhaTrade=', ganhaTrade);
                } else {
                    lastTake = profitSession
                }
                // if (ganhaTrade) {
                // }
                let falta = (meta - bancaAtual) / ganhaTrade;
                // console.log(`WIIN - falta = ${parseInt(falta)}`.green);
                console.log(`Wins: ${win} || Loss: ${loss}`);
                console.log(`Profit Session = ${profitSession}`.green);
                console.log(`wing: ${wing} || lossg: ${lossg}`);
                // 9981
                // 10137
                // resolve()
                // contract = undefined;
                // connection.terminate();
                // clearInterval(intttt);
                // setTimeout(() => {
                if (profitSession > mettaa) {
                    console.log(`STOP WIIN`.green);
                    process.exit()
                } else {
                    buyRec(api, connection);
                }
                // }, 1000);
                // }
            } else {
                // if (balance.balance.amount.value < bancaAtual) {
                // console.log(contract.profit);
                console.log(bancaAtual);
                profitSession -= contract.profit.value
                // bancaAtual += profitSession
                console.log('LOSS'.red);
                loss++;
                console.log(`Wins: ${win} || Loss: ${loss}`);
                console.log(`Profit Session = ${profitSession}`.green);
                console.log(`wing: ${wing} || lossg: ${lossg}`);
                lossMass('L');
                lossg++
                // console.log(contract);
                // contract = undefined;
                // connection.terminate();
                // clearInterval(intttt);
                // setTimeout(() => {
                if (profitSession <= -  40) {
                    console.log(`STOP WIIN`.green);
                    process.exit()
                } else {
                    buyRec(api, connection);
                }
                // }, 1000);
                // }
            }
            // }, 750);

            config.veefe = veefe
            config.profitSession = profitSession
            config.lastTake = lastTake
            fs.writeFile('deriv.json', JSON.stringify(config, null, 4), err => {
                // console.log(err || 'Arquivo salvo');
            });
        } else {
            if (typeof contract.validation_error != "undefined") {

                console.log(contract.validation_error);
            }
        }
    });
}

function getRandomValue() {
    return Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
}
// trade()
buyRec()