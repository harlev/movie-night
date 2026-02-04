<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Reset Password - Movie Night</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-[var(--color-text)]">Movie Night</h1>
			<p class="text-[var(--color-text-muted)] mt-2">Reset your password</p>
		</div>

		<div class="bg-[var(--color-surface)] rounded-lg p-8 shadow-lg">
			{#if !data.valid}
				<div class="text-center">
					<div class="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-4 mb-6">
						<p class="font-medium">Invalid or Expired Link</p>
						<p class="text-sm mt-1">This password reset link is no longer valid.</p>
					</div>
					<a
						href="/forgot-password"
						class="text-[var(--color-primary)] hover:underline"
					>
						Request a new reset link
					</a>
				</div>
			{:else}
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
						<label for="password" class="block text-sm font-medium text-[var(--color-text)] mb-2">
							New Password
						</label>
						<input
							type="password"
							id="password"
							name="password"
							required
							minlength="8"
							class="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
							placeholder="••••••••"
						/>
						<p class="text-xs text-[var(--color-text-muted)] mt-1">At least 8 characters</p>
					</div>

					<div class="mb-6">
						<label for="confirmPassword" class="block text-sm font-medium text-[var(--color-text)] mb-2">
							Confirm Password
						</label>
						<input
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							required
							class="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
							placeholder="••••••••"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="w-full py-2 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Resetting...' : 'Reset Password'}
					</button>
				</form>
			{/if}
		</div>
	</div>
</div>
