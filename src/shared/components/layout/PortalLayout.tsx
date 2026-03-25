import { Outlet } from 'react-router-dom'

export function PortalLayout() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[640px] px-4 py-6">
        <Outlet />
      </div>
    </div>
  )
}
