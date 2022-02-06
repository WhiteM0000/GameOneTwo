from secrets import token_urlsafe


GAMERS = []
ROOMS = {}


def new_gamer():
    ext = token_urlsafe(5)
    if ext in GAMERS:
        return new_gamer()
    else:
        GAMERS.append(ext)
        print('LOG new_gamer...')
        print(GAMERS)
        return ext


def new_room(gamer):
    ret = False
    if gamer in GAMERS:
        if gamer not in ROOMS:
            ROOMS.update({gamer: 'undefined'})
            ret = True
    print('LOG new_room...')
    print(ROOMS)
    return ret


def add_in_room(room, gamer):
    print('LOG add_in_room...')
    err = False
    if room in ROOMS:
        if gamer in GAMERS:
            if ROOMS[room] == 'undefined' or ROOMS[room] == gamer:
                test_other_room = False
                for key in ROOMS.keys():
                    if ROOMS[key] == gamer and key != room:
                        test_other_room = True
                if not test_other_room:
                    ROOMS.update({room: gamer})
                else:
                    err = 'Err_gamer_in_other_room'
            else:
                err = 'Err_room_occupied'
                print('ROOMS[room]=' + str(ROOMS[room]))
        else:
            err = 'Err_undefined_gamer'
    else:
        err = 'Err_undefined_room'
    print('err=' + str(err))
    return err


def event(session, json):
    stage_mode = json['stage_mode']
    room = session['room']
    uid = session['uid']
    print('LOG event... session='+str(session))
    print('LOG event... stage_mode=' + str(stage_mode))
    if stage_mode == 'connect':
        if room == uid:
            json['stage_mode'] = 'wait'
        pass
    elif stage_mode == 'priority':
        pass
    elif stage_mode == 'priority_waiting':
        pass
    elif stage_mode == 'white_dice':
        pass
    elif stage_mode == 'white_next':
        pass
    elif stage_mode == 'black_dice':
        pass
    elif stage_mode == 'black_next':
        pass
    pass
    return json

