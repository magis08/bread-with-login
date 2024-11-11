var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt')
const path = require('path');
const { isLoggedIn } = require('../helpers/util');

module.exports = function (db) {

  router.get('/', function (req, res, next) {
    res.render('login', { errorMessage: req.flash('errorMessage') })
  });

  router.get('/register', function (req, res, next) {
    res.render('register', { errorMessage: req.flash('errorMessage') })
  });

  router.post('/', async function (req, res, next) {
    const { email, password } = req.body
    try {
      const { rows } = await db.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email])
      if (rows.length === 0) {
        req.flash('errorMessage', 'email not found!')
        return res.redirect('/')
      }
      const user = rows[0]
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        req.flash('errorMessage', 'incorrect password!')
        return res.redirect('/')
      }
      req.session.user = {
        id: user.id,
        email: user.email,
        avatar: rows[0].avatar
      }
      res.redirect('/todos')
    } catch (e) {
      console.log(e)
      req.flash('errorMessage', 'something went wrong.')
      return res.redirect('/')
    }
  })

  router.post('/register', async function (req, res, next) {
    const { email, password, repassword } = req.body
    try {
      const { rows } = await db.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email])
      if (rows.length > 0) {
        req.flash('errorMessage', 'email already used')
        return res.redirect('/register')
      }
      if (password !== repassword) {
        req.flash('errorMessage', "password doesn't match")
        return res.redirect('/register')
      }
      const hashPassword = await bcrypt.hashSync(password, 10);
      const { rows: users } = await db.query('INSERT INTO users(email, password) VALUES($1, $2) RETURNING *', [email, hashPassword])
      req.session.user = {
        id: users[0].id,
        email: users[0].email,
        avatar: users[0].avatar
      }

      res.redirect('/')
    } catch (e) {
      console.log(e)
      res.send('something went wrong')
    }
  });

  router.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
      res.redirect('/')
    })
  })

  router.get('/upload', isLoggedIn, function (req, res) {
    res.render('upload')
  })

  router.post('/upload', isLoggedIn, function (req, res) {

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    const avatar = req.files.avatar;
    const fileName = `${Date.now()}-${avatar.name}`
    const uploadPath = path.join(__dirname, '..', 'public', 'avatars', fileName)

    // Use the mv() method to place the file somewhere on your server
    avatar.mv(uploadPath, function (err) {
      if (err)
        return res.status(500).send(err);

      db.query('UPDATE users SET avatar = $1 WHERE id = $2', [fileName, req.session.user.id], (err) => {
        req.session.user.avatar = fileName
        res.redirect('/todos')
      })
    });
  });

  return router;
}