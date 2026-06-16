import { useEffect, useState } from 'react'
import type { Curso } from './types'
import { loadCursos } from './utils/loadCursos'
import { CourseSelection } from './components/CourseSelection'
import { FlowchartView } from './components/FlowchartView'
import { useTheme } from './hooks/useTheme'
import './App.css'

function App() {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    loadCursos().then(setCursos)
  }, [])

  return (
    <>
      {selectedCurso ? (
        <FlowchartView
          curso={selectedCurso}
          onBack={() => setSelectedCurso(null)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : (
        <CourseSelection
          cursos={cursos}
          onSelectCurso={setSelectedCurso}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
    </>
  )
}

export default App
