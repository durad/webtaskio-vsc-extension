
export interface IWebtask {
    container: string;
    name: string;
    token: string;
    meta: any,
    webtask_url: string;
}

export interface IWebtaskDetails {
    jti: string,
    iat: string;
    ca: string[];
    dd: number;
    ten: string;
    jtn: string;
    pb: number;
    url: string;
    code: string;
    meta: any;
    webtask_url: string;
}

export interface IVerifyCodeResult {
    tenant: string;
    subtenant: string;
    url: string;
    token: string;
}
