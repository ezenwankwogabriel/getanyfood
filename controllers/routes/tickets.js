const { Router } = require('express');
const passport = require('passport');
const Ticket = require('../repositories/tickets');

const router = new Router();

router.use(passport.authenticate('admin', { session: false }));

router.get('/', Ticket.showAll);

router.use('/:id', Ticket.scopeRequest);

router.get('/:id', Ticket.showOne);

router.get('/:id/messages', Ticket.showMessages);

router.post('/:id/messages', Ticket.createMessage);

module.exports = router;
