export default function Disclaimer({ largeChange }) {
  return (
    <div className="disclaimer">
      ⚠️ Esta app usa fórmulas estándar (Mifflin-St Jeor) para hacer estimaciones
      generales. No sustituye la consulta con un nutriólogo o médico,
      especialmente si tienes alguna condición de salud.
      {largeChange && (
        <>
          {' '}
          Tu meta de peso implica un cambio grande respecto a tu peso actual: te
          recomendamos acompañar este proceso con un profesional de la salud.
        </>
      )}
    </div>
  );
}
