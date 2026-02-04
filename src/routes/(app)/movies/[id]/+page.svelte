<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
	let commentContent = $state('');
	let submitting = $state(false);

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{data.movie.title} - Movie Night</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<a
		href="/movies"
		class="text-[var(--color-primary)] hover:underline text-sm inline-flex items-center gap-1"
	>
		<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
		</svg>
		Back to Movies
	</a>

	<!-- Movie Details -->
	<div class="bg-[var(--color-surface)] rounded-lg overflow-hidden">
		<div class="md:flex">
			{#if data.movie.metadataSnapshot?.posterPath}
				<div class="md:w-1/3">
					<img
						src="{TMDB_IMAGE_BASE}{data.movie.metadataSnapshot.posterPath}"
						alt={data.movie.title}
						class="w-full"
					/>
				</div>
			{/if}
			<div class="p-6 md:flex-1">
				<h1 class="text-2xl font-bold text-[var(--color-text)]">{data.movie.title}</h1>

				<div class="flex flex-wrap items-center gap-3 mt-2 text-sm">
					{#if data.movie.metadataSnapshot?.releaseDate}
						<span class="text-[var(--color-text-muted)]">
							{data.movie.metadataSnapshot.releaseDate.slice(0, 4)}
						</span>
					{/if}
					{#if data.movie.metadataSnapshot?.voteAverage}
						<span
							class="inline-flex items-center gap-1 text-[var(--color-warning)] bg-[var(--color-warning)]/10 px-2 py-0.5 rounded"
						>
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path
									d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
								/>
							</svg>
							{data.movie.metadataSnapshot.voteAverage.toFixed(1)}
						</span>
					{/if}
				</div>

				{#if data.movie.metadataSnapshot?.genres && data.movie.metadataSnapshot.genres.length > 0}
					<div class="flex flex-wrap gap-2 mt-3">
						{#each data.movie.metadataSnapshot.genres as genre}
							<span
								class="text-xs px-2 py-1 rounded bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]"
							>
								{genre}
							</span>
						{/each}
					</div>
				{/if}

				{#if data.movie.metadataSnapshot?.overview}
					<p class="text-[var(--color-text-muted)] mt-4">{data.movie.metadataSnapshot.overview}</p>
				{/if}

				<div class="mt-6 pt-4 border-t border-[var(--color-border)]">
					<p class="text-sm text-[var(--color-text-muted)]">
						Suggested by <span class="text-[var(--color-text)]">{data.suggestedByName}</span>
						on {formatDate(data.movie.createdAt)}
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Comments Section -->
	<div class="bg-[var(--color-surface)] rounded-lg p-6">
		<h2 class="text-lg font-semibold text-[var(--color-text)] mb-4">
			Comments ({data.comments.length})
		</h2>

		<!-- Comment Form -->
		<form
			method="POST"
			action="?/comment"
			use:enhance={() => {
				submitting = true;
				return async ({ result, update }) => {
					submitting = false;
					if (result.type === 'success') {
						commentContent = '';
					}
					await update();
				};
			}}
			class="mb-6"
		>
			{#if form?.error}
				<div class="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3 mb-3">
					{form.error}
				</div>
			{/if}
			<textarea
				name="content"
				bind:value={commentContent}
				placeholder="Share your thoughts about this movie..."
				rows="3"
				maxlength="1000"
				class="w-full px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
			></textarea>
			<div class="flex items-center justify-between mt-2">
				<span class="text-xs text-[var(--color-text-muted)]">{commentContent.length}/1000</span>
				<button
					type="submit"
					disabled={submitting || !commentContent.trim()}
					class="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
				>
					{submitting ? 'Posting...' : 'Post Comment'}
				</button>
			</div>
		</form>

		<!-- Comments List -->
		{#if data.comments.length > 0}
			<div class="space-y-4">
				{#each data.comments as comment}
					<div class="p-4 bg-[var(--color-surface-elevated)] rounded-lg">
						<div class="flex items-center justify-between mb-2">
							<span class="font-medium text-[var(--color-text)]">{comment.userName}</span>
							<span class="text-xs text-[var(--color-text-muted)]">
								{formatDate(comment.createdAt)}
							</span>
						</div>
						<p class="text-[var(--color-text-muted)] whitespace-pre-wrap">{comment.content}</p>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-center text-[var(--color-text-muted)] py-8">
				No comments yet. Be the first to share your thoughts!
			</p>
		{/if}
	</div>

	<!-- TMDb Attribution -->
	<p class="text-center text-xs text-[var(--color-text-muted)]">
		Movie data provided by
		<a
			href="https://www.themoviedb.org/movie/{data.movie.tmdbId}"
			target="_blank"
			rel="noopener noreferrer"
			class="text-[var(--color-primary)] hover:underline"
		>
			TMDb
		</a>
	</p>
</div>
