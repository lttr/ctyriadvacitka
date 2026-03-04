<template>
  <div class="p-layout-wrapper">
    <header class="p-page-layout">
      <div class="p-content">
        <NuxtLink to="/">
          <strong>Čtyřiadvacítka</strong>
        </NuxtLink>
      </div>
    </header>
    <div class="p-page-layout">
      <div class="p-content p-with-sidebar">
        <main>
          <slot></slot>
        </main>
        <aside>
          <SidebarNav />
          <SidebarNews />
        </aside>
      </div>
    </div>
    <footer class="p-page-layout">
      <div class="p-content p-secondary-text-regular">
        24. oddíl Hradec Králové
      </div>
    </footer>
  </div>
</template>
