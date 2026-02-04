<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let submitting = $state(false);

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}
</script>

<svelte:head>
	<title>Generate Invite - Admin</title>
</svelte:head>

<div class="max-w-md space-y-6">
	<div>
		<a
			href="/admin/invites"
			class="text-[var(--color-primary)] hover:underline text-sm inline-flex items-center gap-1"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Back to Invites
		</a>
		<h1 class="text-2xl font-bold text-[var(--color-text)] mt-2">Generate Invite</h1>
	</div>

	{#if form?.success && form.invite}
		<div class="bg-[var(--color-surface)] rounded-lg p-6">
			<div
				class="bg-[var(--color-success)]/10 border border-[var(--color-success)] rounded-lg p-4 mb-4"
			>
				<p class="text-[var(--color-success)] font-medium">Invite created successfully!</p>
			</div>

			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-[var(--color-text)] mb-2"> Invite Code </label>
					<div class="flex gap-2">
						<code
							class="flex-1 px-4 py-2 bg-[var(--color-surface-elevated)] rounded-lg text-lg font-mono text-[var(--color-text)] text-center"
						>
							{form.invite.code}
						</code>
						<button
							type="button"
							onclick={() => copyToClipboard(form.invite.code)}
							class="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors"
						>
							Copy
						</button>
					</div>
				</div>

				<div>
					<label class="block text-sm font-medium text-[var(--color-text)] mb-2">
						Sign-up Link
					</label>
					<div class="flex gap-2">
						<input
							type="text"
							readonly
							value="{typeof window !== 'undefined'
								? window.location.origin
								: ''}/signup?code={form.invite.code}"
							class="flex-1 px-4 py-2 bg-[var(--color-surface-elevated)] rounded-lg text-sm text-[var(--color-text)]"
						/>
						<button
							type="button"
							onclick={() =>
								copyToClipboard(
									`${typeof window !== 'undefined' ? window.location.origin : ''}/signup?code=${form.invite.code}`
								)}
							class="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors"
						>
							Copy
						</button>
					</div>
				</div>

				<p class="text-sm text-[var(--color-text-muted)]">
					Expires: {new Date(form.invite.expiresAt).toLocaleDateString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric',
						hour: '2-digit',
						minute: '2-digit'
					})}
				</p>
			</div>

			<div class="mt-6 flex gap-3">
				<a
					href="/admin/invites"
					class="px-4 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
				>
					Back to Invites
				</a>
				<a
					href="/admin/invites/new"
					class="px-4 py-2 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] text-[var(--color-text)] text-sm font-medium rounded-lg transition-colors"
				>
					Generate Another
				</a>
			</div>
		</div>
	{:else}
		<div class="bg-[var(--color-surface)] rounded-lg p-6">
			{#if form?.error}
				<div class="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 mb-6">
					{form.error}
				</div>
			{/if}

			<form
				method="POST"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						submitting = false;
						await update();
					};
				}}
			>
				<div class="mb-6">
					<label
						for="expiresInDays"
						class="block text-sm font-medium text-[var(--color-text)] mb-2"
					>
						Expires In
					</label>
					<select
						id="expiresInDays"
						name="expiresInDays"
						class="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]"
					>
						<option value="1">1 day</option>
						<option value="3">3 days</option>
						<option value="7" selected>7 days</option>
						<option value="14">14 days</option>
						<option value="30">30 days</option>
					</select>
				</div>

				<button
					type="submit"
					disabled={submitting}
					class="w-full py-2 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
				>
					{submitting ? 'Generating...' : 'Generate Invite Code'}
				</button>
			</form>
		</div>
	{/if}
</div>
