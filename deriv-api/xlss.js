const XLSX = require('xlsx');

// Cargar la hoja de cálculo
const workbook = XLSX.readFile('./Massanielloderiv.xlsx');
console.log(workbook);
// Obtener la primera hoja del libro
const sheet = workbook.Sheets['Calculadora'];
console.log(sheet);
// Acceder y modificar valores de celdas
// sheet['C3'].v = 'W' // Establecer el valor de la celda A1 a 10
function getCell(cellString) {
    if (typeof worksheet[cellString] != "undefined") {
        return worksheet[cellString].v
    } else {
        return undefined
    }
}

// Recalcular fórmulas (opcional)
XLSX.utils.recalc(sheet);

console.log(getCell('C3'));

// Guardar la hoja de cálculo modificada
XLSX.writeFile(workbook, 'archivo_modificado.xlsx');
