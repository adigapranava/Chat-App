const express = require('express')
const app = express()

const server = require('http').createServer(app)
const io = require('socket.io')(server, {cors: {origin: "*", methods: ["GET", "POST"]}})
const port = process.env.PORT || 3001

app.set("view engine", "ejs")
app.use(express.static('public'));

app.get("/", (req, res) => {
    res.render('home')
})

server.listen(port, ()=>{
    console.log(`Server is Online on port ${port}`);
})


var RoomInfo = []

const addUserToRoom= (room, user)=>{
    var found = false
    var memberCount = 0
    RoomInfo.map((rm)=>{
        if(rm.id == room){
            found = true;
            rm.members.add(user)
            memberCount = rm.members.size
            return rm
        }else{
            return rm;
        }
    })
    if(!found){
        RoomInfo.push({id: room, members:new Set([user])})
        memberCount = 1;
    }
    return memberCount;
}

const removeUserFromRoom = (room, user)=>{
    var memberCount = 0;
    RoomInfo.map((rm)=>{
        if(rm.id == room){
            rm.members.delete(user)
            memberCount = rm.members.size;
            return rm
        }else{
            return rm
        }
    })
    return memberCount;
}

// on new connection
//  1 add username 
//  2 add to default public room
//  
io.on('connection', (socket) => {
    var newUser = socket.handshake.query.name;
    socket.username = newUser;
    socket.room = "public"
    console.log("new connection!! "+ newUser );
    
    // public room as default
    socket.join("public")
    // notify other users on public
    var memCount = addUserToRoom("public", socket.id)
    socket.to("public").emit("room-info", `${newUser} joined the room!!`, memCount);
    socket.emit("member-count", memCount)
    
    socket.on('disconnect', ()=>{
        socket.to(socket.room).emit("noLongerTyping", socket.username);
        socket.to(socket.room).emit("room-info", `${newUser} left the room!!`, removeUserFromRoom(socket.room, socket.id));
    })

    socket.on('add-message',(message)=>{
        socket.to(socket.room).emit("receive-message", message, socket.username);
    })

    socket.on("join-room",(room)=>{
        var memCount = removeUserFromRoom(socket.room, socket.id)
        socket.to(socket.room).emit("room-info", `${socket.username} left the room!!`, memCount);
        socket.leave(socket.room)
        socket.join(room)
        socket.room = room
        var memCount = addUserToRoom(socket.room, socket.id)
        socket.emit("member-count", memCount)
        socket.to(socket.room).emit("room-info", `${socket.username} joined the room!!`, memCount);
    })

    socket.on("typingMessage", ()=>{
        socket.to(socket.room).emit("typing", socket.username);
    })

    socket.on("noLongerTypingMessage", ()=>{
        socket.to(socket.room).emit("noLongerTyping", socket.username);
    })
})
