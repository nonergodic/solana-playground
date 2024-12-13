import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
  sendAndConfirmTransaction,
  VersionedMessage,
  TransactionMessage,
  PublicKeyInitData,
} from "@solana/web3.js";

// import {
//   TOKEN_PROGRAM_ID,
//   ASSOCIATED_TOKEN_PROGRAM_ID,
//   createMint,
// } from "@solana/spl-token";

import { encoding, contracts, serializeLayout } from "@wormhole-foundation/sdk-base";

// import "./utils";

const CLUSTERS = {
  Mainnet: "https://api.mainnet-beta.solana.com",
  Testnet: "https://api.devnet.solana.com",
  Devnet: "http://localhost:8899",
} as const;

const network = "Mainnet" as const;
const coreBridgePid = new PublicKey(contracts.coreBridge(network, "Solana"));

const getVaaPda = (vaaHashHex: string) =>
  PublicKey.findProgramAddressSync(
    [ encoding.bytes.encode("PostedVAA"), encoding.hex.decode(vaaHashHex) ],
    coreBridgePid
  )[0];

const getGuardianSetPda = (guardianSetIndex: number) =>
  PublicKey.findProgramAddressSync(
    [
      encoding.bytes.encode("GuardianSet"),
      serializeLayout({binary: "uint", size: 4}, guardianSetIndex)
    ],
    coreBridgePid
  )[0];
  

const meta = (addr: PublicKeyInitData, type: "read" | "write" | "signer" | "writeSigner" = "read") => ({
  pubkey: new PublicKey(addr),
  isSigner: type === "signer" || type === "writeSigner",
  isWritable: type === "write" || type === "writeSigner",
});

const uintLe = <const N extends number>(size: N) =>
  ({ binary: "uint", size, endianness: "little" } as const);

const postVaaDataLayout = [
  //see here: https://github.com/wormhole-foundation/wormhole/blob/8624e5ae9a288f98ba9ca73157dfd4daa64b6b80/solana/bridge/program/src/lib.rs#L96
  { name: "postVaaIx", binary: "uint", size: 1, custom: 2, omit: true },
  //see here: https://github.com/wormhole-foundation/wormhole/blob/8624e5ae9a288f98ba9ca73157dfd4daa64b6b80/solana/bridge/program/src/api/post_vaa.rs#L87
  { name: "version", binary: "uint", size: 1, custom: 1, omit: true },
  { name: "guardianSet", ...uintLe(4) },
  { name: "timestamp", ...uintLe(4) },
  { name: "nonce", ...uintLe(4) },
  { name: "emitterChain", ...uintLe(2) },
  { name: "emitterAddress", binary: "bytes", size: 32 },
  { name: "sequence", ...uintLe(8) },
  { name: "consistencyLevel", ...uintLe(1) },
  { name: "payload", binary: "bytes", lengthSize: 4, lengthEndianness: "little" },
] as const;

async function main() {
  //trying to simulate this tx: https://explorer.solana.com/tx/3HEwdhUtPnjd8ynJRbGLJ8HnHkYVbutdfc49ybpdoTc9vQ1XbDmdt43xCaiKXRfHKm32z2vgbnqyindarTBQTB9C
  //whscan source tx: https://wormholescan.io/#/tx/2/0000000000000000000000003ee18b2214aff97000d974cf647e7c347e8fa585/245668?network=Mainnet
  const vaaHash = "72ba94a7103870d650785047a93bdd3db259ecd500bee3f788187d4d72e2fe56";

  const ixData = {
    guardianSet: 3,
    timestamp: 1711055471,
    nonce: 2,
    emitterChain: 2,
    emitterAddress: encoding.hex.decode("0000000000000000000000003ee18b2214aff97000d974cf647e7c347e8fa585"),
    sequence: 245668n,
    consistencyLevel: 1,
    payload: encoding.hex.decode("01000000000000000000000000000000000000000000000000000012a9cff88af500000000000000000000000018aaa7115705e8be94bffebde57af9bfc265b998000224ed9849acc336ae6f829b25702ba7df978a93f4fddfe65efb62472bec37a1f600010000000000000000000000000000000000000000000000000000000000000000"),
  };

  const connection = new Connection(CLUSTERS[network]);
  const message = new TransactionMessage({
    payerKey: new PublicKey("2Pfwu3D97SPFB2s1LK5qwTKhLcjbQ9WPTU3FfZv6dbyq"),
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    instructions: [
      new TransactionInstruction({ //postVaa
        programId: coreBridgePid,
        data: Buffer.from(serializeLayout(postVaaDataLayout, ixData)),
        keys: [
          meta(getGuardianSetPda(ixData.guardianSet)),
          meta("2yVjuQwpsvdsrywzsJJVs9Ueh4zayyo5DYJbBNc3DDpn"),
          meta("6xRnH7Z5TsRsocxRDK47Unj5m84u7x1o7Xe9bTSZeqWp"),
          meta(getVaaPda(vaaHash), "write"),
          meta("2Pfwu3D97SPFB2s1LK5qwTKhLcjbQ9WPTU3FfZv6dbyq", "writeSigner"),
          meta("SysvarC1ock11111111111111111111111111111111"),
          meta("SysvarRent111111111111111111111111111111111"),
          meta("11111111111111111111111111111111"),
        ]
      })
    ]
  });
  console.log("accounts:", JSON.stringify(message.instructions[0].keys, null, 2));
  console.log("data:", message.instructions[0].data.toString("hex"));

  const tx = new VersionedTransaction(message.compileToV0Message());
  console.log(await connection.simulateTransaction(tx, { sigVerify: false}));
}

main().then(
  () => {
    console.log('completed successfully');
    process.exit();
  },
  err => {
    console.error("failed with error:")
    console.error(err);
    process.exit(-1);
  },
);
