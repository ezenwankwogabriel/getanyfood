function charges(order) {
  const revenue = order.priceTotal;
  const deliveryCharge = order.delivery.method === 'self' ? 0 : order.delivery.charge;
  const taxable = order.delivery.method === 'self'
    ? order.priceTotal
    : order.priceTotal - deliveryCharge;
    console.log('taxable', (taxable * (order.servicePercentage) / 100))
  const serviceCharge = (taxable * order.servicePercentage) / 100 + deliveryCharge;
  console.log('serviceCharge', serviceCharge)

  return { revenue, deliveryCharge, serviceCharge };
}

module.exports = charges;
