<template>
  <div class="statistiche">
    <PageHeader title="Statistiche" subtitle="Andamento del tesseramento negli anni" />
    <DashboardCharts />
  </div>
</template>

<script setup>
import PageHeader from '@/components/base/PageHeader.vue'
import DashboardCharts from '@/components/DashboardCharts.vue'
</script>

<style scoped>
.statistiche {
  max-width: var(--page-width);
  margin: 0 auto;
  padding: var(--space-32);
}
</style>
