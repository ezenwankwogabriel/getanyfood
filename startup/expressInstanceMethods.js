
function goodResponse(message) {
  return { status: true, message };
}
function badResponse(message) {
  return { status: false, message };
}

class Instances {
  success(message) {
    this.status(200).json(goodResponse(message));
  }

  unAuthenticated(message) {
    this.status(401).json(badResponse(message)); // unanthenticated
  }

  paymentRequired(message) {
    this.status(402).json(badResponse(message)); // payment required
  }

  badRequest(message) {
    this.status(400).json(badResponse(message)); // bad request
  }

  unAuthorized(message) {
    this.status(403).json(badResponse(message)); // unathorized
  }

  notFound(message) {
    this.status(404).json(badResponse(message));
  }
}

function expressInstances(app) {
  const instance = new Instances();
  app.use((req, res, next) => { // success message
    res.success = instance.success;
    next();
  });
  app.use((req, res, next) => {
    res.unAuthenticated = instance.unAuthenticated;
    next();
  });
  app.use((req, res, next) => {
    res.paymentRequired = instance.paymentRequired;
    next();
  });
  app.use((req, res, next) => {
    res.badRequest = instance.badRequest;
    next();
  });
  app.use((req, res, next) => {
    res.unAuthorized = instance.unAuthorized;
    next();
  });
  app.use((req, res, next) => {
    res.notFound = instance.notFound;
    next();
  });
}

module.exports = expressInstances;
