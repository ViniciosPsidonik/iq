const puppeteer = require('puppeteer')

let corretora = "expert";



const open = async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({width: 1080, height: 1024});

    await page.goto('https://dapp.spectre.ai/dashboard');


    setTimeout(async () => {


        await page.evaluate(async () => {

            const awaitlogin = (type) => {
                return new Promise((resolve, reject) => {
                    setInterval(() => {
                        if (typeof document.querySelector("#user_email") != "undefined") {
                            resolve()
                        }
                    }, 500);
                })
            }
            await awaitlogin()
            document.querySelector("#user_email").value = "vinipsidonik@gmail.com"


            document.querySelector("#user_password").value = "gc896426"
            document.querySelector("#login_validate_btn").click()
        })

    }, 1500);
}

open()