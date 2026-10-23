import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
const route=(n:number)=>`./#/preview/ecommerce/shopping-cart/shopping-cart-${n}`
async function open(page:Page,n:number){await page.goto(route(n));await expect(page.locator(`[data-cart-variant="${n}"]`)).toBeVisible()}
test('save-for-later cart moves and restores real rows and quantity totals',async({page})=>{
 await open(page,1);await expect(page.locator('[data-cart-total]')).toHaveText('$735.15')
 await page.getByRole('button',{name:'Save for later',exact:true}).first().click();await expect(page.getByRole('heading',{name:'Saved for later (1)'})).toBeVisible();await expect(page.locator('[data-cart-total]')).toHaveText('$425.21')
 await page.getByRole('button',{name:'Move to cart',exact:true}).click();await expect(page.locator('[data-cart-total]')).toHaveText('$735.15')
 await page.getByRole('button',{name:'Increase quantity of Aurora Wireless Headphones',exact:true}).click();await expect(page.getByRole('textbox',{name:'Quantity of Aurora Wireless Headphones'})).toHaveValue('2')
 await page.getByRole('button',{name:'Proceed to checkout',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('No payment was processed')
})
test('delivery summary cart recalculates quantity and persists changed destination',async({page})=>{
 await open(page,2);await expect(page.locator('[data-cart-total]')).toHaveText('$117.72')
 await page.getByRole('button',{name:'Increase quantity of Glow Renewal Serum',exact:true}).click();await expect(page.locator('[data-cart-total]')).toHaveText('$143.64')
 await page.getByRole('button',{name:'Change',exact:true}).click();await page.getByLabel('City and region').fill('Queens, New York');await page.getByRole('button',{name:'Save destination'}).click();await expect(page.getByText('Queens, New York',{exact:true})).toBeVisible()
 await page.getByRole('button',{name:'Remove discount',exact:true}).click();await expect(page.locator('[data-cart-total]')).toHaveText('$159.84')
})
test('data table cart uses original free NumberField keyboard, clamping and live totals',async({page})=>{
 await open(page,3);await expect(page.getByRole('table')).toBeVisible();await expect(page.locator('[data-cart-total]')).toHaveText('$434.16')
 const qty=page.getByRole('textbox',{name:'Quantity of Atelier Tulle Blouse',exact:true});await qty.focus();await page.keyboard.press('ArrowUp');await expect(qty).toHaveValue('3');await expect(page.locator('[data-cart-total]')).toHaveText('$486.00')
 await qty.fill('30');await qty.blur();await expect(qty).toHaveValue('20');await page.getByRole('button',{name:'Remove Heritage Suede Mules',exact:true}).click();await expect(page.getByRole('row',{name:/Heritage Suede Mules/})).toHaveCount(0)
})
test('pickup cart changes per-item fulfillment and discount totals',async({page})=>{
 await open(page,4);const initial=await page.locator('[data-cart-total]').innerText();await page.getByRole('radio',{name:'Pickup for Lumen Compact Camera',exact:true}).check();await expect(page.getByText('1 ready Feb 1 · 2 ready today',{exact:true})).toBeVisible();await expect(page.locator('[data-cart-total]')).not.toHaveText(initial)
 await page.getByRole('button',{name:'Remove discount',exact:true}).click();await expect(page.getByRole('button',{name:'Apply HAPPY2026',exact:true})).toBeVisible();await page.getByRole('button',{name:'Apply HAPPY2026',exact:true}).click();await expect(page.getByText('HAPPY2026',{exact:true})).toBeVisible()
})
test('payment method cart switches descriptions, validates coupon and reviews chosen payment',async({page})=>{
 await open(page,5);await expect(page.locator('[data-cart-total]')).toHaveText('$1,158.21')
 await page.getByRole('radio',{name:'Bitcoin',exact:true}).check();await expect(page.getByText(/A Bitcoin payment request/)).toBeVisible()
 await page.getByLabel('Promo code').fill('BAD');await page.getByRole('button',{name:'Apply',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Use STUDIO50')
 await page.getByLabel('Promo code').fill('STUDIO50');await page.getByRole('button',{name:'Apply',exact:true}).click();await expect(page.getByText('STUDIO50 · $50 off',{exact:true})).toBeVisible()
 await page.getByRole('button',{name:'Checkout',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Bitcoin selected')
})
test('quick cart opens by default and keeps state through quantity removal and close/reopen',async({page})=>{
 await open(page,6);await expect(page.getByRole('dialog',{name:'Quick cart',exact:true})).toBeVisible();await expect(page.locator('[data-cart-total]')).toHaveText('$1,079.92')
 await page.getByRole('button',{name:'Remove Aurora Studio Headphones',exact:true}).click();await expect(page.getByRole('heading',{name:'Aurora Studio Headphones',exact:true})).toHaveCount(0);await expect(page.locator('[data-cart-total]')).toHaveText('$889.93')
 await page.getByRole('button',{name:'Increase quantity of Pulse Mini Bluetooth Speaker'}).click();await expect(page.getByRole('textbox',{name:'Quantity of Pulse Mini Bluetooth Speaker'})).toHaveValue('3')
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'Quick cart',exact:true})).toHaveCount(0);await page.getByRole('button',{name:/Cart 8/}).click();await expect(page.getByRole('textbox',{name:'Quantity of Pulse Mini Bluetooth Speaker'})).toHaveValue('3')
})
test('add-to-cart sheet updates free shipping, preserves quantities and removes last unit',async({page})=>{
 await open(page,7);await expect(page.getByRole('dialog')).toContainText('$27.00 away from free shipping')
 await page.getByRole('button',{name:'Increase quantity of Linen Fold Carryall Tote'}).click();await expect(page.locator('[data-cart-total]')).toHaveText('$671.00');await expect(page.getByText('Free shipping unlocked',{exact:true})).toBeVisible()
 await page.getByRole('button',{name:'Close cart',exact:true}).click();await page.getByRole('button',{name:/Open cart 7/}).click();await expect(page.getByRole('textbox',{name:'Quantity of Linen Fold Carryall Tote'})).toHaveValue('2')
 await page.getByRole('button',{name:'Remove Heritage Suede Loafers',exact:true}).click();await expect(page.getByRole('heading',{name:'Heritage Suede Loafers',exact:true})).toHaveCount(0)
 await page.getByRole('button',{name:'Checkout',exact:true}).click();await expect(page.getByRole('dialog').last()).toContainText('Your cart and selected quantities are preserved')
})
for(let n=1;n<=7;n++)test(`cart ${n} desktop composition and 390px layout fit`,async({page})=>{
 await page.setViewportSize({width:1280,height:900});await open(page,n);if(n>=6)await expect(page.getByRole('dialog')).toBeVisible()
 await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
