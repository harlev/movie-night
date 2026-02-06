<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

	let { data, children } = $props();

	const navItems = [
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/movies', label: 'Movies' },
		{ href: '/history', label: 'History' }
	];

	let mobileMenuOpen = $state(false);
</script>

<div class="min-h-screen bg-[var(--color-background)]">
	<!-- Navigation -->
	<nav class="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex">
					<div class="flex-shrink-0 flex items-center">
						<a href="/dashboard">
							<img src="/logo.png" alt="Movie Night" class="h-14" />
						</a>
					</div>
					<div class="hidden sm:ml-8 sm:flex sm:space-x-4">
						{#each navItems as item}
							<a
								href={item.href}
								class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
									{$page.url.pathname.startsWith(item.href)
									? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10'
									: 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]'}"
							>
								{item.label}
							</a>
						{/each}
						{#if data.user.role === 'admin'}
							<a
								href="/admin"
								class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
									{$page.url.pathname.startsWith('/admin')
									? 'text-[var(--color-warning)] bg-[var(--color-warning)]/10'
									: 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]'}"
							>
								Admin
							</a>
						{/if}
					</div>
				</div>

				<div class="hidden sm:flex sm:items-center sm:space-x-4">
					<span class="text-[var(--color-text-muted)] text-sm">{data.user.displayName}</span>
					<form method="POST" action="/logout" use:enhance>
						<button
							type="submit"
							class="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
						>
							Logout
						</button>
					</form>
				</div>

				<!-- Mobile menu button -->
				<div class="flex items-center sm:hidden">
					<button
						type="button"
						onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
						class="inline-flex items-center justify-center p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]"
					>
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							{#if mobileMenuOpen}
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							{:else}
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 6h16M4 12h16M4 18h16"
								/>
							{/if}
						</svg>
					</button>
				</div>
			</div>
		</div>

		<!-- Mobile menu -->
		{#if mobileMenuOpen}
			<div class="sm:hidden border-t border-[var(--color-border)]">
				<div class="px-2 pt-2 pb-3 space-y-1">
					{#each navItems as item}
						<a
							href={item.href}
							onclick={() => (mobileMenuOpen = false)}
							class="block px-3 py-2 rounded-lg text-base font-medium transition-colors
								{$page.url.pathname.startsWith(item.href)
								? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10'
								: 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]'}"
						>
							{item.label}
						</a>
					{/each}
					{#if data.user.role === 'admin'}
						<a
							href="/admin"
							onclick={() => (mobileMenuOpen = false)}
							class="block px-3 py-2 rounded-lg text-base font-medium transition-colors
								{$page.url.pathname.startsWith('/admin')
								? 'text-[var(--color-warning)] bg-[var(--color-warning)]/10'
								: 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]'}"
						>
							Admin
						</a>
					{/if}
				</div>
				<div class="pt-4 pb-3 border-t border-[var(--color-border)]">
					<div class="px-4">
						<p class="text-sm font-medium text-[var(--color-text)]">{data.user.displayName}</p>
						<p class="text-xs text-[var(--color-text-muted)]">{data.user.email}</p>
					</div>
					<div class="mt-3 px-2">
						<form method="POST" action="/logout" use:enhance>
							<button
								type="submit"
								class="block w-full text-left px-3 py-2 rounded-lg text-base font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]"
							>
								Logout
							</button>
						</form>
					</div>
				</div>
			</div>
		{/if}
	</nav>

	<!-- Main content -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{@render children()}
	</main>

	<footer class="text-center text-[10px] text-[var(--color-text-muted)] opacity-40 pb-2">
		build {__BUILD_TIME__}
	</footer>
</div>
