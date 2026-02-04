<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

	let { data, children } = $props();

	const adminNavItems = [
		{ href: '/admin', label: 'Overview', exact: true },
		{ href: '/admin/surveys', label: 'Surveys' },
		{ href: '/admin/users', label: 'Users' },
		{ href: '/admin/invites', label: 'Invites' },
		{ href: '/admin/logs', label: 'Logs' }
	];

	function isActive(item: { href: string; exact?: boolean }) {
		if (item.exact) {
			return $page.url.pathname === item.href;
		}
		return $page.url.pathname.startsWith(item.href);
	}
</script>

<div class="min-h-screen bg-[var(--color-background)]">
	<!-- Navigation -->
	<nav class="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex items-center">
					<a href="/dashboard" class="text-xl font-bold text-[var(--color-text)]"> Movie Night </a>
					<span
						class="ml-3 px-2 py-1 text-xs font-medium bg-[var(--color-warning)]/10 text-[var(--color-warning)] rounded"
					>
						Admin
					</span>
				</div>

				<div class="flex items-center space-x-4">
					<a
						href="/dashboard"
						class="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
					>
						Back to App
					</a>
					<span class="text-[var(--color-text-muted)] text-sm">{data.user.displayName}</span>
					<form method="POST" action="/logout" use:enhance>
						<button
							type="submit"
							class="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
						>
							Logout
						</button>
					</form>
				</div>
			</div>
		</div>
	</nav>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<div class="flex flex-col md:flex-row gap-8">
			<!-- Sidebar -->
			<aside class="w-full md:w-48 flex-shrink-0">
				<nav class="space-y-1">
					{#each adminNavItems as item}
						<a
							href={item.href}
							class="block px-3 py-2 rounded-lg text-sm font-medium transition-colors
								{isActive(item)
								? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
								: 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]'}"
						>
							{item.label}
						</a>
					{/each}
				</nav>
			</aside>

			<!-- Main content -->
			<main class="flex-1 min-w-0">
				{@render children()}
			</main>
		</div>
	</div>
</div>
