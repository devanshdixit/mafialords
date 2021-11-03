import React, { Dispatch, SetStateAction, useState, useEffect } from "react";
import { TezosToolkit } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { bytes2Char } from "@taquito/utils";
import {
  NetworkType,
  BeaconEvent,
  defaultEventCallbacks,
} from "@airgap/beacon-sdk";
import { LedgerSigner } from "@taquito/ledger-signer";
import { async } from "rxjs";

type ButtonProps = {
  Tezos: TezosToolkit;
  setContract: Dispatch<SetStateAction<any>>;
  setWallet: Dispatch<SetStateAction<any>>;
  setUserAddress: Dispatch<SetStateAction<string>>;
  setUserBalance: Dispatch<SetStateAction<number>>;
  setStorage: Dispatch<SetStateAction<number>>;
  SetUserNfts: Dispatch<SetStateAction<any>>;
  contractAddress: string;
  setBeaconConnection: Dispatch<SetStateAction<boolean>>;
  setPublicToken: Dispatch<SetStateAction<string | null>>;
  wallet: BeaconWallet;
};

const ConnectButton = ({
  Tezos,
  setContract,
  setWallet,
  setUserAddress,
  setUserBalance,
  SetUserNfts,
  setStorage,
  contractAddress,
  setBeaconConnection,
  setPublicToken,
  wallet,
}: ButtonProps): JSX.Element => {
  const [loadingNano, setLoadingNano] = useState<boolean>(false);
  let nftStorage: any = undefined;
  const setup = async (userAddress: string): Promise<void> => {
    setUserAddress(userAddress);
    // updates balance
    const balance = await Tezos.tz.getBalance(userAddress);
    setUserBalance(balance.toNumber());
    // creates contract instance
    const contract = await Tezos.wallet.at(contractAddress);
    const storage: any = await contract.storage();
    setContract(contract);
    setStorage(storage);
    getUserNfts(userAddress);
  };

  const connectWallet = async (): Promise<void> => {
    try {
      await wallet.requestPermissions({
        network: {
          type: NetworkType.GRANADANET,
          rpcUrl: "https://granadanet.smartpy.io",
        },
      });
      // gets user's address
      const userAddress = await wallet.getPKH();
      await setup(userAddress);
      setBeaconConnection(true);
    } catch (error) {
      console.log(error);
    }
  };
  const getUserNfts = async (address: string) => {
    // finds user's NFTs
    const contract = await Tezos.wallet.at(contractAddress);
    nftStorage = await contract.storage();
    const getTokenIds = await nftStorage.reverse_ledger.get(address);
    if (getTokenIds) {
      let useNft = await Promise.all([
        ...getTokenIds.map(async (id: { toNumber: () => any }) => {
          let obj: any;
          const tokenId = id.toNumber();
          const metadata = await nftStorage.token_metadata.get(tokenId);
          const tokenInfoBytes = metadata.token_info.get("");
          const tokenInfo = bytes2Char(tokenInfoBytes);
          const ipfsHasH =
            tokenInfo.slice(0, 7) === "ipfs://" ? tokenInfo.slice(7) : null;
         if (ipfsHasH != null) {
          obj = await fetch(`https://cloudflare-ipfs.com/ipfs/${ipfsHasH}`)
          .then(function (response) {
            return response.text();
          })
          .then(async function (res) {
            const data = JSON.parse(res);
            console.log(data);
            const disUri = data.displayUri;
            const imageHasH = await disUri.slice(0, 7) === "ipfs://" ? disUri.slice(7) : null;
            let imageUrl = 'https://cloudflare-ipfs.com/ipfs/'+imageHasH;
            data["displayUri"] = imageUrl;
            return data;
          });
         }
          // return {
          //   tokenId,
          //   ipfsHash:
          //     tokenInfo.slice(0, 7) === "ipfs://" ? tokenInfo.slice(7) : null,
          // };
          obj["tokenId"] = tokenId;
          return obj;
        }),
      ]);

      SetUserNfts(useNft);
    }
  };
  useEffect(() => {
    (async () => {
      // creates a wallet instance
      const wallet = new BeaconWallet({
        name: "Taquito Boilerplate",
        preferredNetwork: NetworkType.GRANADANET,
        disableDefaultEvents: true, // Disable all events / UI. This also disables the pairing alert.
        eventHandlers: {
          // To keep the pairing alert, we have to add the following default event handlers back
          [BeaconEvent.PAIR_INIT]: {
            handler: defaultEventCallbacks.PAIR_INIT,
          },
          [BeaconEvent.PAIR_SUCCESS]: {
            handler: (data) => setPublicToken(data.publicKey),
          },
        },
      });
      Tezos.setWalletProvider(wallet);
      setWallet(wallet);
      // checks if wallet was connected before
      const activeAccount = await wallet.client.getActiveAccount();
      if (activeAccount) {
        const userAddress = await wallet.getPKH();
        await setup(userAddress);
        setBeaconConnection(true);
      }
    })();
  }, []);

  return (
    <div className="buttons">
      <button className="button" onClick={connectWallet}>
        Sync
      </button>
    </div>
  );
};

export default ConnectButton;
