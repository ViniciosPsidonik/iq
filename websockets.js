const onOpen = () => {
    if (log)
        console.log(`Connected with websocket..`)
}

const onError = error => {
    console.log(`WebSocket error: ${error}`)
}

const EURUSDOTC = new WebSocket(url)
EURUSDOTC.onopen = onOpen
EURUSDOTC.onerror = onError
EURUSDOTC.onmessage = onMessage
const USDCHFOTC = new WebSocket(url)
USDCHFOTC.onopen = onOpen
USDCHFOTC.onerror = onError
USDCHFOTC.onmessage = onMessage
const GBPUSDOTC = new WebSocket(url)
GBPUSDOTC.onopen = onOpen
GBPUSDOTC.onerror = onError
GBPUSDOTC.onmessage = onMessage
const AUDCAD = new WebSocket(url)
AUDCAD.onopen = onOpen
AUDCAD.onerror = onError
AUDCAD.onmessage = onMessage
const AUDCHF = new WebSocket(url)
AUDCHF.onopen = onOpen
AUDCHF.onerror = onError
AUDCHF.onmessage = onMessage
const AUDJPY = new WebSocket(url)
AUDJPY.onopen = onOpen
AUDJPY.onerror = onError
AUDJPY.onmessage = onMessage
const AUDNZD = new WebSocket(url)
AUDNZD.onopen = onOpen
AUDNZD.onerror = onError
AUDNZD.onmessage = onMessage
const AUDUSD = new WebSocket(url)
AUDUSD.onopen = onOpen
AUDUSD.onerror = onError
AUDUSD.onmessage = onMessage
const CADCHF = new WebSocket(url)
CADCHF.onopen = onOpen
CADCHF.onerror = onError
CADCHF.onmessage = onMessage
const EURGBP = new WebSocket(url)
EURGBP.onopen = onOpen
EURGBP.onerror = onError
EURGBP.onmessage = onMessage
const EURJPY = new WebSocket(url)
EURJPY.onopen = onOpen
EURJPY.onerror = onError
EURJPY.onmessage = onMessage
const EURUSD = new WebSocket(url)
EURUSD.onopen = onOpen
EURUSD.onerror = onError
EURUSD.onmessage = onMessage
const GBPAUD = new WebSocket(url)
GBPAUD.onopen = onOpen
GBPAUD.onerror = onError
GBPAUD.onmessage = onMessage
const GBPCAD = new WebSocket(url)
GBPCAD.onopen = onOpen
GBPCAD.onerror = onError
GBPCAD.onmessage = onMessage
const GBPCHF = new WebSocket(url)
GBPCHF.onopen = onOpen
GBPCHF.onerror = onError
GBPCHF.onmessage = onMessage
const GBPJPY = new WebSocket(url)
GBPJPY.onopen = onOpen
GBPJPY.onerror = onError
GBPJPY.onmessage = onMessage
const GBPNZD = new WebSocket(url)
GBPNZD.onopen = onOpen
GBPNZD.onerror = onError
GBPNZD.onmessage = onMessage
const GBPUSD = new WebSocket(url)
GBPUSD.onopen = onOpen
GBPUSD.onerror = onError
GBPUSD.onmessage = onMessage
const NZDUSD = new WebSocket(url)
NZDUSD.onopen = onOpen
NZDUSD.onerror = onError
NZDUSD.onmessage = onMessage
const USDCAD = new WebSocket(url)
USDCAD.onopen = onOpen
USDCAD.onerror = onError
USDCAD.onmessage = onMessage
const USDCHF = new WebSocket(url)
USDCHF.onopen = onOpen
USDCHF.onerror = onError
USDCHF.onmessage = onMessage
const USDJPY = new WebSocket(url)
USDJPY.onopen = onOpen
USDJPY.onerror = onError
USDJPY.onmessage = onMessage
const USDNOK = new WebSocket(url)
USDNOK.onopen = onOpen
USDNOK.onerror = onError
USDNOK.onmessage = onMessage

const EURUSDOTC = new WebSocket(url)
EURUSDOTC.onopen = onOpen
EURUSDOTC.onerror = onError
EURUSDOTC.onmessage = onMessage
const USDCHFOTC = new WebSocket(url)
USDCHFOTC.onopen = onOpen
USDCHFOTC.onerror = onError
USDCHFOTC.onmessage = onMessage
const GBPUSDOTC = new WebSocket(url)
GBPUSDOTC.onopen = onOpen
GBPUSDOTC.onerror = onError
GBPUSDOTC.onmessage = onMessage
const AUDCAD = new WebSocket(url)
AUDCAD.onopen = onOpen
AUDCAD.onerror = onError
AUDCAD.onmessage = onMessage
const AUDCHF = new WebSocket(url)
AUDCHF.onopen = onOpen
AUDCHF.onerror = onError
AUDCHF.onmessage = onMessage
const AUDJPY = new WebSocket(url)
AUDJPY.onopen = onOpen
AUDJPY.onerror = onError
AUDJPY.onmessage = onMessage
const AUDNZD = new WebSocket(url)
AUDNZD.onopen = onOpen
AUDNZD.onerror = onError
AUDNZD.onmessage = onMessage
const AUDUSD = new WebSocket(url)
AUDUSD.onopen = onOpen
AUDUSD.onerror = onError
AUDUSD.onmessage = onMessage
const CADCHF = new WebSocket(url)
CADCHF.onopen = onOpen
CADCHF.onerror = onError
CADCHF.onmessage = onMessage
const EURGBP = new WebSocket(url)
EURGBP.onopen = onOpen
EURGBP.onerror = onError
EURGBP.onmessage = onMessage
const EURJPY = new WebSocket(url)
EURJPY.onopen = onOpen
EURJPY.onerror = onError
EURJPY.onmessage = onMessage
const EURUSD = new WebSocket(url)
EURUSD.onopen = onOpen
EURUSD.onerror = onError
EURUSD.onmessage = onMessage
const GBPAUD = new WebSocket(url)
GBPAUD.onopen = onOpen
GBPAUD.onerror = onError
GBPAUD.onmessage = onMessage
const GBPCAD = new WebSocket(url)
GBPCAD.onopen = onOpen
GBPCAD.onerror = onError
GBPCAD.onmessage = onMessage
const GBPCHF = new WebSocket(url)
GBPCHF.onopen = onOpen
GBPCHF.onerror = onError
GBPCHF.onmessage = onMessage
const GBPJPY = new WebSocket(url)
GBPJPY.onopen = onOpen
GBPJPY.onerror = onError
GBPJPY.onmessage = onMessage
const GBPNZD = new WebSocket(url)
GBPNZD.onopen = onOpen
GBPNZD.onerror = onError
GBPNZD.onmessage = onMessage
const GBPUSD = new WebSocket(url)
GBPUSD.onopen = onOpen
GBPUSD.onerror = onError
GBPUSD.onmessage = onMessage
const NZDUSD = new WebSocket(url)
NZDUSD.onopen = onOpen
NZDUSD.onerror = onError
NZDUSD.onmessage = onMessage
const USDCAD = new WebSocket(url)
USDCAD.onopen = onOpen
USDCAD.onerror = onError
USDCAD.onmessage = onMessage
const USDCHF = new WebSocket(url)
USDCHF.onopen = onOpen
USDCHF.onerror = onError
USDCHF.onmessage = onMessage
const USDJPY = new WebSocket(url)
USDJPY.onopen = onOpen
USDJPY.onerror = onError
USDJPY.onmessage = onMessage
const USDNOK = new WebSocket(url)
USDNOK.onopen = onOpen
USDNOK.onerror = onError
USDNOK.onmessage = onMessage