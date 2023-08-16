const express = require('express')
const jwt = require('jsonwebtoken')
let books = require('./booksdb.js')
const regd_users = express.Router()

let users = []

const isValid = (username) => {
  //returns boolean
  let userswithsamename = users.filter((user) => {
    return user.username === username
  })
  if (userswithsamename.length > 0) {
    return true
  } else {
    return false
  }
}

const authenticatedUser = (username, password) => {
  let validusers = users.filter((user) => {
    return user.username === username && user.password === password
  })
  if (validusers.length > 0) {
    return true
  } else {
    return false
  }
}

//only registered users can login
regd_users.post('/login', (req, res) => {
  const username = req.body.username
  const password = req.body.password

  if (!username || !password) {
    return res.status(404).json({ message: 'Error logging in' })
  }
  if (authenticatedUser(username, password)) {
    let accessToken = jwt.sign(
      {
        data: username,
      },
      'access',
      { expiresIn: 60 * 60 },
    )
    req.session.authorization = {
      accessToken,
      username,
    }
    return res.status(200).send('User successfully logged in')
  } else {
    return res
      .status(208)
      .json({ message: 'Invalid Login. Check username and password' })
  }
})

// Add a book review
regd_users.put('/auth/review/:isbn', (req, res) => {
  if (req.session.authorization) {
    token = req.session.authorization['accessToken']
    jwt.verify(token, 'access', (err, user) => {
      if (!err) {
        req.user = user
        const isbn = req.params.isbn
        const review = req.query.review
        // get current user
        const currentUser = req.user.data
        // if there is previous review with current user
        books[isbn].reviews.map((data) => {
          if (data.reviewedBy == currentUser) {
            data.review = review
            return res.status(200).json(books[isbn])
          }
        })
        // if there is no previous review by current user
        books[isbn].reviews.push({
          reviewedBy: currentUser,
          review: review
        })
        return res.status(200).json( books[isbn])

      } else {
        return res.status(403).json({ message: 'User not authenticated' })
      }
    })
  } else {
    return res.status(403).json({ message: 'User not logged in' })
  }
})

// delete a book review 
regd_users.delete('/auth/review/:isbn', (req, res) => {
  if (req.session.authorization) {
    token = req.session.authorization['accessToken']
    jwt.verify(token, 'access', (err, user) => {
      if (!err) {
        req.user = user
        const isbn = req.params.isbn
        // get current user
        const currentUser = req.user.data
        // if there is previous review with current user
        books[isbn].reviews.map((data) => {
          if (data.reviewedBy == currentUser) {
            data.review = ''
            data.reviewedBy = ''
            return res.status(200).json(books[isbn])
          }
        })
        // if there is no previous review by current user
        return res.status(400).json("No previous review is made by current user")

      } else {
        return res.status(403).json({ message: 'User not authenticated' })
      }
    })
  } else {
    return res.status(403).json({ message: 'User not logged in' })
  }
})

module.exports.authenticated = regd_users
module.exports.isValid = isValid
module.exports.users = users
