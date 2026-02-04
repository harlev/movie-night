const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

async function deriveKey(
	password: string,
	salt: Uint8Array,
	iterations: number,
	keyLength: number
): Promise<Uint8Array> {
	const encoder = new TextEncoder();
	const passwordKey = await crypto.subtle.importKey(
		'raw',
		encoder.encode(password),
		'PBKDF2',
		false,
		['deriveBits']
	);

	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: salt.buffer as ArrayBuffer,
			iterations: iterations,
			hash: 'SHA-256'
		},
		passwordKey,
		keyLength * 8
	);

	return new Uint8Array(derivedBits);
}

function bufferToHex(buffer: Uint8Array): string {
	return Array.from(buffer)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

function hexToBuffer(hex: string): Uint8Array {
	const matches = hex.match(/.{1,2}/g);
	if (!matches) return new Uint8Array();
	return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
	const hash = await deriveKey(password, salt, ITERATIONS, KEY_LENGTH);
	return `${bufferToHex(salt)}:${bufferToHex(hash)}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
	const [saltHex, hashHex] = storedHash.split(':');
	if (!saltHex || !hashHex) return false;

	const salt = hexToBuffer(saltHex);
	const expectedHash = hexToBuffer(hashHex);
	const actualHash = await deriveKey(password, salt, ITERATIONS, KEY_LENGTH);

	if (actualHash.length !== expectedHash.length) return false;

	let diff = 0;
	for (let i = 0; i < actualHash.length; i++) {
		diff |= actualHash[i] ^ expectedHash[i];
	}
	return diff === 0;
}
