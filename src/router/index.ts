import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import { useAuthStore } from '@/stores/authStore'
import * as memberService from '@/services/memberService'

declare module 'vue-router' {
  interface RouteMeta {
    /** 需要登入才能進入 */
    requiresAuth?: boolean
    /** 需要是該旅行成員（路由需有 tripId） */
    requiresTripMember?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
        },
        {
          path: 'login',
          name: 'login',
          component: () => import('@/views/LoginView.vue'),
        },
        {
          path: 'profile',
          name: 'profile',
          meta: { requiresAuth: true },
          component: () => import('@/views/ProfileView.vue'),
        },
        {
          path: 'access-denied',
          name: 'access-denied',
          meta: { requiresAuth: true },
          component: () => import('@/views/AccessDeniedView.vue'),
        },
        {
          path: 'trips',
          name: 'trips',
          meta: { requiresAuth: true },
          component: () => import('@/views/TripListView.vue'),
        },
        {
          path: 'trips/new',
          name: 'trip-create',
          meta: { requiresAuth: true },
          component: () => import('@/views/TripCreateView.vue'),
        },
        {
          path: 'trips/:tripId',
          meta: { requiresAuth: true, requiresTripMember: true },
          component: () => import('@/views/TripLayoutView.vue'),
          children: [
            {
              path: '',
              name: 'trip-overview',
              component: () => import('@/views/TripOverviewView.vue'),
            },
            {
              path: 'itinerary',
              name: 'trip-itinerary',
              component: () => import('@/views/ItineraryView.vue'),
            },
            {
              path: 'restaurants',
              name: 'trip-restaurants',
              component: () => import('@/views/RestaurantsView.vue'),
            },
            {
              path: 'polls',
              name: 'trip-polls',
              component: () => import('@/views/PollsView.vue'),
            },
            {
              path: 'checklist',
              name: 'trip-checklist',
              component: () => import('@/views/ChecklistView.vue'),
            },
            {
              path: 'members',
              name: 'trip-members',
              component: () => import('@/views/MembersView.vue'),
            },
          ],
        },
        {
          path: ':pathMatch(.*)*',
          name: 'not-found',
          component: () => import('@/views/NotFoundView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.isInitialized) {
    await authStore.initialize()
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  // 已登入者進入登入頁時，導向原本目標或旅行列表
  if (to.name === 'login' && authStore.isAuthenticated) {
    const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/trips'
    return redirect
  }

  const requiresTripMember = to.matched.some((record) => record.meta.requiresTripMember)
  const tripId = typeof to.params.tripId === 'string' ? to.params.tripId : null

  if (requiresTripMember && tripId && authStore.isAuthenticated) {
    try {
      const role = await memberService.getMyTripRole(tripId)
      if (!role) {
        return {
          name: 'access-denied',
          query: { tripId },
        }
      }
    } catch {
      return {
        name: 'access-denied',
        query: { tripId },
      }
    }
  }
})

export default router
