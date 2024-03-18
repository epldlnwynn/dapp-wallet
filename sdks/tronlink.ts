import { Account, Status, WalletError } from "../typings";
import { WalletPlugin } from "../wallet";


export class Tronlink extends WalletPlugin {

    constructor() {
        super(
            "TronLink",
            "tronLink",
            "https://chromewebstore.google.com/detail/tronlink/ibnejdfjmmkpcnlpebklmnkoeoihofec",
            "https://docs.tronlink.org/dapp/start-developing"
        );

        this._handleMessage = this._handleMessage.bind(this)
    }

    static new(): WalletPlugin {
        return new Tronlink()
    }

    get provider(): any {
        if (!this._provider) {
            const tronLink = (window as any)[this.plugin]
            if (tronLink.ready) {
                this._provider = tronLink.tronWeb;
            }
        }
        return this._provider
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

    protected _handleMessage(e: any) {
        if (!e.data?.isTronLink) return

        console.log(this.name + '.message', e.data)

        const {action, data} = e.data.message
        if (action === 'setNode') {
            this._handleChainChanged(data.node.chainId)
            return;
        }

        if (action === 'accountsChanged') {
            this._handleAccountsChanged([data.address])
            return;
        }

        if (action === 'disconnect' || action === "disconnectWeb") {
            const address = (data?.disconnectAddress || "").toLowerCase(), current = this.account.toLowerCase()
            console.log('_handleMessage.' + action, address, current)

            if (current === address) {
                this.disconnect()
                return;
            }
        }

        if (action === 'connect') {
            console.log('_handleMessage.' + action, this._connected)
            this._connected = true
            return;
        }

        if (action === "tabReply") {
            const user = data.data

            if (user.isAuth != undefined) {
                console.log('_handleMessage.' + action, this._connected, user.isAuth)
                this._connected = (user.isAuth == 'true')
            }

            if (user?.node?.chainId)
                this.network = user.node.chainId
        }


    }

    connect(): Promise<string | Account> {
        const tronLink = (window as any)[this.plugin]
        return tronLink.request({ method: 'tron_requestAccounts' }).then((res: any) => {
            if (typeof(res) === 'string') {
                if (res.length == 0)
                    throw WalletError.newError(0, "Please unlock the wallet")
            }

            if (res.code != 200)
                throw WalletError.newError(res.code, res.message)


            const account = tronLink.tronWeb.defaultAddress.base58
            console.log(this.name + '.connect', account)

            this.account = account
            this._provider = tronLink.tronWeb
            this.status = Status.connected
            this.balanceOf().then(balance => this.balance = balance.toString())

            return account
        })
    }

    balanceOf(userAddress?: string, _tokenAddress?: string): Promise<number | string> {
        return this.provider.trx.getBalance(userAddress).then((balance: number) => this.fromTrx(balance))
    }

    getBlockNumber(): Promise<number> {
        return this.provider.trx.getCurrentBlock().then((block: any) => {
            return block.block_header.raw_data.number
        })
    }

    getGasPrice(): Promise<number> {
        return Promise.resolve(this.provider.feeLimit);
    }

    fromTrx(amount: any) {
        return amount / Math.pow(10, 6)
    }
}
