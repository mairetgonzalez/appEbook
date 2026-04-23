import { createRouter } from '@tanstack/react-router'
import { Route as RootRoute } from '@/routes/__root'
import { Route as AuthLayoutRoute } from '@/routes/_authenticated'
import { Route as IndexRoute } from '@/routes/_authenticated.index'
import { Route as NewRoute } from '@/routes/_authenticated.novo'
import { Route as EditorRoute } from '@/routes/_authenticated.editor.$projectId'
import { Route as LoginRoute } from '@/routes/login'
import { Route as SignupRoute } from '@/routes/signup'
import { Route as CallbackRoute } from '@/routes/auth.callback'

const authTree = AuthLayoutRoute.addChildren([IndexRoute, NewRoute, EditorRoute])
const routeTree = RootRoute.addChildren([authTree, LoginRoute, SignupRoute, CallbackRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
