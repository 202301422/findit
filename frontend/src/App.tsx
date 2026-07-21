import { ThemeProvider } from './contexts/ThemeContext'
import { TooltipProvider } from './components/ui/Tooltip'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <AppRoutes />
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App