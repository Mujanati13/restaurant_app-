import { createServer } from 'node:http'

let mode = 'happy'
const bootstrap = { data: {
  restaurant: { id: '01fixturetenant', name: 'Saffron Table', slug: 'saffron-table', status: 'active' },
  brand: {
    identity: { name: 'Saffron Table', tagline: 'Modern Moroccan dining, made warmly.' },
    theme: { primary: '#9f3f24', secondary: '#21352f', accent: '#d9a441', background: '#fffaf3', surface: '#ffffff', text: '#241f1a', radius: 18 },
    content: { hero_title: 'Gather around something memorable.', hero_subtitle: 'Seasonal plates, generous hospitality, and easy ordering from your neighbourhood table.', hero_image_url: null, footer_text: 'Saffron Table. Food, people, place.' },
    navigation: [{ label: 'Home', href: '#/' }, { label: 'Menu', href: '#/menu' }, { label: 'Reserve', href: '#/reservations' }, { label: 'Locations', href: '#/locations' }],
    sections: [{ id: 'hero', type: 'hero', visible: true, position: 10 }, { id: 'categories', type: 'categories', visible: true, position: 20 }, { id: 'featured', type: 'featured_dishes', visible: true, position: 30 }, { id: 'reservation', type: 'reservation_cta', visible: true, position: 40 }],
    mobile: { android: { package_name: 'com.vondo.customer', sha256_cert_fingerprints: [] }, ios: { team_id: null, bundle_id: null } },
  },
  currency: { code: 'MAD', symbol: 'DH', symbol_position: true, decimal_position: 2 },
  capabilities: { ordering: true, reservations: true },
  pages: [{ slug: 'home', title: 'Home', is_home: true }],
  deep_links: { base_url: 'http://localhost:3010', routes: { menu: '/menu', orders: '/account/orders' }, custom_scheme: 'vondo' },
} }
const categories = { data: [{ id: 1, name: 'From the fire' }, { id: 2, name: 'Garden plates' }, { id: 3, name: 'Sweet finish' }] }
const menus = { data: [
  { id: 1, name: 'Preserved lemon chicken', description: 'Charred lemon, green olive and fragrant jus.', price: 128, category_ids: [1], is_special: true },
  { id: 2, name: 'Roasted cauliflower', description: 'Tahini, date molasses and toasted almonds.', price: 84, category_ids: [2] },
  { id: 3, name: 'Orange blossom panna cotta', description: 'Citrus, pistachio and mint.', price: 62, category_ids: [3] },
] }

createServer((request, response) => {
  const url = new URL(request.url || '/', 'http://fixture.local')
  if (url.pathname === '/__fixture/mode') {
    mode = url.searchParams.get('value') || 'happy'
    return json(response, 200, { mode })
  }
  if (mode === 'bootstrap-error' && url.pathname.endsWith('/storefront/bootstrap')) return json(response, 503, { message: 'Fixture bootstrap unavailable' })
  if (url.pathname.endsWith('/storefront/bootstrap')) return json(response, 200, bootstrap)
  if (mode === 'content-error' && url.pathname.endsWith('/storefront/menus')) return json(response, 503, { message: 'Fixture catalog unavailable' })
  if (url.pathname.endsWith('/storefront/menus')) return json(response, 200, mode === 'empty' ? { data: [] } : menus)
  if (url.pathname.endsWith('/storefront/categories')) return json(response, 200, mode === 'empty' ? { data: [] } : categories)
  if (url.pathname.endsWith('/storefront/locations')) return json(response, 200, { data: [] })
  return json(response, 404, { message: 'Fixture route not found', path: url.pathname })
}).listen(4010, '127.0.0.1', () => process.stdout.write('Tenant fixture listening on 4010\n'))

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': '*' })
  response.end(JSON.stringify(body))
}
