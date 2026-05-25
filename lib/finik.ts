import { Signer } from '@mancho.devs/authorizer';

let isInitialized = false;

type Body = Record<string, unknown> | string | undefined;

interface RequestData {
  httpMethod: string;
  path: string;
  headers: Record<string, string>;
  queryStringParameters?: Record<string, string> | null;
  body?: Body | null;
}

const FINIK_ENV = process.env.FINIK_ENV || 'beta';
const BASE_URL = FINIK_ENV === 'prod'
  ? 'https://api.acquiring.averspay.kg'
  : 'https://beta.api.acquiring.averspay.kg';
const HOST = FINIK_ENV === 'prod'
  ? 'api.acquiring.averspay.kg'
  : 'beta.api.acquiring.averspay.kg';

const FINIK_API_KEY = process.env.FINIK_API_KEY;
const FINIK_ACCOUNT_ID = process.env.FINIK_ACCOUNT_ID;

const FINIK_PRIVATE_KEY = (() => {
  if (process.env.FINIK_PRIVATE_KEY) {
    const key = process.env.FINIK_PRIVATE_KEY.trim();
    if (!isInitialized) {
      isInitialized = true;
    }
    return key;
  }
  if (!isInitialized) {
    console.error('❌ FINIK_PRIVATE_KEY not configured');
    isInitialized = true;
  }
  return undefined;
})();

const FINIK_PUBLIC_KEYS = {
  prod: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuF/PUmhMPPidcMxhZBPb
BSGJoSphmCI+h6ru8fG8guAlcPMVlhs+ThTjw2LHABvciwtpj51ebJ4EqhlySPyT
hqSfXI6Jp5dPGJNDguxfocohaz98wvT+WAF86DEglZ8dEsfoumojFUy5sTOBdHEu
g94B4BbrJvjmBa1YIx9Azse4HFlWhzZoYPgyQpArhokeHOHIN2QFzJqeriANO+wV
aUMta2AhRVZHbfyJ36XPhGO6A5FYQWgjzkI65cxZs5LaNFmRx6pjnhjIeVKKgF99
4OoYCzhuR9QmWkPl7tL4Kd68qa/xHLz0Psnuhm0CStWOYUu3J7ZpzRK8GoEXRcr8
tQIDAQAB
-----END PUBLIC KEY-----`,
  beta: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwlrlKz/8gLWd1ARWGA/8
o3a3Qy8G+hPifyqiPosiTY6nCHovANMIJXk6DH4qAqqZeLu8pLGxudkPbv8dSyG7
F9PZEAryMPzjoB/9P/F6g0W46K/FHDtwTM3YIVvstbEbL19m8yddv/xCT9JPPJTb
LsSTVZq5zCqvKzpupwlGS3Q3oPyLAYe+ZUn4Bx2J1WQrBu3b08fNaR3E8pAkCK27
JqFnP0eFfa817VCtyVKcFHb5ij/D0eUP519Qr/pgn+gsoG63W4pPHN/pKwQUUiAy
uLSHqL5S2yu1dffyMcMVi9E/Q2HCTcez5OvOllgOtkNYHSv9pnrMRuws3u87+hNT
ZwIDAQAB
-----END PUBLIC KEY-----`
};

export interface CreatePaymentData {
  amount: number;
  userId: string;
  paymentId?: string;
}

export interface FinikWebhookData {
  id: string;
  transactionId: string;
  status: 'succeeded' | 'failed' | 'SUCCEEDED' | 'FAILED';
  amount: number;
  transactionDate: number;
  clientId: string;
  fields: {
    transactionType?: string;
    amount?: number;
    webhook_url?: string;
    paymentId?: string;
    success_redirect_url?: string;
    qrComment?: string;
    name?: string;
    qrTransactionId?: string;
    url?: string;
    [key: string]: unknown;
  };
  data: {
    accountId?: string;
    description?: string;
    metadata?: string | Record<string, unknown>;
    webhookUrl?: string;
    merchantCategoryCode?: string;
    name_en?: string;
    [key: string]: unknown;
  };
}

export async function createFinikPayment(data: CreatePaymentData): Promise<string> {
  if (!FINIK_API_KEY || !FINIK_ACCOUNT_ID) {
    throw new Error('Finik credentials are not configured (FINIK_API_KEY and FINIK_ACCOUNT_ID required)');
  }

  if (FINIK_ENV === 'prod' && !FINIK_PRIVATE_KEY) {
    throw new Error('FINIK_PRIVATE_KEY is required for production environment');
  }

  const timestamp = Date.now().toString();
  const paymentId = data.paymentId || crypto.randomUUID();

  const APP_URL = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

  const body = {
    Amount: data.amount,
    CardType: 'FINIK_QR',
    PaymentId: paymentId,
    RedirectUrl: `${APP_URL}/balance?payment=success&amount=${data.amount}`,
    Data: {
      accountId: FINIK_ACCOUNT_ID,
      merchantCategoryCode: '0742',
      name_en: 'ChargeFlow',
      description: `Пополнение баланса ChargeFlow на ${data.amount} сом`,
      webhookUrl: `${APP_URL}/api/finik/webhook`,
      metadata: JSON.stringify({
        userId: data.userId,
        paymentId: paymentId,
        amount: data.amount,
      }),
    },
  };

  const requestData: RequestData = {
    httpMethod: 'POST',
    path: '/v1/payment',
    headers: {
      Host: HOST,
      'x-api-key': FINIK_API_KEY,
      'x-api-timestamp': timestamp,
    },
    queryStringParameters: undefined,
    body,
  };

  let signature = '';
  if (FINIK_ENV === 'prod' && FINIK_PRIVATE_KEY) {
    try {
      signature = await new Signer(requestData as any).sign(FINIK_PRIVATE_KEY);
    } catch (error) {
      console.error('❌ Signature error:', error);
      throw new Error('Failed to generate signature');
    }
  }

  const url = `${BASE_URL}${requestData.path}`;
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-api-key': FINIK_API_KEY,
    'x-api-timestamp': timestamp,
  };

  if (signature) {
    headers['signature'] = signature;
  }

  const response = await fetch(url, {
    method: requestData.httpMethod,
    headers,
    body: JSON.stringify(body),
    redirect: 'manual',
  });

  if (response.status === 302) {
    const paymentUrl = response.headers.get('location');
    if (!paymentUrl) {
      throw new Error('Payment URL not found in response');
    }
    return paymentUrl;
  }

  const errorText = await response.text();
  console.error('Finik payment creation failed:', response.status, errorText);
  throw new Error(`Payment creation failed (${response.status}): ${errorText}`);
}

export async function verifyFinikWebhook(
  signature: string,
  timestamp: string,
  body: Record<string, unknown>,
  headers: Record<string, string>,
  webhookPath: string = '/api/finik/webhook'
): Promise<boolean> {
  try {
    const env: 'prod' | 'beta' = FINIK_ENV === 'prod' ? 'prod' : 'beta';

    if (!FINIK_PUBLIC_KEYS[env]) {
      console.error('Finik public key is not configured for environment:', env);
      return false;
    }

    const publicKey = FINIK_PUBLIC_KEYS[env];

    const requestData = {
      httpMethod: 'POST',
      path: webhookPath,
      headers: {
        'Host': headers['host'] || headers['Host'] || '',
        'x-api-timestamp': timestamp,
      },
      queryStringParameters: undefined,
      body: body,
    };

    const isValid = await new Signer(requestData as any).verify(publicKey, signature);
    return isValid;
  } catch (error) {
    console.error('Error verifying webhook:', error);
    return false;
  }
}

export function isTimestampValid(timestamp: string, maxAgeMinutes: number = 5): boolean {
  try {
    const requestTime = parseInt(timestamp, 10);
    const currentTime = Date.now();
    const diffMinutes = (currentTime - requestTime) / 1000 / 60;
    return Math.abs(diffMinutes) <= maxAgeMinutes;
  } catch {
    return false;
  }
}
