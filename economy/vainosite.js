const puppeteer = require("puppeteer");
const moment = require('moment-timezone');
const fs = require('fs')
let fsConfig = fs.readFileSync('estrategias.json')
let config = JSON.parse(fsConfig)

var XLSX_CALC = require('xlsx-calc');

let eventosGlobal = []
let eventosAmanha = []
async function buscarEventos(data, hora, URL, moeda, nomeEvento) {
    console.log(data);
    console.log(hora);

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--disable-features=site-per-process'], // Otimiza desempenho
        timeout: 120000
    });

    const page = await browser.newPage();


    if (olhaAmanha && eventosGlobal.length <= 0) {
        await encontraEventos(page, browser);
    }

    const contem = Object.keys(eventosGlobal).some(key => key.includes(nomeEvento));

    if (!contem && olhaAmanha) {
        console.log('NAO contem AMANHA -> ', nomeEvento);
        await browser.close();
        return
    } else {
        eventosAmanha.push(nomeEvento);
        console.log('contem AMANHA -> ', nomeEvento);
    }

    // Navegar sem esperar o carregamento total
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 600000 });

    console.log('Iniciando espera pelo conteúdo...');

    // Aguarda até que o seletor desejado esteja visível na página
    await page.waitForFunction(() => {
        return document.querySelector('.showMoreReplies') !== null;
    }, { timeout: 5000 }).catch(() => console.log('Elemento não encontrado rapidamente'));

    console.log('waitForFunction passou!');

    let achou = false;
    let arrayDatas = [];

    while (!achou) {
        try {
            const eventos = await retornaDatas(page);

            for (const eventoo of eventos) {
                if (removerConteudoEntreParenteses(eventoo.data) == data && eventoo.horario == hora) {
                    // console.log(eventos);
                    achou = true;
                    arrayDatas = eventos;
                    console.log('achou');
                    break;
                }
            }

            if (!achou) {
                console.log('click');
                await page.click('.showMoreReplies').catch(() => console.log('Botão não encontrado'));
                arrayDatas = eventos;

                // Aguarda 1 segundo antes de continuar
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.log(error);
            console.log('error');
            await browser.close();
            break;
        }
    }

    console.log('eventos encontrados:', arrayDatas);
    await browser.close();
    await preencheplanilha(arrayDatas, './planilhas/' + nomeEvento + '.xlsx', nomeEvento, moeda, contem || refaztodas);

}




async function encontraEventos(page, browser) {
    await page.goto("https://br.investing.com/economic-calendar/", { waitUntil: 'domcontentloaded', timeout: 600000 });

    await page.waitForSelector(".js-event-item");

    console.log('waitForFunction AMANHA');

    if (clickAmanha) {
        await page.click('#timeFrame_tomorrow').catch(() => console.log('Botão não encontrado'));
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.click('#timeFrame_tomorrow').catch(() => console.log('Botão não encontrado'));
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.click('#timeFrame_tomorrow').catch(() => console.log('Botão não encontrado'));
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.click('#timeFrame_tomorrow').catch(() => console.log('Botão não encontrado'));
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    try {
        await lookAt();
    } catch (error) {
        console.error("Erro ao capturar eventos:", error);
        lookAt();
    }
    async function lookAt() {
        await page.waitForFunction(() => {
            return Array.from(document.querySelectorAll(".js-event-item"));
        }, { timeout: 600000 });

        const eventos = await page.evaluate(() => {
            let eventosLista = {};
            console.log('chamaaaa');
            document.querySelectorAll(".js-event-item").forEach((event) => {
                const nome = event.querySelector(".event")?.innerText.trim() || "";
                const horario = event.querySelector(".time")?.innerText.trim() || "";
                const moeda = event.querySelector(".left.flagCur .ceFlags")?.getAttribute("title") || "";
                const impacto = event.querySelectorAll(".left.cur .grayFullBullishIcon").length;
                const atualElem = event.querySelector(".act");
                const atual = atualElem?.innerText.trim() || "";
                const previsao = event.querySelector(".fore")?.innerText.trim() || "";
                const anterior = event.querySelector(".prev")?.innerText.trim() || "";

                // Pegando a cor do texto do elemento .act
                const corTexto = atualElem ? window.getComputedStyle(atualElem).color : "";

                eventosLista[nome] = { horario, moeda, impacto, nome, atual, previsao, anterior, corTexto };
            });
            return eventosLista;
        });
        // console.log(eventos);
        eventosGlobal = eventos;

        await browser.close();
    }
}

async function retornaDatas(page) {
    return await page.evaluate(() => {
        function removerConteudoEntreParenteses(texto) {
            return texto.replace(/\([^)]*\)/g, '');
        }
        let times = Array.from(document.querySelectorAll('.genTbl tr')).map(event => {
            const data = removerConteudoEntreParenteses(event.querySelectorAll('td')[0]?.innerText.trim() || "").trim();
            const horario = event.querySelectorAll('td')[1]?.innerText.trim() || "";
            return data && horario ? { data, horario } : null;
        }).filter(event => event !== null);
        return times;
    });
}

function removerConteudoEntreParenteses(texto) {
    return texto.replace(/\([^)]*\)/g, '');
}



var XLSX = require('xlsx');
let sheet = 'EURGBP'
const name = './planilha1.xlsx'
var worksheet
// change some cell value
// console.log(getCell('F4'));
const jwt = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjY1Nzc1MzQsImVtYWlsIjoidmluaXBzaWRvbmlrQGdtYWlsLmNvbSIsImlzcyI6IjI4MDQ6MTA4YzpkNGEyOjEyMDE6Njg4NDo0NTFhOjM1YzI6Nzk3MCIsImlhdCI6MTc0MTMxNzM4NywiZXhwIjoxNzQxMzIwOTg3LCJ0eXBlIjoxLCJwZXJtaXNzaW9ucyI6W119._supT8FTVnsdSoAIkjvtkmGIitAkL1fx1SOb_nVtOFc'
let countMass = 3



const axios = require('axios');
const { url } = require("inspector");
const { includes } = require("lodash");
let asset = {
    'EURGBP': 7,
    'EURUSD': 1,
    'USDJPY': 2,
    'GBPJPY': 13,
    'GBPUSD': 8,
    'USDCAD': 4,
    'AUDCAD': 23,
    'EURJPY': 5,
    'EURCAD': 16,
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
        console.log(params);
        // console.log(url);

        const response = await axios.get(url, { params, headers });
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        console.error(error?.response?.data?.errors);
        console.error(error?.response?.data);
        console.log(url);
        console.log(params);


        // error?.response?.data?.errors
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

let nomesRecalcular = []

const preencheplanilha = async (arrayDatas, nome, nomeEvento, moeda, forcaPlanilha) => {
    const fs = require("fs");
    console.log('preencheplanilha->', nome);

    const arquivoOriginal = "./planilha1.xlsx";

    if (fs.existsSync(nome) && !forcaPlanilha) {
        // fs.unlinkSync(nome);
        console.log("PLANILHA JA EXISTE, NÃO PRECISA =====.");
        return
    }

    if (fs.existsSync(nome) && forcaPlanilha) {
        fs.unlinkSync(nome);
    }

    fs.copyFileSync(arquivoOriginal, nome);
    console.log("Arquivo copiado com sucesso!");

    var workbook = XLSX.readFile(nome);

    nomesRecalcular.push(nome)

    for (let key in asset) {
        console.log('================');
        console.log('key=', key);

        if (!key.includes(moeda)) {
            continue;
        }
        let countPlanilha = 8;
        worksheet = workbook.Sheets[key];

        for (datas of arrayDatas) {
            const dateee = moment(datas.data + ' ' + datas.horario, "DD.MM.YYYY HH:mm:ss");
            if (dateee.isAfter(moment())) {
                continue;
            }
            modifyCell('A' + countPlanilha, datas.data);
            modifyCell('B' + countPlanilha, datas.horario);
            countPlanilha++;
        }

        countPlanilha = 8;
        let continuainteracao = true;

        while (continuainteracao) {
            const data = getCell('A' + countPlanilha);
            const hora = getCell('B' + countPlanilha);

            if (data) {
                console.log('data=', data, 'hora=', hora);

                const dataStr = data + ' ' + hora;
                const timestamp = moment(dataStr, "DD.MM.YYYY HH:mm:ss").valueOf();

                if (timestamp) {
                    const formatedDateTest = moment(dataStr, "DD.MM.YYYY HH:mm:ss").add(3, 'hours');
                    const formatedDate = formatedDateTest.format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
                    const formatedDateplus5 = formatedDateTest.clone().add(5, 'minutes').format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
                    const formatedDateplus15 = formatedDateTest.clone().add(15, 'minutes').format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
                    const formatedDateplus45 = formatedDateTest.clone().add(45, 'minutes').format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");

                    const url = `https://api.binarium.com/api/v1/assets/${asset[key]}/candles`;

                    const agora = moment().add(3, 'hours'); // Tempo atual em UTC

                    // console.log(agora);
                    // console.log(formatedDateTest);

                    if (formatedDateTest.isAfter(agora)) { // ✅ Corrigido aqui
                        console.log("⏩ Data futura, ignorando requisições.");
                        continue; // Sai da função
                    }

                    // Criar chamadas assíncronas em paralelo
                    const [response, response5, response15] = await Promise.all([
                        getData(url, { from: formatedDate, to: formatedDateplus5, detalization: "1m" }),
                        getData(url, { from: formatedDate, to: formatedDateplus15, detalization: "5m" }),
                        getData(url, { from: formatedDate, to: formatedDateplus45, detalization: "15m" })
                    ]);

                    let letra = 'C';
                    // console.log('response');
                    // console.log(response);

                    for (candle of response.data.slice(0, 5)) {
                        let corVela = candle.close > candle.open ? 'VERDE' : candle.close < candle.open ? 'VERMELHA' : 'DOJI';
                        modifyCell(letra + countPlanilha, corVela);
                        letra = getLetra(letra);
                        console.log(corVela);

                    }

                    letra = 'H';
                    // console.log('response5');
                    // console.log(response5);
                    for (candle of response5.data.slice(0, 3)) {
                        let corVela = candle.close > candle.open ? 'VERDE' : candle.close < candle.open ? 'VERMELHA' : 'DOJI';
                        modifyCell(letra + countPlanilha, corVela);
                        letra = getLetra(letra);
                        console.log(corVela);
                    }

                    letra = 'K';
                    // console.log('response15');
                    // console.log(response15);
                    for (candle of response15.data.slice(0, 3)) {
                        let corVela = candle.close > candle.open ? 'VERDE' : candle.close < candle.open ? 'VERMELHA' : 'DOJI';
                        modifyCell(letra + countPlanilha, corVela);
                        letra = getLetra(letra);
                        console.log(corVela);
                    }

                    // if()
                    // process.exit();
                }
                countPlanilha++;
            } else {
                continuainteracao = false;
            }
        }

    }

    await XLSX.writeFile(workbook, nome);


};

// 📌 Adiciona a função COUNTIF

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
        case 'M':
            return 'N';
        case 'N':
            return 'O';
        case 'O':
            return 'P';
        case 'P':
            return 'Q';
        case 'Q':
            return 'R';
        case 'R':
            return 'S';
        case 'S':
            return 'T';
        case 'T':
            return 'U';
        case 'U':
            return 'V';
        case 'V':
            return 'W';
        case 'W':
            return 'X';
        case 'X':
            return 'Y';
        case 'Y':
            return 'Z';
        case 'Z':
            return 'AA';
        case 'AA':
            return 'AB';
        case 'AB':
            return 'AC';
        case 'AC':
            return 'AD';
        case 'AD':
            return 'AE';
        case 'AE':
            return 'AF';
        case 'AF':
            return 'AG';
        case 'AG':
            return 'AH';
        case 'AH':
            return 'AI';
        case 'AI':
            return 'AJ';
        case 'AJ':
            return 'AK';
        case 'AK':
            return 'AL';
        case 'AL':
            return 'AM';
        case 'AM':
            return 'AN';
        case 'AN':
            return 'AO';
        case 'AO':
            return 'AP';
        case 'AP':
            return 'AQ';
        case 'AQ':
            return 'AR';
        case 'AR':
            return 'AS';
        case 'AS':
            return 'AT';
        default:
            break;
    }
}




let eventosUrl = [
    {
        alvoData: '22.06.2015 14:00',
        url: 'https://br.investing.com/economic-calendar/euro-summit-1644',
        moeda: 'EUR',
        nomeEvento: 'Cúpula da Zona do Euro',
    },
    {
        alvoData: '02.02.2023 10:45',
        url: 'https://br.investing.com/economic-calendar/ecb-press-conference-396',
        moeda: 'EUR',
        nomeEvento: 'Coletiva de Imprensa do BCE',
    },
    {
        alvoData: '04.10.2023 09:15',
        url: 'https://br.investing.com/economic-calendar/adp-nonfarm-employment-change-1',
        moeda: 'USD',
        nomeEvento: 'Variação de Empregos Privados ADP',
    },
    {
        alvoData: '19.10.2022 15:00',
        url: 'https://br.investing.com/economic-calendar/beige-book-10',
        moeda: 'USD',
        nomeEvento: 'Livro Bege',
    },
    {
        alvoData: '09.01.2024 07:00',
        url: 'https://br.investing.com/economic-calendar/unemployment-rate-299',
        moeda: 'EUR',
        nomeEvento: 'Taxa de Desemprego na Zona Euro',
    },
    {
        alvoData: '30.05.2024 13:05',
        url: 'https://br.investing.com/economic-calendar/fomc-member-williams-speaks-1585',
        moeda: 'USD',
        nomeEvento: 'Discurso de Williams, membro do FOMC',
    },
    {
        alvoData: '20.10.2022 07:00',
        url: 'https://br.investing.com/economic-calendar/eu-leaders-summit-1647',
        moeda: 'EUR',
        nomeEvento: 'Cúpula de Líderes da UE',
    },
    {
        alvoData: '13.07.2023 08:30',
        url: 'https://br.investing.com/economic-calendar/ecb-publishes-account-of-monetary-policy-meeting-1610',
        moeda: 'EUR',
        nomeEvento: 'BCE Publica Atas da Reunião de Política Monetária',
    },
    {
        alvoData: '14.04.2022 08:45',
        url: 'https://br.investing.com/economic-calendar/ecb-monetary-policy-statement-1845',
        moeda: 'EUR',
        nomeEvento: 'Declaração de Política Monetária do BCE',
    },
    {
        alvoData: '27.10.2022 09:15',
        url: 'https://br.investing.com/economic-calendar/ecb-marginal-lending-facility-1744',
        moeda: 'EUR',
        nomeEvento: 'BCE Facilidade Permanente de Cedência de Liquidez',
    },
    {
        alvoData: '10.02.2023 18:00',
        url: 'https://br.investing.com/economic-calendar/fomc-member-harker-speaks-1666',
        moeda: 'EUR',
        nomeEvento: 'Discurso de Harker, membro do FOMC',
    },
    {
        alvoData: '06.02.2025 06:30',
        url: 'https://br.investing.com/economic-calendar/construction-pmi-44',
        moeda: 'GBP',
        nomeEvento: 'PMI de Construção',
    },
    {
        alvoData: '28.02.2023 09:30',
        url: 'https://br.investing.com/economic-calendar/boe-mpc-member-catherine-l-mann-2009',
        moeda: 'GBP',
        nomeEvento: 'Discurso de Mann, membro do CPM do BoE',
    },

    {
        alvoData: '12.06.2024 16:30',
        url: 'https://br.investing.com/economic-calendar/german-buba-president-nagel-speech-2015',
        moeda: 'EUR',
        nomeEvento: 'Discurso de Nagel, Presidente do Bundesbank',
    },

    {
        alvoData: '02.07.2024 10:30',
        url: 'https://br.investing.com/economic-calendar/ecb-president-lagarde-speaks-1965',
        moeda: 'EUR',
        nomeEvento: 'Discurso de Christine Lagarde, Presidente do BCE',
    },
    {
        alvoData: '10.01.2023 07:00',
        url: 'https://br.investing.com/economic-calendar/german-buba-vice-president-buch-speaks-1978',
        moeda: 'EUR',
        nomeEvento: 'Pronunciamento de Buch, vice-presidente do BC alemão',
    },

    {
        alvoData: '06.04.2022 03:00',
        url: 'https://br.investing.com/economic-calendar/german-factory-orders-130',
        moeda: 'EUR',
        nomeEvento: 'Encomendas à Indústria - Alemanha (Mensal)',
    },




]

// console.log(eventosUrl.filter(eventol => eventol.nomeEvento == 'BCE Facilidade Permanente de Cedência de Liquidez'));


async function processarEventos() {
    for (evento of eventosUrl) {
        const URL = evento.url
        const dataiterar = moment(evento.alvoData, "DD.MM.YYYY HH:mm", "America/Sao_Paulo");

        const dataFormatada = dataiterar.format("DD.MM.YYYY");
        const horaFormatada = dataiterar.format("HH:mm");


        await buscarEventos(dataFormatada.trim(), horaFormatada.trim(), URL, evento.moeda, evento.nomeEvento);
    }

    console.log('INICIA RECALCULOS ====');

    let terminou = false;
    nomesRecalcular.map(async evento => {
        let nomeEventoo = evento.split('/')[2].split('.')[0]
        console.log('nomeEventoo=', nomeEventoo);

        let moeda = eventosUrl.filter(eventol => eventol.nomeEvento == nomeEventoo)[0].moeda

        console.log('evento=====', evento);
        console.log('moeda=', moeda);

        var workbook = XLSX.readFile(evento);
        XLSX_CALC(workbook, { continue_after_error: true, log_error: false });

        config[evento] = {}

        for (let key in asset) {
            console.log('================');
            console.log('key=', key);
            if (key == 'EURCAD')
                terminou = true
            if (!key.includes(moeda)) {
                continue;
            }
            let countPlanilha = 8;
            worksheet = workbook.Sheets[key];
            let fluxoCounter = 4;
            let reversaoCounter = 6;
            letra = 'N';

            if (typeof config[evento][key] == "undefined") {
                config[evento][key] = {};
            }
            if (typeof config[evento][key].estrategias == "undefined") {
                config[evento][key].estrategias = []
            }
            if (config[evento][key].estrategias.length > 0) {
                config[evento][key].estrategias = []
            }
            while (letra != 'AN') {
                // console.log(letra + fluxoCounter);
                let fluxo = getCell(letra + fluxoCounter);
                let reversao = getCell(letra + reversaoCounter);


                // console.log('fluxo=', fluxo, 'reversao=', reversao);


                if (fluxo >= 0.75) {
                    console.log('-------------');
                    console.log('FLUXO/COMPRA - ', fluxo);
                    console.log(letra + fluxoCounter);
                    console.log(getCell(letra + 1));
                    config[evento][key].estrategias.push('FLUXO/COMPRA - ' + fluxo + ' - ' + getCell(letra + 1))
                }

                if (reversao >= 0.75) {
                    console.log('-------------');
                    console.log('REVERSAO/VENDA - ', reversao);
                    console.log(letra + reversaoCounter);
                    console.log(getCell(letra + 1));
                    config[evento][key].estrategias.push('REVERSAO/VENDA - ' + reversao + ' - ' + getCell(letra + 1))
                }

                letra = getLetra(letra);
            }
        }

    })


    const terminar = setInterval(() => {
        if (terminou) {
            console.log('Writeeee');
            fs.writeFile('estrategias.json', JSON.stringify(config, null, 4), err => {
            });

            console.log(eventosAmanha);
            clearInterval(terminar);
        }
    }, 1000);

}

processarEventos();

let olhaAmanha = false
let clickAmanha = true
let refaztodas = true


//Coletiva de Imprensa do BCE - 2x4