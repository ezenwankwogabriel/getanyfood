const asyncMiddleware = require('../../../middleware/asyncMiddleware');
describe('AsyncMiddleware', function () {
    it('should return a function calling the handler', async function () {
        const res = jest.fn();
        const req = jest.fn();
        const next = jest.fn();
        const middleware = jest.fn().mockReturnValue(true);
        await asyncMiddleware(middleware)(req, res, next);
        expect(middleware).toBeCalledWith(req, res);
    })
})