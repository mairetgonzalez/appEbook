import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { RootLayout } from "@/routes/__root";
import { AuthenticatedLayout } from "@/routes/_authenticated";
import { ProjectsRoute } from "@/routes/index";
import { NewProjectRoute } from "@/routes/novo";
import { LoginRoute } from "@/routes/login";
import { SignupRoute } from "@/routes/signup";
import { AuthCallbackRoute } from "@/routes/auth/callback";
import { EditorRoute } from "@/routes/editor/$projectId";

function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
        Página não encontrada
      </p>
      <h1 className="font-display text-4xl font-semibold">Esse caminho não existe</h1>
      <p className="text-muted-foreground">
        Verifique o endereço ou volte para a página inicial.
      </p>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

const authenticatedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_authenticated",
  component: AuthenticatedLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/",
  component: ProjectsRoute,
});

const newProjectRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/novo",
  component: NewProjectRoute,
});

const editorRoute = createRoute({
  getParentRoute: () => authenticatedLayoutRoute,
  path: "/editor/$projectId",
  component: EditorRoute,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginRoute,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: SignupRoute,
});

const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/callback",
  component: AuthCallbackRoute,
});

const routeTree = rootRoute.addChildren([
  authenticatedLayoutRoute.addChildren([homeRoute, newProjectRoute, editorRoute]),
  loginRoute,
  signupRoute,
  authCallbackRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
