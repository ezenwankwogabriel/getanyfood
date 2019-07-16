const faker = require('faker');
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const User = require('../../../models/user');
// const 
let server;
describe('Auth', () => {
    beforeEach(async () => {
        server = require('../../../app');
        // await User.collection.drop();

    });
    afterEach(async () => {
        // await User.collection.drop();
        await User.remove();
        await server.close();
    })
    class fakeUser {
        constructor() {
            this.fullName = faker.name.findName();
            this.emailAddress = faker.internet.email();
            this.businessAddress = faker.address.streetAddress();
            this.businessName = faker.name.findName();
            this.phoneNumber = faker.phone.phoneNumber();
            this.password = faker.internet.password();
            this.userType;
        }
        isAdmin() {
            this.userType = 'admin';
            return this;
        }
        isMerchant() {
            this.userType = 'merchant';
            return this;
        }
    }
    describe('Signup; it should', () => {
        // expect('return false if credentials not valid ', async () => {

        // })
        it('return unathorized if no admin has been created', async () => {
            const user = new fakeUser().isMerchant();
            const res = await request(server).post('/register').send(user);
            expect(res.status).toBe(403);
            expect(res.text).toBe('Create an admin account to continue')
        })
        it('return unathorized if trying to create multiple admins', async () => {
            await User.collection.insert({
                userType: 'admin'
            });
            const admin = new fakeUser().isAdmin();
            const res = await request(server).post('/register').send(admin);
            expect(res.status).toBe(403);
            expect(res.text).toBe('Admin account already exists')
        })

        it('return unathorized if email already exists', async () => {
            const userObject = new fakeUser().isMerchant();
            await User.collection.insertMany([{
                emailAddress: faker.internet.email(),
                userType: 'admin'
            }, {
                emailAddress: userObject.emailAddress.toLowerCase()
            }]);
            const res = await request(server).post('/register').send(userObject);
            const body = await User.find();
            expect(res.status).toBe(403);
            expect(res.text).toBe('Account with email address exists')
        })

        it('return 200 if user created', async () => {
            const admin1 = new fakeUser().isAdmin();
            const res = await request(server).post('/register').send(admin1);
            expect(res.status).toBe(200);
        })
    })
    describe('GET /login', () => {
        it('should return token of user on successful login', async () => {
            const userObject = new fakeUser();
            const newUserObject = {
                ...userObject,
                password: bcrypt.hashSync(userObject.password)
            };
            const newUser = new User(newUserObject);
            await newUser.save()
            const res = await request(server).post('/login').send({
                username: userObject.emailAddress,
                password: userObject.password
            });
            expect(res.status).toBe(200)
        })
        it('should return 400, bad request if username or password is not provided', async() => {
            const res = await request(server).post('/login').send({username: faker.internet.email()});
            const res1 = await request(server).post('/login').send({password: faker.internet.password()})
            expect(res.status).toBe(400);
            expect(res1.status).toBe(400);
        })
    })

})