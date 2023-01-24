export const deferred = () => {
    let deferred: any = {};
    deferred.promise = new Promise((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });
    return deferred;
}

export const delay = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const isObject = (x: any) => {
    return typeof x === 'object' && x !== null;
};


export const generateRandomString = (length: number) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let nonce = '';
    while (nonce.length < length) {
        nonce += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return nonce;
}

export const encodeParams = (parameters: any) => {
    return Buffer.from(JSON.stringify(parameters)).toString('base64');
}