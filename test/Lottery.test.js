const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const provider = ganache.provider();
const web3 = new Web3(provider);


const { interface, bytecode } = require('../compile');

let lottery;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({data: bytecode})
    .send({from: accounts[0], gas: '1000000'});

  lottery.setProvider(provider);
});

describe('Lottery Contract', () => {
  it('deploys a contract', () => {
    assert.ok(lottery.options.address);
  });

  it('allows one account to enter', async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether')
    });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });

    assert.equal(1, players.length);
    assert.equal(accounts[0], players[0]);
  });

  it('allows multiple accounts to enter', async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether')
    });

    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei('0.02', 'ether')
    });

    await lottery.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei('0.02', 'ether')
    });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });

    assert.equal(3, players.length);
    assert.equal(accounts[0], players[0]);
    assert.equal(accounts[1], players[1]);
    assert.equal(accounts[2], players[2]);
  });

  it('requires a minimum amount of ether to enter', async () => {

    try {
      await lottery.methods.enter().send({
        from: accounts[0],
        value: web3.utils.toWei('.00001', 'ether')
      });

      assert(false);
    } catch (err) {
      assert(err);
    }

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });

    assert.equal(0, players.length);
  });

  it('only manager can call pickWinner', async () => {

    try {
      await lottery.methods.pickWinner().send({
        from: accounts[1]
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it('sends money to the winner and resets the players array', async () => {

    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei('2', 'ether')
    });
    const initialWinnerBalance = await web3.eth.getBalance(accounts[1]);
    await lottery.methods.pickWinner().send({ from: accounts[0] });
    const finalWinnerBalance = await web3.eth.getBalance(accounts[1]);
    const expectedWinnerFinalBalance = parseInt(initialWinnerBalance) + parseInt(web3.utils.toWei('2', 'ether'));

    assert.equal(expectedWinnerFinalBalance, finalWinnerBalance);

    const finalContractBalance = await web3.eth.getBalance(lottery.options.address);
    assert.equal(0, finalContractBalance);

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    });

    assert.equal(0, players.length);
  });

});
