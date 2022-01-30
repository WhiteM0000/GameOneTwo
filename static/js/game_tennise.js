	var game = new Phaser.Game(800, 600, Phaser.AUTO, null, {preload: preload, create: create, update: update});

	var ball;
	var paddle;

	function preload() {
		//handleRemoteImagesOnJSFiddle();
		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		game.scale.pageAlignHorizontally = true;
		game.scale.pageAlignVertically = true;
		game.stage.backgroundColor = '#eee';
		game.load.image('ball', 'static/assets/img/ball16.png');
		game.load.image('paddle', 'static/assets/img/paddle.png');
	}

	function create() {
		game.physics.startSystem(Phaser.Physics.ARCADE);
		game.physics.arcade.checkCollision.down = false;

		ball = game.add.sprite(game.world.width*0.5, game.world.height-25, 'ball');
		ball.anchor.set(0.5);
		game.physics.enable(ball, Phaser.Physics.ARCADE);
		ball.body.velocity.set(200, -200);
		ball.body.collideWorldBounds = true;
		ball.body.bounce.set(1);
		ball.checkWorldBounds = true;
		ball.events.onOutOfBounds.add(function(){alert('Game over!');location.reload();}, this);


		paddle = game.add.sprite(game.world.width*0.5, game.world.height-25, 'paddle');
		paddle.anchor.set(0.5,1);paddle.anchor.set(0.5,1);
		game.physics.enable(paddle, Phaser.Physics.ARCADE);
		paddle.body.immovable = true;
	}

	function update() {
			game.physics.arcade.collide(ball, paddle);
			paddle.x = game.input.x || game.world.width*0.5;
	}


	// this function (needed only on JSFiddle) take care of loading the images from the remote server
	function handleRemoteImagesOnJSFiddle() {
		game.load.baseURL = 'https://end3r.github.io/Gamedev-Phaser-Content-Kit/demos/';
		game.load.crossOrigin = 'anonymous';
	}
