<script lang="ts">
	let { data } = $props();

	const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200';

	let searchQuery = $state('');
	let sortBy = $state<'newest' | 'title' | 'rating'>('newest');

	const filteredMovies = $derived(() => {
		let result = [...data.movies];

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter((m) => m.title.toLowerCase().includes(query));
		}

		switch (sortBy) {
			case 'title':
				result.sort((a, b) => a.title.localeCompare(b.title));
				break;
			case 'rating':
				result.sort(
					(a, b) => (b.metadataSnapshot?.voteAverage || 0) - (a.metadataSnapshot?.voteAverage || 0)
				);
				break;
			case 'newest':
			default:
				// Already sorted by newest from server
				break;
		}

		return result;
	});
</script>

<svelte:head>
	<title>Movies - Movie Night</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-[var(--color-text)]">Movies</h1>
			<p class="text-[var(--color-text-muted)] mt-1">{data.movies.length} movies suggested</p>
		</div>
		<a
			href="/movies/suggest"
			class="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-colors"
		>
			Suggest Movie
		</a>
	</div>

	<!-- Filters -->
	<div class="flex flex-col sm:flex-row gap-4">
		<div class="flex-1">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search movies..."
				class="w-full px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
			/>
		</div>
		<select
			bind:value={sortBy}
			class="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
		>
			<option value="newest">Newest First</option>
			<option value="title">Alphabetical</option>
			<option value="rating">Highest Rated</option>
		</select>
	</div>

	<!-- Movie Grid -->
	{#if filteredMovies().length > 0}
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
			{#each filteredMovies() as movie}
				<a
					href="/movies/{movie.id}"
					class="bg-[var(--color-surface)] rounded-lg overflow-hidden hover:ring-2 hover:ring-[var(--color-primary)] transition-all group"
				>
					{#if movie.metadataSnapshot?.posterPath}
						<img
							src="{TMDB_IMAGE_BASE}{movie.metadataSnapshot.posterPath}"
							alt={movie.title}
							class="w-full aspect-[2/3] object-cover"
							loading="lazy"
						/>
					{:else}
						<div
							class="w-full aspect-[2/3] bg-[var(--color-surface-elevated)] flex items-center justify-center"
						>
							<span class="text-[var(--color-text-muted)] text-4xl">?</span>
						</div>
					{/if}
					<div class="p-3">
						<p
							class="font-medium text-[var(--color-text)] truncate group-hover:text-[var(--color-primary)] transition-colors"
						>
							{movie.title}
						</p>
						<div class="flex items-center justify-between mt-1">
							{#if movie.metadataSnapshot?.releaseDate}
								<p class="text-xs text-[var(--color-text-muted)]">
									{movie.metadataSnapshot.releaseDate.slice(0, 4)}
								</p>
							{:else}
								<span></span>
							{/if}
							{#if movie.metadataSnapshot?.voteAverage}
								<p class="text-xs text-[var(--color-warning)]">
									{movie.metadataSnapshot.voteAverage.toFixed(1)}
								</p>
							{/if}
						</div>
						<p class="text-xs text-[var(--color-text-muted)] mt-1 truncate">
							by {movie.suggestedByName}
						</p>
					</div>
				</a>
			{/each}
		</div>
	{:else if searchQuery}
		<div class="bg-[var(--color-surface)] rounded-lg p-8 text-center">
			<p class="text-[var(--color-text-muted)]">No movies match your search.</p>
		</div>
	{:else}
		<div class="bg-[var(--color-surface)] rounded-lg p-8 text-center">
			<p class="text-[var(--color-text-muted)]">No movies suggested yet.</p>
			<a href="/movies/suggest" class="text-[var(--color-primary)] hover:underline">
				Be the first to suggest a movie!
			</a>
		</div>
	{/if}
</div>
