var robot = require("robotjs");

// Get mouse position.
setInterval(() => {

    var mouse = robot.getMousePos();
    var hex = robot.getPixelColor(mouse.x, mouse.y);
    console.log("#" + hex + " at x:" + mouse.x + " y:" + mouse.y);
}, 2000);



// x:349 y:819 caixa sql 

const func = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()

        }, 50);

    })
}


setInterval(() => {
    // robot.mouseClick();
    // robot.keyTap("tab", "control");
}, 30000);


let count = 0


async function ninja() {
    robot.moveMouse(140, 274);
    robot.mouseClick();
    await func()
    robot.moveMouse(140, 341);
    robot.mouseClick();
    await func()
    robot.moveMouse(143, 288);
    robot.mouseClick();
    await func()
    robot.moveMouse(190, 355);
    robot.mouseClick();
    await func()
    robot.moveMouse(381, 255);
    robot.mouseClick();
    await func()
    robot.moveMouse(420, 304);
    robot.mouseClick();
    await func()
    robot.moveMouse(372, 291);
    robot.mouseClick();
    await func()
    robot.moveMouse(372, 331);
    robot.mouseClick();
    await func()
    robot.moveMouse(631, 258);
    robot.mouseClick();
    await func()
    robot.typeString("08:00")
    await func()
    robot.moveMouse(673, 261);
    robot.mouseClick();
    await func()
    robot.typeString("12:00")
    await func()
    robot.moveMouse(623, 286);
    robot.mouseClick();
    await func()
    robot.typeString("13:00")
    await func()
    robot.moveMouse(688, 289);
    robot.mouseClick();
    await func()
    robot.typeString("17:00")
    await func()
    robot.moveMouse(749, 261);
    robot.mouseClick();
    await func()
    robot.typeString("Desenvolvimento")
    await func()
    robot.moveMouse(749, 284);
    robot.mouseClick();
    await func()
    robot.typeString("Desenvolvimento")
    await func()
    robot.moveMouse(742, 611);
    robot.mouseClick();
}

ninja()


async function loop() {
    if (sql) {

        count++
        console.log(count);
        if (count > -1)
            return
        // chrome note visual

        // // posicao notepad++
        robot.moveMouse(558, 1055);
        robot.mouseClick();
        // await func()
        // poscao inicio arquivo
        robot.moveMouse(76, 111);
        robot.mouseClick();
        robot.keyTap("end", "control");
        robot.keyTap("end");
        robot.keyTap("home", "shift");
        robot.keyTap("c", "control");
        robot.keyTap("end");
        robot.keyTap("home", "shift");
        robot.keyTap("backspace");
        robot.keyTap("backspace");

        // clica crhome
        robot.moveMouse(521, 1066);
        robot.mouseClick();
        // await func()
        // clica box sql 
        robot.moveMouse(247, 876);
        robot.mouseClick();
        robot.keyTap("a", "control");
        robot.keyTap("delete");
        robot.keyTap("v", "control");
        // posicao botao
        robot.moveMouse(93, 987);
        robot.mouseClick();
        robot.moveMouse(51, 1014);
        robot.mouseClick();
        robot.moveMouse(102, 1030);
        robot.mouseClick();
        robot.moveMouse(605, 1057);
        robot.mouseClick();
        //posicao visual studio
        // robot.moveMouse(76, 1034);
        // robot.mouseClick();
        await func()
        // await func()
        loop()
    }
};


let countt = 0;


async function loop1() {
    countt++
    console.log(countt)
    //notepad ++
    robot.moveMouse(558, 1055);
    robot.mouseClick();
    await func()
    //clica fim da linha
    robot.moveMouse(1570, 106);
    robot.mouseClick();
    robot.keyTap("home", "control");
    robot.keyTap("pagedown", "shift");
    robot.keyTap("pagedown", "shift");
    robot.keyTap("pagedown", "shift");
    robot.keyTap("pagedown", "shift");
    robot.keyTap("pagedown", "shift");
    robot.keyTap("pagedown", "shift");
    robot.keyTap("x", "control");
    // return
    //executar botao
    // robot.moveMouse(874, 562);
    // robot.mouseClick();
    // await func()
    // await func()
    // clicar chrome
    robot.moveMouse(518, 1061);
    robot.mouseClick();
    await func()
    // clica setar sql
    robot.moveMouse(1349, 1);
    robot.mouseClick();
    // clica tela
    robot.moveMouse(679, 582);
    robot.mouseClick();

    // vai para baixa guia
    robot.keyTap("end", "control");
    await func()
    // clica box sql
    robot.moveMouse(95, 927);
    robot.mouseClick();
    robot.keyTap("v", "control");
    // botao setar sql
    robot.moveMouse(62, 980);
    robot.mouseClick();
    await func()
    await func()
    //muda aba
    robot.moveMouse(1494, 1);
    robot.mouseClick();
    // clica voltar
    robot.moveMouse(19, 54);
    robot.mouseClick();
    await func()
    // clica exec funcao
    robot.moveMouse(18, 593);
    robot.mouseClick();
    await func()
    // abre visual
    robot.moveMouse(615, 1057);
    robot.mouseClick();
    robot.moveMouse(737, 878);
    robot.mouseClick();
    await func()
    await func()
    loop1()


}


// setTimeout(() => {
//     robot.mouseClick();
// }, 5000);

setInterval(() => {
    // robot.keyTap("end","control");
    // robot.keyTap("end","control");


    // robot.mouseClick();
    // robot.keyTap("v","control");
    // robot.keyTap("enter");
}, 1500);


// loop()
// loop1()





// Get pixel color in hex format.