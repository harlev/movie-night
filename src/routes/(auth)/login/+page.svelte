<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	let { form } = $props();
	let loading = $state(false);
	let showPassword = $state(false);

	const showResetSuccess = $derived($page.url.searchParams.get('reset') === 'success');
</script>

<svelte:head>
	<title>Login - Movie Night</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-[var(--color-text)]">Movie Night</h1>
			<p class="text-[var(--color-text-muted)] mt-2">Sign in to your account</p>
		</div>

		<div class="bg-[var(--color-surface)] rounded-lg p-8 shadow-lg">
			{#if showResetSuccess}
				<div class="bg-[var(--color-success)]/10 border border-[var(--color-success)] text-[var(--color-success)] rounded-lg p-3 mb-6">
					Password reset successful. Please sign in with your new password.
				</div>
			{/if}

			{#if form?.error}
				<div class="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 mb-6">
					{form.error}
				</div>
			{/if}

			<form
				method="POST"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
					};
				}}
			>
				<div class="mb-4">
					<label for="email" class="block text-sm font-medium text-[var(--color-text)] mb-2">
						Email
					</label>
					<input
						type="email"
						id="email"
						name="email"
						value={form?.email || ''}
						required
						class="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
						placeholder="you@example.com"
					/>
				</div>

				<div class="mb-6">
					<label for="password" class="block text-sm font-medium text-[var(--color-text)] mb-2">
						Password
					</label>
					<input
						type={showPassword ? 'text' : 'password'}
						id="password"
						name="password"
						required
						class="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
						placeholder="••••••••"
					/>
					<label class="flex items-center mt-2 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={showPassword}
							class="mr-2 accent-[var(--color-primary)]"
						/>
						<span class="text-sm text-[var(--color-text-muted)]">Show password</span>
					</label>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full py-2 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? 'Signing in...' : 'Sign In'}
				</button>
			</form>

			<div class="mt-6 text-center">
				<a href="/forgot-password" class="text-[var(--color-primary)] hover:underline text-sm">
					Forgot your password?
				</a>
			</div>

			<div class="mt-4 text-center text-[var(--color-text-muted)] text-sm">
				Have an invite code?
				<a href="/signup" class="text-[var(--color-primary)] hover:underline">Sign up</a>
			</div>
		</div>
	</div>
</div>
