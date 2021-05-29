
const express = require('express');
const path = require('path')
const Filter = require('bad-words')
const http = require('http')
const socketio = require('socket.io');
const {generateMessage, generateLocationMessage} = require('./src/utils/message');
const { addUser, getUser, removeUser, getUsersInRoom } = require('./src/utils/user');



const app = express()

const publicDirectory = path.join(__dirname, './public')
// const viewPath = path.join(__dirname, './public/templates/views')
// const partialsPath = path.join(__dirname, './public/templates/partials')

// app.set('view engine', 'hbs')
// app.set('views', viewPath)
// hbs.registerPartials(partialsPath)

const server = http.createServer(app)
const io = socketio(server)

app.use(express.static(publicDirectory))


io.on('connection', (socket) => {
    console.log("New Web Socket connection")

    

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ username, room, id:socket.id })
        console.log(user, error);
        
        if (error) {
            return callback(error)
        }
        socket.join(user.room)

        socket.emit('message', generateMessage('Admin','Welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} joined..!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })
    
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if (filter.isProfane(message)) {
            return callback('Profanity Alert found.')
        }
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on("sendLocation", (location, callback) => {
      const user = getUser(socket.id)
      io.to(user.room).emit('locationMessage',generateLocationMessage(user.username, location));
      callback()
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} left the chat room`))
            io.to(user.room).emit("roomData", {
              room: user.room,
              users: getUsersInRoom(user.room),
            });
        }
    })
})


server.listen(8000, () => console.log("Listening on Port: 8000"))