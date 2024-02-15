const WebSocket = require('ws');
const DerivAPI = require('@deriv/deriv-api/dist/DerivAPI');

var XLSX = require('xlsx');
var XLSX_CALC = require('xlsx-calc');
const { log } = require('pkg/lib-es5/log');
var workbook = XLSX.readFile('./Massanielloderiv.xlsx');
var worksheet = workbook.Sheets['Calculadora']
let amount = 0.35
const amountInitial = amount
const colors = require('colors')
// change some cell value
// console.log(getCell('F4'));

let countMass = 3
// console.log(amount);
let profitSession = 0
let cicleSession = 0

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
    }
    // barrier = 6
    modifyCell('C' + countMass, winloss);
    XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
    // console.log('F=', getCell('F' + countMass))
    countMass++;
    amount = parseFloat(getCell('D' + countMass)) > 0 ? parseFloat(getCell('D' + countMass)) : parseFloat(getCell('D' + countMass)) * -1;
    if (amount < 0.35) {
        console.log("LOSSSSSSS".red);
        take();
    }
}
let bancaAtual = 0
let hasloss = false
function winMass() {
    lossMass('W')
    console.log('Balance=', getCell('F' + (countMass - 1)));
    // console.log('Cicle=', getCell('N12') - getCell('F' + (countMass - 1)));
    // || getCell('N12') - getCell('F' + countMass) <= 1
    if (getCell('F' + (countMass - 1)) > getCell('N12')) {
        console.log(`Takeeee `.green)
        take();
    }


}

function take() {
    barrier = 2;
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
let barrier = 6

let contract

const openDigitDiff = async (api) => {

    // return new Promise(async (resolve, reject) => {
    // if (!contract)


    // })
}



let ganhaTrade = 0
let canTrade = false
let ativaTicks = false
let veefe = ""
let conn = false
let counterNine = 0
let lastDigits25 = []
let lastDigits50 = []
let lasttrywin = false
let porcentagem25 = 0
let porcentagem50 = 0
let symbol = 'R_25'
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

        const ticks25 = await api.ticks('R_25');
        const ticks50 = await api.ticks('R_50');
        bancaVirtual = parseFloat(getCell('N12'))
        // console.log('aaaaaaaa');
        for (let index = 0; index < 25; index++) {
            const element = ticks25._data.list[index];
            let digit = parseInt(element.raw.quote.toString().slice(-1));
            lastDigits25.push(digit)

        }
        // console.log(lastDigits25);
        for (let index = 0; index < 50; index++) {
            const element = ticks50._data.list[index];
            let digit = parseInt(element.raw.quote.toString().slice(-1));
            lastDigits50.push(digit)

        }
        console.log(lastDigits50);
        ticks25.onUpdate().subscribe(async tick => {
            setPorcentagem(tick, lastDigits25, 25);
        })
        ticks50.onUpdate().subscribe(async tick => {
            setPorcentagem(tick, lastDigits50, 50);
        })
        meta = 9135
        console.log(`Meta = ${meta}`);
        // modifyCell('N12', balance.balance.amount.value);
        cicleSession = 0;
        // XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
        // amount = parseFloat(getCell('D' + countMass)).toFixed(2)
        // console.log('amount=', amount);
    }


    let contract = await contracts();
    // 
    if (verporcentagem == 25 && porcentagem25 >= 40 || verporcentagem == 50 && porcentagem50 >= 40) {
        console.log('aguardando mercado...');
        waiting = true
        await esperaPoderEntrar()
        waiting = false
    }
    console.log('=====================');
    conn = true
    contract.buy().catch(err => {
        console.log(err);
        trade();
    });
    // console.log(contracts);
    startContract(contract, api, connection);

    async function contracts() {
        let contract = await api.contract({
            // contract_type: 'DIGITDIFF',
            contract_type: 'DIGITUNDER',
            symbol,
            duration: 1,
            duration_unit: 't',
            currency: 'USD',
            barrier,
            // proposal: 2,
            basis: 'stake',
            amount: parseFloat(amount).toFixed(2)
        }).catch(err => console.log(err));

        return contract;
    }
}
setInterval(() => {
    if (conn && !waiting) {
        console.log('conn ====== false');
        conn = false
    } else if (!waiting) {
        buyRec()
    }
}, 30000);
let waiting = false
const esperaPoderEntrar = (type) => {
    return new Promise((resolve, reject) => {
        const intt = setInterval(() => {
            // console.log('esperaPoderEntrar');
            if (verporcentagem == 25 && porcentagem25 < 40 || verporcentagem == 50 && porcentagem50 < 40) {
                clearInterval(intt)
                return resolve()
            }
        }, 100);
    })
}
let verporcentagem = 25
let amountSemSoros = amountInitial
let secondAMount = amountInitial
let lastProfitSession = 0
function setPorcentagem(tick, lastDigits, type) {
    // console.log('=====');
    // console.log(type.toString());
    let digit = parseInt(tick.raw.quote.toString().slice(-1));
    if (lastDigits.length < type) {
        lastDigits.push(digit);
    } else {
        for (let index = type - 1; index > 0; index--) {
            lastDigits[index] = lastDigits[index - 1];
        }
        lastDigits[0] = digit;
        let countdigitsloss = 0;
        for (let index = type - 1; index >= 0; index--) {
            const element = lastDigits[index];
            if (element == 6 || element == 7 || element == 8 || element == 9) {
                countdigitsloss++;
            }
        }
        if (type == 25) {
            porcentagem25 = (countdigitsloss * 100) / 25;
            // console.log(porcentagem25);
        } else {
            porcentagem50 = (countdigitsloss * 100) / 50;
            // console.log(porcentagem25);
        }
    }
}

let hitcount = 0



function startContract(contract, api, connection) {

    console.log('amount=', amount);
    let counrt = 0
    contract.onUpdate().subscribe(async (contract) => {
        // console.log('issold after');
        // console.log(contract);
        counrt++
        if (contract.is_sold) {
            // const intttt = setInterval(() => {
            // console.log('issold');
            if (contract.status == 'won') {
                // if (balance.balance.amount.value > bancaAtual) {
                // console.log(contract.profit);
                // console.log(contract);
                console.log(bancaAtual);
                profitSession += contract.profit.value
                if (hitcount == 0) {
                    lastProfitSession = profitSession
                }
                // bancaAtual += profitSession
                win++;
                cicleSession += contract.profit.value
                // winMass();
                if (hitcount > 0 && profitSession >= lastProfitSession) {
                    restartSimple();
                    hitcount = 0
                    amount = amountInitial
                    secondAMount = amountInitial
                } else if (cicleSession >= 0) {
                    restartSimple();
                }
                // console.log(`WIIN - falta = ${parseInt(falta)}`.green);
                console.log(`Wins: ${win} || Loss: ${loss}`);
                console.log(`Profit Session = ${profitSession}`.green);
                console.log(`lastProfitSession = ${lastProfitSession}`.green);
                if (profitSession > 100) {
                    console.log(`STOP WIIN`.green);
                } else {
                    buyRec(api, connection);
                }
            } else {
                console.log(bancaAtual);
                cicleSession -= contract.profit.value
                // bancaAtual += profitSession
                profitSession -= contract.profit.value
                win = 0
                if (!hasloss) {
                    hasloss = true
                }
                amount = (Math.abs(cicleSession) + secondAMount) / 0.6
                // amountSemSoros = amount
                // } else {
                //     // amount = amountSemSoros * 1.45
                //     // amountSemSoros = amount
                // }

                console.log('LOSS'.red);
                loss++;
                console.log(`Wins: ${win} || Loss: ${loss}`);
                console.log(`Profit Session = ${profitSession}`.green);
                console.log(`Cicle Session = ${cicleSession}`.green);
                console.log(`lastProfitSession = ${lastProfitSession}`.green);
                if (loss >= 3) {
                    amount = amountInitial
                    hitcount++
                    if (hitcount > 1) {
                        symbol = 'R_50'
                        verporcentagem = 50
                    }
                    amount *= 2
                    secondAMount = amount
                    console.log(`=HIT=`.red)
                    win = 0
                    hasloss = false
                    loss = 0
                    cicleSession = 0
                    if (hitcount >= 2) {
                        amount = amountInitial
                        console.log('HIT STOP =========='.red);
                        hitcount = 0
                        symbol = 'R_25'
                        secondAMount = amountInitial
                    }
                }
                // lossMass('L');
                // console.log(contract);
                // contract = undefined;
                // connection.terminate();
                // clearInterval(intttt);
                // setTimeout(() => {
                if (profitSession <= -100) {
                    console.log(`STOP WIIN`.green);
                    process.exit()
                } else {
                    buyRec(api, connection);
                }
                // }, 1000);
                // }
            }
            // }, 750);
        } else {
            if (typeof contract.validation_error != "undefined") {

                console.log(contract.validation_error);
            }
        }
    });
}

function restartSimple() {
    amount = secondAMount;
    console.log(`Takeeee `.green);
    win = 0;
    loss = 0;
    hasloss = false;
    console.log(`Cicle Session = ${cicleSession}`.green);
    amountSemSoros = amountInitial;
    cicleSession = 0;
}

function getRandomValue() {
    return Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
}
// trade()
buyRec()