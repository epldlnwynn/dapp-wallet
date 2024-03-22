import React from "react";
import {BlockNumber, PromiEvent, TransactionConfig, TransactionReceipt} from "web3-core";
import {EventBus} from "listen-events";

export = Wallet

export as namespace Wallet

declare namespace Wallet {

    class WalletError extends Error {
        code: number;
        message: string

        constructor(code: number, message: string);

        static newError(code: number, message: string): WalletError;
    }

    enum EventNames {
        AccountsChanged = "accountsChanged",
        ChainChanged = "chainChanged",
        Connected = "connected",
        Disconnected = "disconnected",
        OnTransaction = "onTransaction",
    }

    enum Status {
        noconnect,
        connected,
        disconnected,
        connecting,
        error,
    }

    interface AssetInfo {
        name: string;
        symbol: string;
        balance: string;
        address: string;
        logoUrl: string;
    }

    interface Account {
        address: string
        publicKey?: string
    }

    interface IWallet<T = any> {
        readonly provider: T;
        readonly network: string;
        readonly account: string;
        readonly balance: string;
        readonly isConnected: boolean;
        readonly assets?: Array<AssetInfo>;
        readonly status: Status;
        readonly platform: string;


        connect(walletName?: string): Promise<string | Account>;
        disconnect(): void;


        getGasPrice(): Promise<number>;
        getBlockNumber(): Promise<number>;

    }

    function useWallet<T = any>(): IWallet<T>;

    interface WalletProviderProps {
        autoConnect?: boolean;
        pollBalanceInterval?: number
        pollBlockNumberInterval?: number
        children: React.ReactNode;
    }

    function WalletProvider(props: WalletProviderProps): JSX.Element;

    function register(plugin: WalletPlugin): void;




    interface IPlugin {
        readonly name: string;
        readonly plugin: string;
        readonly pluginUrl: string;
        readonly docsUrl?: string;
        readonly provider: any;

        installed(canInstall?: boolean): boolean;
    }

    class WalletPlugin extends EventBus implements IPlugin, IWallet {
        protected _provider: any;
        protected _connected: boolean;
        protected _status: Status;
        protected _balance: string;
        protected _assets?: Array<AssetInfo>

        constructor(name: string, plugin: string, pluginUrl: string, docsUrl?: string);

        get name(): string;
        get plugin(): string;
        get pluginUrl(): string;
        get docsUrl(): string;
        get platform(): string;


        get provider(): any;
        get isConnected(): boolean;
        get isUnlocked(): boolean;
        get network(): string;
        set network(e)
        get account(): string;
        set account(e);
        get balance(): string;
        get assets(): Array<AssetInfo>;
        get status(): Status;
        set status(e)


        protected _handleAccountsChanged(accounts: Array<string>): void
        protected _handleChainChanged(chain: any): void
        protected incrVersion(delta?: number): number;

        installed(canInstall?: boolean): boolean;
        connect<T = any>(): Promise<T>;
        disconnect(): void;


        getGasPrice(): Promise<number>;
        getBlockNumber(): Promise<number>;


        balanceOf(userAddress?: string, tokenAddress?: string, unit?: string): Promise<number | string>;
    }



    class Sign {
        r: string;
        s: string;
        v: number;
        sign: string;

        constructor(_sign: string);

        static hexToBytes(hex: string | number): Array<number>;
        static bytesToHex(bytes: Array<any>): string;

    }

    interface MessageTypeProperty {
        name: string;
        type: string;
    }

    interface MessageTypes {
        [additionalProperties: string]: MessageTypeProperty[];
    }

    interface TypedMessage<T extends MessageTypes> {
        types: T;
        primaryType: keyof T;
        domain: {
            name?: string;
            version?: string;
            chainId?: number;
            verifyingContract?: string;
            salt?: ArrayBuffer;
        };
        message: Record<string, unknown>;
    }

    interface RequestChainParameter {
        method: string;
        params: any;
    }

    interface AddEthereumChainParameter {
        chainId: string; // A 0x-prefixed hexadecimal string
        chainName: string;
        nativeCurrency: {
            name: string;
            symbol: string; // 2-6 characters long
            decimals: 18;
        };
        rpcUrls: string[];
        blockExplorerUrls?: string[];
        iconUrls?: string[]; // Currently ignored.
    }

    interface EthCall {
        transactionConfig: TransactionConfig;

        defaultBlock: BlockNumber;
    }

    class Evm extends WalletPlugin {
        readonly web3js: any;

        sign(text: string, address?: string): Promise<Sign>;
        /**
         * @apiNote https://docs.metamask.io/guide/signing-data.html#signtypeddata-v4
         */
        signV4(msgParams: TypedMessage<any>): Promise<string>

        balanceOf(userAddress?: string, tokenAddress?: string, unit?: string): Promise<number | string>;
        transfer(amount: any, userAddress: string, tokenAddress?: string, unit?: string): Promise<any>;


        ethCall(p: EthCall | Array<EthCall>): Promise<string>;
        sendTransaction(e: TransactionConfig, call?:(error: Error, hash: string) => void): PromiEvent<TransactionReceipt>;


        switchChain(chain: number | string, addChain?: AddEthereumChainParameter): Promise<any>;
        request<T = any>(e: string | RequestChainParameter, params?: any): Promise<T>;

    }

}



