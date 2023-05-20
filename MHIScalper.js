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
let percentageScalper = config.percentageScalper
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

let idsArray = []

let payoutMap = new Map()
let buysCount = new Map()
let buyUsersIds = []

const getPayout = (type) => {
    return new Promise((resolve, reject) => {
        axios.get(`https://checkpayout.herokuapp.com/payout/${type}`).then((res) => {
            return resolve(res.data)
        }).catch((err) => {
            return resolve(0)
        })
    })
}

setInterval(() => {
    intervalGetPayout()
}, 5000);

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

if (config.pass != 'senhaloka')
    process.exit()

const onOpen = () => {
    if (log)
        console.log(`Connected with websocket..`)
}

const onError = error => {
    console.log(`WebSocket error: ${error}`)
}

const messageHeader = (body, name, req = "") => {
    return { 'name': name, 'msg': body, "request_id": req.toString() }
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
            "request_id": ``
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
            }, "request_id": ``
        }
    }

    // console.log(JSON.stringify(data))
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
    percentageScalper = config.percentageScalper
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
    showSchedules = config.showSchedules

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


        if (log)
            console.log('cleaning...')
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
let velas = new Map()

let minAux = moment.unix(currentTime / 1000).utcOffset(-3).add(1, 's').format("mm")

const onMessage = e => {
    if (ws.readyState === WebSocket.OPEN) {
        const message = JSON.parse(e.data)
        let answer = new Map()
        if (message.name == 'instrument-quotes-generated') {
            let activeString = getActiveString(message.msg.active, activesMapString)
            let period = message.msg.expiration.period
            // let quotes = message.msg.quotes
            // for (let index = 0; index < quotes.length; index++) {
            //     const quote = quotes[index];
            //     let profitPercent
            //     if (quote.price && quote.price.ask) {
            //         let askPrice = quote.price.ask
            //         profitPercent = ((100 - askPrice) * 100) / askPrice
            //     }

            //     for (let index1 = 0; index1 < quote.symbols.length; index1++) {
            //         const symbol = quote.symbols[index1];
            //         answer.set(symbol, profitPercent)
            //     }
            // }
            // //eurusd , 60 , symbol , profitpercent
            // instrument_quites_generated_data.set(activeString, new Map([period, answer]))
            if (instrument_quotes_generated_raw_data.has(activeString)) {
                instrument_quotes_generated_raw_data.get(activeString).set(period, message)
            } else {
                instrument_quotes_generated_raw_data.set(activeString, new Map([[period, message]]))
            }
        }

        // if (logg && message.name != 'instrument-quotes-generated' && message.name == 'live-deal-digital-option' && message.name == 'live-deal-digital-option' && message.name != 'api_option_init_all_result')
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
            buysss = []
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
            buysss = []
        }

        if (message.name == 'leaderboard-deals-client') {
            let result = message.msg.result.positional
            for (var [key, value] of Object.entries(result)) {
                leadersArray.push(value.user_id)
            }
        }

        // if (message.name == 'option-closed') {
        //     optionClosed(message)
        // }

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
            getCandle()
            if (currentTime) {
                currentTime = message.msg
                currentTimehhmm = moment.unix(currentTime / 1000).utcOffset(-3).add(1, 's').format("HH:mm")
                currentTimemm = moment.unix(currentTime / 1000).utcOffset(-3).add(1, 's').format("mm")
                currentTimemmssDate = moment.unix(currentTime / 1000).utcOffset(-3).add(1, 's').format("YYYY-MM-DD HH:mm:ss")
                if (minAux != currentTimemm && payoutMap.has('digital')) {
                    minAux = currentTimemm
                    for (let [key, value] of payoutMap.get('digital')) {
                        if (value >= payout && velas.has(key)) {
                            // let minutes15
                            // if (parseInt(currentTimemm) < 15)
                            //     minutes15 = currentTimehhmm.substring(0, 3) + '15'
                            // if (parseInt(currentTimemm) >= 15 && parseInt(currentTimemm) < 30)
                            //     minutes15 = currentTimehhmm.substring(0, 3) + '30'
                            // if (parseInt(currentTimemm) >= 30 && parseInt(currentTimemm) < 45)
                            //     minutes15 = currentTimehhmm.substring(0, 3) + '45'
                            // if (parseInt(currentTimemm) >= 45)
                            //     minutes15 = (parseInt(currentTimehhmm.substring(0, 2)) + 1).toString() + ':00'

                            // if (minutes15)
                            //     buy(amount, key, velas.get(key), parseInt(moment(moment().format("YYYY-MM-DD ") + (minutes15 ? minutes15 : currentTimehhmm)).utcOffset(0).format('X')), 'PT15M')
                            // else
                            // buy(amount, key, velas.get(key), parseInt(moment(moment().format("YYYY-MM-DD ") + currentTimehhmm).utcOffset(0).add(1, 'm').format('X')), 'PT1M')
                        }
                    }
                } else {
                    minAux = currentTimemm
                }
                if (log)
                    console.log(currentTimemmssDate)
            } else {
                currentTime = message.msg
            }
        }

        if (message.name == 'candles') {
            // console.log('RES = ' + e.data)
            let candles = message.msg.candles

            for (let index = 0; index < candles.length; index++) {
                const candle = candles[index];
                if (candle.open > candle.close) {
                    velas.set(parseInt(message.request_id), 'put')
                } else if (candle.open < candle.close) {
                    velas.set(parseInt(message.request_id), 'call')
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

function getCandle() {

    for (let i = 0; i < activesMapDigital.length; i++) {
        let data = {
            "name": "get-candles",
            "version": "2.0",
            "body": {
                "active_id": activesMapDigital[i],
                "size": 60,
                "to": currentTime,
                "count": 1,
            }
        };
        ws.send(JSON.stringify(messageHeader(data, 'sendMessage', activesMapDigital[i])));
    }
}

function optionClosed(message) {

    let amounth = buysss[0] && buysss[0].amount ? buysss[0].amount : amount
    let active = message.msg.active_id
    profitAmount = message.msg.profit_amount - amounth
    sessionBalance += profitAmount
    if (profitAmount < 0)
        console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario / ${currentTimemmssDate}`.red)
    else
        console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario / ${currentTimemmssDate}`.green)
    positionOpenedSoros = false

    if (profitAmount < 0 && gale < galeLevel) {
        let direction = buysss[0].direction
        let gale = buysss[0].gale ? buysss[0].gale + 1 : 1

        console.log(`${direction} / ${getActiveString(1, activesMapString)} / ${amounth * galeFactor} / ${currentTimemmssDate}`);
        buy((amounth * galeFactor).toFixed(2), 1, direction, gale == 1 ? buysss[0].gale1 : buysss[0].gale2, 3)
        buysss[0] = { ...buysss[0], direction, amount: amounth * galeFactor, gale }
    } else if (profitAmount != 0) {
        buysss = []
    }
}

function positionChangedStuff(message) {
    if (message.msg.status == 'closed') {
        clearInterval(getDigitalSpotProfit)
        optionsClosed.push(message.msg.id)
        // sessionBalance += profitAmount

        // if (profitAmount < 0)
        //     console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesDigitalMapString)} / ID: ${id} / Digital / ${moment().format('HH:mm:ss')}`.red)
        // else
        //     console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesDigitalMapString)} / ID: ${id} / Digital / ${moment().format('HH:mm:ss')}`.green)
    } else {
        positionOpened.set(message.msg.id, message.msg)
        callGetDigital(message.msg.raw_event.instrument_period, message.msg.id)
    }
}

let getDigitalSpotProfit
let digitProfittSum = 0
let pricesAfterSale = new Map()
let optionsClosed = []

const callGetDigital = (time, id) => {
    const getDigitalSpotProfit = setInterval(() => {
        if (optionsClosed.includes(id)) {
            clearInterval(getDigitalSpotProfit)
            pricesAfterSale = new Map()
        }
        let priceAfterBuy = get_digital_spot_profit_after_sale(time, id)
        if (priceAfterBuy) {
            pricesAfterSale.set(id, priceAfterBuy)
            let digitProfittSumhere = 0
            for (let [key, value] of pricesAfterSale) {
                digitProfittSumhere += value
            }
            digitProfittSum = digitProfittSumhere
        }
        console.log(priceAfterBuy)
        if (priceAfterBuy > amount * (percentageScalper / 100)) {
            const externalId = positionOpened.get(id).external_id
            ws.send(JSON.stringify({
                "name": "sendMessage", "msg": {
                    "name": "digital-options.close-position",
                    "version": "1.0",
                    "body": {
                        "position_id": parseInt(externalId)
                    }, "request_id": ""
                }
            }))
            pricesAfterSale = new Map()
            clearInterval(getDigitalSpotProfit)
        }
    }, 600);
}

let positionOpened = new Map()
let instrument_quotes_generated_raw_data = new Map()
let instrument_quites_generated_data = new Map()
let get_digital_spot_profit_after_sale_data = new Map()

const get_digital_spot_profit_after_sale = (time, id) => {

    let raw = positionOpened.get(id).raw_event
    let positionId = id
    let directionBool = raw.instrument_dir != 'put'
    let paridade = raw.instrument_underlying
    let amount = raw.buy_amount > raw.sell_amount ? raw.buy_amount : raw.sell_amount

    let getAbsCount = raw.count
    let instrumentStrikeValue = raw.instrument_strike_value / 1000000.0
    let spotLowerInstrumentStrike = raw.extra_data.lower_instrument_strike / 1000000.0
    let spotUpperInstrumentStrike = raw.extra_data.upper_instrument_strike / 1000000.0

    let aVar = raw.extra_data.lower_instrument_id
    let aVar2 = raw.extra_data.upper_instrument_id
    let getRate = raw.currency_rate

    // console.log(paridade);
    // console.log(time);
    console.log(positionOpened);

    //eurusd , 60 , symbol , profitpercent
    if (instrument_quotes_generated_raw_data && instrument_quotes_generated_raw_data.has(paridade) && instrument_quotes_generated_raw_data.get(paridade).has(time)) {
        let instrument_quites_generated_data = instrument_quotes_generated_raw_data.get(paridade).get(time)
        
        let f_tmp = get_instrument_id_to_bid(instrument_quites_generated_data, aVar)
        let f2_tmp = get_instrument_id_to_bid(instrument_quites_generated_data, aVar2)

        let f
        let f2

        // console.log(f_tmp);
        // console.log(f2_tmp);

        if (f_tmp) {
            if (f_tmp) {
                if (get_digital_spot_profit_after_sale_data.has(positionId)) {
                    get_digital_spot_profit_after_sale_data.get(positionId).set('f', f_tmp)

                } else {
                    get_digital_spot_profit_after_sale_data.set(positionId, new Map([['f', f_tmp]]))
                }
                f = f_tmp
            } else {
                f = get_digital_spot_profit_after_sale_data.get(positionId).get('f')
            }
        }

        if (f2_tmp) {
            if (f2_tmp) {
                if (get_digital_spot_profit_after_sale_data.has(positionId)) {
                    get_digital_spot_profit_after_sale_data.get(positionId).set('f2', f2_tmp)

                } else {
                    get_digital_spot_profit_after_sale_data.set(positionId, new Map([['f2', f2_tmp]]))
                }
                f2 = f2_tmp
            } else {
                f2 = get_digital_spot_profit_after_sale_data.get(positionId).get('f2')
            }
        }

        // console.log(spotLowerInstrumentStrike);
        // console.log(instrumentStrikeValue);
        // console.log(f);
        // console.log(f2);


        if (spotLowerInstrumentStrike != instrumentStrikeValue && f && f2) {

            if (spotLowerInstrumentStrike > instrumentStrikeValue || instrumentStrikeValue > spotUpperInstrumentStrike) {
                if (directionBool) {
                    instrumentStrikeValue = (spotUpperInstrumentStrike - instrumentStrikeValue) / Math.abs(spotUpperInstrumentStrike - spotLowerInstrumentStrike)
                    f = Math.abs(f2 - f)
                } else {
                    instrumentStrikeValue = (instrumentStrikeValue - spotUpperInstrumentStrike) / Math.abs(spotUpperInstrumentStrike - spotLowerInstrumentStrike)
                    f = Math.abs(f2 - f)
                }

            } else if (directionBool) {
                f += ((instrumentStrikeValue - spotLowerInstrumentStrike) / (spotUpperInstrumentStrike - spotLowerInstrumentStrike)) * (f2 - f)
            } else {
                instrumentStrikeValue = (spotUpperInstrumentStrike - instrumentStrikeValue) / (spotUpperInstrumentStrike - spotLowerInstrumentStrike)
                f -= f2
                f = f2 + (instrumentStrikeValue * f)
            }
        }
        let price
        if (f) {
    
            // console.log(f);
            // console.log(getRate);
            // console.log(getAbsCount);
            // console.log(amount);
    
            price = (f / getRate)
            return price * getAbsCount - amount
        } else
            return null
    }
    return null

}

const get_instrument_id_to_bid = (data, instrument_id) => {
    //eurusd , 60 , symbol , message
    if (data)
        for (let index = 0; index < data.msg.quotes.length; index++) {
            const row = data.msg.quotes[index]
            console.log(row);
            console.log(instrument_id);
            if (row.symbols[0] == instrument_id)
                return row.price.bid
            // for (let index1 = 0; index1 < row.symbols.length; index1++) {
            //     const symbol = row.symbols[index1];
            //     if (symbol == instrument_id) {
            //         return row.price.bid
            //     }
            // }

        }
    process.exit(1)
    return null
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
        if (digitalTimes.includes("M1"))
            for (let i = 0; i < activesMapDigital.length; i++) {
                ws.send(JSON.stringify({ "name": "subscribeMessage", "msg": { "name": "instrument-quotes-generated", "params": { "routingFilters": { "active": activesMapDigital[i], "expiration_period": 60, "kind": "digital-option" } }, "version": "1.0" }, "request_id": "" }))
                subscribeLiveDeal(name, activesMapDigital[i], 'digital', '1', subsType)
                if (payout)
                    ws.send(JSON.stringify({ "name": "subscribeMessage", "msg": { "name": "instrument-quotes-generated", "params": { "routingFilters": { "active": otcActivesDigital[i], "expiration_period": 60, "kind": "digital-option" } }, "version": "1.0" }, "request_id": "" }))
            }

        if (digitalTimes.includes("M5"))
            for (let i = 0; i < activesMapDigital.length; i++) {
                ws.send(JSON.stringify({ "name": "subscribeMessage", "msg": { "name": "instrument-quotes-generated", "params": { "routingFilters": { "active": activesMapDigital[i], "expiration_period": 60 * 5, "kind": "digital-option" } }, "version": "1.0" }, "request_id": "" }))
                subscribeLiveDeal(name, activesMapDigital[i], 'digital', '5', subsType)
                if (payout)
                    ws.send(JSON.stringify({ "name": "subscribeMessage", "msg": { "name": "instrument-quotes-generated", "params": { "routingFilters": { "active": otcActivesDigital[i], "expiration_period": 300, "kind": "digital-option" } }, "version": "1.0" }, "request_id": "" }))
            }

        if (digitalTimes.includes("M15"))
            for (let i = 0; i < activesMapDigital.length; i++) {
                ws.send(JSON.stringify({ "name": "subscribeMessage", "msg": { "name": "instrument-quotes-generated", "params": { "routingFilters": { "active": activesMapDigital[i], "expiration_period": 60 * 15, "kind": "digital-option" } }, "version": "1.0" }, "request_id": "" }))
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
const activesMapDigital = [7, 943, 108, 7, 943, 101, 944, 99, 107, 2, 4, 1, 104, 102, 103, 3, 947, 5, 8, 100, 72, 6, 168, 105]
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
    ['EURAUD', 108],
    ['EURGBP', 2],
    ['EURJPY', 4],
    ['EURUSD', 1],
    ['EURCAD', 105],
    ['GBPAUD', 104],
    ['GBPCHF', 103],
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