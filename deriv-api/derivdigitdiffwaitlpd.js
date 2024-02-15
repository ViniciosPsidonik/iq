
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
// let veefe = config.veefe
let veefe = ""
let lastTake = config.lastTake
// let lastTake = 0

const colors = require('colors')
// change some cell value
// console.log(getCell('F4'));

let countMass = 3
// console.log(amount);
let profitSession = config.profitSession
// let profitSession = 0

// basic.ping().then(console.log);
let balancesss = false
let balance
let win = 0
let loss = 0
let lossseq = 0
let meta = 100
let bancaVirtual = 0
try {


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
    const args = process.argv.slice(2);
    let barrier = 0

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
    let symbol = 'R_100'

    function encontrarAlgarismoMenosRepetido(array) {
        // Objeto para rastrear a contagem de cada algarismo
        let contagem = {};

        // Iterar sobre o array e contar a ocorrência de cada algarismo
        array.forEach((algarismo) => {
            contagem[algarismo] = (contagem[algarismo] || 0) + 1;
        });

        // Encontrar o algarismo com a contagem mínima
        let algarismoMenosRepetido;
        let contagemMinima = Infinity;

        for (let algarismo in contagem) {
            if (contagem[algarismo] < contagemMinima) {
                contagemMinima = contagem[algarismo];
                algarismoMenosRepetido = algarismo;
            }
        }

        return algarismoMenosRepetido;
    }

    function encontrarAlgarismoMaisRepetido(array) {
        // Objeto para rastrear a contagem de cada algarismo
        let contagem = {};

        // Iterar sobre o array e contar a ocorrência de cada algarismo
        array.forEach((algarismo) => {
            contagem[algarismo] = (contagem[algarismo] || 0) + 1;
        });

        // Encontrar o algarismo com a contagem máxima
        let algarismoMaisRepetido;
        let contagemMaxima = 0;

        for (let algarismo in contagem) {
            if (contagem[algarismo] > contagemMaxima) {
                contagemMaxima = contagem[algarismo];
                algarismoMaisRepetido = algarismo;
            }
        }

        return algarismoMaisRepetido;
    }
    let countgales = 0
    let gales = 1
    let countlogin = 0
    async function buyRec() {
        console.log('biy rec');
        try {
            const connection = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=34941');
            const api = new DerivAPI({ connection });

            // if (countlogin >= 2) {
            balance = await api.account('pbZQyrw6BRt0lu5').catch(err => console.log(err));


            countlogin++
            // countlogin = 0
            // }
            // if (!bancaAtual)
            if (start) {
                // balance = await api.account('pbZQyrw6BRt0lu5').catch(err => console.log(err));

                bancaAtual = balance.balance.amount.value
                start = false
                // meta = balance.balance.amount.value + 50

                bancaVirtual = parseFloat(getCell('N12'))
                // console.log('aaaaaaaa');
                const ticks25 = await api.ticks(symbol).catch(err => console.log(err))
                // const ticks50 = await api.ticks('R_50');
                console.log('asdasdasdasdads');
                bancaVirtual = parseFloat(getCell('N12'))
                // console.log('aaaaaaaa');
                for (let index = 0; index < 50; index++) {
                    const element = ticks25._data.list[index];
                    let digit = parseInt(element.raw.quote.toString().slice(-1));
                    lastDigits25.push(digit)

                }
                console.log(lastDigits25.length);
                ticks25.onUpdate().subscribe(async tick => {
                    // setPorcentagem(tick, lastDigits25, 25);
                    try {


                        let digit = parseInt(tick.raw.quote.toString().slice(-1));
                        let tckkk = tick.raw.quote.toString().split('.')[1]
                        if (typeof tckkk != "undefined" && tick.raw.quote.toString().split('.')[1].length == 1) {
                            digit = 0
                        }
                        // console.log(digit);
                        for (let index = 25 - 1; index > 0; index--) {
                            lastDigits25[index] = lastDigits25[index - 1];
                        }
                        lastDigits25[0] = digit;
                        if (ativaTicks) {
                            let alga = parseInt(encontrarAlgarismoMenosRepetido(lastDigits25))
                            // console.log(lastDigits25);
                            // console.log(contarOcorrencias(1, lastDigits25))
                            // console.log(alga);
                            // if (digit == 0 || digit == 1 || digit == 2) {
                            // if (alga == 0 || alga == 1 || alga == 2) {
                            // barrier = alga
                            // if (digit != 0 && digit != 9)
                            // barrier = digit
                            barrier = alga
                            // if (alga == 9) {
                            if (!waitdigit) {
                                ativaTicks = false
                                canTrade = true
                            } else if (digit == barrier) {
                                ativaTicks = false
                                canTrade = true
                                waitdigit = false
                            }
                            // buyRec(api, connection);
                            // }
                        }
                    } catch (error) {
                        console.log(error);
                    }
                })
                // ticks50.onUpdate().subscribe(async tick => {
                //     setPorcentagem(tick, lastDigits50, 50);
                // })

                meta = 9135
                console.log(`Meta = ${meta}`);
                // modifyCell('N12', balance.balance.amount.value);
                cicleSession = 0;
                // XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
                amount = parseFloat(getCell('D' + countMass)).toFixed(2)
                amountInitial = amount
                secondAmount = amount
                // getamount()

                // console.log('amount=', amount);


            }


            // 
            if (loss > -1) {
                ativaTicks = true
                console.log('aguardando mercado...');
                waiting = true
                await esperaPoderEntrar()
                waiting = false
            }
            console.log('=====================');

            console.log('Barrie=', barrier);
            if (amount > 16) {
                amount = 14
            }
            console.log('amount=', parseFloat(amount));
            let contract = await api.contract({
                contract_type: 'DIGITDIFF',
                // contract_type: 'DIGITOVER',
                symbol,
                duration: 1,
                duration_unit: 't',
                currency: 'USD',
                barrier,
                // proposal: 2,
                basis: 'stake',
                amount: parseFloat(amount).toFixed(2)
            }).catch(err => console.log(err));

            conn = true
            contract.buy().catch(err => {
                console.log(err);
            });


            // console.log(contracts);
            startContract(contract, api, connection);
            // if (hasloss && hadwin) {
            //     countgales++
            //     // if (countgales >= gales) {
            //     amount = secondAmount
            //     hadwin = false
            //     loss = 0
            //     // }

            // }
            if (counttope < 50) {
                buyRec(api, connection);
            } else {
                counttope = 0
                console.log('counttope---');
            }

        } catch (error) {
            console.log(error);
        }
    }

    function contarOcorrencias(numeroProcurado, array) {
        // Usando o método reduce para contar as ocorrências
        const contador = array.reduce((acc, numero) => {
            if (numero === numeroProcurado) {
                return acc + 1;
            }
            return acc;
        }, 0);

        return contador;
    }
    let conn = false
    setInterval(() => {
        if (conn && !waiting) {
            console.log('conn ====== false');
            conn = false
        } else if (!waiting) {
            buyRec()
        }
    }, 60000);
    const esperaPoderEntrar = (type) => {
        return new Promise((resolve, reject) => {
            const intt = setInterval(() => {
                if (canTrade) {
                    canTrade = false
                    clearInterval(intt)
                    return resolve()
                }
            }, 1);
        })
    }
    let galenow = false
    let saiuhit = false
    let activagale = false
    let verporcentagem = 25
    let waiting = false

    let wing = 0
    let lossg = 0
    let hadwin = false
    let secondAmount = amount
    let transactions = new Map()
    let waitdigit = false
    let counttope = 0
    function startContract(contract, api, connection) {


        let counrt = 0
        try {
            contract.onUpdate().subscribe(async (contract) => {
                // console.log('issold after');
                // console.log(contract);
                counrt++
                // transactions.set(contract.buy_transaction, )
                if (contract.is_sold) {
                    counttope++
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
                        win++

                        // // if (amount > amountInitial) {
                        //     amount = amountInitial
                        // hadwin = false
                        // }
                        if (cicleSession >= 0) {
                            cicleSession = 0
                            amount = amountInitial
                            lastTake = profitSession
                            loss = 0
                            lossseq = 0
                            win = 0
                            secondAmount = amountInitial
                            countgales = 0
                            hasloss = false
                        } else if (hasloss && win >= 1 && hadwin == false) {
                            // secondAmount = amount
                            // amount = (Math.abs(cicleSession) / 0.08) / gales
                            // hadwin = true
                        }


                        if (amount > amountInitial) {
                            amount = amountInitial
                        }


                        wing++
                        console.log(`Wins: ${win} || Loss: ${loss} || lossseq : ${lossseq}`);
                        console.log(`wing: ${wing} || lossg: ${lossg}`);
                        console.log(`Profit Session = ${profitSession}`.green);
                        console.log(`Cicle Session = ${cicleSession}`.green);
                        if (profitSession > 32) {
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
                            // if (hasloss)
                            // buyRec(api, connection);
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
                        // lossMass('L');
                        waitdigit = false
                        console.log('lost=='.red, contract.profit.value);
                        countgales = 0
                        if (!hasloss) {
                            hasloss = true
                        } else {
                            countgales = 0
                        }
                        win = 0

                        if (amount == amountInitial) {
                            secondAmount = amount
                            amount = (Math.abs(cicleSession) / 0.08) / gales
                        } else if (amount > amountInitial) {
                            hasloss = false
                            cicleSession = 0
                            amount = amountInitial
                            lastTake = profitSession
                            loss = 0
                            lossseq = 0
                            win = 0
                            countgales = 0
                            hadwin = false
                            secondAmount = amount
                            console.log('LOSSSS'.red);
                        }


                        lossg++
                        console.log(`Wins: ${win} || Loss: ${loss} || lossseq : ${lossseq}`);
                        console.log(`wing: ${wing} || lossg: ${lossg}`);
                        console.log(`Profit Session = ${profitSession}`.green);
                        console.log(`Cicle Session = ${cicleSession}`.green);
                        if (profitSession <= -32) {
                            console.log(`STOP WIIN`.green);
                            process.exit()
                        } else {
                            // if (hasloss)
                            // buyRec(api, connection);
                        }
                    }

                    save();
                } else {
                    if (typeof contract.validation_error != "undefined") {

                        console.log(contract.validation_error);
                    }
                }
            });
        } catch (error) {
            console.log(error);
        }
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
} catch (error) {
    console.log(error);
}