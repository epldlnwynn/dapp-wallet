import {Evm} from "../wallet";


export class OkxWallet extends Evm {

    constructor() {
        super(
            "OkxWallet",
            "okxwallet",
            "https://chrome.google.com/webstore/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge",
            "https://www.okx.com/cn/web3/build/docs/sdks/chains/evm/introduce"
        );

    }

    static new(): Evm {
        return new OkxWallet()
    }

}
