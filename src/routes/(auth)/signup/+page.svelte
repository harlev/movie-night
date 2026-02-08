<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let loading = $state(false);
	let showPassword = $state(false);
</script>

<svelte:head>
	<title>Sign Up - Movie Night</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-[var(--color-text)]">Movie Night</h1>
			<p class="text-[var(--color-text-muted)] mt-2">Create your account</p>
		</div>

		<div class="bg-[var(--color-surface)] rounded-lg p-8 shadow-lg">
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
					<label for="inviteCode" class="block text-sm font-medium text-[var(--color-text)] mb-2">
						Invite Code
					</label>
					<input
						type="text"
						id="inviteCode"
						name="inviteCode"
						value={form?.inviteCode || data.inviteCode || ''}
						required
						class="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors uppercase"
						placeholder="ABCD1234"
					/>
				</div>

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
						placeholder="John Doe"
					/>
				</div>

				<div class="mb-4">
					<label for="password" class="block text-sm font-medium text-[var(--color-text)] mb-2">
						Password
					</label>
					<input
						type={showPassword ? 'text' : 'password'}
						id="password"
						name="password"
						required
						minlength="8"
						class="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
						placeholder="••••••••"
					/>
					<p class="text-xs text-[var(--color-text-muted)] mt-1">At least 8 characters</p>
				</div>

				<div class="mb-4">
					<label
						for="confirmPassword"
						class="block text-sm font-medium text-[var(--color-text)] mb-2"
					>
						Confirm Password
					</label>
					<input
						type={showPassword ? 'text' : 'password'}
						id="confirmPassword"
						name="confirmPassword"
						required
						class="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
						placeholder="••••••••"
					/>
				</div>

				<div class="mb-6">
					<label class="flex items-center cursor-pointer">
						<input
							type="checkbox"
							bind:checked={showPassword}
							class="mr-2 accent-[var(--color-primary)]"
						/>
						<span class="text-sm text-[var(--color-text-muted)]">Show passwords</span>
					</label>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full py-2 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? 'Creating account...' : 'Create Account'}
				</button>
			</form>

			<div class="mt-6 text-center text-[var(--color-text-muted)] text-sm">
				Already have an account?
				<a href="/login" class="text-[var(--color-primary)] hover:underline">Sign in</a>
			</div>
		</div>
	</div>
</div>
