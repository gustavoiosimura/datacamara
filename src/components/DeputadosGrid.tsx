
import DeputadoCard from './DeputadoCard'

interface Deputado {
  id: number
  nome: string
  siglaPartido: string
  siglaUf: string
  urlFoto: string
}

interface DeputadosGridProps {
  deputados: Deputado[]
}

function DeputadosGrid({ deputados }: DeputadosGridProps) {
  return (
    <div className="deputados-grid">
      {deputados.map((deputado) => (
        <DeputadoCard key={deputado.id} deputado={deputado} />
      ))}
    </div>
  )
}

export default DeputadosGrid

