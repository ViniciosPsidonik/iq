
const fs = require('fs')
const WebSocket = require('ws');
const DerivAPI = require('@deriv/deriv-api/dist/DerivAPI');

var XLSX = require('xlsx');
var XLSX_CALC = require('xlsx-calc');
const { log } = require('pkg/lib-es5/log');
var workbook = XLSX.readFile('./Massanielloderiv7313.xlsx');
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
let lossseq = 0
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
        console.log('Balance=', getCell('F' + (countMass - 1)));
    }
    modifyCell('C' + countMass, winloss);
    XLSX_CALC(workbook, { continue_after_error: true, log_error: false });

    // console.log('F=', getCell('F' + countMass))
    countMass++;
    amount = parseFloat(getCell('D' + countMass)) > 0 ? parseFloat(getCell('D' + countMass)) : parseFloat(getCell('D' + countMass)) * -1;
    if (amount < 0.35) {
        console.log("LOSSSSSSS".red);
        // veefe = ''
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
    if (getCell('F' + (countMass - 1)) > getCell('N12') || (profitSession >= lastTake && Vee + Efee > 25)) {
        console.log(`Takeeee `.green)
        veefe = ''
        take();
        lastTake = profitSession
    }

    // if(amount < 0.35){
    //     console.log('Hiit'.red);
    //     console.log(`Takeeee `.green)
    //     veefe = ''
    //     take();
    // }


    // config.veefe = veefe
    // fs.writeFile('deriv.json', JSON.stringify(config, null, 4), err => {
    //     // console.log(err || 'Arquivo salvo');
    // });
}

function take() {
    loss = 0;
    lossseq = 0
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

const getamount = async () => {

    for (let index = 0; index < veefe.length; index++) {
        const element = veefe[index];

        // console.log(element);
        modifyCell('C' + countMass, element);

        countMass++
        if (element == 'L') {
            loss++
            lossseq++
            hasloss = true
        } else {
            win++
            lossseq = 0
        }

        // if (index % 10 == 0) {
        //     XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
        //     console.log('xlsss');
        // }
        // console.log(element);
    }
    XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
    amount = parseFloat(getCell('D' + countMass))
    cicleSession = profitSession - lastTake
    console.log('Banca=', getCell('N12'));
    console.log(amount);

    // console.log(getCell('I' + 3))
    // console.log(getCell('F' + 3))
    // console.log(getCell('N' + 12))

}

let amountInitial
let ganhaTrade = 0
let canTrade = false
let ativaTicks = false
let counterNine = 0
let lastDigits = [0, 1]
let lasttrywin = false
let maiormenor = new Map()

let lastDigits25 = []
let lastDigits50 = []
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

        bancaVirtual = parseFloat(getCell('N12'))
        // console.log('aaaaaaaa');
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
        amount = parseFloat(getCell('D' + countMass)).toFixed(2)
        amountInitial = amount
        getamount()

        // console.log('amount=', amount);
    }


    let contract = await contracts();
    // 
    // if (loss + win > 0) {
    if (verporcentagem == 25 && porcentagem25 >= 60 || verporcentagem == 50 && porcentagem50 >= 60) {
        // ativaTicks = true
        // console.log('aguardando mercado...');
        // waiting = true
        // await esperaPoderEntrar()
        // waiting = false
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
let conn = false
setInterval(() => {
    if (conn && !waiting) {
        console.log('conn ====== false');
        conn = false
    } else if (!waiting) {
        buyRec()
    }
}, 30000);
const esperaPoderEntrar = (type) => {
    return new Promise((resolve, reject) => {
        const intt = setInterval(() => {
            if (verporcentagem == 25 && porcentagem25 < 60 || verporcentagem == 50 && porcentagem50 < 60) {
                clearInterval(intt)
                return resolve()
            }
        }, 100);
    })
}
let galenow = false
let saiuhit = false
let activagale = false
let verporcentagem = 25
let waiting = false

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
            if (element == 0 || element == 1 || element == 2 || element == 3 || element == 4 || element == 5) {
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
                console.log('WIN=='.green, contract.profit.value);
                console.log(contract.profit);
                console.log(bancaAtual);
                profitSession += contract.profit.value
                cicleSession += contract.profit.value

                lossseq = 0
                if (!hasloss || galenow) {
                    cicleSession = 0

                    lastTake = profitSession
                }

                if (!galenow && hasloss) {
                    win++
                    winMass();
                } else if (galenow) {
                    activagale = false
                    console.log('NOT galenow');
                    console.log(`Takeee`.green);
                    galenow = false
                    take()
                    saiuhit = false
                    veefe = ""
                    loss = 0
                    lossseq = 0
                    win = 0
                }

                if (activagale) {
                    // amount = (Math.abs(cicleSession) + parseFloat(amountInitial)) / 0.92
                    // // console.log('galenow');
                    // galenow = true

                }

                console.log(`Wins: ${win} || Loss: ${loss} || lossseq : ${lossseq}`);
                console.log(`Profit Session = ${profitSession}`.green);
                console.log(`Cicle Session = ${cicleSession}`.green);
                if (profitSession > 8) {
                    console.log(`STOP WIIN`.green);
                    take()
                    veefe = ""
                    profitSession = 0
                    lastTake = 0
                    save();
                    setTimeout(() => {
                        process.exit()
                    }, 5000);
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
                cicleSession -= contract.profit.value
                // bancaAtual += profitSession
                console.log('LOSS'.red);
                loss++;
                lossseq++;
                lossMass('L');
                console.log('lost=='.red, contract.profit.value);

                if (!hasloss) {
                    hasloss = true
                }

                if (lossseq >= 3 && !activagale && loss + win <= 15 || lossseq >= 2 && loss - win > 10 && loss + win <= 15) {
                    // activagale = true
                    // console.log('activagale');
                    // galenow = true
                    // saiuhit = false
                }
                if (!saiuhit && galenow) {
                    // amount = (Math.abs(cicleSession) + parseFloat(amountInitial)) / 0.6
                    // console.log('saiuhit');
                }
                if (lossseq >= 6 && galenow || lossseq >= 5 && galenow && loss - win > 10) {
                    // amount = amountInitial
                    // console.log(`=HIT=`.red)
                    // win = 0
                    // lossseq = 0
                    // hasloss = false
                    // loss = 0
                    // cicleSession = 0
                    // galenow = false
                    // veefe = ""
                    // take()
                }



                console.log(`Wins: ${win} || Loss: ${loss} || lossseq : ${lossseq}`);
                console.log(`Profit Session = ${profitSession}`.green);
                console.log(`Cicle Session = ${cicleSession}`.green);
                if (profitSession <= -8) {
                    console.log(`STOP WIIN`.green);
                    process.exit()
                } else {
                    buyRec(api, connection);
                }
            }

            save();
        } else {
            if (typeof contract.validation_error != "undefined") {

                console.log(contract.validation_error);
            }
        }
    });
}

function save() {
    config.veefe = veefe;
    config.profitSession = profitSession;
    config.lastTake = lastTake;
    fs.writeFile('deriv.json', JSON.stringify(config, null, 4), err => {
    });
}

function getRandomValue() {
    return Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
}
// trade()
buyRec()