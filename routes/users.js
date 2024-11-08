var express = require('express');
const { isLoggedIn } = require('../helpers/util');
var router = express.Router()

module.exports = function (db) {
  router.get('/', isLoggedIn, function (req, res, next) {
    const { page = 1, title, deadlineMin, deadlineMax, complete, operation = 'OR' } = req.query
    const queries = []
    const params = []
    const op = (operation && operation.toUpperCase() === 'OR') ? 'OR' : 'AND'

    if (title) {
      params.push(title)
      queries.push(`title ilike '%' || $${params.length} || '%' `)
    }

    if (complete) {
      params.push(complete)
      queries.push(`complete = $${params.length} `)
    }

    if (deadlineMin && deadlineMax) {
      params.push(deadlineMin, deadlineMax);
      queries.push(`deadline BETWEEN $${params.length - 1} AND $${params.length}`);
    } else if (deadlineMin) {
      params.push(deadlineMin);
      queries.push(`deadline >= $${params.length}`);
    } else if (deadlineMax) {
      params.push(deadlineMax);
      queries.push(`deadline <= $${params.length}`);
    }

    const limit = 5
    const offset = (page - 1) * limit
    let sql = 'select count(*) as total from todos'
    if (queries.length > 0) {
      sql += ` where ${queries.join(` ${op} `)}`
    }

    db.query(sql, params, (err, data) => {
      if (err) return res.send(err)

      const total = data.rows[0].total
      const pages = Math.ceil(total / limit)

      sql = `SELECT * FROM todos`
      if (queries.length > 0) {
        sql += ` where ${queries.join(` ${op} `)}`
      }

      sql += ` limit $${params.length + 1} offset $${params.length + 2}`

      db.query(sql, [...params, limit, offset], (err, data) => {
        if (err) return res.send(err)
        res.render('list', {
          title,
          complete,
          data: data.rows,
          pages,
          page: parseInt(page),
          offset,
          operation,
          deadlineMin,
          deadlineMax
        });
      })
    })
  });

  router.get('/add', isLoggedIn, function (req, res, next) {
    res.render('form')
  }).get('/', isLoggedIn, function (req, res, next) {
    const { page = 1, title, deadlineMin, deadlineMax, complete, operation = 'OR' } = req.query
    const queries = []
    const params = []
    const op = (operation && operation.toUpperCase() === 'OR') ? 'OR' : 'AND'

    if (title) {
      params.push(title)
      queries.push(`title ilike '%' || $${params.length} || '%' `)
    }

    if (complete) {
      params.push(complete)
      queries.push(`complete = $${params.length} `)
    }

    if (deadlineMin && deadlineMax) {
      params.push(deadlineMin, deadlineMax);
      queries.push(`deadline BETWEEN $${params.length - 1} AND $${params.length}`);
    } else if (deadlineMin) {
      params.push(deadlineMin);
      queries.push(`deadline >= $${params.length}`);
    } else if (deadlineMax) {
      params.push(deadlineMax);
      queries.push(`deadline <= $${params.length}`);
    }

    const limit = 5
    const offset = (page - 1) * limit
    let sql = 'select count(*) as total from todos'
    if (queries.length > 0) {
      sql += ` where ${queries.join(` ${op} `)}`
    }

    db.query(sql, params, (err, data) => {
      if (err) return res.send(err)

      const total = data.rows[0].total
      const pages = Math.ceil(total / limit)

      sql = `SELECT * FROM todos`
      if (queries.length > 0) {
        sql += ` where ${queries.join(` ${op} `)}`
      }

      sql += ` limit $${params.length + 1} offset $${params.length + 2}`

      db.query(sql, [...params, limit, offset], (err, data) => {
        if (err) return res.send(err)
        res.render('list', {
          title,
          complete,
          data: data.rows,
          pages,
          page: parseInt(page),
          offset,
          operation,
          deadlineMin,
          deadlineMax
        });
      })
    })
  });

  router.post('/add', function (req, res, next) {
    const { title } = req.body
    db.query('INSERT INTO todos (title) VALUES ($1)', [title], (err, data) => {
      if (err) return res.send(err)
      res.redirect('/users')
    })
  })

  router.get('/edit/:id', isLoggedIn, function (req, res, next) {
    const id = req.params
    
    db.query('SELECT * FROM todos WHERE id = $1', [id], (err, result) => {
      if (err) return res.send(err)
      const todo = result.rows[0]
      res.render('edit', { todo })
    });
  });

  router.post('/edit', function (req, res, next) {
    const { title, deadline, complete } = req.body;
    const id = req.params.id;
    db.query(
      'UPDATE todos SET title = $1,  complete = $2, deadline = $3 WHERE id = $4',
      [title, deadline, complete === '1' ? 1 : 0, id],
      (err, data) => {
        if (err) return res.send(err)
        res.redirect('/users')
      }
    )
  })

  router.get('/delete', function (req, res, next) {
    const id = req.params.id;
    db.query('DELETE FROM todos WHERE id = ?', [id], (err) => {
      if(err) return res.send(err)
        res.redirect('/users')
    })
  })

  return router;
}