const { Router } = require('express');
const passport = require('passport');
const Ticket = require('../../models/ticket');
const User = require('../../models/user');

const router = new Router();

const scopeRequest = async (req, res, next) => {
  const ticket = await Ticket.findById(req.params.id)
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

  return next();
};

const authJWT = passport.authenticate('admin', { session: false });
router.use(authJWT);
router.use('/:id', scopeRequest);

router.post('/', async (req, res) => {
  const { title, messages } = req.body;
  const datedMessages = messages.map((message) => ({
    ...message,
    sender: req.user.id,
    sentAt: new Date(),
  }));

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

router.get('/', async (req, res) => {
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

router.get('/:id', async (req, res) => res.success(req.scopedTicket));

router.get('/:id/messages', async (req, res) => {
  res.success(req.scopedTicket.messages);
});

router.post('/:id/messages', async (req, res) => {
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
