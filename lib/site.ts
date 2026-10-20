// Identité publique et moyens de contact, définis en un seul endroit.

export const SITE = {
  name: 'Théo Stoffelbach',
  role: 'Développeur fullstack',
  city: 'Toulouse',
  availability: 'CDI à partir de juillet 2027',
  workMode: 'Toulouse ou remote',
  // PROVISOIRE : adresse reprise de l'ancien site, pas encore confirmée par Théo
  // (décision non résolue du contrat .impeccable/surfaces/app-page-tsx.md).
  // À confirmer ou remplacer avant la mise en ligne : START et la notice l'affichent.
  email: 'theo.stoffelbach@hotmail.com',
  linkedin: 'https://www.linkedin.com/in/theo-stoffelbach',
  github: 'https://github.com/theo-stoffelbach',
  intro:
    "Salut ! Moi c'est Théo, dev fullstack à Toulouse. Choisis une cartouche pour voir mes projets.",
} as const;
