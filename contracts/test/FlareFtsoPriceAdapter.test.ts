import { expect } from "chai";
import { ethers } from "hardhat";
import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-network-helpers";

describe("FlareFtsoPriceAdapter", function () {
  async function deployFixture() {
    const fee = 1_000n;
    const feedTimestamp = BigInt(await time.latest()) - 60n;

    const oracle = await ethers.deployContract("PriceOracle");
    const mockFtso = await ethers.deployContract("MockFtsoV2", [
      fee,
      250_000n,
      5,
    ]);
    const adapter = await ethers.deployContract("FlareFtsoPriceAdapter", [
      await oracle.getAddress(),
      await mockFtso.getAddress(),
    ]);

    await oracle.grantRole(
      await oracle.UPDATER_ROLE(),
      await adapter.getAddress()
    );
    await mockFtso.setFeed(250_000n, 5, feedTimestamp);

    return { adapter, fee, feedTimestamp, mockFtso, oracle };
  }

  it("rejects zero dependency addresses", async function () {
    const oracle = await ethers.deployContract("PriceOracle");
    const factory = await ethers.getContractFactory("FlareFtsoPriceAdapter");

    await expect(
      factory.deploy(ethers.ZeroAddress, await oracle.getAddress())
    ).to.be.revertedWithCustomError(factory, "InvalidAddress");
    await expect(
      factory.deploy(await oracle.getAddress(), ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(factory, "InvalidAddress");
  });

  it("exposes the fee required by FTSOv2", async function () {
    const { adapter, fee } = await loadFixture(deployFixture);
    expect(await adapter.requiredFee()).to.equal(fee);
  });

  it("requires the exact fee and does not retain it", async function () {
    const { adapter, fee } = await loadFixture(deployFixture);

    await expect(adapter.syncXrpUsd({ value: fee - 1n }))
      .to.be.revertedWithCustomError(adapter, "IncorrectFee")
      .withArgs(fee, fee - 1n);
  });

  it("writes a normalized XRP/USD price into SovereignMind's oracle", async function () {
    const { adapter, fee, feedTimestamp, mockFtso, oracle } =
      await loadFixture(deployFixture);

    await expect(adapter.syncXrpUsd({ value: fee }))
      .to.emit(adapter, "FlarePriceSynchronized")
      .withArgs(
        await adapter.XRP_USD_FEED_ID(),
        "xrp",
        250_000n,
        5,
        250_000_000n,
        feedTimestamp,
        (await ethers.getSigners())[0].address
      );

    const [price] = await oracle.getPrice("xrp");
    expect(price).to.equal(250_000_000n);
    expect(await mockFtso.lastPayment()).to.equal(fee);
    expect(await ethers.provider.getBalance(await adapter.getAddress())).to.equal(
      0n
    );
  });

  it("scales feeds with more than eight decimals down to e8", async function () {
    const { adapter, fee, feedTimestamp, mockFtso, oracle } =
      await loadFixture(deployFixture);
    await mockFtso.setFeed(25_012_345_678n, 10, feedTimestamp + 1n);

    await adapter.syncXrpUsd({ value: fee });

    const [price] = await oracle.getPrice("xrp");
    expect(price).to.equal(250_123_456n);
  });

  it("rejects zero and unsupported feed data", async function () {
    const { adapter, fee, feedTimestamp, mockFtso } =
      await loadFixture(deployFixture);

    await mockFtso.setFeed(0n, 5, feedTimestamp);
    await expect(adapter.syncXrpUsd({ value: fee })).to.be.revertedWithCustomError(
      adapter,
      "InvalidFeedValue"
    );

    await mockFtso.setFeed(1n, -1, feedTimestamp);
    await expect(adapter.syncXrpUsd({ value: fee }))
      .to.be.revertedWithCustomError(adapter, "UnsupportedDecimals")
      .withArgs(-1);
  });

  it("rejects stale feed timestamps before refreshing the oracle", async function () {
    const { adapter, fee, feedTimestamp, mockFtso } =
      await loadFixture(deployFixture);
    await mockFtso.setFeed(250_000n, 5, feedTimestamp - 600n);

    await expect(adapter.syncXrpUsd({ value: fee })).to.be.revertedWithCustomError(
      adapter,
      "InvalidFeedTimestamp"
    );
  });
});
