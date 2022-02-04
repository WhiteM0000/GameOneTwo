
//----------------------------------------------------------------------------------------------------------------------
//                                             ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
//----------------------------------------------------------------------------------------------------------------------

    //Настройки
    var settings = {
        width: 1280,
        height: 1024,
        background: 'rgba(50, 83, 39, 1)',
        main_menu: 0x0ed145,
        main_menu_notactive: 0x005800,
        text_state: {fontFamily: 'American Captain Cyrillic', fontSize: '48px', fill: '#0ECE44'},
        text_btn: {fontFamily: 'American Captain Cyrillic', fontSize: '30px', fill: '#0ECE44'},
        text_btn_notactive: {fontFamily: 'American Captain Cyrillic', fontSize: '30px', fill: '#002F00'},
        text_dino: {fontFamily: 'Arial', fontSize: '36px', fill: '#ffff00'},
        dec: {img_filename: 'dec_eternity.png', x: 10, y: 10, chip_size: 48, position: {one: 982, seven: 448, thirt: 96, ninet: 635, up: 113, down: 972, delta: 70.5}},
        game_type: 'Nardgammon',
        enemy: {surname: 'Семенов', firstname: 'Семен', secondname: 'Семенович'},
        dice: {img_filename: 'dice_animations.png', scale: 0.7, frames: {frameWidth: 190, frameHeight: 172}},
        diceS: {img_filename: 'dice_animations.png', scale: 0.7, frames: {frameWidth: 190, frameHeight: 172}},
        cap: {img_filename: 'cap_100x100.png', frames: {frameWidth: 200, frameHeight: 200}},
        chipW: {img_filename: 'chip_white1.png'},
        chipB: {img_filename: 'chip_black1.png'},
        dir_assets: 'static/assets/nardy/img/'
    }

    //Конфигурация игры
	var config = {
		type: Phaser.AUTO,
		parent: 'phaser-example',
		width: settings.width,
		height: settings.height,
		scale: {mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH},
		physics: {
		    default: 'arcade',
		    arcade: {
			    debug: false,
			    gravity: { y: 0 }
		    }
		},
		scene: {preload: preload,
		        create: create,
		        update: update}
	};
	var game = new Phaser.Game(config);
    var game_self;

//----------------------------------------------------------------------------------------------------------------------
//                                              СТАНДАРТНЫЕ ФУНКЦИИ
//----------------------------------------------------------------------------------------------------------------------
	function preload(){
	//ФУНКЦИЯ
	    //Загрузка рисунков
	    this.load.image('dec', settings.dir_assets + settings.dec.img_filename);
	    this.load.image('chipW', settings.dir_assets + settings.chipW.img_filename);
	    this.load.image('chipB', settings.dir_assets + settings.chipB.img_filename);
	    //Загрузка анимации
	    this.load.spritesheet('dice', settings.dir_assets + settings.dice.img_filename, settings.dice.frames);
	    this.load.spritesheet('diceS', settings.dir_assets + settings.diceS.img_filename, settings.diceS.frames);
	    this.load.spritesheet('cap', settings.dir_assets + settings.cap.img_filename, settings.cap.frames);

	}


	function create(){
	//ФУНКЦИЯ

        //Цвет фона
        this.camera = this.cameras.add(0, 0, settings.width, settings.height);
        this.camera.setBackgroundColor(settings.background);

	    //Создание игральной доски
	    decGreat(this);

        //Фишки
        //chipsCreate(this);

	    //Mеню игры
	    menu_create(this);


	    //Создание кубиков
	    createDiceFirst(this);
	    createDiceSecond(this);

	    //Создание стаканчика
        this.cap = this.physics.add.sprite(this.dec.x + this.dec.view.width + (settings.width - this.dec.x - this.dec.view.width)*0.5, settings.height*0.68, 'cap').setDisplaySize(settings.cap.frames.frameWidth * this.dec.view.scale_width, settings.cap.frames.frameHeight * this.dec.view.scale_height).setInteractive();
        this.anims.create({key: 'cap_sheik', frames: this.anims.generateFrameNumbers('cap', { frames: [2, 1, 0, 1, 2, 3, 4, 3, 2] }), frameRate: 20, repeat: 1});
        this.cap.on('animationcomplete-cap_sheik', stopMoveCap, this);
        //this.cap.on('pointerup', clickCap, this);
        activateCapP(this, false);

        //Управление
        keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        //Курсор мыши для выделения фишки
        this.graphMouseCircle = this.add.graphics();
        this.graphMouseCircle.depth = 17;

        //Список вариантов (массив) шагов для перемещения фишек игроком
        this.moveChips = [];//выставляется в функции броска фишек

        //Режим игры
        game_self = this;
        this.stage_mode = 'begin';
        stageControl(this);
	}

	function update(){
	//ФУНКЦИЯ
        /*
        if (keySpace.isDown){
           this.diceS.setVisible(false);
           this.dice.setVisible(false);
           this.cap.anims.play('cap_sheik', true);
        }
        */
        chipDraw(this);//перемещение фишки
	}


//----------------------------------------------------------------------------------------------------------------------
//                                              ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ
//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
    function stageControl(self){
    //КОНТРОЛЬ ПЕРЕКЛЮЧЕНИЯ РЕЖИМОВ
        //Режим игры: ('begin' - начало игры, необходимые заставки
        //             'priority' - определение очередности (бросок одного кубика игроком),
        //             'priority_waiting' - определение очередности (бросок одного кубика противником),
        //             'white_dice' - босок белых (игрок), 'white_next' - перемещение фишек белых,
        //             'white_break' - сброс фишек белых (игрок),
        //             'black_dice' - босок черных (противник), 'black_next' - перемещение фишек черных.
        //             'black_break' - сброс черных (противник)
    console.log('СРАБОТАЛА...stageControl');
    console.log('НА ВХОДЕ: self.stage_mode='+self.stage_mode);
        switch(self.stage_mode){
            case 'begin':
                self.stage_mode = 'connect';
                break;

            case 'connect':
                self.stage_mode = 'priority';
                activateCapP(self, true);
                self.white_first_step = true;
                self.black_first_step = true;
                break;

            case 'priority': self.stage_mode = 'priority_waiting';
                self.player_dice_num = self.dice.number;
                console.log('Игрок выбросил (player_dice_num)=' + self.player_dice_num);
                console.log('Ждем броска противника...');
                activateCapP(self, false);
                break;

            case 'priority_waiting':
                self.enemy_dice_num = self.diceS.number;
                console.log('Противник выбросил (enemy_dice_num)=' + self.enemy_dice_num);
                activateCapP(self, true);
                if(self.enemy_dice_num == self.player_dice_num) self.stage_mode = 'priority';
                else{
                    if(self.enemy_dice_num > self.player_dice_num){
                        self.stage_mode = 'black_dice';
                        self.player_color = 'black';
                        activateCapP(self, false);
                   }
                    else{
                        self.stage_mode = 'white_dice';
                        self.player_color = 'white';

                    }
                    chipsCreate(self);
                }
                break;

            case 'white_dice':
                fullStepsArray(self);//заполнение массива возможных перемещений
                self.stage_mode = 'white_next';
                activateCapP(self, false);
                activateButtonEscStep(self, false, true);
                activateButtonEndStep(self, false, true);
                console.log('Возможные перемещения (player_steps_array)...');
                self.stack_steps = [];//сбросить стек сделанных ходов...
                self.white_had_num = 0;//сбросить счетчик взятых фишек с головы
                for(i in self.player_steps_array) console.log(self.player_steps_array[i]);
                break;

            case 'white_next'://игрок перемещает фишки
                self.stage_mode = 'black_dice';
                activateButtonEscStep(self, false, false);
                activateButtonEndStep(self, false, false);
                break;

            case 'black_dice'://противник бросает кубики
                self.stage_mode = 'black_next';
                break;

            case 'black_next'://противник перемещает фишки
                self.stage_mode = 'white_dice';
                setTimeout(function(){activateCapP(self, true);}, 500);
                break;
        }
        sendServerMessage(self);
        console.log('НА ВЫХОДЕ Стадия (stage_mode)=' + self.stage_mode);
    }
//----------------------------------------------------------------------------------------------------------------------
    //ПОЛУЧЕНО СООБЩЕНИЕ О СОБЫТИИ НА СЕРВЕРЕ, ОБРАБОТКА (ВЫЗЫВАЕТСЯ СОБЫТИЕМ 'server_response', ОБРАБОТЧИК В ФАЙЛЕ 'websocket.js')
    function serverReact(msg){
        console.log('<serverReact1> game.stage_mode = ' + game_self.stage_mode);
        console.log('<serverReact2> msg.stage_mode = ' + msg.stage_mode);
        console.log(msg);
        if(msg.stage_mode == game_self.stage_mode){
            switch(game_self.stage_mode){

                case 'connect':
                    stageControl(game_self);
                    break;
                case 'priority_waiting':
                    game_self.diceS.number = msg.dice;
                    diceRoll(game_self, false, false);
                    break;
                /*
                case 'black_dice'://противник бросил кубики
                    game_self.diceS.number = msg.diceS;
                    game_self.dice.number = msg.dice;
                    diceRoll(game_self, false, true);
                    break;

                case 'black_next'://противник сделал ход
                    blacksGon(msg);
                    break;
                */
            }
        }
        else{
            console.log('<serverReact3> стадии не совпадают!');
            let err = false;//наличие ошибок
            switch(msg.stage_mode){
                case 'priority_waiting':
                    if(game_self.stage_mode == 'priority'){
                        game_self.diceS.number = msg.dice;
                        diceRoll(game_self, false, false);
                    }
                    break;
                case 'priority':
                    if(game_self.stage_mode == 'priority_waiting'){
                        game_self.stage_mode = 'priority'
                        activateCapP(game_self, true);
                    }
                    break;
                case 'black_dice':
                    if(game_self.stage_mode == 'priority_waiting'){
                        game_self.player_color = 'white';
                        chipsCreate(game_self);
                    }
                    if(game_self.stage_mode == 'black_next'){
                        if(!blacksGon(msg)) err = true;//проверка расположения своих фишек
                    }
                    if(!err){
                        game_self.stage_mode = 'white_dice';
                        activateCapP(game_self, true);
                    }
                    else console.log('<serverReact101> ОШИБКА расположения своих фишек!');
                    break;
                case 'white_dice':
                    if(game_self.stage_mode == 'priority_waiting'){
                        game_self.player_color = 'black';
                        chipsCreate(game_self);
                    }
                    game_self.stage_mode = 'black_dice';
                    break;
                case 'white_next':
                    game_self.stage_mode = 'black_dice';
                    game_self.diceS.number = msg.diceS;
                    game_self.dice.number = msg.dice;
                    diceRoll(game_self, false, true);
                    break;
            }
        }
    }
//----------------------------------------------------------------------------------------------------------------------
    //ЗАФИКСИРОВАТЬ ХОД ПРОТИВНИКА НА ИГРОВОМ ПОЛЕ
    function blacksGon(msg){
        let ret = true;//ошибка, если расположение своих фишек не совпадает
        //Преобразование поля, полученного от противника в свое...
        field_en = [];
        let ile = 12;//счетчик линий на поле противника
        for(let il=0;il<24;il++){
            let black_num = msg.field[ile].white;
            let white_num = msg.field[ile].black;
            field_en.push({black: black_num, white: white_num})
            ile++; if(ile > 23) ile = 0;
        }
        console.log('<blacksGon> field_en=');
        console.log(field_en);

        //Получить номера фишек, которые переместили...
        let moveChips =[];
        for(let il=0;il<24;il++){
            if(game_self.dec.line[il].white != field_en[il].white) ret = false;
            let redraw_line = false;
            if(game_self.dec.line[il].black > 0){
                while(field_en[il].black < game_self.dec.line[il].black){
                    redraw_line = true;
                    moveChips.push(game_self.dec.line[il].arrow_ids.pop());
                    game_self.dec.line[il].black--;
                }
            }
            if(redraw_line) lineDraw(game_self, il);
        }

        //Переместить фишки на линии...
        for(let il=0;il<24;il++){
            let redraw_line = false;
            while(field_en[il].black > game_self.dec.line[il].black){
                game_self.dec.line[il].black++;
                let chip_id = moveChips.pop();
                game_self.dec.line[il].arrow_ids.push(chip_id);
                game_self.chipB[chip_id - 16].lineIndex = il;
                game_self.chipB[chip_id - 16].depth = game_self.dec.line[il].black + game_self.dec.line[il].white;
                redraw_line = true;
            }
            if(redraw_line) lineDraw(game_self, il);
        }
        stageControl(game_self);
        return ret;
    }
//----------------------------------------------------------------------------------------------------------------------
    //ОТПРАВКА СООБЩЕНИЯ СЕРВЕРУ (ПЕРЕМЕННАЯ socket И ФУНКЦИИ ОПРЕДЕЛЕНЫ В ФАЙЛЕ 'websocket.js')
    function sendServerMessage(self){
        if(self.stage_mode == 'connect'){socket.emit('join', {room: 'testroom'});}
        else{
            //состояние игры (позиции фишек игрока и т.д)...
            let chipsW = [];
            if(self.chipW){for(var i = 0; i < 15; i++) chipsW.push(self.chipW[i].lineIndex);}
            let field = fieldCopy(self);
            let nardy_stage = { stage_mode: self.stage_mode,
                                dice: self.dice.number,
                                diceS: self.diceS.number,
                                chipsW: chipsW,
                                field: field};
            socket.emit('nardy_stage', nardy_stage);
        }
    }
//----------------------------------------------------------------------------------------------------------------------
    function fullStepsArray(self){
    //ЗАПОЛНЕНИЕ МАССИВА ВОЗМОЖНЫХ ПЕРЕМЕЩЕНИЙ ФИШЕК (КОЛИЧЕСТВО ШАГОВ)
        self.player_steps_array = [];
        if(self.dice.number > self.diceS.number){
            self.player_steps_array.push(self.dice.number);
            self.player_steps_array.push(self.diceS.number);
        }
        else{
            self.player_steps_array.push(self.diceS.number);
            self.player_steps_array.push(self.dice.number);
            if(self.diceS.number == self.dice.number){
                self.player_steps_array.push(self.dice.number);
                self.player_steps_array.push(self.dice.number);
            }
        }
        if(self.white_first_step){
                //Примечание: При первом броске белых 5-5, и последующем броске чёрными 4-4,
                //последние снимают одну шашку с головы играя одну четвёрку, так как пройти дальше мешает созданная помеха.
                //-------- Не требует оговорок в программе????? ----------- делать при проверке возможности хода
        }
        else{
            //Ghjdthrf djpvj;yjcnb [jljd b elfktybt ytdjpvj;ys[
            canSteps(self);
            if(!self.flag_full_step){//если не возможен полный ход
                if(self.player_steps_array.length < 4){//если не куш
                    if(!self.flag_big_step){//если не доступен большой ход
                        self.player_steps_array.splice(0,1);//убираем большой
                        if(!self.flag_small_step) self.player_steps_array.splice(0,1);//если не доступен маленький, то убираем
                    }
                    else self.player_steps_array.splice(1,1);//если доступен большой, то убираем маленький
                }
                else self.player_steps_array.splice(0,4 - self.step_count);//если куш, то вырезаем лишнее
            }
        }
    }
//----------------------------------------------------------------------------------------------------------------------
    //ОПРЕДЕЛЕНИЕ ВОЗМОЖНОСТИ (ПЕРЕБОР ВАРИАНТОВ ХОДОВ) пока без учета начала игры (с головы можно брать только по одной)
    function canSteps(self){
        self.flag_small_step = false;
        self.flag_big_step = false;
        for(let iline=0;iline<24;iline++){//цикл по всем линиям (начало хода)
            let steps = stepsCopy(self);//копия массива перемещений
            let field = fieldCopy(self);//сделать копию игрового поля
            let flag_small_step = false;
            var flag_full_step = false;
            let flag_big_step = canStepAndCorrectArrays(iline, field, steps, 0);//попытка первым шагом
            if(!flag_big_step && steps.length < 3) flag_small_step = canStepAndCorrectArrays(iline, field, steps, 1);//если не куш, попытка вторым шагом
            console.log('<canFullStep> counter=1 iline=' + iline + ' flag_big_step=' + flag_big_step + ' flag_small_step=' + flag_small_step);
            //Если первый шаг возможен, то попытка переместить еще что нибудь куда - нибудь...
            if(flag_big_step || flag_small_step){
                var flag_and_count = canGO(1, 1, 24, steps, field);
                flag_full_step = flag_and_count.flag;
            }
            if(flag_big_step) self.flag_big_step = true;
            if(flag_small_step) self.flag_small_step = true;
            if(flag_full_step) break;
        }
        self.flag_full_step = flag_full_step;
        self.step_count = flag_and_count.count;
        console.log('<canFullStep> EXIT: step_count=' + self.step_count + ' flag_full_step=' + self.flag_full_step + ' flag_big_step=' + self.flag_big_step + ' flag_small_step=' + self.flag_small_step);
    }
//----------------------------------------------------------------------------------------------------------------------
    //ВЛОЖЕННАЯ ФУНКЦИЯ ДЛЯ ПРОВЕРКИ ВОЗМОЖНОСТИ СДЕЛАТЬ ПОСЛЕДОВАТЕЛЬНОСТЬ ОСТАВШИХСЯ ХОДОВ
    function canGO(counter, line_begin, line_end, steps, field){
        //line_begin - начальная линия
        //line_end - конечная линия + 1
        //steps - массив доступных движений
        //field - массив с игровым полем
        counter++;
        for(let il=line_begin;il<line_end;il++){//цикл по всем линиям, кроме первой (с головы уже снято)
            let steps_t = []; Object.assign(steps_t, steps);//копия массива перемещений для этого цикла
            let field_t = []; Object.assign(field_t, field);//копия массива игрового поля для этого цикла
            let flag_full_step = canStepAndCorrectArrays(il, field_t, steps_t, 0);
            var flag_and_count = {flag: flag_full_step, count: counter};
            console.log('<canFullStep> counter=' + counter + ' il_t=' + il + ' flag_full_step=' + flag_full_step + ' steps_t.length=' + steps_t.length);
            if(flag_full_step && steps_t.length > 0) flag_and_count = canGO(counter, line_begin, line_end, steps_t, field_t);
            if(flag_and_count.flag) break;
         }
         return flag_and_count;
    }
//----------------------------------------------------------------------------------------------------------------------
    //ОПРЕДЕЛЯЕТ ВОЗМОЖНОСТЬ ПЕРЕМЕЩЕНИЯ ФИШКИ ИЗ ЗАДАННОЙ ПОЗИЦИИ И КОРРЕКТИРУЕТ МАССИВЫ, ЕСЛИ ПЕРЕМЕЩЕНИЕ ВОЗМОЖНО
    function canStepAndCorrectArrays(line, field, steps, iStep){
        //line - текущая фишки позиция на игровом поле
        //field - массив игрового поля,
        //steps - массив возможных ходов,
        //iStep - индекс в массиве возможных ходов
        var line_new = line + steps[iStep];
        var flag_full_step = field[line].white > 0 && line_new < 24 && field[line_new].black == 0;//флаг полного хода
        if(flag_full_step){//первый шаг возможен - меняем поле и массив шагов
            field[line].white--;
            field[line_new].white++;
            steps.splice(iStep,1);
        }
        return flag_full_step;
    }
//----------------------------------------------------------------------------------------------------------------------
    //ЗАПОЛНЕНИЕ КОПИИ МАССИВА ХОДОВ (ДЛЯ ПРОВЕРОК)
    function stepsCopy(self){
        var steps = [];
        Object.assign(steps, self.player_steps_array);//копия массива перемещений
        return steps;
    }
//----------------------------------------------------------------------------------------------------------------------
    //ЗАПОЛНЕНИЕ КОПИИ ИГРОВОГО ПОЛЯ (ДЛЯ ПРОВЕРОК)
    function fieldCopy(self){
        var field = [];
        for(let i_line in self.dec.line) field.push({white: self.dec.line[i_line].white, black: self.dec.line[i_line].black});
        /*
        field[1].black = 0;
        field[4].black = 0;
        field[3].black = 1;
        field[5].black = 1;
        field[6].black = 1;
        field[7].black = 1;
        field[8].black = 1;
        field[9].black = 1;
        */
        return field;
    }
//----------------------------------------------------------------------------------------------------------------------
    //ИГРОК ДЕРЖИТ И ПЕРЕМЕЩАЕТ ФИШКУ
    function chipDraw(self){
        if(self.chipW){
            for(var i = 0; i < 15; i++){
                if(self.chipW[i].handControl){
                    var x = self.input.x;
                    var y = self.input.y;
                    var r = self.chipW[i].scale * self.chipW[i].width * 0.5;
                    var color = 0xff0000;
                    var line_id = -1;
                    self.chipW[i].x = x;
                    self.chipW[i].y = y;
                    for(var il=0;il<24;il++){
                        if(x < self.dec.line[il].x + r*0.6 && x > self.dec.line[il].x - r*0.6){
                            if(il < 12){
                                if(y > self.dec.line[il].y && y < self.dec.y + self.dec.view.height * 0.4){
                                    line_id = il;
                                    break;
                                }
                            }
                            else{
                                if(y < self.dec.line[il].y  && y > self.dec.y  + self.dec.view.height - self.dec.view.height * 0.6){
                                    line_id = il;
                                    break;
                                }
                            }
                        }
                    }
                    if(line_id > 0){
                        var can_go = false;//можно идти

                        if(self.dec.line[line_id].black == 0 && line_id > self.chipW[i].lineIndex){
                            //Проверка возможных вариантов перемещения...
                            //var is=0;
                            var step = line_id - self.chipW[i].lineIndex
                            var steps_sum = 0;
                            for(var is=0;is<self.player_steps_array.length;is++){
                                steps_sum += self.player_steps_array[is];
                                if(self.player_steps_array[is] == step) can_go = true;
                                else{
                                    if(steps_sum == step){
                                        //Проверка наличия фишек противника на промежуточных шагах
                                        var step_line_sum = 0;
                                        for(var it=0;it<is+1;it++){
                                            var step_line = self.player_steps_array[it] + self.chipW[i].lineIndex;
                                            if(self.dec.line[step_line].black < 2) can_go = true;
                                            step_line_sum += self.player_steps_array[it];
                                            var step_line_next = step_line_sum + self.chipW[i].lineIndex;
                                            if(self.dec.line[step_line_sum].black > 1){
                                                can_go = false;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }

                        }
                        if(can_go) color = 0x00ff00;
                        else line_id = -1;
                    }
                    self.chipW[i].newline = line_id;//номер новой линии, если = -1, то на старое место!
                    self.graphMouseCircle.clear();
                    self.graphMouseCircle.lineStyle(5*self.dec.view.scale_width, color, 1);
                    self.graphMouseCircle.strokeCircle(x, y, r);
                }
            }
        }
    }
//----------------------------------------------------------------------------------------------------------------------
    //СОЗДАНИЕ ФИШЕК
    function chipsCreate(self){
        self.chipW = [];
        self.chipB = [];
        for(var i=0; i<15; i++){
            self.chipW.push({});
            self.chipB.push({});
            if(self.player_color == 'white'){
                self.chipW[i] = self.physics.add.image(0, 0, 'chipW').setOrigin(0.5, 0.5).setDisplaySize(settings.dec.chip_size * self.dec.view.scale_width, settings.dec.chip_size * self.dec.view.scale_height).setInteractive();
                self.chipB[i] = self.physics.add.image(0, 0, 'chipB').setOrigin(0.5, 0.5).setDisplaySize(settings.dec.chip_size * self.dec.view.scale_width, settings.dec.chip_size * self.dec.view.scale_height);
	        }
	        else{
                self.chipW[i] = self.physics.add.image(0, 0, 'chipB').setOrigin(0.5, 0.5).setDisplaySize(settings.dec.chip_size * self.dec.view.scale_width, settings.dec.chip_size * self.dec.view.scale_height).setInteractive();
                self.chipB[i] = self.physics.add.image(0, 0, 'chipW').setOrigin(0.5, 0.5).setDisplaySize(settings.dec.chip_size * self.dec.view.scale_width, settings.dec.chip_size * self.dec.view.scale_height);
	        }
	        self.chipW[i].setVisible(false);
	        self.chipB[i].setVisible(false);
	        self.chipW[i].depth = i+1;
	        self.chipB[i].depth = i+1;
            self.chipW[i].name = 'chipW';
            self.chipW[i].id = i;
            self.chipW[i].line = 0;
            self.chipW[i].handControl = false;
            self.chipB[i].name = 'chipB';
            self.chipB[i].id = i+16;
            self.chipB[i].line = 12;
            self.chipB[i].handControl = false;
        }
        chipStand(self);//расставить фишки
        console.log('<chipsCreate>');
        self.input.on('gameobjectdown', function (pointer, gameObject) {if(this.stage_mode == 'white_next' && gameObject.name == "chipW"){chipTouch(self, gameObject)}},self);
        self.input.on('gameobjectup', function (pointer, gameObject) {if(gameObject.name == "chipW"){chipFree(self, gameObject)}},self);
     }
//----------------------------------------------------------------------------------------------------------------------
    //ИГРОК БЕРЕТ ФИШКУ
    function chipTouch(self, gameObject){
        //Определить последняя-ли это фишка на линии
        var chips_line_num = self.dec.line[gameObject.lineIndex].white + self.dec.line[gameObject.lineIndex].black;
        var can_touch = true;
        //Проверка правила "Не более одной фишки с головы"...
        console.log('XXX (chipTouch) gameObject.lineIndex ='+gameObject.lineIndex);
        console.log('XXX (chipTouch) self.white_first_step ='+self.white_first_step);
        console.log('XXX (chipTouch) self.white_had_num ='+self.white_had_num);
        if(gameObject.lineIndex == 0){
            if(self.white_first_step){
                //Первый бросок партии предоставляет игрокам исключение из вышеуказанного правила.
                //Если одна шашка, которую только и можно снять с головы, не проходит, то можно снять вторую.
                //Таких бросков для игрока всего три:  шесть-шесть (6**6); четыре-четыре (4**4); три-три (3**3).
                //В данной ситуации сыграть одной шашкой полный ход нет возможности, так как мешают шашки противника,
                //стоящие на голове. Если выпадает одно из таких сочетаний, то игрок может снять с головы две шашки.
                if(self.diceS.number == 6 && self.dice.number == 6 ||
                   self.diceS.number == 4 && self.dice.number == 4 ||
                   self.diceS.number == 3 && self.dice.number == 3){
                    if(self.white_had_num > 1) can_touch = false;
                }
                else if(self.white_had_num > 0) can_touch = false;
            }
            else if(self.white_had_num > 0) can_touch = false;
        }
        //Проверка, что фишка верхняя...
        if(chips_line_num != gameObject.depth) can_touch = false;
        //Проверка, что все перемещения сделаны...
        if(self.player_steps_array.length == 0) can_touch = false;
        //Берем фишку, если можно...
        if(can_touch){
            gameObject.handControl = true;
            gameObject.scale_old = gameObject.scale;
            gameObject.x_old = gameObject.x;
            gameObject.y_old = gameObject.y;
            gameObject.scale = gameObject.scale_old * 1.3;
            gameObject.depth = 16;
        }
    }
//----------------------------------------------------------------------------------------------------------------------
    //ИГРОК ОТПУСКАЕТ ФИШКУ
    function chipFree(self, gameObject){
        if(gameObject.handControl){
            var test_change_stage = false;
            gameObject.handControl = false;
            gameObject.scale = gameObject.scale_old;
            self.graphMouseCircle.clear();
            if(gameObject.newline >= 0 && gameObject.lineIndex != gameObject.newline){
                //Убрать реализованное перемещение из массива...
                var step = gameObject.newline - gameObject.lineIndex;
                var steps_sum = 0;
                var splised_index = 0;
                var spliced_array = [];
                for(let is=0;is<self.player_steps_array.length;is++){
                    steps_sum += self.player_steps_array[is];
                    if(step == self.player_steps_array[is]){
                        splised_index = is;
                        spliced_array = self.player_steps_array.splice(splised_index, 1);
                        test_change_stage = true;
                        break;
                    }
                    if(step == steps_sum){
                        spliced_array = self.player_steps_array.splice(splised_index, is+1);
                        test_change_stage = true;
                        break;
                    }
                }
                //Заполнить стек сделанных ходов...
                self.stack_steps.push({chip: gameObject, oldline: gameObject.lineIndex, spliced: {index: splised_index, array: spliced_array}});
                //Закрепить новую позицию...
                //gameObject.x = self.dec.line[gameObject.newline].x;
                self.dec.line[gameObject.lineIndex].white--;
                self.dec.line[gameObject.lineIndex].arrow_ids.pop();
                self.dec.line[gameObject.newline].white++;
                self.dec.line[gameObject.newline].arrow_ids.push(gameObject.id);
                lineDraw(self, gameObject.lineIndex);
                if(gameObject.lineIndex == 0) self.white_had_num++;
                gameObject.lineIndex = gameObject.newline;
                gameObject.newline = -1;
                activateButtonEscStep(self, true, true);
            }
            else{
                gameObject.x = gameObject.x_old;
                gameObject.y = gameObject.y_old;
            }
            var chips_line_num = self.dec.line[gameObject.lineIndex].black + self.dec.line[gameObject.lineIndex].white;
            gameObject.depth = chips_line_num;
            lineDraw(self, gameObject.lineIndex);
            if(test_change_stage){
                console.log('Доступные варианты перемещения фишек >>> ' + self.player_steps_array.length);
                for(var is in self.player_steps_array) console.log(self.player_steps_array[is]);
                if(self.player_steps_array.length == 0) activateButtonEndStep(self, true, true);
            }
        }
    }
//----------------------------------------------------------------------------------------------------------------------
    function lineDraw(self, line_id){
    //ФУНКЦИЯ РАССЧИТЫВАЕТ ПАРАМЕТР СЖАТИЯ И ПРОРИСОВЫВАЕТ ВСЕ ФИШКИ НА ЛИНИИ
        //Расчет максимальной высоты линии по фишкам...
        var height = 0;
        for (var i in self.dec.line[line_id].arrow_ids) {
            var id = self.dec.line[line_id].arrow_ids[i];
            var h;
            if(id < 16) h = self.chipW[0].height * self.chipW[0].scale;
            else h = self.chipB[0].height * self.chipB[0].scale;
            height += h;
        }
        //Расчет параметра сжатия...
        var max_height = 0.28 * self.dec.view.height;
        var compression = 1;
        if(height > max_height) compression = max_height/height;
        //Прорисовка линии с учетом параметра сжатия...
        var y = self.dec.line[line_id].y;
        var delta = settings.dec.chip_size * self.dec.view.scale_width * compression;
        if(line_id >= 12) delta *= -1;
        for (var i in self.dec.line[line_id].arrow_ids) {
            var id = self.dec.line[line_id].arrow_ids[i];
            if(id < 16){
                self.chipW[id].y = y;
                self.chipW[id].x = self.dec.line[line_id].x;
            }
            else{
                self.chipB[id-16].y = y;
                self.chipB[id-16].x = self.dec.line[line_id].x;
            }
            y += delta;
        }
    }

//----------------------------------------------------------------------------------------------------------------------
    function chipStand(self){
    //РАССТАВИТЬ ФИШКИ НА НОВУЮ ИГРУ
        self.dec.line[0].white = 15;
        self.dec.line[12].black = 15;
        for(var i = 0; i < 15; i++){
            self.chipW[i].x = self.dec.line[0].x;
            self.chipW[i].lineIndex = 0;
            self.chipW[i].setVisible(true);
            self.chipB[i].x = self.dec.line[12].x;
            self.chipB[i].lineIndex = 12;
            self.chipB[i].setVisible(true);
            self.dec.line[0].arrow_ids.push(self.chipW[i].id);
            self.dec.line[12].arrow_ids.push(self.chipB[i].id);
        }
        lineDraw(self, 0);
        lineDraw(self, 12);
    }

//----------------------------------------------------------------------------------------------------------------------
    function decGreat(self){
    //СОЗДАНИЕ ИГРАЛЬНОЙ ДОСКИ
	    self.dec = self.physics.add.image(settings.dec.x, settings.dec.y, 'dec').setOrigin(0,0).setDisplaySize(settings.height - 2*settings.dec.y, settings.height - 2*settings.dec.y);
        self.dec.depth = 0;
        self.dec.view = {width: settings.height - 2*settings.dec.y,
                         height: settings.height - 2*settings.dec.y}
        self.dec.view.scale_width = self.dec.view.width/self.dec.width;
        self.dec.view.scale_height = self.dec.view.height/self.dec.height;
        self.dec.line = [];
        for (var i = 0; i < 6; i++){
            self.dec.line.push({ x: self.dec.x + settings.dec.position.one * self.dec.view.scale_width - settings.dec.position.delta * self.dec.view.scale_width * i,
                                 y: self.dec.y + settings.dec.position.up * self.dec.view.scale_height,
                                 white: 0, black: 0,  arrow_ids: []});
        }
        for (var i = 0; i < 6; i++){
            self.dec.line.push({ x: self.dec.x + settings.dec.position.seven * self.dec.view.scale_width - settings.dec.position.delta * self.dec.view.scale_width * i,
                                 y: self.dec.y + settings.dec.position.up * self.dec.view.scale_height,
                                 white: 0, black: 0,  arrow_ids: []});
        }
        for (var i = 0; i < 6; i++){
            self.dec.line.push({ x: self.dec.x + settings.dec.position.thirt * self.dec.view.scale_width + settings.dec.position.delta * self.dec.view.scale_width * i,
                                 y: self.dec.y + settings.dec.position.down * self.dec.view.scale_height,
                                 white: 0, black: 0,  arrow_ids: []});
        }
        for (var i = 0; i < 6; i++){
            self.dec.line.push({ x: self.dec.x + settings.dec.position.ninet * self.dec.view.scale_width + settings.dec.position.delta * self.dec.view.scale_width * i,
                                 y: self.dec.y + settings.dec.position.down * self.dec.view.scale_height,
                                 white: 0, black: 0,  arrow_ids: []});
        }
    }

//----------------------------------------------------------------------------------------------------------------------
    function activateCapP(self, active){
    console.log('СРАБОТАЛА...activateCapP');
        if(active){
            self.cap.on('pointerup', clickCap, self);
            self.cap.setVisible(true);
        }
        else{
            self.cap.off('pointerup');
            self.cap.setVisible(false);
        }
        console.log('activateCap=' + active);
    }

//----------------------------------------------------------------------------------------------------------------------
    function clickCap(){
    //ЗАПУСК АНИМАЦИИ СТАКАНЧИКА ДЛЯ КУБИКА
    console.log('СРАБОТАЛА...clickCap');
        if(this.stage_mode == 'priority' || this.stage_mode == 'priority_waiting' ||
           this.stage_mode == 'white_dice' || this.stage_mode == 'black_dice'){
           if(this.stage_mode == 'white_dice' || this.stage_mode == 'black_dice'){
                this.diceS.setVisible(false);
                this.dice.setVisible(false);
            }
            game_self.diceS.number = false;
            game_self.dice.number = false;
            this.cap.anims.play('cap_sheik', true);
        }
    }

//----------------------------------------------------------------------------------------------------------------------
    function stopMoveCap(){
    //ЗАПУСК АНИМАЦИИ БРОСКА КУБИКОВ
        var player = true;
        if(this.stage_mode == 'priority_waiting' || this.stage_mode == 'black_dice') player = false;
        var twins = false;
        if(this.stage_mode == 'white_dice' || this.stage_mode == 'black_dice') twins = true;
        diceRoll(this, player, twins);
    }

//----------------------------------------------------------------------------------------------------------------------
    function diceRoll(self, player, twins){
    //НАЧАЛЬНЫЕ ПАРАМЕТРЫ БРОСКА ПЕРВОГО ПРОТИВНИКА
        var x = self.dec.x + self.dec.view.width * 0.25;
        var dx = x * 0.1;
        var y = self.dec.y + self.dec.view.height * 0.12;
        var vx = 0;
        var dvx = dx * 2;
        var vy = self.dec.view.height * 0.35;
        self.diceS.enemy = !player;//определяет кем этот кубик брошен
        self.dice.enemy = !player;//определяет кем этот кубик брошен
        if(player){
            x = self.dec.x + self.dec.view.width * 0.75;
            y = self.dec.y + self.dec.view.height * 0.82;
            vy = -vy;
        }
	    if(twins){
            self.diceS.body.setVelocityY(vy);
            self.diceS.body.setVelocityX(vx + dvx);
            self.diceS.y = y;
            self.diceS.x = x + dx;
	        self.diceS.anims.play('diceS_down_begin', true);
            self.dice.body.setVelocityY(vy);

            self.dice.body.setVelocityY(vy);
            self.dice.y = y;
	        self.dice.x = x - dx;
	        self.dice.body.setVelocityX(vx - dvx);
	        self.dice.anims.play('dice_down_begin', true);
	    }
	    else{
	        if(player){
                self.dice.body.setVelocityY(vy);
                self.dice.body.setVelocityX(vx);
                self.dice.y = y;
                self.dice.x = x;
	            self.dice.anims.play('dice_down_begin', true);
	        }
	        else{
                self.diceS.body.setVelocityY(vy);
                self.diceS.body.setVelocityX(vx);
                self.diceS.x = x;
                self.diceS.y = y;
	            self.diceS.anims.play('diceS_down_begin', true);
	        }
	    }
    }

//----------------------------------------------------------------------------------------------------------------------
    function createDiceSecond(self){
    //СОЗДАНИЕ ВТОРОГО КУБИКА
        self.diceS = self.physics.add.sprite(270, -88, 'diceS').setDisplaySize(self.dec.view.scale_width*settings.diceS.frames.frameWidth * settings.diceS.scale, self.dec.view.scale_height*settings.diceS.frames.frameHeight * settings.diceS.scale);
        self.diceS.setVisible(false);
        self.anims.create({key: 'diceS_down_begin', frames: self.anims.generateFrameNumbers('diceS', {start: 0, end: 20}), frameRate: 20, repeat: 0, showOnStart: true, hideOnComplete: true});
        self.anims.create({key: 'diceS_down1', frames: self.anims.generateFrameNumbers('diceS', {start: 21, end: 27}), frameRate: getRandomInt(7, 15), repeat: 0, showOnStart: true, hideOnComplete: false});
        self.anims.create({key: 'diceS_down2', frames: self.anims.generateFrameNumbers('diceS', {start: 28, end: 34}), frameRate: getRandomInt(20, 50), repeat: 0, showOnStart: true, hideOnComplete: false});
        self.anims.create({key: 'diceS_down3', frames: self.anims.generateFrameNumbers('diceS', {start: 35, end: 41}), frameRate: getRandomInt(10, 30), repeat: 0, showOnStart: true, hideOnComplete: false});
        self.anims.create({key: 'diceS_down4', frames: self.anims.generateFrameNumbers('diceS', {start: 42, end: 48}), frameRate: getRandomInt(7, 15), repeat: 0, showOnStart: true, hideOnComplete: false});
        self.anims.create({key: 'diceS_down5', frames: self.anims.generateFrameNumbers('diceS', {start: 49, end: 55}), frameRate: getRandomInt(7, 15), repeat: 0, showOnStart: true, hideOnComplete: false});
        self.anims.create({key: 'diceS_down6', frames: self.anims.generateFrameNumbers('diceS', {start: 56, end: 62}), frameRate: getRandomInt(15, 45), repeat: 0, showOnStart: true, hideOnComplete: false});
        self.diceS.on('animationcomplete-diceS_down_begin', stopMoveDiceSecond, self);
        self.diceS.on('animationcomplete-diceS_down1', stopMoveDiceSecond1, self);
        self.diceS.on('animationcomplete-diceS_down2', stopMoveDiceSecond2, self);
        self.diceS.on('animationcomplete-diceS_down3', stopMoveDiceSecond3, self);
        self.diceS.on('animationcomplete-diceS_down4', stopMoveDiceSecond4, self);
        self.diceS.on('animationcomplete-diceS_down5', stopMoveDiceSecond5, self);
        self.diceS.on('animationcomplete-diceS_down6', stopMoveDiceSecond6, self);
        self.diceS.number = 1;
        self.diceS.depth = 20;
    }

//----------------------------------------------------------------------------------------------------------------------
    function createDiceFirst(self){
    //СОЗДАНИЕ ПЕРВОГО КУБИКА
        self.dice = self.physics.add.sprite(190, -88, 'dice').setDisplaySize(self.dec.view.scale_width*settings.dice.frames.frameWidth * settings.dice.scale, self.dec.view.scale_height*settings.dice.frames.frameHeight * settings.dice.scale);
        self.dice.setVisible(false);
        self.anims.create({key: 'dice_down_begin', frames: self.anims.generateFrameNumbers('dice', {start: 63, end: 83}), frameRate: 20, repeat: 0, showOnStart: true, hideOnComplete: true});
        self.anims.create({key: 'dice_down1', frames: self.anims.generateFrameNumbers('dice', {start: 21, end: 27}), frameRate: getRandomInt(7, 15), repeat: 0, showOnStart: true, hideOnComplete: false});
        self.anims.create({key: 'dice_down2', frames: self.anims.generateFrameNumbers('dice', {start: 28, end: 34}), frameRate: getRandomInt(20, 50), repeat: 0, showOnStart: true, hideOnComplete: false});
        self.anims.create({key: 'dice_down3', frames: self.anims.generateFrameNumbers('dice', {start: 35, end: 41}), frameRate: getRandomInt(10, 30), repeat: 0, showOnStart: true, hideOnComplete: false});
        self.anims.create({key: 'dice_down4', frames: self.anims.generateFrameNumbers('dice', {start: 42, end: 48}), frameRate: getRandomInt(7, 15), repeat: 0, showOnStart: true, hideOnComplete: false});
        self.anims.create({key: 'dice_down5', frames: self.anims.generateFrameNumbers('dice', {start: 49, end: 55}), frameRate: getRandomInt(7, 15), repeat: 0, showOnStart: true, hideOnComplete: false});
        self.anims.create({key: 'dice_down6', frames: self.anims.generateFrameNumbers('dice', {start: 56, end: 62}), frameRate: getRandomInt(15, 45), repeat: 0, showOnStart: true, hideOnComplete: false});
        self.dice.on('animationcomplete-dice_down_begin', stopMoveDiceFirst, self);
        self.dice.on('animationcomplete-dice_down1', stopMoveDiceFirst1, self);
        self.dice.on('animationcomplete-dice_down2', stopMoveDiceFirst2, self);
        self.dice.on('animationcomplete-dice_down3', stopMoveDiceFirst3, self);
        self.dice.on('animationcomplete-dice_down4', stopMoveDiceFirst4, self);
        self.dice.on('animationcomplete-dice_down5', stopMoveDiceFirst5, self);
        self.dice.on('animationcomplete-dice_down6', stopMoveDiceFirst6, self);
        self.dice.number = 1;
        self.dice.depth = 20;
    }

//----------------------------------------------------------------------------------------------------------------------
    function stopMoveDiceFirst(self){
        //НАЧАЛО АНИМАЦИИ И ОПРЕДЕЛЕНИЕ СЛУЧАЙНОГО ЗНАЧЕНИЯ ПЕРВОГО КУБИКА
        if(this.dice.enemy) this.dice.number = game_self.dice.number;
        else this.dice.number = getRandomInt(1, 6);
        switch(this.dice.number){
            case 1: this.dice.anims.play('dice_down1', true); break;
            case 2: this.dice.anims.play('dice_down2', true); break;
            case 3: this.dice.anims.play('dice_down3', true); break;
            case 4: this.dice.anims.play('dice_down4', true); break;
            case 5: this.dice.anims.play('dice_down5', true); break;
            case 6: this.dice.anims.play('dice_down6', true); break;
        }
        this.dice.body.setVelocityX(getRandomInt(-70, 70));
        this.dice.body.setVelocityY(getRandomInt(-70, 70));
    }

//----------------------------------------------------------------------------------------------------------------------
    //ОСТАНОВКА АНИМАЦИИ ПЕРВОГО КУБИКА
    function stopMoveDiceFirst1(self){ this.dice.body.setVelocity(0); stageControl(this);}
    function stopMoveDiceFirst2(self){ this.dice.body.setVelocity(0); stageControl(this);}
    function stopMoveDiceFirst3(self){ this.dice.body.setVelocity(0); stageControl(this);}
    function stopMoveDiceFirst4(self){ this.dice.body.setVelocity(0); stageControl(this);}
    function stopMoveDiceFirst5(self){ this.dice.body.setVelocity(0); stageControl(this);}
    function stopMoveDiceFirst6(self){ this.dice.body.setVelocity(0); stageControl(this);}

//----------------------------------------------------------------------------------------------------------------------
    function stopMoveDiceSecond(self){
        //НАЧАЛО АНИМАЦИИ И ОПРЕДЕЛЕНИЕ СЛУЧАЙНОГО ЗНАЧЕНИЯ ВТОРОГО КУБИКА
        if(this.diceS.enemy) this.diceS.number = game_self.diceS.number;
        else this.diceS.number = getRandomInt(1, 6);
        switch(this.diceS.number){
            case 1: this.diceS.anims.play('diceS_down1', true); break;
            case 2: this.diceS.anims.play('diceS_down2', true); break;
            case 3: this.diceS.anims.play('diceS_down3', true); break;
            case 4: this.diceS.anims.play('diceS_down4', true); break;
            case 5: this.diceS.anims.play('diceS_down5', true); break;
            case 6: this.diceS.anims.play('diceS_down6', true); break;
        }
        this.diceS.body.setVelocityX(getRandomInt(-70, 70));
        this.diceS.body.setVelocityY(getRandomInt(-70, 70));
    }

//----------------------------------------------------------------------------------------------------------------------
    //ОСТАНОВКА АНИМАЦИИ ВТОРОГО КУБИКА
    function stopMoveDiceSecond1(self){this.diceS.body.setVelocity(0); if(this.stage_mode == 'priority_waiting') stageControl(this);}
    function stopMoveDiceSecond2(self){this.diceS.body.setVelocity(0); if(this.stage_mode == 'priority_waiting') stageControl(this);}
    function stopMoveDiceSecond3(self){this.diceS.body.setVelocity(0); if(this.stage_mode == 'priority_waiting') stageControl(this);}
    function stopMoveDiceSecond4(self){this.diceS.body.setVelocity(0); if(this.stage_mode == 'priority_waiting') stageControl(this);}
    function stopMoveDiceSecond5(self){this.diceS.body.setVelocity(0); if(this.stage_mode == 'priority_waiting') stageControl(this);}
    function stopMoveDiceSecond6(self){this.diceS.body.setVelocity(0); if(this.stage_mode == 'priority_waiting') stageControl(this);}

//----------------------------------------------------------------------------------------------------------------------
    function getRandomInt(min, max) {
    //СЛУЧАЙНОЕ ЦЕЛОЕ ЧИСЛО В ДИАПАЗОНЕ
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

//----------------------------------------------------------------------------------------------------------------------
    function menu_create(self){
    //ФОРМИРОВАНИЕ ИГРОВОГО МЕНЮ
        //общие параметры
        var lines = 5 * self.dec.view.scale_width;
  	    self.graphics = self.add.graphics();
	    self.graphics.lineStyle(lines, settings.main_menu, 1);
	    self.game_menu = {};//параметры игрового меню
	    self.game_menu.x = settings.dec.x + (settings.height - 2*settings.dec.y) + 13 * self.dec.view.scale_width;//координата левого края всех инфо на экране
	    self.game_menu.width = settings.width - 13 * self.dec.view.scale_width - self.game_menu.x;//ширина всех инфо
	    self.game_menu.radius = 15  * self.dec.view.scale_width;//радиус закругления всех инфо
	    self.game_menu.split = 15  ;//разделитель всех инфо

	    //параметры окна "игра"
	    self.game_menu.type = {};
	    self.game_menu.type.y = settings.dec.y + 2* self.dec.view.scale_width;//координата инфо об игре по вертикали
	    self.game_menu.type.height = 110 * self.dec.view.scale_height;
	    self.game_menu.type.name = 'Игра: ';
	    self.game_menu.type.nameX = self.game_menu.x + 77 * self.dec.view.scale_width;
	    self.game_menu.type.nameY = self.game_menu.type.y + 13 * self.dec.view.scale_height;
	    self.game_menu.type.text = settings.game_type;
	    self.game_menu.type.textX = self.game_menu.x + 11 * self.dec.view.scale_width;
	    self.game_menu.type.textY = self.game_menu.type.y + 63 * self.dec.view.scale_height;

	    //параметры окна "противник"
	    self.game_menu.enemy = {};
	    self.game_menu.enemy.y = settings.dec.y + self.game_menu.type.height + self.game_menu.split;//координата инфо об игре по вертикали
	    self.game_menu.enemy.height = 180  * self.dec.view.scale_height;;
	    self.game_menu.enemy.name = 'Противник: ';
	    self.game_menu.enemy.nameX = self.game_menu.x + 25  * self.dec.view.scale_width;
	    self.game_menu.enemy.nameY = self.game_menu.enemy.y + 13  * self.dec.view.scale_height;
	    self.game_menu.enemy.textX = self.game_menu.x + 11  * self.dec.view.scale_width;
	    self.game_menu.enemy.surname = settings.enemy.surname;
	    self.game_menu.enemy.surnameY = self.game_menu.enemy.y + 63 * self.dec.view.scale_height;
	    self.game_menu.enemy.firstname = settings.enemy.firstname;
	    self.game_menu.enemy.firstnameY = self.game_menu.enemy.surnameY + 33 * self.dec.view.scale_height;
	    self.game_menu.enemy.secondname = settings.enemy.secondname;
	    self.game_menu.enemy.secondnameY = self.game_menu.enemy.firstnameY + 33 * self.dec.view.scale_height;

	    //параметры окна "состояние"
	    self.game_menu.state = {};
	    self.game_menu.state.y =self.game_menu.enemy.y + self.game_menu.enemy.height + self.game_menu.split;//координата инфо об игре по вертикали
	    self.game_menu.state.height = 540  * self.dec.view.scale_height;;
	    self.game_menu.state.name = 'Состояние: ';
	    self.game_menu.state.nameX = self.game_menu.x + 25 * self.dec.view.scale_width;
	    self.game_menu.state.nameY = self.game_menu.state.y + 13 * self.dec.view.scale_height;

	    //параметры кнопки "завершить ход"
	    self.game_menu.btn_endstep = {};
	    self.game_menu.btn_endstep.width = self.game_menu.width - 2*self.game_menu.split;
	    self.game_menu.btn_endstep.x = self.game_menu.x + self.game_menu.split;
	    self.game_menu.btn_endstep.height = 57  * self.dec.view.scale_height;
	    self.game_menu.btn_endstep.y = self.game_menu.state.y + self.game_menu.state.height - self.game_menu.split - self.game_menu.btn_endstep.height;//координата инфо об игре по вертикали
	    self.game_menu.btn_endstep.name = 'Завершить ход';

	    //параметры кнопки "отменить ход"
	    self.game_menu.btn_ecsstep = {};
	    self.game_menu.btn_ecsstep.width = self.game_menu.width - 2*self.game_menu.split;
	    self.game_menu.btn_ecsstep.x = self.game_menu.x + self.game_menu.split;
	    self.game_menu.btn_ecsstep.height = 57  * self.dec.view.scale_height;
	    self.game_menu.btn_ecsstep.y = self.game_menu.btn_endstep.y - self.game_menu.split - self.game_menu.btn_ecsstep.height;//координата инфо об игре по вертикали
	    self.game_menu.btn_ecsstep.name = 'Отменить ход';

	    //параметры кнопка "отключить звук"
	    self.game_menu.btn_sound = {};
	    self.game_menu.btn_sound.y = self.game_menu.state.y + self.game_menu.state.height + self.game_menu.split;//координата инфо об игре по вертикали
	    self.game_menu.btn_sound.height = 57  * self.dec.view.scale_height;
	    self.game_menu.btn_sound.name = 'Отключить звук';
	    self.game_menu.btn_sound.nameX = self.game_menu.x + 35 * self.dec.view.scale_width;
	    self.game_menu.btn_sound.nameY = self.game_menu.btn_sound.y + 13 * self.dec.view.scale_height;

	    //параметры кнопка "настройки"
	    self.game_menu.btn_setting = {};
	    self.game_menu.btn_setting.y = self.game_menu.btn_sound.y + self.game_menu.btn_sound.height + self.game_menu.split;//координата инфо об игре по вертикали
	    self.game_menu.btn_setting.height = 57  * self.dec.view.scale_height;;
	    self.game_menu.btn_setting.name = 'Настройки';
	    self.game_menu.btn_setting.nameX = self.game_menu.x + 63 * self.dec.view.scale_width;
	    self.game_menu.btn_setting.nameY = self.game_menu.btn_setting.y + 13 * self.dec.view.scale_height

	    //параметры кнопка "выход"
	    self.game_menu.btn_exit = {};
	    self.game_menu.btn_exit.y = self.game_menu.btn_setting.y + self.game_menu.btn_setting.height + self.game_menu.split;//координата инфо об игре по вертикали
	    self.game_menu.btn_exit.height = 57  * self.dec.view.scale_height;;
	    self.game_menu.btn_exit.name = 'Выход';
	    self.game_menu.btn_exit.nameX = self.game_menu.x + 83 * self.dec.view.scale_width;
	    self.game_menu.btn_exit.nameY = self.game_menu.btn_exit.y + 13 * self.dec.view.scale_height;

        var xCentre = self.dec.x + self.dec.view.width + (settings.width - self.dec.x - self.dec.view.width)/2;

	    //окно "игра"
	    self.graphics.strokeRoundedRect(self.game_menu.x, self.game_menu.type.y, self.game_menu.width, self.game_menu.type.height, self.game_menu.radius);
	    self.game_menu.text_nameGame = self.add.text(self.game_menu.type.nameX, self.game_menu.type.nameY, self.game_menu.type.name, settings.text_state).setScale(self.dec.view.scale_width, self.dec.view.scale_height);
	    self.game_menu.text_nameGame.x = xCentre - (self.game_menu.text_nameGame.width * self.dec.view.scale_width)/2;
	    self.game_menu.text_type = self.add.text(self.game_menu.type.textX, self.game_menu.type.textY, self.game_menu.type.text, settings.text_dino).setScale(self.dec.view.scale_width, self.dec.view.scale_height);
	    self.game_menu.text_type.x = xCentre - (self.game_menu.text_type.width * self.dec.view.scale_width)/2;

	    //окно "противник"
	    self.graphics.strokeRoundedRect(self.game_menu.x, self.game_menu.enemy.y, self.game_menu.width, self.game_menu.enemy.height, self.game_menu.radius);
	    self.game_menu.text_nameEnemy = self.add.text(self.game_menu.enemy.nameX, self.game_menu.enemy.nameY, self.game_menu.enemy.name, settings.text_state).setScale(self.dec.view.scale_width, self.dec.view.scale_height);
	    self.game_menu.text_nameEnemy.x = xCentre - (self.game_menu.text_nameEnemy.width * self.dec.view.scale_width)/2;
	    self.game_menu.text_surname = self.add.text(self.game_menu.enemy.textX, self.game_menu.enemy.surnameY, self.game_menu.enemy.surname, settings.text_dino).setScale(self.dec.view.scale_width, self.dec.view.scale_height);
	    self.game_menu.text_surname.x = xCentre - (self.game_menu.text_surname.width * self.dec.view.scale_width)/2;
	    self.game_menu.text_firstname = self.add.text(self.game_menu.enemy.textX, self.game_menu.enemy.firstnameY, self.game_menu.enemy.firstname, settings.text_dino).setScale(self.dec.view.scale_width, self.dec.view.scale_height);
	    self.game_menu.text_firstname.x = xCentre - (self.game_menu.text_firstname.width * self.dec.view.scale_width)/2;
	    self.game_menu.text_secondname = self.add.text(self.game_menu.enemy.textX, self.game_menu.enemy.secondnameY, self.game_menu.enemy.secondname, settings.text_dino).setScale(self.dec.view.scale_width, self.dec.view.scale_height);
	    self.game_menu.text_secondname.x = xCentre - (self.game_menu.text_secondname.width * self.dec.view.scale_width)/2;

	    //кнопка "отменить ход"
	    self.graph_btn_escStep = self.add.graphics();
	    //self.graph_btn_escStep.strokeRoundedRect(self.game_menu.btn_ecsstep.x, self.game_menu.btn_ecsstep.y, self.game_menu.btn_ecsstep.width, self.game_menu.btn_ecsstep.height, self.game_menu.radius);
	    self.game_menu.text_nameEscStep = self.add.text(self.game_menu.btn_ecsstep.x, self.game_menu.btn_ecsstep.y, self.game_menu.btn_ecsstep.name, settings.text_btn).setScale(self.dec.view.scale_width, self.dec.view.scale_height);
	    self.game_menu.text_nameEscStep.x = xCentre - (self.game_menu.text_nameEscStep.width * self.dec.view.scale_width)/2;
	    self.game_menu.text_nameEscStep.y =  self.game_menu.btn_ecsstep.y + self.game_menu.btn_ecsstep.height/2 - (self.game_menu.text_nameEscStep.height * self.dec.view.scale_height)/2;
	    self.graph_btn_escStep.setInteractive(new Phaser.Geom.Rectangle(self.game_menu.btn_ecsstep.x, self.game_menu.btn_ecsstep.y, self.game_menu.btn_ecsstep.width, self.game_menu.btn_ecsstep.height), Phaser.Geom.Rectangle.Contains);
        self.graph_btn_escStep.active_now = false;
	    activateButtonEscStep(self, false, false);

	    //кнопка "завершить ход"
	    self.graph_btn_endStep = self.add.graphics();
	    //self.graph_btn_endStep.strokeRoundedRect(self.game_menu.btn_endstep.x, self.game_menu.btn_endstep.y, self.game_menu.btn_endstep.width, self.game_menu.btn_endstep.height, self.game_menu.radius);
	    self.game_menu.text_nameEndStep = self.add.text(self.game_menu.btn_endstep.x, self.game_menu.btn_endstep.y, self.game_menu.btn_endstep.name, settings.text_btn).setScale(self.dec.view.scale_width, self.dec.view.scale_height);
	    self.game_menu.text_nameEndStep.x = xCentre - (self.game_menu.text_nameEndStep.width * self.dec.view.scale_width)/2;
	    self.game_menu.text_nameEndStep.y =  self.game_menu.btn_endstep.y + self.game_menu.btn_endstep.height/2 - (self.game_menu.text_nameEndStep.height * self.dec.view.scale_height)/2;
	    self.graph_btn_endStep.setInteractive(new Phaser.Geom.Rectangle(self.game_menu.btn_endstep.x, self.game_menu.btn_endstep.y, self.game_menu.btn_endstep.width, self.game_menu.btn_endstep.height), Phaser.Geom.Rectangle.Contains);
	    self.graph_btn_endStep.active_now = false;
	    activateButtonEndStep(self, false, false);

	    //окно "состояние"
	    self.graphics.strokeRoundedRect(self.game_menu.x, self.game_menu.state.y, self.game_menu.width, self.game_menu.state.height, self.game_menu.radius);
	    self.game_menu.text_nameState = self.add.text(self.game_menu.state.nameX, self.game_menu.state.nameY, self.game_menu.state.name, settings.text_state).setScale(self.dec.view.scale_width, self.dec.view.scale_height);
	    self.game_menu.text_nameState.x = xCentre - (self.game_menu.text_nameState.width * self.dec.view.scale_width)/2;

	    //кнопка "отключить звук"
	    self.graphics.strokeRoundedRect(self.game_menu.x, self.game_menu.btn_sound.y, self.game_menu.width, self.game_menu.btn_sound.height, self.game_menu.radius);
	    self.game_menu.text_nameSound = self.add.text(self.game_menu.btn_sound.nameX, self.game_menu.btn_sound.nameY, self.game_menu.btn_sound.name, settings.text_btn).setScale(self.dec.view.scale_width, self.dec.view.scale_height);
	    self.game_menu.text_nameSound.x = xCentre - (self.game_menu.text_nameSound.width * self.dec.view.scale_width)/2;

	    //кнопка "настройки"
	    self.graphics.strokeRoundedRect(self.game_menu.x, self.game_menu.btn_setting.y, self.game_menu.width, self.game_menu.btn_setting.height, self.game_menu.radius);
	    self.game_menu.text_nameSetting = self.add.text(self.game_menu.btn_setting.nameX, self.game_menu.btn_setting.nameY, self.game_menu.btn_setting.name, settings.text_btn).setScale(self.dec.view.scale_width, self.dec.view.scale_height);
	    self.game_menu.text_nameSetting.x = xCentre - (self.game_menu.text_nameSetting.width * self.dec.view.scale_width)/2;

	    //кнопка "выход"
	    self.graphics.strokeRoundedRect(self.game_menu.x, self.game_menu.btn_exit.y, self.game_menu.width, self.game_menu.btn_exit.height, self.game_menu.radius);
	    self.game_menu.text_nameExit = self.add.text(self.game_menu.btn_exit.nameX, self.game_menu.btn_exit.nameY, self.game_menu.btn_exit.name, settings.text_btn).setScale(self.dec.view.scale_width, self.dec.view.scale_height);
	    self.game_menu.text_nameExit.x = xCentre - (self.game_menu.text_nameExit.width * self.dec.view.scale_width)/2;
    }

//----------------------------------------------------------------------------------------------------------------------
    function activateButtonEndStep(self, active, view){
    //ОТОБРАЗИТЬ/УБРАТЬ КНОПКУ "ЗАВЕРШИТЬ ХОД"
        self.graph_btn_endStep.active_now = false;
        if(view){
            self.graph_btn_endStep.active_now = active;
            if(active){
                self.graph_btn_endStep.lineStyle(5 * self.dec.view.scale_width, settings.main_menu, 1);
                self.game_menu.text_nameEndStep.setColor(settings.text_btn.fill);
                self.graph_btn_endStep.on('pointerdown', endStep, self);
            }
            else{
                self.graph_btn_endStep.lineStyle(5 * self.dec.view.scale_width, settings.main_menu_notactive, 1);
                self.game_menu.text_nameEndStep.setColor(settings.text_btn_notactive.fill);
                self.graph_btn_endStep.off('pointerdown');
            }
            self.graph_btn_endStep.strokeRoundedRect(self.game_menu.btn_endstep.x, self.game_menu.btn_endstep.y, self.game_menu.btn_endstep.width, self.game_menu.btn_endstep.height, self.game_menu.radius);
            self.game_menu.text_nameEndStep.setVisible(true);
        }
        else{
            self.graph_btn_endStep.clear();
            self.game_menu.text_nameEndStep.setVisible(false);
            self.graph_btn_endStep.off('pointerdown');
        }
    }

//----------------------------------------------------------------------------------------------------------------------
    function endStep(){
    //ЗАВЕРШЕНИЕ ХОДА (ВЫЗЫВАЕТСЯ СОБЫТИЕМ self.graph_btn_endStep.on('pointerdown')
    //ИЗ ФУНКЦИИ activateButtonEndStep(self, view)
    console.log('СРАБОТАЛА...endStep');
        if(this.graph_btn_endStep.active_now){
            this.graph_btn_endStep.active_now = false;
            if(this.player_steps_array.length == 0){
                stageControl(this);
                this.white_first_step = false;
            }
            else console.log('Еще остались ходы..');
            var self = this;
            setTimeout(function(){setEndStepActiveNow(self);}, 500);
        }
    }

//----------------------------------------------------------------------------------------------------------------------
    function setEndStepActiveNow(self){
    //АКТИВАЦИЯ ВОЗМОЖНОСТИ ЗАКРЫТЬ ХОД (ИСПОЛЬЗУЕТСЯ ДЛЯ ОТСРОЧЕННОЙ АКТИВАЦИИ)
        self.graph_btn_endStep.active_now = true;
        console.log('active_now='+self.graph_btn_endStep.active_now);
    }

//----------------------------------------------------------------------------------------------------------------------
    function activateButtonEscStep(self, active, view){
        self.graph_btn_escStep.active_now = false;
        if(view){
            self.graph_btn_escStep.active_now = active;
            if(active){
                self.graph_btn_escStep.lineStyle(5 * self.dec.view.scale_width, settings.main_menu, 1);
                self.game_menu.text_nameEscStep.setColor(settings.text_btn.fill);
                self.graph_btn_escStep.on('pointerup', escStep, self);
            }
            else{
                self.graph_btn_escStep.lineStyle(5 * self.dec.view.scale_width, settings.main_menu_notactive, 1);
                self.game_menu.text_nameEscStep.setColor(settings.text_btn_notactive.fill);
                self.graph_btn_escStep.off('pointerup', escStep, self);
            }
            self.graph_btn_escStep.strokeRoundedRect(self.game_menu.btn_ecsstep.x, self.game_menu.btn_ecsstep.y, self.game_menu.btn_ecsstep.width, self.game_menu.btn_ecsstep.height, self.game_menu.radius);
            self.game_menu.text_nameEscStep.setVisible(true);
        }
        else{
        self.graph_btn_escStep.clear();
        self.game_menu.text_nameEscStep.setVisible(false);
        self.graph_btn_escStep.off('pointerup');
        }
    }

//----------------------------------------------------------------------------------------------------------------------
    function escStep(){
    //ОТМЕНА ПОСЛЕДНЕГО ПЕРЕМЕЩЕНИЯ ФИШКИ
    console.log('СРАБОТАЛА...escStep');
        if(this.stack_steps.length > 0 && this.graph_btn_escStep.active_now){
            this.graph_btn_escStep.active_now = false;
            var stack_last_index = this.stack_steps.length - 1;
            var line_index = this.stack_steps[stack_last_index].chip.lineIndex;
            var line_old_index = this.stack_steps[stack_last_index].oldline;
            var chip_id = this.stack_steps[stack_last_index].chip.id;

            //Изменить положение фишек на предыдущее...
            if(chip_id < 16){
                this.dec.line[line_index].white--;
                this.dec.line[line_old_index].white++;
                if(line_old_index == 0) this.white_had_num--;//восстановить счетчик количества фишек с головы
                console.log('ZZZZZzzz white_had_num='+this.white_had_num);
            }
            else{
                this.dec.line[line_index].black--;
                this.dec.line[line_old_index].black++;
                //if(line_old_index == 12) self.black_had_num--;//восстановить счетчик количества фишек с головы
            }
            this.dec.line[line_index].arrow_ids.pop();
            lineDraw(this, line_index);
            this.dec.line[line_old_index].arrow_ids.push(chip_id);
            lineDraw(this, line_old_index);
            this.stack_steps[stack_last_index].chip.lineIndex = line_old_index;
            this.stack_steps[stack_last_index].chip.depth = this.dec.line[line_old_index].black + this.dec.line[line_old_index].white;

            //Восстановить массив ходов...
            for(var is in this.stack_steps[stack_last_index].spliced.array){
                this.player_steps_array.splice(this.stack_steps[stack_last_index].spliced.index, 0, this.stack_steps[stack_last_index].spliced.array[is]);
            }

            //Удалить последнюю запись в стэке перемещений...
            this.stack_steps.pop();

            console.log('Отмена хода.. this.stack_steps.length=' + this.stack_steps.length);
            console.log('Доступные варианты перемещения фишек >>> ' + this.player_steps_array.length);
            if(this.player_steps_array.length > 0){
                var self = this;
                setTimeout(function(){setEscStepActiveNow(self);}, 500);
                for(var is in this.player_steps_array) console.log(this.player_steps_array[is]);
                activateButtonEndStep(this, false, true);
            }
            else{
                activateButtonEndStep(this, true, true);
            }

            if(this.stack_steps.length == 0){
                activateButtonEscStep(this, false, true);
            }
        }
    }

//----------------------------------------------------------------------------------------------------------------------
    function setEscStepActiveNow(self){
    //АКТИВАЦИЯ ВОЗМОЖНОСТИ ОТМЕНИТЬ ХОД (ИСПОЛЬЗУЕТСЯ ДЛЯ ОТСРОЧЕННОЙ АКТИВАЦИИ)
        self.graph_btn_escStep.active_now = true;
        console.log('active_now='+self.graph_btn_escStep.active_now);
    }

