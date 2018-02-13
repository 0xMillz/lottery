const path = require('path');// standard module, no need to npm install
const fs = require('fs');// standard module, no need to npm install
const solc = require('solc');// solidity compiler

const lotteryPath = path.resolve(__dirname, 'contracts', 'Lottery.sol');
const source = fs.readFileSync(lotteryPath, 'utf8');

module.exports = solc.compile(source, 1).contracts[':Lottery'];//1 is number of contracts to compile
