function asyncMiddleWare(handler) {
  return async (req, res, next) => {
    try {
      handler(req, res);
    } catch (ex) {
      next(ex);
    }
  };
}

module.exports = asyncMiddleWare;
