const fs = require('fs');
const axios = require('axios')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

let copyIds = ''
const getBestsTraders = (i) => {
    return new Promise((resolve, reject) => {
        axios.get('https://iqranking.online/?vm=50&p=' + i).then((response) => {
            const dom = new JSDOM(response.data)
            const tbody = dom.window.document.querySelector('tbody').children
            for (let index = 0; index < tbody.length; index++) {
                const subElementTextContent = tbody[index].children[0].textContent
                console.log(subElementTextContent);
                const userId = parseInt(subElementTextContent)
                if (!isNaN(userId)) {
                    copyIds += `${userId}\r\n`
                }
            }
            resolve()
        })
    })
}

const dosss = async () => {
    for (let i = 1; i <= 10; i++) {
        await getBestsTraders(i)
    }
    fs.writeFile("ids.txt", copyIds, async (err) => {
        console.log('Deu tudo certo...');
    })
}

dosss()

// fs.writeFile("/", "Hey there!", async (err) => {
//     for (let i = 1; i <= 10; i++) {
//         await getBestsTraders(i)
//     }

//     if(err) {
//         return console.log(err);
//     }
//     console.log("The file was saved!");
// }); 
