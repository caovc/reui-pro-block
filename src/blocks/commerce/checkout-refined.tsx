import type { BlockProps } from '@/data/types'
import { FourStepCheckout } from './checkout-shared'
import { AICreditCheckout, ExpressCheckout, OnePageCheckout, SocialCheckout } from './checkout-specialized'
export function CheckoutRefined({block}:BlockProps){switch(block.index){case 2:return <AICreditCheckout/>;case 3:return <ExpressCheckout/>;case 5:return <OnePageCheckout/>;case 6:return <SocialCheckout/>;case 1:return <FourStepCheckout variant={2}/>;case 4:return <FourStepCheckout variant={5}/>;default:return <FourStepCheckout variant={1}/>}}
export default CheckoutRefined
