var express = require('express');
const { isLoggedIn, formatDate } = require('../helpers/util');
var router = express.Router()

module.exports = function (db) {
  router.get('/', isLoggedIn, function (req, res, next) {
    const { page = 1, title, deadlineMin, deadlineMax, complete, operation = 'OR', sort = 'id', order = 'ASC' } = req.query;
    const queries = [];
    const params = [];
    const op = (operation && operation.toUpperCase() === 'OR') ? 'OR' : 'AND';

    if (title) {
      params.push(title);
      queries.push(`title ilike '%' || $${params.length} || '%' `);
    }

    if (complete) {
      params.push(complete);
      queries.push(`complete = $${params.length} `);
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

    const limit = 5;
    const offset = (page - 1) * limit;
    let sql = 'SELECT count(*) as total FROM todos';
    if (queries.length > 0) {
      sql += ` where ${queries.join(` ${op} `)}`;
    }

    db.query(sql, params, (err, data) => {
      if (err) return res.send(err);

      const total = data.rows[0].total;
      const pages = Math.ceil(total / limit);

      sql = `SELECT * FROM todos`;
      if (queries.length > 0) {
        sql += ` where ${queries.join(` ${op} `)}`;
      }

      sql += ` limit $${params.length + 1} offset $${params.length + 2}`;

      sql = `SELECT * FROM todos`;
      if (queries.length > 0) {
        sql += ` where ${queries.join(` ${op} `)}`;
      }

      sql += ` ORDER BY ${sort} ${order} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

      db.query(sql, [...params, limit, offset], (err, data) => {
        if (err) return res.send(err);

        data.rows.forEach(item => {
          item.deadline = formatDate(item.deadline);
        });

        res.render('list', {
          title,
          complete,
          data: data.rows,
          pages,
          page: parseInt(page),
          offset,
          sort,
          order,
          operation,
          deadlineMin,
          deadlineMax,
          user: req.session.user
        });
      });
    });
  });


  router.get('/add', isLoggedIn, function (req, res, next) {
    res.render('form')
  })

  router.post('/add', function (req, res, next) {
    const { title } = req.body
    const userId = req.session.user ? req.session.user.id : null

    if (!userId) {
      return res.redirect('/')
    }

    db.query('INSERT INTO todos (title, userid) VALUES ($1, $2)', [title, userId], (err, data) => {
      if (err) return res.send(err)
      res.redirect('/todos')
    })
  })

  router.get('/edit/:id', isLoggedIn, function (req, res, next) {
    const { id } = req.params;

    db.query('SELECT * FROM todos WHERE id = $1', [id], (err, result) => {
      if (err) return res.send(err);

      const todo = result.rows[0];
      if (!todo) {
        return res.send('Todo not found');
      }

      if (todo.userid !== req.session.user.id) {
        return res.send('You are not authorized to edit this todo');
      }

      res.render('edit', { todo });
    });
  });

  router.post('/edit/:id', isLoggedIn, function (req, res, next) {
    const { title, deadline, complete } = req.body;
    const { id } = req.params;

    db.query('SELECT * FROM todos WHERE id = $1', [id], (err, result) => {
      if (err) return res.send(err);

      const todo = result.rows[0];
      if (!todo) {
        return res.send('Todo not found');
      }

      if (todo.userid !== req.session.user.id) {
        return res.send('You are not authorized to edit this todo');
      }

      db.query(
        'UPDATE todos SET title = $1, complete = $2, deadline = $3 WHERE id = $4 AND userid = $5',
        [title, complete === '1' ? true : false, deadline, id, req.session.user.id],
        (err, data) => {
          if (err) return res.send(err);
          res.redirect('/todos');
        }
      );
    });
  });


  router.get('/delete/:id', isLoggedIn, function (req, res, next) {
    const { id } = req.params

    db.query('DELETE FROM todos WHERE id = $1', [id], (err) => {
      if (err) return res.send(err)
      res.redirect('/todos')
    })
  })

  return router;
}