/* eslint-disable consistent-return */
const { DateTime } = require('luxon');
const { groupBy, range } = require('lodash');
const User = require('../../models/user');
const ProductCategory = require('../../models/product/category');
const Product = require('../../models/product');
const Order = require('../../models/order');
const utils = require('../../utils');
const collate = require('../../utils/collate.js');

const productActions = {
  Category: {
    async scopeRequest(req, res, next) {
      try {
        const category = await ProductCategory.findOne({
          merchant: req.params.id,
          _id: req.params.categoryId,
        }).populate({
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        });

        if (!category) {
          return res.status(404).send('This product category does not exist');
        }

        req.scopedCategory = category;
        return next();
      } catch (err) {
        return next(err);
      }
    },

    async create(req, res, next) {
      const category = new ProductCategory({
        ...req.body,
        merchant: req.params.id,
      });

      try {
        const savedCategory = await category.save();

        return res.success(savedCategory);
      } catch (err) {
        return next(err);
      }
    },

    showOne: (req, res) => res.success(req.scopedCategory),

    async showAll(req, res, next) {
      const queryOptions = {
        merchant: req.params.id,
        populate: [
          {
            path: 'merchant',
            model: User,
            select: '-password -deleted',
          },
        ],
      };
      try {
        const products = await utils.PaginateRequest(
          req,
          queryOptions,
          ProductCategory,
        );
        res.success(products);
      } catch (err) {
        next(err);
      }
    },

    async update(req, res, next) {
      try {
        await req.scopedCategory.update({
          ...req.body,
          updatedAt: new Date(),
        });

        const newCategory = await ProductCategory.findOne({
          merchant: req.params.id,
          _id: req.params.categoryId,
        }).populate({
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        });

        return res.success(newCategory);
      } catch (err) {
        return next(err);
      }
    },

    async delete(req, res, next) {
      try {
        const products = await Product.find({
          category: req.scopedCategory.id,
        });
        if (products.length > 0) {
          return res.badRequest('This category still contains products');
        }
        await req.scopedCategory.remove();
        return res.success();
      } catch (err) {
        return next(err);
      }
    },
  },

  SubProduct: {
    async create(req, res, next) {
      req.scopedProduct.subProducts.push(req.body);
      try {
        const product = await req.scopedProduct.save();
        return res.success(product.subProducts[product.subProducts.length - 1]);
      } catch (err) {
        return next(err);
      }
    },

    async update(req, res, next) {
      const {
        name,
        description,
        priceDifference,
        unitsAvailablePerDay,
      } = req.body;
      const subProduct = req.scopedProduct.subProducts.id(
        req.params.subProductId,
      );

      if (name) subProduct.name = name;
      if (description) subProduct.description = description;
      if (priceDifference) subProduct.priceDifference = priceDifference;
      if (unitsAvailablePerDay) {
        subProduct.unitsAvailablePerDay = unitsAvailablePerDay;
      }
      subProduct.updatedAt = new Date();

      req.scopedProduct.updatedAt = subProduct.updatedAt;

      try {
        const updatedProduct = await req.scopedProduct.save();

        return res.success(
          updatedProduct.subProducts.id(req.params.subProductId),
        );
      } catch (err) {
        return next(err);
      }
    },

    async delete(req, res, next) {
      try {
        req.scopedProduct.subProducts.id(req.params.subProductId).remove();
        await req.scopedProduct.save();
        res.success();
      } catch (err) {
        next(err);
      }
    },
  },

  ComboProduct: {
    async scopeRequest(req, res, next) {
      try {
        const product = await Product.findOne({
          type: 'combo',
          merchant: req.params.id,
          _id: req.params.productId,
        })
          .populate({
            path: 'merchant',
            model: User,
            select: '-password -deleted',
          })
          .populate({
            path: 'comboProducts.product',
            model: Product,
          })
          .populate({
            path: 'category',
            model: ProductCategory,
          });

        if (!product) {
          return res.status(404).send('This product does not exist');
        }

        req.scopedProduct = product;
        return next();
      } catch (err) {
        return next(err);
      }
    },

    async create(req, res, next) {
      const comboProduct = new Product({
        ...req.body,
        type: 'combo',
        merchant: req.params.id,
      });

      try {
        const savedProduct = await comboProduct.save();

        const fullProduct = await Product.findOne(savedProduct).populate({
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        });

        return res.success(fullProduct);
      } catch (err) {
        return next(err);
      }
    },

    async showAll(req, res, next) {
      const queryOptions = {
        merchant: req.params.id,
        type: 'combo',
        populate: [
          {
            path: 'merchant',
            model: User,
            select: '-password -deleted',
          },
          {
            path: 'comboProducts.product',
            model: Product,
          },
          {
            path: 'category',
            model: ProductCategory,
          },
        ],
      };
      const {
        name, amount, category, startDate, endDate,
      } = req.query;
      if (name) {
        queryOptions.name = new RegExp(name, 'i');
      }
      if (amount) {
        queryOptions.price = amount;
      }
      if (category) {
        queryOptions.category = category;
      }
      if (startDate && endDate) {
        queryOptions.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
      try {
        const products = await utils.PaginateRequest(
          req,
          queryOptions,
          Product,
        );

        res.success(products);
      } catch (err) {
        next(err);
      }
    },

    async update(req, res, next) {
      try {
        await req.scopedProduct.update({
          ...req.body,
          updatedAt: new Date(),
        });

        const product = await Product.findById(req.params.productId).populate({
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        });

        return res.success(product);
      } catch (err) {
        return next(err);
      }
    },
  },

  async scopeRequest(req, res, next) {
    try {
      const product = await Product.findOne({
        merchant: req.params.id,
        _id: req.params.productId,
      })
        .populate({
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        })
        .populate({
          path: 'category',
          model: ProductCategory,
        });

      if (!product) {
        return res.status(404).send('This product does not exist');
      }

      req.scopedProduct = product;
      return next();
    } catch (err) {
      return next(err);
    }
  },

  async createInCategory(req, res, next) {
    const product = new Product({
      ...req.body,
      type: 'single',
      category: req.params.categoryId,
      merchant: req.params.id,
    });

    try {
      const savedProduct = await product.save();

      return res.success(savedProduct);
    } catch (err) {
      return next(err);
    }
  },

  showOne: (req, res) => res.success(req.scopedProduct),

  async showAllInCategory(req, res, next) {
    const queryOptions = {
      merchant: req.params.id,
      category: req.params.categoryId,
      populate: [
        {
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        },
        {
          path: 'category',
          model: ProductCategory,
        },
      ],
    };
    try {
      const products = await utils.PaginateRequest(req, queryOptions, Product);
      res.success(products);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      await req.scopedProduct.update({
        ...req.body,
        updatedAt: new Date(),
      });

      const product = await Product.findById(req.params.productId)
        .populate({
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        })
        .populate({
          path: 'category',
          model: ProductCategory,
        });

      return res.success(product);
    } catch (err) {
      return next(err);
    }
  },

  async showStats(req, res, next) {
    const { productType } = req.query;
    const queryOptions = {
      merchant: req.params.id,
    };

    if (productType) {
      const isValidType = ['single', 'combo'].includes(productType);
      if (!isValidType) {
        return res.badRequest('Invalid product type');
      }
      queryOptions.type = productType;
    }

    try {
      const products = await Product.find(queryOptions, '_id name type');

      const stats = await Promise.all(
        products.map(async (product) => {
          const orders = await Order.find({
            'payment.status': 'success',
            'items.product': { $in: [product.id] },
          });

          const unitsOrdered = orders.reduce(
            (total, { items }) => total
              + items
                .filter(item => String(item.product) === String(product.id))
                .reduce(
                  (unitsInOrder, { count = 1 }) => unitsInOrder + count,
                  0,
                ),
            0,
          );

          return {
            // eslint-disable-next-line no-underscore-dangle
            ...product._doc,
            unitsOrdered,
          };
        }),
      );

      res.success(stats);
    } catch (err) {
      next(err);
    }
  },

  async showCategoryStats(req, res, next) {
    const { productType } = req.query;

    try {
      const categories = await ProductCategory.find(
        {
          merchant: req.params.id,
        },
        '_id name createdAt',
      );

      const collection = [];

      await Promise.all(
        categories.map(async (category) => {
          const queryOptions = {
            merchant: req.params.id,
            category: category.id,
          };

          if (productType) {
            const isValidType = ['single', 'combo'].includes(productType);
            if (!isValidType) {
              return res.badRequest('Invalid product type');
            }
            queryOptions.type = productType;
          }
          const products = await Product.find(
            queryOptions,
            '_id name type createdAt',
          );

          const categoryCreationYear = DateTime.fromJSDate(category.createdAt)
            .year;
          const currentYear = new DateTime('now').year;
          const categoryYears = currentYear > categoryCreationYear
            ? range(categoryCreationYear, currentYear)
            : [currentYear];

          categoryYears.map(categoryYear => collection.push({
            // eslint-disable-next-line no-underscore-dangle
            ...category._doc,
            year: categoryYear,
            unitsOrdered: 0,
          }));

          await Promise.all(
            products.map(async (product) => {
              const orders = await Order.find({
                'payment.status': 'success',
                'items.product': { $in: [product.id] },
              });

              const refinedOrders = orders.map(order => ({
                items: order.items,
                year: DateTime.fromJSDate(order.createdAt).year,
              }));

              const refinedOrdersByYear = groupBy(refinedOrders, 'year');

              const unitsOrderedByYear = [];
              Object.keys(refinedOrdersByYear).map((year) => {
                const yearOrders = refinedOrdersByYear[year];
                const unitsOrdered = yearOrders.reduce(
                  (total, { items }) => total
                    + items
                      .filter(
                        item => String(item.product) === String(product.id),
                      )
                      .reduce(
                        (unitsInOrder, { count = 1 }) => unitsInOrder + count,
                        0,
                      ),
                  0,
                );

                return unitsOrderedByYear.push({ year, unitsOrdered });
              });

              const productCreationYear = DateTime.fromJSDate(product.createdAt)
                .year;
              const productYears = currentYear > productCreationYear
                ? range(productCreationYear, currentYear)
                : [currentYear];

              productYears
                .filter(
                  productYear => !unitsOrderedByYear
                    .map(({ year }) => year)
                    .includes(productYear),
                )
                .map(productYear => collection.push({
                  // eslint-disable-next-line no-underscore-dangle
                  ...category._doc,
                  year: productYear,
                  unitsOrdered: 0,
                }));

              return unitsOrderedByYear.forEach((data) => {
                collection.push({
                  // eslint-disable-next-line no-underscore-dangle
                  ...category._doc,
                  ...data,
                });
              });
            }),
          );
        }),
      );

      const cols = collection.map(({ _id, name, unitsOrdered }) => ({
        _id,
        name,
        unitsOrdered,
        sort: _id,
      }));

      const sortedCols = groupBy(cols, 'sort');

      const stats = [];

      Object.keys(sortedCols).forEach((key) => {
        stats.push(
          sortedCols[key].reduce(
            (
              { unitsOrdered: totalUnitsOrdered },
              {
                _id, name, year, unitsOrdered,
              },
            ) => ({
              _id,
              name,
              year,
              unitsOrdered: totalUnitsOrdered + unitsOrdered,
            }),
            { unitsOrdered: 0 },
          ),
        );
      });

      res.success(stats);
    } catch (err) {
      next(err);
    }
  },

  async showCategoryStatsByYear(req, res, next) {
    const queryOptions = {
      merchant: req.params.id,
    };

    try {
      const categories = await ProductCategory.find(
        queryOptions,
        '_id name createdAt',
      );

      const collection = [];

      await Promise.all(
        categories.map(async (category) => {
          const products = await Product.find(
            {
              merchant: req.params.id,
              category: category.id,
            },
            '_id name type createdAt',
          );

          const categoryCreationYear = DateTime.fromJSDate(category.createdAt)
            .year;
          const currentYear = new DateTime('now').year;
          const categoryYears = currentYear > categoryCreationYear
            ? range(categoryCreationYear, currentYear)
            : [currentYear];

          categoryYears.map(categoryYear => collection.push({
            // eslint-disable-next-line no-underscore-dangle
            ...category._doc,
            year: categoryYear,
            unitsOrdered: 0,
          }));

          await Promise.all(
            products.map(async (product) => {
              const orders = await Order.find({
                'payment.status': 'success',
                'items.product': { $in: [product.id] },
              });

              const refinedOrders = orders.map(order => ({
                items: order.items,
                year: DateTime.fromJSDate(order.createdAt).year,
              }));

              const refinedOrdersByYear = groupBy(refinedOrders, 'year');

              const unitsOrderedByYear = [];
              Object.keys(refinedOrdersByYear).map((year) => {
                const yearOrders = refinedOrdersByYear[year];
                const unitsOrdered = yearOrders.reduce(
                  (total, { items }) => total
                    + items
                      .filter(
                        item => String(item.product) === String(product.id),
                      )
                      .reduce(
                        (unitsInOrder, { count = 1 }) => unitsInOrder + count,
                        0,
                      ),
                  0,
                );

                return unitsOrderedByYear.push({ year, unitsOrdered });
              });

              const productCreationYear = DateTime.fromJSDate(product.createdAt)
                .year;
              const productYears = currentYear > productCreationYear
                ? range(productCreationYear, currentYear)
                : [currentYear];

              productYears
                .filter(
                  productYear => !unitsOrderedByYear
                    .map(({ year }) => year)
                    .includes(productYear),
                )
                .map(productYear => collection.push({
                  // eslint-disable-next-line no-underscore-dangle
                  ...category._doc,
                  year: productYear,
                  unitsOrdered: 0,
                }));

              return unitsOrderedByYear.forEach((data) => {
                collection.push({
                  // eslint-disable-next-line no-underscore-dangle
                  ...category._doc,
                  ...data,
                });
              });
            }),
          );
        }),
      );

      const cols = collection.map(({
        _id, name, year, unitsOrdered,
      }) => ({
        _id,
        name,
        year,
        unitsOrdered,
        sort: _id + year,
      }));

      const sortedCols = groupBy(cols, 'sort');

      const midStats = [];

      Object.keys(sortedCols).forEach((key) => {
        midStats.push(
          sortedCols[key].reduce(
            (
              { unitsOrdered: totalUnitsOrdered },
              {
                _id, name, year, unitsOrdered,
              },
            ) => ({
              _id,
              name,
              year,
              unitsOrdered: totalUnitsOrdered + unitsOrdered,
            }),
            { unitsOrdered: 0 },
          ),
        );
      });

      const stats = groupBy(midStats, 'year');

      res.success(stats);
    } catch (err) {
      next(err);
    }
  },

  async showProductStatsByYear(req, res, next) {
    const { productType } = req.query;
    const queryOptions = {
      merchant: req.params.id,
    };

    if (productType) {
      const isValidType = ['single', 'combo'].includes(productType);
      if (!isValidType) {
        return res.badRequest('Invalid product type');
      }
      queryOptions.type = productType;
    }

    try {
      const products = await Product.find(
        queryOptions,
        '_id name type createdAt',
      );

      const collection = [];
      await Promise.all(
        products.map(async (product) => {
          const orders = await Order.find({
            'payment.status': 'success',
            'items.product': { $in: [product.id] },
          });

          const refinedOrders = orders.map(order => ({
            items: order.items,
            year: DateTime.fromJSDate(order.createdAt).year,
          }));

          const refinedOrdersByYear = groupBy(refinedOrders, 'year');

          const unitsOrderedByYear = [];
          Object.keys(refinedOrdersByYear).map((year) => {
            const yearOrders = refinedOrdersByYear[year];
            const unitsOrdered = yearOrders.reduce(
              (total, { items }) => total
                + items
                  .filter(item => String(item.product) === String(product.id))
                  .reduce(
                    (unitsInOrder, { count = 1 }) => unitsInOrder + count,
                    0,
                  ),
              0,
            );

            return unitsOrderedByYear.push({ year, unitsOrdered });
          });

          const productCreationYear = DateTime.fromJSDate(product.createdAt)
            .year;
          const currentYear = new DateTime('now').year;
          const productYears = currentYear > productCreationYear
            ? range(productCreationYear, currentYear)
            : [currentYear];

          productYears
            .filter(
              productYear => !unitsOrderedByYear
                .map(({ year }) => year)
                .includes(productYear),
            )
            .map(productYear => collection.push({
              // eslint-disable-next-line no-underscore-dangle
              ...product._doc,
              year: productYear,
              unitsOrdered: 0,
            }));

          return unitsOrderedByYear.forEach((data) => {
            collection.push({
              // eslint-disable-next-line no-underscore-dangle
              ...product._doc,
              ...data,
            });
          });
        }),
      );

      const stats = groupBy(collection, 'year');

      res.success(stats);
    } catch (err) {
      next(err);
    }
  },

  async showStat(req, res, next) {
    const { productId } = req.params;
    const [product, orders] = await Promise.all([
      Product.findById(productId),
      Order.find(
        { 'items.product': { $in: [productId] }, 'payment.status': 'success' },
        null,
        {
          sort: { $natural: 1 },
        },
      ),
    ]);

    try {
      const data = [];
      orders.map(order => order.items
        .filter(item => String(item.product) === String(product.id))
        .map(async ({ subProduct, count = 1 }) => {
          let itemPrice;

          if (subProduct) {
            const subProductPrice = product.price
                + product.subProducts.id(subProduct).priceDifference;
            itemPrice = subProductPrice * count;
          } else {
            itemPrice = product.price * count;
          }

          const { month, year } = DateTime.fromJSDate(order.createdAt);

          data.push({
            month,
            year,
            period: `${year}${month}`,
            amount: itemPrice,
          });
        }));

      const revenueStats = collate(data);

      res.success({
        product,
        stats: revenueStats,
      });
    } catch (err) {
      next(err);
    }
  },

  async showStock(req, res, next) {
    try {
      const products = await Product.find({
        merchant: req.params.id,
      });

      const stats = await Promise.all(
        products.map(async (product) => {
          const orders = await Order.find({
            'items.product': product.id,
            createdAt: {
              $gte: DateTime.local()
                .startOf('day')
                .toJSDate(),
              $lte: DateTime.local()
                .endOf('day')
                .toJSDate(),
            },
          });

          const totalAvailable = product.unitsAvailablePerDay;

          const totalSold = orders
            .map(order => order.items
              .filter(item => String(item.product) === String(product.id))
              .reduce((total, { count = 1 }) => total + count, 0))
            .reduce((total, count = 1) => total + count, 0);

          return {
            product,
            totalAvailable,
            totalSold,
          };
        }),
      );

      res.success(stats);
    } catch (err) {
      next(err);
    }
  },

  async showAll(req, res, next) {
    const queryOptions = {
      merchant: req.params.id,
      type: 'single',
      populate: [
        {
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        },
        {
          path: 'category',
          model: ProductCategory,
        },
      ],
    };
    const {
      name, amount, category, startDate, endDate,
    } = req.query;
    if (name) {
      queryOptions.name = new RegExp(name, 'i');
    }
    if (amount) {
      queryOptions.price = amount;
    }
    if (category) {
      queryOptions.category = category;
    }
    if (startDate && endDate) {
      queryOptions.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    try {
      const products = await utils.PaginateRequest(req, queryOptions, Product);
      res.success(products);
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await req.scopedProduct.remove();
      res.success();
    } catch (err) {
      next(err);
    }
  },
};

module.exports = productActions;
