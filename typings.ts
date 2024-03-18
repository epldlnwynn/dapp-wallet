import { BlockNumber, TransactionConfig } from 'web3-core'
import React from "react";


export interface WalletProviderProps {
    autoConnect?: boolean;
    pollBalanceInterval?: number
    pollBlockNumberInterval?: number
    children: React.ReactNode;
}

export enum EventNames {
    AccountsChanged = "accountsChanged",
    ChainChanged = "chainChanged",
    Connected = "connected",
    Disconnected = "disconnected",
    OnTransaction = "onTransaction",
}

export enum Status {
    noconnect,
    connected,
    disconnected,
    connecting,
    error,
}

export interface AssetInfo {
    name: string;
    symbol: string;
    balance: string;
    address: string;
    logoUrl: string;
}

export interface Account {
    address: string
    publicKey?: string
}
export interface IWallet<T = any> {
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

export interface IPlugin {
    readonly name: string;
    readonly plugin: string;
    readonly pluginUrl: string;
    readonly docsUrl?: string;
    readonly provider: any;

    installed(canInstall?: boolean): boolean;
}



export class Sign {
    r: string;
    s: string;
    v: number;
    sign: string;

    constructor(_sign: string | number) {
        const bs = Sign.hexToBytes(_sign)

        this.sign = _sign.toString(16);
        this.r = Sign.bytesToHex(bs.slice(0, 32));
        this.s = Sign.bytesToHex(bs.slice(32, 64));
        this.v = bs[64] + (bs[64] < 27 ? 27 : 0);
    }

    static hexToBytes(hex: string | number) {
        hex = hex.toString(16).replace(/^0x/i,'');

        for (var bytes = [], c = 0; c < hex.length; c += 2)
            bytes.push(parseInt(hex.slice(c, c + 2), 16));

        return bytes
    }
    static bytesToHex(bytes: Array<any>) {
        for (var hex = [], i = 0; i < bytes.length; i++) {
            hex.push((bytes[i] >>> 4).toString(16));
            hex.push((bytes[i] & 0xF).toString(16));
        }
        return '0x'+ hex.join("");
    }

}


export interface MessageTypeProperty {
    name: string;
    type: string;
}

export interface MessageTypes {
    [additionalProperties: string]: MessageTypeProperty[];
}

export interface TypedMessage<T extends MessageTypes> {
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

export interface RequestChainParameter {
    method: string;
    params: any;
}

export interface AddEthereumChainParameter {
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

export interface EthCall {
    transactionConfig: TransactionConfig;

    defaultBlock: BlockNumber;
}



export class WalletError extends Error {
    code: number;
    message: string;

    constructor(code: number, message: string) {
        super(message)

        this.code = code
        this.message = message
    }

    static newError(code: number, message: string) {
        return new WalletError(code, message)
    }
}
