import { useNavigate } from 'react-router-dom'
import type { Deputado } from '../types/deputado'
import './DeputadoCard.css'
 
interface DeputadoCardProps {
  deputado: Deputado
}

function DeputadoCard({ deputado }: DeputadoCardProps) {

  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/deputado/${deputado.id}`, {
      state: { deputado }
    })
  }

  return (
    <div className="deputado-card" onClick={handleClick}>
      <img
        src={deputado.urlFoto}
        alt={deputado.nome}
        className="deputado-foto"
      />
      <div className="deputado-info">
        <h3 className="deputado-nome">{deputado.nome}</h3>
        <div className="deputado-details">
          <span className="partido">{deputado.siglaPartido}</span>
          <span className="uf">{deputado.siglaUf}</span>
        </div>
      </div>
    </div>
  )
}

export default DeputadoCard

