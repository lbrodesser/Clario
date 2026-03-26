import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { Button } from '@/shared/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hatFehler: boolean
}

export class PortalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hatFehler: false }
  }

  static getDerivedStateFromError(): State {
    return { hatFehler: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Portal-Fehler:', error, errorInfo)
  }

  render() {
    if (this.state.hatFehler) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <p className="text-lg font-medium">
              Es ist ein Fehler aufgetreten.
            </p>
            <p className="text-sm text-muted-foreground">
              Bitte laden Sie die Seite neu. Falls das Problem bestehen bleibt,
              kontaktieren Sie Ihre Kanzlei.
            </p>
            <Button onClick={() => window.location.reload()}>
              Seite neu laden
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
