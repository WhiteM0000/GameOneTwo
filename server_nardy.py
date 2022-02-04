

def event(session, json):
    stage_mode = json['stage_mode']
    uid = session['uid']

    if stage_mode == 'connect':
        json['stage_mode'] = 'wait'
        if uid == 101:
            json['stage_mode'] = 'connect'
        pass
    elif stage_mode == 'priority':
        pass
    elif stage_mode == 'priority_waiting':
        # json['diceS'] = json['dice']
        pass
    elif stage_mode == 'white_dice':
        pass
    elif stage_mode == 'white_next':
        pass
    elif stage_mode == 'black_dice':
        # json['stage_mode'] = 'white_dice'
        '''
        # json['diceS'] = 1
        # json['dice'] = 2
        '''
        pass
    elif stage_mode == 'black_next':
        '''
        field = json['field']
        line = field[12]
        line['black'] -= 1
        field[12] = line
        line = field[15]
        line['black'] += 1
        field[15] = line
        json['field'] = field
        # print(field)
        '''
        pass
    pass
    return json

