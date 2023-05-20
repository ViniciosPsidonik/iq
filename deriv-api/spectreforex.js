const WebSocket = require('ws');
const axios = require('axios')

let amount = 100
const colors = require('colors')
let massan = true
// change some cell value
// console.log(getCell('F4'));
var XLSX = require('xlsx');
var XLSX_CALC = require('xlsx-calc');
const { log } = require('pkg/lib-es5/log');
var workbook = XLSX.readFile('./Massanielloderiv.xlsx');
var worksheet = workbook.Sheets['Calculadora']

let countMass = 3
// console.log(amount);
let profitSession = 0

// basic.ping().then(console.log);
let balancesss = false
let balance
let win = 0
let loss = 0
let meta = 100000

const cors = require('cors')
var express = require('express')
var app = express()
app.use(cors({ origin: '*' }))

app.post('/tick', function (req, res) {
    console.log('b');
})

let lastTickkkkkk


let connection = new WebSocket('wss://wss.hyper-api.com:5553/spectreai/', "716633f75cce7a00a2b74bb6f670da83");
let token

const qs = require('qs');
app.get('/auth', (req, res) => {
    console.log(req.query.code);

    const options = {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        auth: {
            username: "716633f75cce7a00a2b74bb6f670da83",
            password: "42c37950782d410077537ee34540f2"
        },
        data: qs.stringify({ 'code': req.query.code, 'grant_type': 'authorization_code' }),
        url: 'https://wss.hyper-api.com/token.php',
    };
    axios(options).then((response) => {
        console.log(response.data.access_token);
        token = response.data.access_token
        console.log('wsss');

        connection.onmessage = onmessage
    }).catch(a => { console.log(a); console.log('finish'); })
    res.send('sss')
})

app.get('/:active', (req, res) => {
    lastTickkkkkk = parseFloat(req.params.active)
    // console.log(lastTickkkkkk);
    res.send('sss')
})
let direction

//account type 4 real, 1 demo
app.get('/dir/:direction', (req, res) => {
    direction = req.params.direction
    console.log(direction);
    if (!openedOrder && (direction == "Call" || direction == "Put")) {
        openedOrder = true
        connection.send(JSON.stringify({ "action": "newtrade", "data": { "account_type": 1, "direction": direction, "asset_id": 14, "expiration": "10s", "investment": amount }, "token": token, "id": 1 }))
    }
    res.send('sss')
})
let maxDif = 0
let openedOrder = false
let lastTransacionId

if (massan)
    amount = parseFloat(getCell('D' + countMass)).toFixed(2)

let lastticke = 0
let pass = 0.005
let payout = 0

const onmessage = (message) => {
    message = JSON.parse(message.data)

    try {
        if (message.action != 'marketdata' && message.action != 'getpayout' && message.status != "success")
            console.log(message);
    } catch (error) {

    }

    if (message.action == 'TradeDetails') {
        profitSession += message.tradedetails.profit

        if (message.tradedetails.profit > 0) {
            console.log('WIIN'.green);
            win++
            if (massan)
                winMass()

        } else if (message.tradedetails.profit < 0) {
            console.log('LOSS'.red);
            loss++
            if (massan)
                lossMass('L')
        }

        console.log('profitSession=', profitSession.toFixed(2));
        console.log('Win=', win, 'loss=', loss);
        console.log('=====================');

        openedOrder = false;
    }

    if (message.action == 'newtrade' && typeof message.newtrade != "undefined") {
        lastTransacionId = message.newtrade.transaction_id
        setTimeout(() => {
            connection.send(JSON.stringify({ "action": "TradeDetails", "data": { "transaction_id": lastTransacionId }, "token": token, "id": 1 }))
        }, 10500);
    } else if (message.action == 'newtrade') {
        console.log(message);
        openedOrder = false
    }

    if (message.action == 'getpayout') {
        // console.log(message);
        // if (payout != message.getpayout.payout_percent) {
        //     payout = message.getpayout.payout_percent
        //     console.log('payout=', payout);
        // }
    }

    if (message.action == 'marketdata') {
        // let close = parseFloat(message.msg.close)
        // let diff = lastTickkkkkk - close
        // diff = diff < 0 ? diff * -1 : diff
        // // console.log(diff);
        // if (diff > maxDif) {
        //     maxDif = diff
        //     console.log(diff, maxDif)
        // }

        // if (maxDif >= pass + 0.005) {
        //     pass += 0.005
        //     console.log('pass=', pass);
        // }
        // if (diff >= 0.02 && !openedOrder && payout >= 70) {
        //     console.log(diff, maxDif)
        //     console.log(lastticke < lastTickkkkkk ? "Call" : "Put");
        //     connection.send(JSON.stringify({ "action": "newtrade", "data": { "account_type": 1, "direction": lastticke < lastTickkkkkk ? "Call" : "Put", "asset_id": 14, "expiration": "10s", "investment": amount }, "token": token, "id": 1 }))
        //     openedOrder = true
        // }

        // if (lastticke != lastTickkkkkk) {
        //     lastticke = lastTickkkkkk
        // }
    }
}

const inter = setInterval(() => {
    if (typeof token != "undefined") {
        console.log('enviou');
        connection.send(JSON.stringify({
            "action": "marketdatasubscribe",
            "data": {
                "subscribe": 1,
                "asset_id": 14,
                "period": 60
            },
            "token": token,
            "id": 0
        }))

        connection.send(JSON.stringify({ "action": "tradesubscribe", "data": { "subscribe": 1 }, "token": token, "id": 1 }))
        connection.send(JSON.stringify({ "action": "balancesubscribe", "data": { "subscribe": 1 }, "token": token, "id": 1 }))
        clearInterval(inter)
    }
}, 1500);

setInterval(() => {
    connection.send(JSON.stringify({ "action": "getpayout", "data": { "asset_id": 14, "expiration": "10s", "investment": 10 }, "token": token, "id": 1 }))
}, 5000);

const PORT = process.env.PORT || 80
app.listen(PORT)


function getCell(cellString) {
    if (typeof worksheet[cellString] != "undefined") {
        return worksheet[cellString].v
    } else {
        return undefined
    }
}

function lossMass(winloss) {
    modifyCell('C' + countMass, winloss);
    XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
    countMass++;
    amount = parseFloat(getCell('D' + countMass)) > 0 ? parseFloat(getCell('D' + countMass)) : parseFloat(getCell('D' + countMass)) * -1;
}
let bancaAtual = 0
function winMass() {
    lossMass('W')

    if (getCell('I' + (countMass - 1)) == "◄◄") {
        console.log(`Takeeee `.green)
        // loss = 0
        // win = 0
        for (let index = countMass; index >= 3; index--) {
            modifyCell('C' + countMass, '');
        }
        // modifyCell('N12', balance.balance.amount.value);
        XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
        countMass = 3;
        amount = parseFloat(getCell('D' + countMass)) > 0 ? parseFloat(getCell('D' + countMass)) : parseFloat(getCell('D' + countMass)) * -1;
    }


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
