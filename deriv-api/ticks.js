const WebSocket = require('ws');
const DerivAPI = require('@deriv/deriv-api/dist/DerivAPI');

var XLSX = require('xlsx');
var XLSX_CALC = require('xlsx-calc');
const { log } = require('pkg/lib-es5/log');
var workbook = XLSX.readFile('./Massanielloderiv.xlsx');
var worksheet = workbook.Sheets['Calculadora']
let amount = 0.35
const colors = require('colors')
// change some cell value
// console.log(getCell('F4'));

let countMass = 3
// console.log(amount);
let profitSession = 0

// basic.ping().then(console.log);
let balancesss = false
let balance
let win = 0
let loss = 0
let meta = 100

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
    barrier = 6
    modifyCell('C' + countMass, winloss);
    XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
    // console.log(getCell('I' + countMass))
    countMass++;
    amount = parseFloat(getCell('D' + countMass)) > 0 ? parseFloat(getCell('D' + countMass)) : parseFloat(getCell('D' + countMass)) * -1;
}
let bancaAtual = 0
let hasloss = false
function winMass() {
    lossMass('W')

    if (getCell('F' + (countMass - 1)) > getCell('N12')) {
        console.log(`Takeeee `.green)
        barrier = 2
        loss = 0
        win = 0

        hasloss = false
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
const trade = async () => {
    console.log('=====================');
    const connection = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=34942');
    const api = new DerivAPI({ connection });

    balance = await api.account('pbZQyrw6BRt0lu5');
    tradedou = true
    if (start) {
        start = false
        meta = balance.balance.amount.value + (balance.balance.amount.value * (meta / 100))
        console.log(`Meta = ${meta}`);
        modifyCell('N12', balance.balance.amount.value);
        cicleSession = 0;
        XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
        amount = parseFloat(getCell('D' + countMass)).toFixed(2)
    }

    let contract = await api.contract({
        contract_type: 'DIGITOVER',
        symbol: 'R_100',
        duration: 1,
        duration_unit: 't',
        currency: 'USD',
        barrier,
        proposal: 1,
        basis: 'stake',
        amount: parseFloat(amount).toFixed(2)
    }).catch(err => console.log(err));
    contract.buy().catch(err => {
        console.log(err)
        trade()
    });

    console.log(parseFloat(amount).toFixed(2));

    contract.onUpdate().subscribe(async contract => {
        if (contract.is_sold) {
            if (contract.status == 'won') {
                // console.log(contract.profit);
                console.log('WIIN'.green);
                win++
                console.log(`Wins: ${win} || Loss: ${loss}`)
                winMass()
            } else {
                console.log('LOSS'.red);
                loss++
                console.log(`Wins: ${win} || Loss: ${loss}`)
                lossMass('L')
            }
            trade()
        }
    })

    // i {
    //     _data: {
    //       value: 1.37,
    //       currency: 'USD',
    //       lang: undefined,
    //       percentage: 144.21,
    //       is_win: true,
    //       sign: 1
    //     }
    //   }
}

let contract

const openDigitDiff = async (api) => {

    // return new Promise(async (resolve, reject) => {
    // if (!contract)


    // })
}

buyRec()

let lastDigits = [0, 1, 2]

let ganhaTrade = 0
let canTrade = false
let ativaTicks = false
let veefe = ""
let counterNine = 0
async function buyRec() {


    // if (loss > 3) {
    // ativaTicks = true
    // await esperaPoderEntrar()
    // setTimeout(async () => {
    // let contract = await contracts();
    // startContract(contract, api, connection);
    // }, 4000);
    // }

    const connection = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=34942');
    const api = new DerivAPI({ connection });

    balance = await api.account('pbZQyrw6BRt0lu5');

    if (!bancaAtual)
        bancaAtual = balance.balance.amount.value
    if (start) {
        start = false
        // meta = balance.balance.amount.value + 50

        // const ticks = await api.ticks('R_100');

        // ticks.onUpdate().subscribe(async tick => {
        // console.log(parseInt(tick.raw.quote.toString().slice(-1)));
        // lastDigits[4] = lastDigits[3]
        // lastDigits[3] = lastDigits[2]
        // lastDigits[2] = lastDigits[1]
        // lastDigits[1] = lastDigits[0]
        // lastDigits[0] = parseInt(tick.raw.quote.toString().slice(-1))
        // if (lastDigits[1] == lastDigits[2]) {
        //     console.log(lastDigits);
        // }
        // })

        meta = 10200
        console.log(`Meta = ${meta}`);
        // modifyCell('N12', balance.balance.amount.value);
        cicleSession = 0;
        // XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
        amount = parseFloat(getCell('D' + countMass)).toFixed(2)
        console.log('amount=', amount);
    }


    let contract = await contracts();
    startContract(contract, api, connection);

    async function contracts() {
        let contract = await api.contract({
            // contract_type: 'DIGITDIFF',
            contract_type: 'DIGITEVEN',
            symbol: 'R_100',
            duration: 1,
            duration_unit: 't',
            currency: 'USD',
            barrier,
            proposal: 1,
            basis: 'stake',
            amount: parseFloat(amount).toFixed(2)
        }).catch(err => console.log(err));
        contract.buy().catch(err => {
            console.log(err);
            trade();
        });
        return contract;
    }
}

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
    console.log('=====================');
    console.log('amount=', amount);
    contract.onUpdate().subscribe(async (contract) => {
        // console.log('issold after');
        if (contract.is_sold) {
            const intttt = setInterval(() => {
                // console.log('issold');
                if (contract.status == 'won') {
                    // if (balance.balance.amount.value > bancaAtual) {
                    // console.log(contract.profit);
                    bancaAtual = balance.balance.amount.value;
                    console.log(contract.profit.value);
                    console.log(bancaAtual);
                    // profitSession += contract.profit.value
                    // bancaAtual += profitSession
                    if (hasloss) {
                        win++;
                        winMass();
                    } else if (!ganhaTrade) {
                        ganhaTrade = contract.profit.value;
                        console.log('ganhaTrade=', ganhaTrade);
                    }
                    if (ganhaTrade) {
                        let falta = (meta - bancaAtual) / ganhaTrade;
                        console.log(`WIIN - falta = ${parseInt(falta)}`.green);
                    }
                    console.log(`Wins: ${win} || Loss: ${loss}`);
                    // 9981
                    // 10137
                    // resolve()
                    // contract = undefined;
                    // connection.terminate();
                    clearInterval(intttt);
                    buyRec(api, connection);
                    // }
                } else {
                    if (balance.balance.amount.value < bancaAtual) {
                        bancaAtual = balance.balance.amount.value;
                        console.log(contract.profit.value);
                        console.log(bancaAtual);
                        // profitSession -= contract.profit.value
                        // bancaAtual += profitSession
                        console.log('LOSS'.red);
                        loss++;
                        console.log(`Wins: ${win} || Loss: ${loss}`);
                        lossMass('L');
                        // contract = undefined;
                        // connection.terminate();
                        clearInterval(intttt);
                        setTimeout(() => {
                            buyRec(api, connection);
                        }, 500);
                    }
                }
            }, 750);
        }
    });
}

function getRandomValue() {
    return Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
}
// trade()
