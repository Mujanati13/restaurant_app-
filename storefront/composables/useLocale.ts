export const supportedLocales = [
  { code: 'en', label: 'English' },
  { code: 'de-CH', label: 'Deutsch' },
  { code: 'fr-CH', label: 'Français' },
  { code: 'it-CH', label: 'Italiano' },
] as const

export type StorefrontLocale = typeof supportedLocales[number]['code']

type TranslationSet = Record<string, string>

const translations: Record<StorefrontLocale, TranslationSet> = {
  en: {
    'language.label': 'Language',
    'address.choose': 'Choose your address',
    'nav.restaurants': 'For restaurants',
    'nav.account': 'Account',
    'nav.cart': 'Cart',
    'nav.home': 'Home',
    'nav.menu': 'Our Menu',
    'nav.reservations': 'Reservations',
    'nav.locations': 'Locations & Hours',
    'cart.title': 'Your order',
    'cart.empty': 'Your cart is empty. Add a dish to get started.',
    'cart.subtotal': 'Subtotal',
    'cart.checkout': 'Go to checkout',
    'cart.view': 'View cart',
    'hero.eyebrow': 'Local restaurants, one easy order',
    'hero.title': 'Good food,',
    'hero.titleAccent': 'delivered your way.',
    'hero.support': 'Discover nearby restaurants, choose delivery or pickup, and order in a few simple steps.',
    'hero.addressHeading': 'Start with your address',
    'hero.secure': 'Secure checkout',
    'hero.delivery': 'Delivery',
    'hero.pickup': 'Pickup',
    'hero.addressPlaceholder': 'Enter delivery address',
    'hero.findFood': 'Find food',
    'hero.localKitchens': 'Independent local kitchens',
    'hero.flexible': 'Order when it suits you',
    'hero.explore': 'Explore local favourites',
    'restaurant.orderDirect': 'Order directly from the restaurant',
    'restaurant.deliveryAvailable': 'Delivery available',
    'restaurant.pickupAvailable': 'Pickup available',
    'restaurant.ready': 'Ready when you are',
    'restaurant.browseMenu': 'Browse menu',
    'restaurant.reserve': 'Reserve',
    'restaurant.secureOrder': 'Secure order',
    'restaurant.menuCategories': 'Menu Categories',
    'restaurant.ourSelection': 'Our Selection',
    'restaurant.viewFullMenu': 'View full menu',
    'restaurant.allDishes': 'All Dishes',
    'menu.back': 'Back to menu',
    'menu.save': 'Save',
    'menu.saved': 'Saved',
    'menu.madeToOrder': 'Made to order',
    'menu.startingAt': 'Starting at',
    'menu.required': 'Required',
    'menu.optional': 'Optional',
    'menu.instructions': 'Special instructions',
    'menu.instructionsHelp': 'Let the kitchen know about preferences or allergies.',
    'menu.total': 'Total',
    'menu.addToCart': 'Add to cart',
  },
  'de-CH': {
    'language.label': 'Sprache', 'address.choose': 'Adresse auswählen', 'nav.restaurants': 'Für Restaurants', 'nav.account': 'Konto', 'nav.cart': 'Warenkorb', 'nav.home': 'Startseite', 'nav.menu': 'Unsere Speisekarte', 'nav.reservations': 'Reservationen', 'nav.locations': 'Standorte & Öffnungszeiten', 'cart.title': 'Deine Bestellung', 'cart.empty': 'Dein Warenkorb ist leer. Füge ein Gericht hinzu.', 'cart.subtotal': 'Zwischensumme', 'cart.checkout': 'Zur Kasse', 'cart.view': 'Warenkorb ansehen', 'hero.eyebrow': 'Lokale Restaurants, eine einfache Bestellung', 'hero.title': 'Gutes Essen,', 'hero.titleAccent': 'geliefert nach deinen Wünschen.', 'hero.support': 'Entdecke Restaurants in deiner Nähe, wähle Lieferung oder Abholung und bestelle in wenigen Schritten.', 'hero.addressHeading': 'Starte mit deiner Adresse', 'hero.secure': 'Sicherer Checkout', 'hero.delivery': 'Lieferung', 'hero.pickup': 'Abholung', 'hero.addressPlaceholder': 'Lieferadresse eingeben', 'hero.findFood': 'Essen finden', 'hero.localKitchens': 'Unabhängige lokale Küchen', 'hero.flexible': 'Bestelle, wann es dir passt', 'hero.explore': 'Lokale Favoriten entdecken', 'restaurant.orderDirect': 'Direkt beim Restaurant bestellen', 'restaurant.deliveryAvailable': 'Lieferung verfügbar', 'restaurant.pickupAvailable': 'Abholung verfügbar', 'restaurant.ready': 'Bereit, wenn du es bist', 'restaurant.browseMenu': 'Speisekarte ansehen', 'restaurant.reserve': 'Reservieren', 'restaurant.secureOrder': 'Sicher bestellen', 'restaurant.menuCategories': 'Menükategorien', 'restaurant.ourSelection': 'Unsere Auswahl', 'restaurant.viewFullMenu': 'Ganze Speisekarte', 'restaurant.allDishes': 'Alle Gerichte', 'menu.back': 'Zurück zur Speisekarte', 'menu.save': 'Speichern', 'menu.saved': 'Gespeichert', 'menu.madeToOrder': 'Frisch zubereitet', 'menu.startingAt': 'Ab', 'menu.required': 'Erforderlich', 'menu.optional': 'Optional', 'menu.instructions': 'Besondere Hinweise', 'menu.instructionsHelp': 'Teile der Küche Vorlieben oder Allergien mit.', 'menu.total': 'Total', 'menu.addToCart': 'In den Warenkorb',
  },
  'fr-CH': {
    'language.label': 'Langue', 'address.choose': 'Choisir votre adresse', 'nav.restaurants': 'Pour les restaurants', 'nav.account': 'Compte', 'nav.cart': 'Panier', 'nav.home': 'Accueil', 'nav.menu': 'Notre carte', 'nav.reservations': 'Réservations', 'nav.locations': 'Adresses et horaires', 'cart.title': 'Votre commande', 'cart.empty': 'Votre panier est vide. Ajoutez un plat pour commencer.', 'cart.subtotal': 'Sous-total', 'cart.checkout': 'Passer au paiement', 'cart.view': 'Voir le panier', 'hero.eyebrow': 'Des restaurants locaux, une commande facile', 'hero.title': 'De bons plats,', 'hero.titleAccent': 'livrés à votre façon.', 'hero.support': 'Découvrez les restaurants près de chez vous, choisissez la livraison ou le retrait et commandez en quelques étapes.', 'hero.addressHeading': 'Commencez par votre adresse', 'hero.secure': 'Paiement sécurisé', 'hero.delivery': 'Livraison', 'hero.pickup': 'À emporter', 'hero.addressPlaceholder': 'Saisir une adresse de livraison', 'hero.findFood': 'Trouver un repas', 'hero.localKitchens': 'Cuisines locales indépendantes', 'hero.flexible': 'Commandez quand vous voulez', 'hero.explore': 'Découvrir les favoris locaux', 'restaurant.orderDirect': 'Commandez directement au restaurant', 'restaurant.deliveryAvailable': 'Livraison disponible', 'restaurant.pickupAvailable': 'Retrait disponible', 'restaurant.ready': 'Quand vous voulez', 'restaurant.browseMenu': 'Voir la carte', 'restaurant.reserve': 'Réserver', 'restaurant.secureOrder': 'Commande sécurisée', 'restaurant.menuCategories': 'Catégories du menu', 'restaurant.ourSelection': 'Notre sélection', 'restaurant.viewFullMenu': 'Voir tout le menu', 'restaurant.allDishes': 'Tous les plats', 'menu.back': 'Retour au menu', 'menu.save': 'Enregistrer', 'menu.saved': 'Enregistré', 'menu.madeToOrder': 'Préparé à la commande', 'menu.startingAt': 'À partir de', 'menu.required': 'Obligatoire', 'menu.optional': 'Facultatif', 'menu.instructions': 'Instructions spéciales', 'menu.instructionsHelp': 'Indiquez à la cuisine vos préférences ou allergies.', 'menu.total': 'Total', 'menu.addToCart': 'Ajouter au panier',
  },
  'it-CH': {
    'language.label': 'Lingua', 'address.choose': 'Scegli il tuo indirizzo', 'nav.restaurants': 'Per i ristoranti', 'nav.account': 'Account', 'nav.cart': 'Carrello', 'nav.home': 'Home', 'nav.menu': 'Il nostro menu', 'nav.reservations': 'Prenotazioni', 'nav.locations': 'Sedi e orari', 'cart.title': 'Il tuo ordine', 'cart.empty': 'Il carrello è vuoto. Aggiungi un piatto per iniziare.', 'cart.subtotal': 'Subtotale', 'cart.checkout': 'Vai alla cassa', 'cart.view': 'Vedi il carrello', 'hero.eyebrow': 'Ristoranti locali, un ordine semplice', 'hero.title': 'Buon cibo,', 'hero.titleAccent': 'consegnato come vuoi tu.', 'hero.support': 'Scopri i ristoranti vicini, scegli consegna o ritiro e ordina in pochi passaggi.', 'hero.addressHeading': 'Inizia dal tuo indirizzo', 'hero.secure': 'Pagamento sicuro', 'hero.delivery': 'Consegna', 'hero.pickup': 'Ritiro', 'hero.addressPlaceholder': 'Inserisci l’indirizzo di consegna', 'hero.findFood': 'Trova cibo', 'hero.localKitchens': 'Cucine locali indipendenti', 'hero.flexible': 'Ordina quando preferisci', 'hero.explore': 'Scopri i preferiti locali', 'restaurant.orderDirect': 'Ordina direttamente dal ristorante', 'restaurant.deliveryAvailable': 'Consegna disponibile', 'restaurant.pickupAvailable': 'Ritiro disponibile', 'restaurant.ready': 'Quando vuoi tu', 'restaurant.browseMenu': 'Sfoglia il menu', 'restaurant.reserve': 'Prenota', 'restaurant.secureOrder': 'Ordine sicuro', 'restaurant.menuCategories': 'Categorie del menu', 'restaurant.ourSelection': 'La nostra selezione', 'restaurant.viewFullMenu': 'Vedi tutto il menu', 'restaurant.allDishes': 'Tutti i piatti', 'menu.back': 'Torna al menu', 'menu.save': 'Salva', 'menu.saved': 'Salvato', 'menu.madeToOrder': 'Preparato al momento', 'menu.startingAt': 'A partire da', 'menu.required': 'Obbligatorio', 'menu.optional': 'Facoltativo', 'menu.instructions': 'Istruzioni speciali', 'menu.instructionsHelp': 'Comunica alla cucina preferenze o allergie.', 'menu.total': 'Totale', 'menu.addToCart': 'Aggiungi al carrello',
  },
}

export function useLocale() {
  const localeCookie = useCookie<StorefrontLocale>('deliveriano-locale', {
    default: () => 'en',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  const locale = useState<StorefrontLocale>('storefront-locale', () => {
    return supportedLocales.some(item => item.code === localeCookie.value) ? localeCookie.value : 'en'
  })

  watch(locale, value => { localeCookie.value = value }, { flush: 'sync' })

  const t = (key: string, values: Record<string, string | number> = {}) => {
    const message = translations[locale.value][key] || translations.en[key] || key
    return message.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? `{${name}}`))
  }

  const setLocale = (value: StorefrontLocale) => { locale.value = value }

  return { locale, locales: supportedLocales, setLocale, t }
}
