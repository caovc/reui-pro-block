import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { unzipSync } from 'fflate'

const route=(category:string,n:number)=>`./#/preview/ecommerce/${category}/${category}-${n}`
async function open(page:Page,category:string,n:number){await page.goto(route(category,n));await expect(page.locator('.isolated-preview').getByRole('heading').first()).toBeVisible({timeout:15000})}
async function closeBag(page:Page){await page.getByRole('button',{name:'Continue shopping',exact:true}).click()}

test('size detail carries color/size into the bag, disables sold-out size and changes information tabs',async({page})=>{
 await open(page,'product-detail',1)
 await expect(page.getByRole('button',{name:'Size 44, sold out',exact:true})).toBeDisabled()
 await page.getByRole('button',{name:'Midnight',exact:true}).click()
 await page.getByRole('button',{name:'Size 42',exact:true}).click()
 await page.getByRole('button',{name:'Add to Bag',exact:true}).click()
 await expect(page.getByRole('dialog')).toContainText('Midnight · EU 42')
 await closeBag(page)
 await page.getByRole('tab',{name:'Specs',exact:true}).click()
 await expect(page.getByRole('tabpanel')).toContainText('Heel drop')
 await page.getByRole('button',{name:'Next related products',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Alpine Trekker Mid',exact:true})).toBeVisible()
 await expect(page.getByRole('button',{name:'Next related products',exact:true})).toBeDisabled()
 await page.getByRole('button',{name:'Size guide',exact:true}).click()
 await expect(page.getByRole('dialog')).toContainText('26.5 cm')
})

test('story detail changes gallery, adds selected finish, and allows manually paced reviews',async({page})=>{
 await open(page,'product-detail',2)
 await page.getByRole('button',{name:'Show image 2 of 5',exact:true}).click()
 await expect(page.locator('[data-gallery-image]')).toHaveAttribute('alt',/view 2/)
 await page.getByRole('button',{name:'Sand',exact:true}).click()
 await page.getByRole('button',{name:'Add to Cart',exact:true}).click()
 await expect(page.getByRole('dialog')).toContainText('Sand')
 await closeBag(page)
 await page.getByRole('button',{name:'Go to review 2 of 4: Theo Larsen',exact:true}).click()
 await expect(page.getByRole('button',{name:'Play reviews',exact:true})).toBeVisible()
 await expect(page.getByRole('blockquote')).toContainText('folding shape')
})

test('spec detail calculates a multi-unit selected connector order and validates a new review',async({page})=>{
 await open(page,'product-detail',3)
 await page.getByRole('button',{name:'Lightning',exact:true}).click()
 await page.getByRole('button',{name:'Increase quantity',exact:true}).click()
 await page.getByRole('button',{name:'Increase quantity',exact:true}).click()
 await page.getByRole('button',{name:'Add to Cart',exact:true}).click()
 await expect(page.getByRole('dialog')).toContainText('Graphite · Lightning')
 await expect(page.getByRole('dialog')).toContainText('$1,047.00')
 await closeBag(page)
 await page.getByRole('button',{name:'Write A Review',exact:true}).click()
 await page.getByLabel('Your name',{exact:true}).fill('Product QA')
 await page.getByLabel('Your review',{exact:true}).fill('Comfortable during long studio sessions.')
 await page.getByRole('button',{name:'Submit review',exact:true}).click()
 await expect(page.getByRole('dialog')).toContainText('Thank you for your review')
})

test('ebook format changes price and package; preview and original free sample are readable',async({page})=>{
 await open(page,'product-detail',4)
 await page.getByRole('button',{name:'Ebook',exact:true}).click()
 await page.getByRole('button',{name:'Add to Bag',exact:true}).click()
 await expect(page.getByRole('dialog')).toContainText('$19.00')
 await closeBag(page)
 await page.getByRole('button',{name:'Complete Bundle',exact:true}).click()
 await page.getByRole('button',{name:'Added to Bag',exact:true}).click()
 await expect(page.getByRole('dialog')).toContainText('Complete Bundle')
 await expect(page.getByRole('dialog')).toContainText('$49.00')
 await closeBag(page)
 await page.getByRole('button',{name:'Show Workbook preview',exact:true}).click()
 await expect(page.locator('[data-gallery-image]')).toHaveAttribute('alt',/view 4/)
 await page.getByRole('button',{name:'Read The Full Sample, Free',exact:true}).click()
 await expect(page.getByRole('dialog')).toContainText('Begin with a blank page')
})

test('compact buy box caps inventory and clamps quantity when changing color before demo checkout',async({page})=>{
 await open(page,'product-detail',5)
 const plus=page.getByRole('button',{name:'Increase quantity',exact:true})
 for(let i=0;i<3;i++)await plus.click()
 await expect(plus).toBeDisabled()
 await expect(page.getByLabel('Quantity',{exact:true})).toHaveValue('4')
 await page.getByRole('button',{name:'Cobalt',exact:true}).click()
 await expect(page.getByLabel('Quantity',{exact:true})).toHaveValue('2')
 await expect(plus).toBeDisabled()
 await page.getByRole('button',{name:'Size 500 ml (2 cups)',exact:true}).click()
 await page.getByRole('button',{name:'Buy Now',exact:true}).click()
 await expect(page.getByRole('dialog')).toContainText('Cobalt · 500 ml · Quantity 2')
 await expect(page.getByRole('dialog')).toContainText('$178.00')
 await page.getByRole('button',{name:'Confirm demo order',exact:true}).click()
 await expect(page.getByRole('dialog')).toContainText('Order preview confirmed')
})

test('single-column detail updates bag image and capacity, observes stock limit, and selects review segments',async({page})=>{
 await open(page,'product-detail',6)
 const image=page.locator('[data-gallery-image]'),before=await image.getAttribute('src')
 await page.getByRole('button',{name:'Charcoal',exact:true}).click()
 await expect(image).not.toHaveAttribute('src',before!)
 await page.getByRole('button',{name:'Size 24 L (Travel)',exact:true}).click()
 for(let i=0;i<2;i++)await page.getByRole('button',{name:'Increase quantity',exact:true}).click()
 await expect(page.getByRole('button',{name:'Increase quantity',exact:true})).toBeDisabled()
 await page.getByRole('button',{name:'Add to Cart',exact:true}).click()
 await expect(page.getByRole('dialog')).toContainText('Charcoal · 24 L')
 await expect(page.getByRole('dialog')).toContainText('$1,035.00')
 await closeBag(page)
 await page.getByRole('button',{name:'Go to review 2 of 5: Ines Carbone',exact:true}).click()
 await expect(page.getByRole('blockquote')).toContainText('rainy weekend')
})

for(const n of [1,2])test(`swatch grid ${n} changes the actual image and keeps independent wishlist state`,async({page})=>{
 await open(page,'product-grid',n)
 const tile=page.locator('[data-product="Wayfarer Daypack"]'),photo=tile.getByRole('img').first(),before=await photo.getAttribute('src')
 await tile.getByRole('button',{name:'Sand',exact:true}).click()
 await expect(photo).not.toHaveAttribute('src',before!)
 await expect(tile.getByRole('status')).toHaveText('Sand')
 await tile.getByRole('button',{name:'Sand',exact:true}).focus()
 await tile.getByRole('button',{name:'Add Wayfarer Daypack to wishlist',exact:true}).click()
 await expect(tile.getByRole('button',{name:'Remove Wayfarer Daypack from wishlist',exact:true})).toHaveAttribute('aria-pressed','true')
 await expect(page.getByRole('button',{name:'Remove Saddle Tote from wishlist',exact:true})).toHaveAttribute('aria-pressed','true')
})

test('cart grid adds the chosen item and opens its linked review count',async({page})=>{
 await open(page,'product-grid',3)
 const tile=page.locator('[data-product="Wayfarer Daypack"]')
 await tile.getByRole('button',{name:'Add to Cart',exact:true}).click()
 await expect(page.getByRole('dialog')).toContainText('Wayfarer Daypack')
 await closeBag(page)
 await tile.getByRole('button',{name:'(412)',exact:true}).click()
 await expect(page.getByRole('dialog')).toContainText('Wayfarer Daypack · Reviews')
})

test('numbered story grid preserves independent seeded wishlist toggles and six spec stories',async({page})=>{
 await open(page,'product-grid',4)
 await expect(page.locator('[data-product]')).toHaveCount(6)
 const mug=page.locator('[data-product="Hand-Thrown Stoneware Mug"]')
 await expect(mug).toContainText('1280°C')
 await mug.getByRole('button',{name:'Remove Hand-Thrown Stoneware Mug from wishlist',exact:true}).click()
 await expect(mug.getByRole('button',{name:'Add Hand-Thrown Stoneware Mug to wishlist',exact:true})).toHaveAttribute('aria-pressed','false')
})

test('quick size grid reveals buy controls, rejects sold-out sizes and adds the chosen available size',async({page})=>{
 await open(page,'product-grid',5)
 const tile=page.locator('[data-product="Compass Down Vest"]')
 await tile.getByRole('button',{name:'Remove Compass Down Vest from wishlist',exact:true}).focus()
 await expect(tile.getByRole('button',{name:'Compass Down Vest size M, sold out',exact:true})).toBeDisabled()
 await expect(tile.getByRole('button',{name:'Select Size',exact:true})).toBeDisabled()
 await tile.getByRole('button',{name:'Compass Down Vest size S',exact:true}).click()
 await tile.getByRole('button',{name:'Add to Bag',exact:true}).click()
 await expect(page.getByRole('dialog')).toContainText('Compass Down Vest')
 await expect(page.getByRole('dialog')).toContainText('Size S')
})

test('look grid cross-fades on focus, expands swatches, saves a look and opens a local outfit',async({page})=>{
 await open(page,'product-grid',6)
 const tile=page.locator('[data-product="Linen Field Shirt"]')
 await tile.getByLabel('Linen Field Shirt look',{exact:true}).focus()
 await expect(tile.locator('[data-lifestyle-shot]')).toHaveCSS('opacity','1')
 const palette=tile.getByRole('button',{name:'Show Linen Field Shirt colors: Sand, Ivory, Olive, Navy',exact:true})
 await palette.focus();await palette.press('Enter')
 await tile.getByRole('button',{name:'Linen Field Shirt in Olive',exact:true}).click()
 await expect(tile.getByRole('button',{name:'Linen Field Shirt in Olive',exact:true})).toHaveAttribute('aria-pressed','true')
 await tile.getByRole('button',{name:'Remove Linen Field Shirt from list',exact:true}).click()
 await expect(tile.getByRole('button',{name:'Add Linen Field Shirt to list',exact:true})).toHaveAttribute('aria-pressed','false')
 await tile.getByRole('button',{name:'Shop The Look · 4 items',exact:true}).click()
 await expect(page.getByRole('dialog')).toContainText('Shop The Look · Linen Field Shirt')
 await expect(page.getByRole('dialog').getByRole('heading',{level:3})).toHaveCount(4)
})

for(const category of ['product-detail','product-grid'])for(let n=1;n<=6;n++)test(`${category}-${n} fits a 390px viewport with decoded local photography`,async({page})=>{
 await page.setViewportSize({width:390,height:844});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 await open(page,category,n)
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
 const images=page.locator('.isolated-preview img')
 await images.evaluateAll(async images=>{await Promise.all(images.map(async image=>{const img=image as HTMLImageElement;img.loading='eager';try{await img.decode()}catch{}}))})
 const broken=await images.evaluateAll(images=>images.filter(image=>(image as HTMLImageElement).naturalWidth===0).length)
 expect(broken).toBe(0);expect(errors).toEqual([])
})


test('real source ZIP includes nested detail/grid photographs and attribution',async({page})=>{
 await page.goto('./#/block/ecommerce/product-detail/product-detail-4')
 const download=page.waitForEvent('download')
 await page.getByRole('button',{name:'Download source',exact:true}).click()
 const file=await download
 expect(file.suggestedFilename()).toBe('product-detail-4.zip')
 const entries=unzipSync(new Uint8Array(await readFile((await file.path())!)))
 const root='src/blocks/commerce/assets/detail-grid/'
 for(const name of ['coffee','coffee-pour','books','reading','library','ceramics','bag-slate','bag-tan'])expect(entries[root+name+'.jpg']?.length).toBeGreaterThan(2000)
 expect(entries[root+'ATTRIBUTION.md']?.length).toBeGreaterThan(100)
 expect(entries['src/blocks/commerce/product-details.tsx']).toBeDefined()
 expect(entries['src/blocks/commerce/product-grids.tsx']).toBeDefined()
 for(const component of ['rating','frame','badge','number-field'])expect(entries[`src/components/reui/${component}.tsx`]).toBeDefined()
 expect(entries['src/components/reui/REUI-LICENSE.txt']?.length).toBeGreaterThan(500)
})


test('official free Rating keeps fractional fills and original editable hover/click behavior',async({page})=>{
 await open(page,'product-detail',1)
 const readonly=page.locator('[data-slot="rating"]').first()
 await expect(readonly.locator('[data-slot="rating-star-filled"]').nth(4).locator('..')).toHaveAttribute('style',/width: 50%/)
 await page.getByRole('tab',{name:'Reviews',exact:true}).click()
 await page.getByRole('button',{name:'Write A Review',exact:true}).click()
 const rating=page.getByLabel('Your rating',{exact:true})
 await rating.getByRole('button',{name:'Rate 3 out of 5 stars',exact:true}).hover()
 await expect(rating.locator('[data-slot="rating-value"]')).toHaveText('3.0')
 await page.getByLabel('Your name',{exact:true}).hover()
 await expect(rating.locator('[data-slot="rating-value"]')).toHaveText('5.0')
 await rating.getByRole('button',{name:'Rate 4 out of 5 stars',exact:true}).click()
 await page.getByLabel('Your name',{exact:true}).hover()
 await expect(rating.locator('[data-slot="rating-value"]')).toHaveText('4.0')
 await rating.getByRole('button',{name:'Rate 2 out of 5 stars',exact:true}).focus()
 await page.keyboard.press('Enter')
 await expect(rating.locator('[data-slot="rating-value"]')).toHaveText('2.0')
})

test('official free Frame provides inherited panel spacing/radius in stacked panel grid',async({page})=>{
 await open(page,'product-grid',2)
 const frame=page.locator('[data-product="Wayfarer Daypack"][data-slot="frame"]')
 await expect(frame.locator(':scope > [data-slot="frame-panel"]')).toHaveCount(2)
 await expect(frame).toHaveAttribute('data-spacing','default')
 const metrics=await frame.locator('[data-slot="frame-panel"]').first().evaluate(element=>({radius:getComputedStyle(element).borderTopLeftRadius,background:getComputedStyle(element).backgroundColor}))
 expect(parseFloat(metrics.radius)).toBeGreaterThan(0)
 expect(metrics.background).not.toBe('rgba(0, 0, 0, 0)')
})

test('official free NumberField accepts keyboard steps and respects inventory limits',async({page})=>{
 await open(page,'product-detail',5)
 const quantity=page.getByRole('textbox',{name:'Quantity',exact:true})
 await quantity.focus();await page.keyboard.press('ArrowUp')
 await expect(quantity).toHaveValue('2')
 await quantity.fill('99');await quantity.blur()
 await expect(quantity).toHaveValue('4')
 await expect(page.getByRole('button',{name:'Increase quantity',exact:true})).toBeDisabled()
})

test('quick-buy product card retains size/carousel/bag behavior inside official Frame',async({page})=>{
 await open(page,'product-card',3)
 await expect(page.locator('[data-slot="frame"] > [data-slot="frame-panel"]')).toHaveCount(1)
 await page.getByRole('button',{name:'Next slide',exact:true}).click()
 await expect(page.getByRole('img',{name:'Ribbed tank set alternative view',exact:true})).toBeVisible()
 await page.getByRole('radio',{name:'XS',exact:true}).click()
 await page.getByRole('button',{name:'Add to Bag',exact:true}).click()
 await expect(page.getByRole('button',{name:'Added · Size XS',exact:true})).toBeVisible()
})

test('featured product card retains finish/bag/specs and fractional Rating inside official Frame',async({page})=>{
 await open(page,'product-card',5)
 await expect(page.locator('[data-slot="frame"] > [data-slot="frame-panel"]')).toHaveCount(1)
 await expect(page.locator('[data-slot="rating-value"]')).toHaveText('4.7')
 await page.getByRole('radio',{name:'Sand',exact:true}).click()
 await page.getByRole('button',{name:'Add to Bag',exact:true}).click()
 await expect(page.getByRole('button',{name:'Sand added',exact:true})).toBeVisible()
 await page.getByRole('button',{name:'Tech Specs',exact:true}).click()
 await expect(page.getByRole('dialog')).toContainText('Selected finishSand')
})

test('rated product cards consume official fractional Rating and retain per-product cart feedback',async({page})=>{
 await open(page,'product-card',8)
 await expect(page.locator('[data-slot="rating"]')).toHaveCount(4)
 await expect(page.locator('[data-slot="rating-value"]').first()).toHaveText('4.7')
 await page.getByRole('button',{name:'Add Auralite Pods to cart',exact:true}).click()
 await expect(page.getByRole('button',{name:'Added Auralite Pods to cart',exact:true})).toBeVisible()
})

test('all ten Product Card compositions fit 390px after official Badge/Frame/Rating migration',async({page})=>{
 test.setTimeout(60000)
 await page.setViewportSize({width:390,height:844})
 for(let n=1;n<=10;n++){
  await open(page,'product-card',n)
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
 }
})
