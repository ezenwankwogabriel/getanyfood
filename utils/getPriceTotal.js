const Product = require('../models/product');
const Setting = require('../models/setting');
const User = require('../models/user');

async function getPriceTotal(order) {
  const [merchant, settings] = await Promise.all([
    User.findById(order.merchant),
    Setting.findOne(),
  ]);
  let { deliveryCharge } = settings;
  if (merchant.delivery.method === 'self') deliveryCharge = merchant.delivery.price;

  const prices = await Promise.all(
    order.items.map(async (item) => {
      const product = await Product.findById(item.product);

      if (product.type === 'combo') {
        const discount = product.discount || 0;
        const itemPrices = await Promise.all(
          product.comboProducts.map(
            async ({ product: productId, subProduct, count = 1 }) => {
              const { type, price, subProducts } = await Product.findById(
                productId,
              );
              if (type === 'combo') {
                throw new Error('Cannot nest combo products');
              }
              if (subProduct) {
                const { priceDifference } = subProducts.id(subProduct);
                return (price + priceDifference) * count;
              }
              return price * count;
            },
          ),
        );

        const comboPrice = itemPrices.reduce((total, value) => total + value, 0)
          * ((100 - discount) / 100);

        return comboPrice * item.count;
      }

      if (item.subProduct) {
        const subProduct = product.subProducts.id(item.subProduct);
        return (product.price + subProduct.priceDifference) * item.count;
      }

      return product.price * item.count;
    }),
  );
  const priceTotal = prices.reduce((total, price) => total + price, 0) + deliveryCharge;

  return priceTotal;
}
module.exports = getPriceTotal;
