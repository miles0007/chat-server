const socket = io()



const form = document.getElementById("chat-form")
const formButton = document.getElementById("submit-button")
const inputField = document.getElementById("input-field")
const sendLocation = document.getElementById('send-location')
const messages = document.querySelector('#messages')

const template = document.getElementById('message-template').innerHTML;
const locationTemplate = document.getElementById('location-template').innerHTML;
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML;

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    const newMessage = messages.lastElementChild

    const newMessageStyles = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    const visibleHeight = messages.offsetHeight

    const containerHeight = messages.scrollHeight

    const scrollOffset = (messages.scrollTop + visibleHeight)*2
    console.log(scrollOffset);
    
    // messages.scrollTop = messages.scrollHeight;

    if (containerHeight - newMessageHeight < scrollOffset) {
      // console.log(containerHeight, newMessageHeight, scrollOffset);
      console.log("scrolling to bottom");
      messages.scrollTop = messages.scrollHeight;
    }
}

socket.on('message', (receivedMessage) => {
    console.log(receivedMessage)
    const html = Mustache.render(template, {
      username: receivedMessage.username,
      message: receivedMessage.text,
      createdAt: moment(receivedMessage.createdAt).format("h:mm a"),
    });
    messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})


socket.on('locationMessage', (message) => {
    const locationHtml = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.location, 
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    messages.insertAdjacentHTML('beforeend', locationHtml)
    autoScroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, { room, users });
    document.getElementById('sidebar').innerHTML = html;
})


form.addEventListener('submit', (e) => {
    e.preventDefault();
    formButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error) => {
        formButton.removeAttribute('disabled')
        inputField.value = ''
        inputField.focus()
        if (error) {
            return console.log(error)
        }
        console.log('Delivered')
    })
})


sendLocation.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geo Location Is not supported in your browser')
    }
    sendLocation.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        const { coords } = position
        const { latitude, longitude } = coords
        let string = `https://google.com/maps?q=${latitude},${longitude}`
        socket.emit('sendLocation', string, (error) => {
            sendLocation.removeAttribute('disabled')
            if (error) {
                return console.log(error)
            }
            console.log('Location Delivered')
        })
    })
});


socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
})