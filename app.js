var app = require('express')();
var server = require('http').createServer(app);
// http server를 socket.io server로 upgrade한다
var io = require('socket.io')(server);

// localhost:3000으로 서버에 접속하면 클라이언트로 index.html을 전송한다
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

// connection event handler
// connection이 수립되면 event handler function의 인자로 socket인 들어온다

class user{
  constructor(x_position, y_position, user_id) {
    this.user_id = user_id;
    this.x_position = x_position;
    this.y_position = y_position;
    this.rotate = 0;
    this.bullet_count = 0;
  }
}

class bullet{
  constructor(x_position, y_postion, x_speed, y_speed){
    this.x_position = x_position;
    this.y_position = y_position;
    this.x_speed = x_speed;
    this.y_speed = y_speed;
    this.remove_count = 0;
  }
}

var userList = []
var bulletList = []


function intervalFunc(){
  for(var u of userList){

  }
  for(var b of bulletList){

  }
}

setInterval(intervalFunc, 16)

io.on('connection', function(socket) {

  // 접속한 클라이언트의 정보가 수신되면
  socket.on('login', function(data) {
    // socket에 클라이언트 정보를 저장한다
    // userList 에 해당 user의 정보를 기입한다.
    // 메시지를 전송한 클라이언트를 제외한 모든 클라이언트에게는 해당 유저가 추가되었음을 알리고,
    // 메시지를 전송한 클라이언트에게는 모든 맵의 정보를 다 같이 보낸다.
    socket.user_id = data.user_id;
    var x_position = Math.floor(Math.random() * 500) + 100;
    var y_position = Math.floor(Math.random() * 500) + 100;
    userList[user_id] = new user(x_position, y_position, 0)

    socket.emit('login', {userList : userList, bulletList : bulletList} );
    io.broadcast.emit('another_user_login', {add_user: userList[user_id] } );

  });

  // 클라이언트로부터의 메시지가 수신되면
  socket.on('chat', function(data) {


    // 메시지를 전송한 클라이언트를 제외한 모든 클라이언트에게 메시지를 전송한다
    //socket.broadcast.emit('chat', msg);

    // 메시지를 전송한 클라이언트에게만 메시지를 전송한다
    // socket.emit('s2c chat', msg);

    // 접속된 모든 클라이언트에게 메시지를 전송한다
    // io.emit('s2c chat', msg);

    // 특정 클라이언트에게만 메시지를 전송한다
    // io.to(id).emit('s2c chat', data);
  });

  // force client disconnect from server
  socket.on('forceDisconnect', function() {
    socket.disconnect();
  })

  socket.on('disconnect', function() {
    console.log('user disconnected: ' + socket.name);
  });
});

server.listen(3000, function() {
  console.log('Socket IO server listening on port 3000');
});
