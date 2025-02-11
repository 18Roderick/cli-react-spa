import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'

import "./index.css"
// Import the generated route tree
import { routeTree } from './routeTree.gen'

import { ReactQueryDevtoolsLazy, TanStackRouterDevtoolsLazy } from './lib/providers/TankStackDevtools.lazy'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'



const queryClient = new QueryClient();

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    queryClient,
    //you can add more properties here in order to have types globaly and acces to conext example : auth: {} as AuthContext,
  },
  defaultPreload: "intent",
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  defaultPreloadStaleTime: 0,
});


// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}


// function InnerApp() {
// 	const auth = useAuth();
// 	return <RouterProvider router={router} context={{ auth }} />;
// }


// Render the app
const rootElement = document.getElementById('root') as HTMLDivElement
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <ReactQueryDevtoolsLazy initialIsOpen={false} />
        <TanStackRouterDevtoolsLazy router={router} initialIsOpen={false} />
      </QueryClientProvider>
    </StrictMode>,
  )
}