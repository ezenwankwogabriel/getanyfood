const User = require('../../models/user');
const ProductCategory = require('../../models/product/category');
const Product = require('../../models/product');

productActions = {
  Category: {
    scopeRequest: async (req, res, next) => {
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
          return res
            .status(404)
            .send('This product category does not exist');
        }

        req.scopedCategory = category;
        next();
      } catch (err) {
        next(err);
      }
    },

    create: async (req, res, next) => {
      const category = new ProductCategory({
        ...req.body,
        merchant: req.params.id,
      });

      try {
        const savedCategory = await category.save();

        return res.success(savedCategory);
      } catch (err) {
        next(err);
      }
    },

    showOne: (req, res) => res.success(req.scopedCategory),

    update: async (req, res, next) => {
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
        next(err);
      }
    },
  },

  SubProduct: {
    create: async (req, res, next) => {
      req.scopedProduct.subProducts.push(req.body);
      try {
        const product = await req.scopedProduct.save();
        return res.success(
          product.subProducts[product.subProducts.length - 1],
        );
      } catch (err) {
        next(err);
      }
    },

    update: async (req, res, next) => {
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
      if (unitsAvailablePerDay) { subProduct.unitsAvailablePerDay = unitsAvailablePerDay; }
      subProduct.updatedAt = new Date();

      req.scopedProduct.updatedAt = subProduct.updatedAt;

      try {
        const updatedProduct = await req.scopedProduct.save();

        return res.success(
          updatedProduct.subProducts.id(req.params.subProductId),
        );
      } catch (err) {
        next(err);
      }
    },
  },

  ComboProduct: {
    scopeRequest: async (req, res, next) => {
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

        if (!product) { return res.status(404).send('This product does not exist'); }

        req.scopedProduct = product;
        next();
      } catch (err) {
        next(err);
      }
    },

    create: async (req, res, next) => {
      const comboProduct = new Product({
        ...req.body,
        type: 'combo',
        merchant: req.params.id,
      });

      try {
        const savedProduct = await comboProduct.save();

        const fullProduct = await Product.findOne(
          savedProduct,
        ).populate({
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        });

        return res.success(fullProduct);
      } catch (err) {
        next(err);
      }
    },

    update: async (req, res, next) => {
      try {
        await req.scopedProduct.update({
          ...req.body,
          updatedAt: new Date(),
        });

        const product = await Product.findById(
          req.params.productId,
        ).populate({
          path: 'merchant',
          model: User,
          select: '-password -deleted',
        });

        return res.success(product);
      } catch (err) {
        next(err);
      }
    },
  },

  scopeRequest: async (req, res, next) => {
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

      if (!product) { return res.status(404).send('This product does not exist'); }

      req.scopedProduct = product;
      next();
    } catch (err) {
      next(err);
    }
  },

  createInCategory: async (req, res, next) => {
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
      next(err);
    }
  },

  showOne: (req, res) => res.success(req.scopedProduct),

  update: async (req, res, next) => {
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
      next(err);
    }
  },
};

module.exports = productActions;
