import chai from 'chai'

import agent from './agent.js'
import connectDB from './connect-db.js'
import { user, newNote, newFile, updatedNote, updatedFile } from '../mocks.js'

const { expect } = chai

before(() => {
  return connectDB()
    .then(() => console.log('MongoDB Memory Server is connected...'))
    .catch(({ message }) => console.error(`Error: ${message}`))
})

describe('User Routes', function () {
  describe('Register', function () {
    it('should create and save a user', async function () {
      const res = await agent.post('/register').send(user)

      expect(res).to.have.status(201)
      expect(res).to.have.cookie('Bearer')
      expect(res.body.name).to.equal(user.name)

      for (const note of res.body.notes) {
        expect(note).to.deep.include(user.notes[res.body.notes.indexOf(note)])
      }
    })

    it('should not allow creating a duplicate user', async function () {
      const res = await agent.post('/register').send(user)

      expect(res).to.have.status(409)
      expect(res.text).to.equal('This email address is already registered, try login instead')
    })
  })

  describe('Login', function () {
    it('should login and return the name and notes', async function () {
      const res = await agent.post('/login').send(user)

      expect(res.body.name).to.equal(user.name)

      for (const note of res.body.notes) {
        expect(note).to.deep.include(user.notes[res.body.notes.indexOf(note)])
      }
    })

    it('should not allow an incorrect email or password', async function () {
      const res = await agent.post('/login').send({
        ...user,
        password: 'incorrect_password',
      })

      expect(res.text).to.equal('Incorrect email or password')
    })
  })

  describe('Update', function () {
    it('should update the name and password', async function () {
      const res = await agent.put('/update').send({
        name: 'Updated Test User',
      })

      expect(res).to.have.status(200)
    })
  })

  describe('Change Password', function () {
    it('should update the name and password', async function () {
      const res = await agent.put('/register').send({
        password: user.password,
        newPassword: '987654321',
      })

      expect(res).to.have.status(200)

      user.password = '987654321'
    })

    it('should not allow an incorrect password', async function () {
      const res = await agent.put('/register').send({
        password: 'incorrectpassword',
        newPassword: '198237645',
      })

      expect(res).to.have.status(404)
      expect(res.text).to.equal('Incorrect password')
    })
  })

  describe('Logout', function () {
    it('should remove the session cookie', async function () {
      const res = await agent.post('/logout')

      expect(res).to.have.status(204)
      expect(res).to.have.header('set-cookie', /Bearer=;/)
    })
  })
})

describe('Note Routes', function () {
  describe('Fetch Notes', function () {
    it('should return all notes', async function () {
      await agent.post('/login').send(user) // login since the last user test logged us out

      const res = await agent.get('/notes')

      expect(res.body.notes).to.have.lengthOf(2)

      for (const note of res.body.notes) {
        expect(note).to.deep.include(user.notes[res.body.notes.indexOf(note)])
      }

      user.notes = res.body.notes
    })
  })

  describe('Create Note', function () {
    it('should create and save a note', async function () {
      const res = await agent
        .post('/notes')
        .type('form')
        .field('color', newNote.color)
        .field('category', newNote.category)
        .field('title', newNote.title)
        .field('content', newNote.content)
        .attach('file', newFile.buffer, newFile.fileName)

      expect(res).to.have.status(201)
      expect(res.body.newNote).to.deep.include(newNote)
      expect(res.body.newNote.fileName).to.equal(newFile.fileName)

      user.notes.push(res.body.newNote)
    })
  })

  describe('Update Note', function () {
    it('should replace the recieved note with the existing one', async function () {
      const res = await agent
        .put('/notes')
        .type('form')
        .field('_id', user.notes[user.notes.length - 1]._id)
        .field('color', updatedNote.color)
        .field('category', updatedNote.category)
        .field('title', updatedNote.title)
        .field('content', updatedNote.content)
        .attach('file', updatedFile.buffer, updatedFile.fileName)

      expect(res.body.updatedNote).to.deep.include(updatedNote)
      expect(res.body.updatedNote.fileName).to.equal(updatedFile.fileName)

      user.notes[user.notes.length - 1] = res.body.updatedNote
    })
  })

  describe('Delete Note', function () {
    it('should delete a note', async function () {
      const res = await agent.delete('/notes').send({ noteID: user.notes[0]._id })

      expect(res).to.have.status(204)

      user.notes.shift()
    })

    it('should return a 404 status code for an invalid note ID', async function () {
      const res = await agent.delete('/notes').send({
        noteID: 'invalid',
      })

      expect(res).to.have.status(404)
    })
  })
})

describe('File Routes', function () {
  describe('Download', function () {
    it('should send a file', async function () {
      const res = await agent.get(`/${user.notes[user.notes.length - 1]._id}/file`).buffer()

      expect(res.body).to.deep.equal(updatedFile.buffer)
    })
  })
})
