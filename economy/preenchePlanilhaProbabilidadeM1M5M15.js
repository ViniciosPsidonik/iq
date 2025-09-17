
var XLSX = require('xlsx');
let sheet = 'EURGBP'
const moment = require('moment')
const name = './PLANILHA--DE--PROBABILIDADE--AUTOMATIZADA---M1-M5-M15 - Copia.xlsx'
var workbook = XLSX.readFile(name);
var worksheet = workbook.Sheets[sheet]
// change some cell value
// console.log(getCell('F4'));
const jwt = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjY1Nzc1MzQsImVtYWlsIjoidmluaXBzaWRvbmlrQGdtYWlsLmNvbSIsImlzcyI6IjI4MDQ6MTA4YzpkNGZhOmZjMDE6ZThmZDplNTY4OjQzNDM6NDVlMCIsImlhdCI6MTc0MDc4MjIyMCwiZXhwIjoxNzQwNzg1ODIwLCJ0eXBlIjoxLCJwZXJtaXNzaW9ucyI6W119.WTas9CN1_TFhcKFqN6ZC7zxb20eBmfwY8-bD_GuerXk'
let countMass = 3



const axios = require('axios');
let asset = {
    'EURGBP': 7,
    'EURUSD': 1,
    'USDJPY': 2,
    'GBPUSD': 8,
}

const headers = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "pt",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "x-jwt": jwt,
    "Referer": "https://binarium.com/",
    "Referrer-Policy": "strict-origin-when-cross-origin"
};

async function getData(url, params) {
    try {
        // console.log(params);
        // console.log(urcl);

        const response = await axios.get(url, { params, headers });
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar dados:", error.response.status);
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

function getCell(cellString) {
    if (typeof worksheet[cellString] != "undefined") {
        return worksheet[cellString].v
    } else {
        return undefined
    }
}
const convertExcelTimeToString = (excelTime) => {
    const totalSeconds = Math.round(excelTime * 24 * 60 * 60); // Converter dias para segundos
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

(async () => {
    for (let key in asset) {
        console.log('================');
        console.log('key=', key);
        let countPlanilha = 8
        worksheet = workbook.Sheets[key]
        let continuainteracao = true
        while (continuainteracao) {
            const data = getCell('A' + countPlanilha);
            const hora = convertExcelTimeToString(getCell('B' + countPlanilha));
            const vela = getCell('C' + countPlanilha);
            if (!vela && data) {

                console.log('data=', data, 'hora=', hora);

                const size = 60
                const dataStr = data + ' ' + hora
                const timestamp = moment(data + ' ' + hora, "DD.MM.YYYY HH:mm:ss").valueOf();

                // console.log('timestampreq=', timestamp);

                if (timestamp) {
                    const formatedDate = moment(dataStr, "DD.MM.YYYY HH:mm:ss").utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
                    const formatedDateplus5 = moment(dataStr, "DD.MM.YYYY HH:mm:ss").add(5, 'minutes').utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");

                    // console.log('formatedDate=', formatedDate);
                    // console.log('formatedDateplus5=', formatedDateplus5);

                    const params = {
                        from: formatedDate,
                        to: formatedDateplus5,
                        detalization: "1m"
                    };

                    const url = `https://api.binarium.com/api/v1/assets/${asset[key]}/candles`;
                    const response = await getData(url, params);

                    if (response.data.length > 5) {
                        response.data.pop()
                    }

                    let letra = 'C'
                    console.log('response=', response.data.length);
                    for (candle of response.data) {
                        // console.log(candle);
                        let corVela = candle.close > candle.open ? 'VERDE' : candle.close < candle.open ? 'VERMELHA' : 'DOJI'
                        modifyCell(letra + countPlanilha, corVela);
                        letra = getLetra(letra);
                    }

                    const formatedDateplus15 = moment(dataStr, "DD.MM.YYYY HH:mm:ss").add(15, 'minutes').utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");

                    const params5 = {
                        from: formatedDate,
                        to: formatedDateplus15,
                        detalization: "5m"
                    };

                    const response5 = await getData(url, params5);

                    if (response5.data.length > 3) {
                        response5.data.pop()
                    }

                    console.log('response5=', response5.data.length);

                    letra = 'H'
                    for (candle of response5.data) {
                        // console.log(candle);
                        let corVela = candle.close > candle.open ? 'VERDE' : candle.close < candle.open ? 'VERMELHA' : 'DOJI'
                        modifyCell(letra + countPlanilha, corVela);
                        letra = getLetra(letra);
                    }

                    const formatedDateplus45 = moment(dataStr, "DD.MM.YYYY HH:mm:ss").add(45, 'minutes').utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");

                    const params15 = {
                        from: formatedDate,
                        to: formatedDateplus45,
                        detalization: "15m"
                    };

                    const response15 = await getData(url, params15);

                    if (response15.data.length > 3) {
                        response15.data.pop()
                    }

                    console.log('response15=', response15.data.length);

                    letra = 'K'
                    for (candle of response15.data) {
                        // console.log(candle);
                        let corVela = candle.close > candle.open ? 'VERDE' : candle.close < candle.open ? 'VERMELHA' : 'DOJI'
                        modifyCell(letra + countPlanilha, corVela);
                        letra = getLetra(letra);
                    }

                }
                countPlanilha++;
                // continuainteracao = false
            } else {
                continuainteracao = false
            }
        }
    }
    XLSX.writeFile(workbook, name, { bookType: "xlsx", cellStyles: true });
})();


function getLetra(letra) {
    switch (letra) {
        case 'C':
            return 'D';
        case 'D':
            return 'E';
        case 'E':
            return 'F';
        case 'F':
            return 'G';
        case 'G':
            return 'H';
        case 'H':
            return 'I';
        case 'I':
            return 'J';
        case 'J':
            return 'K';
        case 'K':
            return 'L';
        case 'L':
            return 'M';
        default:
            break;
    }
}



