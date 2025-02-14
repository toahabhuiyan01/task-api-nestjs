import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthModule } from './../src/auth/auth.module';
import { TasksModule } from './../src/tasks/tasks.module';
import { Chance } from 'chance';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { TestDatabaseModule } from './database.module';

describe('Tasks (e2e)', () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  const chance = new Chance();
  let authToken: string;
  let taskId: string;

  const testUser = {
    name: chance.name(),
    email: chance.email(),
    password: chance.string({ length: 10 }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule, AuthModule, TasksModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    mongoConnection = await moduleFixture.get(getConnectionToken());
    await app.init();

    // Register and login to get auth token
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);
    authToken = registerResponse.body.token;
  });

  afterAll(async () => {
    if (mongoConnection) {
      await mongoConnection.close();
    }
    if (app) {
      await app.close();
    }
  });

  describe('3. Task Management', () => {
    it('3.1 Should create a new task', async () => {
      const newTask = {
        title: chance.sentence({ words: 3 }),
        description: chance.paragraph(),
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTask)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(newTask.title);
      taskId = response.body._id;
    });

    it('3.2 Should get all tasks', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('3.3 Should fail to create task without required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: chance.sentence() })
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });

    it('3.4 Should fail to access tasks without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/tasks')
        .expect(401);

      expect(response.body.message).toBe('Unauthorized - No token provided');
    });

    it('3.5 Should get a specific task', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body._id).toBe(taskId);
    });

    it('3.6 Should update a task', async () => {
      const updatedData = {
        title: chance.sentence({ words: 3 }),
        description: chance.paragraph(),
        dueDate: new Date(Date.now() + 172800000).toISOString(),
        status: 'completed',
      };

      const response = await request(app.getHttpServer())
        .put(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.title).toBe(updatedData.title);
      expect(response.body.status).toBe(updatedData.status);
    });

    it('3.7 Should delete a task', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Task deleted successfully');

      // Verify task is deleted
      await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('3.8 Should fail to update task with invalid ID', async () => {
      const response = await request(app.getHttpServer())
        .put('/tasks/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: chance.sentence({ words: 3 }),
          description: chance.paragraph(),
          dueDate: new Date(Date.now() + 86400000).toISOString(),
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid task ID');
    });

    it('3.9 Should fail to delete task with invalid ID', async () => {
      const response = await request(app.getHttpServer())
        .delete('/tasks/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error).toBe('Invalid task ID');
    });
  });
});
