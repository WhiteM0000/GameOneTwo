//КОНСТАНТЫ ДЛЯ СТАТУСОВ
    const BALL_ON_PLAYER = 1;
    const BALL_ON_ENEMY  = 2;
    const GAME_WAIT_ENEMY = 3;
    const BALL_IN_PLAY   = 6;


//ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
	var config = {
		type: Phaser.AUTO,
		parent: 'phaser-example',
		width: 800,
		height: 600,
		scale: {mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH},
		physics: {
		    default: 'arcade',
		    arcade: {
			    debug: false,
			    gravity: { y: 0 }
		    }
		},
		scene: {preload: preload, create: create, update: update}
	};
    var game = new Phaser.Game(config);
	var game_server = "/game_two/server/";


//СТАНДАРТНЫЕ ФУНКЦИИ
    function preload() {
		this.load.image('ball', 'static/assets/img/ball16.png');
		this.load.image('paddle', 'static/assets/img/paddle.png');

        //начальное состояние игры для сервера
        this.gameInfo = {
            tableId: false,    //- номер игрового стола
            paddleId: false,   //- номер игрока
            enemyId: false,    //- номер противника
            gameState: false,  //- текущее состояние игры
            paddleX: false,    //координата ракетки игрока
            enemyX: false,     //координата ракетки противника
            ballX: false,      //координата мяча
            ballY: false,       //координата мяча
            ball_velocityX: false,
            ball_velocityY: false,
            paddle_velocity: false,
            enemy_velocity: false,
            event: false
        };

   }


    function create() {
        //начальное положение объектов
        this.padX = this.cameras.main.displayWidth*0.5;
        this.padY = this.cameras.main.displayHeight - this.cameras.main.displayHeight*0.05;
        this.enemyX = this.cameras.main.displayWidth*0.5;
        this.enemyY = this.cameras.main.displayHeight*0.05;
        this.ballX = this.padX;
        this.ballY = this.padY - 16;//фиксить
        this.ball_velocityX_start = -180;
        this.ball_velocityY_start = -180;
        this.ball_velocityX = 0;
        this.ball_velocityY = 0;


        //режим игры
        this.gameMode = false;

        //создание мячика
        this.ball = this.physics.add.image(this.ballX, this.ballY, 'ball').setOrigin(0.5, 0.5);
        this.ball.setCollideWorldBounds(true);
        this.ball.body.onWorldBounds = true;//включение прослушки столкновения с границами
        this.ball.setBounce(1);//отскок от всех

        //создание ракетки
        this.paddle = this.physics.add.image(this.padX, this.padY, 'paddle').setOrigin(0.5, 1);
        this.paddle.setCollideWorldBounds(true);
        this.paddle.setImmovable(true);

        //создание противника
        this.enemy = this.physics.add.image(this.enemyX, this.enemyY, 'paddle').setOrigin(0.5, 1);
        this.enemy.setCollideWorldBounds(true);
        this.enemy.setImmovable(true);

        //табло
        this.scoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' });
        this.scorePaddle = 0;
        this.scoreEnemy = 0;
        this.scoreText.setText('Cчет: ' + String(this.scorePaddle) + ' : ' + String(this.scoreEnemy));
        this.messageText = this.add.text(584, 16, '', { fontSize: '16px', fill: '#FF0000' });
        this.messagesForPlayer = this.add.text(100, 300, '', { fontSize: '32px', fill: '#FF7700' });

        //столкновения
        this.physics.add.collider(this.ball, this.paddle, paddlePad, null, this);
        this.physics.add.collider(this.ball, this.enemy, enemyPad, null, this);
        this.physics.world.on('worldbounds', onWorldBounds, this);

        //инициализация управления
        keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        //работа с сервером
        this.server_timer_index = 0;
        this.server_timer_tnd = 30;
        this.server = game_server;//адрес сервера
        this.server_lock = false;//блокировка запросов до получения ответа или истечения времени
        request(this, false, gameSinchro);//функция обработки ответов сервера ---------> самый первый запрос отправляет неинициализированный массив
   }

    function update() {
        //проверка состояния
        if(this.gameMode == BALL_IN_PLAY){
            this.paddle.x = this.input.x || this.cameras.main.displayWidth*0.5;
        }
        if(this.gameMode == GAME_WAIT_ENEMY){
            //if(this.server_timer_index == this.server_timer_tnd) request(this, gameSinchro);
            this.messagesForPlayer.setText('Ожидание подключения соперника.');
        }
        if(this.gameMode == BALL_ON_ENEMY){
            //if(this.server_timer_index == this.server_timer_tnd) request(this, gameSinchro);
            this.messagesForPlayer.setText('Подача соперника!');
        }
        if(this.gameMode == BALL_ON_PLAYER){
            //if(this.server_timer_index == this.server_timer_tnd)
            this.messagesForPlayer.setText('Для подачи мяча нажмите пробел!');
            if(keySpace.isDown) newPaddleSet(this);
        }
        //таймер
        this.server_timer_index++;
        if(this.server_timer_index > this.server_timer_tnd){
            this.server_timer_index = 0;
            this.gameInfo.event = false;
            request(this, false, gameSinchro);
        }
    }


    function gameSinchro(self, error, message) {
        //СИНХРОНИЗАЦИЯ С СЕРВЕРОМ (получение ответа и обновление статуса)
        if (error) self.messageText.setText('ErrorMsg');
        else{
            self.messageText.setText(message);
            self.gameInfo = JSON.parse(message);
            updateGameState(self);
                console.log('получаю->');
                console.log(self.gameInfo);
            self.server_lock = false;
        }
    }


    function onWorldBounds(body,up,down,left,right)
    {
        if(up){
            this.scorePaddle++;
            //this.ball.setVelocityX(0);
            //this.ball.setVelocityY(0);
            //this.gameMode = BALL_ON_ENEMY;
            //console.log(this.ball.body.velocity);
            request(this, 'BOUND_UP', gameSinchro);
        }
        if(down){
            this.scoreEnemy++;
            //this.ball.setVelocityX(0);
            //this.ball.setVelocityY(0);
            //this.gameMode = BALL_ON_PLAYER;
            //this.paddle.x = this.padX;
            //this.paddle.y = this.padY;
            this.messagesForPlayer.setText('Для подачи мяча нажмите пробел!');
            request(this, 'BOUND_DOWN', gameSinchro);
        }
        if(left) request(this, 'BOUND_LEFT', gameSinchro);
        if(right) request(this, 'BOUND_RIGHT', gameSinchro);
        this.scoreText.setText('Cчет: ' + String(this.scorePaddle) + ' : ' + String(this.scoreEnemy));
    }


    function newPaddleSet(self){
        self.ball.x = self.ballX;
        self.ball.y = self.ballY;
        self.paddle.x = self.padX;
        self.paddle.y = self.padY;
        self.ball_velocityX = self.ball_velocityX_start;
        self.ball_velocityY = self.ball_velocityY_start;
        self.ball.setVelocityX(self.ball_velocityX);
        self.ball.setVelocityY(self.ball_velocityY);
        self.gameMode = BALL_IN_PLAY;
        self.messagesForPlayer.setVisible(false);
        request(self, 'BALL_SET', gameSinchro);//отправка события "подача"

    }


    function paddlePad(player, obstacle){
    //ОБРАБОТКА СТОЛКНОВЕНИЙ МЯЧА И РАКЕТКИ
        request(this, 'PADDLE_TOCH', gameSinchro);
    }


    function enemyPad(player, obstacle){
    //ОБРАБОТКА СТОЛКНОВЕНИЙ МЯЧА И РАКЕТКИ ПРОТИВНИКА

    }


   function updateGameInfo(self){
        self.gameInfo.gameState = self.gameMode;
        self.gameInfo.paddleX = self.paddle.x;
        self.gameInfo.ballX = self.ball.x;
        self.gameInfo.ballY= self.ball.y;
        self.gameInfo.ball_velocityX = self.ball.body.velocity.x;
        self.gameInfo.ball_velocityY = self.ball.body.velocity.y;
        self.gameInfo.paddle_velocity = self.paddle.body.velocity.x;
        self.gameInfo.enemy_velocity = self.enemy.body.velocity.x;
        //console.log(self.ball.body.velocity);
   }


   function updateGameState(self){
        self.gameMode = self.gameInfo.gameState;
        self.paddle.x = self.gameInfo.paddleX;
        self.enemy.x = self.gameInfo.enemyX;
        self.ball.x = self.gameInfo.ballX;
        self.ball.y = self.gameInfo.ballY
        self.ball_velocityX = self.gameInfo.ball_velocityX;
        self.ball_velocityY = self.gameInfo.ball_velocityY;
        self.ball.body.velocity.x = self.gameInfo.ball_velocityX;
        self.ball.body.velocity.y = self.gameInfo.ball_velocityY;
        self.paddle.body.velocity.x = self.gameInfo.paddle_velocity;
         self.enemy.body.velocity.x = self.gameInfo.enemy_velocity;
   }


    function request(self, event, callback) {
        if(!self.server_lock){
              self.server_lock = true;
              const xhr = new XMLHttpRequest();
              xhr.timeout = 2000;
              xhr.onreadystatechange = function(e) {
                    if (xhr.readyState === 4) {
                          if (xhr.status === 200) {
                           callback(self, null, xhr.response)
                          }
                          else {
                           callback(self, xhr.status, null)
                          }
                    }
              }
              xhr.ontimeout = function () {
                    console.log('Timeout')
                    self.server_lock = false;
              }
              updateGameInfo(self);
              self.gameInfo.event = event;
                console.log('отправляю->');
                console.log(self.gameInfo);
              xhr.open("POST", self.server);
              xhr.setRequestHeader('Content-Type', 'application/json');
              xhr.send(JSON.stringify(self.gameInfo));
        }
    }
