<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Create Survey - Admin</title>
</svelte:head>

<div class="max-w-2xl space-y-6">
	<div>
		<a
			href="/admin/surveys"
			class="text-[var(--color-primary)] hover:underline text-sm inline-flex items-center gap-1"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Back to Surveys
		</a>
		<h1 class="text-2xl font-bold text-[var(--color-text)] mt-2">Create Survey</h1>
	</div>

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
			<div class="space-y-4">
				<div>
					<label for="title" class="block text-sm font-medium text-[var(--color-text)] mb-2">
						Title
					</label>
					<input
						type="text"
						id="title"
						name="title"
						value={form?.title || ''}
						required
						maxlength="100"
						class="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
						placeholder="e.g., Movie Night - Week 1"
					/>
				</div>

				<div>
					<label for="description" class="block text-sm font-medium text-[var(--color-text)] mb-2">
						Description (optional)
					</label>
					<textarea
						id="description"
						name="description"
						value={form?.description || ''}
						rows="3"
						class="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
						placeholder="Add any notes or context for this survey..."
					></textarea>
				</div>

				<div>
					<label for="maxRankN" class="block text-sm font-medium text-[var(--color-text)] mb-2">
						Maximum Ranking Positions
					</label>
					<select
						id="maxRankN"
						name="maxRankN"
						class="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
					>
						{#each [3, 5, 7, 10] as n}
							<option value={n} selected={form?.maxRankN === String(n) || n === 3}>
								Top {n} movies
							</option>
						{/each}
					</select>
					<p class="text-xs text-[var(--color-text-muted)] mt-1">
						Users will rank their top N choices. Rank 1 gets N points, rank 2 gets N-1 points, etc.
					</p>
				</div>
			</div>

			<div class="mt-6 flex justify-end gap-3">
				<a
					href="/admin/surveys"
					class="px-4 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
				>
					Cancel
				</a>
				<button
					type="submit"
					disabled={submitting}
					class="px-6 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
				>
					{submitting ? 'Creating...' : 'Create Survey'}
				</button>
			</div>
		</form>
	</div>
</div>
