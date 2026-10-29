<script>
  import { onMount } from 'svelte';
  import { theme } from '$lib/stores.js';
  import { initLocalStorageFallback } from '$lib/firebaseService.js';

  let { children } = $props();

  onMount(() => {
    theme.init();
    initLocalStorageFallback();
  });
</script>

<svelte:head>
  <link rel="icon" href="/uploads/logo.png" />
</svelte:head>

{@render children()}
