import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ImportView from '../views/ImportView.vue'
import SocioDetailView from '../views/SocioDetailView.vue'
import AddSocioView from '../views/AddSocioView.vue'
import BatchEntryView from '../views/BatchEntryView.vue'
import ReportsView from '../views/ReportsView.vue'
import SettingsView from '../views/SettingsView.vue'
import { isDatabaseEmpty } from '@/services/db'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Cerca Socio - Ceraiolo Digitale',
      },
    },
    {
      path: '/import',
      name: 'import',
      component: ImportView,
      meta: {
        title: 'Importa Database - Ceraiolo Digitale',
      },
    },
    {
      path: '/socio/:id',
      name: 'socio-detail',
      component: SocioDetailView,
      meta: {
        title: 'Dettagli Socio - Ceraiolo Digitale',
      },
    },
    {
      path: '/socio/nuovo',
      name: 'add-socio',
      component: AddSocioView,
      meta: {
        title: 'Nuovo Socio - Ceraiolo Digitale',
      },
    },
    {
      path: '/incassi',
      redirect: '/incassi/ricevute',
    },
    {
      path: '/incassi/ricevute',
      name: 'batch-entry',
      component: BatchEntryView,
      meta: {
        title: 'Registra ricevute - Ceraiolo Digitale',
      },
    },
    {
      path: '/incassi/blocchetti',
      name: 'blocchetti',
      component: () => import('../views/BlocchettiView.vue'),
      meta: {
        title: 'Blocchetti - Ceraiolo Digitale',
      },
    },
    {
      path: '/incassi/pagamenti',
      name: 'pagamenti',
      component: () => import('../views/PagamentiView.vue'),
      meta: {
        title: 'Pagamenti - Ceraiolo Digitale',
      },
    },
    {
      path: '/report-pdf',
      name: 'reports',
      component: ReportsView,
      meta: {
        title: 'Report PDF - Ceraiolo Digitale',
      },
    },
    {
      path: '/report-pdf/su-misura',
      name: 'reports-beta',
      component: () => import('../views/ReportsBetaView.vue'),
      meta: {
        title: 'Report su misura - Ceraiolo Digitale',
      },
    },
    {
      path: '/statistiche',
      name: 'statistiche',
      component: () => import('../views/StatisticheView.vue'),
      meta: {
        title: 'Statistiche - Ceraiolo Digitale',
      },
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: {
        title: 'Impostazioni - Ceraiolo Digitale',
      },
    },
    // Indirizzi di prima del menu a cinque sezioni: restano validi
    { path: '/registrazione-seriale', redirect: '/incassi/ricevute' },
    { path: '/blocchetti', redirect: '/incassi/blocchetti' },
    { path: '/reports', redirect: '/report-pdf' },
    { path: '/reports-beta', redirect: '/report-pdf/su-misura' },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: '/',
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  document.title = to.meta.title || 'Ceraiolo Digitale'

  try {
    const dbEmpty = await isDatabaseEmpty()

    if (dbEmpty && to.name !== 'import') {
      console.log('Database vuoto, reindirizzo a /import')
      next({ name: 'import' })
      return
    }

    if (!dbEmpty && to.name === 'import') {
      console.log('Database già popolato, reindirizzo alla home')
      next({ name: 'home' })
      return
    }

    next()
  } catch (error) {
    console.error('Errore nel navigation guard:', error)
    next()
  }
})

router.afterEach((to, from) => {
  window.scrollTo(0, 0)
  console.log(`Navigazione: ${from.name} -> ${to.name}`)
})

export default router
