
const fs = require('fs')
const axios = require('axios')
const moment = require('moment')
const momentTz = require('moment-timezone');
const countries = require('./country')
const WebSocket = require('ws')
const colors = require('colors')

let fsConfig = fs.readFileSync('config.json')
let config = JSON.parse(fsConfig)
let openedMap = new Map()
let openedMapDigital = new Map()

//55099058
const url = 'wss://ws.trade.exnova.com/echo/websocket'
let userBalanceId = 0
let userBalanceIdGustavo = 0
let userBalanceReal = 0
let userBalanceRealGustavo = 0
let amount = config.amount
let amountGustavo = config.amountGustavo
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
let timeFramer = config.timeFrame
let cincoum = config.cincoum

let ssid
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

let buyssTimess = []
let buyssTimessBinary = []

// Tail = require('tail').Tail;

// tail = new Tail("C:/Users/vinícios.psidonik/AppData/Roaming/MetaQuotes/Terminal/287469DEA9630EA94D0715D755974F1B/MQL4/Files/" + moment().format("YYYYMMDD") + "_retorno.csv", "\n", {}, true);

// tail.on("line", function (data) {
//     let dataSplited = data.split(",")

//     let parInt = activesMapString.get(dataSplited[1])

//     let achouu = false
//     for (let index = 0; index < checkCandle.length; index++) {
//         const element = checkCandle[index];
//         if (element.parInt == parInt) {
//             achouu = true
//             break
//         }
//     }

//     if (!achouu && !openedOrders.includes(parInt)) {
//         // console.log(`${currentTimehhmmss} || GATILHO / ${dataSplited[2]} / ${getActiveString(parInt, activesMapString)}`);
//         // notify('[GATILHO]', `${dataSplited[2]} / ${getActiveString(parInt, activesMapString)}`);

//         let isStopedPar = false
//         for (let index = 0; index < stopOrdersPares.length; index++) {
//             const stopOrdersPar = stopOrdersPares[index];
//             if (getActiveString(element.parInt, activesMapString).includes(stopOrdersPar)) {
//                 isStopedPar = true
//                 break
//             }
//         }
//         if (!stopOrders && !isStopedPar && (!doispraum || doispraum && openedOrders.length == 0)) {
//             // setTimeout(() => {
//             openedOrders.push(parInt)
//             buyBefor(dataSplited[2], parInt, dataSplited[3])
//             // }, 500);
//         }
//     } else {
//         console.log(`${currentTimehhmmss} || ${dataSplited}`);
//     }
// });

setInterval(() => {
    if (openedOrders.length > 0) {
        for (let index = 0; index < openedOrders.length; index++) {
            const element = openedOrders[index];
            // getCandle(element, 1)
        }
    }
}, 500);

// tail.on("error", function (error) {
//     console.log('ERROR: ', error);
// });

let checkCandle = []
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
        axios.get(`http://localhost:3001/payout/${type}`).then((res) => {
            return resolve(res.data)
        }).catch((err) => {
            return resolve(0)
        })
    })
}

const getOpened = () => {
    return new Promise((resolve, reject) => {
        axios.get(`http://localhost:3001/opened/turbo`).then((res) => {
            return resolve(res.data)
        }).catch((err) => {
            // console.log('getOpened');
            // console.log(err);
            return resolve([[]])
        })
    })
}

const getOpenedDigital = () => {
    return new Promise((resolve, reject) => {
        axios.get(`http://localhost:3001/opened/digital`).then((res) => {
            return resolve(res.data)
        }).catch((err) => {
            // console.log('getOpenedDigital');
            // console.log(err);
            return resolve([[]])
        })
    })
}

setInterval(async () => {
    // intervalGetPayout()
    // openedMap = new Map(await getOpened())
    // openedMapDigital = new Map(await getOpenedDigital())
    // console.log(openedMap);
    // console.log(openedMapDigital)
}, 10000);

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

    // console.log(payoutMap);
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

    console.log('Here = ' + data);

    console.log(JSON.stringify(data))
    ws.send(JSON.stringify(data))
}

let getLeadersBool = !!topTradersRange || copyIds.length > 0 ? false : true

let taxasObj = []
let taxasObj15 = []


let toCloseM15Obj = new Map()
let toClose15Array = toCloseM15.split(';')
for (let index = 0; index < toClose15Array.length; index++) {
    const close = toClose15Array[index].split(',');
    toCloseM15Obj.set(close[0], {
        max: close[1],
        min: close[2]
    })
}

let toCloseM5Obj = new Map()
let toClose5Array = toCloseM5.split(';')
for (let index = 0; index < toClose5Array.length; index++) {
    const close = toClose5Array[index].split(',');
    toCloseM5Obj.set(close[0], {
        max: close[1],
        min: close[2]
    })
}


let taxasArray = taxasM5.split(';')
for (let index = 0; index < taxasArray.length; index++) {
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
console.log(taxasObj);

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

console.log(taxasObj15);

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

const showRunningActives = setInterval(() => {
    let fsConfig = fs.readFileSync('config.json')
    let config = JSON.parse(fsConfig)
    log = config.log
    logg = config.logg
    loggg = config.loggg
    valorMinimo = config.valorMinimo
    country = config.filtroPorPais
    topTradersRange = config.topTradersRange
    soros = config.soros
    gale = config.gale
    galeLevel = config.galeLevel
    galeFactor = config.galeFactor
    StopLoss = config.StopLoss
    StopWin = config.StopWin
    copy100Ids = config.copy100Ids
    copyBestIdsRange = config.copyBestIdsRange
    tradesPerActive = config.tradesPerActive
    bestIdsLog = config.bestIdsLog
    invertTrades = config.invertTrades
    verpar = config.verpar
    binarias = config.binarias
    binariasTimes = config.binariasTimes
    digital = config.digital
    digitalTimes = config.digitalTimes
    delaySeconds = config.delaySeconds ? config.delaySeconds : 1
    showSchedules = config.showSchedules
    taxas = config.taxas

    if (config.cleanUp) {
        runningActives = []
        runningActivesBinary = []
        runningActivesDigital = []
        runningActivesDigitalFive = []
        auth()
        if (soros)
            positionOpenedSoros = false
        if (gale)
            positionOpenedGale = false
    }

    if (config.showSchedules) {
        console.log(schedules);
    }

    if (config.loggg) {
        console.log('Turbo: ' + runningActives.length)
        console.log('Binary: ' + runningActivesBinary.length)
        console.log('Digital: ' + runningActivesDigital.length)
        console.log('DigitalFive: ' + runningActivesDigitalFive.length)
        console.log(`copyIds:  ${copyIds.length > 0 ? copyIds.length : 0}`)
        console.log(`leadersArray:  ${!!leadersArray ? leadersArray.length : 0}`)
        console.log(`positionOpenedSoros: ${positionOpenedSoros}`);
        console.log(`positionOpenedGale: ${positionOpenedGale}`);
        console.log('===================')
    }

    if (bestIdsLog) {
        console.log(copyIds);
    }

}, 5000)

setInterval(() => {
    // await subs('live-deal-binary-option-placed' , 'unsubscribeMessage')
    // console.log('unsubscribeMessage');
    if (!soros && !gale) {
        runningActives = []
        runningActivesBinary = []
        runningActivesDigital = []
        runningActivesDigitalFive = []
        // auth()
        if (soros)
            positionOpenedSoros = false
        if (gale)
            positionOpenedGale = false
    }
}, 300000);

const getActiveString = (active, map) => {
    for (var [key, value] of map) {
        if (value == active) {
            return key
        }
    }
}

let cleanned = false

const b = async () => {
    if (!!topTradersRange || copyIds.length > 0) {

        let fsConfig = fs.readFileSync('config.json')
        let config = JSON.parse(fsConfig)
        copyIds = !isNaN(config.copyIds.split(',')[0]) && !isNaN(config.copyIds.split(',')[1]) ? config.copyIds.split(',') : []

        cleanned = true

        leadersArray = []
        getLeadersBool = false
    }
}

setInterval(() => {
    b()
}, 240000)//60000

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
let currentTimess

let connectedd = false
let connecteddGustavo = false

let orderIdsss = []

let couu = 0
const onMessage = e => {
    // if (ws.readyState === WebSocket.OPEN) {
    const message = JSON.parse(e.data)

    // console.log('RES = ' + e.data);
    if (message.name == 'instrument-quotes-generated') {
    }

    if (message.name != 'instrument-quotes-generated' && message.name != 'api_option_init_all_result' && message.name != 'heartbeat' && message.name != 'timeSync') {
        // console.log('RES = ' + e.data)
    }

    if (!doispraum) {
        if (sessionBalance > 0 && StopWin <= sessionBalance) {
            // notify('Stop', `Stop Win Alcançado...`);
            // console.log('Stop Win Alcançado...')
            // process.exit()
        }

        if (sessionBalance < 0 && StopLoss <= Math.abs(sessionBalance)) {
            // notify('Stop', `Stop Loss Alcançado...`);
            // console.log('Stop Loss Alcançado...')
            // process.exit(1)
        }
    }

    if (message.name == 'option-opened' && message.msg) {
        let priceOpened = message.msg.value
        let active = message.msg.active_id
        let direction = message.msg.direction


        if (!galePut.includes(active)) {
            pricesOpenedMap.set(active, {
                priceOpened,
                direction,
                currentTimemm,
            })
        }
        // openedOrders.push(active)
    }

    if (doispraum && StopWin >= 2) {
        // console.log('Stop Win Alcançado...')
        // notify('Stop', `Stop Win Alcançado...`);
        // process.exit()
    }

    if (message.name == 'option-opened' && message.status != 0) {
        // console.log(parseInt(moment.unix(message.msg.expiration_time).format("mm")) - parseInt(moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').format("mm")))


        // console.log(message);
        // console.log(userBalanceReal);

        let data = {
            "name": "sendMessage",
            "msg": {
                "body":
                {
                    "price": parseFloat(amount),
                    "active_id": message.msg.active_id,
                    "expired": message.msg.expiration_time,
                    "direction": message.msg.direction,
                    "option_type_id": message.msg.option_type_id,//turbo 1 binary
                    "user_balance_id": userBalanceReal
                    // "user_balance_id": message.msg.balance_id
                }
                , "name": "binary-options.open-option", "version": "1.0"
            },
            "request_id": `teta`
        }

        let dataGusvato = {
            "name": "sendMessage",
            "msg": {
                "body":
                {
                    "price": parseFloat(amountGustavo),
                    "active_id": message.msg.active_id,
                    "expired": message.msg.expiration_time,
                    "direction": message.msg.direction,
                    "option_type_id": message.msg.option_type_id,//turbo 1 binary
                    "user_balance_id": userBalanceRealGustavo
                    // "user_balance_id": message.msg.balance_id
                }
                , "name": "binary-options.open-option", "version": "1.0"
            },
            "request_id": `teta`
        }

        let achouuu = false

        // for (let index = 0; index < buyssTimessBinary.length; index++) {
        //     const element = buyssTimessBinary[index];
        //     if (element.time == message.msg.expiration_time && element.par == message.msg.active_id) {
        //         achouuu = true
        //         break
        //     }
        // }

        // if (!achouuu) {
        //     buyssTimessBinary.push({
        //         time: message.msg.expiration_time,
        //         par: message.msg.active_id
        //     })

        // console.log(JSON.stringify(data))
        // console.log(message.msg.balance_id);
        // console.log(userBalanceId);
        if (message.msg.balance_id == userBalanceId && !orderIdsss.includes(message.msg.option_id)) {
            // console.log('aaaaaaaaaa');
            ws.send(JSON.stringify(data))
            wsGustavo.send(JSON.stringify(dataGusvato))
            orderIdsss.push(message.msg.option_id)
            console.log(`${currentTimehhmmss} || ${message.msg.direction} / ${getActiveString(message.msg.active_id, activesMapString)} / ${amount}`);
            // notify('[Order Binaria]', `${message.msg.direction} / ${getActiveString(message.msg.active_id, activesMapString)} / ${amount}`);

        }
        // }
    }

    if (message.name == 'position-changed') {
        // console.log('RES = ' + e.data);
        positionChangedStuff(message)
    }

    if (message.name == 'profile' && message.msg) {
        profileStuf(message, 'live-deal-binary-option-placed')
    }

    if (message.name == 'option' && message.status != 2000) {
        try {
            if (message.status == 4115) {
                let data

                let dataGustavo

                data = {//do4A20210413D174500T15MCSPT
                    "name": "sendMessage",
                    "msg": {
                        "name": "digital-options.place-digital-option",
                        "version": "1.0",
                        "body": {
                            // "user_balance_id": userBalanceId,
                            "user_balance_id": userBalanceReal,
                            "instrument_id": message.request_id,
                            "amount": amount.toString()
                        }
                    }, "request_id": `teta`
                }

                dataGustavo = {//do4A20210413D174500T15MCSPT
                    "name": "sendMessage",
                    "msg": {
                        "name": "digital-options.place-digital-option",
                        "version": "1.0",
                        "body": {
                            // "user_balance_id": userBalanceId,
                            "user_balance_id": userBalanceRealGustavo,
                            "instrument_id": message.request_id,
                            "amount": amountGustavo.toString()
                        }
                    }, "request_id": `teta`
                }

                ws.send(JSON.stringify(data))
                wsGustavo.send(JSON.stringify(dataGustavo))
                // console.log(message.status);
                console.log(`${currentTimehhmmss} || ${message.request_id}`.green);

            } else {
                console.log(`${currentTimehhmmss} || Erro ao comprar -> ${message.request_id}`.red)
                console.log('RES = ' + e.data)
                notify('Error', `Erro ao comprar -> ${message.request_id}`);
            }
            if (soros)
                positionOpenedSoros = false
            if (gale)
                positionOpenedGale = false
            buysss = []
        } catch (error) {
            console.log(error);
        }
    } else if (message.name == 'option') {
        // console.log('RES = ' + e.data)
    }


    if (message.name == 'digital-option-placed' && message.status != 2000) {
        totalOrderss--
        const active = parseInt(message.request_id)
        let index = openedOrders.indexOf(parseInt(active))
        openedOrders.splice(index, 1)
        buysCount.set(parseInt(active), buysCount.get(parseInt(active)) - 1)
        console.log(`${currentTimehhmmss} || Erro ao comprar -> ${getActiveString(`${active}`, activesMapString)}`.red)
        console.log('RES = ' + e.data)
        notify('Error', `Erro ao comprar -> ${getActiveString(`${active}`, activesMapString)}`);
        if (soros)
            positionOpenedSoros = false
        if (gale)
            positionOpenedGale = false
        buysss = []

        // if (message.status == 5000 && message.msg.message == 'exposure_limit') {
        //     let data = {//do4A20210413D174500T15MCSPT
        //         "name": "sendMessage",
        //         "msg": {
        //             "name": "digital-options.place-digital-option",
        //             "version": "1.0",
        //             "body": {
        //                 // "user_balance_id": userBalanceId,
        //                 "user_balance_id": userBalanceReal,
        //                 "instrument_id": message.request_id,
        //                 "amount": amount.toString()
        //             }
        //         }, "request_id": `${message.request_id}`
        //     }

        //     ws.send(JSON.stringify(data))

        //     console.log(`${currentTimehhmmss} || TENTOU DE NOVO`);
        //     notify('[Order Digital]', `TENTOU DE NOVO`);

        // }
    } else if (message.name == 'digital-option-placed') {
        // console.log('RES = ' + e.data)
    }

    if (message.name == 'option-closed') {
        // console.log('RES = ' + e.data);
        optionClosed(message)
    }


    if (message.name == 'heartbeat' || message.name == 'timesync') {
        currentTime = message.msg
        currentTimehhmm = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').format("HH:mm")
        currentTimemm = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').format("mm")
        currentTimess = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').format("ss")
        currentTimemmssDate = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').format("YYYY-MM-DD HH:mm:ss")
        currentTimehhmmss = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').format("HH:mm:ss")
        connectedd = true

        //noticias...
    }

    // if (message.name == 'candles') {
    //     let candles = message.msg.candles
    //     let price = candles[1].close
    //     let open = candles[1].open
    //     let active = parseInt(message.request_id.split('/')[0])

    //     pricesMap.set(parseInt(message.request_id.split('/')[0]), price)

    //     // console.log(price);

    //     for (var [key, value] of pricesMap.entries()) {
    //         if (key == active) {
    //             if (pricesOpenedMap.has(key)) {
    //                 let openedPrice = pricesOpenedMap.get(key).priceOpened
    //                 let direction = pricesOpenedMap.get(key).direction
    //                 if (parseInt(currentTimess) >= 01 && parseInt(currentTimemm) == parseInt(pricesOpenedMap.get(key).currentTimemm) + 1) {
    //                     if (direction == 'call') {
    //                         if (value <= openedPrice) {
    //                             galePut.push(active)
    //                             amount *= 1.05
    //                             buyBefor(direction, active, 1)
    //                             amount = amountInitial
    //                             pricesOpenedMap.delete(key)
    //                             pricesMap.delete(key)
    //                         } else {
    //                             pricesOpenedMap.delete(key)
    //                             pricesMap.delete(key)
    //                         }
    //                     } else {
    //                         if (value >= openedPrice) {
    //                             galePut.push(active)
    //                             amount *= 1.05
    //                             buyBefor(direction, active, 1)
    //                             amount = amountInitial
    //                             pricesOpenedMap.delete(key)
    //                             pricesMap.delete(key)
    //                         } else {
    //                             pricesOpenedMap.delete(key)
    //                             pricesMap.delete(key)
    //                         }
    //                     }

    //                     if (openedOrders.includes(active)) {
    //                         let indexx = openedOrders.indexOf(parseInt(active))
    //                         openedOrders.splice(indexx, 1)
    //                     }
    //                     // console.log(openedOrders);
    //                 }
    //             }
    //         }
    //     }

    // let openLast = candles[1].open
    // let closeLast = candles[1].close


    // for (let index = 0; index < checkCandle.length; index++) {
    //     const element = checkCandle[index];
    //     if (parseInt(message.request_id.split('/')[0]) == element.parInt) {
    //         let timeInt = parseInt(currentTimehhmm.substring(currentTimehhmm.length - 2, currentTimehhmm.length));
    //         if (timeInt == element.timeInt + (cincoum ? 1 : timeFramer)) {
    //             // console.log(openLast);
    //             // console.log(closeLast);
    //             if (element.direction == 'call') {
    //                 if (openLast < closeLast) {
    //                     let isStopedPar = false
    //                     for (let index = 0; index < stopOrdersPares.length; index++) {
    //                         const stopOrdersPar = stopOrdersPares[index];
    //                         if (getActiveString(element.parInt, activesMapString).includes(stopOrdersPar)) {
    //                             isStopedPar = true
    //                             break
    //                         }
    //                     }

    //                     if (!stopOrders && !isStopedPar && (!doispraum || doispraum && openedOrders.length == 0)) {
    //                         buyBefor(element.direction, element.parInt, 5)
    //                     }
    //                 }
    //             } else {
    //                 if (openLast > closeLast) {
    //                     let isStopedPar = false
    //                     for (let index = 0; index < stopOrdersPares.length; index++) {
    //                         const stopOrdersPar = stopOrdersPares[index];
    //                         if (getActiveString(element.parInt, activesMapString).includes(stopOrdersPar)) {
    //                             isStopedPar = true
    //                             break
    //                         }
    //                     }

    //                     if (!stopOrders && !isStopedPar && (!doispraum || doispraum && openedOrders.length == 0)) {
    //                         buyBefor(element.direction, element.parInt, 5)
    //                     }


    //                 }
    //             }
    //             // console.log(`${currentTimehhmmss} || Sinal Retirado / ${element.direction} / ${getActiveString(element.parInt, activesMapString)}`);
    //             checkCandle.splice(index, 1)
    //             index--
    //         }
    //     }
    // }

    // }
}

const onMessageGustavo = e => {
    // if (ws.readyState === WebSocket.OPEN) {
    const message = JSON.parse(e.data)

    // console.log('RES = ' + e.data);
    if (message.name == 'instrument-quotes-generated') {
    }

    if (message.name != 'instrument-quotes-generated' && message.name != 'api_option_init_all_result') {
        // console.log('RES = ' + e.data)
    }

    if (!doispraum) {
        if (sessionBalance > 0 && StopWin <= sessionBalance) {
            // notify('Stop', `Stop Win Alcançado...`);
            // console.log('Stop Win Alcançado...')
            // process.exit()
        }

        if (sessionBalance < 0 && StopLoss <= Math.abs(sessionBalance)) {
            // notify('Stop', `Stop Loss Alcançado...`);
            // console.log('Stop Loss Alcançado...')
            // process.exit(1)
        }
    }

    if (message.name == 'option-opened' && message.msg) {
        let priceOpened = message.msg.value
        let active = message.msg.active_id
        let direction = message.msg.direction


        if (!galePut.includes(active)) {
            pricesOpenedMap.set(active, {
                priceOpened,
                direction,
                currentTimemm,
            })
        }
        // openedOrders.push(active)
    }

    if (doispraum && StopWin >= 2) {
        // console.log('Stop Win Alcançado...')
        // notify('Stop', `Stop Win Alcançado...`);
        // process.exit()
    }

    if (message.name == 'option-opened' && message.status != 0) {
        // console.log(parseInt(moment.unix(message.msg.expiration_time).format("mm")) - parseInt(moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').format("mm")))


        // console.log(message);
        // console.log(userBalanceReal);

        let data = {
            "name": "sendMessage",
            "msg": {
                "body":
                {
                    "price": parseFloat(amount),
                    "active_id": message.msg.active_id,
                    "expired": message.msg.expiration_time,
                    "direction": message.msg.direction,
                    "option_type_id": message.msg.option_type_id,//turbo 1 binary
                    "user_balance_id": userBalanceReal
                    // "user_balance_id": message.msg.balance_id
                }
                , "name": "binary-options.open-option", "version": "1.0"
            },
            "request_id": `teta`
        }

        let achouuu = false

        // for (let index = 0; index < buyssTimessBinary.length; index++) {
        //     const element = buyssTimessBinary[index];
        //     if (element.time == message.msg.expiration_time && element.par == message.msg.active_id) {
        //         achouuu = true
        //         break
        //     }
        // }

        // if (!achouuu) {
        //     buyssTimessBinary.push({
        //         time: message.msg.expiration_time,
        //         par: message.msg.active_id
        //     })

        // console.log(JSON.stringify(data))
        if (message.msg.balance_id == userBalanceId && !orderIdsss.includes(message.msg.option_id)) {
            // ws.send(JSON.stringify(data))
            // orderIdsss.push(message.msg.option_id)
            // console.log(`${currentTimehhmmss} || ${message.msg.direction} / ${getActiveString(message.msg.active_id, activesMapString)} / ${amount}`);
            // notify('[Order Binaria]', `${message.msg.direction} / ${getActiveString(message.msg.active_id, activesMapString)} / ${amount}`);

        }
        // }
    }

    if (message.name == 'position-changed') {
        // console.log('RES = ' + e.data);
        // positionChangedStuff(message)
    }

    if (message.name == 'profile' && message.msg) {
        profileStufGustavo(message, 'live-deal-binary-option-placed')
    }

    if (message.name == 'option' && message.status != 2000) {

        // console.log(message.status);

        // totalOrderss--
        // const active = parseInt(message.request_id)
        // let index = openedOrders.indexOf(parseInt(active))
        // openedOrders.splice(index, 1)
        // buysCount.set(parseInt(active), buysCount.get(parseInt(active)) - 1)
        // console.log(`${currentTimehhmmss} || Erro ao comprar -> ${getActiveString(`${active}`, activesMapString)}`.red)
        // console.log('RES = ' + e.data)
        // notify('Error', `Erro ao comprar -> ${getActiveString(`${active}`, activesMapString)}`);
        // if (soros)
        //     positionOpenedSoros = false
        // if (gale)
        //     positionOpenedGale = false
        // buysss = []
    } else if (message.name == 'option') {
        // console.log('RES = ' + e.data)
    }


    if (message.name == 'digital-option-placed' && message.status != 2000) {
        // totalOrderss--
        // const active = parseInt(message.request_id)
        // let index = openedOrders.indexOf(parseInt(active))
        // openedOrders.splice(index, 1)
        // buysCount.set(parseInt(active), buysCount.get(parseInt(active)) - 1)
        // console.log(`${currentTimehhmmss} || Erro ao comprar -> ${getActiveString(`${active}`, activesMapString)}`.red)
        // console.log('RES = ' + e.data)
        // notify('Error', `Erro ao comprar -> ${getActiveString(`${active}`, activesMapString)}`);
        // if (soros)
        //     positionOpenedSoros = false
        // if (gale)
        //     positionOpenedGale = false
        // buysss = []

        // if (message.status == 5000 && message.msg.message == 'exposure_limit') {
        //     let data = {//do4A20210413D174500T15MCSPT
        //         "name": "sendMessage",
        //         "msg": {
        //             "name": "digital-options.place-digital-option",
        //             "version": "1.0",
        //             "body": {
        //                 // "user_balance_id": userBalanceId,
        //                 "user_balance_id": userBalanceReal,
        //                 "instrument_id": message.request_id,
        //                 "amount": amount.toString()
        //             }
        //         }, "request_id": `${message.request_id}`
        //     }

        //     ws.send(JSON.stringify(data))

        //     console.log(`${currentTimehhmmss} || TENTOU DE NOVO`);
        //     notify('[Order Digital]', `TENTOU DE NOVO`);

        // }
    } else if (message.name == 'digital-option-placed') {
        // console.log('RES = ' + e.data)
    }

    if (message.name == 'option-closed') {
        // console.log('RES = ' + e.data);
        optionClosed(message)
    }


    if (message.name == 'heartbeat' || message.name == 'timesync') {
        connecteddGustavo = true

        //noticias...
    }

    // if (message.name == 'candles') {
    //     let candles = message.msg.candles
    //     let price = candles[1].close
    //     let open = candles[1].open
    //     let active = parseInt(message.request_id.split('/')[0])

    //     pricesMap.set(parseInt(message.request_id.split('/')[0]), price)

    //     // console.log(price);

    //     for (var [key, value] of pricesMap.entries()) {
    //         if (key == active) {
    //             if (pricesOpenedMap.has(key)) {
    //                 let openedPrice = pricesOpenedMap.get(key).priceOpened
    //                 let direction = pricesOpenedMap.get(key).direction
    //                 if (parseInt(currentTimess) >= 01 && parseInt(currentTimemm) == parseInt(pricesOpenedMap.get(key).currentTimemm) + 1) {
    //                     if (direction == 'call') {
    //                         if (value <= openedPrice) {
    //                             galePut.push(active)
    //                             amount *= 1.05
    //                             buyBefor(direction, active, 1)
    //                             amount = amountInitial
    //                             pricesOpenedMap.delete(key)
    //                             pricesMap.delete(key)
    //                         } else {
    //                             pricesOpenedMap.delete(key)
    //                             pricesMap.delete(key)
    //                         }
    //                     } else {
    //                         if (value >= openedPrice) {
    //                             galePut.push(active)
    //                             amount *= 1.05
    //                             buyBefor(direction, active, 1)
    //                             amount = amountInitial
    //                             pricesOpenedMap.delete(key)
    //                             pricesMap.delete(key)
    //                         } else {
    //                             pricesOpenedMap.delete(key)
    //                             pricesMap.delete(key)
    //                         }
    //                     }

    //                     if (openedOrders.includes(active)) {
    //                         let indexx = openedOrders.indexOf(parseInt(active))
    //                         openedOrders.splice(indexx, 1)
    //                     }
    //                     // console.log(openedOrders);
    //                 }
    //             }
    //         }
    //     }

    // let openLast = candles[1].open
    // let closeLast = candles[1].close


    // for (let index = 0; index < checkCandle.length; index++) {
    //     const element = checkCandle[index];
    //     if (parseInt(message.request_id.split('/')[0]) == element.parInt) {
    //         let timeInt = parseInt(currentTimehhmm.substring(currentTimehhmm.length - 2, currentTimehhmm.length));
    //         if (timeInt == element.timeInt + (cincoum ? 1 : timeFramer)) {
    //             // console.log(openLast);
    //             // console.log(closeLast);
    //             if (element.direction == 'call') {
    //                 if (openLast < closeLast) {
    //                     let isStopedPar = false
    //                     for (let index = 0; index < stopOrdersPares.length; index++) {
    //                         const stopOrdersPar = stopOrdersPares[index];
    //                         if (getActiveString(element.parInt, activesMapString).includes(stopOrdersPar)) {
    //                             isStopedPar = true
    //                             break
    //                         }
    //                     }

    //                     if (!stopOrders && !isStopedPar && (!doispraum || doispraum && openedOrders.length == 0)) {
    //                         buyBefor(element.direction, element.parInt, 5)
    //                     }
    //                 }
    //             } else {
    //                 if (openLast > closeLast) {
    //                     let isStopedPar = false
    //                     for (let index = 0; index < stopOrdersPares.length; index++) {
    //                         const stopOrdersPar = stopOrdersPares[index];
    //                         if (getActiveString(element.parInt, activesMapString).includes(stopOrdersPar)) {
    //                             isStopedPar = true
    //                             break
    //                         }
    //                     }

    //                     if (!stopOrders && !isStopedPar && (!doispraum || doispraum && openedOrders.length == 0)) {
    //                         buyBefor(element.direction, element.parInt, 5)
    //                     }


    //                 }
    //             }
    //             // console.log(`${currentTimehhmmss} || Sinal Retirado / ${element.direction} / ${getActiveString(element.parInt, activesMapString)}`);
    //             checkCandle.splice(index, 1)
    //             index--
    //         }
    //     }
    // }

    // }
}

let timeeessa = 5000
setInterval(() => {
    if (!connectedd) {
        console.log('CAIU CONEXAO');
        ws.terminate()
        ws = new WebSocket(url)
        ws.onopen = onOpen
        ws.onerror = onError
        ws.onmessage = onMessage
        start()
        timeeessa = 30000
    } else {
        timeeessa = 5000
    }
    connectedd = false
}, timeeessa);

setInterval(() => {
    if (!connecteddGustavo)
        // console.log('CAIU CONEXAO GUSTAVO');
        connecteddGustavo = false
}, 5000);

let pricesMap = new Map()
let pricesOpenedMap = new Map()

setInterval(() => {
    // axios.get('https://checkpayout.herokuapp.com/opened').then(res => {
    //     openedMap = res.data.openedMap
    // })
}, 5000);

let totalOrderss = 0

let m15Expires = []

function getBreakaa(price, index, parInt, breakaa) {
    if (openOrderNextCandle.length > 0) {
        for (let indexs = 0; indexs < openOrderNextCandle.length; indexs++) {
            const element = openOrderNextCandle[indexs];
            // console.log(currentTimemm);
            // console.log(element.minute);
            if (element.max != 0 && parseInt(currentTimemm) >= element.minute && price >= element.max) {
                taxasObj[index].max = 0;
                // buyBefor('put', parInt, 5);
                openOrderNextCandle.splice(indexs, 1);
                indexs--;
                breakaa = true;
                setConfig(element, 'put', 5);

            } else if (element.min != 0 && parseInt(currentTimemm) >= element.minute && price <= element.min) {
                taxasObj[index].min = 0;
                // buyBefor('call', parInt, 5);
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

    fs.writeFile('config.json', JSON.stringify(config, null, 4), err => {
        // console.log(err || 'Arquivo salvo');
    });
}

setTimeout(() => {
    // buyBefor('call', 1, 15)

}, 3000);

function buyBefor(direction, parInt, type) {
    let timeFrameL = null
    let timeFrame = timeFramer

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
            hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').add(2, 'm').format(" HH:mm");
        } else {
            hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').add(1, 'm').format(" HH:mm");
        }
    } else if (type == 5) {
        if (parseInt(currentTimess) >= 30) {
            hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').add(6, 'm').format(" HH:mm");
        } else {
            hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').add(5, 'm').format(" HH:mm");
        }
    } else {
        hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').add(15, 'm').format(" HH:mm");
    }
    checkOpenedPayoutBeforeBuy(parInt, direction, hourmm, type);
}

let notOrder = []

function checkOpenedPayoutBeforeBuy(parInt, direction, hourmm, timeFrame) {
    let turboPayout = null;
    let digitalPayout = null;

    // openOrderBinary(direction, parInt, hourmm);
    // return;

    // if (timeFrame == 1 && parseInt(currentTimess) < 30) {
    //     openOrderBinary(direction, parInt, hourmm);
    //     return
    // }

    // if (cincoum) {
    //     openOrderBinary(direction, parInt, hourmm, timeFrame)
    //     return
    // }

    if (payoutMap.has('turbo')) {
        if (payoutMap.get('turbo').has(parInt)) {
            turboPayout = payoutMap.get('turbo').get(parInt);
        }
    }
    if (payoutMap.has('digital')) {
        if (payoutMap.get('digital').has(parInt)) {
            digitalPayout = payoutMap.get('digital').get(parInt);
        }
    }

    if (timeFrame == 15) {
        openOrderDigital(direction, parInt, hourmm, timeFrame);
    } else if (openedMap.has(parInt) && openedMap.get(parInt) && openedMapDigital.has(parInt) && openedMapDigital.get(parInt)) {
        if (digitalPayout > turboPayout) {
            openOrderDigital(direction, parInt, hourmm, timeFrame);
            console.log(1);
        } else if (digitalPayout <= turboPayout) {
            openOrderBinary(direction, parInt, hourmm);
            console.log(2);
        } else if (!!turboPayout) {
            openOrderBinary(direction, parInt, hourmm);
            console.log(3);
        } else if (!!digitalPayout) {
            openOrderDigital(direction, parInt, hourmm, timeFrame);
            console.log(4);
        } else {
            openOrderBinary(direction, parInt, hourmm);
            console.log(5);
        }
    } else if (openedMap.has(parInt) && openedMap.get(parInt)) {
        openOrderBinary(direction, parInt, hourmm);
        console.log(6);
    } else if (openedMapDigital.has(parInt) && openedMapDigital.get(parInt)) {
        openOrderDigital(direction, parInt, hourmm, timeFrame);
        console.log(7);
    } else {
        openOrderBinary(direction, parInt, hourmm);
        console.log(8);
    }
}

function openOrderBinary(direction, parInt, hourmm) {
    console.log(`${currentTimehhmmss} || ${direction} / ${getActiveString(parInt, activesMapString)} / ${amount}`);
    notify('[Order Binaria]', `${direction} / ${getActiveString(parInt, activesMapString)} / ${amount}`);
    buy(amount, parInt, direction, parseInt(moment(moment().format("YYYY-MM-DD ") + hourmm).utcOffset(0).format('X')), 3);
    totalOrderss++;
    // openedOrders.push(parInt);
}

function openOrderDigital(direction, parInt, hourmm, timeFrame) {
    let timeInt = parseInt(currentTimehhmm.substring(currentTimehhmm.length - 2, currentTimehhmm.length));
    let timeFrameL = null
    let resto = timeInt % timeFrame;
    timeFrameL = 5
    if (resto != 0) {
        timeFrameL = timeFrameL - resto;
    }

    let timeee = 0
    if (parseInt(currentTimemm) < 15) {
        timeee = 15 - parseInt(currentTimemm)
    } else if (parseInt(currentTimemm) < 30) {
        timeee = 30 - parseInt(currentTimemm)
    } else if (parseInt(currentTimemm) < 45) {
        timeee = 45 - parseInt(currentTimemm)
    } else {
        timeee = 60 - parseInt(currentTimemm)
    }

    hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').add(timeee, 'm').format(" HH:mm");

    console.log(hourmm);
    console.log(`${currentTimehhmmss} || ${direction} / ${getActiveString(parInt, activesMapString)} / ${amount} / Digital`);
    notify('[Order Digital]', `${direction} / ${getActiveString(parInt, activesMapString)} / ${amount}`);
    buy(amount, parInt, direction, parseInt(moment(moment().format("YYYY-MM-DD ") + hourmm).utcOffset(0).format('X')), 'PT' + 15 + 'M');
    totalOrderss++;
    // openedOrders.push(parInt);
}

function getCandle(active_id, time) {
    let data = {
        "name": "get-candles",
        "version": "2.0",
        "body": {
            "active_id": active_id,
            "size": 5,
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
    let amounth = buysss[0] && buysss[0].amount ? buysss[0].amount : amount
    let active = message.msg.active_id
    let direction = message.msg.direction

    if (openedOrders.includes(active)) {
        let index = openedOrders.indexOf(parseInt(active))
        openedOrders.splice(index, 1)
    }
    profitAmount = message.msg.profit_amount - amounth
    sessionBalance += profitAmount

    if (profitAmount < 0) {

        losss++
        // console.log(`${currentTimehhmmss} || ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario`.red)
        // notify('Loss', `${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario`);
        if (doispraum) {
            winss = 0
            console.log(`${currentTimehhmmss} || StopLoss alcançado`.red)
            process.exit(1)
        } else {

            if (gale)
                if (!galePut.includes(active)) {
                    //         galePut.push(active)
                    //         amount *= 1.05
                    //         buyBefor(direction, active, 1)
                    //         amount = amountInitial
                } else {
                    let index = galePut.indexOf(parseInt(active))
                    galePut.splice(index, 1)
                }
        }
    } else if (profitAmount == 0) {
        // console.log(`${currentTimehhmmss} || ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario`.red)
        // notify('Empate', `Empate ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario`);
    } else {
        winss++
        // if (amount != amountInitial) {
        //     amount = amountInitial
        // } else {
        //     amount += profitAmount
        // }
        if (doispraum) {
            StopWin++
            amount += profitAmount.toFixed(2)
            setWinss(amount);
        }

        // if (gale) {
        //     let index = galePut.indexOf(parseInt(active))
        //     galePut.splice(index, 1)
        // }

        // console.log(`${currentTimehhmmss} || ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario`.green)
        // notify('Wiiin!!', `${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario`);
    }
    positionOpenedSoros = false
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

function setLoss(amount) {
    let fsConfig = fs.readFileSync('config.json');
    let config = JSON.parse(fsConfig);
    let StopLoss = parseInt(config.StopLoss) + 1;
    config.StopLoss = StopLoss;
    config.amount = amount
    fs.writeFile('config.json', JSON.stringify(config, null, 4), err => {
    });
}

function positionChangedStuff(message) {
    if (message.msg.status != 'closed') {

        // console.log(message);
        // console.log(userBalanceReal);
        let expirationAt = moment.unix(message.msg.raw_event.instrument_expiration / 1000).utcOffset(0).format("YYYYMMDDHHmm")//YYYYMMDDhhmm
        const activeString = getActiveString(message.msg.active_id, activesDigitalMapString)
        const instrumentId = 'do' + activeString + expirationAt + (message.msg.raw_event.instrument_id.includes('T15') ? 'PT' + 15 + 'M' : message.msg.raw_event.instrument_id.includes('T5') ? 'PT' + 5 + 'M' : 'PT' + 1 + 'M')
            + message.msg.raw_event.instrument_dir.toUpperCase().substring(0, 1) + 'SPT'

        let data

        let dataGustavo

        data = {//do4A20210413D174500T15MCSPT
            "name": "sendMessage",
            "msg": {
                "name": "digital-options.place-digital-option",
                "version": "1.0",
                "body": {
                    // "user_balance_id": userBalanceId,
                    "user_balance_id": userBalanceReal,
                    "instrument_id": instrumentId,
                    "amount": amount.toString()
                }
            }, "request_id": `teta`
        }

        dataGustavo = {//do4A20210413D174500T15MCSPT
            "name": "sendMessage",
            "msg": {
                "name": "digital-options.place-digital-option",
                "version": "1.0",
                "body": {
                    // "user_balance_id": userBalanceId,
                    "user_balance_id": userBalanceRealGustavo,
                    "instrument_id": instrumentId,
                    "amount": amountGustavo.toString()
                }
            }, "request_id": `teta`
        }


        if (!message.msg.raw_event.instrument_id.includes('T15')) {
            data = {
                "name": "sendMessage",
                "msg": {
                    "body":
                    {
                        "price": parseFloat(amount),
                        "active_id": message.msg.active_id,
                        "expired": message.msg.raw_event.instrument_expiration / 1000,
                        "direction": message.msg.raw_event.instrument_dir,
                        "option_type_id": 3,//turbo 1 binary
                        "user_balance_id": userBalanceReal
                        // "user_balance_id": message.msg.balance_id
                    }
                    , "name": "binary-options.open-option", "version": "1.0"
                },
                "request_id": `${instrumentId}`
            }

            dataGustavo = {
                "name": "sendMessage",
                "msg": {
                    "body":
                    {
                        "price": parseFloat(amountGustavo),
                        "active_id": message.msg.active_id,
                        "expired": message.msg.raw_event.instrument_expiration / 1000,
                        "direction": message.msg.raw_event.instrument_dir,
                        "option_type_id": 3,//turbo 1 binary
                        "user_balance_id": userBalanceRealGustavo
                        // "user_balance_id": message.msg.balance_id
                    }
                    , "name": "binary-options.open-option", "version": "1.0"
                },
                "request_id": `${instrumentId}`
            }
        }

        // let achouuu = false

        // for (let index = 0; index < buyssTimess.length; index++) {
        //     const element = buyssTimess[index];
        //     if (element.time == message.msg.raw_event.instrument_expiration / 1000 && element.par == message.msg.active_id) {
        //         achouuu = true
        //         break
        //     }
        // }

        // if (!achouuu) {
        //     buyssTimess.push({
        //         time: message.msg.raw_event.instrument_expiration / 1000,
        //         par: message.msg.active_id
        //     })
        // console.log(dataGustavo);

        // console.log(JSON.stringify(data))
        if (message.msg.raw_event.user_balance_id == userBalanceId && !orderIdsss.includes(message.msg.id)) {
            ws.send(JSON.stringify(data))
            wsGustavo.send(JSON.stringify(dataGustavo))
            orderIdsss.push(message.msg.id)
            console.log(`${currentTimehhmmss} || ${message.msg.raw_event.instrument_dir} / ${getActiveString(message.msg.active_id, activesMapString)} / ${amount}`);
            // notify('[Order Digital]', `${message.msg.raw_event.instrument_dir} / ${getActiveString(message.msg.active_id, activesMapString)} / ${amount}`);
        }
        // }
    } else

        if (message.msg.status == 'closed') {

            let id = message.msg.id
            let direction = message.msg.raw_event.instrument_dir
            buysCount.set(message.msg.active_id, buysCount.get(message.msg.active_id) - 1)
            idsArray.push(id)

            if (soros)
                positionOpenedSoros = false
            if (gale)
                positionOpenedGale = false

            let profitAmount = message.msg.close_profit ? message.msg.close_profit - amount : amount * -1
            let active = message.msg.active_id

            if (openedOrders.includes(active)) {
                let index = openedOrders.indexOf(parseInt(active))
                openedOrders.splice(index, 1);
            }
            sessionBalance += profitAmount

            if (profitAmount < 0) {

                losss++
                // console.log(`${currentTimehhmmss} || ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`.red)
                // notify('Loss', `${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`);

                if (doispraum) {
                    winss = 0
                    console.log(`${currentTimehhmmss} || StopLoss alcançado`.red)
                    process.exit(1)
                } else {
                    if (gale) {
                        if (!galePut.includes(active)) {
                            //         galePut.push(active)
                            //         amount *= 1.05
                            //         buyBefor(direction, active, 1)
                            //         amount = amountInitial
                        } else {
                            let index = galePut.indexOf(parseInt(active))
                            galePut.splice(index, 1)
                        }
                    }
                }



            } else if (profitAmount == 0) {
                // console.log(`${currentTimehhmmss} || ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`.red)
                notify('Empate', `Empate ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`);
            } else {
                winss++
                // if (amount != amountInitial) {
                //     amount = amountInitial
                // } else {
                //     amount += profitAmount
                // }
                if (doispraum) {
                    StopWin++
                    amount += profitAmount.toFixed(2)
                    setWinss(amount);
                }

                if (gale) {
                    let index = galePut.indexOf(parseInt(active))
                    galePut.splice(index, 1)
                }
                // console.log(`${currentTimehhmmss} || ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`.green)
                // notify('Wiiin!!', `${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`);
            }
            positionOpenedSoros = false
        }
}

function profileStufGustavo(message, name) {
    const balances = message.msg.balances
    for (let index = 0; index < balances.length; index++) {
        const element = balances[index]

        if (element.type == 1) {
            userBalanceRealGustavo = element.id
        }
        if (config.conta == 'demo') {
            if (element.type == 4) {
                message.msg.balance_id = element.id
            }
        }
        else if (config.conta == 'real') {
            if (element.type == 1) {
                message.msg.balance_id = element.id
                userBalanceRealGustavo = element.id
            }
        }
    }
    userBalanceIdGustavo = message.msg.balance_id
    console.log('loo');
    subscribePortifolio()

    if (!getLeadersBool) {
        getLeadersBool = true
        getLeaders(ws)
    }

    subs(name, 'subscribeMessage')

}

function profileStuf(message, name) {
    const balances = message.msg.balances
    for (let index = 0; index < balances.length; index++) {
        const element = balances[index]

        if (element.type == 1) {
            userBalanceReal = element.id
        }
        if (config.conta == 'demo') {
            if (element.type == 4) {
                message.msg.balance_id = element.id
            }
        }
        else if (config.conta == 'real') {
            if (element.type == 1) {
                message.msg.balance_id = element.id
                userBalanceReal = element.id
            }
        }
        console.log(element.id);
        console.log(element.type);
    }
    userBalanceId = message.msg.balance_id
    subscribePortifolio()

    if (!getLeadersBool) {
        getLeadersBool = true
        getLeaders(ws)
    }

    subs(name, 'subscribeMessage')

}

setInterval(() => {
    // if (payout && binarias && ws.readyState === WebSocket.OPEN)
    // ws.send(JSON.stringify({ "name": "api_option_init_all", "msg": "", "request_id": "" }))
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
let wsGustavo = new WebSocket(url)
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


const doLoginGustavo = ssid => {
    return new Promise((resolve, reject) => {
        if (wsGustavo && wsGustavo.readyState === WebSocket.OPEN) {
            if (log)
                console.log(JSON.stringify({ 'name': 'ssid', 'msg': ssid, "request_id": "" }))
            wsGustavo.send(JSON.stringify({ 'name': 'ssid', 'msg': ssid, "request_id": "" }))
            logged = true
        } else if (ws) {
            // ws.terminate()
            // ws = new WebSocket(url)
            // ws.onopen = onOpen
            // ws.onerror = onError
            // ws.onmessage = onMessage
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
        identifier: config.login,
        password: config.password
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
let logged = false

let ssidGustavo

const start = () => {
    axios.post('https://auth.trade.exnova.com/api/v2/login', {
        identifier: 'vinipsidonik@gmail.com',
        password: 'Mp19199797@1'
        // identifier: "carol.davila14@outlook.com",
        // password: "gc896426",
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
    }).catch(function (err) {
        if (err)
            console.log('Erro ao se conectar... Tente novamente')
    })
}
start()
axios.post('https://auth.trade.exnova.com/api/v2/login', {
    identifier: "davilagustavo996@gmail.com",
    password: "Ana12boeno#",
    // identifier: "carol.davila14@outlook.com",
    // password: "gc896426",
}).then((response) => {
    ssidGustavo = response.data.ssid
    console.log(ssidGustavo);
    wsGustavo.onopen = onOpen
    wsGustavo.onerror = onError
    wsGustavo.onmessage = onMessageGustavo
    const loginn = setInterval(() => {
        if (logged) {
            clearInterval(loginn)
        }
        doLoginGustavo(ssidGustavo)
    }, 500);
}).catch(function (err) {
    if (err)
        console.log('Erro ao se conectar... Tente novamente')
})

function subscribePortifolio() {
    let data = { "name": "portfolio.position-changed", "version": "2.0", "params": { "routingFilters": { "instrument_type": "digital-option", "user_balance_id": userBalanceId } } }

    ws.send(JSON.stringify(messageHeader(data, 'subscribeMessage')))

}