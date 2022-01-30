# СЕРВЕР ДЛЯ ЗАПУСКА ТРЕТЬЕЙ ИГРЫ

import socket

mode = 'mode_STANDBYE'
buffer_size = 256
players = []


def socket_ini():
    # ЗАПУСКАЕТ СЕРВЕР, ИНИЦИАЛИЗИРУЕТ ЕГО ПАРАМЕТРЫ
    host = socket.gethostname()
    port = 3000
    try:
        server = socket.socket()
        server.bind((host, port))
        print('Запущен сервер: хост[' + host + '], порт[' + str(port) + ']')
    except:
        print('ОШИБКА!!! Неудачный запуск сервера, хост [' + host + '], порт[' + str(port) + '].')
        server = False
    return server


def soket_comm(server):
    try:
        server.listen(2)
        conn, address = server.accept()
        print("Соединение с клиентом: " + str(address))
    except:
        print('ОШИБКА!!! Неудачная попытка подключения.')
        conn = False
        address = False
    return conn, address


def server_program():
    global mode, buffer_size
    server = socket_ini()
    while server:
        conn, address = soket_comm(server)
        comm = True
        while conn and address and comm:
            data = conn.recv(buffer_size).decode()
            if data:
                print("Получено сообщение: " + data)
                message = {'currentPlayers': [0, 100, 100, 2000, 'red']}
                conn.send(message)
            logic(data)
        conn.close()
        print("Закрыто соединение с клиентом: " + str(address))


def logic(message):
    global players

    if message == 'playerName':
        print('!!!!!!!!!!')
    return True
