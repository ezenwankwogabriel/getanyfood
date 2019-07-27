const faker = require('faker');
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const User = require('../../../models/user');
// const 
let server;
describe('User Management', () => {
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
            this.firstName = faker.name.findName();
            this.lastName = faker.name.findName();
            this.emailAddress = faker.internet.email();
            this.userPassword = faker.internet.password();
            this.adminPassword = faker.internet.password();
            this.permission = faker.random.arrayElement();
        }
    }
    describe('Create A Sub User', () => {
        it('show verify a user is authenticated', async () => {
            const res = await request(server).post('/user/register').send({});
            expect(res.status).toBe(401)
        });
        it('should return unathorised if email is not provided', async () => {
            const userObject = new fakeUser();
            userObject.emailAddress = ''
            const user = await new User(userObject).save();
            const token = user.encryptPayload();
            const res = await request(server)
                .post('/user/register')
                .set('Authorization', `JWT ${token}`)
                .send(userObject);
            expect(res.status).toBe(400)
        });
        it('should return unathorised if adminPassword is not provided', async () => {
            const userObject = new fakeUser();
            userObject.adminPassword = ''
            const user = await new User(userObject).save();
            const token = user.encryptPayload();
            const res = await request(server)
            .post('/user/register')
            .set('Authorization', `JWT ${token}`)
            .send(userObject);
            console.log('2 ', res.status, res.text)
            expect(res.status).toBe(400)
        });
        it('should create user successfully', async () => {
            const userObject = new fakeUser();
            const user = await new User(userObject).save();
            const token = user.encryptPayload();
            const res = await request(server)
                .post('/user/register')
                .set('Authorization', `JWT ${token}`)
                .send(userObject);
            expect(res.status).toBe(200);
            // expect(res.)
        });
    })
})