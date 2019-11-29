function charges(order) {
  const revenue = order.priceTotal;
  const deliveryCharge = order.delivery.method === 'self' ? 0 : order.delivery.charge;
  const taxable = order.delivery.method === 'self'
    ? order.priceTotal
    : order.priceTotal - deliveryCharge;
  const serviceCharge = (taxable * order.servicePercentage) / 100 + deliveryCharge;

  return { revenue, deliveryCharge, serviceCharge };
}

module.exports = charges;
