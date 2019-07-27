class Instances {
  success(data) {
    this.status(200).send(data);
  }

  unAuthenticated(message) {
    this.status(401).send(message); // unanthenticated
  }

  paymentRequired(message) {
    this.status(402).send(message); // payment required
  }

  badRequest(message) {
    this.status(400).send(message); // bad request
  }

  unAuthorized(message) {
    this.status(403).send(message); // unathorized
  }

  notFound(message) {
    this.status(404).send(message);
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
