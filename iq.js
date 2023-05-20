const fs = require('fs')
const axios = require('axios')
const moment = require('moment')
const countries = require('./country')
const WebSocket = require('ws')
const colors = require('colors')
//43545240
let fsConfig = fs.readFileSync('config.json')
let config = JSON.parse(fsConfig)

//55099058
const url = 'wss://iqoption.com/echo/websocket'
let userBalanceId = 0
let amount = config.amount
let log = config.log
let logg = config.logg
let valorMinimo = config.valorMinimo
let country = config.filtroPorPais
let topTradersRange = config.topTradersRange
let copyIds = !isNaN(config.copyIds.split(',')[0]) && !isNaN(config.copyIds.split(',')[1]) ? config.copyIds.split(',') : []
let leadersArray = []
let sessionBalance = 0
let runningActives = []
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
let copyBestIdsRange = config.copyBestIdsRange
let payout = config.payout
let tradesPerActive = config.tradesPerActive
let bestIdsLog = config.bestIdsLog
let invertTrades = config.invertTrades
let delaySeconds = config.delaySeconds ? config.delaySeconds : 1

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
    console.log(`WebSocket error: ${error}`)
}

const messageHeader = (body, name) => {
    return { 'name': name, 'msg': body, "request_id": "" }
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
            "request_id": `${msg.active_id ? msg.active_id : msg.instrument_active_id}/${msg.created_at}`
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
            }, "request_id": `${msg.active_id ? msg.active_id : msg.instrument_active_id}/${msg.created_at}`
        }
    }

    if (log)
        console.log(JSON.stringify(data))

    ws.send(JSON.stringify(data))
}

let getLeadersBool = !!topTradersRange || copyIds.length > 0 ? false : true

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

    binarias = config.binarias
    binariasTimes = config.binariasTimes
    digital = config.digital
    digitalTimes = config.digitalTimes
    delaySeconds = config.delaySeconds ? config.delaySeconds : 1

    if (!soros && !gale) {
        amount = config.amount
        amountInitial = amount
    }

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

const getPayout = (type) => {
    return new Promise((resolve, reject) => {
        axios.get(`https://checkpayout.herokuapp.com/payout/${type}`).then((res) => {
            return resolve(res.data)
        }).catch((err) => {
            return resolve(0)
        })
    })
}

setInterval(async () => {
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

}, 5000);


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

const orderMessage = (msg, active, type, id) => {
    return `=== Pos: ${copyIds.length > 0 ? copyIds.indexOf(msg.user_id.toString()) + 1 : leadersArray.length > 0 ? leadersArray.indexOf(msg.user_id) + 1 : undefined} / Amount: ${msg.amount_enrolled} / Country: ${msg.flag} / ${msg.direction ? msg.direction : msg.instrument_dir} / ${type == 'turbo' || type == 'binary' ? getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active : getActiveString(active, activesDigitalMapString) ? getActiveString(active, activesDigitalMapString) : active} / ${type} / ${msg.name} / ${msg.user_id.toString()} / ${moment().format('HH:mm:ss')} / ${id}`.yellow
}

if (topTradersRange) {
    const interval = setInterval(() => {
        if (leadersArray.length == copyIds.length && copyIds.length == 0) {
            console.log('leadersArray is empty!')
        } else {
            clearInterval(interval)
        }
    }, 10000)
}

let cleanned = false

const b = async () => {
    if (!!topTradersRange || copyIds.length > 0) {

        let fsConfig = fs.readFileSync('config.json')
        let config = JSON.parse(fsConfig)
        copyIds = !isNaN(config.copyIds.split(',')[0]) && !isNaN(config.copyIds.split(',')[1]) ? config.copyIds.split(',') : []


        if (log)
            console.log('cleaning...')
        cleanned = true

        leadersArray = []
        getLeadersBool = false
    }
}

setInterval(() => {
    b()
    c()
}, 240000)//60000

const c = async () => {
    if (!!copyBestIdsRange)
        await getBestsTraders()
}

let currentTime

const onMessage = e => {
    if (ws.readyState === WebSocket.OPEN) {
        const message = JSON.parse(e.data)

        if (message.name == 'heartbeat') {
            currentTime = message.msg
        }

        if (logg && message.name != 'instrument-quotes-generated' && message.name != 'api_option_init_all_result')
            console.log('RES = ' + e.data)

        if (sessionBalance >= StopWin) {
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

        if (sessionBalance <= StopLoss * -1) {
            console.log('Stop Loss Alcançado...')
            process.exit(1)
        }

        if (message.name == 'profile' && message.msg) {
            profileStuf(message, 'live-deal-binary-option-placed')
        }

        if (message.name == 'option' && message.status != 0) {
            const active = message.request_id.split('/')[0]
            buysCount.set(parseInt(active), buysCount.get(parseInt(active)) - 1)
            console.log(`Erro ao comprar -> ${getActiveString(`${active}`, activesMapString)}`.red)
            console.log('RES = ' + e.data)
            if (soros)
                positionOpenedSoros = false
            if (gale)
                positionOpenedGale = false
        }

        if (message.name == 'digital-option-placed' && message.status != 2000) {
            const active = message.request_id.split('/')[0]
            buysCount.set(parseInt(active), buysCount.get(parseInt(active)) - 1)
            console.log(`Erro ao comprar -> ${getActiveString(`${active}`, activesMapString)}`.red)
            console.log('RES = ' + e.data)
            if (soros)
                positionOpenedSoros = false
            if (gale)
                positionOpenedGale = false
        }

        if (message.name == 'leaderboard-deals-client') {
            let result = message.msg.result.positional
            for (var [key, value] of Object.entries(result)) {
                leadersArray.push(value.user_id)
            }
        }

        if (message.name == 'option-closed') {
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

        if (!!topTradersRange && cleanned)
            if (!getLeadersBool) {
                getLeadersBool = true
                getLeaders(ws)
            }

        let diff
        if (message.name == "live-deal-binary-option-placed" || message.name == "live-deal-digital-option") {
            let msg = message.msg
            var a = moment(currentTime);
            var b = moment(msg.created_at);
            diff = a.diff(b)
        }

        if ((message.name == "live-deal-binary-option-placed" || message.name == "live-deal-digital-option")) {
            let msg = message.msg
            if (message.msg.amount_enrolled >= valorMinimo) {
                if (message.name == "live-deal-binary-option-placed") {
                    var b = moment(msg.expiration);
                    var a = moment(currentTime);
                    const diffObj = millisToMinutesAndSeconds(b.diff(a))

                    let expirationM
                    if ((diffObj.minutes > 4) || (diffObj.minutes == 4 && diffObj.seconds > 30)) {
                        expirationM = 'M5'
                    } else if ((diffObj.minutes == 3 && diffObj.seconds > 30) || (diffObj.minutes == 4 && diffObj.seconds <= 30)) {
                        expirationM = 'M4'
                    } else if ((diffObj.minutes == 2 && diffObj.seconds > 30) || (diffObj.minutes == 3 && diffObj.seconds <= 30)) {
                        expirationM = 'M3'
                    } else if ((diffObj.minutes == 1 && diffObj.seconds > 30) || (diffObj.minutes == 2 && diffObj.seconds <= 30)) {
                        expirationM = 'M2'
                    } else if (diffObj.minutes == 0 || (diffObj.minutes == 1 && diffObj.seconds <= 30)) {
                        expirationM = 'M1'
                    }

                    if (!binarias || !binariasTimes.includes(expirationM)) {
                        return
                    }
                }

                if (payout && !checkPayout(msg))
                    return
                if (soros && positionOpenedSoros)
                    return
                if (gale && positionOpenedGale)
                    return
                if (!!topTradersRange && !leadersArray.includes(msg.user_id))
                    return
                if (copyIds.length > 0 && !copyIds.includes(msg.user_id.toString()))
                    return
                if (buysCount.get(msg.instrument_active_id ? msg.instrument_active_id : msg.active_id) >= tradesPerActive)
                    return


                if (!buysCount.has(msg.instrument_active_id ? msg.instrument_active_id : msg.active_id)) {
                    buysCount.set(msg.instrument_active_id ? msg.instrument_active_id : msg.active_id, 1)
                } else {
                    buysCount.set(msg.instrument_active_id ? msg.instrument_active_id : msg.active_id, buysCount.get(msg.instrument_active_id ? msg.instrument_active_id : msg.active_id) + 1)
                }

                let direction = msg.direction ? msg.direction : msg.instrument_dir
                let expiration = msg.expiration ? msg.expiration : msg.instrument_expiration
                expiration /= 1000

                // amount = message.msg.amount_enrolled
                if (invertTrades) {
                    if (direction == 'put') {
                        direction = 'call'
                    } else {
                        direction = 'put'
                    }
                }

                console.log(orderMessage(msg, msg.active_id ? msg.active_id : msg.instrument_active_id, msg.option_type ? msg.option_type : msg.expiration_type, msg.option_id ? msg.option_id : msg.position_id))

                if (diff > delaySeconds * 1000){
                    console.log(`Operação cancelada -> Delay > ${delaySeconds} segundos`.red)
                    return
                }

                buy(amount, msg.active_id ? msg.active_id : msg.instrument_active_id, direction, expiration, msg.option_type ? msg.option_type == "turbo" ? 3 : 1 : msg.expiration_type, msg)
                checkBuy(`${msg.active_id ? msg.active_id : msg.instrument_active_id}/${msg.created_at}`)

                if (soros)
                    positionOpenedSoros = true
                if (gale)
                    positionOpenedGale = true
            }
        }
    }
}

const checkBuy = (activeTime) => {
    buyUsersIds.push(activeTime)
    setTimeout(() => {
        if (buyUsersIds.includes(buyUsersIds)) {
            if (soros)
                positionOpenedSoros = false
            if (gale)
                positionOpenedGale = false

            const active = activeTime.split('/')[0]
            buysCount.set(parseInt(active), buysCount.get(parseInt(active)) - 1)
            console.log(`Erro ao comprar -> ${getActiveString(`${active}`, activesMapString)}`.red)
            const index = buyUsersIds.indexOf(activeTime);
            if (index > -1) {
                buyUsersIds.splice(index, 1);
            }
        }
    }, 6000);
}

const checkPayout = msg => {
    if (payoutMap.has(msg.option_type ? msg.option_type : 'digital')) {
        if (payoutMap.get(msg.option_type ? msg.option_type : 'digital').has(msg.active_id ? msg.active_id : msg.instrument_active_id)) {
            const activePayout = payoutMap.get(msg.option_type ? msg.option_type : 'digital').get(msg.active_id ? msg.active_id : msg.instrument_active_id)
            if (activePayout >= payout)
                return true
            else
                return false
        } else {
            return false
        }
    }
}

function optionClosed(message) {
    const optionId = message.msg.option_id
    if (!idsArray.includes(optionId)) {
        let active = message.msg.active_id
        buysCount.set(active, buysCount.get(active) - 1)
        idsArray.push(optionId)
        if (soros)
            positionOpenedSoros = false
        if (gale)
            positionOpenedGale = false

        let profitAmount = message.msg.profit_amount - amount

        if (soros && profitAmount > 0 && sorosCount < sorosLevel) {
            amount = message.msg.profit_amount.toFixed(2)
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
            console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / ID: ${optionId} / Binario / ${moment().format('HH:mm:ss')}`.red)
        else
            console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / ID: ${optionId} / Binario / ${moment().format('HH:mm:ss')}`.green)
    }
}

function positionChangedStuff(message) {
    if (message.msg.status == 'closed') {
        let id = message.msg.id
        if (!idsArray.includes(id)) {
            buysCount.set(message.msg.active_id, buysCount.get(message.msg.active_id) - 1)
            idsArray.push(id)

            if (soros)
                positionOpenedSoros = false
            if (gale)
                positionOpenedGale = false

            let profitAmount = message.msg.close_profit ? message.msg.close_profit - amount : amount * -1
            let active = message.msg.active_id

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
        }
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
    ['EURAUD', 108],
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
    if (!!copyBestIdsRange)
        await getBestsTraders()
    await doLogin(ssid)
}

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
        loginAsync(ssid)
    }).catch(function (err) {
        if (err)
            console.log('Erro ao se conectar... Tente novamente')
    })
}

const doLogin = (ssid) => {
    return new Promise((resolve, reject) => {
        if (ws.readyState === WebSocket.OPEN) {
            if (log)
                console.log(JSON.stringify({ 'name': 'ssid', 'msg': ssid, "request_id": "" }))
            ws.send(JSON.stringify({ 'name': 'ssid', 'msg': ssid, "request_id": "" }))
            resolve()
        }
    })
}

axios.post('https://auth.iqoption.com/api/v2/login', {
    identifier: config.login,
    password: config.password
}).then((response) => {
    ssid = response.data.ssid
    loginAsync(ssid)
}).catch(function (err) {
    if (err)
        console.log('Erro ao se conectar... Tente novamente')
})

const getBestsTraders = () => {
    return new Promise((resolve) => {
        copyIds = !isNaN(config.copyIds.split(',')[0]) || !isNaN(config.copyIds.split(',')[1]) ? config.copyIds.split(',') : []
        axios.get('https://besttraders.herokuapp.com/besttraders').then(res => {
            for (let index = 0; index < copyBestIdsRange; index++) {
                const element = res.data[index];
                copyIds.push(element)
            }
            resolve()
        })
    })
}

function subscribePortifolio() {
    let data = { "name": "portfolio.position-changed", "version": "2.0", "params": { "routingFilters": { "instrument_type": "digital-option", "user_balance_id": userBalanceId } } }

    ws.send(JSON.stringify(messageHeader(data, 'subscribeMessage')))
}