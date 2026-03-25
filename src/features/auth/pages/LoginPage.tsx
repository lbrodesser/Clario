import { Link } from 'react-router-dom'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <LoginForm />
      <p className="text-sm text-muted-foreground">
        Noch kein Konto?{' '}
        <Link to="/register" className="text-primary underline">
          Jetzt registrieren
        </Link>
      </p>
    </div>
  )
}
