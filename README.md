# dapp-wallet
> 这是一个 DAPP 钱包工具，主要是以钱包工具扩展，目前支持 MetaMask、CoinBase、Okx、TronLink、UniSat钱包工具，也可以根据自己需要进行扩展，已经为您准备好了最基础的代码，只要引用和自己的处理逻辑即可。


---

## 安装

```shell
npm i dapp-wallet -S

# or 

yarn add dapp-wallet


```


## 使用

```typescript

// file app.js or app.vue
import {MetaMask, Tronlink, Unisat} from "dapp-wallet/sdks";

// 注册钱包到插件中
MetaMask.new()
Tronlink.new()
Unisat.new()

```


### 页面使用

```typescript tsx

// 母板页面  layouts/BasicLayout.tsx
import { WalletProvider } from "dapp-wallet";

const BasicLayout: FC = ({ children }) => {

    return <WalletProvider autoConnect>{children}</WalletProvider>
}
export default BasicLayout


// 或者


// app.js 或 app.vue
export function rootContainer(root) {
    return <WalletProvider autoConnect>{root}</WalletProvider>
}

```


```typescript tsx

import Web3 from "web3";
import {useWallet} from "dapp-wallet";


export default () => {
    const wallet = useWallet<MetaMask>();


    useEffect(() => {

        console.log(Web3.version, wallet.balance, wallet.status)

        wallet.getGasPrice().then(gas => console.log('gasPrice', gas))
        wallet.getBlockNumber().then(num => console.log('blockNumber', num))

    }, [wallet])
    
    // 使用 MetaMask 连接钱包
    return <div>
        <button onClick={e => wallet.connect('MetaMask')}>Connect Wallet</button>
    </div>

}

```



## 扩展

```typescript
import { WalletPlugin } from "dapp-wallet";


class TestWallet extends WalletPlugin {

    constructor() {
        super(
            "钱包名称", 
            "浏览器插件注入对象名",
            "浏览器插件下载网址",
            "钱包开发者文档网址"
        );
        
    }
    
    connect() {
        // 连接钱包逻辑
        return Promise.resolve()
    }
    
    

}
```
