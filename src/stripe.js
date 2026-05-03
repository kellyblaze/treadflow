export const plans = [
  {
    name: 'Early Partner',
    price: 149,
    paymentLink: 'https://buy.stripe.com/test_28EdR85bp3oDczze9K8so02',
    features: ['Online tire storefront', 'Inventory dashboard', 'Online reservations', 'Order management', 'Basic SEO pages', 'Email notifications']
  },
  {
    name: 'Growth Partner',
    price: 249,
    paymentLink: 'https://buy.stripe.com/test_eVq00i47l9N17ff6Hi8so01',
    features: ['Everything in Early Partner', 'Online deposits/payments', 'Appointment booking', 'CSV inventory upload', 'Staff accounts', 'SMS notifications']
  },
  {
    name: 'Market Leader',
    price: 399,
    paymentLink: 'https://buy.stripe.com/test_5kQbJ033hcZd4333v68so00',
    features: ['Everything in Growth', 'AI chatbot', 'Custom domain support', 'Promotions & coupons', 'Advanced reporting', 'Multi-location support']
  }
]

export const redirectToCheckout = (paymentLink) => {
  console.log('Payment link:', paymentLink)
  window.location.href = paymentLink
}