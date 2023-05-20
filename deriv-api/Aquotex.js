const WebSocket = require('ws');
const axios = require('axios')

let amount = 2
let saiu = false
const colors = require('colors')
const { chromium } = require('playwright');
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

if (saiu)
    setInterval(() => {
        robot.moveMouse(1810, 610);
        robot.moveMouse(1821, 668);
    }, 30000);

// basic.ping().then(console.log);
let balancesss = false
let balance
let win = 0
let loss = 0
let meta = 100000

let massan = true
// change some cell value
// console.log(getCell('F4'));

const cors = require('cors')
const colorname = require('hex-color-to-color-name')
var express = require('express')
var app = express()
app.use(cors({ origin: '*' }))

app.post('/tick', function (req, res) {
    console.log('b');
})

let lastTickkkkkk


let direction
let corretora = "a"

var robot = require("robotjs");
const moment = require('moment')
//account type 4 real, 1 demo
let open = false

// clearInvestimento();
// robot.typeString(parseFloat(getCell('D' + countMass)).toFixed(2).toString())

let posx = 1199
let posy = 1000

let bannedlistcollors = ['Jewel', "Bunker"]
let winlistcollors = ['Mountain Meadow', 'Java', 'Viola', 'Aztec', 'Chateau Green']
let losslistcollors = ['Medium Red Violet', 'Flush Mahogany', 'East Side', 'New York Pink']
// if (massan)
// amount = parseFloat(getCell('D' + countMass)).toFixed(2)

app.get('/dir/:direction', (req, res) => {
    direction = req.params.direction
    console.log(direction);
    // console.log(parseInt(moment().format("HH")))
    if (parseInt(moment().format("ss")) <= 29) {
        try {
            // if (!open)
            if (direction == "Call" || direction == "Put") {
                open = true
                if (direction == "Call") {
                    if (corretora == "spectre") {
                        robot.moveMouse(1810, 610);
                        robot.mouseClick();
                    } else {
                        robot.moveMouse(1311, 754);
                        robot.mouseClick();
                    }
                } else if (direction == "Put") {
                    if (corretora == "spectre") {
                        robot.moveMouse(1821, 668);
                        robot.mouseClick();
                    } else {
                        robot.moveMouse(1086, 758);
                        robot.mouseClick();
                    }
                }
                // canOpen = false
                // setTimeout(() => {
                //     const canOpenI = setInterval(() => {
                //         // console.log(canOpen);

                //         if (!bannedlistcollors.includes(colorname.GetColorName(robot.getPixelColor(posx, posy)))) {
                //             console.log(colorname.GetColorName(robot.getPixelColor(posx, posy)), robot.getPixelColor(posx, posy));
                //             if (winlistcollors.includes(colorname.GetColorName(robot.getPixelColor(posx, posy)))) {
                //                 console.log('Wiiin'.green);
                //                 if (massan)
                //                     winMass()
                //             } else if (losslistcollors.includes(colorname.GetColorName(robot.getPixelColor(posx, posy)))) {
                //                 console.log('Loss'.red);
                //                 if (massan)
                //                     lossMass('L')
                //             } else {
                //                 console.log('Empate');
                //                 // canOpen = true
                //             }
                //         }
                //         if (canOpen) {
                //             open = false
                //             clearInterval(canOpenI)
                //         }
                //     }, 250);
                // }, 5000);


                // setTimeout(() => {

                // }, 11000);
                // clearInvestimento();

            }
            res.send('sss')
        } catch (error) {

        }
    }
})

setInterval(() => {

    var mouse = robot.getMousePos();
    var hex = robot.getPixelColor(mouse.x, mouse.y);
    // console.log("#" + hex + " at x:" + mouse.x + " y:" + mouse.y);
}, 2000);


const PORT = process.env.PORT || 80
app.listen(PORT)

function clearInvestimento() {
    robot.moveMouse(1812, 410);
    robot.mouseClick();
    robot.mouseClick();
    robot.keyTap("end");
    robot.keyTap("backspace");
    robot.keyTap("backspace");
    robot.keyTap("backspace");
    robot.keyTap("backspace");
    robot.keyTap("backspace");
    robot.keyTap("backspace");
}

function getCell(cellString) {
    if (typeof worksheet[cellString] != "undefined") {
        return worksheet[cellString].v
    } else {
        return undefined
    }
}

function lossMass(winloss) {
    hasLoss = true
    clearInvestimento();
    modifyCell('C' + countMass, winloss);
    XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
    countMass++;
    let doubles = parseFloat(getCell('D' + countMass)) > 0 ? parseFloat(getCell('D' + countMass)) : parseFloat(getCell('D' + countMass)) * -1
    console.log(parseFloat(doubles).toFixed(2).toString());
    canOpen = true
    robot.typeString(parseFloat(doubles).toFixed(2).toString());
}
let bancaAtual = 0

let canOpen = true
let hasLoss = false
function winMass() {
    if (hasLoss) {
        clearInvestimento();
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

            // let doubles = parseFloat(getCell('D' + countMass)) > 0 ? parseFloat(getCell('D' + countMass)) : parseFloat(getCell('D' + countMass)) * -1
            // robot.typeString(parseFloat(doubles).toFixed(2).toString());
            // console.log(parseFloat(doubles).toFixed(2).toString());
            canOpen = true
            hasLoss = false
        }
    } else {
        canOpen = true
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

