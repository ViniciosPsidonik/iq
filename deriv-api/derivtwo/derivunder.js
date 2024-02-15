
const fs = require('fs')
const WebSocket = require('ws');
const DerivAPI = require('@deriv/deriv-api/dist/DerivAPI');
const axios = require('axios')
var XLSX = require('xlsx');
var XLSX_CALC = require('xlsx-calc');
const { log } = require('pkg/lib-es5/log');
var workbook = XLSX.readFile('./Massanielloderiv10050under.xlsx');
var worksheet = workbook.Sheets['Calculadora']
let amount = 0.35
let fsConfig = fs.readFileSync('derivunder.json')
let config = JSON.parse(fsConfig)
let veefe = config.veefe
let lastTake = config.lastTake

const cors = require('cors')
var express = require('express')
var app = express()
app.use(cors({ origin: '*' }))

let canTradeOther = false
app.get('/cantrade', function (req, res) {
    // setTimeout(() => {
    canTradeOther = true
    // }, 3000);
})

const PORT = 9091
app.listen(PORT)

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
    if (getCell('F' + (countMass - 1)) > getCell('N12') || (profitSession >= lastTake)) {
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
let barrier = 6

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
            lastDigits[1] = lastDigits[0]

            lastDigits[0] = parseInt(tick.raw.quote.toString().slice(-1))
            // console.log(digit);
            // if ((digit == 0 || digit == 1 || digit == 2) && (lastDigits[1] == 0 || lastDigits[1] == 1 || lastDigits[1] == 2)) {
            //     lasttrywin = false
            // } else if ((digit != 0 && digit != 1 && digit != 2) && (lastDigits[1] == 0 || lastDigits[1] == 1 || lastDigits[1] == 2)) {
            //     lasttrywin = true
            // }

            // console.log(maiormenor);

            if (ativaTicks && canTradeOther) {
                console.log(digit);
                let menor = maiormenor.get('menor');

                // if ((digit == 0 || digit == 1 || digit == 2) && menor >= 1) {
                if ((digit == 0 || digit == 1 || digit == 2)) {
                    counterNine++
                    if (counterNine >= 1) {
                        counterNine = 0
                        ativaTicks = false
                        canTrade = true
                    }
                }
                else {
                    // counterNine = 0
                }
            }


            // if (digit > 5 && lastDigits[1] <= 3) {
            //     aumentaMenor(true);
            // } else if (digit > 5 && lastDigits[1] > 3) {
            //     aumentaMaior(true);
            // }
            // else if (digit > 3 && lastDigits[1] <= 3) {
            //     diminuiMenor(false);
            // } else if (digit > 3 && lastDigits[1] > 3) {
            //     diminuiMaior(false);
            // }

            // if (ativaTicks) {
            //     console.log(maiormenor);
            // }
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
    // if (lossseq >= 1 || win >= 10 || galenow || ) {
    // if (!canTradeOther) {
    ativaTicks = true
    await esperaPoderEntrar()

    // }
    console.log('=====================');
    conn = true
    canTradeOther = false
    contract.buy().catch(err => {
        console.log(err);
        trade();
    });
    // console.log(contracts);
    startContract(contract, api, connection);

    async function contracts() {
        console.log('amount=', amount);
        let contract = await api.contract({
            // contract_type: 'DIGITDIFF',
            contract_type: 'DIGITUNDER',
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
let conn = false
setInterval(() => {
    if (conn) {
        console.log('conn ====== false');
        conn = false
    } else {
        buyRec()
    }
}, 30000);
const esperaPoderEntrar = (type) => {
    return new Promise((resolve, reject) => {
        axios.get(`http://localhost:9090/cantrade`).then((res) => {
            console.log('enviado');
        }).catch((err) => {

        })
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
let galenow = false
let saiuhit = false
let activagale = false

function diminuiMaior(aumenta) {
    if (!maiormenor.has('menor')) {
        maiormenor.set('maior', 0);
        maiormenor.set('menor', 1);
    } else {
        let menor = maiormenor.get('menor');
        let maior = maiormenor.get('maior');
        if (maior > 0)
            maiormenor.set('maior', 0);

    }
}

function diminuiMenor(aumenta) {
    if (!maiormenor.has('menor')) {
        maiormenor.set('maior', 1);
        maiormenor.set('menor', 0);
    } else {
        let menor = maiormenor.get('menor');
        let maior = maiormenor.get('maior');
        if (menor > 0)
            maiormenor.set('menor', menor - 1);


    }
}

function aumentaMenor(aumenta) {
    if (!maiormenor.has('menor')) {
        maiormenor.set('maior', 0);
        maiormenor.set('menor', 2);
    } else {
        let menor = maiormenor.get('menor');
        let maior = maiormenor.get('maior');

        if (maior <= 10)
            maiormenor.set('menor', menor + 2);

    }
}

function aumentaMaior(aumenta) {
    if (!maiormenor.has('menor')) {
        maiormenor.set('maior', 1);
        maiormenor.set('menor', 0);
    } else {
        let menor = maiormenor.get('menor');
        let maior = maiormenor.get('maior');

        if (maior <= 10)
            maiormenor.set('maior', maior + 1);

    }
}

function startContract(contract, api, connection) {

    // console.log('amount=', amount);
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
                console.log('WIN=='.green, contract.profit.value);
                // console.log(contract.profit);
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

                setTimeout(() => {
                    fsConfig2 = fs.readFileSync('derivunder.json')
                    config2 = JSON.parse(fsConfig2)
                    fsConfig = fs.readFileSync('derivover.json')
                    config = JSON.parse(fsConfig)
                    if (config.profitSession + config2.profitSession >= 0.5) {
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
                }, 3000);
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

                if (lossseq >= 3 && !activagale || lossseq >= 3 && loss - win > 10) {
                    // activagale = true
                    // console.log('activagale');
                    // galenow = true
                    // saiuhit = false
                }
                if (!saiuhit && galenow) {
                    // amount = (Math.abs(cicleSession) + parseFloat(amountInitial)) / 0.92
                    // console.log('saiuhit');
                }
                if (loss - win >= 50) {
                    amount = amountInitial
                    console.log(`=HIT=`.red)
                    win = 0
                    lossseq = 0
                    hasloss = false
                    loss = 0
                    cicleSession = 0
                    galenow = false
                    veefe = ""
                    take()
                }



                console.log(`Wins: ${win} || Loss: ${loss} || lossseq : ${lossseq}`);
                console.log(`Profit Session = ${profitSession}`.green);
                console.log(`Cicle Session = ${cicleSession}`.green);
                buyRec(api, connection);
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
    fs.writeFile('derivunder.json', JSON.stringify(config, null, 4), err => {
    });
}

function getRandomValue() {
    return Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
}
// trade()
setTimeout(() => {
    buyRec()
}, 10000);