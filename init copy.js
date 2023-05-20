const tweezerbottom = require('technicalindicators').tweezerbottom;

var testData = {
  open: [40.90, 36.00, 33.10, 30.10, 26.13],
  high: [41.80, 37.60, 35.90, 31.60, 33.60],
  close: [36.00, 33.10, 29.50, 26.13, 31.00],
  low: [28.00, 27.70, 26.90, 25.90, 25.90],
};

const result = tweezerbottom(testData) ? 'yes' : 'no';
console.log(`Is Tweezer Bottom pattern? : ${result}`);