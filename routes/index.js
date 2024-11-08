var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt')

module.exports = function (db) {

  router.get('/', function (req, res, next) {
    res.render('login')
  });

  router.get('/register', function (req, res, next) {
    res.render('register')
  });

  router.post('/', async function (req, res, next) {
    const { email, password } = req.body
    try {
      const { rows } = await db.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email])
      if (rows.length === 0) {
        return res.send("Email not found!")
      }
      const user = rows[0]
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.send("Incorrect password!");
      }
      req.session.user = {
        id: user.id,
        email: user.email
      }
      res.redirect('/users')
    } catch (e) {
      console.log(e)
      res.send('Something went wrong')
    }
  })

  router.post('/register', async function (req, res, next) {
    const { email, password, repassword } = req.body
    try {
      if (password !== repassword) {
        return res.send("password doesn't match!")
      }
      const { rows } = await db.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email])
      if (rows.length > 0) {
        return res.send("email already used")
      }
      const hashPassword = await bcrypt.hashSync(password, 10);
      const { rows: users } = await db.query('INSERT INTO users(email, password) VALUES($1, $2) RETURNING *', [email, hashPassword])
      req.session.user = {
        id: users[0].id,
        email: users[0].email
      }

      res.redirect('/')
    } catch (e) {
      console.log(e)
      res.send('something went wrong')
    }
  });

  return router;
}