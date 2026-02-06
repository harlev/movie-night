// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	const __BUILD_TIME__: string;
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}
		interface Locals {
			user: {
				id: string;
				email: string;
				displayName: string;
				role: 'admin' | 'member';
			} | null;
		}
		interface Platform {
			env: {
				DB: D1Database;
				JWT_SECRET: string;
				TMDB_API_KEY: string;
				EMAIL_API_KEY?: string;
			};
			context: ExecutionContext;
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
