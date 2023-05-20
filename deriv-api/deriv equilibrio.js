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
let meta = 100000

function getCell(cellString) {
    if (typeof worksheet[cellString] != "undefined") {
        return worksheet[cellString].v
    } else {
        return undefined
    }
}

function lossMass(winloss) {
    modifyCell('C' + countMass, winloss);
    XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
    // console.log(getCell('I' + countMass))
    countMass++;
    amount = parseFloat(getCell('D' + countMass)) > 0 ? parseFloat(getCell('D' + countMass)) : parseFloat(getCell('D' + countMass)) * -1;
}
let bancaAtual = 0
function winMass() {
    lossMass('W')

    if (getCell('I' + (countMass - 1)) == "◄◄") {
        console.log(`Takeeee `.green)
        loss = 0
        win = 0
        // let bancaAtual = getCell('F' + (countMass - 1))

        console.log(`bancaAtual = ${bancaAtual}`);
        for (let index = countMass; index >= 3; index--) {
            modifyCell('C' + countMass, '');
        }
        modifyCell('N12', balance.balance.amount.value);
        cicleSession = 0;
        XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
        countMass = 3;
        amount = parseFloat(getCell('D' + countMass)) > 0 ? parseFloat(getCell('D' + countMass)) : parseFloat(getCell('D' + countMass)) * -1;
        // console.log(amount);
        if (balance.balance.amount.value >= meta) {
            console.log('META ATINGIDA...'.green);
            process.exit(1)
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
let tickss = []

const trade = async () => {
    console.log('=====================');
    const connection = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=34942');
    const api = new DerivAPI({ connection });

    balance = await api.account('pbZQyrw6BRt0lu5');
    tradedou = true
    if (start) {
        // start = false
        // meta = balance.balance.amount.value + (balance.balance.amount.value * (meta / 100))
        // console.log(`Meta = ${meta}`);
        // modifyCell('N12', balance.balance.amount.value);
        // cicleSession = 0;
        // XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
        // amount = parseFloat(getCell('D' + countMass)).toFixed(2)
    }

    // let contract = await api.contract({
    //     contract_type: 'DIGITOVER',
    //     symbol: 'R_100',
    //     duration: 1,
    //     duration_unit: 't',
    //     currency: 'USD',
    //     barrier: 5,
    //     proposal: 1,
    //     basis: 'stake',
    //     amount: parseFloat(amount).toFixed(2)
    // }).catch(err => console.log(err));
    // contract.buy().catch(err => {
    //     console.log(err)
    //     trade()
    // });

    console.log(parseFloat(amount).toFixed(2));

    // contract.onUpdate().subscribe(async contract => {
    //     if (contract.is_sold) {
    //         if (contract.status == 'won') {
    //             // console.log(contract.profit);
    //             console.log('WIIN'.green);
    //             win++
    //             console.log(`Wins: ${win} || Loss: ${loss}`)
    //             winMass()
    //         } else {
    //             console.log('LOSS'.red);
    //             loss++
    //             console.log(`Wins: ${win} || Loss: ${loss}`)
    //             lossMass('L')
    //         }
    //         trade()
    //     }
    // })

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

let lastDigits = [0, 1, 2]

const tickhes = async () => {
    console.log('=====================');
    const connection = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=34942');
    const api = new DerivAPI({ connection });

    balance = await api.account('pbZQyrw6BRt0lu5');

    if (start) {
        start = false
        meta = balance.balance.amount.value + (balance.balance.amount.value * (meta / 100))
        console.log(`Meta = ${meta}`);
        modifyCell('N12', balance.balance.amount.value);
        cicleSession = 0;
        XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
        amount = parseFloat(getCell('D' + countMass)).toFixed(2)
    }

    // a ticks object you can get the ticks from or listen to updates
    const ticks = await api.ticks('R_100');
    if (!bancaAtual)
        bancaAtual = balance.balance.amount.value

    // By default the last 1000 ticks
    // const list_of_ticks = ticks.list;
    // const list_of_old_ticks = await ticks.history(range);

    // Get the tick updates with a callback

    // if (start) {
    //     start = false
    //     meta = balance.balance.amount.value + (balance.balance.amount.value * (meta / 100))
    //     console.log(`Meta = ${meta}`);
    //     modifyCell('N12', balance.balance.amount.value);
    //     cicleSession = 0;
    //     XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
    //     amount = parseFloat(getCell('D' + countMass)).toFixed(2)
    // }

    ticks.onUpdate(async tick => {
        // console.log(parseInt(tick.raw.quote.toString().slice(-1)));
        lastDigits[2] = lastDigits[1]
        lastDigits[1] = lastDigits[0]
        lastDigits[0] = parseInt(tick.raw.quote.toString().slice(-1))


        if (tickss.length == 10) {
            for (let index = tickss.length - 1; index > 0; index--) {
                tickss[index] = tickss[index - 1]
            }
            tickss[0] = parseInt(tick.raw.quote.toString().slice(-1))
            let even = 0;
            let odd = 0;
            for (let index = 0; index < tickss.length; index++) {
                const element = tickss[index];
                if (element % 2 == 0) {
                    even++
                } else {
                    odd++
                }

            }
            // console.log(even, '-', odd);
            // console.log(even > odd ? 'DIGITODD' : 'DIGITEVEN');
            if (even != odd) {
                let contract = await api.contract({
                    contract_type: even > odd ? 'DIGITODD' : 'DIGITEVEN',
                    symbol: 'R_100',
                    duration: 1,
                    duration_unit: 't',
                    currency: 'USD',
                    // barrier: lastDigits[2],
                    proposal: 1,
                    basis: 'stake',
                    amount: parseFloat(amount).toFixed(2)
                }).catch(err => console.log(err));
                contract.buy().catch(err => {
                    console.log(err)
                    // trade()
                });
                contract.onUpdate().subscribe(async contract => {
                    if (contract.is_sold) {
                        // console.log(contract);
                        const intttt = setInterval(() => {
                            if (contract.status == 'won') {
                                if (balance.balance.amount.value > bancaAtual) {
                                    // console.log(balance.balance.amount.value)
                                    bancaAtual = balance.balance.amount.value
                                    // console.log(contract.profit);
                                    // profitSession += contract.profit.value
                                    // bancaAtual += profitSession
                                    console.log('WIIN'.green);
                                    win++
                                    console.log(`Wins: ${win} || Loss: ${loss}`)
                                    winMass()



                                    // resolve()
                                    contract = undefined
                                    connection.terminate()
                                    console.log('tickhes');
                                    clearInterval(intttt)
                                    tickhes()
                                }
                            } else {
                                if (balance.balance.amount.value < bancaAtual) {
                                    // console.log(balance.balance.amount.value)
                                    bancaAtual = balance.balance.amount.value
                                    // console.log(contract.profit);
                                    // profitSession -= contract.profit.value
                                    // bancaAtual += profitSession
                                    console.log('LOSS'.red);
                                    loss++
                                    console.log(`Wins: ${win} || Loss: ${loss}`)
                                    lossMass('L')
                                    contract = undefined
                                    connection.terminate()
                                    console.log('tickhes');
                                    clearInterval(intttt)
                                    tickhes()
                                }
                            }
                        }, 750);
                    }
                })
                // }
            }

        } else {
            tickss.push(parseInt(tick.raw.quote.toString().slice(-1)))
            console.log(tickss.length);
        }


    });
}
tickhes()
// trade()
