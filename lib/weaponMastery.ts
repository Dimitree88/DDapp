// Sintesi delle proprietà di padronanza, Manuale del Giocatore 2024, p. 214.
export const masteryEffects: Record<string, string> = {
  "Colpo di striscio": "Se manchi, puoi infliggere danni pari al modificatore usato per colpire.",
  "Doppio fendente": "Dopo un colpo in mischia puoi attaccare un secondo bersaglio vicino al primo, una volta per turno.",
  Prosciugamento: "Un bersaglio colpito ha svantaggio al prossimo tiro per colpire prima del tuo prossimo turno.",
  Graffio: "L'attacco extra di un'arma leggera può far parte dell'azione di Attacco.",
  Lentezza: "Un bersaglio danneggiato perde 3 m di velocità fino al tuo prossimo turno; non si cumula.",
  Rovesciamento: "Un bersaglio colpito può cadere prono se fallisce un TS Costituzione contro CD 8 + caratteristica + competenza.",
  Spinta: "Un bersaglio colpito di taglia Grande o inferiore può essere spinto di 3 m.",
  Vessazione: "Dopo aver inflitto danni, hai vantaggio al prossimo attacco contro lo stesso bersaglio entro il tuo turno successivo.",
};
