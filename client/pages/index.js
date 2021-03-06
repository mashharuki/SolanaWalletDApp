import React, { useEffect, useState } from "react";
import * as Bip39 from "bip39";
import { 
  Keypair, 
  LAMPORTS_PER_SOL, 
  Connection, 
  clusterApiUrl, 
  sendAndConfirmTransaction, 
  SystemProgram, 
  PublicKey, 
  Transaction 
} from "@solana/web3.js";
import HeadComponent from '../components/Head';

// 接続するネットワークを選択
// const NETWORK = 'devnet';

/**
 * Homeコンポーネント
 */
export default function Home() {
  
  // ステート変数
  const [mnemonic, setMnemonic] = useState(null);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const [transactionSig, setTransactionSig] = useState("");
  const [initFlg, setInitFlg] = useState(true);
  const [network, setNetwork] = useState("mainnnet");

  /**
   * アカウントを生成するメソッド
   */
  const generateWallet = () => {
    // ニーモニックフレーズを生成する。
    const generatedMnemonic = Bip39.generateMnemonic();
    // ステート変数を更新する。
    setMnemonic(generatedMnemonic);
    console.log(seed);
    // 最初の32バイトだけを保持する様にする。
    const seed = Bip39.mnemonicToSeedSync(generatedMnemonic).slice(0, 32);
    console.log(seed);

    // シードからアカウントを生成する。
    const newAccount = Keypair.fromSeed(seed);
    console.log('newAccount', newAccount.publicKey.toString());
    // ステート変数を更新する。
    setAccount(newAccount);
  };

  /**
   * ニーモニックフレーズを入力してアカウントアドレスを取得するメソッド
   */
  const handleImport = (e) => {
    e.preventDefault();
    // フレーズを取得する。
    const inputMnemonic = e.target[0].value.trim().toLowerCase();
    console.log('inputMnemonic', inputMnemonic);
    // シードを取得する。
    const seed = Bip39.mnemonicToSeedSync(inputMnemonic).slice(0, 32);
    // ウォレットアドレスを取得する。
    const importedAccount = Keypair.fromSeed(seed);
    // ステート変数を更新する。
    setAccount(importedAccount);
  };

  /**
   * アドレスに紐づく残高を取得するメソッド
   */
  const refreshBalance = async () => {
    try {
      // コネクションインスタンスを生成
      const connection = new Connection(clusterApiUrl(network), "confirmed");
      // 公開鍵を取得する。
      const publicKey = account.publicKey;
      // 残高を取得する。
      let balance = await connection.getBalance(publicKey);
      balance = balance / LAMPORTS_PER_SOL;
      console.log('balance', balance);
      // ステート変数を更新する。
      setBalance(balance);
    } catch (error) {
      console.log('error', error);
    }
  };

  /**
   * エアドロップするためのメソッド
   */
  const handleAirdrop = async () => {
    // connectionインスタンスを生成
    const connection = new Connection(clusterApiUrl(network), "confirmed");
    // エアドロップ(1 SOL)をリクエストするためのデジタル署名データを生成する。
    const signature = await connection.requestAirdrop(account.publicKey, LAMPORTS_PER_SOL);
    // エアドロップを実施するためのトランザクションを処理する。
    await connection.confirmTransaction(signature, "confirmed");
    // 残高を更新する。
    await refreshBalance();
  };

  /**
   * 送金処理用のメソッド
   */
  const handleTransfer = async (e) => {
    e.preventDefault();

    // フォームから送信先のアドレスを取得する。
    const toAddress = e.target[0].value;
    const amount = e.target[1].value;
    console.log('toAddress', toAddress);
    console.log('toAmount', amount);
  
    try {
      console.log('送金中...')
      // トランザクション用の署名データを初期化する。
      setTransactionSig("");
      // connectionインスタンスを生成
      const connection = new Connection(clusterApiUrl(network), "confirmed");

      // 送金処理用のデータを作成する。
      const instructions = SystemProgram.transfer({
        fromPubkey: account.publicKey,
        toPubkey: new PublicKey(toAddress),
        lamports: (amount * LAMPORTS_PER_SOL),
      });
      // トランザクションオブジェクトを生成する。
      const transaction = new Transaction().add(instructions);
      // トランザクションの署名者の情報を作成
      const signers = [
        {
          publicKey: account.publicKey,
          secretKey: account.secretKey,
        },
      ];

      // 送金用トランザクションを実行する。
      const confirmation = await sendAndConfirmTransaction(
        connection,
        transaction,
        signers
      );
      console.log('confirmation', confirmation);
  
      setTransactionSig(confirmation);
      // 残高を更新する。
      await refreshBalance();

      console.log('送金が完了しました。')
      alert('送金が完了しました！')
    } catch (error) {
      alert('Transaction failful...')
      console.log('error', error);
    }
  }; 

  return (
    <div>
      {/* ヘッダーコンポーネント */}
      <HeadComponent/>
      {/* コンテンツ本体 */}
      <div className="p-10">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">
          My <span className="text-[#9945FF]">Solana</span> Wallet
        </h1>
        <div className="mx-auto mt-5 text-gray-500">
          Solanaウォレットの新規作成、インポート、エアドロップ、送金機能を試せます。
        </div>

        <hr className="my-6" />

        <div>
          <label className="block">
            <span className="text-gray-700">接続先のネットワーク</span>
            <select className="
                block
                w-full
                mt-1
                rounded-md
                bg-gray-100
                border-transparent
                focus:border-gray-500 focus:bg-white focus:ring-0
              "
              onChange={(e) => setNetwork(e.target.value)} 
            >
              <option>mainnet</option>
              <option>devnet</option>
              <option>testnet</option>
            </select>
          </label>
        </div>

        <hr className="my-6" />

        <div>
          <h3 className="p-2 border-dotted border-l-8 border-l-indigo-600">My Wallet</h3>
          {/* ウォレットアドレス表示 */}
          {account && (
            <>
              <div className="my-6 text-indigo-600 font-bold">アドレス: {account.publicKey.toString()}</div>
              <div className="my-6 font-bold">ネットワーク: {network}</div>
              {typeof balance === "number" && <div className="my-6 font-bold">💰 残高: {balance} SOL</div>}
            </>
          )}
        </div>

        <hr className="my-6" />

        <div>
          <h2 className="p-2 border-dotted border-l-4 border-l-indigo-400">ウォレット新規作成機能</h2>
          {/* ウォレット生成ボタン */}
          <button
            className="p-2 my-6 text-white bg-indigo-500 focus:ring focus:ring-indigo-300 rounded-lg cursor-pointer"
            onClick={generateWallet}
          >
            ウォレットを生成
          </button><br/>
          {/* ニーモニックフレーズ確認ボタン */}
          {initFlg ? 
            <button
              className="p-2 my-6 text-white bg-sky-500 focus:ring focus:ring-sky-300 rounded-lg cursor-pointer"
              onClick={() => setInitFlg(false)}
            >
              ニーモニックフレーズを確認する
            </button>
          : 
            <button
              className="p-2 my-6 text-white bg-sky-500 focus:ring focus:ring-sky-300 rounded-lg cursor-pointer"
              onClick={async () => {
                // クリップボードにコピ-する。
                await window.navigator.clipboard.writeText(mnemonic);
                setInitFlg(true);
                alert("コピーしました！");
              }}
            >
              ニーモニックフレーズをコピーする
            </button>
          }
          {mnemonic && (
            <>
              <form 
                onClick={async () => {
                  // クリップボードにコピ-する。
                  await window.navigator.clipboard.writeText(mnemonic);
                  setInitFlg(true);
                  alert("コピーしました！");
                }} 
                className="my-6"
              >
                <div className={initFlg ? 
                  "mt-1 p-4 border border-gray-300 bg-gray-200 blur-lg"
                :  
                  "mt-1 p-4 border border-gray-300 bg-gray-200"
                }>
                  {mnemonic}
                </div>
              </form>
              <strong className="text-xs">
                このフレーズは秘密にして、安全に保管してください。このフレーズが漏洩すると、誰でもあなたの資産にアクセスできてしまいます。<br />
                オンライン銀行口座のパスワードのようなものだと考えてください。
              </strong>
            </>
          )}
        </div>

        <hr className="my-6" />

        <div>
          <h2 className="p-2 border-dotted border-l-4 border-l-indigo-400">ウォレット復元機能</h2>
          {/* リカバリー */}  
          <form onSubmit={handleImport} className="my-6">
            <div className="flex items-center border-b border-indigo-500 py-2">
              <input
                type="text"
                className="w-full text-gray-700 mr-3 p-1 focus:outline-none"
                placeholder="シークレットリカバリーフレーズ"
              />
              <input
                type="submit"
                className="p-2 text-white bg-indigo-500 focus:ring focus:ring-indigo-300 rounded-lg cursor-pointer"
                value="インポート"
              />
            </div>
          </form>
        </div>

        <hr className="my-6" />

        <div>
          <h2 className="p-2 border-dotted border-l-4 border-l-indigo-400">残高照会機能</h2>
          {/* 残高取得ボタン */}
          {account &&
            <button
              className="p-2 my-6 text-white bg-indigo-500 focus:ring focus:ring-indigo-300 rounded-lg cursor-pointer"
              onClick={refreshBalance}
            >
              残高を取得
            </button>
          }
        </div>

        <hr className="my-6" />

        <div>
          <h2 className="p-2 border-dotted border-l-4 border-l-indigo-400">エアドロップ機能</h2>
          {/* エアドロップボタン */}
          {account && (
            <button
              className="p-2 my-6 text-white bg-indigo-500 focus:ring focus:ring-indigo-300 rounded-lg cursor-pointer"
              onClick={handleAirdrop}
            >
              Airdrop
            </button>
          )}
        </div>

        <hr className="my-6" />

        <div>
          <h2 className="p-2 border-dotted border-l-4 border-l-indigo-400">送金機能</h2>
          {account && (
            <>
              {/* 送金ボタン */}
              <form onSubmit={handleTransfer} className="my-6">
                <div className="flex items-center border-b border-indigo-500 py-2">
                  <input
                    type="text"
                    className="w-full text-gray-700 mr-3 p-1 focus:outline-none"
                    placeholder="送金先のウォレットアドレス"
                  />
                  <br/>
                  <input
                    type="number"
                    className="w-full text-gray-700 mr-3 p-1 focus:outline-none"
                    placeholder="送金額"
                  />
                  <input
                    type="submit"
                    className="p-2 text-white bg-indigo-500 focus:ring focus:ring-indigo-300 rounded-lg cursor-pointer"
                    value="送金"
                  />
                </div>
              </form>
              {/* Block Exploerへのリンク */}
              {transactionSig && (
                <>
                  <span className="text-red-600">送金が完了しました!</span>
                  <a
                    href={`https://explorer.solana.com/tx/${transactionSig}?cluster=${network}`}
                    className="border-double border-b-4 border-b-indigo-600"
                    target='_blank'
                  >
                    Solana Block Explorer でトランザクションを確認する
                  </a>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
