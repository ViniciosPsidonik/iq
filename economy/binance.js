const axios = require('axios');

const API_KEY = 'SUA_CHAVE';
const SYMBOL = 'USD/JPY';
const INTERVAL = '1min';

async function getForexData() {
    const url = `https://api.twelvedata.com/time_series?symbol=${SYMBOL}&interval=${INTERVAL}&apikey=${API_KEY}`;

    try {
        const response = await axios.get(url);
        console.log(response.data);
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
    }
}

getForexData();
