const puppeteer = require('puppeteer')
const fs = require('fs')
const axios = require('axios')
const _ = require('lodash')

let productsSnooper = fs.readFileSync('productsSnooper.json')
let productsSnooperjson = JSON.parse(productsSnooper)
let productsSnooperjsonAux = []
let getProductss = 0

let max = 25
let maxmax = 200
let min = 10

let apisnooper = 'https://cbsnooper.com/api/products/'

let pages = ['https://cbsnooper.com/reports/new-clickbank-products',
    'https://cbsnooper.com/reports/rising-clickbank-products',
    'https://cbsnooper.com/reports/falling-clickbank-products',
    'https://cbsnooper.com/reports/recurring-clickbank-products'
]

let goodProducts = []

async function logic() {
    let arraySemRepeticao = getProductss ? await getProducts() : productsSnooperjson
    for (let index = 0; index < arraySemRepeticao.length; index++) {
        
        const item = arraySemRepeticao[index];
        let res = await getsnooperapi(apisnooper + item)
        // console.log(res.data.data.product);
        console.log(index);
        let ghistory = _.get(res.data.data, 'gravity_history').data
        let menor = 99999
        let maior = 0
        for (let indexi = 0; indexi < ghistory.length; indexi++) {
            const gh = ghistory[indexi];
            if (gh.value < menor) {
                menor = gh.value
            }

            if (gh.value > maior) {
                maior = gh.value
            }
        }
        if (menor <= min && maior >= max && maior < maxmax) {
            goodProducts.push(res.data.data.product)
        }
    }
    console.log(goodProducts);
}

async function getsnooperapi(url) {
    return new Promise((resolve, reject) => {
        let res = axios.get(url)
        setTimeout(() => {
            resolve(res)
        }, 1000);
    })
}

async function getProducts() {
    const browser = await puppeteer.launch({ headless: false })
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 5000 })
    for (let index = 0; index < pages.length; index++) {
        const pag = pages[index]
        await page.goto(pag)
        await page.waitForTimeout(2000)
        let passPage = false
        while (!passPage) {
            let length = productsSnooperjsonAux.length
            await page.waitForTimeout(3000)
            productsSnooperjsonAux = await page.evaluate((products) => {
                var tdElements = document.querySelectorAll('#spark-app > div.mainpanel > div:nth-child(4) > div.col-md-10 > div > div.panel-body > div > div.table-responsive > table > tbody tr')

                for (let i = 0; i < tdElements.length; i++) {
                    let tr = tdElements[i]

                    if (typeof tr.querySelectorAll('td')[1] != "undefined") {
                        // if (!products.includes(tr.querySelectorAll('td')[1].innerText)) {
                        products.push(tr.querySelectorAll('td')[1].innerText)
                        // }
                    }

                }
                console.log(products)
                return products
            }, productsSnooperjsonAux)


            passPage = await page.evaluate((obj) => {
                let lastPage = document.querySelector('#spark-app > div.mainpanel > div:nth-child(4) > div.col-md-10 > div > div.panel-body > div > div.table-responsive > div.vuetable-pagination > div:nth-child(2) > div.dataTables_paginate.paging_full_numbers.paginate_button > a:nth-child(7)')
                if (lastPage) {
                    console.log(lastPage)

                    if (lastPage.classList.contains('current')) {
                        return true
                    } else {
                        let button = document.querySelector('#spark-app > div.mainpanel > div:nth-child(4) > div.col-md-10 > div > div.panel-body > div > div.table-responsive > div.vuetable-pagination > div:nth-child(2) > div.dataTables_paginate.paging_full_numbers.paginate_button > a:nth-child(8)')
                        if (obj.length < obj.productsSnooperjsonAux.length)
                            button.click()
                    }
                } else {
                    return true
                }
            }, { productsSnooperjsonAux, length })
            // await page.waitForTimeout(200000);
            console.log(productsSnooperjsonAux.length)
        }
        // await evaluate('#hello > div > div > div > div > div.home_btns.m-top-60 > a.btn.btn-default.btn-lg.m-top-30', 'click'
        //     , page)
        // type(page, '#spark-app > section > div > div > div.col-md-5 > form > input.form-control.uname', )
    }



    let arraySemRepeticao = [...new Set(productsSnooperjsonAux)]

    for (let index = 0; index < productsSnooperjson.length; index++) {
        const element = productsSnooperjson[index]
        if (!arraySemRepeticao.includes(element)) {
            arraySemRepeticao.push(element)
        }
    }

    console.log(arraySemRepeticao.length)
    fs.writeFile('productsSnooper.json', JSON.stringify(arraySemRepeticao, null, 4), err => {
        console.log(err || 'Arquivo salvo')
    })
    return arraySemRepeticao
}

async function write(page, sel, text) {
    await page.focus(sel); // Focar no campo de entrada
    await page.keyboard.type(text);
}

async function evaluateClick(sel, action, page) {
    await page.evaluate(() => {
        // Código a ser executado no contexto da página
        const selector = '#spark-app > section > div > div > div.col-md-5 > form > input.form-control.uname';

        // Exemplo: Obter o texto de um elemento específico
        const element = document.querySelector(sel);
        if (action == 'click')
            return element.click();
    });
}

logic()