declare module 'epayco-sdk-node' {
  export interface EpaycoChargeResource {
    get(refPayco: string): Promise<unknown>;
    create(data: Record<string, unknown>): Promise<unknown>;
  }

  export interface EpaycoClient {
    charge: EpaycoChargeResource;
  }

  export interface EpaycoFactoryOptions {
    apiKey: string;
    privateKey: string;
    lang?: string;
    test: boolean;
  }

  function epayco(options: EpaycoFactoryOptions): EpaycoClient;
  export = epayco;
}
