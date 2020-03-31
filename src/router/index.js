import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const router = new VueRouter({
	mode: 'history', //hash
	
	routes: [
		{
			path: '/',
			name: 'Record',
			component: () => import('@/components/Record')
		}
	]
})


// router.beforeEach((to, from, next) => {})

export default router