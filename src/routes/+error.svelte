<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>Error - Movie Night</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
	<div class="text-center">
		<h1 class="text-6xl font-bold text-[var(--color-error)]">{$page.status}</h1>
		<p class="text-xl text-[var(--color-text)] mt-4">
			{$page.error?.message || 'Something went wrong'}
		</p>
		<div class="mt-8 flex justify-center gap-4">
			<a
				href="/"
				class="px-6 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors"
			>
				Go Home
			</a>
			<button
				onclick={() => history.back()}
				class="px-6 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] text-[var(--color-text)] font-medium rounded-lg transition-colors"
			>
				Go Back
			</button>
		</div>
	</div>
</div>
