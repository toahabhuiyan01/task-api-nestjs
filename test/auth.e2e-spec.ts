import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthModule } from './../src/auth/auth.module';
import { TasksModule } from './../src/tasks/tasks.module';
import { UsersModule } from './../src/users/users.module';
import { Chance } from 'chance';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { TestDatabaseModule } from './database.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  const chance = new Chance();
  let authToken: string;

  const testUser = {
    name: chance.name(),
    email: chance.email(),
    password: chance.string({ length: 10 }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule, AuthModule, TasksModule, UsersModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    mongoConnection = await moduleFixture.get(getConnectionToken());
    await app.init();
  });

  afterAll(async () => {
    if (mongoConnection) {
      await mongoConnection.close();
    }
    if (app) {
      await app.close();
    }
  });

  describe('1. User Authentication', () => {
    it('1.1 Should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body).toHaveProperty('token');
      authToken = response.body.token;
    });

    it('1.2 Should fail to register with existing email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(400);

      expect(response.body.error).toBe('Email already registered');
    });

    it('1.3 Should login with registered user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      authToken = response.body.token;
    });

    it('1.4 Should fail to login with wrong password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    it('1.5 Should request password reset', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({
          email: testUser.email,
        })
        .expect(200);

      expect(response.body).toHaveProperty('resetToken');
    });
  });

  describe('2. User Profile Management', () => {
    it('2.0 Should reset password with valid credentials', async () => {
      const newPassword = chance.string({ length: 10 });
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword,
        })
        .expect(200);

      expect(response.body.message).toBe(
        'Password has been reset successfully',
      );

      // Verify can login with new password
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
      authToken = loginResponse.body.token;
    });

    it('2.1 Should get user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('name', testUser.name);
      expect(response.body.user).toHaveProperty('email', testUser.email);
    });

    it('2.2 Should update user profile', async () => {
      const updatedName = chance.name();
      const response = await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: updatedName })
        .expect(200);

      expect(response.body.user).toHaveProperty('name', updatedName);
    });

    it('2.3 Should fail to update profile with invalid token', async () => {
      await request(app.getHttpServer())
        .put('/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .send({ name: chance.name() })
        .expect(401);
    });
  });
});
