import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";
import {EventBus} from "listen-events";
import Web3 from "web3";
//import {HttpProvider} from "web3-providers-http"
//import {JsonRpcPayload, JsonRpcResponse} from "web3-core-helpers";
import {PromiEvent, TransactionConfig, TransactionReceipt} from "web3-core";
import {
    Account,
    AddEthereumChainParameter,
    AssetInfo,
    EthCall,
    EventNames,
    IPlugin,
    IWallet,
    RequestChainParameter,
    Status,
    TypedMessage,
    WalletProviderProps
} from "./typings";


export * from "./typings"


const PREFIX = location.host, LS = localStorage,
    WALLET_ACCOUNT = PREFIX + ".address",
    WALLET_NETWORK = PREFIX + ".network",
    WALLET_PLATFORM = PREFIX + ".platform"

const EVM_ABI_TRANSFER = [
    { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" },
    { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "name": "to", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "success", "type": "bool" }], "payable": false, "type": "function" }
];

type WalletContext = {
    wallet: IWallet
    version: number
    pollBalanceInterval?: number
    pollBlockNumberInterval?: number
}

const WalletStateContext: React.Context<WalletContext | null> = createContext<WalletContext | null>(null);


let lastVersion = 1, LAST_VERSION = "LAST_VERSION";
const _walletPlugins: { [key: string]: WalletPlugin } = {}


export const register = (plugin: WalletPlugin) => {
    _walletPlugins[plugin.name] = plugin
}

export const matchInjectedWallet = (): WalletPlugin | null => {
    const vals = Object.values(_walletPlugins)
    for (var i = 0; i < vals.length; i++) {
        const p = vals[i]
        if (p.plugin in window)
            return p
    }

    return null
}

export const useWallet = <T = any>(): IWallet<T> => {
    const walletContext = useContext(WalletStateContext)

    if (!walletContext)
        throw new Error('useWallet() can only be used inside of <WalletProvider />, please declare it at a higher level.')

    const {wallet} = walletContext

    return useMemo(() => {
        return {...wallet}
    }, [wallet]);
}

export const WalletProvider: React.FC<WalletProviderProps> = (props: WalletProviderProps) => {
    const [version, setVersion] = useState(lastVersion)
    const [provider, setProvider] = useState<WalletPlugin | null>()
    const [lastUsed, setLastUsed] = useState<string>(LS.getItem(WALLET_PLATFORM) || "")
    //const incrVersion = (delta: number = 1) => setVersion(lastVersion += delta)


    const connect = useCallback(async (walletName?: string) => {
        const name = walletName || lastUsed || "injected"
        const pro = _walletPlugins[name] || matchInjectedWallet()

        if (!pro)
            return Promise.reject("Not matched to injected wallet plugin.")

        if (!pro.connect)
            return Promise.reject(pro.name + "not yet implemented `connect`.")

        console.log('WalletProvider.connect', pro.name, walletName)

        const account = await pro.connect()
        setLastUsed(pro.name)
        setProvider(pro)

        pro.on(LAST_VERSION, newVersion => {
            setVersion(newVersion)
            console.log('version.update', newVersion, version)
        })

        return account

    }, [])

    const disconnect = () => {
        console.log('WalletProvider.disconnect', provider?.name)

        if (provider) {
            provider.disconnect()
            setProvider(null)
        }

    }

    const getGasPrice = () => {
        if (provider)
            return provider.getGasPrice()

        return Promise.resolve(0)
    }

    const getBlockNumber = () => {
        if (provider)
            return provider.getBlockNumber()

        return Promise.resolve(0)
    }


    useEffect(() => {
        if (!props.autoConnect)
            return

        const connectAsync = async () => {
            await connect()
        }

        connectAsync()

    }, [])


    const wallet: IWallet = useMemo(() => ({
        provider: provider,
        balance: provider?.balance || "0",
        account: provider?.account || "",
        network: provider?.network || "",
        platform: provider?.platform || "",
        isConnected: provider?.isConnected || false,
        status: provider?.status || Status.noconnect,
        assets: provider?.assets || [],

        connect,
        disconnect,
        getGasPrice,
        getBlockNumber
    }), [provider, version])

    console.log('update', version, wallet, lastUsed)


    let value: WalletContext = {
        wallet, version,
        pollBalanceInterval: props.pollBalanceInterval,
        pollBlockNumberInterval: props.pollBlockNumberInterval
    };

    return React.createElement(WalletStateContext.Provider, {value}, props.children)

}


export abstract class WalletPlugin extends EventBus implements IPlugin, IWallet {
    private _name: string;
    private _plugin: string;
    private _pluginUrl: string;
    private _docsUrl?: string;
    protected _provider: any;
    protected _connected: boolean;
    protected _status: Status;
    protected _balance: string;
    protected _assets?: Array<AssetInfo>



    get name(): string {
        return this._name
    }
    get plugin(): string {
        return this._plugin
    }
    get pluginUrl(): string {
        return this._pluginUrl
    }
    get docsUrl(): string {
        return this._docsUrl || ""
    }
    get platform(): string {
        return LS.getItem(WALLET_PLATFORM) || ""
    }
    set platform(e) {
        LS.setItem(WALLET_PLATFORM, e)
    }


    get provider(): any {
        if (!this._provider)
            this._provider = (window as any)[this.plugin]

        return this._provider
    }
    get isConnected(): boolean {
        return this._connected
    }
    set isConnected(e) {
        this._connected = e
    }
    get account(): string {
        return LS.getItem(WALLET_ACCOUNT) || ""
    }
    set account(e) {
        LS.setItem(WALLET_ACCOUNT, e)
    }
    get network(): string {
        return LS.getItem(WALLET_NETWORK) || ""
    }
    set network(e) {
        LS.setItem(WALLET_NETWORK, e)
        this.incrVersion()
    }
    get balance(): string {
        return this._balance
    }
    set balance(e) {
        this._balance = e
        this.incrVersion()
    }
    get assets(): Array<AssetInfo>{
        return this._assets || []
    }
    set assets(e) {
        this._assets = e
        this.incrVersion()
    }
    get status(): Status {
        return this._status
    }
    set status(e) {
        this._status = e
        this.isConnected = e == Status.connected
        if (this._connected) this.platform = this.name
        this.incrVersion()
    }


    constructor(name: string, plugin: string, pluginUrl: string, docsUrl?: string) {
        super(false)

        this._name = name;
        this._plugin = plugin
        this._pluginUrl = pluginUrl
        this._docsUrl = docsUrl


        this._connected = false
        this._status = Status.noconnect;
        this._balance = "0"


        this.connect = this.connect.bind(this)
        this.disconnect = this.disconnect.bind(this)
        this._handleAccountsChanged = this._handleAccountsChanged.bind(this)
        this._handleChainChanged = this._handleChainChanged.bind(this)


        register(this)
    }


    protected _handleAccountsChanged(accounts: Array<string>) {
        console.log(this.name + '.accountsChanged', accounts)
        if (accounts.length == 0) {
            this.disconnect()
            return
        }

        this._connected = true
        this.account = accounts[0]
        this.balanceOf(undefined, undefined, 'ether').then(balance => {
            this.balance = balance.toString()
        })
        this.emitAll(EventNames.AccountsChanged, ...accounts)
    }
    protected _handleChainChanged(chain: any) {
        let id = chain.toString(16)
        console.log(this.name + '.chainChanged', chain, id)

        this.network = id
        this.balanceOf(undefined, undefined, 'ether').then(balance => {
            this.balance = balance.toString()
        })
        this.emitAll(EventNames.ChainChanged, id)
    }
    protected incrVersion(delta: number = 1) {
        lastVersion = lastVersion + delta
        this.emitAll(LAST_VERSION, lastVersion)
        console.log(LAST_VERSION, lastVersion)
    }


    installed(canInstall?: boolean): boolean {
        if (this.plugin in window)
            return true

        if (canInstall && confirm("Do you want to install `" + this.name + "` now?"))
            window.open(this.pluginUrl, "_blank")

        return false
    }

    isCurrentPlatform(): boolean {
        return this.name === this.platform
    }


    abstract connect(): Promise<string | Account>;
    disconnect(): void {
        console.log([this.name,'disconnect'].join('.'))

        LS.removeItem(WALLET_ACCOUNT)
        LS.removeItem(WALLET_NETWORK)
        LS.removeItem(WALLET_PLATFORM)
        this.status = Status.disconnected

        this.account && this.emitAll(EventNames.Disconnected, this.account)
    }


    getGasPrice(): Promise<number> {
        return Promise.resolve(0)
    }
    getBlockNumber(): Promise<number> {
        return Promise.resolve(0)
    }
    sign(_data: any): Promise<string> {
        return Promise.resolve("")
    }
    switchChain(_chain: number | string, _addChain?: AddEthereumChainParameter): Promise<void> {
        return Promise.resolve()
    }
    balanceOf(_userAddress?: string, _tokenAddress?: string, _unit?: string): Promise<number | string> {
        return Promise.resolve(0)
    }
    transfer(_amount: any, _userAddress: string, _tokenAddress?: string, _unit?: string): Promise<any> {
        return Promise.resolve()
    }


}


export class Evm extends WalletPlugin {
    protected _web3js: any;

    constructor(name: string, plugin: string, pluginUrl: string, docsUrl?: string) {
        super(name, plugin, pluginUrl, docsUrl)
    }

    get web3js(): any {
        if (!this._web3js) {
            this._web3js = new Web3(Web3.givenProvider)
            console.log('create web3 instance. version', Web3.version)
        }

        return this._web3js
    }
    get isConnected(): boolean{
        return this._connected
    }
    set isConnected(e) {
        this._connected = e
        if (e) {
            // 先关闭掉事件，防止重复绑定
            this.provider.off("accountsChanged", this._handleAccountsChanged)
            this.provider.off("chainChanged", this._handleChainChanged)

            this.provider.on("accountsChanged", this._handleAccountsChanged)
            this.provider.on("chainChanged", this._handleChainChanged)

            this.request("eth_chainId").then(chain => this.network = chain)
        } else {
            this.provider.removeListener("accountsChanged", this._handleAccountsChanged)
            this.provider.removeListener("chainChanged", this._handleChainChanged)
        }
    }


    request<T = any>(e: string | RequestChainParameter, params?: any): Promise<T> {
        var data: any = {};
        if (typeof e === 'string') {
            data.method = e;
        } else {
            data = e;
        }

        if (params) {
            if (Array.isArray(params)) {
                data['params'] = params;
            } else {
                data['params'] = [params]
            }
        }
        return this.provider.request(data);
    }


    connect(): Promise<any> {
        return this.request('eth_requestAccounts').then(async accounts => {
            console.log(this.name + '.connect', accounts)

            this.account = accounts[0]
            this.status = Status.connected
            this.balanceOf(accounts[0], undefined, 'ether').then(balance => this.balance = balance.toString())

            return accounts[0]
        }).catch((er: any) => {
            if (er.code === 4001) {
                alert(`Please connect to ${this.name}.`);
            } else {
                alert(er.message);
            }
        })
    }

    switchChain(chain: number | string, addChain?: AddEthereumChainParameter) {
        return this.request(
            'wallet_switchEthereumChain',{ chainId: '0x' + chain.toString(16) }
        ).catch(e => {
            const msg = e.message
            console.log('switch chain error', msg, e)
            if (addChain && (msg.indexOf('wallet_addEthereumChain') > 0 || e.code === 4902)) {
                return this.request('wallet_addEthereumChain', addChain)
            }
        })
    }

    sign(data: string): Promise<string> {
        return this.web3js.eth.personal.sign(data, this.account)
    }

    /**
     * @apiNote https://docs.metamask.io/guide/signing-data.html#signtypeddata-v4
     */
    signV4(msgParams: TypedMessage<any>): Promise<string> {
        const from = this.account
        var params = [from, msgParams];
        var method = 'eth_signTypedData_v4';

        return this.web3js.currentProvider.send({method, params, from})
    }

    sendTransaction(e: TransactionConfig, call?:(error: Error, hash: string) => void): PromiEvent<TransactionReceipt> {
        return !e['from'] && (e['from'] = this.account), this.web3js.eth.sendTransaction(e, call);
    }

    ethCall(p: EthCall | Array<EthCall>): Promise<string> {
        return this.request('eth_call', Array.isArray(p) ? p : [p]);
    }

    balanceOf(userAddress?: string, tokenAddress?: string, unit?: string): Promise<number> {
        const address = userAddress || this.account, call = (balance: string) => {
            return unit ? this.web3js.utils.fromWei(balance, unit) : parseInt(balance, 16)
        };

        if (!tokenAddress)
            return this.request("eth_getBalance", [address, 'latest']).then(call)

        return this.web3js.eth.call({
            from: address,
            to: tokenAddress,
            data: "0x70a08231000000000000000000000000" + userAddress?.substring(2)
        }).then(call)
    }

    transfer(amount: any, userAddress: string, tokenAddress?: string, unit?: string): Promise<any> {
        const from = this.account, value = unit ? this.web3js.utils.toWei(amount.toString(), unit) : amount.toString()
        if (!tokenAddress)
            return new Promise((r, e) => {
                this.web3js.eth.sendTransaction({
                    from, to: userAddress, value
                }, function(er: Error, hash: string) {
                    er ? e(er) : r(hash)
                })
            })

        const contract = new this.web3js.eth.Contract(EVM_ABI_TRANSFER, tokenAddress);
        return new Promise((r, e) => {
            contract.methods.transfer(userAddress, value).send({from}, function (er: any, hash: string) {
                er ? e(er) : r(hash)
            })
        })
    }

    getBlockNumber() {
        return this.web3js.eth.getBlockNumber()
    }

    getGasPrice() {
        return this.request("eth_gasPrice").then(gas => parseInt(gas))
    }

    estimateGas(transactionConfig: TransactionConfig, callback?: (error: Error, gas: number) => void): Promise<number> {
        return this.web3js.eth.estimateGas(transactionConfig, callback)
    }

}
