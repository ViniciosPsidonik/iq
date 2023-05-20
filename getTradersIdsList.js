const axios = require('axios')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

axios.get('https://iqranking.online/?vm=50&p=1').then((response) => {
    const dom = new JSDOM(response.data)
    const tbody = dom.window.document.querySelector('tbody').children
    console.log(tbody)
    for (let index = 0; index < tbody.length; index++) {
        // console.log(tbody[index].children)
        const subElement = tbody[index].children[0]
        console.log(subElement.textContent);
        console.log('=======');
    }

})