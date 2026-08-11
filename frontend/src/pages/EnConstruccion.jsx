import React from 'react';

export default function EnConstruccion({ titulo }) {
  return (
    <div className="page">
      <h1>{titulo}</h1>
      <p className="placeholder-text">
        Este módulo todavía no está construido. El backend y esta pantalla se agregan siguiendo
        el mismo patrón que usamos en Alumnos.
      </p>
    </div>
  );
}
