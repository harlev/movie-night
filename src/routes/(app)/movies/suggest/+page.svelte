<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();

	let searchQuery = $state(form?.query || '');
	let searching = $state(false);
	let suggesting = $state(false);
	let selectedMovie = $state<{
		id: number;
		title: string;
		poster_path: string | null;
		release_date: string | null;
		overview: string | null;
	} | null>(null);

	const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200';
</script>

<svelte:head>
	<title>Suggest a Movie - Movie Night</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<div>
		<a
			href="/movies"
			class="text-[var(--color-primary)] hover:underline text-sm inline-flex items-center gap-1"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Back to Movies
		</a>
		<h1 class="text-2xl font-bold text-[var(--color-text)] mt-2">Suggest a Movie</h1>
		<p class="text-[var(--color-text-muted)] mt-1">Search for a movie to add to the collection</p>
	</div>

	{#if form?.error}
		<div class="bg-red-500/10 border border-red-500 text-red-400 rounded-lg p-3">
			{form.error}
		</div>
	{/if}

	<!-- Search Form -->
	<div class="bg-[var(--color-surface)] rounded-lg p-6">
		<form
			method="POST"
			action="?/search"
			use:enhance={() => {
				searching = true;
				selectedMovie = null;
				return async ({ update }) => {
					searching = false;
					await update();
				};
			}}
		>
			<div class="flex gap-3">
				<input
					type="text"
					name="query"
					bind:value={searchQuery}
					placeholder="Search movies on TMDb..."
					class="flex-1 px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
					required
					minlength="2"
				/>
				<button
					type="submit"
					disabled={searching || searchQuery.length < 2}
					class="px-6 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
				>
					{searching ? 'Searching...' : 'Search'}
				</button>
			</div>
		</form>
	</div>

	<!-- Search Results -->
	{#if form?.searchResults && form.searchResults.length > 0}
		<div class="bg-[var(--color-surface)] rounded-lg p-6">
			<h2 class="text-lg font-semibold text-[var(--color-text)] mb-4">Search Results</h2>
			<div class="space-y-3 max-h-96 overflow-y-auto">
				{#each form.searchResults as movie}
					<button
						type="button"
						onclick={() => (selectedMovie = movie)}
						class="w-full flex items-start gap-4 p-3 rounded-lg transition-colors text-left
							{selectedMovie?.id === movie.id
							? 'bg-[var(--color-primary)]/20 ring-2 ring-[var(--color-primary)]'
							: 'bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-elevated)]/80'}"
					>
						{#if movie.poster_path}
							<img
								src="{TMDB_IMAGE_BASE}{movie.poster_path}"
								alt={movie.title}
								class="w-16 h-24 object-cover rounded"
							/>
						{:else}
							<div
								class="w-16 h-24 bg-[var(--color-border)] rounded flex items-center justify-center"
							>
								<span class="text-[var(--color-text-muted)]">?</span>
							</div>
						{/if}
						<div class="flex-1 min-w-0">
							<p class="font-medium text-[var(--color-text)]">{movie.title}</p>
							{#if movie.release_date}
								<p class="text-sm text-[var(--color-text-muted)]">
									{movie.release_date.slice(0, 4)}
								</p>
							{/if}
							{#if movie.overview}
								<p class="text-sm text-[var(--color-text-muted)] mt-1 line-clamp-2">
									{movie.overview}
								</p>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		</div>
	{:else if form?.searchResults && form.searchResults.length === 0}
		<div class="bg-[var(--color-surface)] rounded-lg p-6 text-center">
			<p class="text-[var(--color-text-muted)]">No movies found for "{form.query}"</p>
		</div>
	{/if}

	<!-- Selected Movie Confirmation -->
	{#if selectedMovie}
		<div class="bg-[var(--color-surface)] rounded-lg p-6">
			<h2 class="text-lg font-semibold text-[var(--color-text)] mb-4">Confirm Selection</h2>
			<div class="flex gap-6">
				{#if selectedMovie.poster_path}
					<img
						src="{TMDB_IMAGE_BASE}{selectedMovie.poster_path}"
						alt={selectedMovie.title}
						class="w-32 h-48 object-cover rounded-lg"
					/>
				{:else}
					<div
						class="w-32 h-48 bg-[var(--color-surface-elevated)] rounded-lg flex items-center justify-center"
					>
						<span class="text-[var(--color-text-muted)] text-4xl">?</span>
					</div>
				{/if}
				<div class="flex-1">
					<h3 class="text-xl font-semibold text-[var(--color-text)]">{selectedMovie.title}</h3>
					{#if selectedMovie.release_date}
						<p class="text-[var(--color-text-muted)]">{selectedMovie.release_date.slice(0, 4)}</p>
					{/if}
					{#if selectedMovie.overview}
						<p class="text-[var(--color-text-muted)] mt-2 text-sm">{selectedMovie.overview}</p>
					{/if}
					<form
						method="POST"
						action="?/suggest"
						class="mt-4"
						use:enhance={() => {
							suggesting = true;
							return async ({ update }) => {
								suggesting = false;
								await update();
							};
						}}
					>
						<input type="hidden" name="tmdbId" value={selectedMovie.id} />
						<button
							type="submit"
							disabled={suggesting}
							class="px-6 py-2 bg-[var(--color-success)] hover:bg-[var(--color-success)]/80 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
						>
							{suggesting ? 'Adding...' : 'Add This Movie'}
						</button>
					</form>
				</div>
			</div>
		</div>
	{/if}

	<!-- TMDb Attribution -->
	<p class="text-center text-xs text-[var(--color-text-muted)]">
		Movie data provided by
		<a
			href="https://www.themoviedb.org"
			target="_blank"
			rel="noopener noreferrer"
			class="text-[var(--color-primary)] hover:underline"
		>
			TMDb
		</a>
	</p>
</div>
