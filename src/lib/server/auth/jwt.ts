export interface JWTPayload {
	sub: string;
	email: string;
	displayName: string;
	role: 'admin' | 'member';
	iat: number;
	exp: number;
}

function base64UrlEncode(str: string): string {
	const base64 = btoa(str);
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
	let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
	while (base64.length % 4) {
		base64 += '=';
	}
	return atob(base64);
}

async function createSignature(data: string, secret: string): Promise<string> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
	return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
}

async function verifySignature(data: string, signature: string, secret: string): Promise<boolean> {
	const expectedSignature = await createSignature(data, secret);
	if (signature.length !== expectedSignature.length) return false;

	let diff = 0;
	for (let i = 0; i < signature.length; i++) {
		diff |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
	}
	return diff === 0;
}

export async function createAccessToken(
	payload: Omit<JWTPayload, 'iat' | 'exp'>,
	secret: string,
	expiresIn: number = 60 * 60 // 1 hour
): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	const fullPayload: JWTPayload = {
		...payload,
		iat: now,
		exp: now + expiresIn
	};

	const header = { alg: 'HS256', typ: 'JWT' };
	const encodedHeader = base64UrlEncode(JSON.stringify(header));
	const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
	const data = `${encodedHeader}.${encodedPayload}`;
	const signature = await createSignature(data, secret);

	return `${data}.${signature}`;
}

export async function verifyAccessToken(token: string, secret: string): Promise<JWTPayload | null> {
	const parts = token.split('.');
	if (parts.length !== 3) return null;

	const [encodedHeader, encodedPayload, signature] = parts;
	const data = `${encodedHeader}.${encodedPayload}`;

	const isValid = await verifySignature(data, signature, secret);
	if (!isValid) return null;

	try {
		const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;

		// Check expiration
		const now = Math.floor(Date.now() / 1000);
		if (payload.exp < now) return null;

		return payload;
	} catch {
		return null;
	}
}

export function generateRefreshToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export async function hashToken(token: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(token);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	return Array.from(new Uint8Array(hashBuffer))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}
