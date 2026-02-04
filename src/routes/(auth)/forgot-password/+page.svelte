<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Forgot Password - Movie Night</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-[var(--color-text)]">Movie Night</h1>
			<p class="text-[var(--color-text-muted)] mt-2">Reset your password</p>
		</div>

		<div class="bg-[var(--color-surface)] rounded-lg p-8 shadow-lg">
			{#if form?.success}
				<div
					class="bg-[var(--color-success)]/10 border border-[var(--color-success)] text-[var(--color-success)] rounded-lg p-4 mb-6"
				>
					<p class="font-medium">Check your email</p>
					<p class="text-sm mt-1">
						If an account exists with that email, we've sent password reset instructions.
					</p>
				</div>
				<a
					href="/login"
					class="block w-full text-center py-2 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors"
				>
					Back to Login
				</a>
			{:else}
				{#if form?.error}
					<div class="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 mb-6">
						{form.error}
					</div>
				{/if}

				<p class="text-[var(--color-text-muted)] text-sm mb-6">
					Enter your email address and we'll send you instructions to reset your password.
				</p>

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
					<div class="mb-6">
						<label for="email" class="block text-sm font-medium text-[var(--color-text)] mb-2">
							Email
						</label>
						<input
							type="email"
							id="email"
							name="email"
							required
							class="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
							placeholder="you@example.com"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="w-full py-2 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Sending...' : 'Send Reset Instructions'}
					</button>
				</form>

				<div class="mt-6 text-center">
					<a href="/login" class="text-[var(--color-primary)] hover:underline text-sm">
						Back to login
					</a>
				</div>
			{/if}
		</div>
	</div>
</div>
