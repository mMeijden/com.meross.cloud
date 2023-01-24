import crypto from 'crypto';
import request from 'request-promise';
import {generateRandomString, encodeParams} from './utils';

interface CloudCredentials {
    readonly token: string;
    readonly key: string;
    readonly userId: string;
}

export class MerossHTTPClient {

    readonly email: string;
    readonly password: string;
    readonly baseUrl: string;
    readonly merossSecret: string;
    cloudCredentials: CloudCredentials | undefined;

    constructor(email: string, password: string, baseUrl: string = 'https://iot.meross.com') {
        this.email = email
        this.password = password
        this.baseUrl = baseUrl
        this.merossSecret = '23x17ahWarFH6w29'
    }



    async signedCall(url: string, paramsData: any, token: string = '') {
        const nonce = generateRandomString(16);
        const timestampMillis = Date.now();
        const loginParams = encodeParams(paramsData);

        // Generate the md5-hash (called signature)
        const dataToSign = this.merossSecret + timestampMillis + nonce + loginParams;
        const md5hash = crypto.createHash('md5').update(dataToSign).digest('hex');
        const headers = {
            Authorization: `Basic ${token}`,
            vender: 'Meross',
            AppVersion: '1.3.0',
            AppLanguage: 'EN',
            'User-Agent': 'okhttp/3.6.0',
        };

        const payload = {
            params: loginParams,
            sign: md5hash,
            timestamp: timestampMillis,
            nonce,
        };

        try {
            const resp = await request(url, {method: 'POST', headers, form: payload});
            return JSON.parse(resp);
        } catch (error) {
            console.log(error)
        }
    }


    async obtainCloudCredentials() {
        const url = `${this.baseUrl}/v1/Auth/Login`;
        const data = {email: this.email, password: this.password};
        const resp = await this.signedCall(url, data);
        this.cloudCredentials = {
            token: resp.data.token,
            key: resp.data.key,
            userId: resp.data.userid
        }
    }

    async listDevices() {
        const url = `${this.baseUrl}/v1/Device/devList`;
        await this.obtainCloudCredentials()
        console.log("test cloud credentials")
        console.log(this.cloudCredentials)
        const response = await this.signedCall(url, {}, this.cloudCredentials!.token)
        //todo: can filtering be done on serverside or do we need to loop here through devices list?
        console.log(response)
        return response.data
    }
}

