import { Link } from 'react-router-dom'
import { RegisterForm } from '../components/RegisterForm'

export function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <RegisterForm />
      <p className="text-sm text-muted-foreground">
        Bereits registriert?{' '}
        <Link to="/login" className="text-primary underline">
          Zur Anmeldung
        </Link>
      </p>
    </div>
  )
}
