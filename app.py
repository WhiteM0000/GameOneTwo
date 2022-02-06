from flask import Flask, render_template, url_for, request, redirect, session
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, send, join_room
from datetime import datetime, timedelta
import server_nardy as nardy
import game_two_server as server2
import json

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///blog.db'
app.config['SQLALCHEMY_TRACK_MODIFICATION'] = False
app.permanent_session_lifetime = timedelta(minutes=10)
db = SQLAlchemy(app)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)


class Article(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    intro = db.Column(db.String(300), nullable=False)
    text = db.Column(db.Text, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow())

    def __repr__(self):
        return '<Article %r>' % self.id


@app.route('/')
@app.route('/home')
def index():
    return render_template("index.html")


@app.route('/create-article', methods=['POST', 'GET'])
def create_article():
    if request.method == "POST":
        title = request.form['title']
        intro = request.form['intro']
        text = request.form['text']
        article = Article(title=title, intro=intro, text=text)
        try:
            db.session.add(article)
            db.session.commit()
            return redirect('/')
        except:
            return "При добавлении статьи произошла ошибка"
    else:
        return render_template("create-article.html")


@app.route('/posts/<int:id>/update', methods=['POST', 'GET'])
def posts_update(id):
    article = Article.query.get(id)
    if request.method == "POST":
        article.title = request.form['title']
        article.intro = request.form['intro']
        article.text = request.form['text']
        try:
            db.session.commit()
            return redirect('/posts')
        except:
            return "При редактировании статьи произошла ошибка"
    else:
        return render_template("posts_update.html", article=article)


@app.route('/about')
def about():
    return render_template("about.html")


@app.route('/game_two')
def game_two():
    return render_template("game_twooo.html")


@app.route('/game_two/server/', methods=['POST'])
def game_two_server():
    content_type = request.headers.get('Content-Type')
    if content_type == 'application/json':
        return server2.get_answer(request)
    else:
        return 'Content-Type is not supported'


@app.route('/game_three')
def game_tree():
    session.permanent = True
    if 'uid' not in session:
        session['uid'] = nardy.new_gamer()
    uid = session['uid']
    url = url_for('game_tree', _external=True)
    if nardy.new_room(uid):
        copy_url = f'Отправьте другу ссылку-приглашение: {url}/{uid}'
        session['room'] = uid
    else:
        copy_url = f'Вы Вы зашли повторно.'
    print('LOG game_tree().....')
    print(session)
    return render_template("game_tree.html", text=copy_url, room=json.dumps(uid))



@app.route('/game_three/<room>')
def game_tree_come(room):
    session.permanent = True
    if 'uid' not in session:
        session['uid'] = nardy.new_gamer()
    uid = session['uid']
    err = nardy.add_in_room(room, uid)
    if err:
        copy_url = f'Возникла ошибка: {err}'
        session['room'] = 'undefined'
    else:
        copy_url = f'Вы зашли по приглашению друга.'
        session['room'] = room
    print('LOG ame_tree_come(room)...')
    print(session)
    print('room='+str(room))
    return render_template("game_tree.html", text=copy_url, room=json.dumps(room))


@app.route('/posts')
def posts():
    articles = Article.query.order_by(Article.date.desc()).all()
    return render_template("posts.html", articles=articles)


@app.route('/posts/<int:id>')
def post_detail(id):
    article = Article.query.get(id)
    return render_template("post_detail.html", article=article)


@app.route('/posts/<int:id>/delete')
def post_delete(id):
    article = Article.query.get_or_404(id)
    try:
        db.session.delete(article)
        db.session.commit()
        return redirect('/posts')
    except:
        return "При удалении статьи произошла ошибка"


@app.route('/game')
def game():
    return render_template("game.html")


@socketio.on('connect')
def test_connect():
    emit('my response', {'data': 'Connected'})
    print('Есть подключение!')


@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected')


@socketio.on('my_event')
def handle_my_custom_event(json):
    emit('server_message', json)
    print(json)


@socketio.on('nardy_stage')
def handle_my_custom_event(json):
    room = session['room']
    print('LOG handle_my_custom_event(json)...' + str(room))
    emit('server_response', nardy.event(session, json), include_self=False, to=room)


@socketio.on('join')
def on_join(data):
    print('LOG on_join...')
    print('data='+str(data))
    room = data['room']
    join_room(room)
    msg = {'stage_mode': 'connect'}
    emit('server_response', nardy.event(session, msg), to=room)


if __name__ == '__main__':
    # app.run(debug=True)
    # socketio.run(app, host='0.0.0.0', debug=True)
    socketio.run(app)  # , debug=False)
    # site = Thread(target=app.run, args=())
    # site.start()
    # game_three_server = Thread(target=server_program, args=())
    # game_three_server = Thread(target=S_three.server_program, args=())
    # game_three_server.start()
