import {WalletPlugin} from "../wallet";
import {Account, Status} from "../typings";


export class Unisat extends WalletPlugin {

    constructor() {
        super(
            "UniSatWallet",
            "unisat",
            "https://chromewebstore.google.com/detail/unisat-wallet/ppbibelpcjmhbdihakflkdcoccbgbkpo",
            "https://docs.unisat.io/dev/unisat-developer-service/unisat-wallet"
        );

    }

    get isConnected(): boolean {
        return this._connected
    }
    set isConnected(e) {
        this._connected = e
        if (e) {
            // 先关闭掉事件，防止重复绑定
            this.provider.off("accountsChanged", this._handleAccountsChanged)
            this.provider.off("networkChanged", this._handleChainChanged)

            this.provider.on("accountsChanged", this._handleAccountsChanged)
            this.provider.on("networkChanged", this._handleChainChanged)

            this.provider.getNetwork().then((network: string) => this.network = network)
        } else {
            this.provider.removeListener("accountsChanged", this._handleAccountsChanged)
            this.provider.removeListener("networkChanged", this._handleChainChanged)
        }
    }

    static new(): WalletPlugin {
        return new Unisat()
    }



    connect(): Promise<string | Account> {
        return this.provider.requestAccounts().then((accounts: Array<string>) => {
            console.log('connect', accounts)

            this.account = accounts[0]
            this.status = Status.connected
            this.balanceOf().then(balance => this.balance = balance.toString())

            return accounts[0]
        })
    }

    balanceOf(): Promise<number | string> {
        return this.provider.getBalance().then((balance: any) => {
            return this.fromSat(balance.total)
        })
    }


    getBlockNumber(): Promise<number> {
        return fetch("https://mempool.space/api/blocks/tip/height", {
            method: 'GET',
            headers: {
                'Content-Type': "text/plain;charset=UTF-8"
            }
        }).then(async resp => {
            if (resp.ok)
                return resp.text().then(text => parseInt(text))

            return 0;
        }).catch(er => {
            console.error(er)
            return 0
        })
    }

    getGasPrice(): Promise<number> {
        return fetch("https://mempool.space/api/v1/fees/recommended", {
            method: 'GET',
        }).then(async resp => {
            if (resp.ok)
                return resp.json().then(json => parseInt(json.fastestFee))

            return 0;
        }).catch(er => {
            console.error(er)
            return 0
        })
    }

    fromSat(amount: string | number, fractionDigits?: number) {
        if (typeof(amount) === "string")
            amount = parseInt(amount)

        return (amount / 100000000).toFixed(fractionDigits)
    }

}
