var express = require('express');
var app = express();
var server = require('http').createServer(app);
// http server를 socket.io server로 upgrade한다
var io = require('socket.io')(server);

app.use(express.static('resource'));

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

    this.where_rotate = 0; // -1 is left, 1 is right, 0 is neutral
    this.where_move = 0; // 1 is forward, -1 is backward, 0 is neutral
    this.bullet_count = 0;
  }
}

class bullet{
  constructor(bullet_owner, bullet_id, x_position, y_position, x_speed, y_speed){
    this.bullet_owner = bullet_owner;
    this.bullet_id = bullet_id;
    this.x_position = x_position;
    this.y_position = y_position;
    this.x_speed = x_speed;
    this.y_speed = y_speed;
    this.remove_count = 150;
  }
}

let userList = {}
let bulletList = {}
let deleted_bullet = [];
let deleted_user = [];

function intervalFunc(){
  for(var u in userList){
    let now_user = userList[u];
    now_user.rotate += now_user.where_rotate;
    let x = Math.sin(Math.PI * now_user.rotate / 180) * now_user.where_move;
    let y = -Math.cos(Math.PI * now_user.rotate / 180) * now_user.where_move;
    now_user.x_position += x;
    now_user.y_position += y;
  }

  for(var b in bulletList){
      let now_bullet = bulletList[b];
      now_bullet.x_position += now_bullet.x_speed;
      now_bullet.y_position += now_bullet.y_speed;
      now_bullet.remove_count -= 1;
      if(now_bullet.remove_count < 0){
        userList[now_bullet.bullet_owner].bullet_count--;
        deleted_bullet.push(now_bullet.bullet_id);
        delete bulletList[b];
      }

      for(var u in userList){
        let now_user = userList[u];
        let now_user_center_x = now_user.x_position + 12;
        let now_user_center_y = now_user.y_position + 6;
        let x_side = (now_bullet.x_position - now_user_center_x) * (now_bullet.x_position - now_user_center_x);
        let y_side = (now_bullet.y_position - now_user_center_y) * (now_bullet.y_position - now_user_center_y);
        if( x_side + y_side < 70 ){
          deleted_user.push(now_user.user_id);
          continue;
        }
      }

      for(var u in deleted_user){
        for(var b in bulletList){
          if(u == bulletList[b].bullet_owner){
            delete bulletList[b];
            deleted_bullet.push(now_bullet.bullet_id);
          }
        }
      }

  }

}

setInterval(intervalFunc, 16);

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
    userList[socket.user_id] = new user(x_position, y_position, socket.user_id);

    console.log(userList);

    socket.emit('login', {userList : userList, bulletList : bulletList} );
    socket.broadcast.emit('another_user_login', {add_user: userList[socket.user_id] } );

  });

  setInterval(update_user_position, 50);

  function update_user_position(){
    io.emit("state_user_update", {userList: userList});
    io.emit("state_bullet_update", {bulletList: bulletList});
    io.emit("defeat_user", {userList: deleted_user});
    io.emit("delete_bullet", {bulletList: deleted_bullet});
    for(var u in deleted_user){
      for(var user in userList){
        if(userList[user].user_id == u){
          delete userList[user];
        }
      }
    }
    deleted_bullet = [];
    deleted_user = [];
  };

  socket.on('move_rotate', function(data) {
    userList[socket.user_id].where_rotate = data.rotate * 1;
  });

  socket.on('move_forward',function(data) {
    userList[socket.user_id].where_move = data.move * 1;
  });

  socket.on('stop_rotate', function(data){
    userList[socket.user_id].where_rotate = data.rotate * 1;
  });

  socket.on('stop_forward', function(data){
    userList[socket.user_id].where_move = data.move * 1;
  });

  socket.on('fire_bullet', function(data){
    if(userList[socket.user_id].bullet_count < 11){
      let rotate = userList[socket.user_id].rotate;
      let x_position = userList[socket.user_id].x_position;
      let y_position = userList[socket.user_id].y_position;
      let bullet_x_position = x_position + 6 + 15 * Math.sin(Math.PI * rotate / 180);
      let bullet_y_position = y_position + 10 - 15 * Math.cos(Math.PI * rotate / 180);
      let bullet_x_speed = 3 * Math.sin(Math.PI * rotate / 180);
      let bullet_y_speed = -3 * Math.cos(Math.PI * rotate / 180);
      bulletList[data.bullet_id] = new bullet(socket.user_id, data.bullet_id, bullet_x_position, bullet_y_position, bullet_x_speed, bullet_y_speed);
      userList[socket.user_id].bullet_count++;
    }
  });

  // 클라이언트로부터의 메시지가 수신되면

  // 메시지를 전송한 클라이언트를 제외한 모든 클라이언트에게 메시지를 전송한다
  //socket.broadcast.emit('chat', msg);

  // 메시지를 전송한 클라이언트에게만 메시지를 전송한다
  // socket.emit('s2c chat', msg);

  // 접속된 모든 클라이언트에게 메시지를 전송한다
  // io.emit('s2c chat', msg);

  // 특정 클라이언트에게만 메시지를 전송한다
  // io.to(id).emit('s2c chat', data);

  // force client disconnect from server
  socket.on('forceDisconnect', function() {
    let id = socket.user_id;
    console.log('user disconnected: ' + id);
    for(var b in bulletList){
        let now_bullet = bulletList[b];
        if(now_bullet.bullet_owner == id){
          delete bulletList[b];
        }
    }
    delete userList[id];
    io.emit('destory_user', {user_id: id});
  })

  socket.on('disconnect', function() {
    let id = socket.user_id;
    console.log('user disconnected: ' + id);
    for(var b in bulletList){
        let now_bullet = bulletList[b];
        if(now_bullet.bullet_owner == id){
          delete bulletList[b];
        }
    }
    delete userList[id];
    io.emit('destory_user', {user_id: id});
  });
});

server.listen(3000, function() {
  console.log('Socket IO server listening on port 3000');
});
