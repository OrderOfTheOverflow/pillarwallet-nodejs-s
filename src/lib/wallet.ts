import {WalletRegisterParams} from '../models/walletRegisterParams';
import {Requester} from '../utils/requester';
import {RequestPromise} from 'request-promise';
const auth = require('@pillarwallet/plr-auth-sdk');

export class Wallet {
    walletId: string;

    constructor(incomingWalletId?: string) {
        this.walletId = incomingWalletId;
    }

    register(walletCreationParams: WalletRegisterParams, privateKey: string): RequestPromise {
        console.log(walletCreationParams);
        // verify required parameter 'body' is not null or undefined
        if (walletCreationParams === null || walletCreationParams === undefined) {
            throw new Error('Required parameter body was null or undefined when calling createWallet.');
        }
        const xAPISignature = auth.sign(walletCreationParams,privateKey,'sha3');
        // verify required parameter 'xAPISignature' is not null or undefined
        if (xAPISignature === null || xAPISignature === undefined) {
            throw new Error('Required parameter xAPISignature was null or undefined when calling createWallet.');
        }
       // localVarHeaderParams['X-API-Signature'] = ObjectSerializer.serialize(xAPISignature, "string");
        return Requester.invoke(xAPISignature, walletCreationParams);
    }

    dumpConfig() {
        console.log(this);
    }
}