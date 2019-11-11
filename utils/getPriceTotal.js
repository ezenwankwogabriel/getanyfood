const Product = require('../models/product');
const User = require('../models/user');

async function getPriceTotal(order) {
  const merchant = await User.findById(order.merchant);

  const deliveryPrice = merchant.delivery.price;

  const prices = await Promise.all(
    order.items.map(async (item) => {
      const product = await Product.findById(item.product);

      if (product.type === 'combo') {
        const discount = product.discount || 0;
        const itemPrices = item.comboProducts.map((comboProduct) => {
          const group = product.comboProducts.id(comboProduct.group);
          const choice = group.options.id(comboProduct.choice);

          return choice.priceIncrement;
        });

        const choiceAdjustedPrice = itemPrices.reduce(
          (total, value) => total + value,
          product.price,
        );

        const comboPrice = choiceAdjustedPrice * ((100 - discount) / 100);

        return comboPrice * item.count;
      }

      if (item.subProduct) {
        const subProduct = product.subProducts.id(item.subProduct);
        return (product.price + subProduct.priceDifference) * item.count;
      }

      return product.price * item.count;
    }),
  );
  const priceTotal = prices.reduce((total, price) => total + price, 0) + deliveryPrice;

  return priceTotal;
}
module.exports = getPriceTotal;
