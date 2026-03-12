# GradFluxo — Fluxograma Interativo de Disciplinas

Aplicação web para estudantes universitários visualizarem a grade curricular do seu curso em formato de fluxograma interativo.

## Funcionalidades

- **Fluxograma por semestre** — disciplinas organizadas em colunas por período, com cards coloridos indicando o status de cada uma
- **Código de cores por status**
  - Verde — disciplina cursada
  - Azul — disciplina cursável (pré-requisitos satisfeitos)
  - Cinza — disciplina bloqueada (pré-requisitos pendentes)
- **Linhas de pré-requisito** — setas SVG desenhadas entre disciplinas dependentes e seus pré-requisitos
- **Destaque no hover** — ao passar o mouse sobre uma disciplina, toda a cadeia de pré-requisitos (diretos e indiretos) é destacada
- **Marcar / desmarcar disciplinas** — clicar em uma disciplina cursável a marca como cursada; clicar em uma cursada a desmarca, propagando recursivamente a invalidação de dependentes
- **Barra de progresso** — exibe a carga horária cursada sobre o total do curso em porcentagem, atualizada automaticamente
- **Persistência local** — progresso salvo no `localStorage` por curso; restaurado automaticamente ao reabrir o navegador
- **Suporte a múltiplos cursos** — novos cursos são adicionados apenas inserindo um arquivo JSON


## Instalação e execução

**Pré-requisitos:** Node.js 18+

```bash
# Clone o repositório
git clone https://github.com/sfDavi/GradFluxo.git
cd GradFluxo

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:5173` no navegador.

### Outros comandos

```bash
npm run build    # Build de produção
npm run preview  # Servir o build localmente
npm run lint     # Verificar o código com ESLint
```

## Adicionando um novo curso

1. Crie um arquivo JSON em `public/cursos/` seguindo o modelo abaixo
2. Adicione o nome do arquivo ao array em `public/cursos/index.json`
3. O curso aparecerá automaticamente na tela de seleção

### Estrutura do JSON

```json
{
  "codigoCurso": "ABCDE",
  "nomeCurso": "Curso de Exemplo",
  "numeroSemestres": 8,
  "cargaHorariaTotal": 3200,
  "cargaHorariaNucleoComum": 960,
  "cargaHorariaNucleoLivre": 320,
  "cargaHorariaNucleoEspecifico": 1600,
  "cargaHorariaNucleoOptativo": 320,
  "disciplinas": [
    {
      "codigoDisciplina": "CC001",
      "nomeDisciplina": "Disciplina 1",
      "semestre": 1,
      "cargaHoraria": 64,
      "nucleo": "comum",
      "prerequisitos": []
    },
    {
      "codigoDisciplina": "CC002",
      "nomeDisciplina": "Disciplina 2",
      "semestre": 1,
      "cargaHoraria": 64,
      "nucleo": "especifico",
      "prerequisitos": ["CC001"]
    }
  ]
}
```

**Valores válidos para `nucleo`:** `"comum"`, `"especifico"`, `"livre"`, `"optativo"`

## Estrutura do projeto

```
GradFluxo/
├── public/
│   └── cursos/
│       ├── index.json          # Lista de arquivos de curso
│       ├── bes-ufg-24.json     # Engenharia de Software - UFG (grade 2024)
│       ├── bcc-teste.json      # BCC exemplo
│       └── bes-teste.json      # BES exemplo
└── src/
    ├── types/
    │   └── index.ts            # Tipos TypeScript (Curso, Disciplina, Status, Nucleo)
    ├── utils/
    │   ├── loadCursos.ts       # Carrega os JSONs de cursos via fetch
    │   └── calcularStatus.ts   # Calcula status de cada disciplina
    ├── components/
    │   ├── CourseSelection.tsx # Tela de seleção de curso
    │   └── FlowchartView.tsx   # Fluxograma principal com SVG, hover e progresso
    ├── App.tsx                 # Roteamento entre as duas telas
    ├── App.css                 # Estilos dos componentes
    └── index.css               # Estilos globais
```

## Stack

| Tecnologia | Uso |
|---|---|
| React 19 | Interface e gerenciamento de estado |
| TypeScript 5.9 | Tipagem estática |
| Vite 7 | Build e servidor de desenvolvimento |
| SVG nativo | Linhas de pré-requisito (sem bibliotecas externas) |
| localStorage | Persistência do progresso no navegador |

## Como funciona

### Cálculo de status

A função `calcularStatus` percorre todas as disciplinas e determina o status com base no conjunto de disciplinas já cursadas:

- Se a disciplina está no conjunto de cursadas → **cursada**
- Se todos os pré-requisitos estão cursados (ou não há pré-requisitos) → **cursável**
- Caso contrário → **não cursável**

### Propagação recursiva ao desmarcar

Ao desmarcar uma disciplina cursada, um BFS percorre o grafo de dependentes e remove do conjunto de cursadas todas as disciplinas que dependem (direta ou indiretamente) da desmarcada.

## Licença

MIT
