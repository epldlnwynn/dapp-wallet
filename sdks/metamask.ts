import {Evm} from "../wallet";


export class MetaMask extends Evm {

    constructor() {
        super(
            'MetaMask',
            'ethereum',
            'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn',
            "https://docs.metamask.io/guide/rpc-api.html#table-of-contents"
        );

        if (this.provider?._state) {
            const {accounts, isConnected, isUnlocked} = this.provider._state
            if (accounts && isUnlocked && isConnected) this.account = accounts[0]
        }
    }

    static new(): Evm {
        return new MetaMask()
    }


    get provider(): any {
        if (!this._provider) {
            let p = (window as any)[this.plugin]

            // 兼容 OKX 钱包
            if ("providerMap" in p)
                p = p.providerMap.get(this.name);

            this._provider = p;
        }
        return this._provider;
    }

}
