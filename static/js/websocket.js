//var socket = io.connect('http://127.0.0.1:5000/');
var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

socket.on('connect', function() {
    socket.emit('my_event', {data: 'I\'m connected!'});
    console.log('**** Сокет соединение установлено!');
});

socket.on('disconnect', function() {
    console.log('**** Сокет соединение закрыто!');
});

socket.on('server_busy', function(msg) {
    console.log('**** Сервер занят ******');
});

socket.on('server_response', function(msg) {
    console.log('**** Сокет соединение: "server_response" ' + msg);
    console.log(msg);
    serverReact(msg);//реакция на сообщение сервера, определена в файле nardy.js
});

