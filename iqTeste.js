const fs = require('fs')
const axios = require('axios')
const moment = require('moment')
const countries = require('./country')
const WebSocket = require('ws')
const colors = require('colors')
const Rank = require('./mongo')

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
let buysMap = new Map()
let buysMapDigital = new Map()
let sessionBalance = 0
let runningActives = []
let runningActivesBinary = []
let runningActivesDigital = []
let runningActivesDigitalFive = []
let StopLoss = config.StopLoss
let StopWin = config.StopWin
let soros = config.soros
let ssid
let loggg
let amountInitial = amount
let sorosCount = 0
let positionOpenedSoros
let sorosLevel = config.sorosLevel
let binarias = config.binarias
let binariasTimes = 'M1'
let digital = config.digital
let digitalTimes = 'M1'
let copyBestIdsRange = config.copyBestIdsRange
let payout = config.payout

let payoutMap = new Map()
let digitalPayoutMap = new Map()

let buysCount = new Map()
let buysCountDigital = new Map()

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

const subscribeLiveDeal = (name, active_id, type, expirationTime) => {
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
    if (log)
        console.log(JSON.stringify(messageHeader(data, 'subscribeMessage')));
    ws.send(JSON.stringify(messageHeader(data, 'subscribeMessage')))
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

const buy = (amount, active_id, direction, expired, type) => {
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

    if (log)
        console.log(JSON.stringify(data))

    ws.send(JSON.stringify(data))
}

let getLeadersBool = !!topTradersRange || copyIds.length > 0 ? false : true

const getMapByValue = (map, valueToFind) => {
    for (var [key, value] of map) {
        if (value == valueToFind)
            return key
    }

    return false
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
    StopLoss = config.StopLoss
    StopWin = config.StopWin
    copy100Ids = config.copy100Ids
    copyBestIdsRange = config.copyBestIdsRange

    if (!soros) {
        amount = config.amount
        amountInitial = amount
    }

    if (config.cleanUp) {
        runningActives = []
        runningActivesBinary = []
        runningActivesDigital = []
        runningActivesDigitalFive = []
        loginAsync(ssid)
    }

    if (loggingg == false) {
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
    loggingg = false
    if (config.loggg) {
        console.log('Turbo: ' + runningActives.length)
        console.log('Binary: ' + runningActivesBinary.length)
        console.log('Digital: ' + runningActivesDigital.length)
        console.log('DigitalFive: ' + runningActivesDigitalFive.length)
        console.log(`copyIds:  ${copyIds.length > 0 ? copyIds.length : 0}`)
        console.log(`leadersArray:  ${!!leadersArray ? leadersArray.length : 0}`)
        console.log(`positionOpenedSoros: ${positionOpenedSoros}`);
        console.log('===================')
    }
    
}, 5000)


setInterval(() => {
    runningActives = []
    runningActivesBinary = []
    runningActivesDigital = []
    runningActivesDigitalFive = []
}, 300000);

const getActiveString = (active, map) => {
    for (var [key, value] of map) {
        if (value == active) {
            return key
        }
    }
}

const orderMessage = (msg, active, type) => {
    return `=== Pos: ${copyIds.length > 0 ? copyIds.indexOf(msg.user_id.toString()) + 1 : leadersArray.length > 0 ? leadersArray.indexOf(msg.user_id) + 1 : undefined} / Amount: ${msg.amount_enrolled} / Country: ${msg.flag} / ${msg.direction ? msg.direction : msg.instrument_dir} / ${type == 'turbo' || type == 'binary' ? getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active : getActiveString(active, activesDigitalMapString) ? getActiveString(active, activesDigitalMapString) : active} / ${type} / ${msg.name} / ${moment().format('HH:mm:ss')}`
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
let minAux

let buynow

let call = 0
let put = 0

let expire

let loggingg = false
const onMessage = e => {
    if (ws.readyState === WebSocket.OPEN) {
        loggingg = true
        const message = JSON.parse(e.data)
        if (message.name == 'heartbeat') {
            currentTime = message.msg
            let currentTimeMinute = moment.unix(currentTime / 1000).utcOffset(0).format("ss")
            if (currentTimeMinute == '00') {
                buynow = true
            }
            console.log('call= ' + call + ' put= ' + put + ' / ' + currentTimeMinute);
        }

        if (logg && message.name != 'instrument-quotes-generated')
            console.log('RES = ' + e.data)

        if (sessionBalance >= StopWin) {
            console.log('Stop Win Alcançado...')
            process.exit(1)
        }

        if (sessionBalance <= StopLoss * -1) {
            console.log('Stop Loss Alcançado...')
            process.exit(1)
        }

        if (message.name == 'api_option_init_all_result') {
            payoutStuff(message)
        }

        if (message.name == 'instrument-quotes-generated') {
            payoutDigitalStuff(message)
        }

        if (message.name == 'profile' && message.msg) {
            profileStuf(message, 'live-deal-binary-option-placed')
            return
        }

        if (message.name == 'socket-option-opened') {
            buysMap.set(message.msg.id, message.msg.active_id)
            return
        }

        if (message.name == 'position-changed') {
            positionChangedStuff(message)
            return
        }

        if (message.name == 'option' && message.status != 0) {
            buysCount.set(message.request_id, buysCount.get(parseInt(message.request_id)) - 1)
            console.log(`Erro ao comprar -> ${getActiveString(`${message.request_id}`, activesMapString)}`.red)
            console.log('RES = ' + e.data)
        }

        if (message.name == 'digital-option-placed' && message.status != 2000) {
            buysCount.set(message.request_id, buysCount.get(parseInt(message.request_id)) - 1)
            console.log(`Erro ao comprar -> ${getActiveString(`${message.request_id}`, activesMapString)}`.red)
            console.log('RES = ' + e.data)
        }

        if (message.name == 'leaderboard-deals-client') {
            let result = message.msg.result.positional
            for (var [key, value] of Object.entries(result)) {
                leadersArray.push(value.user_id)
            }
            return
        }

        if (message.name == 'option-closed') {
            optionClosed(message)
            return
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
            let msg = message.msg
            const direction = msg.direction ? msg.direction : msg.instrument_dir
            if (direction == 'put') {
                put++
            } else {
                call++
            }
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
        let msg = message.msg
        if (message.name == "live-deal-binary-option-placed" || message.name == "live-deal-digital-option") {
            var a = moment(currentTime);
            var b = moment(msg.created_at);
            diff = a.diff(b)
        }

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
                let msg = message.msg
                const direction = msg.direction ? msg.direction : msg.instrument_dir
                if (direction == 'put') {
                    put++
                } else {
                    call++
                }
                expire = msg.expiration ? msg.expiration : msg.instrument_expiration
            }

        }

        if (buynow && call != put) {
            buynow = false
            let msg = message.msg
            let currentTimeMinute = moment.unix(expire / 1000).utcOffset(0).format("mm:ss")
            console.log((call > put ? 'call' : 'put').green);
            // console.log(orderMessage(msg, msg.active_id ? msg.active_id : msg.instrument_active_id, msg.option_type ? msg.option_type : msg.expiration_type))
            buy(amount, 1, call > put ? 'call' : 'put', expire / 1000, 3)
            call = 0
            put = 0
        } else if (buynow) {
            buynow = false
            call = 0
            put = 0
        }
    }
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
            // console.log(`Erro ao checar Payout -> ${getActiveString(msg.active_id ? msg.active_id : msg.instrument_active_id, activesMapString)} Tentando novamente...`.red);
            subs('live-deal-binary-option-placed')
            return false
        }
    }
}

function payoutDigitalStuff(message) {
    const quotes = message.msg.quotes
    const active = message.msg.active
    for (let index = 0; index < quotes.length; index++) {
        const symbols = quotes[index].symbols
        if (!!symbols)
            for (let index1 = 0; index1 < symbols.length; index1++) {
                if (symbols[index1].includes('SPT')) {
                    let ask = quotes[index].price.ask
                    let payout = ((100 - ask) * 100) / ask
                    digitalPayoutMap.set(active, payout.toFixed(2))
                    break
                }
            }
    }
    payoutMap.set('digital', digitalPayoutMap)
}

function payoutStuff(message) {
    let result = message.msg.result
    let payoutHere = new Map()
    if (result && result.binary)
        Object.entries(result.binary.actives).forEach(([key1, value]) => {
            if (value.name) {
                const activeString = value.name.substring(6, value.name.length)
                if (activesMapString.has(activeString)) {
                    const active = activesMapString.get(activeString)
                    payoutHere.set(active, 100 - value.option.profit.commission)
                }
            }
        })
    payoutMap.set('binary', payoutHere)
    payoutHere = new Map()
    if (result && result.turbo)
        Object.entries(result.turbo.actives).forEach(([key1, value]) => {
            const activeString = value.name.substring(6, value.name.length)
            if (activesMapString.has(activeString)) {
                const active = activesMapString.get(activeString)
                payoutHere.set(active, 100 - value.option.profit.commission)
            }
        })
    payoutMap.set('turbo', payoutHere)
}

function optionClosed(message) {
    let optionId = message.msg.option_id
    if (buysMap.has(optionId)) {
        buysCount.set(buysMap.get(optionId), buysCount.get(parseInt(buysMap.get(optionId))) - 1)
        positionOpenedSoros = false
        let profitAmount = message.msg.profit_amount - amount
        let active = message.msg.active
        if (soros && profitAmount > 0 && sorosCount < sorosLevel) {
            amount = message.msg.profit_amount.toFixed(2)
            sorosCount++
        }
        else if (soros) {
            sorosCount = 0
            amount = parseFloat(amountInitial)
        }

        sessionBalance += profitAmount

        if (profitAmount < 0)
            console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / ID: ${optionId} / Binario / ${moment().format('HH:mm:ss')}`.red)
        else
            console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / ID: ${optionId} / Binario / ${moment().format('HH:mm:ss')}`.green)

        buysMap.delete(optionId)
    }
}

function positionChangedStuff(message) {
    if (message.msg.status != 'closed') {
        buysMapDigital.set(message.msg.id, message.msg.active_id)
    }
    else {
        let id = message.msg.id
        if (buysMapDigital.has(id)) {
            buysCount.set(message.msg.active_id, buysCount.get(message.msg.active_id) - 1)
            positionOpenedSoros = false
            let profitAmount = message.msg.close_profit ? message.msg.close_profit - amount : amount * -1
            let active = message.msg.active_id

            if (soros && profitAmount > 0 && sorosCount < sorosLevel) {
                amount = message.msg.close_profit.toFixed(2)
                sorosCount++
            }
            else if (soros) {
                sorosCount = 0
                amount = parseFloat(amountInitial)
            }

            sessionBalance += profitAmount

            if (profitAmount < 0)
                console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesDigitalMapString)} / ID: ${id} / Digital / ${moment().format('HH:mm:ss')}`.red)
            else
                console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesDigitalMapString)} / ID: ${id} / Digital / ${moment().format('HH:mm:ss')}`.green)

            buysMapDigital.delete(id)
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

    subs(name)

}

function subs(name) {
    if (binarias) {
        for (let i = 0; i < otcActives.length; i++) {
            subscribeLiveDeal(name, otcActives[i], 'turbo')
        }

        if (binariasTimes.includes("M5+"))
            for (let i = 0; i < otcActives.length; i++) {
                subscribeLiveDeal(name, otcActives[i], 'binary')
            }
    }
    if (digital) {
        name = 'live-deal-digital-option'
        if (digitalTimes.includes("M1"))
            for (let i = 0; i < otcActivesDigital.length; i++) {
                subscribeLiveDeal(name, otcActivesDigital[i], 'digital', '1')
            } logg
        if (digitalTimes.includes("M5"))
            for (let i = 0; i < otcActivesDigital.length; i++) {
                subscribeLiveDeal(name, otcActivesDigital[i], 'digital', '5')
            }

        if (digitalTimes.includes("M15"))
            for (let i = 0; i < otcActivesDigital.length; i++) {
                subscribeLiveDeal(name, otcActivesDigital[i], 'digital', '15')
            }
    }

    if (binarias) {
        name = 'live-deal-binary-option-placed'
        for (let i = 0; i < activesMap.length; i++) {
            subscribeLiveDeal(name, activesMap[i], 'turbo')
        }
        if (binariasTimes.includes("M5+"))
            for (let i = 0; i < activesMap.length; i++) {
                subscribeLiveDeal(name, activesMap[i], 'binary')
            }
    }
    if (digital) {
        name = 'live-deal-digital-option'
        if (digitalTimes.includes("M1"))
            for (let i = 0; i < activesMapDigital.length; i++) {
                subscribeLiveDeal(name, activesMapDigital[i], 'digital', '1')
            }

        if (digitalTimes.includes("M5"))
            for (let i = 0; i < activesMapDigital.length; i++) {
                subscribeLiveDeal(name, activesMapDigital[i], 'digital', '5')
            }

        if (digitalTimes.includes("M15"))
            for (let i = 0; i < activesMapDigital.length; i++) {
                subscribeLiveDeal(name, activesMapDigital[i], 'digital', '15')
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

const activesMap = [1]
const activesMapDigital = [1]
const otcActives = [1]
const otcActivesDigital = [1]

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

const checkLogin = setInterval(() => {
    if (runningActives.length == 0 && runningActivesBinary == 0 && runningActivesDigital == 0 && runningActivesDigitalFive == 0) {
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
}, 5000);

const doLogin = (ssid) => {
    return new Promise((resolve, reject) => {
        if (ws.readyState === WebSocket.OPEN) {
            if (loggg)
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
    return new Promise((resolve, reject) => {
        Rank.find({ win: { $gte: 50 } }).limit(parseInt(copyBestIdsRange)).sort([['percentageWins', -1], ['totalTrades', -1]]).exec((err, docs) => {
            if (log)
                console.log(docs)
            copyIds = !isNaN(config.copyIds.split(',')[0]) && !isNaN(config.copyIds.split(',')[1]) ? config.copyIds.split(',') : []
            for (let index = 0; index < docs.length; index++) {
                const element = docs[index];
                copyIds.push(`${element.userId}`)
            }
            resolve()
        })
    })
}

function subscribePortifolio() {
    let data = { "name": "portfolio.position-changed", "version": "2.0", "params": { "routingFilters": { "instrument_type": "digital-option", "user_balance_id": userBalanceId } } }

    ws.send(JSON.stringify(messageHeader(data, 'subscribeMessage')))
}