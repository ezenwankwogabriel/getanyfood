/* eslint-disable no-underscore-dangle */
/* eslint-disable global-require */
/* eslint-disable no-undef */
const faker = require('faker');
const request = require('supertest');
const User = require('../../../models/user');
const {
  Email
} = require('../../../utils');

let server;

jest.mock('../../../utils/email', () => jest.fn().mockImplementation(() => ({
  send: () => {},
})));

describe('User Management', () => {
  beforeEach(async () => {
    server = require('../../../app');
  });
  afterEach(async () => {
    await User.remove();
    await server.close();
  });
  class FakeUser {
    constructor() {
      this.firstName = faker.name.findName();
      this.lastName = faker.name.findName();
      this.emailAddress = faker.internet.email();
      this.password = 'fabricate';
      this.phoneNumber = '92838239838';
      this.permission = {};
    }
  }
  describe('Create A Sub User', () => {
    let merchantDoc = {};
    let subMerchant = {};
    beforeEach(async () => {
      merchantDoc = new FakeUser();
      subMerchant = new FakeUser();
      server = require('../../../app');
    });
    it('should return 401 if user is not authenticated', async () => {
      const res = await request(server).post('/user/register').send({});
      expect(res.status).toBe(401);
    });

    it('should return unathorised if adminPassword is incorrect', async () => {

      const merchant = await new User(merchantDoc).save();
      const token = merchant.encryptPayload();
      subMerchant.adminPassword = 'hello guys';
      const res = await request(server)
        .post('/user/register')
        .set('Authorization', `bearer ${token}`)
        .send(subMerchant);
      expect(res.status).toBe(403);
    });

    it('should return badrequest with 401 if email is duplicate', async () => {
      const merchant = await new User(merchantDoc).save();
      const token = merchant.encryptPayload();
      subMerchant.emailAddress = merchant.emailAddress;
      await request(server)
        .post('/user/register')
        .set('Authorization', `bearer ${token}`)
        .send(subMerchant)
        .expect(400);
    });

    it('should create user successfully', async () => {
      const merchant = await new User(merchantDoc).save();
      const token = merchant.encryptPayload();
      subMerchant.adminPassword = merchantDoc.password;
      const res = await request(server)
        .post('/user/register')
        .set('Authorization', `bearer ${token}`)
        .send(subMerchant);
      expect(res.status).toBe(200);
      expect(Email).toHaveBeenCalled();
      expect(Email.mock.calls.length).toEqual(1);
    });
  });

  describe('Action on user', () => {
    it('should return 401 if user is not authenticated', async () => {
      const user = await new User(new FakeUser()).save();
      await request(server)
        .put(`/user/actionOnUser/${user._id}/activating`)
        .expect(401);
    });

    it('should return return 400 if a wrong status was sent', async () => {
      const user = await new User(new FakeUser()).save();
      const token = user.encryptPayload();
      await request(server)
        .put(`/user/actionOnUser/${user._id}/activating`)
        .set('Authorization', `bearer ${token}`)
        .expect(400);
    });

    it('should return 200 if the right status was passed', async () => {
      const user = await new User(new FakeUser()).save();
      const token = user.encryptPayload();
      await request(server)
        .put(`/user/actionOnUser/${user._id}/activate`)
        .set('Authorization', `bearer ${token}`)
        .expect(200);
    });
  });
});
