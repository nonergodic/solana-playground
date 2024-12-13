import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Playground } from "../target/types/playground";

import { encoding, serializeLayout } from "@wormhole-foundation/sdk-base";

import "../utils";

describe("playground", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const wallet = anchor.Wallet.local();

  const program = anchor.workspace.Playground as Program<Playground>;

  const counterAddr = (u8: number) => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [encoding.bytes.encode("counter"), serializeLayout({ binary: "uint", size: 8 }, u8)],
      program.programId
    )[0];
  }

  it("basic test", async () => {
    await Promise.all([
      program.methods.createAccount1().accounts({
        payer: wallet.publicKey,
      }).rpc(),

      program.methods.createAccount2().accounts({
        payer: wallet.publicKey,
      }).rpc(),
    ]);

    const rentExemptionCost =
      await anchor.getProvider().connection.getMinimumBalanceForRentExemption(16);

    // const programDataAddr = anchor.web3.PublicKey.findProgramAddressSync(
    //   [program.programId.toBytes()],
    //   new anchor.web3.PublicKey("BPFLoaderUpgradeab1e11111111111111111111111")
    // )[0];
    // const info = await anchor.getProvider().connection.getAccountInfo(programDataAddr);
    // const upgradeAuthorityAddr = new anchor.web3.PublicKey(info?.data.slice(13, 13+32));
    // const recipientAddr = upgradeAuthorityAddr;

    //when deploying in localnet, the upgrade authority is the native account loader which
    //  apparently can't be passed in as a mut account so I'm using some dummy account and
    //  disabling the "equals upgrade authority" check in the closeAccounts instruction for testing
    const recipientAddr = anchor.web3.Keypair.generate().publicKey;

    const balanceBefore = await anchor.getProvider().connection.getBalance(recipientAddr);
    await program.methods.closeAccounts()
      .accounts({upgradeAuthority: recipientAddr})
      .remainingAccounts([
        {pubkey: counterAddr(1), isSigner: false, isWritable: true},
        {pubkey: counterAddr(2), isSigner: false, isWritable: true},
      ])
      .rpc();
    const balanceAfter = await anchor.getProvider().connection.getBalance(recipientAddr);
    console.log(balanceBefore, balanceAfter, balanceBefore + 2*rentExemptionCost);
    
    // const upgradeAuthorityInfo = await anchor.getProvider().connection.getAccountInfo(upgradeAuthorityAddr);
    // console.log(upgradeAuthorityAddr.toBase58(), JSON.stringify(upgradeAuthorityInfo, null, 2));
    // console.log(wallet.publicKey.toBase58());
    
  });
});
