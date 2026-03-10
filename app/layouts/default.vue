<template>
  <div class="p-layout-wrapper">
    <header class="p-page-layout">
      <div class="p-content">
        <AppNavbar />
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
          <SidebarLogin />
        </aside>
      </div>
    </div>
    <div class="p-page-layout">
      <div class="p-content">
        <AppFooter />
      </div>
    </div>
  </div>
</template>
