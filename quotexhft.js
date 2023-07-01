// change some cell value
// console.log(getCell('F4'));
var XLSX = require("xlsx");
var XLSX_CALC = require("xlsx-calc");
const { log } = require("pkg/lib-es5/log");
var workbook = XLSX.readFile("./Massaniello.xlsx");
var worksheet = workbook.Sheets["Calculadora"];

let countMass = 3;
// console.log(amount);
let profitSession = 0;



// basic.ping().then(console.log);
let balancesss = false;
let balance;
let win = 0;
let loss = 0;
let meta = 100000;
let amount = 1;
let saiu = 0;
let massan = 0;
let tresparaum = 0;
let inverter = 0
let corretora = "expert";
let payout = 70;
// change some cell value
// console.log(getCell('F4'));
if (saiu)
  setInterval(() => {
    // robot.moveMouse(1210, 610);
    // robot.moveMouse(921, 668);
  }, 15000);
const cors = require("cors");
var express = require("express");
var app = express();
app.use(cors({ origin: "*" }));

app.post("/tick", function (req, res) {
  console.log("b");
});

let lastTickkkkkk;

let direction;


var robot = require("robotjs");
const moment = require("moment");
//account type 4 real, 1 demo
let open = false;

if (massan) {
  clearInvestimento();
  robot.typeString(
    parseFloat(getCell("D" + countMass))
      .toFixed(2)
      .toString()
  );
}

let posx = 1199;
let posy = 1000;

let bannedlistcollors = ["Jewel", "Bunker"];
let winlistcollors = [
  "Mountain Meadow",
  "Java",
  "Viola",
  "Aztec",
  "Chateau Green",
];
let losslistcollors = [
  "Medium Red Violet",
  "Flush Mahogany",
  "East Side",
  "New York Pink",
];

var keypress = require("keypress");

// make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);

process.stdin.on("keypress", function (ch, key) {
  console.log(key);
  console.log(ch);
  console.log('got "keypress"', key.name);
  if (key && key.name == "v") {
    winr = true;
  } else if (key && key.name == "d") {
    lossr = true;
  } else if (key && key.name == "e") {
    empater = true;
  } else if (key && key.ctrl && key.name == "c") {
    process.exit()
  }
});
process.stdin.setRawMode(true);
process.stdin.resume();

let winr = false;
let lossr = false;
let empater = false;

const clear = () => {
  winr = false;
  lossr = false;
  empater = false;
};
if (corretora == "expert" && saiu) {
  setInterval(() => {
    robot.moveMouse(1810, 610);
    robot.mouseClick();
  }, 15000);
}

app.get("/dir/:direction", (req, res) => {
  direction = req.params.direction;
  console.log(direction);
  // console.log(parseInt(moment().format("HH")))
  if (parseInt(moment().format("HH")) >= 0)
    // if (corretora == "expert" && parseInt(moment().format("ss")) <= 29 || corretora != "expert") {
    try {
      if (!open || (!massan && !tresparaum)) {
        if (direction == "Call" || direction == "Put") {
          open = true;
          if (inverter) {
            if (direction == "Call") {
              direction = "Put"
            } else {
              direction = "Call"
            }
          }
          if (direction == "Call") {
            if (corretora == "expert") {
              robot.moveMouse(1611, 962);
              robot.mouseClick();
            } else if (corretora == "spectre") {
              robot.moveMouse(1810, 610);
              robot.mouseClick();
            } else if (corretora == "quotex") {
              robot.moveMouse(1161, 901);
              robot.mouseClick();
            } else {
              robot.moveMouse(1826, 369);
              robot.mouseClick();
            }
          } else if (direction == "Put") {
            if (corretora == "expert") {
              robot.moveMouse(1522, 960);
              robot.mouseClick();
            } else if (corretora == "spectre") {
              robot.moveMouse(1821, 668);
              robot.mouseClick();
            } else if (corretora == "quotex") {
              robot.moveMouse(1560, 921);
              robot.mouseClick();
            } else {
              robot.moveMouse(1824, 428);
              robot.mouseClick();
            }
          }
          canOpen = false;

          const canOpenI = setInterval(() => {
            // console.log(canOpen);
            if (winr) {
              console.log("Wiiin".green);
              clear();
              if (massan) winMass();
              if (tresparaum) {
                clearInvestimento();

                if (!win) {
                  robot.typeString(parseFloat(amount + (amount * (payout / 100))).toFixed(2).toString());
                  win++
                } else {
                  robot.typeString(parseFloat(amount).toFixed(2).toString());
                  win = 0;
                }
                open = false;
              }
              clearInterval(canOpenI);
            } else if (lossr) {
              console.log("Loss".red);
              clear();
              if (massan) { lossMass("L") } else { open = false }
              clearInterval(canOpenI);
            } else if (empater) {
              console.log("Empate");
              clear();
              open = false;
              clearInterval(canOpenI);
            }
          }, 250);

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

          setTimeout(() => { }, 11000);
          // clearInvestimento();
        }
      } else {
        console.log("open TRUEE");
      }
    } catch (error) { }
  // }
  res.send("sss");
});

setInterval(() => {
  var mouse = robot.getMousePos();
  var hex = robot.getPixelColor(mouse.x, mouse.y);
  console.log("#" + hex + " at x:" + mouse.x + " y:" + mouse.y);
}, 2000);

const PORT = process.env.PORT || 80;
app.listen(PORT);

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
    return worksheet[cellString].v;
  } else {
    return undefined;
  }
}

function lossMass(winloss) {
  hasLoss = true;
  clearInvestimento();
  modifyCell("C" + countMass, winloss);
  XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
  countMass++;
  let doubles =
    parseFloat(getCell("D" + countMass)) > 0
      ? parseFloat(getCell("D" + countMass))
      : parseFloat(getCell("D" + countMass)) * -1;
  console.log(parseFloat(doubles).toFixed(2).toString());
  robot.typeString(parseFloat(doubles).toFixed(2).toString());
  open = false;
}
let bancaAtual = 0;

let canOpen = true;
let hasLoss = false;
function winMass() {
  if (hasLoss) {
    clearInvestimento();
    lossMass("W");

    if (getCell("I" + (countMass - 1)) == "◄◄") {
      console.log(`Takeeee `.green);
      // loss = 0
      // win = 0
      for (let index = countMass; index >= 3; index--) {
        modifyCell("C" + countMass, "");
      }
      // modifyCell('N12', balance.balance.amount.value);
      XLSX_CALC(workbook, { continue_after_error: true, log_error: false });
      countMass = 3;

      // let doubles = parseFloat(getCell('D' + countMass)) > 0 ? parseFloat(getCell('D' + countMass)) : parseFloat(getCell('D' + countMass)) * -1
      // robot.typeString(parseFloat(doubles).toFixed(2).toString());
      // console.log(parseFloat(doubles).toFixed(2).toString());
      open = false;
      hasLoss = false;
    }
  } else {
    open = false;
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
