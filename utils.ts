import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  VersionedMessage,
} from "@solana/web3.js";

import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token"

import { encoding, contracts } from "@wormhole-foundation/sdk-base";

export class AssertionError extends Error {
  name = "AssertionError";
}

export function assert(condition: any, message: string | null = null) {
  if (!condition)
    throw new AssertionError(message || "Assertion failed");
}

export function range(
  startOrStop: number,
  stop: number | null = null,
  step: number | null = null,
): number[] {
  assert(stop === null && step === null, "not implemented yet");
  const length = startOrStop;
  return [...Array(length).keys()];
}

export function pick(obj: any, keys: string[]): any {
  return Object.fromEntries(keys.filter(key => key in obj).map(key => [key, obj[key]]));
}

export const msleep = (milliSec: number) => new Promise(resolve => setTimeout(resolve, milliSec));
export const sleep = (seconds: number) => msleep(seconds * 1000);

export function isUint8Array(arr: any): arr is Uint8Array {
  return (ArrayBuffer.isView(arr) &&
    !(arr instanceof DataView) &&
    arr.constructor.name === "Uint8Array");
}

export function secretToKeypair(secret: any): Keypair {
  const toArray = () => {
    if (isUint8Array(secret))
      return secret;
    if (Array.isArray(secret))
      return Uint8Array.from(secret);
    if (typeof secret === "string") {
      if (secret.startsWith("0x"))
        return encoding.hex.decode(secret);
      return encoding.b58.decode(secret);
    }
    throw new Error("unsupported secret type");
  };
  return Keypair.fromSecretKey(toArray());
}

export function getTransactionSize(tx: Transaction, payer: Keypair): Number {
  const estTx = new Transaction({recentBlockhash: new PublicKey(0).toBase58()}).add(tx);
  estTx.sign(payer);
  return estTx.serialize({verifySignatures: false}).length;
}

export async function getAccountData(connection: Connection, addr: string | PublicKey) {
  const info = await connection.getAccountInfo(new PublicKey(addr));
  return [info?.data.length ?? 0, info?.data.toString("hex")];
}

export const getAtaAndBump = (owner: PublicKey, mint: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [
      owner.toBytes(),
      TOKEN_PROGRAM_ID.toBytes(),
      mint.toBytes(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

export const getVaaPda = (vaaHashHex: string) =>
  PublicKey.findProgramAddressSync(
    [ encoding.bytes.encode("PostedVAA"), encoding.hex.decode(vaaHashHex) ],
    new PublicKey(contracts.coreBridge(network, "Solana"))
  )[0];

export function decodeSampleTx() {
  const encodedTx = 'Arekfyltvk6JNje42nicDYinF+6I6BjdYV5D/njBViRAEERThTpXjvPg9wljGw/VO6NSiMsnmdCCmuvvlyTCjQM59mkHQCibogooyjjBai8l2YnRPuISpvP8fRLUDqPsk/mEKSCEym5GUbLqGyw89EL1Hl3zZrB+l25qMG7bs0gAgAIAER0Fm93Pl5B1QxL7cxOYiPgieMC/+ElaBgb4JDxH/R+MUg3GT+b5PUcwBi+wQPZms17/KunfSee30UzmC9ZCKvtJ/xKAmsCoFNIvmj+GLw3MubhVai4yKl8RCL4iLy24UOfT7HHqwdbSyfrBczurTNoR7fnHLZ5/H2mq/Ymj6YjpxRfI41oCzEiJsKpaX1pAgQoyKiGzxq/UsTvGbakAiT6P7C4EqsY2AuAXJpS3OwpUp7AnQWIlwLiYyxrwgvowgBjzJIKfIoNM6KqtrbMVHitRv5qY2utFnyhM31+kGTujddLhohF6sd59KHvhtHSR7tgoE4DH+2onOkjpgyp+ouBNHVS1VaBE5joKlgwoYq0Z+j1wDGylBUnOwcKfazDOFaN/o3+x53xyAJe+5QVbhccDMFHEzIKCwTfpu66xBpC5fLviNV6FPDqGIC6qVM6/l2P7oi1VuMiSw5NyNb5AYXxixfIicZ9TX13uu74FS87zuCHGj6dCV1MlZLRK0uFDjZwG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqYxuMAke9Q4rCSDtjw//NI12meZz2LCVzeU7r99vEzWeBX+ayxvhkasgWLU4UMNp1C9IUHI92oTj3b87AowlJzoKougmGtP1w5lQ16Lo0QUrt8TaMYAB/sq57J51AipOfQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKn++TkDm41M7ZxoLjoSJtjomy6TW3ukzpCvIq0rFwI7eCLDtZM0wMi6YX2hIIIVj0eo1BKho0CmeruuIuO6GQyFZfkgTEEwAPAAYdUshg2LX9hjJxp9W8CwoTNhIQkTxG/HVlMqq7VyJW1IV1u2j7TZ3qWpHw5f7Z7UZevG/wjkOCliaQaVfvWbFKkdfLZKm09ybR0cRTLmvglqYtUXTzgan1RcYx3TJKFZjmGkdXraLXrijm0ttXHNVWyEAAAAABqfVFxksXFEhjMlMPUrxf1ja7gibof1E49vZigAAAAAFmCyoBwHGYcpPoNWKYrceVDa4DEhnJVzUj8srJlMaqT97+gGpa9JXOh1z8fqr95AaqBicAYAxUIMR6iZfyXkI4OyWHRVb45RbslcJ1DmVjL8sx/sCdeT3DMat0Q8S0pLh4V6ZQtqGSTUJWkP4IyK2EqGb71G2XtZznLzid+nefgMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAAwCTC07F6qadoyEmYMAZVKGTTPehb0JndaJ6qPdKv9dgGDAMCDQAJBGQAAAAAAAAADg0ADwMCDAEEBRAGEQ0SM0uQGugnDEveZAAAAAAAAAACAAAAAAAAAAAAAAAAAFMgfiFlQBJeMizaimk7C4lXbetGAA4NAA8BEwcUCAkKFRAWFwnKVzOtjqC8zAEYBwAZGhsBCxAYWWFx8RvZHuMAAAAAAAAAAJ6caQUAAAAAHAAFAm1IAgAcAAkDAQAAAAAAAAAA';
  console.log(VersionedMessage.deserialize(encoding.b64.decode(encodedTx)));
}
