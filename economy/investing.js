const axios = require('axios')
const express = require("express");
const puppeteer = require("puppeteer");
const moment = require('moment');
const app = express();
const PORT = 3000;

const URL = "https://br.investing.com/economic-calendar/";

let nomeEvento = 'IPC Alemanha (Anual) (Fev)'
const corCall = 'rgb(14, 166, 0)'
const corPut = 'rgb(255, 0, 0)'

// Função para buscar eventos econômicos
async function buscarEventos() {
    console.log('buscaaa');

    const browser = await puppeteer.launch({
        headless: false, args: ['--disable-features=site-per-process'], // Otimiza desempenho
        timeout: 120000
    });
    const page = await browser.newPage();

    // await page.setUserAgent("Mozilla/5.0");
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 600000 });

    // Aguarda a tabela carregar
    await page.waitForSelector(".js-event-item");

    console.log('waitForFunction');
    // Extrai os eventos
    // const eventosInt = setInterval(async () => {
    try {
        await lookAt();
    } catch (error) {
        console.error("Erro ao capturar eventos:", error);
        lookAt();
    }
    async function lookAt() {
        await page.waitForFunction(() => {
            return Array.from(document.querySelectorAll(".js-event-item"))
                .some(event => {
                    const nome = event.querySelector(".event")?.innerText.trim() || "";
                    let atual = event.querySelector(".act")?.innerText.trim() || "";

                    // Substituir &nbsp; por um espaço normal e remover espaços extras
                    atual = atual.replace(/\u00A0/g, "").trim();

                    return nome === 'Encomendas à Indústria - Alemanha (Mensal) (Jan)' && atual !== '';
                });
        }, { timeout: 600000 });

        const eventos = await page.evaluate(() => {
            let eventosLista = {};
            let achou = false;
            // const eventosInt = setInterval(() => {
            console.log('chamaaaa');
            document.querySelectorAll(".js-event-item").forEach((event) => {
                const nome = event.querySelector(".event")?.innerText.trim() || "";
                if ('Encomendas à Indústria - Alemanha (Mensal) (Jan)' == nome) {
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
                    console.log(eventosLista);
                    if (atual != '') {
                        achou = true;
                        // clearInterval(eventosInt)
                    }
                }
            });
            // }, 500);
            // const eventosIntrr = setInterval(() => {
            // if (achou) {
            // clearInterval(eventosIntrr)
            return eventosLista;
            //     }
            // }, 500);
        });
        console.log(eventos);
        console.log('eventos');

        await browser.close();

        const direction = eventos['Encomendas à Indústria - Alemanha (Mensal) (Jan)'].corTexto == corCall ? 'call' : 'put';

        axios.get(`http://localhost:1234/${direction}/${ativo}/${time}`)

    }
}


async function agendarFuncao(dataHoraDefinida) {
    const agora = moment();
    let horaAlvo = moment(dataHoraDefinida, "YYYY-MM-DD HH:mm");

    // Subtrai 5 minutos da hora definida
    horaAlvo.subtract(5, 'minutes');

    // Calcula a diferença em milissegundos
    const diferenca = horaAlvo.diff(agora);

    console.log(`📅 Agora: ${agora.format("YYYY-MM-DD HH:mm:ss")}`);
    console.log(`🎯 Hora alvo: ${horaAlvo.format("YYYY-MM-DD HH:mm:ss")}`);
    console.log(`⏳ Tempo até execução: ${diferenca / 1000} segundos`);

    if (diferenca > 0) {
        setTimeout(async () => {
            console.log("🔔 Chamando buscarEventos()...");
            await buscarEventos();
        }, diferenca);
    } else {
        // console.log("⏰ O horário já passou! Nenhuma ação agendada.");
        await buscarEventos();
    }
}

// Simulação da função assíncrona
// async function buscarEventos() {
//     console.log("🚀 Executando buscarEventos em:", moment().format("YYYY-MM-DD HH:mm:ss"));
// }

// 🕒 Defina o horário e dia desejado
const dataHoraDefinida = "2025-03-07 04:00"; // Formato: YYYY-MM-DD HH:mm
agendarFuncao(dataHoraDefinida);

const ativo = 'EURJPY'
const time = 5


axios.get(`http://localhost:1234/set/${ativo}/${time}`)