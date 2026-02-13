export declare const config: {
    env: string;
    port: number;
    apiPrefix: string;
    jwt: {
        secret: string;
        accessExpiry: string;
        refreshExpiry: string;
        issuer: string;
    };
    google: {
        clientId: string;
        clientSecret: string;
        callbackURL: string;
    };
    facebook: {
        appId: string;
        appSecret: string;
        callbackURL: string;
    };
    otp: {
        issuer: string;
        window: number;
    };
    rateLimit: {
        windowMs: number;
        max: number;
    };
    defaultTenantId: string;
};
//# sourceMappingURL=index.d.ts.map