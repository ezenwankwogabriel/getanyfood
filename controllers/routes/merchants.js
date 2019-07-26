const { Router } = require('express');
const passport = require('passport');

const router = new Router();
const User = require('../../models/user');
const Order = require('../../models/order');
const ProductCategory = require('../../models/product/category');
const Product = require('../../models/product');
const Ticket = require('../../models/ticket');

const getUser = async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      deleted: 0,
      userType: 'merchant',
    });

    if (!user) return res.status(404).send('This user does not exist');

    req.scopedUser = user;

    next();
  } catch (err) {
    next(err);
  }
};

const getOrder = async (req, res, next) => {
  try {
    const order = await Orders.findOne({
      _id: req.params.orderId,
      merchant: req.params.id,
    })
      .populate({
        path: 'customer',
        model: User,
        select: '-password -deleted',
      })
      .populate({
        path: 'merchant',
        model: User,
        select: '-password -deleted',
      });

    if (!order) return res.status(404).send('This order does not exist');

    req.scopedOrder = order;
    next();
  } catch (err) {
    next(err);
  }
};

const getCategory = async (req, res, next) => {
  try {
    const category = await ProductCategory.findOne({
      merchant: req.params.id,
      _id: req.params.categoryId,
    }).populate({
      path: 'merchant',
      model: User,
      select: '-password -deleted',
    });

    if (!category) return res.status(404).send('This product category does not exist');

    req.scopedCategory = category;
    next();
  } catch (err) {
    next(err);
  }
};

const getProduct = async (req, res, next) => {
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

    if (!product) return res.status(404).send('This product does not exist');

    req.scopedProduct = product;
    next();
  } catch (err) {
    next(err);
  }
};

const getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findOne({
      createdBy: req.params.id,
      _id: req.params.ticketId,
    })
      .populate({
        path: 'createdBy',
        model: User,
        select: '-password -deleted',
      })
      .populate({
        path: 'messages.sender',
        model: User,
        select: '-password -deleted',
      });

    if (!ticket) return res.status(404).send('This ticket does not exist.');

    req.scopedTicket = ticket;

    next();
  } catch (err) {
    next(err);
  }
};

const authJwt = passport.authenticate('merchant', { session: false });
router.use(authJwt);

router.get('/:id', getUser, async (req, res) => {
  res.success(req.scopedUser);
});

router.put('/:id', getUser, async (req, res) => {
  const {
    firstName,
    lastName,
    businessName,
    phoneNumber,
    businessAddress,
    businessDescription,
    businessImage,
    workingHours,
    businessType,
    businessCategory,
    delivery,
    location,
    bankDetails,
  } = req.body;

  await req.scopedUser.update({
    firstName,
    lastName,
    businessName,
    phoneNumber,
    businessAddress,
    businessDescription,
    businessImage,
    workingHours,
    businessType,
    businessCategory,
    delivery,
    location,
    bankDetails,
  });

  res.success(req.scopedUser);
});

router.get('/:id/orders', async (req, res) => {
  const orders = await Order.find({ merchant: req.params.id })
    .populate({
      path: 'customer',
      model: User,
      select: '-password -deleted',
    })
    .populate({
      path: 'merchant',
      model: User,
      select: '-password -deleted',
    });
  res.success(orders);
});

router.get('/:id/orders/:orderId', getOrder, async (req, res) => {
  res.success(req.scopedOrder);
});

router.patch('/:id/orders/:orderId', getOrder, async (req, res) => {
  const { status, pickupTime } = req.body;
  await req.scopedOrder.update({
    status,
    pickupTime,
  });

  const updatedOrder = await Orders.findOne({
    _id: req.params.orderId,
    merchant: req.params.id,
  })
    .populate({
      path: 'customer',
      model: User,
      select: '-password -deleted',
    })
    .populate({
      path: 'merchant',
      model: User,
      select: '-password -deleted',
    });

  return res.success(updatedOrder);
});

router.post('/:id/product-categories', async (req, res) => {
  const category = new ProductCategory({
    ...req.body,
    merchant: req.params.id,
  });

  const savedCategory = await category.save();

  return res.success(savedCategory);
});

router.put(
  '/:id/product-categories/:categoryId',
  getCategory,
  async (req, res) => {
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

    res.success(newCategory);
  },
);

router.post(
  '/:id/product-categories/:categoryId/products',
  getUser,
  getCategory,
  async (req, res) => {
    const product = new Product({
      ...req.body,
      type: 'single',
      category: req.params.categoryId,
      merchant: req.params.id,
    });

    const savedProduct = await product.save();

    return res.success(savedProduct);
  },
);

router.put(
  '/:id/product-categories/:categoryId/products/:productId',
  getUser,
  getCategory,
  getProduct,
  async (req, res) => {
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
  },
);

router.post(
  '/:id/product-categories/:categoryId/products/:productId/sub-products',
  getUser,
  getCategory,
  getProduct,
  async (req, res) => {
    req.scopedProduct.subProducts.push(req.body);
    const product = await req.scopedProduct.save();
    res.success(product.subProducts[product.subProducts.length - 1]);
  },
);

router.put(
  '/:id/product-categories/:categoryId/products/:productId/sub-products/:subProductId',
  getUser,
  getCategory,
  getProduct,
  async (req, res) => {
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
    if (unitsAvailablePerDay) subProduct.unitsAvailablePerDay = unitsAvailablePerDay;
    subProduct.updatedAt = new Date();

    req.scopedProduct.updatedAt = subProduct.updatedAt;

    const updatedProduct = await req.scopedProduct.save();

    return res.success(updatedProduct.subProducts.id(req.params.subProductId));
  },
);

router.post('/:id/combo-products', getUser, async (req, res) => {
  const comboProduct = new Product({
    ...req.body,
    type: 'combo',
    merchant: req.params.id,
  });

  const savedProduct = await comboProduct.save();

  const fullProduct = await Product.findOne(savedProduct).populate({
    path: 'merchant',
    model: User,
    select: '-password -deleted',
  });

  return res.success(fullProduct);
});

router.put(
  '/:id/combo-products/:productId',
  getUser,
  getProduct,
  async (req, res) => {
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
  },
);

router.post('/:id/tickets', async (req, res) => {
  const { title, messages } = req.body;
  const datedMessages = messages.map((message, index) => ({
    ...message,
    sender: req.user.id,
    sentAt: new Date(),
  }));

  console.log(datedMessages);

  const ticket = new Ticket({
    title,
    createdBy: req.user.id,
    messages: datedMessages,
  });

  const savedTicket = await ticket.save();
  const fullTicket = await Ticket.findById(savedTicket.id)
    .populate({
      path: 'createdBy',
      model: User,
      select: '-password -deleted',
    })
    .populate({
      path: 'messages.sender',
      model: User,
      select: '-password -deleted',
    });
  res.success(fullTicket);
});

router.get('/:id/tickets', async (req, res) => {
  const tickets = await Ticket.find()
    .populate({
      path: 'createdBy',
      model: User,
      select: '-password -deleted',
    })
    .populate({
      path: 'messages.sender',
      model: User,
      select: '-password -deleted',
    });
  return res.success(tickets);
});

router.get('/:id/tickets/:ticketId', getTicket, async (req, res) => res.success(req.scopedTicket));

router.get('/:id/tickets/:ticketId/messages', getTicket, async (req, res) => res.success(req.scopedTicket.messages));

router.post('/:id/tickets/:ticketId/messages', getTicket, async (req, res) => {
  const { text, attachments } = req.body;

  req.scopedTicket.messages.push({
    text,
    attachments,
    sender: req.user.id,
    sentAt: new Date(),
  });

  const ticket = await req.scopedTicket.save();
  const fullTicket = await Ticket.findById(ticket.id)
    .populate({
      path: 'createdBy',
      model: User,
      select: '-password -deleted',
    })
    .populate({
      path: 'messages.sender',
      model: User,
      select: '-password -deleted',
    });
  return res.success(fullTicket.messages[fullTicket.messages.length - 1]);
});

module.exports = router;
