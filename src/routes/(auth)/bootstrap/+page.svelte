<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Bootstrap Admin - Movie Night</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-[var(--color-text)]">Movie Night</h1>
			<p class="text-[var(--color-text-muted)] mt-2">Create the first admin account</p>
		</div>

		<div class="bg-[var(--color-surface)] rounded-lg p-8 shadow-lg">
			{#if !data.canBootstrap}
				<div class="text-center">
					<p class="text-[var(--color-text-muted)]">
						Bootstrap is no longer available. An admin user already exists.
					</p>
					<a href="/login" class="text-[var(--color-primary)] hover:underline mt-4 inline-block">
						Go to Login
					</a>
				</div>
			{:else}
				<div class="bg-[var(--color-warning)]/10 border border-[var(--color-warning)] text-[var(--color-warning)] rounded-lg p-3 mb-6">
					<p class="text-sm">
						This page allows you to create the first admin account. It will only work once - when there are no users in the database.
					</p>
				</div>

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
							placeholder="admin@example.com"
						/>
					</div>

					<div class="mb-4">
						<label for="displayName" class="block text-sm font-medium text-[var(--color-text)] mb-2">
							Display Name
						</label>
						<input
							type="text"
							id="displayName"
							name="displayName"
							value={form?.displayName || ''}
							required
							class="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
							placeholder="Admin"
						/>
					</div>

					<div class="mb-6">
						<label for="password" class="block text-sm font-medium text-[var(--color-text)] mb-2">
							Password
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

					<button
						type="submit"
						disabled={loading}
						class="w-full py-2 px-4 bg-[var(--color-warning)] hover:bg-[var(--color-warning)]/80 text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Creating Admin...' : 'Create Admin Account'}
					</button>
				</form>
			{/if}
		</div>
	</div>
</div>
