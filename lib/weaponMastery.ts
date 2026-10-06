// Sintesi delle proprietà di padronanza, Manuale del Giocatore 2024, p. 214.
export const masteryEffects: Record<string, string> = {
  "Colpo di striscio": "Se manchi una creatura, puoi infliggere danni del tipo dell'arma pari al modificatore usato per colpire; solo quel modificatore può aumentarli.",
  "Doppio fendente": "Dopo un colpo in mischia puoi attaccare con la stessa arma una seconda creatura entro 1,5 m dal primo bersaglio e alla tua portata, una volta per turno. Ai danni del secondo colpo non aggiungi il modificatore di caratteristica, salvo se è negativo.",
  Prosciugamento: "Un bersaglio colpito ha svantaggio al prossimo tiro per colpire prima dell'inizio del tuo prossimo turno.",
  Graffio: "L'attacco extra della proprietà Leggera può far parte dell'azione di Attacco anziché richiedere un'azione bonus, una volta per turno.",
  Lentezza: "Un bersaglio colpito e danneggiato perde 3 m di velocità fino all'inizio del tuo prossimo turno; la riduzione non supera 3 m anche con più colpi.",
  Rovesciamento: "Un bersaglio colpito può cadere prono se fallisce un TS Costituzione contro CD 8 + caratteristica + competenza.",
  Spinta: "Una creatura colpita di taglia Grande o inferiore può essere spinta via di almeno 3 m.",
  Vessazione: "Dopo aver colpito e inflitto danni, hai vantaggio al prossimo tiro per colpire contro lo stesso bersaglio prima della fine del tuo turno successivo.",
};
