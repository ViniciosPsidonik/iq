const WebSocket = require('ws');
const DerivAPI = require('@deriv/deriv-api/dist/DerivAPI');

var XLSX = require('xlsx');
var XLSX_CALC = require('xlsx-calc');
const { log } = require('pkg/lib-es5/log');
var workbook = XLSX.readFile('./Massanielloderiv.xlsx');
var worksheet = workbook.Sheets['Calculadora']
let amount = 1
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
let barrier = 2

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
let lastDigits = [0, 1]
let lasttrywin = false
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

        const ticks = await api.ticks('R_100');
        bancaVirtual = parseFloat(getCell('N12'))
        // console.log('aaaaaaaa');
        ticks.onUpdate().subscribe(async tick => {
            let digit = parseInt(tick.raw.quote.toString().slice(-1))
            // lastDigits[1] = lastDigits[0]

            // lastDigits[0] = parseInt(tick.raw.quote.toString().slice(-1))
            // if ((digit == 0 || digit == 1 || digit == 2) && (lastDigits[1] == 0 || lastDigits[1] == 1 || lastDigits[1] == 2)) {
            //     lasttrywin = false
            // } else if ((digit != 0 && digit != 1 && digit != 2) && (lastDigits[1] == 0 || lastDigits[1] == 1 || lastDigits[1] == 2)) {
            //     lasttrywin = true
            // }
            if (ativaTicks) {
                console.log(digit);
                if (digit == 0 || digit == 1 || digit == 2) {
                    counterNine++
                    if (counterNine >= 1) {
                        counterNine = 0
                        ativaTicks = false
                        canTrade = true
                    }
                }
                else {
                    counterNine = 0
                }
            }
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
    if (loss > 2) {
        ativaTicks = true
        await esperaPoderEntrar()
        // setTimeout(async () => {
        // let contract = await contracts();
        // startContract(contract, api, connection);
        // }, 4000);
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
            contract_type: 'DIGITOVER',
            symbol: 'R_100',
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
    if (conn) {
        console.log('conn ========= false');
        conn = false
    } else {
        buyRec()
    }
}, 90000);
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

let amountSemSoros = amountInitial

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
                if (hasloss) {
                    win++;
                    cicleSession += contract.profit.value
                    // winMass();

                    if (win >= 2) {
                        amount = amountInitial
                        console.log(`Takeeee `.green)
                        win = 0
                        loss = 0
                        hasloss = false
                        console.log(`Cicle Session = ${cicleSession}`.green);
                        amountSemSoros = amountInitial
                        cicleSession = 0
                    } else {
                        // amount += contract.profit.value;
                    }
                } else if (!ganhaTrade) {
                    ganhaTrade = contract.profit.value;
                    console.log('ganhaTrade=', ganhaTrade);
                }
                let falta = (meta - bancaAtual) / ganhaTrade;
                console.log(`WIIN - falta = ${parseInt(falta)}`.green);
                console.log(`Wins: ${win} || Loss: ${loss}`);
                console.log(`Profit Session = ${profitSession}`.green);
                if (profitSession > 25) {
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
                amount = (Math.abs(cicleSession) / 0.4) / 2
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
                if (loss >= 5) {
                    amount = amountInitial
                    console.log(`=HIT=`.red)
                    win = 0
                    hasloss = false
                    loss = 0
                    amountSemSoros = amountInitial
                    cicleSession = 0
                }
                // lossMass('L');
                // console.log(contract);
                // contract = undefined;
                // connection.terminate();
                // clearInterval(intttt);
                // setTimeout(() => {
                buyRec(api, connection);
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

function getRandomValue() {
    return Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
}
// trade()
buyRec()