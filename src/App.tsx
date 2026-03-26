import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/shared/components/ui/toaster'
import { AppLayout } from '@/shared/components/layout/AppLayout'
import { PortalLayout } from '@/shared/components/layout/PortalLayout'
import { ProtectedRoute } from '@/shared/components/layout/ProtectedRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { VerifyEmailPage } from '@/features/auth/pages/VerifyEmailPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { MandantenPage } from '@/features/mandanten/pages/MandantenPage'
import { MandantNeuPage } from '@/features/mandanten/pages/MandantNeuPage'
import { MandantDetailPage } from '@/features/mandanten/pages/MandantDetailPage'
import { DokumentePage } from '@/features/dokumente/pages/DokumentePage'
import { EinstellungenPage } from '@/features/einstellungen/pages/EinstellungenPage'
import { PortalPage } from '@/features/portal/pages/PortalPage'
import { UploadErfolgPage } from '@/features/portal/pages/UploadErfolgPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/verify" element={<VerifyEmailPage />} />

          {/* Kanzlei (protected) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/app/dashboard" element={<DashboardPage />} />
              <Route path="/app/mandanten" element={<MandantenPage />} />
              <Route path="/app/mandanten/neu" element={<MandantNeuPage />} />
              <Route path="/app/mandanten/:id" element={<MandantDetailPage />} />
              <Route path="/app/dokumente" element={<DokumentePage />} />
              <Route path="/app/einstellungen" element={<EinstellungenPage />} />
            </Route>
          </Route>

          {/* Portal (public) */}
          <Route element={<PortalLayout />}>
            <Route path="/portal/:token" element={<PortalPage />} />
            <Route path="/portal/:token/erfolg" element={<UploadErfolgPage />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
