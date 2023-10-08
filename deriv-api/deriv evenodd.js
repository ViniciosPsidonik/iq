const WebSocket = require('ws');
const DerivAPI = require('@deriv/deriv-api/dist/DerivAPI');

var XLSX = require('xlsx');
var XLSX_CALC = require('xlsx-calc');
const { log } = require('pkg/lib-es5/log');
var workbook = XLSX.readFile('./Massanielloderiv10050.xlsx');
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
let winGeral = 0
let lossGeral = 0
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
}
let bancaAtual = 0
let hasloss = false
function winMass() {
    lossMass('W')
    // console.log('Balance=', getCell('F' + (countMass - 1)));
    // console.log('Cicle=', getCell('N12') - getCell('F' + (countMass - 1)));
    if (getCell('F' + (countMass - 1)) > getCell('N12') || loss == win) {
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



let ganhaTrade = 0
let canTrade = false
let ativaTicks = false
let veefe = ""
let counterNine = 0
let even = 50
let odd = 50
let contract_type = 'DIGITODD'

async function buyRec() {


    if (!start && even > 47 && even < 53) {
        ativaTicks = true
        await esperaPoderEntrar()
    }

    const connection = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=34942');
    const api = new DerivAPI({ connection });

    balance = await api.account('pbZQyrw6BRt0lu5');

    if (!bancaAtual)
        bancaAtual = balance.balance.amount.value
    if (start) {
        start = false
        // meta = balance.balance.amount.value + 50

        const ticks = await api.ticks('R_100');
        bancaVirtual = parseFloat(getCell('N12'))
        ticks.onUpdate().subscribe(async tick => {
            let digit = parseInt(tick.raw.quote.toString().slice(-1))
            if (even > 65 || even < 35) {
                even = 50
                odd = 50
            }
            if (digit % 2 == 0) {
                even++
                odd--
            } else {
                even--
                odd++
            }
            if (ativaTicks) {
                // console.log(digit);
                console.log(`even = ${even} odd = ${odd}`);
            }
        })

        meta = 10356
        console.log(`Meta = ${meta}`);
        // modifyCell('N12', balance.balance.amount.value);
        cicleSession = 0;
        // XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
        amount = parseFloat(getCell('D' + countMass)).toFixed(2)
        // console.log('amount=', amount);
    }


    let contract = await contracts();
    startContract(contract, api, connection);

    async function contracts() {
        let contract = await api.contract({
            // contract_type: even > odd ? 'DIGITODD' : 'DIGITEVEN',
            contract_type,
            symbol: 'R_100',
            duration: 1,
            duration_unit: 't',
            currency: 'USD',
            // barrier: lastDigits[2],
            proposal: 1,
            basis: 'stake',
            amount: parseFloat(amount).toFixed(2)
        }).catch(err => console.log(err));
        console.log("-BUY-");
        contract.buy().catch(err => {
            console.log(err)
            // trade()
        });
        return contract;
    }
}

const esperaPoderEntrar = (type) => {
    return new Promise((resolve, reject) => {
        const intt = setInterval(() => {
            // console.log('esperaPoderEntrar');
            if (even <= 47) {
                ativaTicks = false
                canTrade = true
                contract_type = 'DIGITODD'
                clearInterval(intt)
                return resolve()
            }

            if (even >= 53) {
                ativaTicks = false
                canTrade = true
                contract_type = 'DIGITEVEN'
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
        console.log('issold after');
        if (contract.is_sold) {
            const intttt = setInterval(() => {
                // console.log('issold');
                if (contract.status == 'won') {
                    // if (balance.balance.amount.value > bancaAtual) {
                    // console.log(contract.profit);
                    bancaAtual = balance.balance.amount.value;
                    // console.log(contract.profit.value);
                    console.log(bancaAtual);
                    profitSession += contract.profit.value
                    // bancaAtual += profitSession
                    winGeral++
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
                    console.log(`WinsGeral: ${winGeral} || LossGeral: ${lossGeral}`);
                    console.log('profitSession=', profitSession);
                    clearInterval(intttt);
                    buyRec(api, connection);
                    // }
                } else {
                    // if (balance.balance.amount.value < bancaAtual) {
                    bancaAtual = balance.balance.amount.value;
                    console.log(contract.profit.value);
                    console.log(bancaAtual);
                    profitSession -= contract.profit.value
                    // bancaAtual += profitSession
                    console.log('LOSS'.red);
                    loss++;
                    lossGeral++
                    console.log(`Wins: ${win} || Loss: ${loss}`);
                    console.log(`WinsGeral: ${winGeral} || LossGeral: ${lossGeral}`);
                    console.log('profitSession=', profitSession);
                    lossMass('L');
                    // contract = undefined;
                    // connection.terminate();
                    clearInterval(intttt);
                    buyRec(api, connection);
                    // }
                }
            }, 750);
        }
    });
}

function getRandomValue() {
    return Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
}
// trade()


buyRec()