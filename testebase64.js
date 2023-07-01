const axios = require('axios');
const Buffer = require('buffer').Buffer;


const pdfUrl = "https://ecommerce-prd.s3.sa-east-1.amazonaws.com/FiliacaoEntidade/ASPROFILI/22882471181/declaracaoAssinada.pdf?AWSAccessKeyId=AKIAVDDAGVT7UHL356DA&Expires=1687885620&Signature=Duf2Wj9yEwMVdET%2BPwBVgFjGuW4%3D"

axios.get(pdfUrl, { responseType: 'arraybuffer' })
    .then(response => {
        const fileData = Buffer.from(response.data, 'binary').toString('base64');
        console.log('fileData');
        // A variável 'fileData' contém o arquivo PDF em formato base64
        enviarDocumentos(fileData)

    })
    .catch(error => {
        console.error('Erro ao baixar o arquivo PDF:', error);
    });




async function enviarDocumentos(files) {
    try {
        console.log('fileData');
        const body = {
            guidTipoDocumento: '94ce7ee4-5241-4093-a3a2-f59f135036c8',
            arquivos: [{
                stream: files,
                extensao: '.pdf',
            }],
        }

        return await axios.post(
            `https://integracao.qualicorp.com.br/qvenda/propostas/a0be5b1c-0de0-46c7-90bf-69fe23c4baed/documentos?api-key=76427bfa-4f30-4672-83c2-fbd58b454504`,
            body
        )
    } catch (error) {
        console.log(error)
        return error
    }
}



