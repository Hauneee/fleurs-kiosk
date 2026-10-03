import { FLOWER_IMAGES } from '../assets/flowerAssets';

export const INITIAL_PRODUCTS = [
  // 1. BOUQUET (Required 5 Products at ₱500)
  {
    id: 'prod-bouquet-1',
    name: 'BLUE BOUQUET',
    category: 'bouquet',
    description: 'Exquisite handcrafted blue roses and hydrangea accents with artisanal wrapping and a signature satin navy bow.',
    price: 500,
    image_url: FLOWER_IMAGES['blue-bouquet'],
    stock: 25,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-bouquet-2',
    name: 'RED BOUQUET',
    category: 'bouquet',
    description: 'Passionate velvet crimson roses with delicate baby’s breath wrapped in pastel blush paper and satin bow.',
    price: 500,
    image_url: FLOWER_IMAGES['red-bouquet'],
    stock: 20,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-bouquet-3',
    name: 'TULIP BOUQUET',
    category: 'bouquet',
    description: 'Charming blend of pastel pink, sunset coral, and golden sunshine Dutch tulips tied with a delicate silk ribbon.',
    price: 500,
    image_url: FLOWER_IMAGES['tulip-bouquet'],
    stock: 18,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-bouquet-4',
    name: 'PURPLE BOUQUET (ASSORTED)',
    category: 'bouquet',
    description: 'Enchanting arrangement of royal purple roses, French lavender spikes, and soft lilac blooms.',
    price: 500,
    image_url: FLOWER_IMAGES['purple-bouquet'],
    stock: 15,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-bouquet-5',
    name: 'BROWN BOUQUET (ASSORTED)',
    category: 'bouquet',
    description: 'Warm rustic terracotta and amber dried florals with pampas accents, beige wraps, and an earthy chocolate bow.',
    price: 500,
    image_url: FLOWER_IMAGES['brown-bouquet'],
    stock: 12,
    is_active: true,
    created_at: new Date().toISOString()
  },

  // 2. SOLO FLOWER (Rose, Sunflower, Tulip, Lily, Daisy, Carnation)
  {
    id: 'prod-solo-1',
    name: 'ROSE',
    category: 'solo-flower',
    description: 'Single premium stem fresh scarlet rose with fresh green foliage.',
    price: 120,
    image_url: FLOWER_IMAGES['rose'],
    stock: 50,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-solo-2',
    name: 'SUNFLOWER',
    category: 'solo-flower',
    description: 'Single radiant giant sunshine sunflower that brings instant joy.',
    price: 150,
    image_url: FLOWER_IMAGES['sunflower'],
    stock: 40,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-solo-3',
    name: 'TULIP',
    category: 'solo-flower',
    description: 'Single elegant pink Dutch tulip with long graceful stem.',
    price: 140,
    image_url: FLOWER_IMAGES['tulip'],
    stock: 35,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-solo-4',
    name: 'LILY',
    category: 'solo-flower',
    description: 'Single fragrant pure white Oriental lily with star petals.',
    price: 160,
    image_url: FLOWER_IMAGES['lily'],
    stock: 30,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-solo-5',
    name: 'DAISY',
    category: 'solo-flower',
    description: 'Single cheerful English daisy with bright golden center.',
    price: 90,
    image_url: FLOWER_IMAGES['daisy'],
    stock: 60,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-solo-6',
    name: 'CARNATION',
    category: 'solo-flower',
    description: 'Single ruffled soft pink carnation with sweet clove scent.',
    price: 110,
    image_url: FLOWER_IMAGES['carnation'],
    stock: 45,
    is_active: true,
    created_at: new Date().toISOString()
  },

  // 3. TRIPLE FLOWER
  {
    id: 'prod-triple-1',
    name: 'TRIPLE ROSE ENSEMBLE',
    category: 'triple-flower',
    description: 'Three hand-picked long stem red roses hand-tied with a blue satin bow.',
    price: 320,
    image_url: FLOWER_IMAGES['triple-rose'],
    stock: 25,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-triple-2',
    name: 'SUNFLOWER TRIO HARMONY',
    category: 'triple-flower',
    description: 'Trio of vibrant sunflowers bundled together with rustic kraft binding.',
    price: 380,
    image_url: FLOWER_IMAGES['triple-sunflower'],
    stock: 20,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-triple-3',
    name: 'TULIP & LILY TRIO',
    category: 'triple-flower',
    description: 'Harmonious trio of pink and orange tulips embracing a pure white lily.',
    price: 390,
    image_url: FLOWER_IMAGES['triple-tulip-lily'],
    stock: 18,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-triple-4',
    name: 'SPRING BLOSSOM TRIO',
    category: 'triple-flower',
    description: 'Pastel symphony featuring a daisy, rose, and carnation tied together.',
    price: 340,
    image_url: FLOWER_IMAGES['triple-rose'],
    stock: 15,
    is_active: true,
    created_at: new Date().toISOString()
  }
];

export const CATEGORIES = [
  {
    id: 'solo-flower',
    title: 'SOLO FLOWER',
    subtitle: 'Single Stem Elegance',
    description: 'Pick single stems to create your own bespoke sentiment.',
    image: FLOWER_IMAGES['rose']
  },
  {
    id: 'triple-flower',
    title: 'TRIPLE FLOWER',
    subtitle: 'Curated 3-Stem Ensembles',
    description: 'Delightful triplets tied with handmade ribbons.',
    image: FLOWER_IMAGES['triple-rose']
  },
  {
    id: 'bouquet',
    title: 'BOUQUET',
    subtitle: 'Signature Handcrafted Bouquets',
    description: 'Full artisanal wrapping with signature bows (₱500).',
    image: FLOWER_IMAGES['blue-bouquet']
  }
];
