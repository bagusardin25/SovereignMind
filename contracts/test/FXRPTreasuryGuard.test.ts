import { expect } from "chai";
import { ethers } from "hardhat";
import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("Flare FXRPTreasuryGuard", function () {
  async function deployFixture() {
    const [deployer, operator, other] = await ethers.getSigners();
    const fee = 1_000n;
    const feedTimestamp = BigInt(await time.latest()) - 30n;

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

    const fxrp = await ethers.deployContract("MockFxrp", [6]);
    const guard = await ethers.deployContract("FXRPTreasuryGuard", [
      await oracle.getAddress(),
      await adapter.getAddress(),
      await fxrp.getAddress(),
    ]);
    await fxrp.mint(operator.address, 1_000n * 10n ** 6n);

    return {
      adapter,
      deployer,
      fee,
      feedTimestamp,
      fxrp,
      guard,
      mockFtso,
      operator,
      oracle,
      other,
    };
  }

  it("binds the guard to the adapter oracle and the six-decimal FXRP token", async function () {
    const { adapter, fxrp, guard, oracle } = await loadFixture(deployFixture);

    expect(await guard.oracle()).to.equal(await oracle.getAddress());
    expect(await guard.adapter()).to.equal(await adapter.getAddress());
    expect(await guard.fxrp()).to.equal(await fxrp.getAddress());
    expect(await guard.fxrpDecimals()).to.equal(6);
  });

  it("rejects invalid dependencies and a mismatched adapter oracle", async function () {
    const { adapter, fxrp, oracle } = await loadFixture(deployFixture);
    const factory = await ethers.getContractFactory("FXRPTreasuryGuard");

    await expect(
      factory.deploy(
        ethers.ZeroAddress,
        await adapter.getAddress(),
        await fxrp.getAddress()
      )
    ).to.be.revertedWithCustomError(factory, "InvalidAddress");

    const otherOracle = await ethers.deployContract("PriceOracle");
    await expect(
      factory.deploy(
        await otherOracle.getAddress(),
        await adapter.getAddress(),
        await fxrp.getAddress()
      )
    )
      .to.be.revertedWithCustomError(factory, "AdapterOracleMismatch")
      .withArgs(await otherOracle.getAddress(), await oracle.getAddress());
  });

  it("creates a REDUCE assessment from the caller's real FXRP balance and live FTSO price", async function () {
    const { adapter, fee, feedTimestamp, guard, operator } =
      await loadFixture(deployFixture);
    const limitUsdE8 = 2_000n * 10n ** 8n;

    await expect(
      guard.connect(operator).refreshAndAssess(limitUsdE8, { value: fee })
    )
      .to.emit(guard, "AssessmentCreated")
      .withArgs(
        1n,
        operator.address,
        1n,
        1_000n * 10n ** 6n,
        250_000_000n,
        2_500n * 10n ** 8n,
        limitUsdE8,
        feedTimestamp,
        anyValue
      );

    const assessment = await guard.getLatestAssessment(operator.address);
    expect(assessment.id).to.equal(1n);
    expect(assessment.exposureUsdE8).to.equal(2_500n * 10n ** 8n);
    expect(assessment.signal).to.equal(1n);
    expect(assessment.status).to.equal(0n);
    expect(await guard.exposureLimitUsdE8(operator.address)).to.equal(
      limitUsdE8
    );
    expect(await ethers.provider.getBalance(await guard.getAddress())).to.equal(
      0n
    );
    expect(
      await ethers.provider.getBalance(await adapter.getAddress())
    ).to.equal(0n);
  });

  it("creates a HOLD assessment when exposure stays within policy", async function () {
    const { fee, guard, operator } = await loadFixture(deployFixture);

    await guard
      .connect(operator)
      .refreshAndAssess(3_000n * 10n ** 8n, { value: fee });

    const assessment = await guard.getLatestAssessment(operator.address);
    expect(assessment.signal).to.equal(0n);
  });

  it("requires a non-zero policy, an FXRP balance, and the exact FTSO fee", async function () {
    const { fee, guard, operator, other } = await loadFixture(deployFixture);

    await expect(
      guard.connect(operator).refreshAndAssess(0, { value: fee })
    ).to.be.revertedWithCustomError(guard, "InvalidExposureLimit");
    await expect(
      guard.connect(other).refreshAndAssess(1n, { value: fee })
    ).to.be.revertedWithCustomError(guard, "NoFxrpBalance");
    await expect(
      guard.connect(operator).refreshAndAssess(1n, { value: fee - 1n })
    )
      .to.be.revertedWithCustomError(guard, "IncorrectFee")
      .withArgs(fee, fee - 1n);
  });

  it("records a separate human approval without moving FXRP", async function () {
    const { fee, fxrp, guard, operator, other } = await loadFixture(deployFixture);
    const before = await fxrp.balanceOf(operator.address);
    await guard
      .connect(operator)
      .refreshAndAssess(2_000n * 10n ** 8n, { value: fee });

    await expect(guard.connect(other).approveAssessment(1n))
      .to.be.revertedWithCustomError(guard, "NotAssessmentOwner")
      .withArgs(1n, other.address);

    await expect(guard.connect(operator).approveAssessment(1n))
      .to.emit(guard, "AssessmentApproved")
      .withArgs(1n, operator.address, 1n, 2_500n * 10n ** 8n);

    expect((await guard.getAssessment(1n)).status).to.equal(1n);
    expect(await fxrp.balanceOf(operator.address)).to.equal(before);
    expect(await fxrp.balanceOf(await guard.getAddress())).to.equal(0n);
    await expect(
      guard.connect(operator).approveAssessment(1n)
    ).to.be.revertedWithCustomError(guard, "AssessmentNotPending");
  });

  it("supports explicit rejection by the assessed wallet", async function () {
    const { fee, guard, operator } = await loadFixture(deployFixture);
    await guard
      .connect(operator)
      .refreshAndAssess(2_000n * 10n ** 8n, { value: fee });

    await expect(guard.connect(operator).rejectAssessment(1n))
      .to.emit(guard, "AssessmentRejected")
      .withArgs(1n, operator.address);
    expect((await guard.getAssessment(1n)).status).to.equal(2n);
  });

  it("fails closed when a newer assessment supersedes the pending one", async function () {
    const { fee, guard, mockFtso, operator } = await loadFixture(deployFixture);
    await guard
      .connect(operator)
      .refreshAndAssess(2_000n * 10n ** 8n, { value: fee });
    await mockFtso.setFeed(
      260_000n,
      5,
      BigInt(await time.latest())
    );
    await guard
      .connect(operator)
      .refreshAndAssess(2_000n * 10n ** 8n, { value: fee });

    await expect(guard.connect(operator).approveAssessment(1n))
      .to.be.revertedWithCustomError(guard, "AssessmentSuperseded")
      .withArgs(1n);
  });

  it("fails closed when the FXRP balance changes before approval", async function () {
    const { fee, fxrp, guard, operator, other } = await loadFixture(deployFixture);
    await guard
      .connect(operator)
      .refreshAndAssess(2_000n * 10n ** 8n, { value: fee });
    await fxrp.connect(operator).transfer(other.address, 1n);

    await expect(guard.connect(operator).approveAssessment(1n))
      .to.be.revertedWithCustomError(guard, "FxrpBalanceChanged")
      .withArgs(1n, 1_000n * 10n ** 6n, 1_000n * 10n ** 6n - 1n);
  });

  it("fails closed when the synchronized oracle price becomes stale", async function () {
    const { fee, guard, operator, oracle } = await loadFixture(deployFixture);
    await guard
      .connect(operator)
      .refreshAndAssess(2_000n * 10n ** 8n, { value: fee });
    await time.increase(60 * 60 + 1);

    await expect(
      guard.connect(operator).approveAssessment(1n)
    ).to.be.revertedWithCustomError(oracle, "StalePrice");
  });
});
