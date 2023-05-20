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

let idsArray = []

let payoutMap = new Map()
let buysCount = new Map()
let buyUsersIds = []

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

        data = {
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

setInterval(() => {
    if (taxasObj.length > 0) {
        for (let index = 0; index < taxasObj.length; index++) {
            const element = taxasObj[index];
            let parInt = activesMapString.get(element.par)
            getCandle(parInt)
        }
    }
}, 500);

let taxasArray = taxas.split(';')
for (let index = 0; index < taxasArray.length; index++) {
    const taxa = taxasArray[index];
    let taxaSplited = taxa.split(',')
    taxasObj.push({
        par: taxaSplited[0],
        max: parseFloat(taxaSplited[1]),
        min: parseFloat(taxaSplited[2]),
    })
}

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

const onMessage = e => {
    // if (ws.readyState === WebSocket.OPEN) {
    const message = JSON.parse(e.data)

    if (message.name == 'instrument-quotes-generated') {
        // console.log('RES = ' + e.data);
    }

    // if (message.name != 'instrument-quotes-generated' && message.name != 'api_option_init_all_result')
    // console.log('RES = ' + e.data)

    if (winss >= 2) {
        console.log('Stop Win Alcançado...')
        process.exit(1)
    }

    if (buyUsersIds.includes(message.request_id)) {
        if (log)
            console.log('RED = ' + e.data)
        const index = buyUsersIds.indexOf(message.request_id);
        if (index > -1) {
            buyUsersIds.splice(index, 1);
        }
    }

    if (losss >= 2) {
        console.log('Stop Loss Alcançado...')
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
        console.log(`Erro ao comprar -> ${getActiveString(`${active}`, activesMapString)} / ${currentTimemmssDate}`.red)
        console.log('RES = ' + e.data)
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
        console.log(`Erro ao comprar -> ${getActiveString(`${active}`, activesMapString)} / ${currentTimemmssDate}`.red)
        console.log('RES = ' + e.data)
        if (soros)
            positionOpenedSoros = false
        if (gale)
            positionOpenedGale = false
        buysss = []
    }

    if (message.name == 'leaderboard-deals-client') {
        let result = message.msg.result.positional
        for (var [key, value] of Object.entries(result)) {
            leadersArray.push(value.user_id)
        }
    }

    if (message.name == 'option-closed') {
        // console.log('RES = ' + e.data);
        optionClosed(message)
    }

    if (message.name == 'position-changed') {
        positionChangedStuff(message)
    }

    if (message.name == "live-deal-binary-option-placed") {
        if (message.msg.option_type == 'turbo') {
            if (!runningActives.includes(message.msg.active_id))
                runningActives.push(message.msg.active_id)
        } else {
            if (!runningActivesBinary.includes(message.msg.active_id))
                runningActivesBinary.push(message.msg.active_id)
        }
    }

    if (message.name == "live-deal-digital-option") {
        if (message.msg.expiration_type == 'PT1M') {
            if (!runningActivesDigital.includes(message.msg.instrument_active_id))
                runningActivesDigital.push(message.msg.instrument_active_id)
        } else {
            if (!runningActivesDigitalFive.includes(message.msg.instrument_active_id))
                runningActivesDigitalFive.push(message.msg.instrument_active_id)
        }
    }

    if (message.name == 'heartbeat' || message.name == 'timesync') {
        currentTime = message.msg
        currentTimehhmm = moment.unix(currentTime / 1000).utcOffset(-3).format("HH:mm")
        currentTimemm = moment.unix(currentTime / 1000).utcOffset(-3).format("mm")
        currentTimemmssDate = moment.unix(currentTime / 1000).utcOffset(-3).format("YYYY-MM-DD HH:mm:ss")
        // if (log)
        // console.log(currentTimemmssDate)
        // getCandle()
    }

    // if (currentTimemmssDate) {
    //     let timeSeconds = parseInt(currentTimemmssDate.substring(currentTimemmssDate.length - 2, currentTimemmssDate.length));
    //     let minuteTimeInt = parseInt(currentTimemmssDate.substring(currentTimemmssDate.length - 4, currentTimemmssDate.length - 3));
    //     console.log(currentTimemmssDate);
    //     console.log(minuteTimeInt);
    //     console.log(timeSeconds);
    // }


    if (message.name == 'candles') {
        let candles = message.msg.candles
        let price = candles[0].close

        // console.log(price)
        // console.log('----------------');

        for (let index = 0; index < taxasObj.length; index++) {
            const element = taxasObj[index];
            let parInt = activesMapString.get(element.par)
            let max = element.max
            let min = element.min

            if (verpar && parseInt(message.request_id) == activesMapString.get(verpar)) {
                console.log(price);
            }

            let direction

            // console.log(message);
            // console.log(parInt);
            // console.log(parseInt(message.request_id));
            // console.log('----------------');

            if (parseInt(message.request_id) == parInt && !openedOrders.includes(parInt) && !notOrder.includes(parInt)) {
                if (max != 0 && price >= max) {

                    taxasObj[index].max = 0
                    direction = 'put'

                    buyBefor(direction, parInt);
                } else if (min != 0 && price <= min) {

                    taxasObj[index].min = 0
                    direction = 'call'

                    buyBefor(direction, parInt);
                }
            }

        }

    }

    // }
}

setInterval(() => {
    // axios.get('https://checkpayout.herokuapp.com/opened').then(res => {
    //     openedMap = res.data.openedMap
    // })
}, 5000);

let totalOrderss = 0

function buyBefor(direction, parInt) {
    let timeFrame = 5
    let timeInt = parseInt(currentTimehhmm.substring(currentTimehhmm.length - 2, currentTimehhmm.length));
    let timeIntLast = parseInt(currentTimehhmm.substring(currentTimehhmm.length - 1, currentTimehhmm.length));
    let timeSeconds = parseInt(currentTimemmssDate.substring(currentTimemmssDate.length - 2, currentTimemmssDate.length));
    let minuteTimeInt = parseInt(currentTimemmssDate.substring(currentTimemmssDate.length - 4, currentTimemmssDate.length - 3));

    let resto = timeInt % timeFrame;
    if (resto != 0) {
        timeFrame = timeFrame - resto;
    }
    let hourmm

    if (minuteTimeInt == 9 && timeSeconds >= 30 || minuteTimeInt == 4 && timeSeconds >= 30) {
        hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(timeFrame + 5, 'm').format(" HH:mm");
    } else {
        hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(timeFrame, 'm').format(" HH:mm");
    }


    // console.log(moment(moment().format("YYYY-MM-DD ") + currentTimehhmm).utcOffset(0).add(1, 'm').format('HH:mm'))
    // console.log(moment(moment().format("YYYY-MM-DD ") + currentTimehhmm).utcOffset(0).add(1 * 2, 'm').format('HH:mm'))
    // console.log(moment(moment().format("YYYY-MM-DD ") + currentTimehhmm).utcOffset(0).add(1 * 3, 'm').format('HH:mm'))
    if (totalOrderss < 2) {
        console.log(`${direction} / ${getActiveString(parInt, activesMapString)} / ${amount} / ${currentTimemmssDate}`);

        buy(amount, parInt, direction, parseInt(moment(moment().format("YYYY-MM-DD ") + hourmm).utcOffset(0).format('X')), 3);
        totalOrderss++

        openedOrders.push(parInt)
    } else {
        console.log(`Erro ao comprar totalOrderss > ${totalOrderss} / ${currentTimemmssDate}`);
    }

}

let notOrder = []

function getCandle(active_id) {
    let data = {
        "name": "get-candles",
        "version": "2.0",
        "body": {
            "active_id": active_id,
            "size": 60 * 5,
            "to": currentTime,
            "count": 1,
        }
    };
    if (ws.readyState === WebSocket.OPEN)
        ws.send(JSON.stringify(messageHeader(data, 'sendMessage', active_id)));
}

function optionClosed(message) {
    let amounth = buysss[0] && buysss[0].amount ? buysss[0].amount : amount
    let active = message.msg.active_id

    let index = openedOrders.indexOf(parseInt(active))
    openedOrders.splice(index, 1)
    profitAmount = message.msg.profit_amount - amounth
    sessionBalance += profitAmount

    if (profitAmount < 0) {
        amount = amountInitial
        losss++
        notOrder.push(active)
        console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario / ${currentTimemmssDate}`.red)
        process.exit(1)
    } else if (profitAmount == 0) {
        console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario / ${currentTimemmssDate}`.red)
    } else {
        winss++
        amount += profitAmount
        console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario / ${currentTimemmssDate}`.green)
    }
    positionOpenedSoros = false
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
        openedOrders.splice(active, 1);
        if (soros && profitAmount > 0 && sorosCount < sorosLevel) {
            amount = message.msg.close_profit.toFixed(2)
            sorosCount++
        } else if (soros && profitAmount > 0) {
            sorosCount = 0
            amount = parseFloat(amountInitial)
        }

        if (gale && profitAmount < 0 && galeCount < galeLevel && profitAmount != 0) {
            amount *= galeFactor
            galeCount++
        } else if (gale && profitAmount != 0) {
            galeCount = 0
            amount = parseFloat(amountInitial)
        }
        sessionBalance += profitAmount

        if (profitAmount < 0)
            console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesDigitalMapString)} / ID: ${id} / Digital / ${moment().format('HH:mm:ss')}`.red)
        else
            console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesDigitalMapString)} / ID: ${id} / Digital / ${moment().format('HH:mm:ss')}`.green)
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
ws.onopen = onOpen
ws.onerror = onError
ws.onmessage = onMessage

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
    ['AUDCHF', 943],
    ['AUDJPY', 101],
    ['AUDNZD', 944],
    ['AUDUSD', 99],
    ['CADCHF', 107],
    ['EURGBP', 2],
    ['EURJPY', 4],
    ['EURUSD', 1],
    ['EURCAD', 105],
    ['GBPAUD', 104],
    ['GBPCAD', 102],
    ['GBPJPY', 3],
    ['GBPNZD', 947],
    ['GBPUSD', 5],
    ['NZDUSD', 8],
    ['USDCAD', 100],
    ['USDJPY', 6],
    ['USDNOK', 168],
    ['USDCHF', 72],
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

axios.post('https://auth.iqoption.com/api/v2/login', {
    identifier: config.login,
    password: config.password
}).then((response) => {
    ssid = response.data.ssid
    console.log(ssid);
    loginAsync(ssid)
}).catch(function (err) {
    if (err)
        console.log('Erro ao se conectar... Tente novamente')
})

function subscribePortifolio() {
    let data = { "name": "portfolio.position-changed", "version": "2.0", "params": { "routingFilters": { "instrument_type": "digital-option", "user_balance_id": userBalanceId } } }

    ws.send(JSON.stringify(messageHeader(data, 'subscribeMessage')))

}