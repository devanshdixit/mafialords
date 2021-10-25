import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.scss";
import { TezosToolkit, MichelCodecPacker } from "@taquito/taquito";
import { char2Bytes, bytes2Char } from "@taquito/utils";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { NetworkType } from "@airgap/beacon-sdk";
import { useEffect, useState } from "react";
import ConnectButton from "../components/ConnectWallet";
import DisconnectButton from "../components/DisconnectWallet";
import { Center } from "@chakra-ui/layout";

const Home: NextPage = () => {
  const [Tezos, setTezos] = useState<TezosToolkit>(
    new TezosToolkit("https://granadanet.smartpy.io")
  );
  const [contract, setContract] = useState<any>(undefined);
  const [publicToken, setPublicToken] = useState<string | null>("");
  const [wallet, setWallet] = useState<any>(null);
  const [userAddress, setUserAddress] = useState<string>("");
  const [userNfts, setUserNfts] = useState<any>([]);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [storage, setStorage] = useState<number>(1);
  const [copiedPublicToken, setCopiedPublicToken] = useState<boolean>(false);
  const [beaconConnection, setBeaconConnection] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("transfer");
  const contractAddress: string = "KT1NoyuWfuizGtCEqcuNstiugNevTwp9GGPf";
  const [uploadBtnText,setUploadBtnText] = useState("Upload");
    // const [files, setfiles] = useState<string>("");
  // const [title, settitle] = useState<any>("");
  // const [description, setdescription] = useState<any>("");
  let files:any, title:any, description:any;
  let d = "";
  const serverUrl ="http://localhost:5001/unique-nuance-310113/us-central1/helloWorld";
  let newNft: any;

  let nftStorage: any = undefined;
  const upload = async () => {
    try {
      setUploadBtnText("pinning the meta data");
      const data = new FormData();
      data.append("image", files[0]);
      data.append("title", title);
      data.append("description", description);
      data.append("creator", userAddress);
      console.log(data);
      const response = await fetch(`${serverUrl}/mint`, {
        method: "POST",
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        body: data
      });
      if (response) {
        const data = await response.json();
        if (
          data.status === true &&
          data.msg.metadataHash &&
          data.msg.imageHash
        ) {
          setUploadBtnText("Minting your NFT");
          // saves NFT on-chain
          const contract = await Tezos.wallet.at(contractAddress);
          const op = await contract.methods
            .mint(char2Bytes("ipfs://" + data.msg.metadataHash), userAddress)
            .send({ amount: 20 });
          console.log("Op hash:", op.opHash);
          await op.confirmation();

          newNft = {
            imageHash: data.msg.imageHash,
            metadataHash: data.msg.metadataHash,
            opHash: op.opHash
          };

          files = undefined;
          title = "";
          description = "";

          // refreshes storage
          setUploadBtnText("Uplaod");
          setUserNfts([]);
          await getUserNfts(userAddress);

        } else {
          throw "No IPFS hash";
        }
      } else {
        throw "No response";
      }
    } catch (error) {
      console.log(error);
    } finally {
      setUploadBtnText("Upload");
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
          obj = await fetch(`https://cloudflare-ipfs.com/ipfs/${ipfsHasH}`)
            .then(function (response) {
              return response.text();
            })
            .then(async function (res) {
              const data = JSON.parse(res);
              const disUri = data.displayUri;
              const imageHasH = await disUri.slice(0, 7) === "ipfs://" ? disUri.slice(7) : null;
              let imageUrl = 'https://cloudflare-ipfs.com/ipfs/'+imageHasH;
              data["displayUri"] = imageUrl;
              return data;
            });
          // return {
          //   tokenId,
          //   ipfsHash:
          //     tokenInfo.slice(0, 7) === "ipfs://" ? tokenInfo.slice(7) : null,
          // };
          obj["tokenId"] = tokenId;
          console.log(obj)
          return obj;
        }),
      ]);
      let objList = userNfts;
      objList.push(useNft);
      setUserNfts(objList);
    }
  };
  if (userAddress) {
    return (
      <div className={styles.container}>
        <Head>
          <title className={styles.title}>Mafia Lords</title>
          <meta name="description" content="Generated by create next app" />
          <link rel="icon" href="/images/logo.png" />
        </Head>
        <main className={styles.main}>
          <div className={styles.titlebox}>
            <div className={styles.titlebox1}>
              <h1 className={styles.title}>Mafia Lords</h1>
            </div>
            <div className={styles.titlebox2}>
              <DisconnectButton
                wallet={wallet}
                setPublicToken={setPublicToken}
                setUserAddress={setUserAddress}
                setUserBalance={setUserBalance}
                setWallet={setWallet}
                setTezos={setTezos}
                setBeaconConnection={setBeaconConnection}
              />
            </div>
          </div>
          {userNfts.length == 0 ? <div>Loading...</div> : 
          <div>
            {userNfts.map((nft:any,index:number)=>(
              <div key={index} className={styles.card}>
                <img style={{padding:"1%",border:"1px solid black"}} src={nft.displayUri} alt=""/>
                <h4 style={{fontSize:"24px",fontWeight:"bold",color:"black"}}>{nft.name}</h4>
                <h4 style={{fontSize:"18px",color:"black"}}>description: {nft.description}</h4>
                <h4 style={{fontSize:"18px",color:"black"}}>Id: {nft.tokenId}</h4>
                <img width="50" height="50" src={nft.thumbnailUri} alt=""/>
              </div>
            ))}
          </div>
          }
          <div className={styles.card}>
           <div>
          <div>Select your picture</div>
          <br />
          <input type="file"  
             style={{border:"1px solid black"}} value={files}  onChange={(e)=>{
               e.preventDefault();
              if (e.target.files != null) {
                files = e.target.files;
              }
               console.log(files+"files");
             }}/>
        </div>

        <br/>
        <div>
          <label >
            <span>Title:</span>
            <input type="text" id="image-title" 
             style={{border:"1px solid black"}} onChange={(e)=>{
              e.preventDefault();
              title = e.target.value;
              console.log(title);
            }} />
          </label>
        </div>

        <br/>
        <div>
          <label >
            <span>Description:</span>
            <textarea
              id="image-description"
             style={{border:"1px solid black"}}  onChange={(e)=>{
              e.preventDefault();
              description = e.target.value;
              console.log(description);
            }}
            />
          </label>

          <br/>
          <button style={{border:"1px solid black", padding:"10px 30px",margin:"10%"}} onClick={upload}>{uploadBtnText}</button>
        </div>
        </div>
        </main>
      </div>
    );
  } else if (!userAddress) {
    return (
      <div className={styles.container}>
        <Head>
          <title className={styles.title}>Mafia Lords</title>
          <meta name="description" content="Generated by create next app" />
          <link rel="icon" href="/images/logo.png" />
        </Head>
        <main className={styles.main}>
          <div className={styles.titlebox}>
            <div className={styles.titlebox1}>
              <h1 className={styles.title}>Mafia Lords</h1>
            </div>
            <div className={styles.titlebox2}>
              <ConnectButton
                Tezos={Tezos}
                setContract={setContract}
                SetUserNfts={setUserNfts}
                setPublicToken={setPublicToken}
                setWallet={setWallet}
                setUserAddress={setUserAddress}
                setUserBalance={setUserBalance}
                setStorage={setStorage}
                contractAddress={contractAddress}
                setBeaconConnection={setBeaconConnection}
                wallet={wallet}
              />
            </div>
          </div>
          <Center>
            <div className={styles.titlebox3}>
              <div className={styles.subtitle}>Welcome to Mafia Lords</div>
            </div>
          </Center>
          <Center>
            <div className={styles.titlebox4}>
              <div className={styles.subtitle1}>
                Connect your wallet to mint now
              </div>
            </div>
          </Center>
        </main>
      </div>
    );
  }
};

export default Home;
