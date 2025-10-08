import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ImportView from '../views/ImportView.vue' // Import the new view
import SocioDetail from '../views/SocioDetail.vue' // Import SocioDetail component
import { isDatabaseEmpty } from '@/services/db' // Import our utility function

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/import', // Define the route for the import page
      name: 'import',
      component: ImportView,
    },
    {
      path: '/socio/:id', // Add new route for socio detail
      name: 'socio-detail',
      component: SocioDetail,
    },
    // ... other routes like AboutView can be removed for now
  ],
})

// Navigation Guard: This is the magic part.
// Before every navigation, we check if the database is empty.
router.beforeEach(async (to, from, next) => {
  const dbEmpty = await isDatabaseEmpty()

  if (dbEmpty && to.name !== 'import') {
    // If DB is empty and user is not going to the import page,
    // redirect them to the import page.
    next({ name: 'import' })
  } else if (!dbEmpty && to.name === 'import') {
    // If DB is NOT empty and user tries to go to import page,
    // redirect them to the home page.
    next({ name: 'home' })
  } else {
    // Otherwise, allow navigation.
    next()
  }
})

export default router
