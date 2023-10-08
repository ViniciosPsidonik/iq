const fs = require('fs')
const axios = require('axios')
const moment = require('moment')
const momentTz = require('moment-timezone');
const countries = require('./country')
const WebSocket = require('ws')
const colors = require('colors')
const player = require('node-wav-player');
const { call } = require('ramda');

let fsConfig = fs.readFileSync('config.json')
let config = JSON.parse(fsConfig)
let openedMap = new Map()
let openedMapDigital = new Map()


const notifier = require('node-notifier');
const path = require('path');


// Configurações do servidor WebSocket
const serverPort = 7681; // Porta do servidor WebSocket

// Criar o servidor WebSocket
const server = new WebSocket.Server({ port: serverPort });
let point
let priceFx
// Evento de conexão de cliente
server.on('connection', (socket) => {
    console.log('Novo cliente conectado');

    // Evento de recebimento de mensagem do cliente
    socket.on('message', (message) => {
        // console.log('Mensagem recebida:', message);

        // Processar a mensagem recebida, se necessário...
        point = message.split('/')[1]
        priceFx = message.split('/')[0]

        // console.log(point);
        // Enviar uma resposta para o cliente
        socket.send('Resposta do servidor');
    });

    // Evento de fechamento da conexão do cliente
    socket.on('close', () => {
        console.log('Cliente desconectado');
    });
});


console.log(`Servidor WebSocket ouvindo na porta ${serverPort}`);


// notifier.on('click', function (notifierObject, options, event) {
//   // Triggers if `wait: true` and user clicks notification
// });

// notifier.on('timeout', function (notifierObject, options) {
//   // Triggers if `wait: true` and notification closes
// });

//55099058
let backtest = true
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
let copyy = config.copyy
let pares = 'EURGBP,GBPNZD,USDCHF,GBPJPY,EURCAD,CADCHF,GBPCHF,GBPAUD,USDCAD,EURUSD,NZDUSD,USDJPY,AUDUSD,EURAUD,AUDJPY,GBPUSD,EURNZD,EURJPY'// "NZDUSD-OTC,EURUSD-OTC,AUDCAD-OTC,EURJPY-OTC,USDCHF-OTC,GBPUSD-OTC,EURGBP-OTC "
let timeFrame = config.timeFrame

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
    // ws.terminate()
    // ws = new WebSocket(url)
    // ws.onopen = onOpen
    // ws.onerror = onError
    // ws.onmessage = onMessage
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

let taxasObj = new Map()


// setInterval(() => {
//     console.log(candlesCount);
// }, 5000);


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

let ordersSent = 0
let winss = 0
let losss = 0

let paresAtencaoCall = []
let paresAtencaoPut = []
let isSecondCandle = false
let lastMin
let lastMax = 0
let lastCandleId
let lastLastCandleId
let mediaTamanhoCandles = new Map()
let candlesCount = 0
let rompeuCallMap = new Map()
let rompeuPutMap = new Map()

setInterval(() => {
    // console.log(lastCandleId);
    // console.log(isSecondCandle);
    // console.log(lastMax);
    // console.log(lastMin);
    // console.log("====================");
}, 5000);

const onMessage = e => {
    // if (ws.readyState === WebSocket.OPEN) {
    const message = JSON.parse(e.data)

    // if (message.name == 'option') {
    // console.log('RES = ' + e.data);
    // }

    // if (message.name != 'candles' && message.name != 'instrument-quotes-generated' && message.name != 'api_option_init_all_result' && message.name != 'heartbeat' && message.name != 'timesync')
    // console.log('RES = ' + e.data)


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
        ordersSent--
        if (soros)
            positionOpenedSoros = false
        if (gale)
            positionOpenedGale = false
        buysss = []
    }

    if (message.name == 'digital-option-placed' && message.status != 2000) {
        totalOrderss--
        ordersSent--
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
        currentTimehhmmss = moment.unix(currentTime / 1000).utcOffset(-3).format("HH:mm:ss")
        currentTimehhmm = moment.unix(currentTime / 1000).utcOffset(-3).format("HH:mm")
        currentTimemm = moment.unix(currentTime / 1000).utcOffset(-3).format("mm")
        currentTimemmss = moment.unix(currentTime / 1000).utcOffset(-3).format("ss")
        currentTimemmssDate = moment.unix(currentTime / 1000).utcOffset(-3).format("YYYY-MM-DD HH:mm:ss")

        let timeIntLast = parseInt(currentTimehhmm.substring(currentTimehhmm.length - 1, currentTimehhmm.length))

        if (parseInt(timeIntLast) == 5 && parseInt(currentTimemmss) > 3 && !printou || parseInt(timeIntLast) == 0 && parseInt(currentTimemmss) > 3 && !printou) {
            printou = true
            var mapAsc = new Map([...porcentagensMap.entries()].sort());

            porcentagensMap[Symbol.iterator] = function* () {
                yield* [...this.entries()].sort((a, b) => a[1] - b[1]);
            }
            console.log(porcentagensMap);
        } else if (parseInt(timeIntLast) != 5 && parseInt(timeIntLast) != 0) {
            printou = false
        }
        // if (log)
        // console.log(currentTimemmssDate)
        // getCandle()
    }

    if (message.name == 'candles') {
        candleStuff(message);
    }
}
if (!backtest)
    setInterval(() => {
        var mapAsc = new Map([...porcentagensMap.entries()].sort());

        porcentagensMap[Symbol.iterator] = function* () {
            yield* [...this.entries()].sort((a, b) => a[1] - b[1]);
        }
        console.log(porcentagensMap);
    }, 2000);

let printou = false

let porcentagensMap = new Map()

let totalOrderss = 0

function candleStuff(message) {
    let candles = message.msg.candles;
    if (candles) {

        let close = candles[0].close

        let pointsDifference = (close - priceFx - (7 * point)) / point

        console.log(pointsDifference);

        if (openedOrders.length == 0) {
            if (pointsDifference > 7) {
                buyBefor('call', 1, 1);
            } else if (pointsDifference < -5) {
                buyBefor('put', 1, 1);
            }
        }
    }


}

function removeGatilho(message, priceOpen, priceClose, min, parInt, max) {
    for (let index = 0; index < paresAtencaoPut.length; index++) {
        const element = paresAtencaoPut[index];
        if (element.par == parseInt(message.request_id)) {
            if (element.priceOpen != priceOpen || element.priceClose != priceClose) {
                paresAtencaoPut.splice(index, 1);
                index--;
                // console.log(paresAtencaoPut);

                notOrder.push(parInt)

                taxasObj.get(getActiveString(parseInt(message.request_id), activesMapString)).min = 0;
                min = 0;
                console.log(`Gatilho removido... / ${getActiveString(parInt, activesMapString)} / ${currentTimemmssDate}`.red);
            }
        }
    }

    for (let index = 0; index < paresAtencaoCall.length; index++) {
        const element = paresAtencaoCall[index];
        if (element.par == parseInt(message.request_id)) {
            if (element.priceOpen != priceOpen || element.priceClose != priceClose) {
                paresAtencaoCall.splice(index, 1);
                index--;
                // console.log(paresAtencaoCall);

                notOrder.push(parInt)

                taxasObj.get(getActiveString(parseInt(message.request_id), activesMapString)).max = 0;
                max = 0;
                console.log(`Gatilho removido... / ${getActiveString(parInt, activesMapString)} / ${currentTimemmssDate}`.red);
            }
        }
    }
    return { min, max };
}

function checkGatilho(max, priceClose, priceOpen, message, parInt, min, price) {

    if (max != 0 && priceClose > max && !notOrder.includes(parInt) && isSecondCandle) {
        if (priceClose > priceOpen) {
            let diffMaxClose = priceClose - max;
            let candleSize = Math.abs(priceClose - priceOpen);

            let percent = Math.abs((diffMaxClose * 100) / candleSize);
            if (verpar == getActiveString(parseInt(message.request_id), activesMapString)) {
                console.log('percent = ' + percent)
                console.log('----------------');
            }
            if (percent <= 75 && percent >= 40) {
                if (!rompeuCallMap.get(parInt)) {
                    let achouPar = false;
                    for (let index = 0; index < paresAtencaoCall.length; index++) {
                        const element = paresAtencaoCall[index];
                        if (element.par == parseInt(message.request_id))
                            achouPar = true;
                    }

                    if (!achouPar) {
                        paresAtencaoCall.push({
                            par: parseInt(message.request_id),
                            priceOpen,
                            priceClose
                        });
                        // console.log(paresAtencaoCall);
                        // soundOpen('Windows Exclamation.wav')
                        console.log(`GATILHOO CALL!! / ${getActiveString(parInt, activesMapString)} / ${currentTimemmssDate}`);

                        console.log('parInt =' + parInt);
                        console.log('max =' + max);
                        console.log('min =' + min);
                        console.log('priceOpen =' + priceOpen);
                        console.log('priceClose =' + priceClose);
                        console.log('price =' + price);

                        // notify('WoooW!!', `GATILHOO CALL!! / ${getActiveString(parInt, activesMapString)} / ${currentTimemmssDate}`);
                    }
                } else {
                    console.log(`Já rompeu Call -> ${getActiveString(parseInt(parInt), activesMapString)}`);
                    notOrder.push(parInt)
                }
            }
        }

    } else if (min != 0 && min != 999999999 && priceClose < min && !notOrder.includes(parInt) && isSecondCandle) {
        if (priceClose < priceOpen) {

            let diffMaxClose = priceClose - min;
            let candleSize = Math.abs(priceClose - priceOpen);

            let percent = Math.abs((diffMaxClose * 100) / candleSize);
            if (verpar == getActiveString(parseInt(message.request_id), activesMapString)) {
                console.log(percent)
                console.log('----------------');
            }
            if (percent <= 75 && percent >= 40) {
                if (!rompeuPutMap.get(parInt)) {
                    let achouPar = false;
                    for (let index = 0; index < paresAtencaoPut.length; index++) {
                        const element = paresAtencaoPut[index];
                        if (element.par == parseInt(message.request_id))
                            achouPar = true;
                    }

                    if (!achouPar) {
                        paresAtencaoPut.push({
                            par: parseInt(message.request_id),
                            priceOpen,
                            priceClose
                        });
                        // console.log(paresAtencaoPut);
                        // soundOpen('Windows Exclamation.wav')
                        console.log(`GATILHOO PUTT!! / ${getActiveString(parInt, activesMapString)} / ${currentTimemmssDate}`);

                        console.log('parInt =' + parInt);
                        console.log('max =' + max);
                        console.log('min =' + min);
                        console.log('priceOpen =' + priceOpen);
                        console.log('priceClose =' + priceClose);
                        console.log('price =' + price);

                        // notify('WoooW!!', `GATILHOO PUTT!! / ${getActiveString(parInt, activesMapString)} / ${currentTimemmssDate}`);
                    }
                } else {
                    console.log(`Já rompeu Put-> ${getActiveString(parseInt(parInt), activesMapString)}`);
                    notOrder.push(parInt)
                }
            }
        }
    }
}

function notify(title, message) {
    notifier.notify(
        {
            title,
            message,
            icon: path.join(__dirname, 'coulson.jpg'),
            sound: true,
            wait: true // Wait with callback, until user action is taken against notification, does not apply to Windows Toasters as they always wait or notify-send as it does not support the wait option
        },
        function (err, response, metadata) {
        }
    );
}

function changeIdCandle(parInt, candles) {
    if (!lastCandleId && pares.split(',')[0] == getActiveString(parInt, activesMapString)) {
        console.log(`!lastCandleId.. / ${currentTimemmssDate}`);
        lastCandleId = candles[candles.length - 1].id;
    } else if (!isSecondCandle && lastCandleId != candles[candles.length - 1].id && pares.split(',')[0] == getActiveString(parInt, activesMapString)) {
        console.log(`isSecondCandle.. / ${currentTimemmssDate}`);
        isSecondCandle = true;
        lastCandleId = candles[candles.length - 1].id;
    }
}

function Buyyyyyyy(achouPar, max, price, direction, message, parInt, min) {
    if (max != 0 && price <= max && achouPar == 'call') {
        // console.log(price);
        // console.log(max);

        direction = 'call';

        taxasObj.get(getActiveString(parseInt(message.request_id), activesMapString)).max = 0;
        max = 0;

        // retira quando faz a entrada
        for (let index = 0; index < paresAtencaoCall.length; index++) {
            const element = paresAtencaoCall[index];
            if (element.par == parseInt(message.request_id)) {
                paresAtencaoCall.splice(index, 1);
                index--;
                // console.log(paresAtencaoCall);
            }
        }

        // soundOpen('./Windows User Account Control.wav');

        notOrder.push(parInt)

        buyBefor(direction, parInt);
    } else if (min != 0 && min != 999999999 && price >= min && achouPar == 'put') {
        // console.log(price);
        // console.log(min);

        direction = 'put';

        taxasObj.get(getActiveString(parseInt(message.request_id), activesMapString)).min = 0;
        min = 0;

        // retira quando faz a entrada
        for (let index = 0; index < paresAtencaoPut.length; index++) {
            const element = paresAtencaoPut[index];
            if (element.par == parseInt(message.request_id)) {
                paresAtencaoPut.splice(index, 1);
                index--;
                // console.log(paresAtencaoPut);
            }
        }

        // soundOpen('./Windows User Account Control.wav');

        notOrder.push(parInt)

        buyBefor(direction, parInt);
    }
    return { max, direction, min };
}

function soundOpen(path) {
    player.play({
        path,
    }).then(() => {
        // console.log('The wav file started to be played successfully.');
    }).catch((error) => {
        console.error(error);
    });
}

function buyBefor(direction, parInt, type) {
    let timeInt = parseInt(currentTimehhmm.substring(currentTimehhmm.length - 2, currentTimehhmm.length));
    let timeIntLast = parseInt(currentTimehhmm.substring(currentTimehhmm.length - 1, currentTimehhmm.length));
    // let minuteTimeInt = parseInt(currentTimehhmm.substring(currentTimehhmm.length - 4, currentTimehhmm.length - 3));
    let resto = timeInt % timeFrame;
    let timeFrameL = timeFrame
    if (resto != 0) {
        timeFrameL = timeFrameL - resto;
    }
    let hourmm

    // if (minuteTimeInt == 9 && timeInt >= 30 || minuteTimeInt == 4 && timeInt >= 30) {
    //     hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(timeFrameL + 5, 'm').format(" HH:mm");
    // } else {
    if (type == 1) {
        if (parseInt(currentTimemmss) >= 29) {
            hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').add(2, 'm').format(" HH:mm");
            // console.log(`${currentTimehhmmss} || TARDEEE - ${direction} `);
            return
        } else {
            hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').add(1, 'm').format(" HH:mm");
        }
    } else if (type == 5) {
        // if (parseInt(currentTimess) >= 30) {
        hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').add(timeFrameL, 'm').format(" HH:mm");
        // } else {
        //     hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').add(5, 'm').format(" HH:mm");
        // }
    } else {
        hourmm = moment.unix(currentTime / 1000).utcOffset(-3).add(2, 'seconds').add(15, 'm').format(" HH:mm");
    }
    ordersSent++

    // if (canBuy) {
    // console.log(moment(moment().format("YYYY-MM-DD ") + currentTimehhmm).utcOffset(0).add(1, 'm').format('HH:mm'))
    // console.log(moment(moment().format("YYYY-MM-DD ") + currentTimehhmm).utcOffset(0).add(1 * 2, 'm').format('HH:mm'))
    // console.log(moment(moment().format("YYYY-MM-DD ") + currentTimehhmm).utcOffset(0).add(1 * 3, 'm').format('HH:mm'))
    // if (totalOrderss < 3) {
    buy(amount, parInt, direction, parseInt(moment(moment().format("YYYY-MM-DD ") + hourmm).utcOffset(0).format('X')), 3);

    totalOrderss++

    openedOrders.push(parInt)
    // } else {
    //     console.log(`Erro ao comprar totalOrderss > ${totalOrderss} / ${currentTimemmssDate}`);
    //     setTimeout(() => {
    //         process.exit(1)
    //     }, 5000);
    // }

}

let notOrder = []

function getCandle(active_id, size) {
    let data = {
        "name": "get-candles",
        "version": "2.0",
        "body": {
            "active_id": active_id,
            "size": size,
            "to": currentTime,
            "count": 1,
        }
    };
    if (ws.readyState === WebSocket.OPEN)
        ws.send(JSON.stringify(messageHeader(data, 'sendMessage', active_id)))
}

function optionClosed(message) {
    let amounth = buysss[0] && buysss[0].amount ? buysss[0].amount : amount
    let active = message.msg.active_id

    let index = openedOrders.indexOf(parseInt(active))
    openedOrders.splice(index, 1)
    profitAmount = message.msg.profit_amount - amounth
    sessionBalance += profitAmount

    // soundOpen('./Windows Ding.wav')

    if (profitAmount < 0) {
        amount = amountInitial
        losss++
        notOrder.push(active)
        // notify(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario / ${currentTimemmssDate}`);
        console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario / ${currentTimemmssDate}`.red)
    } else if (profitAmount == 0) {
        // notify(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario / ${currentTimemmssDate}`);
        console.log(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario / ${currentTimemmssDate}`.green)
    } else {
        winss++
        if (winss >= 2) {
            amount = amountInitial
            winss = 0
        } else {
            amount += profitAmount
        }
        // notify(`=== ${profitAmount < 0 ? "Loss" : "Win"} ${profitAmount.toFixed(2)} / Balance: ${parseFloat(sessionBalance.toFixed(2))} / ${getActiveString(active, activesMapString) ? getActiveString(active, activesMapString) : active} / Binario / ${currentTimemmssDate}`);
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
        // if (config.conta == 'demo') {
        if (element.type == 4) {
            message.msg.balance_id = element.id
        }
        // }
        // else if (config.conta == 'real') {
        //     if (element.type == 1) {
        //         message.msg.balance_id = element.id
        //     }
        // }
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

const newbinary = new Map([
    ['AUDJPY', 101],
    ['USDJPY', 6],
    ['AUDCAD', 7],
    ['GBPUSD', 5],
    ['GBPJPY', 3],
    ['EURGBP', 2],
    ['EURUSD', 1],
    ['EURJPY', 4],
    // ['XAUUSD', 74],
    // ['USOUSD', 971],
    // ['USDCAD', 100],
    // ['USDCHF', 72],
    ['AUDUSD', 99]
])


setInterval(() => {
    // setTimeout(() => {
    // for (var [key, value] of newbinary) {
    //     if (value && !key.includes('OTC'))
    //         getCandle(value, 60)
    // }
    getCandle(1, 60)
}, 100
);
// }, !backtest ? 1000 : 100000)

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

setInterval(async () => {
    intervalGetPayout()
    openedMap = new Map(await getOpened())
    openedMapDigital = new Map(await getOpenedDigital())
    // console.log(openedMap);
    // console.log(openedMapDigital)
}, 10000);

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
            // console.log('getOpened');
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
            // console.log('getOpenedDigital');
            // console.log(err);
            return resolve([[]])
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

const loginAsync = async (ssid) => {
    await doLogin(ssid)
}
let logged = false
const doLogin = ssid => {
    return new Promise((resolve, reject) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            if (log)
                console.log(JSON.stringify({ 'name': 'ssid', 'msg': ssid, "request_id": "" }))
            ws.send(JSON.stringify({ 'name': 'ssid', 'msg': ssid, "request_id": "" }))
            logged = true
            resolve()
        } else if (ws) {
            setTimeout(() => {
                ws.terminate()
                ws = new WebSocket(url)
                ws.onopen = onOpen
                ws.onerror = onError
                ws.onmessage = onMessage
                resolve()
            }, 250);
        }
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
        password: "Ana12boeno#"
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
    identifier: "davilagustavo996@gmail.com",
    password: "Ana12boeno#"
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