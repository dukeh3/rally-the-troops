"use strict";

const fs = require('fs');
const http = require('http');
const https = require('https');
const socket_io = require('socket.io');
const express = require('express');
const express_session = require('express-session');
const passport = require('passport');
const passport_local = require('passport-local');
const passport_socket = require('passport.socketio');
const body_parser = require('body-parser');
const connect_flash = require('connect-flash');
const crypto = require('crypto');
const sqlite3 = require('better-sqlite3');
const SQLiteStore = require('./connect-better-sqlite3')(express_session);

require('dotenv').config();

function random_seed() {
	return crypto.randomInt(1, 0x7ffffffe);
}

const SESSION_SECRET = "Caesar has a big head!";

const MAX_OPEN_GAMES = 5;

let session_store = new SQLiteStore();
let db = new sqlite3(process.env.DATABASE || "./db");
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("foreign_keys = ON");

let app = express();

let http_port = process.env.HTTP_PORT || 8080;
let http_server = http.createServer(app);
let http_io = socket_io(http_server);
http_server.listen(http_port, '0.0.0.0', () => console.log('listening HTTP on *:' + http_port));
let io = http_io;

let https_port = process.env.HTTPS_PORT;
if (https_port) {
	let https_server = https.createServer({
		key: fs.readFileSync(process.env.SSL_KEY || "key.pem"),
		cert: fs.readFileSync(process.env.SSL_CERT || "cert.pem")
	}, app);
	let https_io = socket_io(https_server);
	https_server.listen(https_port, '0.0.0.0', () => console.log('listening HTTPS on *:' + https_port));
	io = {
		use: function (fn) { http_io.use(fn); https_io.use(fn); },
		on: function (ev,fn) { http_io.on(ev,fn); https_io.on(ev,fn); },
	};
}

let mailer = null;
if (process.env.MAIL_HOST && process.env.MAIL_PORT) {
	mailer = require('nodemailer').createTransport({
		host: process.env.MAIL_HOST,
		port: process.env.MAIL_PORT,
		ignoreTLS: true
	});
	console.log("Mail notifications enabled: ", mailer.options);
} else {
	console.log("Mail notifications disabled.");
}

app.disable('x-powered-by');
app.set('view engine', 'ejs');
app.use(body_parser.urlencoded({extended:false}));
app.use(express_session({
	secret: SESSION_SECRET,
	resave: false,
	rolling: true,
	saveUninitialized: false,
	store: session_store,
	cookie: {
		maxAge: 7 * 24 * 60 * 60 * 1000,
		sameSite: 'lax',
	}
}));
app.use(connect_flash());

io.use(passport_socket.authorize({
	key: 'connect.sid',
	secret: SESSION_SECRET,
	store: session_store,
}));

app.use(express.static('public'));

/*
 * MISC FUNCTIONS
 */

function SQL(s) {
	return db.prepare(s);
}

function LOG(req, ...msg) {
	let name;
	if (req.isAuthenticated())
		name = `"${req.user.name}" <${req.user.mail}>`;
	else
		name = "guest";
	let time = new Date().toISOString().substring(0,19).replace("T", " ");
	console.log(time, req.connection.remoteAddress, name, ...msg);
}

function SLOG(socket, ...msg) {
	let name = `"${socket.request.user.name}" <${socket.request.user.mail}>`;
	let time = new Date().toISOString().substring(0,19).replace("T", " ");
	console.log(time, socket.request.connection.remoteAddress, name,
		socket.id, socket.title_id, socket.game_id, socket.role, ...msg);
}

function human_date(time) {
	var date = time ? new Date(time + " UTC") : new Date(0);
	var seconds = (Date.now() - date.getTime()) / 1000;
	var days = Math.floor(seconds / 86400);
	if (days === 0) {
		if (seconds < 60) return "now";
		if (seconds < 120) return "1 minute ago";
		if (seconds < 3600) return Math.floor(seconds / 60) + " minutes ago";
		if (seconds < 7200) return "1 hour ago";
		if (seconds < 86400) return Math.floor(seconds / 3600) + " hours ago";
	}
	if (days === 1) return "Yesterday";
	if (days < 14) return days + " days ago";
	if (days < 31) return Math.ceil(days / 7) + " weeks ago";
	return date.toISOString().substring(0,10);
}

function is_email(email) {
	return email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/);
}

function clean_user_name(name) {
	name = name.replace(/^ */,'').replace(/ *$/,'').replace(/  */g,' ');
	if (name.length > 50)
		name = name.substring(0, 50);
	return name;
}

const USER_NAME_RE = /^[\p{Alpha}\p{Number}'_-]+( [\p{Alpha}\p{Number}'_-]+)*$/u;

function is_valid_user_name(name) {
	if (name.length < 2)
		return false;
	if (name.length > 50)
		return false;
	return USER_NAME_RE.test(name);
}

function hash_password(password, salt) {
	let hash = crypto.createHash('sha256');
	hash.update(password);
	hash.update(salt);
	return hash.digest('hex');
}

function get_avatar(mail) {
	if (!mail)
		mail = "foo@example.com";
	let digest = crypto.createHash('md5').update(mail.trim().toLowerCase()).digest('hex');
	return '//www.gravatar.com/avatar/' + digest + '?d=mp';
}

/*
 * USER AUTHENTICATION
 */

const SQL_BLACKLIST_IP = SQL("SELECT EXISTS ( SELECT 1 FROM blacklist_ip WHERE ip=? )").pluck();
const SQL_BLACKLIST_MAIL = SQL("SELECT EXISTS ( SELECT 1 FROM blacklist_mail WHERE ? LIKE mail )").pluck();

const SQL_EXISTS_USER_NAME = SQL("SELECT EXISTS ( SELECT 1 FROM users WHERE name=? )").pluck();
const SQL_EXISTS_USER_MAIL = SQL("SELECT EXISTS ( SELECT 1 FROM users WHERE mail=? )").pluck();

const SQL_INSERT_USER = SQL("INSERT INTO users (name,mail,password,salt) VALUES (?,?,?,?) RETURNING user_id,name,mail,notify");

const SQL_SELECT_USER = SQL("SELECT * FROM user_view WHERE user_id=?");
const SQL_SELECT_USER_BY_NAME = SQL("SELECT * FROM user_view WHERE name=?");
const SQL_SELECT_LOGIN_BY_MAIL = SQL("SELECT * FROM user_login_view WHERE mail=?");
const SQL_SELECT_LOGIN_BY_NAME = SQL("SELECT * FROM user_login_view WHERE name=?");
const SQL_SELECT_USER_PROFILE = SQL("SELECT * FROM user_profile_view WHERE name=?");

const SQL_OFFLINE_USER = SQL("SELECT * FROM user_view NATURAL JOIN user_last_seen WHERE user_id=? AND datetime('now') > datetime(atime,?)");

const SQL_UPDATE_USER_NOTIFY = SQL("UPDATE users SET notify=? WHERE user_id=?");
const SQL_UPDATE_USER_NAME = SQL("UPDATE users SET name=? WHERE user_id=?");
const SQL_UPDATE_USER_MAIL = SQL("UPDATE users SET mail=? WHERE user_id=?");
const SQL_UPDATE_USER_ABOUT = SQL("UPDATE users SET about=? WHERE user_id=?");
const SQL_UPDATE_USER_PASSWORD = SQL("UPDATE users SET password=? WHERE user_id=?");
const SQL_UPDATE_USER_LAST_SEEN = SQL("INSERT OR REPLACE INTO user_last_seen (user_id,atime,aip) VALUES (?,datetime('now'),?)");

const SQL_FIND_TOKEN = SQL("SELECT token FROM tokens WHERE user_id=? AND datetime('now') < datetime(time, '+5 minutes')").pluck();
const SQL_CREATE_TOKEN = SQL("INSERT OR REPLACE INTO tokens (user_id,token,time) VALUES (?, lower(hex(randomblob(16))), datetime('now')) RETURNING token").pluck();
const SQL_VERIFY_TOKEN = SQL("SELECT EXISTS ( SELECT 1 FROM tokens WHERE user_id=? AND datetime('now') < datetime(time, '+20 minutes') AND token=? )").pluck();

const SQL_COUNT_INBOX = SQL("SELECT COUNT(*) FROM messages WHERE to_id=? AND read=0 AND deleted_from_inbox=0").pluck();

function is_blacklisted(ip, mail) {
	if (SQL_BLACKLIST_IP.get(ip) === 1)
		return true;
	if (SQL_BLACKLIST_MAIL.get(mail) === 1)
		return true;
	return false;
}

passport.serializeUser(function (user, done) {
	return done(null, user.user_id);
});

passport.deserializeUser(function (user_id, done) {
	try {
		let user = SQL_SELECT_USER.get(user_id);
		if (!user)
			return done(null, false);
		return done(null, user);
	} catch (err) {
		console.log(err);
		return done(null, false);
	}
});

function local_login(req, name_or_mail, password, done) {
	try {
		if (!is_email(name_or_mail))
			name_or_mail = clean_user_name(name_or_mail);
		LOG(req, "POST /login", name_or_mail);
		let user = SQL_SELECT_LOGIN_BY_NAME.get(name_or_mail);
		if (!user)
			user = SQL_SELECT_LOGIN_BY_MAIL.get(name_or_mail);
		if (!user)
			return setTimeout(() => done(null, false, req.flash('message', "User not found.")), 1000);
		if (is_blacklisted(req.connection.remoteAddress, user.mail))
			return setTimeout(() => done(null, false, req.flash('message', "Sorry, but this IP or account has been banned.")), 1000);
		let hash = hash_password(password, user.salt);
		if (hash !== user.password)
			return setTimeout(() => done(null, false, req.flash('message', "Wrong password.")), 1000);
		done(null, user);
	} catch (err) {
		done(null, false, req.flash('message', err.toString()));
	}
}

function local_signup(req, name, password, done) {
	try {
		let mail = req.body.mail;
		name = clean_user_name(name);
		if (!is_valid_user_name(name))
			return done(null, false, req.flash('message', "Invalid user name!"));
		LOG(req, "POST /signup", name, mail);
		if (is_blacklisted(req.connection.remoteAddress, mail))
			return setTimeout(() => done(null, false, req.flash('message', "Sorry, but this IP or account has been banned.")), 1000);
		if (password.length < 4)
			return done(null, false, req.flash('message', "Password is too short!"));
		if (password.length > 100)
			return done(null, false, req.flash('message', "Password is too long!"));
		if (!is_email(mail))
			return done(null, false, req.flash('message', "Invalid mail address!"));
		if (SQL_EXISTS_USER_NAME.get(name))
			return done(null, false, req.flash('message', "That name is already taken."));
		if (SQL_EXISTS_USER_MAIL.get(mail))
			return done(null, false, req.flash('message', "That mail is already taken."));
		let salt = crypto.randomBytes(32).toString('hex');
		let hash = hash_password(password, salt);
		let user = SQL_INSERT_USER.get(name, mail, hash, salt);
		done(null, user);
	} catch (err) {
		done(null, false, req.flash('message', err.toString()));
	}
}

passport.use('local-login', new passport_local.Strategy({ passReqToCallback: true }, local_login));
passport.use('local-signup', new passport_local.Strategy({ passReqToCallback: true }, local_signup));

app.use(passport.initialize());
app.use(passport.session());

function touch_user(req) {
	req.user.unread = SQL_COUNT_INBOX.get(req.user.user_id);
	SQL_UPDATE_USER_LAST_SEEN.run(req.user.user_id, req.connection.remoteAddress);
}

function must_not_be_logged_in(req, res, next) {
	if (SQL_BLACKLIST_IP.get(req.connection.remoteAddress) === 1)
		return res.redirect('/banned');
	return next();
}

function must_be_logged_in(req, res, next) {
	if (SQL_BLACKLIST_IP.get(req.connection.remoteAddress) === 1)
		return res.redirect('/banned');
	if (!req.isAuthenticated()) {
		req.session.redirect = req.originalUrl;
		return res.redirect('/login');
	}
	touch_user(req);
	return next();
}

function may_be_logged_in(req, res, next) {
	if (SQL_BLACKLIST_IP.get(req.connection.remoteAddress) === 1)
		return res.redirect('/banned');
	if (req.isAuthenticated())
		touch_user(req);
	return next();
}

app.get('/', may_be_logged_in, function (req, res) {
	res.render('index.ejs', { user: req.user, flash: req.flash('message') });
});

app.get('/banned', function (req, res) {
	LOG(req, "GET /banned");
	res.render('banned.ejs', { user: req.user });
});

app.get('/about', may_be_logged_in, function (req, res) {
	res.render('about.ejs', { user: req.user });
});

app.get('/logout', function (req, res) {
	LOG(req, "GET /logout");
	req.logout();
	res.redirect('/login');
});

app.get('/login', function (req, res) {
	if (req.isAuthenticated())
		return res.redirect('/');
	LOG(req, "GET /login");
	res.render('login.ejs', { user: req.user, flash: req.flash('message') });
});

app.get('/signup', function (req, res) {
	if (req.isAuthenticated())
		return res.redirect('/');
	LOG(req, "GET /signup");
	res.render('signup.ejs', { user: req.user, flash: req.flash('message') });
});

app.post('/login',
	passport.authenticate('local-login', {
		failureRedirect: '/login',
		failureFlash: true
	}),
	(req, res) => {
		let redirect = req.session.redirect || '/profile';
		delete req.session.redirect;
		res.redirect(redirect);
	}
);

app.post('/signup',
	passport.authenticate('local-signup', {
		successRedirect: '/profile',
		failureRedirect: '/signup',
		failureFlash: true
	})
);

app.get('/forgot_password', must_not_be_logged_in, function (req, res) {
	LOG(req, "GET /forgot_password");
	res.render('forgot_password.ejs', { user: req.user, flash: req.flash('message') });
});

app.post('/forgot_password', must_not_be_logged_in, function (req, res) {
	LOG(req, "POST /forgot_password");
	let mail = req.body.mail;
	let user = SQL_SELECT_LOGIN_BY_MAIL.get(mail);
	if (user) {
		let token = SQL_FIND_TOKEN.get(user.user_id);
		if (!token) {
			token = SQL_CREATE_TOKEN.run(user.user_id);
			mail_password_reset_token(user, token);
		}
		req.flash('message', "A password reset token has been sent to " + mail + ".");
		return res.redirect('/reset_password/' + mail);
	}
	req.flash('message', "User not found.");
	return res.redirect('/forgot_password');
});

app.get('/reset_password', must_not_be_logged_in, function (req, res) {
	LOG(req, "GET /reset_password");
	res.render('reset_password.ejs', { user: null, mail: "", token: "", flash: req.flash('message') });
});

app.get('/reset_password/:mail', must_not_be_logged_in, function (req, res) {
	let mail = req.params.mail;
	LOG(req, "GET /reset_password", mail);
	res.render('reset_password.ejs', { user: null, mail: mail, token: "", flash: req.flash('message') });
});

app.get('/reset_password/:mail/:token', must_not_be_logged_in, function (req, res) {
	let mail = req.params.mail;
	let token = req.params.token;
	LOG(req, "GET /reset_password", mail, token);
	res.render('reset_password.ejs', { user: null, mail: mail, token: token, flash: req.flash('message') });
});

app.post('/reset_password', must_not_be_logged_in, function (req, res) {
	let mail = req.body.mail;
	let token = req.body.token;
	let password = req.body.password;
	LOG(req, "POST /reset_password", mail, token);
	let user = SQL_SELECT_LOGIN_BY_MAIL.get(mail);
	if (!user) {
		req.flash('message', "User not found.");
		return res.redirect('/reset_password/'+mail+'/'+token);
	}
	if (password.length < 4) {
		req.flash('message', "Password is too short!");
		return res.redirect('/reset_password/'+mail+'/'+token);
	}
	if (!SQL_VERIFY_TOKEN.get(user.user_id, token)) {
		req.flash('message', "Invalid or expired token!");
		return res.redirect('/reset_password/'+mail);
	}
	let hash = hash_password(password, user.salt);
	SQL_UPDATE_USER_PASSWORD.run(hash, user.user_id);
	return res.redirect('/login');
});

app.get('/change_password', must_be_logged_in, function (req, res) {
	LOG(req, "GET /change_password");
	res.render('change_password.ejs', { user: req.user, flash: req.flash('message') });
});

app.post('/change_password', must_be_logged_in, function (req, res) {
	let oldpass = req.body.password;
	let newpass = req.body.newpass;
	LOG(req, "POST /change_password", req.user.name);
	// Get full user record including password and salt
	let user = SQL_SELECT_LOGIN_BY_MAIL.get(req.user.mail);
	if (newpass.length < 4) {
		req.flash('message', "Password is too short!");
		return res.redirect('/change_password');
	}
	let oldhash = hash_password(oldpass, user.salt);
	if (oldhash !== user.password) {
		req.flash('message', "Wrong password.");
		return res.redirect('/change_password');
	}
	let newhash = hash_password(newpass, user.salt);
	SQL_UPDATE_USER_PASSWORD.run(newhash, user.user_id);
	req.flash('message', "Your password has been updated.");
	return res.redirect('/profile');
});

/*
 * USER PROFILE
 */

app.get('/subscribe', must_be_logged_in, function (req, res) {
	LOG(req, "GET /subscribe");
	SQL_UPDATE_USER_NOTIFY.run(1, req.user.user_id);
	res.redirect('/profile');
});

app.get('/unsubscribe', must_be_logged_in, function (req, res) {
	LOG(req, "GET /unsubscribe");
	SQL_UPDATE_USER_NOTIFY.run(0, req.user.user_id);
	res.redirect('/profile');
});

app.get('/change_name', must_be_logged_in, function (req, res) {
	LOG(req, "GET /change_name");
	res.render('change_name.ejs', { user: req.user, flash: req.flash('message') });
});

app.post('/change_name', must_be_logged_in, function (req, res) {
	let newname = clean_user_name(req.body.newname);
	LOG(req, "POST /change_name", req.user, req.body, newname);
	if (!is_valid_user_name(newname)) {
		req.flash('message', "Invalid user name!");
		return res.redirect('/change_name');
	}
	if (SQL_EXISTS_USER_NAME.get(newname)) {
		req.flash('message', "That name is already taken!");
		return res.redirect('/change_name');
	}
	SQL_UPDATE_USER_NAME.run(newname, req.user.user_id);
	return res.redirect('/profile');
});

app.get('/change_mail', must_be_logged_in, function (req, res) {
	LOG(req, "GET /change_mail");
	res.render('change_mail.ejs', { user: req.user, flash: req.flash('message') });
});

app.post('/change_mail', must_be_logged_in, function (req, res) {
	let newmail = req.body.newmail;
	LOG(req, "POST /change_mail", req.user, req.body);
	if (!is_email(newmail)) {
		req.flash('message', "Invalid mail address!");
		return res.redirect('/change_mail');
	}
	if (SQL_EXISTS_USER_MAIL.get(newmail)) {
		req.flash('message', "That mail address is already taken!");
		return res.redirect('/change_mail');
	}
	SQL_UPDATE_USER_MAIL.run(newmail, req.user.user_id);
	return res.redirect('/profile');
});

app.get('/change_about', must_be_logged_in, function (req, res) {
	LOG(req, "GET /change_about");
	let about = SQL_SELECT_USER_PROFILE.get(req.user.name).about;
	res.render('change_about.ejs', { user: req.user, about: about || "" });
});

app.post('/change_about', must_be_logged_in, function (req, res) {
	LOG(req, "POST /change_about", req.user.name);
	SQL_UPDATE_USER_ABOUT.run(req.body.about, req.user.user_id);
	return res.redirect('/profile');
});

app.get('/user/:who_name', may_be_logged_in, function (req, res) {
	LOG(req, "GET /user/" + req.params.who_name);
	let who = SQL_SELECT_USER_PROFILE.get(req.params.who_name);
	if (who) {
		who.avatar = get_avatar(who.mail);
		who.ctime = human_date(who.ctime);
		who.atime = human_date(who.atime);
		res.render('user.ejs', { user: req.user, who: who });
	} else {
		return res.status(404).send("Invalid user name.");
	}
});

app.get('/users', may_be_logged_in, function (req, res) {
	LOG(req, "GET /users");
	let rows = db.prepare("SELECT * FROM user_profile_view ORDER BY atime DESC").all();
	rows.forEach(row => {
		row.avatar = get_avatar(row.mail);
		row.ctime = human_date(row.ctime);
		row.atime = human_date(row.atime);
	});
	res.render('users.ejs', { user: req.user, userList: rows });
});

app.get('/chat', must_be_logged_in, function (req, res) {
	LOG(req, "GET /chat");
	let chat = SQL_SELECT_USER_CHAT_N.all(req.user.user_id, 1200);
	res.render('chat.ejs', { user: req.user, chat: chat, page_size: 12 });
});

app.get('/chat/all', must_be_logged_in, function (req, res) {
	LOG(req, "GET /chat/all");
	let chat = SQL_SELECT_USER_CHAT.all(req.user.user_id);
	res.render('chat.ejs', { user: req.user, chat: chat, page_size: 0 });
});

/*
 * MESSAGES
 */

const MESSAGE_LIST_INBOX = db.prepare(`
	SELECT message_id, from_name, subject, time, read
	FROM message_view
	WHERE to_id=? AND deleted_from_inbox=0
	ORDER BY message_id DESC`);

const MESSAGE_LIST_OUTBOX = db.prepare(`
	SELECT message_id, to_name, subject, time, 1 as read
	FROM message_view
	WHERE from_id=? AND deleted_from_outbox=0
	ORDER BY message_id DESC`);

const MESSAGE_FETCH = db.prepare("SELECT * FROM message_view WHERE message_id=? AND ( from_id=? OR to_id=? )");
const MESSAGE_SEND = db.prepare("INSERT INTO messages (from_id,to_id,subject,body) VALUES (?,?,?,?)");
const MESSAGE_MARK_READ = db.prepare("UPDATE messages SET read=1 WHERE message_id=? AND read = 0");
const MESSAGE_DELETE_INBOX = db.prepare("UPDATE messages SET deleted_from_inbox=1 WHERE message_id=? AND to_id=?");
const MESSAGE_DELETE_OUTBOX = db.prepare("UPDATE messages SET deleted_from_outbox=1 WHERE message_id=? AND from_id=?");
const MESSAGE_DELETE_ALL_OUTBOX = db.prepare("UPDATE messages SET deleted_from_outbox=1 WHERE from_id=?");

app.get('/inbox', must_be_logged_in, function (req, res) {
	LOG(req, "GET /inbox");
	let messages = MESSAGE_LIST_INBOX.all(req.user.user_id);
	for (let i = 0; i < messages.length; ++i)
		messages[i].time = human_date(messages[i].time);
	res.set("Cache-Control", "no-store");
	res.render('message_inbox.ejs', {
		user: req.user,
		messages: messages,
	});
});

app.get('/outbox', must_be_logged_in, function (req, res) {
	LOG(req, "GET /outbox");
	let messages = MESSAGE_LIST_OUTBOX.all(req.user.user_id);
	for (let i = 0; i < messages.length; ++i)
		messages[i].time = human_date(messages[i].time);
	res.set("Cache-Control", "no-store");
	res.render('message_outbox.ejs', {
		user: req.user,
		messages: messages,
	});
});

app.get('/message/read/:message_id', must_be_logged_in, function (req, res) {
	LOG(req, "GET /message/" + req.params.message_id);
	let message_id = req.params.message_id | 0;
	let message = MESSAGE_FETCH.get(message_id, req.user.user_id, req.user.user_id);
	if (!message)
		return res.status(404).send("Invalid message ID.");
	if (message.to_id === req.user.user_id && message.read === 0) {
		MESSAGE_MARK_READ.run(message_id);
		req.user.unread --;
	}
	message.time = human_date(message.time);
	message.body = linkify_post(message.body);
	res.render('message_read.ejs', {
		user: req.user,
		message: message,
	});
});

app.get('/message/send', must_be_logged_in, function (req, res) {
	res.render('message_send.ejs', {
		user: req.user,
		to_name: "",
		subject: "",
		body: "",
	});
});

app.get('/message/send/:to_name', must_be_logged_in, function (req, res) {
	LOG(req, "GET /message/send/" + req.params.to_name);
	let to_name = req.params.to_name;
	res.render('message_send.ejs', {
		user: req.user,
		to_name: to_name,
		subject: "",
		body: "",
	});
});

app.post('/message/send', must_be_logged_in, function (req, res) {
	LOG(req, "POST /message/send/");
	let to_name = req.body.to.trim();
	let subject = req.body.subject.trim();
	let body = req.body.body.trim();
	let to_user = SQL_SELECT_USER_BY_NAME.get(to_name);
	if (!to_user) {
		return res.render('message_send.ejs', {
			user: req.user,
			to_id: 0,
			to_name: to_name,
			subject: subject,
			body: body,
			flash: "Cannot find that user."
		});
	}
	let info = MESSAGE_SEND.run(req.user.user_id, to_user.user_id, subject, body);
	if (to_user.notify)
		mail_new_message(to_user, info.lastInsertRowid, req.user.name, subject, body)
	res.redirect('/inbox');
});

function quote_body(message) {
	let when = new Date(message.time).toDateString();
	let who = message.from_name;
	let what = message.body.split("\n").join("\n> ");
	return "\n\n" + "On " + when + " " + who + " wrote:\n> " + what + "\n";
}

app.get('/message/reply/:message_id', must_be_logged_in, function (req, res) {
	LOG(req, "POST /message/reply/" + req.params.message_id);
	let message_id = req.params.message_id | 0;
	let message = MESSAGE_FETCH.get(message_id, req.user.user_id, req.user.user_id);
	if (!message)
		return res.status(404).send("Invalid message ID.");
	return res.render('message_send.ejs', {
		user: req.user,
		to_id: message.from_id,
		to_name: message.from_name,
		subject: message.subject.startsWith("Re: ") ? message.subject : "Re: " + message.subject,
		body: quote_body(message),
	});
});

app.get('/message/delete/:message_id', must_be_logged_in, function (req, res) {
	LOG(req, "POST /message/delete/" + req.params.message_id);
	let message_id = req.params.message_id | 0;
	MESSAGE_DELETE_INBOX.run(message_id, req.user.user_id);
	MESSAGE_DELETE_OUTBOX.run(message_id, req.user.user_id);
	res.redirect('/inbox');
});

app.get('/outbox/delete', must_be_logged_in, function (req, res) {
	LOG(req, "POST /outbox/delete");
	MESSAGE_DELETE_ALL_OUTBOX.run(req.user.user_id);
	res.redirect('/outbox');
});

/*
 * FORUM
 */

const FORUM_PAGE_SIZE = 15;

const FORUM_COUNT_THREADS = db.prepare("SELECT COUNT(*) FROM threads").pluck();
const FORUM_LIST_THREADS = db.prepare("SELECT * FROM thread_view ORDER BY mtime DESC LIMIT ? OFFSET ?");
const FORUM_GET_THREAD = db.prepare("SELECT * FROM thread_view WHERE thread_id=?");
const FORUM_LIST_POSTS = db.prepare("SELECT * FROM post_view WHERE thread_id=?");
const FORUM_GET_POST = db.prepare("SELECT * FROM post_view WHERE post_id=?");
const FORUM_NEW_THREAD = db.prepare("INSERT INTO threads (author_id,subject) VALUES (?,?)");
const FORUM_NEW_POST = db.prepare("INSERT INTO posts (thread_id,author_id,body) VALUES (?,?,?)");
const FORUM_EDIT_POST = db.prepare("UPDATE posts SET body=?, mtime=datetime('now') WHERE post_id=? AND author_id=? RETURNING thread_id").pluck();

function show_forum_page(req, res, page) {
	let thread_count = FORUM_COUNT_THREADS.get();
	let page_count = Math.ceil(thread_count / FORUM_PAGE_SIZE);
	let threads = FORUM_LIST_THREADS.all(FORUM_PAGE_SIZE, FORUM_PAGE_SIZE * (page - 1));
	for (let thread of threads) {
		thread.ctime = human_date(thread.ctime);
		thread.mtime = human_date(thread.mtime);
	}
	res.set("Cache-Control", "no-store");
	res.render('forum_view.ejs', {
		user: req.user,
		threads: threads,
		current_page: page,
		page_count: page_count,
	});
}

function linkify_post(text) {
	text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	text = text.replace(/https?:\/\/\S+/, (match) => {
		if (match.endsWith(".jpg") || match.endsWith(".png") || match.endsWith(".svg"))
			return `<a href="${match}"><img src="${match}"></a>`;
		return `<a href="${match}">${match}</a>`;
	});
	return text;
}

app.get('/forum', may_be_logged_in, function (req, res) {
	LOG(req, "GET /forum");
	show_forum_page(req, res, 1);
});

app.get('/forum/page/:page', may_be_logged_in, function (req, res) {
	LOG(req, "GET /forum/page/" + req.params.page);
	show_forum_page(req, res, req.params.page | 0);
});

app.get('/forum/thread/:thread_id', may_be_logged_in, function (req, res) {
	LOG(req, "GET /forum/thread/" + req.params.thread_id);
	let thread_id = req.params.thread_id | 0;
	let thread = FORUM_GET_THREAD.get(thread_id);
	let posts = FORUM_LIST_POSTS.all(thread_id);
	if (!thread)
		return res.status(404).send("Invalid thread ID.");
	for (let i = 0; i < posts.length; ++i) {
		posts[i].body = linkify_post(posts[i].body);
		posts[i].edited = posts[i].mtime !== posts[i].ctime;
		posts[i].ctime = human_date(posts[i].ctime);
		posts[i].mtime = human_date(posts[i].mtime);
	}
	res.set("Cache-Control", "no-store");
	res.render('forum_thread.ejs', {
		user: req.user,
		thread: thread,
		posts: posts,
	});
});

app.get('/forum/post', must_be_logged_in, function (req, res) {
	LOG(req, "GET /forum/post");
	res.render('forum_post.ejs', {
		user: req.user,
	});
});

app.post('/forum/post', must_be_logged_in, function (req, res) {
	LOG(req, "POST /forum/post");
	let user_id = req.user.user_id;
	let subject = req.body.subject.trim();
	let body = req.body.body;
	if (subject.length === 0)
		subject = "Untitled";
	let thread_id = FORUM_NEW_THREAD.run(user_id, subject).lastInsertRowid;
	FORUM_NEW_POST.run(thread_id, user_id, body);
	res.redirect('/forum/thread/'+thread_id);
});

app.get('/forum/edit/:post_id', must_be_logged_in, function (req, res) {
	// TODO: edit subject if editing first post
	LOG(req, "GET /forum/edit/" + req.params.post_id);
	let post_id = req.params.post_id | 0;
	let post = FORUM_GET_POST.get(post_id);
	if (!post || post.author_id != req.user.user_id)
		return res.status(404).send("Invalid post ID.");
	post.ctime = human_date(post.ctime);
	post.mtime = human_date(post.mtime);
	res.render('forum_edit.ejs', {
		user: req.user,
		post: post,
	});
});

app.post('/forum/edit/:post_id', must_be_logged_in, function (req, res) {
	LOG(req, "POST /forum/edit/" + req.params.post_id);
	let user_id = req.user.user_id;
	let post_id = req.params.post_id | 0;
	let body = req.body.body;
	let thread_id = FORUM_EDIT_POST.get(body, post_id, user_id);
	res.redirect('/forum/thread/'+thread_id);
});

app.get('/forum/reply/:post_id', must_be_logged_in, function (req, res) {
	LOG(req, "GET /forum/reply/" + req.params.post_id);
	let post_id = req.params.post_id | 0;
	let post = FORUM_GET_POST.get(post_id);
	if (!post)
		return res.status(404).send("Invalid post ID.");
	let thread = FORUM_GET_THREAD.get(post.thread_id);
	post.body = linkify_post(post.body);
	post.edited = post.mtime !== post.ctime;
	post.ctime = human_date(post.ctime);
	post.mtime = human_date(post.mtime);
	res.render('forum_reply.ejs', {
		user: req.user,
		thread: thread,
		post: post,
	});
});

app.post('/forum/reply/:thread_id', must_be_logged_in, function (req, res) {
	LOG(req, "POST /forum/reply/" + req.params.thread_id);
	let thread_id = req.params.thread_id | 0;
	let user_id = req.user.user_id;
	let body = req.body.body;
	FORUM_NEW_POST.run(thread_id, user_id, body);
	res.redirect('/forum/thread/'+thread_id);
});

/*
 * GAME LOBBY
 */

let TITLES = {};
let RULES = {};
let ROLES = {};

function load_rules() {
	const SQL_SELECT_TITLES = SQL("SELECT * FROM titles");
	const SQL_SELECT_TITLE_ROLES = SQL("SELECT role FROM roles WHERE title_id=?").pluck();
	for (let title of SQL_SELECT_TITLES.all()) {
		let title_id = title.title_id;
		if (fs.existsSync(__dirname + "/public/" + title_id + "/rules.js")) {
			console.log("Loading rules for " + title_id);
			try {
				TITLES[title_id] = title;
				RULES[title_id] = require("./public/" + title_id + "/rules.js");
				ROLES[title_id] = SQL_SELECT_TITLE_ROLES.all(title_id);
			} catch (err) {
				console.log(err);
			}
		} else {
			console.log("Cannot find rules for " + title_id);
		}
	}
}

load_rules();

const SQL_INSERT_GAME = SQL("INSERT INTO games (owner_id,title_id,scenario,options,private,random,description) VALUES (?,?,?,?,?,?,?)");
const SQL_DELETE_GAME = SQL("DELETE FROM games WHERE game_id=? AND owner_id=?");

const SQL_SELECT_USER_CHAT = SQL("SELECT game_id,time,name,message FROM game_chat_view WHERE game_id IN ( SELECT DISTINCT game_id FROM players WHERE user_id=? ) ORDER BY chat_id DESC").raw();
const SQL_SELECT_USER_CHAT_N = SQL("SELECT game_id,time,name,message FROM game_chat_view WHERE game_id IN ( SELECT DISTINCT game_id FROM players WHERE user_id=? ) ORDER BY chat_id DESC LIMIT ?").raw();

const SQL_SELECT_GAME_CHAT = SQL("SELECT chat_id,time,name,message FROM game_chat_view WHERE game_id=? AND chat_id>?").raw();
const SQL_INSERT_GAME_CHAT = SQL("INSERT INTO game_chat (game_id,user_id,message) VALUES (?,?,?) RETURNING chat_id,time,'',message").raw();

const SQL_SELECT_GAME_STATE = SQL("SELECT state FROM game_state WHERE game_id=?").pluck();
const SQL_UPDATE_GAME_STATE = SQL("INSERT OR REPLACE INTO game_state (game_id,state,active,mtime) VALUES (?,?,?,datetime('now'))");
const SQL_UPDATE_GAME_RESULT = SQL("UPDATE games SET status=?, result=? WHERE game_id=?");
const SQL_UPDATE_GAME_PRIVATE = SQL("UPDATE games SET private=1 WHERE game_id=?");
const SQL_INSERT_REPLAY = SQL("INSERT INTO game_replay (game_id,role,action,arguments) VALUES (?,?,?,?)");

const SQL_SELECT_GAME = SQL("SELECT * FROM games WHERE game_id=?");
const SQL_SELECT_GAME_VIEW = SQL("SELECT * FROM game_view WHERE game_id=?");
const SQL_SELECT_GAME_FULL_VIEW = SQL("SELECT * FROM game_full_view WHERE game_id=?");
const SQL_SELECT_GAME_TITLE = SQL("SELECT title_id FROM games WHERE game_id=?").pluck();
const SQL_SELECT_GAME_RANDOM = SQL("SELECT random FROM games WHERE game_id=?").pluck();

const SQL_SELECT_PLAYERS = SQL("SELECT * FROM players NATURAL JOIN user_view WHERE game_id=?");
const SQL_SELECT_PLAYERS_JOIN = SQL("SELECT role, user_id, name FROM players NATURAL JOIN users WHERE game_id=?");
const SQL_SELECT_PLAYER_ROLE = SQL("SELECT role FROM players WHERE game_id=? AND user_id=?").pluck();
const SQL_INSERT_PLAYER_ROLE = SQL("INSERT OR IGNORE INTO players (game_id,role,user_id) VALUES (?,?,?)");
const SQL_DELETE_PLAYER_ROLE = SQL("DELETE FROM players WHERE game_id=? AND role=?");
const SQL_UPDATE_PLAYER_ROLE = db.prepare("UPDATE players SET role=? WHERE game_id=? AND role=? AND user_id=?");

const SQL_SELECT_OPEN_GAMES = db.prepare("SELECT * FROM games WHERE status=0");
const SQL_COUNT_OPEN_GAMES = SQL("SELECT COUNT(*) FROM games WHERE owner_id=? AND status=0").pluck();

const SQL_SELECT_REMATCH = SQL("SELECT game_id FROM games WHERE status < 3 AND description=?").pluck();
const SQL_INSERT_REMATCH = SQL(`
	INSERT INTO games
		(owner_id, title_id, scenario, options, private, random, description)
	SELECT
		$user_id, title_id, scenario, options, private, random, $magic
	FROM games
	WHERE game_id = $game_id AND NOT EXISTS (
		SELECT * FROM games WHERE description=$magic
	)
`);

const QUERY_LIST_GAMES = SQL(`
	SELECT * FROM game_view
	WHERE private=0 AND status < 2
	ORDER BY status ASC, mtime DESC
	`);

const QUERY_LIST_GAMES_OF_TITLE = SQL(`
	SELECT * FROM game_view
	WHERE private=0 AND title_id=$title_id
	ORDER BY status ASC, mtime DESC
	`);

const QUERY_LIST_GAMES_OF_USER = SQL(`
	SELECT * FROM game_view
	WHERE owner_id=$user_id OR game_id IN ( SELECT game_id FROM players WHERE players.user_id=$user_id )
	ORDER BY status ASC, mtime DESC
	`);

function is_active(game, players, user_id) {
	if (game.status !== 1 || user_id === 0)
		return false;
	let active = game.active;
	for (let i = 0; i < players.length; ++i) {
		let p = players[i];
		if ((p.user_id === user_id) && (active === 'All' || active === 'Both' || active === p.role))
			return true;
	}
	return false;
}

function is_shared(game, players, user_id) {
	let n = 0;
	for (let i = 0; i < players.length; ++i)
		if (players[i].user_id === user_id)
			++n;
	return n > 1;
}

function is_solo(players) {
	return players.every(p => p.user_id === players[0].user_id)
}

function annotate_games(games, user_id) {
	for (let i = 0; i < games.length; ++i) {
		let game = games[i];
		let players = SQL_SELECT_PLAYERS_JOIN.all(game.game_id);
		game.player_names = players.map(p => {
			let name = p.name.replace(/ /g, '\xa0');
			return p.user_id > 0 ? `<a href="/user/${p.name}">${name}</a>` : name;
		}).join(", ");
		game.is_active = is_active(game, players, user_id);
		game.is_shared = is_shared(game, players, user_id);
		game.ctime = human_date(game.ctime);
		game.mtime = human_date(game.mtime);
	}
}

app.get('/games', may_be_logged_in, function (req, res) {
	LOG(req, "GET /join");
	let games;
	if (req.isAuthenticated()) {
		games = QUERY_LIST_GAMES.all();
		annotate_games(games, req.user.user_id);
	} else {
		games = QUERY_LIST_GAMES.all({user_id: 0});
		annotate_games(games, 0);
	}
	let open_games = games.filter(game => game.status === 0);
	let active_games = games.filter(game => game.status === 1);
	res.set("Cache-Control", "no-store");
	res.render('games.ejs', {
		user: req.user,
		open_games: open_games,
		active_games: active_games,
	});
});

app.get('/profile', must_be_logged_in, function (req, res) {
	LOG(req, "GET /profile");
	let avatar = get_avatar(req.user.mail);
	let games = QUERY_LIST_GAMES_OF_USER.all({user_id: req.user.user_id});
	annotate_games(games, req.user.user_id);
	let open_games = games.filter(game => game.status === 0);
	let active_games = games.filter(game => game.status === 1);
	let finished_games = games.filter(game => game.status === 2);
	res.set("Cache-Control", "no-store");
	res.render('profile.ejs', {
		user: req.user,
		avatar: avatar,
		open_games: open_games,
		active_games: active_games,
		finished_games: finished_games,
	});
});

app.get('/info/:title_id', may_be_logged_in, function (req, res) {
	LOG(req, "GET /info/" + req.params.title_id);
	let title_id = req.params.title_id;
	let title = TITLES[title_id];
	if (!title)
		return res.status(404).send("Invalid title.");
	if (req.isAuthenticated()) {
		let games = QUERY_LIST_GAMES_OF_TITLE.all({title_id: title_id});
		annotate_games(games, req.user.user_id);
		let open_games = games.filter(game => game.status === 0);
		let active_games = games.filter(game => game.status === 1);
		let finished_games = games.filter(game => game.status === 2);
		res.set("Cache-Control", "no-store");
		res.render('info.ejs', {
			user: req.user,
			title: title,
			open_games: open_games,
			active_games: active_games,
			finished_games: finished_games,
		});
	} else {
		res.set("Cache-Control", "no-store");
		res.render('info.ejs', {
			user: req.user,
			title: title,
			open_games: [],
			active_games: [],
			finished_games: [],
		});
	}
});

app.get('/create/:title_id', must_be_logged_in, function (req, res) {
	LOG(req, "GET /create/" + req.params.title_id);
	let title_id = req.params.title_id;
	let title = TITLES[title_id];
	if (!title)
		return res.status(404).send("Invalid title.");
	res.render('create.ejs', {
		user: req.user,
		title: title,
		scenarios: RULES[title_id].scenarios,
		flash: req.flash('message')
	});
});

function options_json_replacer(key, value) {
	if (key === 'scenario') return undefined;
	if (key === 'description') return undefined;
	if (key === 'random') return undefined;
	if (key === 'private') return undefined;
	if (value === 'true') return true;
	if (value === 'false') return false;
	if (value === '') return undefined;
	return value;
}

app.post('/create/:title_id', must_be_logged_in, function (req, res) {
	let title_id = req.params.title_id;
	let descr = req.body.description;
	let priv = req.body.private === 'true';
	let rand = req.body.random === 'true';
	let user_id = req.user.user_id;
	let scenario = req.body.scenario;
	let options = JSON.stringify(req.body, options_json_replacer);
	LOG(req, "POST /create/" + req.params.title_id, scenario, options, priv, JSON.stringify(descr));
	let count = SQL_COUNT_OPEN_GAMES.get(user_id);
	if (count >= MAX_OPEN_GAMES) {
		req.flash('message', "You have too many open games!");
		return res.redirect('/create/'+title_id);
	}
	if (!(title_id in RULES)) {
		return res.send("Invalid title.");
	}
	if (!RULES[title_id].scenarios.includes(scenario)) {
		return res.send("Invalid scenario.");
	}
	let info = SQL_INSERT_GAME.run(user_id, title_id, scenario, options, priv ? 1 : 0, rand ? 1 : 0, descr);
	res.redirect('/join/'+info.lastInsertRowid);
});

app.get('/delete/:game_id', must_be_logged_in, function (req, res) {
	let game_id = req.params.game_id;
	LOG(req, "GET /delete/" + game_id);
	let title_id = SQL_SELECT_GAME_TITLE.get(game_id);
	let info = SQL_DELETE_GAME.run(game_id, req.user.user_id);
	if (info.changes === 0)
		return res.send("Not authorized to delete that game ID.");
	if (info.changes === 1)
		update_join_clients_deleted(game_id);
	res.redirect('/info/'+title_id);
});

function join_rematch(req, res, game_id, role) {
	let is_random = SQL_SELECT_GAME_RANDOM.get(game_id);
	if (is_random) {
		for (let i = 1; i <= 6; ++i) {
			let info = SQL_INSERT_PLAYER_ROLE.run(game_id, 'Random ' + i, req.user.user_id);
			if (info.changes === 1) {
				update_join_clients_players(game_id);
				break;
			}
		}
		return res.redirect('/join/'+game_id);
	} else {
		let info = SQL_INSERT_PLAYER_ROLE.run(game_id, role, req.user.user_id);
		if (info.changes === 1)
			update_join_clients_players(game_id);
		return res.redirect('/join/'+game_id);
	}
}

app.get('/rematch/:old_game_id/:role', must_be_logged_in, function (req, res) {
	LOG(req, "GET /rematch/" + req.params.old_game_id);
	let old_game_id = req.params.old_game_id | 0;
	let role = req.params.role;
	let magic = "\u{1F503} " + old_game_id;
	let new_game_id = 0;
	let info = SQL_INSERT_REMATCH.run({user_id: req.user.user_id, game_id: old_game_id, magic: magic});
	if (info.changes === 1)
		new_game_id = info.lastInsertRowid;
	else
		new_game_id = SQL_SELECT_REMATCH.get(magic);
	if (new_game_id)
		return join_rematch(req, res, new_game_id, role);
	req.flash('message', "Can't create or find rematch game!");
	return res.redirect('/join/'+old_game_id);
});

let join_clients = {};

function update_join_clients_deleted(game_id) {
	let list = join_clients[game_id];
	if (list && list.length > 0) {
		for (let res of list) {
			res.write("retry: 15000\n");
			res.write("event: deleted\n");
			res.write("data: The game doesn't exist.\n\n");
		}
	}
}

function update_join_clients_game(game_id) {
	let list = join_clients[game_id];
	if (list && list.length > 0) {
		let game = SQL_SELECT_GAME_VIEW.get(game_id);
		for (let res of list) {
			res.write("retry: 15000\n");
			res.write("event: game\n");
			res.write("data: " + JSON.stringify(game) + "\n\n");
		}
	}
}

function update_join_clients_players(game_id) {
	let list = join_clients[game_id];
	if (list && list.length > 0) {
		let players = SQL_SELECT_PLAYERS_JOIN.all(game_id);
		let ready = RULES[list.title_id].ready(list.scenario, list.options, players);
		for (let res of list) {
			res.write("retry: 15000\n");
			res.write("event: players\n");
			res.write("data: " + JSON.stringify(players) + "\n\n");
			res.write("event: ready\n");
			res.write("data: " + ready + "\n\n");
		}
	}
}

app.get('/join/:game_id', must_be_logged_in, function (req, res) {
	LOG(req, "GET /join/" + req.params.game_id);
	let game_id = req.params.game_id | 0;
	let game = SQL_SELECT_GAME_VIEW.get(game_id);
	if (!game)
		return res.status(404).send("Invalid game ID.");
	let roles = ROLES[game.title_id];
	let players = SQL_SELECT_PLAYERS_JOIN.all(game_id);
	let ready = (game.status === 0) && RULES[game.title_id].ready(game.scenario, game.options, players);
	res.set("Cache-Control", "no-store");
	res.render('join.ejs', {
		user: req.user,
		game: game,
		roles: roles,
		players: players,
		ready: ready,
		flash: req.flash('message')
	});
});

app.get('/join-events/:game_id', must_be_logged_in, function (req, res) {
	LOG(req, "GET /join-events/" + req.params.game_id);
	let game_id = req.params.game_id | 0;
	let game = SQL_SELECT_GAME_VIEW.get(game_id);
	let players = SQL_SELECT_PLAYERS_JOIN.all(game_id);

	res.setHeader("Cache-Control", "no-store");
	res.setHeader("Content-Type", "text/event-stream");
	res.setHeader("Connection", "keep-alive");

	if (!game) {
		return res.send("event: deleted\ndata: The game doesn't exist.\n\n");
	}
	if (!(game_id in join_clients)) {
		join_clients[game_id] = [];
		join_clients[game_id].title_id = game.title_id;
		join_clients[game_id].scenario = game.scenario;
		join_clients[game_id].options = JSON.parse(game.options);
	}
	join_clients[game_id].push(res);

	res.on('close', () => {
		let list = join_clients[game_id];
		let i = list.indexOf(res);
		if (i >= 0)
			list.splice(i, 1);
	});

	res.write("retry: 15000\n\n");
	res.write("event: game\n");
	res.write("data: " + JSON.stringify(game) + "\n\n");
	res.write("event: players\n");
	res.write("data: " + JSON.stringify(players) + "\n\n");
});

app.get('/join/:game_id/:role', must_be_logged_in, function (req, res) {
	LOG(req, "GET /join/" + req.params.game_id + "/" + req.params.role);
	let game_id = req.params.game_id | 0;
	let role = req.params.role;
	let info = SQL_INSERT_PLAYER_ROLE.run(game_id, role, req.user.user_id);
	if (info.changes === 1) {
		update_join_clients_players(game_id);
		res.send("SUCCESS");
	} else {
		res.send("Could not join game.");
	}
});

app.get('/part/:game_id/:role', must_be_logged_in, function (req, res) {
	LOG(req, "GET /part/" + req.params.game_id + "/" + req.params.role);
	let game_id = req.params.game_id | 0;
	let role = req.params.role;
	SQL_DELETE_PLAYER_ROLE.run(game_id, role);
	update_join_clients_players(game_id);
	res.send("SUCCESS");
});

function assign_random_roles(game, players) {
	function pick_random_item(list) {
		let k = crypto.randomInt(list.length);
		let r = list[k];
		list.splice(k, 1);
		return r;
	}
	let roles = ROLES[game.title_id];
	for (let p of players) {
		let old_role = p.role;
		p.role = pick_random_item(roles);
		console.log("ASSIGN ROLE", "(" + p.name + ")", old_role, "->", p.role);
		SQL_UPDATE_PLAYER_ROLE.run(p.role, game.game_id, old_role, p.user_id);
	}
}

app.get('/start/:game_id', must_be_logged_in, function (req, res) {
	LOG(req, "GET /start/" + req.params.game_id);
	let game_id = req.params.game_id | 0;
	let game = SQL_SELECT_GAME.get(game_id);
	if (game.owner_id !== req.user.user_id)
		return res.send("Not authorized to start that game ID.");
	if (game.status !== 0)
		return res.send("The game is already started.");
	let players = SQL_SELECT_PLAYERS.all(game_id);
	if (!RULES[game.title_id].ready(game.scenario, game.options, players))
		return res.send("Invalid scenario/options/player configuration!");
	if (game.random) {
		assign_random_roles(game, players);
		players = SQL_SELECT_PLAYERS.all(game_id);
		update_join_clients_players(game_id);
	}
	let seed = random_seed();
	let state = RULES[game.title_id].setup(seed, game.scenario, game.options, players);
	put_replay(game_id, null, 'setup', [seed, game.scenario, game.options, players]);
	SQL_UPDATE_GAME_RESULT.run(1, null, game_id);
	SQL_UPDATE_GAME_STATE.run(game_id, JSON.stringify(state), state.active);
	if (is_solo(players))
		SQL_UPDATE_GAME_PRIVATE.run(game_id);
	update_join_clients_game(game_id);
	res.send("SUCCESS");
});

app.get('/play/:game_id/:role', must_be_logged_in, function (req, res) {
	LOG(req, "GET /play/" + req.params.game_id + "/" + req.params.role);
	let game_id = req.params.game_id | 0;
	let role = req.params.role;
	let title = SQL_SELECT_GAME_TITLE.get(game_id);
	if (!title)
		return res.redirect('/join/'+game_id);
	res.redirect('/'+title+'/play.html?game='+game_id+'&role='+role);
});

app.get('/play/:game_id', must_be_logged_in, function (req, res) {
	LOG(req, "GET /play/" + req.params.game_id);
	let game_id = req.params.game_id | 0;
	let user_id = req.user.user_id | 0;
	let title = SQL_SELECT_GAME_TITLE.get(game_id);
	if (!title)
		return res.redirect('/join/'+game_id);
	let role = SQL_SELECT_PLAYER_ROLE.get(game_id, user_id);
	if (!role)
		return res.redirect('/'+title+'/play.html?game='+game_id+'&role=Observer');
	return res.redirect('/'+title+'/play.html?game='+game_id+'&role='+role);
});

/*
 * MAIL NOTIFICATIONS
 */

const MAIL_FROM = process.env.MAIL_FROM || "Rally the Troops! <notifications@rally-the-troops.com>";
const MAIL_FOOTER = "You can unsubscribe from notifications on your profile page:\n\nhttps://rally-the-troops.com/profile\n";

const SQL_SELECT_NOTIFIED = SQL("SELECT datetime('now') < datetime(time,?) FROM last_notified WHERE game_id=? AND user_id=?").pluck();
const SQL_INSERT_NOTIFIED = SQL("INSERT OR REPLACE INTO last_notified (game_id,user_id,time) VALUES (?,?,datetime('now'))");
const SQL_DELETE_NOTIFIED = SQL("DELETE FROM last_notified WHERE game_id=? AND user_id=?");

const QUERY_LIST_YOUR_TURN = SQL("SELECT * FROM your_turn_reminder");

function mail_callback(err, info) {
	if (err)
		console.log("MAIL ERROR", err);
}

function mail_addr(user) {
	return user.name + " <" + user.mail + ">";
}

function mail_describe(game) {
	let desc = `Game: ${game.title_name}\n`;
	desc += `Scenario: ${game.scenario}\n`;
	desc += `Players: ${game.player_names}\n`;
	if (game.description.length > 0)
		desc += `Description: ${game.description}\n`;
	return desc + "\n";
}

function mail_password_reset_token(user, token) {
	let subject = "Rally the Troops - Password reset request";
	let body =
		"Your password reset token is: " + token + "\n\n" +
		"https://rally-the-troops.com/reset_password/" + user.mail + "/" + token + "\n\n" +
		"If you did not request a password reset you can ignore this mail.\n";
	console.log("SENT MAIL:", mail_addr(user), subject);
	if (mailer)
		mailer.sendMail({ from: MAIL_FROM, to: mail_addr(user), subject: subject, text: body }, mail_callback);
}

function mail_new_message(user, msg_id, msg_from, msg_subject, msg_body) {
	let subject = "You have a new message from " + msg_from + ".";
	let body = "Subject: " + msg_subject + "\n\n" +
		msg_body + "\n\n" +
		"https://rally-the-troops.com/message/read/" + msg_id + "\n\n" +
		MAIL_FOOTER;
	console.log("SENT MAIL:", mail_addr(user), subject);
	if (mailer)
		mailer.sendMail({ from: MAIL_FROM, to: mail_addr(user), subject: subject, text: body }, mail_callback);
}

function mail_your_turn_notification(user, game_id, interval) {
	let too_soon = SQL_SELECT_NOTIFIED.get(interval, game_id, user.user_id);
	if (!too_soon) {
		SQL_INSERT_NOTIFIED.run(game_id, user.user_id);
		let game = SQL_SELECT_GAME_FULL_VIEW.get(game_id);
		let subject = game.title_name + " - " + game_id + " - Your turn!";
		let body = mail_describe(game) +
			"It's your turn.\n\n" +
			"https://rally-the-troops.com/play/" + game_id + "\n\n" +
			MAIL_FOOTER;
		console.log("SENT MAIL:", mail_addr(user), subject);
		if (mailer)
			mailer.sendMail({ from: MAIL_FROM, to: mail_addr(user), subject: subject, text: body }, mail_callback);
	}
}

function reset_your_turn_notification(user, game_id) {
	SQL_DELETE_NOTIFIED.run(game_id, user.user_id);
}

function mail_ready_to_start_notification(user, game_id, interval) {
	let too_soon = SQL_SELECT_NOTIFIED.get(interval, game_id, user.user_id);
	if (!too_soon) {
		SQL_INSERT_NOTIFIED.run(game_id, user.user_id);
		let game = SQL_SELECT_GAME_FULL_VIEW.get(game_id);
		let subject = game.title_name + " - " + game_id + " - Ready to start!";
		let body = mail_describe(game) +
			"Your game is ready to start.\n\n" +
			"https://rally-the-troops.com/join/" + game_id + "\n\n" +
			MAIL_FOOTER;
		console.log("SENT MAIL:", mail_addr(user), subject);
		if (mailer)
			mailer.sendMail({ from: MAIL_FROM, to: mail_addr(user), subject: subject, text: body }, mail_callback);
	}
}

function mail_your_turn_notification_to_offline_users(game_id, old_active, active) {
	function is_online(game_id, user_id) {
		for (let other of clients[game_id])
			if (other.user_id === user_id)
				return true;
		return false;
	}

	// Only send notifications when the active player changes or if it's a simultaneous move.
	if (old_active === active && active !== 'Both' && active !== 'All')
		return;

	let players = SQL_SELECT_PLAYERS.all(game_id);
	for (let p of players) {
		if (p.notify) {
			if (active === p.role || active === 'Both' || active === 'All') {
				if (is_online(game_id, p.user_id)) {
					reset_your_turn_notification(p, game_id);
				} else {
					mail_your_turn_notification(p, game_id, '+15 minutes');
				}
			} else {
				reset_your_turn_notification(p, game_id);
			}
		}
	}
}

function notify_your_turn_reminder() {
	for (let item of QUERY_LIST_YOUR_TURN.all()) {
		mail_your_turn_notification(item, item.game_id, '+25 hours');
	}
}

function notify_ready_to_start_reminder() {
	for (let game of SQL_SELECT_OPEN_GAMES.all()) {
		let players = SQL_SELECT_PLAYERS.all(game.game_id);
		if (RULES[game.title_id].ready(game.scenario, game.options, players)) {
			let owner = SQL_OFFLINE_USER.get(game.owner_id, '+3 minutes');
			if (owner) {
				if (owner.notify)
					mail_ready_to_start_notification(owner, game.game_id, '+25 hours');
			}
		}
	}
}

// Check and send daily 'your turn' reminders every 15 minutes.
setInterval(notify_your_turn_reminder, 15 * 60 * 1000);

// Check and send ready to start notifications every 5 minutes.
setInterval(notify_ready_to_start_reminder, 5 * 60 * 1000);

/*
 * GAME SERVER
 */

let clients = {};

function send_state(socket, state) {
	try {
		let view = socket.rules.view(state, socket.role);
		if (socket.log_length < view.log.length)
			view.log_start = socket.log_length;
		else
			view.log_start = view.log.length;
		socket.log_length = view.log.length;
		view.log = view.log.slice(view.log_start);
		socket.emit('state', view, state.state === 'game_over');
	} catch (err) {
		console.log(err);
		return socket.emit('error', err.toString());
	}
}

function get_game_state(game_id) {
	let game_state = SQL_SELECT_GAME_STATE.get(game_id);
	if (!game_state)
		throw new Error("No game with that ID");
	return JSON.parse(game_state);
}

function put_game_state(game_id, state, old_active) {
	if (state.state === 'game_over') {
		SQL_UPDATE_GAME_RESULT.run(2, state.result, game_id);
	}
	SQL_UPDATE_GAME_STATE.run(game_id, JSON.stringify(state), state.active);
	for (let other of clients[game_id])
		send_state(other, state);
	update_join_clients_game(game_id);
	mail_your_turn_notification_to_offline_users(game_id, old_active, state.active);
}

function put_replay(game_id, role, action, args) {
	if (args !== undefined && args !== null)
		args = JSON.stringify(args);
	SQL_INSERT_REPLAY.run(game_id, role, action, args);
}

function on_action(socket, action, arg) {
	SLOG(socket, "--> ACTION", action, arg);
	try {
		let state = get_game_state(socket.game_id);
		let old_active = state.active;
		socket.rules.action(state, socket.role, action, arg);
		put_game_state(socket.game_id, state, old_active);
		put_replay(socket.game_id, socket.role, action, arg);
	} catch (err) {
		console.log(err);
		return socket.emit('error', err.toString());
	}
}

function on_resign(socket) {
	SLOG(socket, "--> RESIGN");
	try {
		let state = get_game_state(socket.game_id);
		let old_active = state.active;
		socket.rules.resign(state, socket.role);
		put_game_state(socket.game_id, state, old_active);
		put_replay(socket.game_id, socket.role, 'resign', null);
	} catch (err) {
		console.log(err);
		return socket.emit('error', err.toString());
	}
}

function on_getchat(socket, seen) {
	try {
		let chat = SQL_SELECT_GAME_CHAT.all(socket.game_id, seen);
		SLOG(socket, "<-- CHAT", seen, chat.length);
		for (let i = 0; i < chat.length; ++i)
			socket.emit('chat', chat[i]);
	} catch (err) {
		console.log(err);
		return socket.emit('error', err.toString());
	}
}

function on_chat(socket, message) {
	message = message.substring(0,4000);
	try {
		let chat = SQL_INSERT_GAME_CHAT.get(socket.game_id, socket.user_id, message);
		chat[2] = socket.user_name;
		SLOG(socket, "--> CHAT", JSON.stringify(chat));
		for (let other of clients[socket.game_id])
			if (other.role !== "Observer")
				other.emit('chat', chat);
	} catch (err) {
		console.log(err);
		return socket.emit('error', err.toString());
	}
}

function on_debug(socket) {
	SLOG(socket, "<-- DEBUG");
	try {
		let game_state = SQL_SELECT_GAME_STATE.get(socket.game_id);
		if (!game_state)
			return socket.emit('error', "No game with that ID.");
		socket.emit('debug', game_state);
	} catch (err) {
		console.log(err);
		return socket.emit('error', err.toString());
	}
}

function on_save(socket) {
	SLOG(socket, "<-- SAVE");
	try {
		let game_state = SQL_SELECT_GAME_STATE.get(socket.game_id);
		if (!game_state)
			return socket.emit('error', "No game with that ID.");
		socket.emit('save', game_state);
	} catch (err) {
		console.log(err);
		return socket.emit('error', err.toString());
	}
}

function on_restore(socket, state_text) {
	SLOG(socket, '--> RESTORE', state_text);
	try {
		let state = JSON.parse(state_text);
		SQL_UPDATE_GAME_RESULT.run(1, null, game_id);
		SQL_UPDATE_GAME_STATE.run(game_id, state_text, state.active);
		for (let other of clients[socket.game_id])
			send_state(other, state);
	} catch (err) {
		console.log(err);
		return socket.emit('error', err.toString());
	}
}

function broadcast_presence(game_id) {
	let presence = {};
	for (let socket of clients[game_id])
		presence[socket.role] = true;
	for (let socket of clients[game_id])
		socket.emit('presence', presence);
}

io.on('connection', (socket) => {
	socket.title_id = socket.handshake.query.title || "unknown";
	socket.game_id = socket.handshake.query.game | 0;
	socket.user_id = socket.request.user.user_id | 0;
	socket.user_name = socket.request.user.name;
	socket.role = socket.handshake.query.role;
	socket.log_length = 0;
	socket.rules = RULES[socket.title_id];

	SLOG(socket, "CONNECT");

	try {
		let title_id = SQL_SELECT_GAME_TITLE.get(socket.game_id);
		if (title_id !== socket.title_id)
			return socket.emit('error', "Invalid game ID.");

		let players = SQL_SELECT_PLAYERS_JOIN.all(socket.game_id);

		if (socket.role !== "Observer") {
			let me;
			if (socket.role && socket.role !== 'undefined' && socket.role !== 'null') {
				me = players.find(p => p.user_id === socket.user_id && p.role === socket.role);
				if (!me) {
					socket.role = "Observer";
					return socket.emit('error', "You aren't assigned that role!");
				}
			} else {
				me = players.find(p => p.user_id === socket.user_id);
				socket.role = me ? me.role : "Observer";
			}
		}

		socket.emit('roles', socket.role, players);

		if (clients[socket.game_id])
			clients[socket.game_id].push(socket);
		else
			clients[socket.game_id] = [ socket ];

		socket.on('disconnect', () => {
			SLOG(socket, "DISCONNECT");
			clients[socket.game_id].splice(clients[socket.game_id].indexOf(socket), 1);
			if (socket.role !== "Observer")
				broadcast_presence(socket.game_id);
		});

		if (socket.role !== "Observer") {
			socket.on('action', (action, arg) => on_action(socket, action, arg));
			socket.on('resign', () => on_resign(socket));
			socket.on('getchat', (seen) => on_getchat(socket, seen));
			socket.on('chat', (message) => on_chat(socket, message));

			socket.on('debug', () => on_debug(socket));
			socket.on('save', () => on_save(socket));
			socket.on('restore', (state) => on_restore(socket, state));
			socket.on('restart', (scenario) => {
				try {
					let seed = random_seed();
					let state = socket.rules.setup(seed, scenario, players);
					put_replay(socket.game_id, null, 'setup', [seed, scenario, options, players]);
					for (let other of clients[socket.game_id]) {
						other.log_length = 0;
						send_state(other, state);
					}
					let state_text = JSON.stringify(state);
					SQL_UPDATE_GAME_RESULT.run(1, null, socket.game_id);
					SQL_UPDATE_GAME_STATE.run(socket.game_id, state_text, state.active);
				} catch (err) {
					console.log(err);
					return socket.emit('error', err.toString());
				}
			});
		}

		broadcast_presence(socket.game_id);

		send_state(socket, get_game_state(socket.game_id));

	} catch (err) {
		console.log(err);
		socket.emit('error', err.message);
	}
});

/*
 * HIDDEN EXTRAS
 */

const QUERY_STATS = db.prepare(`
	SELECT title_id, scenario, result, count(*) AS count
	FROM game_full_view
	WHERE status=2 AND private=0
	GROUP BY title_name, scenario, result
	`);

app.get('/stats', may_be_logged_in, function (req, res) {
	LOG(req, "GET /stats");
	let stats = QUERY_STATS.all();
	res.render('stats.ejs', {
		user: req.user,
		stats: stats,
		title_role_map: ROLES, title_name_map: TITLES, title_rule_map: RULES
	});
});
