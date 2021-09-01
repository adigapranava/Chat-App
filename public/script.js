var nameUser = "";

const msg_form = document.getElementById("chat-form")
const message_section = document.getElementById("msg-section")
const main_message_section = document.getElementById("main-msg-section")
const actual_msg = document.getElementById("actual-msg")
const room_id = document.getElementById("room-id")
var socket = ""
var typingBy = Array()

var typing = false;
var timeout = undefined;

function timeoutFunction(){
    typing = false;
    console.log("not typing!!");
    socket.emit("noLongerTypingMessage");
}

function onKeyDownNotEnter(){
    if(typing == false) {
        typing = true
        socket.emit("typingMessage");
        timeout = setTimeout(timeoutFunction, 1000);
    } else {
        clearTimeout(timeout);
        timeout = setTimeout(timeoutFunction, 1000);
    }
}

actual_msg.addEventListener("keydown", (e)=>{
    if(e.key !== 'Enter'){
        onKeyDownNotEnter();
    }
})

// whn u change the room
room_id.addEventListener("change",()=>{
    const room = room_id.value;
    socket.emit("join-room", room)
    message_section.innerHTML = "<div id=\"always-down\"></div>";
    addMessage(`You joined The ${room_id.value} Room!!`, 'noti')
})

// any msg to display
const addMessage = (msg, classname, sender="" ) =>{
    var chat = document.createElement("div");
    chat.classList.add("chat");
    chat.classList.add(classname);
    
    var spn = document.createElement("span")
    spn.innerText = sender;
    var p = document.createElement("p")
    p.innerText=msg;
    
    chat.appendChild(spn)
    chat.appendChild(p)
    message_section.appendChild(chat);
    main_message_section.scrollTop = main_message_section.scrollHeight;
}

const showTyping = ()=>{
    var ele = document.getElementById("always-down");
    if(typingBy.length == 0){
        ele.innerText=""
    }else{
        ele.innerText=""
        typingBy.forEach((user)=>{
            ele.innerText += " " + user + " "
        })
        ele.innerText += " typing..."
    }
}

// when u add a message
msg_form.addEventListener("submit",e =>{
    e.preventDefault();
    var message = actual_msg.value;
    var roomID = room_id.value;
    if (message == "") return;
    
    socket.emit('add-message', message, roomID);
    addMessage(actual_msg.value, "from")
    actual_msg.value=""
})

// 1st function!!!
const askName = ()=>{
    while(!nameUser || nameUser ===""){
        nameUser = prompt("Enter Your Name!");
        console.log(nameUser);
    }
    document.getElementById("hider").style.display="none"
    document.getElementById("username").innerText = nameUser

    socket = io(window.location.origin, { transports : ['websocket'] , query:  `name=${nameUser}`});

    socket.on('connect', ()=>{
        addMessage(`You joined The ${room_id.value} Room!!`, 'noti')
    })

    socket.on("member-count" ,(memberCount)=>{
        console.log("member: ", memberCount);
        document.getElementById("member-Count").innerText = memberCount;
    })

    // recieve msg from others
    socket.on('receive-message', (msg, from)=>{
        addMessage(msg, "to", from);
    })

    // notify if others join
    socket.on("room-info", (msg, memberCount)=>{
        addMessage(msg,'noti')
        document.getElementById("member-Count").innerText = memberCount;
    })

    socket.on("typing", (user)=>{
        console.log(user+"typing");
        typingBy.includes(user)?"":(typingBy.push(user),showTyping())
    })

    socket.on("noLongerTyping", (user)=>{
        console.log(user+" no longer typing");
        typingBy = typingBy.filter((usr) => {
            return usr != user;
        })
        showTyping()
    })
}