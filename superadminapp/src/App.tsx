import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './app/routes'
import { AuthProvider } from './features/auth/AuthProvider'
import { ActiveUnitProvider } from './context/ActiveUnitContext'
import { InventoryDomainProvider } from './context/InventoryDomainProvider'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ActiveUnitProvider>
          <InventoryDomainProvider>
            <AppRoutes />
          </InventoryDomainProvider>
        </ActiveUnitProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
