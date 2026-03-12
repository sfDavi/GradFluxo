import { useEffect, useState } from 'react'
import type { Curso } from './types'
import { loadCursos } from './utils/loadCursos'
import { CourseSelection } from './components/CourseSelection'
import { FlowchartView } from './components/FlowchartView'
import './App.css'

function App() {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null)

  useEffect(() => {
    loadCursos().then(setCursos)
  }, [])

  if (selectedCurso) {
    return <FlowchartView curso={selectedCurso} onBack={() => setSelectedCurso(null)} />
  }

  return <CourseSelection cursos={cursos} onSelectCurso={setSelectedCurso} />
}

export default App
