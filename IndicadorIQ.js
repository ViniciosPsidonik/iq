
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
        axios.get(`http://localhost:3000/payout/${type}`).then((res) => {
            return resolve(res.data)
        }).catch((err) => {
            return resolve(0)
        })
    })
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


console.log(taxasObj);


let stopOrders = false
let stopOrdersPares = []

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

    if (message.name == 'candles') {
        let candles = message.msg.candles
        let open = []
        let high = []
        let close = []
        let low = []

        if (candles) {
            for (let index = 0; index < candles.length - 1; index++) {
                const candle = candles[index];

                open.push(candle.open)
                high.push(candle.max)
                close.push(candle.close)
                low.push(candle.min)
            }

            let velas3 = { open, high, close, low }

            if (require('technicalindicators').threeblackcrows(velas3)) {
                result = 'PUT'
                return
            }
            if (require('technicalindicators').threewhitesoldiers(velas3)) {
                result = 'CALL'
                return

            }
            if (require('technicalindicators').eveningstar(velas3)) {
                result = 'PUT'
                return

            }
            if (require('technicalindicators').morningstar(velas3)) {
                result = 'CALL'
                return
            }

            open = []
            high = []
            close = []
            low = []

            for (let index = 0; index < candles.length - 2; index++) {
                const candle = candles[index];

                open.push(candle.open)
                high.push(candle.max)
                close.push(candle.close)
                low.push(candle.min)
            }

            let velas2 = { open, high, close, low }

            if (require('technicalindicators').bullishengulfingpattern(velas2)) {
                result = 'CALL'
                return
            }
            if (require('technicalindicators').bearishengulfingpattern(velas2)) {
                result = 'PUT'
                return
            }
        }

        result = ''
        return

    }

    if (message.name != 'instrument-quotes-generated') {
        // console.log('RES = ' + e.data);
    }

    if (message.name == 'heartbeat' || message.name == 'timesync') {
        currentTime = message.msg
        currentTimehhmm = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').format("HH:mm")
        currentTimemm = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').format("mm")
        currentTimess = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').format("ss")
        currentTimemmssDate = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').format("YYYY-MM-DD HH:mm:ss")
        currentTimehhmmss = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').format("HH:mm:ss")
        getCandle(active)

    }

    if (message.name == 'profile' && message.msg) {
        profileStuf(message, 'live-deal-binary-option-placed')
    }

}

let active = 1
let result = ''
const cors = require('cors')
var express = require('express')
var app = express()
app.use(cors({ origin: '*' }))

app.get('/getsignal/:active', function (req, res) {

    active = parseInt(req.params.active)

    console.log(active);
    console.log(result);
    console.log('=========');

    res.send(result)
})

setInterval(() => {
    if (result)
        console.log(result);
}, 5000);

const PORT = process.env.PORT || 3500
app.listen(PORT)

function getCandle(active_id) {
    let data = {
        "name": "get-candles",
        "version": "2.0",
        "body": {
            "active_id": active_id,
            "size": 60 * 1,
            "to": currentTime,
            "count": 4,
        }
    };

    if (ws.readyState === WebSocket.OPEN) {
        // console.log(JSON.stringify(messageHeader(data, 'sendMessage', active_id + '/' + time)));
        ws.send(JSON.stringify(messageHeader(data, 'sendMessage', 1 + '/' + 1)));
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