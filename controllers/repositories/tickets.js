const User = require('../../models/user');
const Ticket = require('../../models/ticket');

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

            if (!ticket)
                return res.status(404).send('This ticket does not exist.');

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

            if (!ticket)
                return res.status(404).send('This ticket does not exist.');

            req.scopedTicket = ticket;

            next();
        } catch (err) {
            next(err);
        }
    },

    showAll: async (req, res, next) => {
        try {
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
        } catch (err) {
            next(err);
        }
    },

    showAllById: async (req, res, next) => {
        try {
            const tickets = await Ticket.find({createdBy: req.params.id})
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
        } catch (err) {
            next(err);
        }
    },

    showOne: (req, res) => {
        return res.success(req.scopedTicket);
    },

    showMessages: (req, res) => {
        return res.success(req.scopedTicket.messages);
    },

    create: async (req, res, next) => {
        const {title, messages} = req.body;
        const datedMessages = messages.map((message, index) => {
            return {
                ...message,
                sender: req.user.id,
                sentAt: new Date(),
            };
        });

        console.log(datedMessages);

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
        const {text, attachments} = req.body;

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

            return res.success(
                fullTicket.messages[fullTicket.messages.length - 1]
            );
        } catch (err) {
            next(err);
        }
    },
};

module.exports = ticketActions;
