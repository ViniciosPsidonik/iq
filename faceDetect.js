const cv = require('opencv4nodejs');
const robot = require('robotjs');

// Configurações de captura de tela
const SCREEN_WIDTH = 1920; // Substitua pela largura da sua tela
const SCREEN_HEIGHT = 1080; // Substitua pela altura da sua tela
const SCREEN_CAPTURE_DELAY_MS = 100; // Intervalo de captura de tela em milissegundos

// Configurações do detector de rostos
const faceClassifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);

// Função para capturar a tela, detectar rostos e mover o cursor
async function detectAndMoveCursor() {
    // Captura a tela
    const screen = robot.screen.capture(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Converte a imagem para o formato do OpenCV
    const image = new cv.Mat(screen.height, screen.width, cv.CV_8UC4);
    image.data.set(screen.image);

    // Converte a imagem para escala de cinza (necessária para a detecção de rostos)
    const grayImage = image.cvtColor(cv.COLOR_RGBA2GRAY);

    // Detecta rostos na imagem
    const faces = faceClassifier.detectMultiScale(grayImage).objects;

    if (faces.length > 0) {
        // Obtém a posição do primeiro rosto detectado
        const face = faces[0];

        // Calcula a posição do rosto na tela real (levando em consideração o redimensionamento da captura de tela)
        const scaleFactorX = SCREEN_WIDTH / screen.width;
        const scaleFactorY = SCREEN_HEIGHT / screen.height;
        const x = face.x * scaleFactorX;
        const y = face.y * scaleFactorY;

        // Mova o cursor para a posição do rosto
        robot.moveMouse(x, y);
        console.log(`Cursor movido para a posição do rosto: (${x}, ${y})`);
    } else {
        console.log('Nenhum rosto detectado na tela.');
    }

    // Aguarda o próximo ciclo de captura de tela
    setTimeout(detectAndMoveCursor, SCREEN_CAPTURE_DELAY_MS);
}

// Iniciar o processo de captura de tela e detecção de rostos
detectAndMoveCursor();