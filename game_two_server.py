'''
gamer1 = {
    'tableId': False,
    'paddleId': False,
    'enemyId': False,
    'paddleX': False,
    'ballX': False,
    'ballY': False
}
'''

game_state_null = {
    'player_first_X': False,
    'player_second_X': False,
    'player_first_score': 0,
    'player_second_score': 0,
    'player_first_event': False,
    'player_second_event': False,
    'player_first_velosity': False,
    'player_second_velosity': False,
    'ballX': False,
    'ballY': False,
    'game_state': False
}

# КОНСТАНТЫ ДЛЯ СОСТОЯНИЙ ИГРЫ
BALL_ON_PLAYER = 1
BALL_ON_ENEMY = 2
GAME_WAIT_ENEMY = 3
BALL_ON_FIRST_PLAYER = 4
BALL_ON_SECOND_PLAYER = 5
BALL_IN_PLAY = 6


player_id_next = 0
tables = []
screen_width = 800
screen_height = 600


def get_answer(request):
    # АНАЛИЗ СТАТУСА ИГРЫ И ФОРМИРОВАНИЕ ОТВЕТА
    global screen_width
    global screen_height
    game = request.json
    if not game['gameState']:  # не начата игра
        if not game['tableId']:  # не незначен стол
            if not game['paddleId']:  # заходит новый игрок нужно проверить наличие пустых столов и выделить ему место
                game = new_player(game)
            else:  # СДЕЛАТЬ обработка исключения (игра не начата, стол назначен, номер игрока назначен)
                pass
        else:  # СДЕЛАТЬ обработка исключения (игра не начата, а стол назначен)
            pass
    else:  # начата игра
        table_id = game['tableId']
        player_id = game['paddleId']
        if table_id > len(tables) - 1 or player_id >= player_id_next:
            pass  # СДЕЛАТЬ обработка исключения (стол и игрок не зарегистрированы на сервере)
        else:
            table = tables[table_id]
            table_game_state = table[3]  # извлекаем статус игры, сохраненный ранее для стола
            # Статус ожидания противника первым игроком
            if game['gameState'] == GAME_WAIT_ENEMY:
                if table_game_state['game_state'] == BALL_ON_FIRST_PLAYER:
                    game['gameState'] = BALL_ON_PLAYER
                    pass
            # Статус мяч у первого игрока
            elif game['gameState'] == BALL_ON_PLAYER:
                pass
            # Статус мяч у второго игрока
            elif game['gameState'] == BALL_ON_ENEMY:
                if table_game_state['game_state'] == BALL_IN_PLAY:
                    game['gameState'] = BALL_IN_PLAY
                pass

            # Статус мяч в игре
            elif game['gameState'] == BALL_IN_PLAY:
                table_game_state['game_state'] = BALL_IN_PLAY
                player_place = get_player_place(player_id)
                if player_place == 1:  # запрос от первого игрока
                    table_game_state['player_first_X'] = game['paddleX']
                    table_game_state['player_first_velosity'] = game['paddle_velocity']
                    game['enemyX'] = screen_width - table_game_state['player_second_X']
                    game['enemy_velocity'] = - table_game_state['player_second_velosity']
                    if game['event']:
                        table_game_state['player_first_event'] = game['event']
                        table_game_state['ballX'] = game['ballX']
                        table_game_state['ballY'] = game['ballY']
                        table_game_state['ball_velocityX'] = game['ball_velocityX']
                        table_game_state['ball_velocityY'] = game['ball_velocityY']
                        print(request.json)
                    pass
                else:  # запрос пришел от второго игрока
                    table_game_state['player_second_X'] = game['paddleX']
                    table_game_state['player_second_velosity'] = game['paddle_velocity']
                    game['enemyX'] = screen_width - table_game_state['player_first_X']
                    game['enemy_velocity'] = - table_game_state['player_first_velosity']
                    if table_game_state['player_first_event']:
                        game['ballX'] = screen_width - table_game_state['ballX']
                        game['ballY'] = screen_height - table_game_state['ballY']
                        game['ball_velocityX'] = - table_game_state['ball_velocityX']
                        game['ball_velocityY'] = - table_game_state['ball_velocityY']
                        table_game_state['player_first_event'] = False
                        print(request.json)
                    pass
                pass
    return request.json


def get_player_place(player_id):
    # ОПРЕДЕЛЕНИЕ МЕСТА ИГРОКА ЗА СТОЛОМ (ПЕРВЫЙ ИЛИ ВТОРОЙ)
    player_place = 2  # считаем игрока первым
    if player_id % 2 == 0:
        player_place = 1  # а нет, второй!!
    return player_place


def new_player(game):
    # РАЗМЕЩЕНИЕ ИГРОКА ЗА ИГРОВЫМ СТОЛОМ
    # возвращает Id стола, игрока и противника (если он уже есть) в формате словаря игры
    global game_state_null
    global tables_num
    global tables
    global player_id_next
    global GAME_WAIT_ENEMY
    tables_num = len(tables)
    game_state = game_state_null.copy()
    if tables_num > 0:  # начинаем поиск свободного стола
        table_last = tables[tables_num-1]
        player_second = table_last[2]
        if not player_second:  # последний стол без пары
            table_id = table_last[0]
            player_first_id = table_last[1]
            player_second_id = player_id_next
            game['gameState'] = BALL_ON_ENEMY
            game['paddleId'] = player_second_id
            game['enemyId'] = player_first_id
            game_state['game_state'] = BALL_ON_FIRST_PLAYER
            tables[tables_num-1] = [table_id, player_first_id, player_second_id, game_state]
        else:  # создаем новый стол
            table_id = tables_num
            player_first_id = player_id_next
            player_second_id = False
            game['gameState'] = GAME_WAIT_ENEMY
            game['paddleId'] = player_first_id
            game['enemyId'] = player_second_id
            game_state['game_state'] = GAME_WAIT_ENEMY
            tables.append([table_id, player_first_id, player_second_id, game_state])
    else:  # самый первый стол, самый первый игрок
        table_id = 0
        player_first_id = player_id_next
        player_second_id = False
        game['gameState'] = GAME_WAIT_ENEMY
        game_state['game_state'] = GAME_WAIT_ENEMY
        tables = [[table_id, player_first_id, player_second_id, game_state]]
        game['paddleId'] = player_first_id
        game['enemyId'] = player_second_id
    player_id_next += 1
    game['tableId'] = table_id
    return game

