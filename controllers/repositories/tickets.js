const User = require('../../models/user');
const Ticket = require('../../models/ticket');
const utils = require('../../utils');

const ticketActions = {
  scopeRequest: async (req, res, next) => {
    try {
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

      next();
    } catch (err) {
      next(err);
    }
  },

  scopeRequestByCreator: async (req, res, next) => {
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
  },

  showAll: async (req, res, next) => {
    const queryOptions = {
      populate: [
        {
          path: 'createdBy',
          model: User,
          select: '-password -deleted',
        },
        {
          path: 'messages.sender',
          model: User,
          select: '-password -deleted',
        },
      ],
    };
    try {
      const tickets = await utils.PaginateRequest(req, queryOptions, Ticket);
      return res.success(tickets);
    } catch (err) {
      next(err);
    }
  },

  showAllById: async (req, res, next) => {
    const queryOptions = {
      createdBy: req.params.id,
      populate: [
        {
          path: 'createdBy',
          model: User,
          select: '-password -deleted',
        },
        {
          path: 'messages.sender',
          model: User,
          select: '-password -deleted',
        },
      ],
    };
    try {
      const tickets = await utils.PaginateRequest(req, queryOptions, Ticket);
      return res.success(tickets);
    } catch (err) {
      next(err);
    }
  },

  showOne: (req, res) => res.success(req.scopedTicket),

  showMessages: (req, res) => res.success(req.scopedTicket.messages),

  create: async (req, res, next) => {
    const { title, messages } = req.body;
    const datedMessages = messages.map(message => ({
      ...message,
      sender: req.user.id,
      sentAt: new Date(),
    }));

    const ticket = new Ticket({
      title,
      createdBy: req.user.id,
      messages: datedMessages,
    });

    try {
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
    } catch (err) {
      next(err);
    }
  },

  createMessage: async (req, res, next) => {
    const { text, attachments } = req.body;

    req.scopedTicket.messages.push({
      text,
      attachments,
      sender: req.user.id,
      sentAt: new Date(),
    });

    try {
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
    } catch (err) {
      next(err);
    }
  },
};

module.exports = ticketActions;
