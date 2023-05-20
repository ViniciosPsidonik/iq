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
const url = 'wss://iqoption.com/echo/websocket'
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
        axios.get(`http://localhost:3000/payout/${type}`).then((res) => {
            return resolve(res.data)
        }).catch((err) => {
            return resolve(0)
        })
    })
}

const getOpened = () => {
    return new Promise((resolve, reject) => {
        axios.get(`http://localhost:3000/opened/turbo`).then((res) => {
            return resolve(res.data)
        }).catch((err) => {
            console.log('getOpened');
            // console.log(err);
            return resolve([[]])
        })
    })
}

const getOpenedDigital = () => {
    return new Promise((resolve, reject) => {
        axios.get(`http://localhost:3000/opened/digital`).then((res) => {
            return resolve(res.data)
        }).catch((err) => {
            console.log('getOpenedDigital');
            // console.log(err);
            return resolve([[]])
        })
    })
}

setInterval(async () => {
    intervalGetPayout()
    openedMap = new Map(await getOpened())
    openedMapDigital = new Map(await getOpenedDigital())
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
            getCandle(parInt, 5)
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


const onMessage = e => {
    // if (ws.readyState === WebSocket.OPEN) {
    const message = JSON.parse(e.data)

    // console.log('RES = ' + e.data);
    if (message.name == 'instrument-quotes-generated') {
    }

    // if (message.name != 'instrument-quotes-generated' && message.name != 'api_option_init_all_result')
    // console.log('RES = ' + e.data)

    if (doispraum && StopWin >= 2) {
        console.log('Stop Win Alcançado...')
        notify('Stop', `Stop Win Alcançado...`);
        process.exit()
    }

    if (1 <= StopLoss) {
        console.log('Stop Loss Alcançado...')
        notify('Stop', `Stop Loss Alcançado...`);
        process.exit(1)
    }

    if (message.name == 'profile' && message.msg) {
        profileStuf(message, 'live-deal-binary-option-placed')
    }

    if (message.name == 'option' && message.status != 0) {
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
        currentTime = message.msg
        currentTimehhmm = moment.unix(currentTime / 1000).utcOffset(-3).format("HH:mm")
        currentTimemm = moment.unix(currentTime / 1000).utcOffset(-3).format("mm")
        currentTimemmssDate = moment.unix(currentTime / 1000).utcOffset(-3).format("YYYY-MM-DD HH:mm:ss")
        currentTimehhmmss = moment.unix(currentTime / 1000).utcOffset(-3).format("HH:mm:ss")

        //noticias...
        if (noticiasObj.length > 0) {
            for (let index = 0; index < noticiasObj.length; index++) {
                const noticia = noticiasObj[index];


                let beforeTime = moment(moment().format("YYYY-MM-DD ") + noticia.time).subtract(10, 'minutes')
                let afterTime = moment(moment().format("YYYY-MM-DD ") + noticia.time).add(30, 'minutes')

                let isBettween = moment(moment().format("YYYY-MM-DD ") + currentTimehhmmss).isBetween(beforeTime, afterTime)
                // console.log(isBettween);
                if (isBettween && (noticia.par == 'EUR' || noticia.par == 'USD')) {
                    stopOrders = true
                    break;
                } else if (stopOrders && (noticia.par == 'EUR' || noticia.par == 'USD') && moment(moment().format("YYYY-MM-DD ") + currentTimehhmmss).isAfter(afterTime)) {
                    console.log(`${currentTimehhmmss} || is after`);
                    stopOrders = false
                    noticiasObj.splice(index, 1)
                    index--
                } else
                    if (isBettween && !stopOrdersPares.includes(noticia.par)) {
                        console.log('par betwenn');
                        stopOrdersPares.push(noticia.par)
                    } else if (stopOrdersPares.includes(noticia.par) && moment(moment().format("YYYY-MM-DD ") + currentTimehhmmss).isAfter(afterTime)) {
                        console.log('par end');
                        let indexx = stopOrdersPares.indexOf(noticia.par)
                        stopOrdersPares.splice(indexx, 1)
                        noticiasObj.splice(index, 1)
                        index--
                    }
            }
        }
    }

    if (message.name == 'candles') {
        if (message.request_id.includes('/5')) {
            let candles = message.msg.candles
            let price = candles[1].close
            let open = candles[1].open

            let closeLast = candles[0].close
            let minLast = candles[0].min
            let maxLast = candles[0].max

            for (let index = 0; index < taxasObj.length; index++) {
                const element = taxasObj[index];
                let parInt = activesMapString.get(element.par)
                let max = parseFloat(element.max)
                let min = parseFloat(element.min)

                if (verpar && parseInt(message.request_id) == activesMapString.get(verpar)) {
                    console.log(price);
                }

                let direction

                if (parseInt(message.request_id.split('/')[0]) == parInt && !openedOrders.includes(parInt) && !notOrder.includes(parInt)) {

                    let breakaa = false
                    breakaa = getBreakaa(price, index, parInt, breakaa);
                    if (breakaa)
                        break

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

                        taxasObj[index].max = 0
                        direction = 'put'

                        let isStopedPar = false
                        for (let index = 0; index < stopOrdersPares.length; index++) {
                            const stopOrdersPar = stopOrdersPares[index];
                            if (getActiveString(parInt, activesMapString).includes(stopOrdersPar)) {
                                isStopedPar = true
                                break
                            }
                        }

                        let toClose = false
                        let max
                        if (toCloseM5Obj.has(getActiveString(parInt, activesMapString))) {
                            if (toCloseM5Obj.get(getActiveString(parInt, activesMapString)).max != 0 && parseFloat(open) > parseFloat(toCloseM5Obj.get(getActiveString(parInt, activesMapString)).max)) {
                                toClose = true
                                max = toCloseM5Obj.get(getActiveString(parInt, activesMapString)).max
                            }
                        }

                        if (!stopOrders && !isStopedPar && !toClose && openedOrders.length == 0) {

                            buyBefor(direction, parInt, 5);

                        } else if (toClose) {
                            console.log(`${currentTimehhmmss} || Vela iniciou muito proximo do preço -> ${getActiveString(parInt, activesMapString)} - ${direction}`);
                            notify('To Close', `Vela iniciou muito proximo do preço -> ${getActiveString(parInt, activesMapString)} - ${direction}`);
                        } else if (openedOrders.length != 0) {
                            console.log(`${currentTimehhmmss} || Já possui ordens abertas. -> ${getActiveString(parInt, activesMapString)} - ${direction}`);
                            notify('OpenedOrder', `Já possui ordens abertas. -> ${getActiveString(parInt, activesMapString)} - ${direction}`);
                        } else {
                            console.log(`${currentTimehhmmss} || Rompeu Noticia -> ${getActiveString(parInt, activesMapString)} - ${direction} / stopOrders = ${stopOrders} / isStopedPar = ${isStopedPar}`);
                            notify('Noticia', `Rompeu -> ${getActiveString(parInt, activesMapString)} - ${direction} / stopOrders = ${stopOrders} / isStopedPar = ${isStopedPar}`);
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

                        taxasObj[index].min = 0
                        direction = 'call'

                        let isStopedPar = false
                        for (let index = 0; index < stopOrdersPares.length; index++) {
                            const stopOrdersPar = stopOrdersPares[index];
                            if (getActiveString(parInt, activesMapString).includes(stopOrdersPar)) {
                                isStopedPar = true
                                break
                            }
                        }

                        let toClose = false
                        let min
                        if (toCloseM5Obj.has(getActiveString(parInt, activesMapString))) {
                            if (toCloseM5Obj.get(getActiveString(parInt, activesMapString)).min != 0 && parseFloat(open) < parseFloat(toCloseM5Obj.get(getActiveString(parInt, activesMapString)).min)) {
                                toClose = true
                                min = toCloseM5Obj.get(getActiveString(parInt, activesMapString)).min
                            }
                        }

                        if (!stopOrders && !isStopedPar && !toClose && openedOrders.length == 0) {
                            buyBefor(direction, parInt, 5);
                        } else if (toClose) {
                            console.log(`${currentTimehhmmss} || Vela iniciou muito proximo do preço -> ${getActiveString(parInt, activesMapString)} - ${direction}`);
                            notify('To Close', `Vela iniciou muito proximo do preço -> ${getActiveString(parInt, activesMapString)} - ${direction}`);
                        } else if (openedOrders.length != 0) {
                            console.log(`${currentTimehhmmss} || Já possui ordens abertas. -> ${getActiveString(parInt, activesMapString)} - ${direction}`);
                            notify('OpenedOrder', `Já possui ordens abertas. -> ${getActiveString(parInt, activesMapString)} - ${direction}`);
                        } else {
                            console.log(`${currentTimehhmmss} || Rompeu Noticia -> ${getActiveString(parInt, activesMapString)} - ${direction} / stopOrders = ${stopOrders} / isStopedPar = ${isStopedPar}`);
                            notify('Noticia', `Rompeu -> ${getActiveString(parInt, activesMapString)} - ${direction} / stopOrders = ${stopOrders} / isStopedPar = ${isStopedPar}`);
                        }
                        // }
                        setConfig(element, 'call', 5);
                    }
                    break
                }

            }
        } else {
            let candles = message.msg.candles
            let price = candles[1].close
            let open = candles[1].open

            for (let index = 0; index < taxasObj15.length; index++) {
                const element = taxasObj15[index];
                let parInt = activesMapString.get(element.par)
                let max = parseFloat(element.max)
                let min = parseFloat(element.min)

                if (verpar && parseInt(message.request_id) == activesMapString.get(verpar)) {
                    // console.log(price);
                    process.stdout.write(price);
                }

                let direction

                if (parseInt(message.request_id.split('/')[0]) == parInt && !openedOrders.includes(parInt) && !notOrder.includes(parInt)) {
                    let close = candles[0].close
                    if (max != 0 && price >= max) {

                        taxasObj15[index].max = 0
                        direction = 'put'

                        let isStopedPar = false
                        for (let index = 0; index < stopOrdersPares.length; index++) {
                            const stopOrdersPar = stopOrdersPares[index];
                            if (getActiveString(parInt, activesMapString).includes(stopOrdersPar)) {
                                isStopedPar = true
                                break
                            }
                        }

                        let toClose = false
                        if (toCloseM15Obj.has(getActiveString(parInt, activesMapString))) {
                            if (open > toCloseM15Obj.get(getActiveString(parInt, activesMapString)).min) {
                                toClose = true
                            }
                        }

                        if (!stopOrders && !isStopedPar && !toClose) {
                            buyBefor(direction, parInt, 15);
                        } else if (toClose) {
                            console.log(`${currentTimehhmmss} || Vela iniciou muito proximo do preço -> ${getActiveString(parInt, activesMapString)} - ${direction}`);
                            notify('To Close', `Vela iniciou muito proximo do preço -> ${getActiveString(parInt, activesMapString)} - ${direction}`);
                        } else {
                            console.log(`${currentTimehhmmss} || Rompeu Noticia -> ${getActiveString(parInt, activesMapString)} - ${direction} / stopOrders = ${stopOrders} / isStopedPar = ${isStopedPar}`);
                            notify('Noticia', `Rompeu -> ${getActiveString(parInt, activesMapString)} - ${direction} / stopOrders = ${stopOrders} / isStopedPar = ${isStopedPar}`);
                        }

                        setConfig(element, 'put', 15);
                    } else if (min != 0 && price <= min) {

                        taxasObj15[index].min = 0
                        direction = 'call'

                        let isStopedPar = false
                        for (let index = 0; index < stopOrdersPares.length; index++) {
                            const stopOrdersPar = stopOrdersPares[index];
                            if (getActiveString(parInt, activesMapString).includes(stopOrdersPar)) {
                                isStopedPar = true
                                break
                            }
                        }

                        let toClose = false
                        if (toCloseM15Obj.has(getActiveString(parInt, activesMapString))) {
                            if (open > toCloseM15Obj.get(getActiveString(parInt, activesMapString)).min) {
                                toClose = true
                            }
                        }

                        if (!stopOrders && !isStopedPar && !toClose) {
                            buyBefor(direction, parInt, 15);
                        } else if (toClose) {
                            console.log(`${currentTimehhmmss} || Vela iniciou muito proximo do preço -> ${getActiveString(parInt, activesMapString)} - ${direction}`);
                            notify('To Close', `Vela iniciou muito proximo do preço -> ${getActiveString(parInt, activesMapString)} - ${direction}`);
                        } else {
                            console.log(`${currentTimehhmmss} || Rompeu Noticia -> ${getActiveString(parInt, activesMapString)} - ${direction} / stopOrders = ${stopOrders} / isStopedPar = ${isStopedPar}`);
                            notify('Noticia', `Rompeu -> ${getActiveString(parInt, activesMapString)} - ${direction} / stopOrders = ${stopOrders} / isStopedPar = ${isStopedPar}`);
                        }
                        setConfig(element, 'call', 15);
                    }
                    break
                }

            }
        }
    }
}

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

    fs.writeFile('config.json', JSON.stringify(config, null, 4), err => {
        // console.log(err || 'Arquivo salvo');
    });
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

function checkOpenedPayoutBeforeBuy(parInt, direction, hourmm) {
    let turboPayout = null;
    let digitalPayout = null;
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

    if (openedMap.has(parInt) && openedMap.get(parInt) && openedMapDigital.has(parInt) && openedMapDigital.get(parInt)) {
        if (digitalPayout && turboPayout && digitalPayout > turboPayout) {
            openOrderDigital(direction, parInt, hourmm);
        } else if (digitalPayout && turboPayout && digitalPayout <= turboPayout) {
            openOrderBinary(direction, parInt, hourmm);
        } else if (turboPayout) {
            openOrderBinary(direction, parInt, hourmm);
        } else if (digitalPayout) {
            openOrderDigital(direction, parInt, hourmm);
        } else {
            openOrderBinary(direction, parInt, hourmm);
        }
    } else if (openedMap.get(parInt)) {
        openOrderBinary(direction, parInt, hourmm);
    } else if (openedMapDigital.has(parInt) && openedMapDigital.get(parInt)) {
        openOrderDigital(direction, parInt, hourmm);
    }
}

function openOrderBinary(direction, parInt, hourmm) {
    console.log(`${currentTimehhmmss} || ${direction} / ${getActiveString(parInt, activesMapString)} / ${amount}`);
    notify('[Order Binaria]', `${direction} / ${getActiveString(parInt, activesMapString)} / ${amount}`);
    buy(amount, parInt, direction, parseInt(moment(moment().format("YYYY-MM-DD ") + hourmm).utcOffset(0).format('X')), 3);
    totalOrderss++;
    openedOrders.push(parInt);
}

function openOrderDigital(direction, parInt, hourmm) {
    console.log(`${currentTimehhmmss} || ${direction} / ${getActiveString(parInt, activesMapString)} / ${amount} / Digital`);
    notify('[Order Digital]', `${direction} / ${getActiveString(parInt, activesMapString)} / ${amount}`);
    buy(amount, parInt, direction, parseInt(moment(moment().format("YYYY-MM-DD ") + hourmm).utcOffset(0).format('X')), 'PT5M');
    totalOrderss++;
    openedOrders.push(parInt);
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
    let amounth = buysss[0] && buysss[0].amount ? buysss[0].amount : amount
    let active = message.msg.active_id
    let direction = message.msg.direction

    let index = openedOrders.indexOf(parseInt(active))
    openedOrders.splice(index, 1)
    profitAmount = message.msg.profit_amount - amounth
    sessionBalance += profitAmount

    if (profitAmount < 0) {
        // if (direction == 'put' && !galePut.includes(active)) {
        //     buyBefor('put', active, 5);
        //     galePut.push(active)
        // } else if (direction == 'call' && !galecCall.includes(active)) {
        //     buyBefor('call', active, 5);
        //     galeCall.push(active)
        // }

        losss++
        StopLoss++
        console.log(`${currentTimehhmmss} || ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario`.red)
        notify('Loss', `${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario`);
        if (doispraum) {
            winss = 0
            console.log(`${currentTimehhmmss} || StopLoss alcançado`.red)
            process.exit(1)
        }
    } else if (profitAmount == 0) {
        console.log(`${currentTimehhmmss} || ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario`.red)
        notify('Empate', `Empate ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario`);
    } else {
        winss++
        StopWin++
        if (doispraum) {
            amount += profitAmount
        }
        console.log(`${currentTimehhmmss} || ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario`.green)
        notify('Wiiin!!', `${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario`);
        setWinss(amount);
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

function positionChangedStuff(message) {
    if (message.msg.status == 'closed') {
        let id = message.msg.id
        buysCount.set(message.msg.active_id, buysCount.get(message.msg.active_id) - 1)
        idsArray.push(id)

        if (soros)
            positionOpenedSoros = false
        if (gale)
            positionOpenedGale = false

        let profitAmount = message.msg.close_profit ? message.msg.close_profit - amount : amount * -1
        let active = message.msg.active_id
        let index = openedOrders.indexOf(parseInt(active))
        openedOrders.splice(index, 1);
        sessionBalance += profitAmount

        if (profitAmount < 0) {
            // amount = amountInitial
            // let expire = parseInt(message.raw_event.instrument_expiration) / 1000
            // if (!m15Expires.includes(expire)) {
            //     if (direction == 'put' && !galePut.includes(active)) {
            //         buyBefor('put', active, 5);
            //         galePut.push(active)
            //     } else if (direction == 'call' && !galecCall.includes(active)) {
            //         buyBefor('call', active, 5);
            //         galeCall.push(active)
            //     }
            // }

            losss++
            console.log(`${currentTimehhmmss} || ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`.red)
            notify('Loss', `${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`);
            console.log(`${currentTimehhmmss} || StopLoss alcançado`.red)
            process.exit(1)
        } else if (profitAmount == 0) {
            console.log(`${currentTimehhmmss} || ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`.red)
            notify('Empate', `Empate ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`);
        } else {
            winss++
            StopWin++
            if (doispraum)
                amount += profitAmount
            console.log(`${currentTimehhmmss} || ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`.green)
            notify('Wiiin!!', `${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Digital`);
            setWinss(amount)
        }
        positionOpenedSoros = false
    } else {

    }
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

axios.post('https://auth.iqoption.com/api/v2/login', {
    identifier: config.login,
    password: config.password
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

function subscribePortifolio() {
    let data = { "name": "portfolio.position-changed", "version": "2.0", "params": { "routingFilters": { "instrument_type": "digital-option", "user_balance_id": userBalanceId } } }

    ws.send(JSON.stringify(messageHeader(data, 'subscribeMessage')))

}