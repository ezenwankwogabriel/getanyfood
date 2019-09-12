/* eslint-disable no-undef */
const faker = require('faker');
const crypto = require('crypto');
const request = require('supertest');
const User = require('../../../models/user');
const Email = require('../../../utils/email');

let server;

jest.mock('../../../utils/email', () => jest.fn().mockImplementation(() => ({ send: () => {} })));

describe('Auth', () => {
  beforeEach(async () => {
    // eslint-disable-next-line global-require
    server = require('../../../app');
  });

  afterEach(async () => {
    // await User.collection.drop();
    await User.remove();
    await server.close();
  });

  class FakeUser {
    constructor() {
      this.firstName = faker.name.findName();
      this.lastName = faker.name.findName();
      this.emailAddress = faker.internet.email();
      this.businessAddress = faker.address.streetAddress();
      this.businessName = faker.name.findName();
      this.phoneNumber = '92838239838';
      this.password = faker.internet.password();
      this.userType = '';
    }

    isAdmin() {
      this.userType = 'super_admin';
      return this;
    }

    isMerchant() {
      this.userType = 'merchant';
      return this;
    }
  }
  describe('Signup; it should', () => {
    it('return unathorized if no admin has been created', async () => {
      const user = new FakeUser().isMerchant();
      const res = await request(server).post('/register').send(user);
      expect(res.status).toBe(403);
      expect(res.text).toBe('Create an admin account to continue');
    });

    it('return unathorized if trying to create multiple admins', async () => {
      await User.collection.insert({
        userType: 'super_admin',
      });
      const admin = new FakeUser().isAdmin();
      const res = await request(server).post('/register').send(admin);
      expect(res.status).toBe(403);
      expect(res.text).toBe('Admin account already exists');
    });

    it('return unathorized if email already exists', async () => {
      const userObject = new FakeUser().isMerchant();
      await User.collection.insertMany([{
        emailAddress: faker.internet.email(),
        userType: 'super_admin',
      }, {
        emailAddress: userObject.emailAddress.toLowerCase(),
      }]);
      const res = await request(server).post('/register').send(userObject);
      expect(res.status).toBe(403);
      expect(res.text).toBe('Account with email address exists');
    });

    it('return 200 if user created', async () => {
      const admin1 = new FakeUser().isAdmin();
      const res = await request(server).post('/register').send(admin1);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /login', () => {
    it('should return Account Suspended if user account is suspended', async () => {
      const userObject = new FakeUser().isMerchant();
      userObject.status = false;
      await new User(userObject).save();
      const res = await request(server).post('/login').send({
        username: userObject.emailAddress,
        password: userObject.password,
      });
      expect(res.status).toBe(401);
      expect(res.text).toBe('Account Suspended');
    });
    it('should return token of user on successful login', async () => {
      const userObject = new FakeUser().isMerchant();
      await new User(userObject).save();
      const res = await request(server).post('/login').send({
        username: userObject.emailAddress,
        password: userObject.password,
      });
      expect(res.status).toBe(200);
    });

    it('should return 400, bad request if username or password is not provided', async () => {
      const res = await request(server).post('/login').send({
        username: faker.internet.email(),
      });
      const res1 = await request(server).post('/login').send({
        password: faker.internet.password(),
      });
      expect(res.status).toBe(400);
      expect(res1.status).toBe(400);
    });
  });

  describe('Forgot Password', () => {
    it('should verify an email is sent, and status is 200', async () => {
      const user = await new User(new FakeUser().isMerchant()).save();
      const res = await request(server).post('/forgotPassword').send({
        emailAddress: user.emailAddress,
      });
      expect(res.status).toBe(200);
      expect(res.text).toBe('Reset Link Sent to Your Email');
      expect(Email).toHaveBeenCalled();
      expect(Email.mock.calls.length).toEqual(1);
    });
  });

  describe('resend Password', () => {
    it('should return 400 if not token is available', async () => {
      const user = await new User(new FakeUser().isMerchant()).save();
      await request(server)
        .post('/resendPassword').send({
          emailAddress: user.emailAddress,
        }).expect(400);
    });
    it('should return 200 if token is found', async () => {
      const buf = crypto.randomBytes(20);
      const userObject = new FakeUser().isMerchant();
      userObject.token = buf.toString('hex');
      const user = await new User(userObject).save();
      await request(server)
        .post('/resendPassword').send({
          emailAddress: user.emailAddress,
        }).expect(200);
      expect(Email).toHaveBeenCalled();
    });
  });

  describe('Validate Password Token', () => {
    it('should return 200 if token is valid', async () => {
      const buf = crypto.randomBytes(20);
      const userObject = new FakeUser().isMerchant();
      userObject.token = buf.toString('hex');
      const user = await new User(userObject).save();
      await request(server).get(`/validatePasswordToken/${user.token}`).expect(200);
    });
  });

  describe('Reset User Password Token', () => {
    it('should return 200 if token is valid', async () => {
      const buf = crypto.randomBytes(20);
      const userObject = new FakeUser().isMerchant();
      userObject.token = buf.toString('hex');
      const user = await new User(userObject).save();
      await request(server).post(`/resetPassword/${user.token}`).send({
        password: 'hallo',
      }).expect(200);
      expect(Email).toHaveBeenCalled();
    });
  });
});
