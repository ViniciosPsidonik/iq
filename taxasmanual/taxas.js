const fs = require('fs')
const axios = require('axios')
const moment = require('moment')
const momentTz = require('moment-timezone');
const countries = require('../country')
const WebSocket = require('ws')
const colors = require('colors')

let fsConfig = fs.readFileSync('config.json')
let config = JSON.parse(fsConfig)
let openedMap = new Map()
let openedMapDigital = new Map()

let fstaxas = fs.readFileSync('taxas.json')
let taxasjson = JSON.parse(fstaxas)

let pricesToSend = fs.readFileSync('pricesToSend.json')
let pricesToSendObj = JSON.parse(pricesToSend)
let pricesToSendMap = new Map()

let veefe = config.veefe

var express = require('express')
var app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
app.use(cors({ origin: '*' }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded());

let returnEnter = new Map()

let candlesticksMap = new Map()

// returnEnter.set('EURUSD', { direction: 'put' })

app.get('/candlestick/:actives', function (req, res) {
    let actives = req.params.actives

    if (activesDigitalMapString.has(actives)) {
        getCandleTime(activesDigitalMapString.get(actives), 5, 100)
    } else {
        getCandleTime(activesMapString.get(actives), 5, 100)
    }
    const getActives = setInterval(() => {
        if (candlesticksMap.has(actives)) {
            clearInterval(getActives)
            if (returnEnter.has(actives)) {
                res.send([...candlesticksMap.get(actives), { actives, ...returnEnter.get(actives) }])
                returnEnter.delete(actives)
            } else {
                res.send(candlesticksMap.get(actives))
            }
        }
    }, 500)
})

let candlesticksLastCandleMap = new Map()
app.get('/candlesticklast/:actives', function (req, res) {
    let actives = req.params.actives
    if (activesDigitalMapString.has(actives)) {
        getCandleTime(activesDigitalMapString.get(actives), 5, 1)
    } else {
        getCandleTime(activesMapString.get(actives), 5, 1)
    }
    const getActives = setInterval(() => {
        if (candlesticksLastCandleMap.has(actives)) {
            clearInterval(getActives)
            res.send(candlesticksMap.get(actives))
            candlesticksLastCandleMap.delete(actives)
        }
    }, 500)
})

app.get('/clear', function (req, res) {
    taxasM5 = ''
    toCloseM5 = ''
    taxasObj = []
    toCloseM5Obj = new Map()
    res.sendStatus(200)
})

app.get('/clearAll', function (req, res) {
    pricesToSendObj = []
    fs.writeFile('pricesToSend.json', JSON.stringify(pricesToSendObj, null, 4), err => {
    });
    res.sendStatus(200)
})

app.get('/getlast', function (req, res) {
    res.send(pricesToSendObj)
    // res.sendStatus(200)
})

app.post('/taxas', function (req, resp) {
    let par = req.body.moeda
    let res = req.body.taxa.res
    let resd = req.body.taxa.resd
    let sup = req.body.taxa.sup
    let supd = req.body.taxa.supd

    // console.log(req.body);

    if (res) {
        taxasM5 += par + ' ' + 'PUT' + ' ' + res + ';'
    }
    if (sup) {
        taxasM5 += par + ' ' + 'CALL' + ' ' + sup + ';'
    }

    if (resd) {
        toCloseM5 += par + ',' + resd
    }
    if (supd) {
        toCloseM5 += ',' + supd + ';'
    } else {
        toCloseM5 += ';'
    }

    // console.log(taxasM5);
    // console.log(toCloseM5);

    stasttaxasm5()
    stasttoclosem5()
    resp.sendStatus(200)

    for (let index = 0; index < pricesToSendObj.length; index++) {
        const element = pricesToSendObj[index];
        if (element.moeda == par) {
            pricesToSendObj.splice(index, 1)
        }
    }
    pricesToSendObj.push({ moeda: par, taxa: { res, resd, sup, supd } })
    // console.log(pricesToSendObj);
    fs.writeFile('pricesToSend.json', JSON.stringify(pricesToSendObj, null, 4), err => {
    });
})


const PORT = process.env.PORT || 1234
app.listen(PORT)


// setTimeout(() => {
//     buyBeforOne('put', 1, 1);
// }, 5000);
//55099058
// const url = 'wss://iqoption.com/echo/websocket'
const url = 'wss://ws.trade.xoption.com/echo/websocket'
let userBalanceId = 0
let amount = config.amount
let verpar = config.verpar
let log = config.log
let logg = config.logg
let country = config.filtroPorPais
let topTradersRange = config.topTradersRange
let copyIds = !isNaN(config.copyIds.split(',')[0]) && !isNaN(config.copyIds.split(',')[1]) ? config.copyIds.split(',') : []
let leadersArray = []
let sessionBalance = 0
let runningActives = []
let showSchedules = config.showSchedules
let runningActivesBinary = []
let runningActivesDigital = []
let runningActivesDigitalFive = []
let StopLoss = config.StopLoss
let StopWin = config.StopWin
let soros = config.soros
let gale = config.gale
let galeLevel = config.galeLevel
let galeFactor = config.galeFactor
let ssid = config.ssid
let amountInitial = amount
let sorosCount = 0
let galeCount = 0
let positionOpenedSoros = false
let positionOpenedGale = false
let sorosLevel = config.sorosLevel
let binarias = config.binarias
let binariasTimes = config.binariasTimes.split(',')
let digital = config.digital
let digitalTimes = config.digitalTimes.split(',')
let payout = config.payout
let bestIdsLog = config.bestIdsLog
let taxas = config.taxas

let doispraum = config.doispraum
let taxasM5 = config.taxasM5
let taxasM15 = config.taxasM15
let noticias = config.noticias
let toCloseM5 = config.toCloseM5
let toCloseM15 = config.toCloseM15

let idsArray = []

let payoutMap = new Map()
let buysCount = new Map()
let buyUsersIds = []

/*

    DragonFly Doji
    gravestone doji
    Bullish Marubozu 
    bearish marubozu
    evening doji star
    evening star
    Morning Doji Star 
    morning star
    Three Black Crows
    Three White Soldiers
    Tweezer Top
    tweezer bottom

*/

var XLSX = require('xlsx');
var workbook = XLSX.readFile('./Massaniello.xlsx');
var XLSX_CALC = require('xlsx-calc');
var worksheet = workbook.Sheets['Calculadora']
// change some cell value
// console.log(getCell('F4'));

let countMass = 3
amount = parseFloat(getCell('D' + countMass))
console.log(amount);

const getamount = async () => {


    modifyCell('N' + 12, config.lastAmount);
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
getamount()

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

if (config.pass != 'senhaloka')
    process.exit()

const onOpen = () => {
    if (log)
        console.log(`Connected with websocket..`)
}

const onError = error => {
    console.log('Error -> WebSocket');
    // console.log(error)
    ws.terminate()
    ws = new WebSocket(url)
    ws.onopen = onOpen
    ws.onerror = onError
    ws.onmessage = onMessage
}

const messageHeader = (body, name, id) => {
    return { 'name': name, 'msg': body, "request_id": `${id}` }
}

const subscribeLiveDeal = (name, active_id, type, expirationTime, subsType) => {
    let data
    if (type == 'digital') {
        data = {
            "name": name,
            "params": {
                "routingFilters": {
                    "instrument_active_id": active_id,
                    "expiration_type": "PT" + expirationTime + "M"
                }
            },
            "version": "2.0"
        }
    } else {
        data = {
            'name': name,
            'params': {
                'routingFilters': {
                    'active_id': active_id,
                    'option_type': type
                }
            },
            'version': '2.0'
        }
    }
    ws.send(JSON.stringify(messageHeader(data, subsType)))
}

const getPayout = (type) => {
    return new Promise((resolve, reject) => {
        axios.get(`http://localhost:3000/payout/${type}`).then((res) => {
            return resolve(res.data)
        }).catch((err) => {
            return resolve(0)
        })
    })
}

const intervalGetPayout = async () => {
    let activesPayout = new Map()
    let turbo = await getPayout('turbo')

    if (turbo)
        for (let i = 0; i < turbo.length; i++) {
            if (i % 2 == 0) {
                activesPayout.set(turbo[i], turbo[i + 1])
            }
        }
    payoutMap.set('turbo', activesPayout)
    activesPayout = new Map()

    let binary = await getPayout('binary')
    if (binary)
        for (let i = 0; i < binary.length; i++) {
            if (i % 2 == 0) {
                activesPayout.set(binary[i], binary[i + 1])
            }
        }
    payoutMap.set('binary', activesPayout)
    activesPayout = new Map()

    let digital = await getPayout('digital')
    if (digital)
        for (let i = 0; i < digital.length; i++) {
            if (i % 2 == 0) {
                activesPayout.set(digital[i], digital[i + 1])
            }
        }
    payoutMap.set('digital', activesPayout)
}

intervalGetPayout()

const getLeaders = (ws) => {
    let countryId = 0
    if (country)
        countryId = countries.get(country)
    data = {
        "name": "sendMessage",
        "msg": {
            "name": "request-leaderboard-deals-client",
            "version": "1.0",
            "body": {
                "country_id": countryId,
                "user_country_id": 0,
                "from_position": 1,
                "to_position": !!topTradersRange ? topTradersRange : 0,
                "near_traders_country_count": 0,
                "near_traders_count": 0,
                "top_country_count": 0,
                "top_count": 0,
                "top_type": 2
            }
        }, "request_id": ""
    }

    if (log)
        console.log(JSON.stringify(data))
    ws.send(JSON.stringify(data))
}

const buy = (amount, active_id, direction, expired, type, msg) => {
    let data
    if (typeof type == 'number') {
        data = {
            "name": "sendMessage",
            "msg": {
                "body":
                {
                    "price": parseFloat(amount),
                    "active_id": active_id,
                    "expired": expired,
                    "direction": direction,
                    "option_type_id": type,//turbo 1 binary
                    "user_balance_id": userBalanceId
                }
                , "name": "binary-options.open-option", "version": "1.0"
            },
            "request_id": `${active_id}`
        }
    } else {

        let expirationAt = moment.unix(expired).utcOffset(0).format("YYYYMMDDHHmm")//YYYYMMDDhhmm
        const activeString = getActiveString(active_id, activesDigitalMapString)
        const instrumentId = 'do' + activeString + expirationAt + type + direction.toUpperCase().substring(0, 1) + 'SPT'

        data = {//do4A20210413D174500T15MCSPT
            "name": "sendMessage",
            "msg": {
                "name": "digital-options.place-digital-option",
                "version": "1.0",
                "body": {
                    "user_balance_id": userBalanceId,
                    "instrument_id": instrumentId,
                    "amount": amount.toString()
                }
            }, "request_id": `${active_id}`
        }
    }

    // console.log(JSON.stringify(data))
    ws.send(JSON.stringify(data))
}

let getLeadersBool = !!topTradersRange || copyIds.length > 0 ? false : true

let taxasObj = []
let taxasObj15 = []

setInterval(() => {
    if (taxasObj.length > 0) {
        for (let index = 0; index < taxasObj.length; index++) {
            const element = taxasObj[index];
            let parInt = activesMapString.get(element.par)
            getCandle(parInt, 1)
        }
    }
}, 500);

setInterval(() => {
    if (taxasObj15.length > 0) {
        for (let index = 0; index < taxasObj.length; index++) {
            const element = taxasObj[index];
            let parInt = activesMapString.get(element.par)
            getCandle(parInt, 15)
        }
    }
}, 1000);

let toCloseM15Obj = new Map()
let toClose15Array = toCloseM15.split(';')
for (let index = 0; index < toClose15Array.length; index++) {
    const close = toClose15Array[index].split(',');
    toCloseM15Obj.set(close[0], {
        max: close[1],
        min: close[2]
    })
}

let currentMoeda = ''
taxasM5 = ''
toCloseM5 = ''
for (const [key, value] of Object.entries(taxasjson)) {

    // console.log(`${key}: ${value}`);
    let close = key.split('-')[2]

    if (value) {
        let moeda = key.split('-')[0]
        let direction = key.split('-')[1]

        if (currentMoeda != moeda) {
            currentMoeda = moeda
        }

        if (typeof close == 'undefined') {
            if (direction == 'P') {
                taxasM5 += moeda + ' ' + 'PUT' + ' ' + value + ';'
            } else if (direction == 'C') {
                taxasM5 += moeda + ' ' + 'CALL' + ' ' + value + ';'
            }
        } else {
            if (direction == 'P') {
                toCloseM5 += moeda + ',' + value
            } else if (direction == 'C') {
                toCloseM5 += ',' + value + ';'
            }
        }
    } else {
        if (typeof close != 'undefined') {
            toCloseM5 += ';'
        }
    }
}

// console.log(taxasM5);
// console.log(toCloseM5);

config.taxasM5 = taxasM5;
config.toCloseM5 = toCloseM5;

fs.writeFile('config.json', JSON.stringify(config, null, 4), err => {
    // console.log(err || 'Arquivo salvo');
});


let toCloseM5Obj = new Map()
function stasttoclosem5() {
    let toClose5Array = toCloseM5.split(';')
    for (let index = 0; index < toClose5Array.length; index++) {
        if (toClose5Array[index]) {
            const close = toClose5Array[index].split(',');
            toCloseM5Obj.set(close[0], {
                max: parseFloat(close[1]),
                min: parseFloat(close[2])
            })
        }
    }
    // console.log(toCloseM5Obj);
}


function stasttaxasm5() {
    let taxasArray = taxasM5.split(';')
    for (let index = 0; index < taxasArray.length; index++) {
        if (taxasArray[index]) {
            const taxas = taxasArray[index];
            let taxa = taxas.split(' ');
            let found = false
            let indexxxx = 0;
            for (let index1 = 0; index1 < taxasObj.length; index1++) {
                const elementtt = taxasObj[index1];
                if (elementtt.par == taxa[0]) {
                    found = true
                    indexxxx = index1
                    break
                }
            }

            if (!found) {
                if (taxa.includes('PUT')) {
                    taxasObj.push({
                        par: taxa[0],
                        max: parseFloat(taxa[2]),
                        min: 0
                    })
                } else {
                    taxasObj.push({
                        par: taxa[0],
                        min: parseFloat(taxa[2]),
                        max: 0
                    })
                }
            } else {
                let par = taxasObj[indexxxx].par
                let min = taxasObj[indexxxx].min
                let max = taxasObj[indexxxx].max

                taxasObj.splice(indexxxx, 1)

                if (taxa.includes('PUT')) {
                    taxasObj.push({
                        par,
                        min,
                        max: parseFloat(taxa[2])
                    })
                } else {
                    taxasObj.push({
                        par,
                        max,
                        min: parseFloat(taxa[2])
                    })
                }
            }
        }
    }
    // console.log(taxasObj);
}

let taxasArray15 = taxasM15.split(';')
for (let index = 0; index < taxasArray15.length; index++) {
    const taxas = taxasArray15[index];
    let taxa = taxas.split(' ');
    let found = false
    let indexxxx = 0;
    for (let index1 = 0; index1 < taxasObj15.length; index1++) {
        const elementtt = taxasObj15[index1];
        if (elementtt.par == taxa[0]) {
            found = true
            indexxxx = index1
            break
        }
    }

    if (!found) {
        if (taxa.includes('PUT')) {
            taxasObj15.push({
                par: taxa[0],
                max: parseFloat(taxa[2]),
                min: 0
            })
        } else {
            taxasObj15.push({
                par: taxa[0],
                min: parseFloat(taxa[2]),
                max: 0
            })
        }
    } else {
        let par = taxasObj15[indexxxx].par
        let min = taxasObj15[indexxxx].min
        let max = taxasObj15[indexxxx].max

        taxasObj15.splice(indexxxx, 1)

        if (taxa.includes('PUT')) {
            taxasObj15.push({
                par,
                min,
                max: parseFloat(taxa[2])
            })
        } else {
            taxasObj15.push({
                par,
                max,
                min: parseFloat(taxa[2])
            })
        }
    }

}

// console.log(taxasObj15);

let noticiasObj = []

if (noticias) {
    let noticiasArray = noticias.split(';')
    for (let index = 0; index < noticiasArray.length; index++) {
        const noticia = noticiasArray[index].split(',');
        noticiasObj.push({
            par: noticia[0],
            time: noticia[1]
        })
    }
    console.log(noticiasObj)
}

let stopOrders = false
let stopOrdersPares = []


const getActiveString = (active, map) => {
    for (var [key, value] of map) {
        if (value == active) {
            return key
        }
    }
}

let cleanned = false


let currentTime
let currentTimemmssDate
let currentTimehhmm
let currentTimemm
let buysss = []

let openedOrders = []

let winss = 0
let losss = 0

const notifier = require('node-notifier');
const path = require('path');

function notify(title, message) {
    notifier.notify(
        {
            title,
            message,
            // icon: path.join(__dirname, 'coulson.jpg'),
            sound: true,
            wait: true // Wait with callback, until user action is taken against notification, does not apply to Windows Toasters as they always wait or notify-send as it does not support the wait option
        },
        function (err, response, metadata) {
        }
    );
}

let openOrderNextCandle = []
let lastTickCandles = new Map()

const onMessage = e => {
    // if (ws.readyState === WebSocket.OPEN) {
    const message = JSON.parse(e.data)

    if (message.name == 'instrument-quotes-generated') {
        // console.log('RES = ' + e.data);
    }

    // if (message.name != 'instrument-quotes-generated' && message.name != 'api_option_init_all_result')
    // console.log('RES = ' + e.data)

    if (doispraum && StopWin >= 2) {
        console.log('Stop Win Alcançado...')
        notify('Stop', `Stop Win Alcançado...`);
        process.exit()
    }

    // if (1 <= StopLoss) {
    //     console.log('Stop Loss Alcançado...')
    //     notify('Stop', `Stop Loss Alcançado...`);
    //     process.exit(1)
    // }

    if (message.name == 'profile' && message.msg) {
        profileStuf(message, 'live-deal-binary-option-placed')
    }

    if (message.name == 'option' && message.status != 0) {
        errorOption(message, e);
    }

    if (message.name == 'digital-option-placed' && message.status != 2000) {
        errorDigital(message, e);
    }

    if (message.name == 'option-closed') {
        // console.log('RES = ' + e.data);
        optionClosed(message)
    }

    if (message.name == 'position-changed') {
        // console.log('RES = ' + e.data);
        positionChangedStuff(message)
    }

    if (message.name == 'heartbeat' || message.name == 'timesync') {
        heartbeat(message);

        //noticias...
        noticiasStuff();
    }

    if (message.name == 'candles') {
        candleStuff(message);
    }
}

setInterval(() => {
    // axios.get('https://checkpayout.herokuapp.com/opened').then(res => {
    //     openedMap = res.data.openedMap
    // })
}, 5000);

let totalOrderss = 0

let m15Expires = []

function candleStuff(message) {
    try {
        if (message?.msg?.candles?.length > 10) {
            candlesticksMap.set(getActiveString(parseInt(message.request_id.split('/')[0]), activesMapString), message.msg.candles);
        } else if (message?.request_id?.includes('/1')) {
            candlesticksLastCandleMap.set(getActiveString(parseInt(message.request_id.split('/')[0]), activesDigitalMapString), message.msg.candles);
            let candles = message.msg.candles;
            let price = candles[1].close;
            let open = candles[1].open;
            let thisCandlePar = parseInt(message.request_id.split('/')[0]);

            let closeLast = candles[0].close;
            let minLast = candles[0].min;
            let maxLast = candles[0].max;

            for (let index = 0; index < taxasObj.length; index++) {
                const element = taxasObj[index];
                let parInt = activesMapString.get(element.par);
                let max = parseFloat(element.max);
                let min = parseFloat(element.min);
                let activeString = getActiveString(parInt, activesMapString)

                if (verpar && parseInt(message.request_id) == activesMapString.get(verpar)) {
                    console.log(price);
                }

                let direction;

                if (thisCandlePar == parInt && !openedOrders.includes(parInt) && !notOrder.includes(parInt)) {

                    let breakaa = false;
                    breakaa = getBreakaa(price, index, parInt, breakaa);
                    if (breakaa)
                        break;

                    if (max != 0 && price >= max) {
                        // let minVela = parseInt(currentTimemm.substring(currentTimemm.length, currentTimemm.length - 1))
                        // let achouOpenOrder = false
                        // for (let index = 0; index < openOrderNextCandle.length; index++) {
                        //     const element = openOrderNextCandle[index];
                        //     if (element.par == parInt) {
                        //         achouOpenOrder = true
                        //         break
                        //     }
                        // }
                        // if (!achouOpenOrder && (minVela == 0 || minVela == 5 || minVela == 4 || minVela == 9)) {
                        //     console.log(`${currentTimehhmmss} || Rompeu 1 Vela -> ${getActiveString(parInt, activesMapString)} - put`);
                        //     notify('Vish', `Rompeu 1 Vela -> ${getActiveString(parInt, activesMapString)} - put`);
                        //     openOrderNextCandle.push({
                        //         par: parInt,
                        //         max,
                        //         min: 0,
                        //         minute: parseInt(currentTimemm) + 5
                        //     })
                        // } else if (!achouOpenOrder) {
                        taxasObj[index].max = 0;
                        direction = 'put';

                        let isStopedPar = false;
                        for (let index = 0; index < stopOrdersPares.length; index++) {
                            const stopOrdersPar = stopOrdersPares[index];
                            if (activeString.includes(stopOrdersPar)) {
                                isStopedPar = true;
                                break;
                            }
                        }

                        let toClose = false;
                        let max;
                        if (toCloseM5Obj.has(activeString)) {
                            if (toCloseM5Obj.get(activeString).max != 0 && open > parseFloat(toCloseM5Obj.get(activeString).max)) {
                                toClose = true;
                                max = toCloseM5Obj.get(activeString).max;
                            }
                        }

                        if (!stopOrders && !isStopedPar && !openedOrders.includes(parInt) && openedOrders.length == 0) {
                            buyBeforOne(direction, parInt, 5);
                            clearSupres(parInt, direction);
                        } else if (toClose) {
                            console.log(`${currentTimehhmmss} || Vela iniciou muito proximo do preço -> ${activeString} - ${direction}`);
                            notify('To Close', `Vela iniciou muito proximo do preço -> ${activeString} - ${direction}`);
                            clearSupres(parInt, direction);
                        } else if (openedOrders.length != 0) {
                            console.log(`${currentTimehhmmss} || Já possui ordens abertas. -> ${activeString} - ${direction}`);
                            notify('OpenedOrder', `Já possui ordens abertas. -> ${activeString} - ${direction}`);
                            clearSupres(parInt, direction);
                        } else {
                            console.log(`${currentTimehhmmss} || Rompeu Noticia -> ${activeString} - ${direction} / stopOrders = ${stopOrders} / isStopedPar = ${isStopedPar}`);
                            notify('Noticia', `Rompeu -> ${activeString} - ${direction} / stopOrders = ${stopOrders} / isStopedPar = ${isStopedPar}`);
                            clearSupres(parInt, direction);
                        }

                        setConfig(element, direction, 5);
                        // }
                    } else if (min != 0 && price <= min) {
                        // let minVela = parseInt(currentTimemm.substring(currentTimemm.length, currentTimemm.length - 1))
                        // let achouOpenOrder = false
                        // for (let index = 0; index < openOrderNextCandle.length; index++) {
                        //     const element = openOrderNextCandle[index];
                        //     if (element.par == parInt) {
                        //         achouOpenOrder = true
                        //         break
                        //     }
                        // }
                        // if (!achouOpenOrder && (minVela == 0 || minVela == 5 || minVela == 4 || minVela == 9)) {
                        //     console.log(`${currentTimehhmmss} || Rompeu 1 Vela -> ${getActiveString(parInt, activesMapString)} - call`);
                        //     notify('Vish', `Rompeu 1 Vela -> ${getActiveString(parInt, activesMapString)} - call`);
                        //     openOrderNextCandle.push({
                        //         par: parInt,
                        //         max: 0,
                        //         min,
                        //         minute: parseInt(currentTimemm) + 5,
                        //     })
                        // } else if (!achouOpenOrder) {
                        taxasObj[index].min = 0;
                        direction = 'call';

                        let isStopedPar = false;
                        for (let index = 0; index < stopOrdersPares.length; index++) {
                            const stopOrdersPar = stopOrdersPares[index];
                            if (activeString.includes(stopOrdersPar)) {
                                isStopedPar = true;
                                break;
                            }
                        }

                        let toClose = false;
                        let min;
                        if (toCloseM5Obj.has(activeString)) {
                            if (toCloseM5Obj.get(activeString).min != 0 && open < parseFloat(toCloseM5Obj.get(activeString).min)) {
                                toClose = true;
                                min = toCloseM5Obj.get(activeString).min;
                            }
                        }
                        if (!stopOrders && !isStopedPar && !openedOrders.includes(parInt) && openedOrders.length == 0) {
                            buyBeforOne(direction, parInt, 5);
                            clearSupres(parInt, direction);
                        } else if (toClose) {
                            console.log(`${currentTimehhmmss} || Vela iniciou muito proximo do preço -> ${activeString} - ${direction}`);
                            notify('To Close', `Vela iniciou muito proximo do preço -> ${activeString} - ${direction}`);
                            clearSupres(parInt, direction);
                        } else if (openedOrders.length != 0) {
                            console.log(`${currentTimehhmmss} || Já possui ordens abertas. -> ${activeString} - ${direction}`);
                            notify('OpenedOrder', `Já possui ordens abertas. -> ${activeString} - ${direction}`);
                            clearSupres(parInt, direction);
                        } else {
                            console.log(`${currentTimehhmmss} || Rompeu Noticia -> ${activeString} - ${direction} / stopOrders = ${stopOrders} / isStopedPar = ${isStopedPar}`);
                            notify('Noticia', `Rompeu -> ${activeString} - ${direction} / stopOrders = ${stopOrders} / isStopedPar = ${isStopedPar}`);
                            clearSupres(parInt, direction);
                        }
                        // }
                        setConfig(element, 'call', 5);
                    }
                    break;
                }

            }

            lastTickCandles.set(thisCandlePar, price);
            // console.log(lastTickCandles);
        }
    } catch (error) {
        console.log(error);
    }
}

function clearSupres(parInt, direction) {
    returnEnter.set(getActiveString(parInt, activesMapString), { direction });

    for (let i = 0; i < pricesToSendObj.length; i++) {
        const pobj = pricesToSendObj[i];
        if (pobj.moeda === getActiveString(parInt, activesMapString)) {
            if (direction == "call") {
                pricesToSendObj[i].taxa.sup = undefined;
                pricesToSendObj[i].taxa.supd = undefined;
            } else {
                pricesToSendObj[i].taxa.res = undefined;
                pricesToSendObj[i].taxa.resd = undefined;
            }
        }
    }
    fs.writeFile('pricesToSend.json', JSON.stringify(pricesToSendObj, null, 4), err => {
    });
}

function noticiasStuff() {
    if (noticiasObj.length > 0) {
        for (let index = 0; index < noticiasObj.length; index++) {
            const noticia = noticiasObj[index];


            let beforeTime = moment(moment().format("YYYY-MM-DD ") + noticia.time).subtract(5, 'minutes');
            let afterTime = moment(moment().format("YYYY-MM-DD ") + noticia.time).add(5, 'minutes');

            // console.log(beforeTime);
            // console.log(afterTime);
            // console.log(moment(moment().format("YYYY-MM-DD ") + currentTimehhmmss))

            let isBettween = moment(moment().format("YYYY-MM-DD ") + currentTimehhmmss).isBetween(beforeTime, afterTime);
            // console.log(isBettween);
            if (isBettween && (noticia.par == 'EUR' || noticia.par == 'USD')) {
                stopOrders = true;
                break;
            } else if (stopOrders && (noticia.par == 'EUR' || noticia.par == 'USD') && moment(moment().format("YYYY-MM-DD ") + currentTimehhmmss).isAfter(afterTime)) {
                console.log(`${currentTimehhmmss} || is after`);
                stopOrders = false;
                noticiasObj.splice(index, 1);
                index--;
            } else if (isBettween && !stopOrdersPares.includes(noticia.par)) {
                console.log('par betwenn');
                stopOrdersPares.push(noticia.par);
            } else if (stopOrdersPares.includes(noticia.par) && moment(moment().format("YYYY-MM-DD ") + currentTimehhmmss).isAfter(afterTime)) {
                console.log('par end');
                let indexx = stopOrdersPares.indexOf(noticia.par);
                stopOrdersPares.splice(indexx, 1);
                noticiasObj.splice(index, 1);
                index--;
            }
        }
    }
}

function heartbeat(message) {
    currentTime = message.msg;
    currentTimehhmm = moment.unix(currentTime / 1000).utcOffset(-3).format("HH:mm");
    currentTimemm = moment.unix(currentTime / 1000).utcOffset(-3).format("mm");
    currentTimemmssDate = moment.unix(currentTime / 1000).utcOffset(-3).format("YYYY-MM-DD HH:mm:ss");
    currentTimehhmmss = moment.unix(currentTime / 1000).utcOffset(-3).format("HH:mm:ss");
    currentTimess = moment.unix(currentTime / 1000).utcOffset(-3).format("ss");
}

function errorDigital(message, e) {
    totalOrderss--;
    const active = parseInt(message.request_id);
    let index = openedOrders.indexOf(parseInt(active));
    openedOrders.splice(index, 1);
    buysCount.set(parseInt(active), buysCount.get(parseInt(active)) - 1);
    console.log(`${currentTimehhmmss} || Erro ao comprar -> ${getActiveString(`${active}`, activesMapString)}`.red);
    console.log('RES = ' + e.data);
    notify('Error', `Erro ao comprar -> ${getActiveString(`${active}`, activesMapString)}`);
    if (soros)
        positionOpenedSoros = false;
    if (gale)
        positionOpenedGale = false;
    buysss = [];
}

function errorOption(message, e) {
    totalOrderss--;
    const active = parseInt(message.request_id);
    let index = openedOrders.indexOf(parseInt(active));
    openedOrders.splice(index, 1);
    buysCount.set(parseInt(active), buysCount.get(parseInt(active)) - 1);
    console.log(`${currentTimehhmmss} || Erro ao comprar -> ${getActiveString(`${active}`, activesMapString)}`.red);
    console.log('RES = ' + e.data);
    notify('Error', `Erro ao comprar -> ${getActiveString(`${active}`, activesMapString)}`);
    if (soros)
        positionOpenedSoros = false;
    if (gale)
        positionOpenedGale = false;
    buysss = [];
}

function getBreakaa(price, index, parInt, breakaa) {
    if (openOrderNextCandle.length > 0) {
        for (let indexs = 0; indexs < openOrderNextCandle.length; indexs++) {
            const element = openOrderNextCandle[indexs];
            // console.log(currentTimemm);
            // console.log(element.minute);
            if (element.max != 0 && parseInt(currentTimemm) >= element.minute && price >= element.max) {
                taxasObj[index].max = 0;
                buyBefor('put', parInt, 5);
                openOrderNextCandle.splice(indexs, 1);
                indexs--;
                breakaa = true;
                setConfig(element, 'put', 5);

            } else if (element.min != 0 && parseInt(currentTimemm) >= element.minute && price <= element.min) {
                taxasObj[index].min = 0;
                buyBefor('call', parInt, 5);
                openOrderNextCandle.splice(indexs, 1);
                indexs--;
                breakaa = true;
                setConfig(element, 'call', 5);

            } else if (element.min != 0 && parseInt(currentTimemm) >= element.minute) {
                taxasObj[index].min = 0;
                openOrderNextCandle.splice(indexs, 1);
                indexs--;
                breakaa = true;
                setConfig(element, 'call', 5);

            } else if (element.max != 0 && parseInt(currentTimemm) >= element.minute) {
                taxasObj[index].max = 0;
                openOrderNextCandle.splice(indexs, 1);
                indexs--;
                breakaa = true;
                setConfig(element, 'put', 5);

            }
            break;
        }
    }
    return breakaa;
}

function setConfig(element, direction, m) {
    let fsConfig = fs.readFileSync('config.json');
    let config = JSON.parse(fsConfig);
    let m5taxas
    if (m == 5) {
        m5taxas = config.taxasM5;
    } else {
        m5taxas = config.taxasM15
    }
    let m5taxasSplited = m5taxas.split(';');
    let m5taxasSplitedAux = "";
    for (let index = 0; index < m5taxasSplited.length; index++) {
        const taxa = m5taxasSplited[index];
        if (!taxa.includes(direction.toUpperCase()) || !taxa.includes(element.par)) {
            m5taxasSplitedAux += taxa + ';'
        }
    }

    if (m == 5) {
        config.taxasM5 = m5taxasSplitedAux;
    } else {
        config.taxasM15 = m5taxasSplitedAux;
    }


    for (const [key, value] of Object.entries(taxasjson)) {

        // console.log(`${key}: ${value}`);
        let directiona = key.split('-')[1]
        let moeda = key.split('-')[0]

        if (moeda == element.par && directiona == direction.substring(0, 1).toUpperCase()) {
            taxasjson[key] = ''
        }
    }
    fs.writeFile('taxas.json', JSON.stringify(taxasjson, null, 4), err => {
        // console.log(err || 'Arquivo salvo');
    });


    fs.writeFile('config.json', JSON.stringify(config, null, 4), err => {
        // console.log(err || 'Arquivo salvo');
    });
}

function buyBeforOne(direction, parInt, type) {
    let timeFrameL = null
    let timeFrame = type

    // console.log(direction);
    // console.log(parInt);
    // console.log(type);
    let timeInt = parseInt(currentTimehhmm.substring(currentTimehhmm.length - 2, currentTimehhmm.length));

    // parseInt(currentTimess) >= 30 

    if (type == 1) {
        timeFrameL = 1

    } else {
        let resto = timeInt % timeFrame;
        timeFrameL = timeFrame
        if (resto != 0) {
            timeFrameL = timeFrameL - resto;
        }

    }

    let hourmm
    if (type == 1) {
        if (parseInt(currentTimess) >= 30) {
            hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'm').format(" HH:mm");
        } else {
            hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(1, 'm').format(" HH:mm");
        }
    } else if (type == 5) {
        if (parseInt(currentTimess) >= 30 && (timeInt == 4 || timeInt == 9)) {
            hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').add(6, 'm').format("HH:mm");
        } else {
            hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').add(timeFrameL, 'm').format("HH:mm");
        }
    } else {
        hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').add(15, 'm').format(" HH:mm");
    }
    checkOpenedPayoutBeforeBuy(parInt, direction, hourmm, type);
}

function buyBefor(direction, parInt, type) {
    let timeFrameL
    let timeFrame = 5

    if (type != 5) {
        if (parseInt(currentTimemm) <= 15) {
            timeFrame = 15 - parseInt(currentTimemm);
        } else if (parseInt(currentTimemm) > 15 && parseInt(currentTimemm) <= 30) {
            timeFrame = 30 - parseInt(currentTimemm);
        } else if (parseInt(currentTimemm) > 30 && parseInt(currentTimemm) <= 45) {
            timeFrame = 45 - parseInt(currentTimemm);
        } else if (parseInt(currentTimemm) > 45) {
            timeFrame = 60 - parseInt(currentTimemm);
        }
    } else {

        let timeInt = parseInt(currentTimehhmm.substring(currentTimehhmm.length - 2, currentTimehhmm.length));

        let resto = timeInt % timeFrame;
        timeFrameL = timeFrame
        if (resto != 0) {
            timeFrameL = timeFrameL - resto;
        }
    }

    let hourmm
    if (type == 5 && timeFrameL >= 3) {
        hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(timeFrameL, 'm').format(" HH:mm");
    } else if (type != 5) {
        hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(timeFrame, 'm').format(" HH:mm");
    } else {
        console.log(`${currentTimehhmmss} || Operação cancelada tempo < 3 min para retração -> ${getActiveString(parInt, activesMapString)}`);
        notify('[Order cancelada]', `tempo < 3 min para retração -> ${getActiveString(parInt, activesMapString)}`);
        return
    }

    if (type == 15 && timeFrame > 2) {
        console.log(`${currentTimehhmmss} || ${direction} / ${getActiveString(parInt, activesMapString)} / ${amount}`);
        notify('[Order]', `${direction} / ${getActiveString(parInt, activesMapString)} / ${amount}`);
        buy(amount, parInt, direction, parseInt(moment(moment().format("YYYY-MM-DD ") + hourmm).utcOffset(0).format('X')), type == 5 ? 3 : 'PT15M');
        totalOrderss++
        openedOrders.push(parInt)
        m15Expires.push(parseInt(moment(moment().format("YYYY-MM-DD ") + hourmm).utcOffset(0).format('X')))
    } else if (type == 5) {
        checkOpenedPayoutBeforeBuy(parInt, direction, hourmm);
    } else {
        console.log(`${currentTimehhmmss} || Ordem não aberta - tempo <= 2 - ${direction} / ${getActiveString(parInt, activesMapString)} / ${amount}`);
        notify('[Order]', `Ordem não aberta - tempo <= 2 - ${direction} / ${getActiveString(parInt, activesMapString)} / ${amount}`);
    }

}

let notOrder = []

function checkOpenedPayoutBeforeBuy(parInt, direction, hourmm, type) {

    if (activesDigitalMapString.has(getActiveString(parInt, activesMapString))) {
        openOrderDigital(direction, parInt, hourmm, type);
    } else {
        console.log('openOrderBinary');
        openOrderBinary(direction, parInt, hourmm);
    }
}

function openOrderBinary(direction, parInt, hourmm) {
    console.log('aaaaaaaaa');
    console.log(`${currentTimehhmmss} || ${direction} / ${getActiveString(parInt, activesMapString)} / ${amount}`);
    notify('[Order Binaria]', `${direction} / ${getActiveString(parInt, activesMapString)} / ${amount}`);
    buy(amount, parInt, direction, parseInt(moment(moment().format("YYYY-MM-DD ") + hourmm).utcOffset(0).format('X')), 3);
    totalOrderss++;
    openedOrders.push(parInt);
}

function openOrderDigital(direction, parInt, hourmm, type) {
    console.log(`${currentTimehhmmss} || ${direction} / ${getActiveString(parInt, activesMapString)} / ${amount} / Digital`);
    notify('[Order Digital]', `${direction} / ${getActiveString(parInt, activesMapString)} / ${amount}`);
    buy(amount, parInt, direction, parseInt(moment(moment().format("YYYY-MM-DD ") + hourmm).utcOffset(0).format('X')), 'PT' + type + 'M');
    totalOrderss++;
    openedOrders.push(parInt);
}

function getCandleTime(active_id, time, count) {
    let data = {
        "name": "get-candles",
        "version": "2.0",
        "body": {
            "active_id": active_id,
            "size": 60 * time,
            "to": currentTime,
            "count": count,
        }
    };
    if (ws.readyState === WebSocket.OPEN) {
        // console.log(JSON.stringify(messageHeader(data, 'sendMessage', active_id + '/' + time)));
        ws.send(JSON.stringify(messageHeader(data, 'sendMessage', active_id + '/' + time)));
    }
}

function getCandle(active_id, time) {
    let data = {
        "name": "get-candles",
        "version": "2.0",
        "body": {
            "active_id": active_id,
            "size": 60 * 5,
            "to": currentTime,
            "count": 2,
        }
    };
    if (ws.readyState === WebSocket.OPEN) {
        // console.log(JSON.stringify(messageHeader(data, 'sendMessage', active_id + '/' + time)));
        ws.send(JSON.stringify(messageHeader(data, 'sendMessage', active_id + '/' + time)));
    }
}

let galePut = []
let galecCall = []

function optionClosed(message) {
    console.log('=====================');
    let amounth = buysss[0] && buysss[0].amount ? buysss[0].amount : amount
    let active = message.msg.active_id
    let direction = message.msg.direction

    if (openedOrders.includes(active)) {
        let index = openedOrders.indexOf(parseInt(active))
        openedOrders.splice(index, 1)
    }
    profitAmount = message.msg.result == 'win' ? message.msg.profit_amount - message.msg.amount : message.msg.amount * -1
    sessionBalance += profitAmount

    if (profitAmount < 0) {

        // if (config.conta == "real")
        veefe += "L"
        losss++
        diffwinloss--
        console.log('winss=', winss)
        console.log('losss=', losss)
        console.log('diffwinloss=', diffwinloss)
        lossMass('L');
        console.log(`${currentTimehhmmss} || ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`.red)
        notify('Loss', `${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`);


        // console.log(`${currentTimehhmmss} || StopLoss = ${StopLoss}`)
        // buyBefor('put', 1, 1)

        positionOpenedSoros = false
    } else if (profitAmount == 0) {
        console.log(`${currentTimehhmmss} || ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`.red)
        notify('Empate', `Empate ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`);
    } else {
        winss++
        // winMass();
        // if (config.conta == "real")
        veefe += "W"
        diffwinloss++
        console.log('winss=', winss)
        console.log('losss=', losss)
        console.log('diffwinloss=', diffwinloss)
        winMass()
        // StopWin++
        // console.log(`${currentTimehhmmss} || StopWin = ${StopWin}`)
        console.log(`${currentTimehhmmss} || ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`.green)
        notify('Wiiin!!', `${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`);

        positionOpenedSoros = false
    }
}

function setWinss(amount) {
    let fsConfig = fs.readFileSync('config.json');
    let config = JSON.parse(fsConfig);
    let StopWin = parseInt(config.StopWin) + 1;
    config.StopWin = StopWin;
    config.amount = amount
    fs.writeFile('config.json', JSON.stringify(config, null, 4), err => {
    });
}


let diffwinloss = 0
function positionChangedStuff(message) {
    // if (!orderopenned.includes(message.msg.raw_event.instrument_id))
    // orderopenned.push(message.msg.raw_event.instrument_id)

    // console.log(JSON.stringify(message));
    //console.log('aaaaaa');
    if (message.msg.status == 'closed') {
        console.log('=====================');
        let id = message.msg.id
        let direction = message.msg.raw_event.instrument_dir
        buysCount.set(message.msg.active_id, buysCount.get(message.msg.active_id) - 1)
        idsArray.push(id)

        // console.log(message);

        if (gale)
            positionOpenedGale = false

        let profitAmount = message.msg.close_profit ? message.msg.close_profit - amount : amount * -1
        let active = message.msg.active_id

        // console.log('profitAmount', profitAmount);

        if (openedOrders.includes(active)) {
            let index = openedOrders.indexOf(parseInt(active))
            openedOrders.splice(index, 1);
        }
        sessionBalance += profitAmount
        cicleSession += profitAmount


        if (profitAmount < 0) {


            // if (config.conta == "real")
            veefe += "L"
            losss++
            diffwinloss--
            console.log('winss=', winss)
            console.log('losss=', losss)
            console.log('diffwinloss=', diffwinloss)
            lossMass('L');
            console.log(`${currentTimehhmmss} || ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`.red)
            notify('Loss', `${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`);


            // console.log(`${currentTimehhmmss} || StopLoss = ${StopLoss}`)
            // buyBefor('put', 1, 1)

            positionOpenedSoros = false
        } else if (profitAmount == 0) {
            console.log(`${currentTimehhmmss} || ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`.red)
            notify('Empate', `Empate ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`);
        } else {
            winss++
            // winMass();
            // if (config.conta == "real")
            veefe += "W"
            diffwinloss++
            console.log('winss=', winss)
            console.log('losss=', losss)
            console.log('diffwinloss=', diffwinloss)
            winMass()
            // StopWin++
            // console.log(`${currentTimehhmmss} || StopWin = ${StopWin}`)
            console.log(`${currentTimehhmmss} || ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`.green)
            notify('Wiiin!!', `${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`);

            positionOpenedSoros = false
        }

        // if (!positionOpenedSoros)
        //  buyBefor('put', 76, 1)

    }
}

let cicleSession = 0

function lossMass(winloss) {
    modifyCell('C' + countMass, winloss);
    XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
    countMass++;
    amount = parseFloat(getCell('D' + countMass)) > 0 ? parseFloat(getCell('D' + countMass)) : parseFloat(getCell('D' + countMass)) * -1;
    console.log(amount);

    console.log(veefe);
    config.veefe = veefe
    fs.writeFile('config.json', JSON.stringify(config, null, 4), err => {
        // console.log(err || 'Arquivo salvo');
        setTimeout(() => {

            if (diffwinloss >= 3) {
                notify('Stop', `Stop Loss Alcançado...`);
                console.log('Stop Loss Alcançado...')
                process.exit(1)
            }
        }, 3000);
    });


}

async function winMass() {
    modifyCell('C' + countMass, 'W');
    await XLSX_CALC(workbook, { continue_after_error: true, log_error: false });

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

        modifyCell('N' + 12, getCell('F' + countMass));
        await XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
        cicleSession = 0;
        countMass = 3;
        if (config.conta)
            veefe = ""
        amount = parseFloat(getCell('D' + countMass)) > 0 ? parseFloat(getCell('D' + countMass)) : parseFloat(getCell('D' + countMass)) * -1;
        console.log(`${currentTimehhmmss} || Ciclo com Ganhoo!! `.green)
    } else {
        countMass++;
        amount = parseFloat(getCell('D' + countMass)) > 0 ? parseFloat(getCell('D' + countMass)) : parseFloat(getCell('D' + countMass)) * -1;
    }

    config.veefe = veefe
    console.log(veefe);
    config.lastAmount = parseFloat(getCell('N12'))
    fs.writeFile('config.json', JSON.stringify(config, null, 4), err => {
        // console.log(err || 'Arquivo salvo');
        if (diffwinloss >= 3) {
            notify('Stop', `Stop WIN Alcançado...`);
            console.log('Stop WIN Alcançado...')
            process.exit(1)
        }
    });


    console.log(amount);

}

function profileStuf(message, name) {
    const balances = message.msg.balances
    for (let index = 0; index < balances.length; index++) {
        const element = balances[index]
        if (config.conta == 'demo') {
            if (element.type == 4) {
                message.msg.balance_id = element.id
            }
        }
        else if (config.conta == 'real') {
            if (element.type == 1) {
                message.msg.balance_id = element.id
            }
        }
    }
    userBalanceId = message.msg.balance_id

    subscribePortifolio()
    getCandle()

    if (!getLeadersBool) {
        getLeadersBool = true
        getLeaders(ws)
    }

    subs(name, 'subscribeMessage')

}

setInterval(() => {
    if (payout && binarias && ws.readyState === WebSocket.OPEN)
        ws.send(JSON.stringify({ "name": "api_option_init_all", "msg": "", "request_id": "" }))
}, 5000)

function subs(name, subsType) {
    if (binarias) {
        if (payout)
            ws.send(JSON.stringify({ "name": "api_option_init_all", "msg": "", "request_id": "" }))
        for (let i = 0; i < otcActives.length; i++) {
            subscribeLiveDeal(name, otcActives[i], 'turbo', null, subsType)
        }

        if (binariasTimes.includes("M5+"))
            for (let i = 0; i < otcActives.length; i++) {
                subscribeLiveDeal(name, otcActives[i], 'binary', null, subsType)
            }
    }
    if (digital) {
        name = 'live-deal-digital-option'
        if (digitalTimes.includes("M1"))
            for (let i = 0; i < otcActivesDigital.length; i++) {
                subscribeLiveDeal(name, otcActivesDigital[i], 'digital', '1', subsType)
                if (payout)
                    ws.send(JSON.stringify({ "name": "subscribeMessage", "msg": { "name": "instrument-quotes-generated", "params": { "routingFilters": { "active": otcActivesDigital[i], "expiration_period": 60, "kind": "digital-option" } }, "version": "1.0" }, "request_id": "" }))
            }
        if (digitalTimes.includes("M5"))
            for (let i = 0; i < otcActivesDigital.length; i++) {
                subscribeLiveDeal(name, otcActivesDigital[i], 'digital', '5', subsType)
                if (payout)
                    ws.send(JSON.stringify({ "name": "subscribeMessage", "msg": { "name": "instrument-quotes-generated", "params": { "routingFilters": { "active": otcActivesDigital[i], "expiration_period": 300, "kind": "digital-option" } }, "version": "1.0" }, "request_id": "" }))
            }

        if (digitalTimes.includes("M15"))
            for (let i = 0; i < otcActivesDigital.length; i++) {
                subscribeLiveDeal(name, otcActivesDigital[i], 'digital', '15', subsType)
                if (payout)
                    ws.send(JSON.stringify({ "name": "subscribeMessage", "msg": { "name": "instrument-quotes-generated", "params": { "routingFilters": { "active": otcActivesDigital[i], "expiration_period": 900, "kind": "digital-option" } }, "version": "1.0" }, "request_id": "" }))
            }
    }

    if (binarias) {
        name = 'live-deal-binary-option-placed'
        for (let i = 0; i < activesMap.length; i++) {
            subscribeLiveDeal(name, activesMap[i], 'turbo', null, subsType)
        }
        if (binariasTimes.includes("M5+"))
            for (let i = 0; i < activesMap.length; i++) {
                subscribeLiveDeal(name, activesMap[i], 'binary', null, subsType)
            }
    }
    if (digital) {
        name = 'live-deal-digital-option'
        ws.send(JSON.stringify({ "name": "subscribeMessage", "msg": { "name": "instrument-quotes-generated", "params": { "routingFilters": { "active": 1, "expiration_period": 60, "kind": "digital-option" } }, "version": "1.0" }, "request_id": "" }))
        if (digitalTimes.includes("M1"))
            for (let i = 0; i < activesMapDigital.length; i++) {
                subscribeLiveDeal(name, activesMapDigital[i], 'digital', '1', subsType)
                if (payout)
                    ws.send(JSON.stringify({ "name": "subscribeMessage", "msg": { "name": "instrument-quotes-generated", "params": { "routingFilters": { "active": otcActivesDigital[i], "expiration_period": 60, "kind": "digital-option" } }, "version": "1.0" }, "request_id": "" }))
            }

        if (digitalTimes.includes("M5"))
            for (let i = 0; i < activesMapDigital.length; i++) {
                subscribeLiveDeal(name, activesMapDigital[i], 'digital', '5', subsType)
                if (payout)
                    ws.send(JSON.stringify({ "name": "subscribeMessage", "msg": { "name": "instrument-quotes-generated", "params": { "routingFilters": { "active": otcActivesDigital[i], "expiration_period": 300, "kind": "digital-option" } }, "version": "1.0" }, "request_id": "" }))
            }

        if (digitalTimes.includes("M15"))
            for (let i = 0; i < activesMapDigital.length; i++) {
                subscribeLiveDeal(name, activesMapDigital[i], 'digital', '15', subsType)
                if (payout)
                    ws.send(JSON.stringify({ "name": "subscribeMessage", "msg": { "name": "instrument-quotes-generated", "params": { "routingFilters": { "active": otcActivesDigital[i], "expiration_period": 900, "kind": "digital-option" } }, "version": "1.0" }, "request_id": "" }))
            }
    }
}

function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return {
        minutes,
        seconds: parseInt((seconds < 10 ? '0' : '') + seconds)
    }
}


let ws = new WebSocket(url)
// ws.onopen = onOpen
// ws.onerror = onError
// ws.onmessage = onMessage

const activesMap = [108, 7, 943, 101, 7, 943, 101, 944, 99, 107, 2, 4, 1, 104, 102, 103, 3, 947, 5, 8, 100, 72, 6, 168, 105, 212]
const activesMapDigital = [7, 943, 7, 943, 101, 944, 99, 107, 2, 4, 1, 104, 102, 103, 3, 947, 5, 8, 100, 72, 6, 168, 105]
const otcActives = [76, 77, 78, 79, 80, 81, 84, 85, 86]
const otcActivesDigital = [76, 77, 78, 79, 80, 81, 84, 85, 86]
const payoutActives = [108, 7, 943, 101, 7, 943, 101, 944, 99, 107, 2, 4, 1, 104, 102, 103, 3, 947, 5, 8, 100, 72, 6, 168, 105, 212, 76, 77, 78, 79, 80, 81, 84, 85, 86]

const activesMapString = new Map([
    ['AUDCAD', 7],
    ['CHFJPY', 106],
    ['EURAUD', 108],
    ['EURCHF', 946],
    ['EURCAD', 105],
    ['EURNZD', 212],
    ['AUDCHF', 943],
    ['AUDJPY', 101],
    ['AUDNZD', 944],
    ['AUDUSD', 99],
    ['CADCHF', 107],
    ['EURGBP', 2],
    ['EURJPY', 4],
    ['EURUSD', 1],
    ['GBPAUD', 104],
    ['CADJPY', 945],
    ['GBPCAD', 102],
    ['GBPCHF', 103],
    ['GBPJPY', 3],
    ['GBPNZD', 947],
    ['GBPUSD', 5],
    ['NZDUSD', 8],
    ['USDCAD', 100],
    ['USDCHF', 72],
    ['USDJPY', 6],
    ['USDNOK', 168],
    ['EURUSD-OTC', 76],
    ['EURGBP-OTC', 77],
    ['USDCHF-OTC', 78],
    ['EURJPY-OTC', 79],
    ['NZDUSD-OTC', 80],
    ['GBPUSD-OTC', 81],
    ['GBPJPY-OTC', 84],
    ['USDJPY-OTC', 85],
    ['AUDCAD-OTC', 86]
])
const activesDigitalMapString = new Map([
    ['AUDCAD', 7],
    ['CHFJPY', 106],
    ['EURAUD', 108],
    ['EURCHF', 946],
    ['EURCAD', 105],
    ['EURNZD', 212],
    ['AUDCHF', 943],
    ['AUDJPY', 101],
    ['AUDNZD', 944],
    ['AUDUSD', 99],
    ['CADCHF', 107],
    ['EURGBP', 2],
    ['EURJPY', 4],
    ['EURUSD', 1],
    ['GBPAUD', 104],
    ['CADJPY', 945],
    ['GBPCAD', 102],
    ['GBPCHF', 103],
    ['GBPJPY', 3],
    ['GBPNZD', 947],
    ['GBPUSD', 5],
    ['NZDUSD', 8],
    ['USDCAD', 100],
    ['USDCHF', 72],
    ['USDNOK', 168],
    ['EURUSD-OTC', 76],
    ['EURGBP-OTC', 77],
    ['USDCHF-OTC', 78],
    ['EURJPY-OTC', 79],
    ['NZDUSD-OTC', 80],
    ['GBPUSD-OTC', 81],
    ['GBPJPY-OTC', 84],
    ['USDJPY-OTC', 85],
    ['AUDCAD-OTC', 86]
])

const loginAsync = async (ssid) => {
    await doLogin(ssid)
}

const doLogin = ssid => {
    return new Promise((resolve, reject) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            if (log)
                console.log(JSON.stringify({ 'name': 'ssid', 'msg': ssid, "request_id": "" }))
            ws.send(JSON.stringify({ 'name': 'ssid', 'msg': ssid, "request_id": "" }))
            logged = true
        } else if (ws) {
            ws.terminate()
            ws = new WebSocket(url)
            ws.onopen = onOpen
            ws.onerror = onError
            ws.onmessage = onMessage
        }
        resolve()
    })
}

// const doLogin = (ssid) => {
//     return new Promise((resolve, reject) => {
//         if (ws.readyState === WebSocket.OPEN) {

//         } else {
//             console.log('Ws not ready..');
//         }
//         resolve()
//     })
// }

const auth = () => {
    ws = new WebSocket(url)
    ws.onopen = onOpen
    ws.onerror = onError
    ws.onmessage = onMessage
    axios.post('https://auth.iqoption.com/api/v2/login', {
        identifier: "davilagustavo996@gmail.com",
        password: "Ana12boeno#",
    }).then((response) => {
        ssid = response.data.ssid
        const loginn = setInterval(() => {
            if (logged) {
                clearInterval(loginn)
            }
            loginAsync(ssid)
        }, 500);
    }).catch(function (err) {
        if (err)
            console.log('Erro ao se conectar... Tente novamente')
    })
}

const start = (force) => {
    if (!ssid || force) {
        const customHeaders = {
            'Sec-Ch-Ua': '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36', // You can adjust the content type based on your needs
            // Add more headers if necessary
        };
        axios.post('https://api.trade.xoption.com/v2/login', {
            // axios.post('https://auth.iqoption.com/api/v2/login', {
            // identifier: "davilagustavo996@gmail.com",
            // password: "Ana12boeno#",
            identifier: "vinipsidonik@hotmail.com",
            password: "gc8966426",

        }, {
            headers: customHeaders
        }).then((response) => {
            ssid = response.data.ssid
            console.log(ssid);
            ws.onopen = onOpen
            ws.onerror = onError
            ws.onmessage = onMessage
            const loginn = setInterval(() => {
                if (logged) {
                    clearInterval(loginn)
                }
                loginAsync(ssid)
            }, 500);
            config.ssid = ssid
            fs.writeFile('config.json', JSON.stringify(config, null, 4), err => {
                // console.log(err || 'Arquivo salvo');
            });

        }).catch(function (err) {
            if (err)
                console.log('Erro ao se conectar... Tente novamente')
        })
    } else {
        console.log("ssid=", ssid);
        ws.onopen = onOpen
        ws.onerror = onError
        ws.onmessage = onMessage
        const loginn = setInterval(() => {
            if (logged) {
                clearInterval(loginn)
            }
            loginAsync(ssid)
        }, 5000);
    }
}
start(false)

let logged = false

// axios.post('https://auth.iqoption.com/api/v2/login', {
//     identifier: "davilagustavo996@gmail.com",
//     password: "Ana12boeno#",
//     // identifier: "carol.davila14@outlook.com",
//     // password: "gc896426",
// }).then((response) => {
//     ssid = response.data.ssid
//     console.log(ssid);
//     ws.onopen = onOpen
//     ws.onerror = onError
//     ws.onmessage = onMessage
//     const loginn = setInterval(() => {
//         if (logged) {
//             clearInterval(loginn)
//         }
//         loginAsync(ssid)
//     }, 500);
// }).catch(function (err) {
//     if (err)
//         console.log('Erro ao se conectar... Tente novamente')
// })

function subscribePortifolio() {
    let data = { "name": "portfolio.position-changed", "version": "2.0", "params": { "routingFilters": { "instrument_type": "digital-option", "user_balance_id": userBalanceId } } }

    ws.send(JSON.stringify(messageHeader(data, 'subscribeMessage')))

}