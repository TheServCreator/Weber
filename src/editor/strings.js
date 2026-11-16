// Editor-only labels (the /redaktorius UI, never shown to site visitors).
// Turns a content.json path into a readable label for the save diff,
// e.g. "packages.0.contents.2" → "Paketai › #1 › Punktai › #3".

const SECTION = {
  header: 'Viršutinė juosta',
  hero: 'Pagrindinė karuselė',
  partyCards: 'Švenčių kortelės',
  pramogos: 'Pramogos',
  packages: 'Paketai',
  cities: 'Miestai ir adresai',
  themes: 'Temos',
  testimonials: 'Atsiliepimai',
  contact: 'Kontaktai',
  footer: 'Poraštė',
  brandsFooter: 'Partnerių logotipai',
};

const FIELD = {
  tagline: 'Šūkis', phone: 'Telefonas', buttonText: 'Mygtuko tekstas',
  slides: 'Skaidrė', image: 'Nuotrauka', images: 'Nuotrauka', alt: 'Nuotraukos aprašymas',
  objectPosition: 'Nuotraukos fokusas', blurFill: 'Rodyti visą nuotrauką', title: 'Antraštė', sub: 'Paantraštė',
  hint: 'Apatinis tekstas', link: 'Nuoroda', name: 'Pavadinimas', description: 'Aprašymas',
  priceNote: 'Kainos pastaba', price: 'Kaina', contents: 'Punktai', key: 'Raktas',
  label: 'Pavadinimas', value: 'Reikšmė', text: 'Tekstas', author: 'Autorius',
  email: 'El. paštas', notice: 'Pastaba formoje', reserveButtonText: 'Mygtuko tekstas',
  copyright: 'Autorių teisės', logo: 'Logotipas', logoAlt: 'Logotipo aprašymas',
  socials: 'Soc. tinklas', url: 'Nuoroda', platform: 'Platforma',
};

export function pathLabel(path) {
  return String(path)
    .split('.')
    .map((p, i) => {
      if (/^\d+$/.test(p)) return `#${Number(p) + 1}`;
      return (i === 0 ? SECTION[p] : FIELD[p]) || p;
    })
    .join(' › ');
}
