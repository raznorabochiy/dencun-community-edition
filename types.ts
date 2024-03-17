export type PurchaseDataResponse = {
  data?: {
    contract: string;
    minter: string;
    network_id: number;
    signature: string;
    voucher: {
      currency: string;
      expiry: number;
      initial_recipient: string;
      initial_recipient_amount: string;
      net_recipient: string;
      nonce: number;
      price: string;
      quantity: number;
      token_id: string;
      token_uri: null;
    };
  };
  expires_at?: string;
  id?: string;
  error?: {
    detail: "Not allowed for current buyer";
    status: "422";
    title: "Unprocessable entity";
  };
};
