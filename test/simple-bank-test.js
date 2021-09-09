const { expect } = require("chai");
const { ethers } = require("hardhat");

let signers;
let owner;
let alice;
let bob;
let deposit;
let bank;

describe("Simple Bank", function () {
  beforeEach(async ()=>{
    signers = await ethers.getSigners();
    owner = signers[0];
    alice = signers[1];
    bob = signers[2];
    deposit = ethers.BigNumber.from(2);
    const SimpleBank = await ethers.getContractFactory("SimpleBank");
    bank = await SimpleBank.deploy();
    await bank.deployed();
  });

  it("should save owner", async () => {
    expect(await bank.owner()).to.equal(owner.address);
  });

  it("mark address as enrolled", async () => {
    const aliceEnrollTx = await bank.connect(alice).enroll();
    const aliceEnrolled = await bank.connect(owner).enrolled(alice.address);
    expect(aliceEnrolled).to.equal(true);

    const ownerEnrolled = await bank.connect(owner).enrolled(owner.address);
    expect(ownerEnrolled).to.equal(false);

    expect(aliceEnrollTx).to.emit(bank, 'LogEnrolled').withArgs(alice.address);
  });

  it("should deposit correct amount", async () => {
    await bank.connect(alice).enroll();
    await bank.connect(bob).enroll();
    const aliceDepositTx = await bank.connect(alice).deposit({ value: deposit});
    const balance = await bank.connect(alice).balance();
    expect(deposit.toString()).to.equal(balance);
    expect(aliceDepositTx).to.emit(bank, 'LogDepositMade').withArgs(alice.address, deposit);
  });

  it("should withdraw correct amount", async () => {
    const initialAmount = 0;
    await bank.connect(alice).enroll();
    expect(await bank.connect(alice).balance()).to.equal(initialAmount.toString());
    await bank.connect(alice).deposit({value: deposit});
    expect(await bank.connect(alice).balance()).to.equal(deposit.toString());
    const aliceWithdrawTx = await bank.connect(alice).withdraw(deposit);
    expect(await bank.connect(alice).balance()).to.equal(initialAmount.toString());

    expect(aliceWithdrawTx)
        .to
        .emit(bank, 'LogWithdrawal')
        .withArgs(alice.address, deposit, initialAmount);
  });
});
