import { Evm } from "../wallet";

export class Coinbase extends Evm {

    constructor() {
        super(
            "CoinbaseWallet",
            "coinbaseWalletExtension",
            "https://chromewebstore.google.com/detail/coinbase-wallet-extension/hnfanknocfeofbddgcijnmhnfnkdnaad?hl=en",
            "https://docs.cloud.coinbase.com/wallet-sdk/docs/injected-provider"
        );

        this._handleMessage = this._handleMessage.bind(this)

    }

    _handleMessage(e: any) {
        const {data, type} = e.data
        console.log(this.name + '.message', e.data)

        if (type === "extensionUIResponse" && data.action === "parentDisconnect") {
            this.disconnect()
            return
        }

    }

    get isConnected(): boolean {
        return this._connected
    }
    set isConnected(e) {
        this._connected = e

        if (e) {
            window.addEventListener('message', this._handleMessage)
        } else {
            window.removeEventListener('message', this._handleMessage)
        }
    }

    static new(): Evm {
        return new Coinbase()
    }

}
