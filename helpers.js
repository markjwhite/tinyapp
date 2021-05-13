const bcrypt = require('bcrypt');

const fetchUserByEmail = (email, db) => {
  for (const user in db) {
    if (db[user].email === email) {
      return user;
    }
  }
  return null;
};

const fetchUserByID = (userID, db) => {
  for (const user_id in db) {
    if (userID === user_id) {
      const user = db[user_id]
      return user;
    }
  }
  return undefined;
};

const generateRandomString = () => {
  const random = Math.random().toString(36).substring(6);
  return random;
};

const createUser = (userParams, db, id) => {
  console.log(userParams);
  if (fetchUserByEmail(userParams.email, db)) {
    return { error: "email" }
  }
  const { email, password } = userParams;

  if (!email || !password) {
    return { error: "password" }
  }
  db[id] = { id, email, password: bcrypt.hashSync(password, 10) }
  return { id, email, password }
};

const urlsForUsers = (id, db) => {
  const userURLS = {};
  for (const user in db) {
    if (db[user].userID === id) {
      userURLS[user] = db[user];
    }
  }
  return userURLS
};

module.exports = { fetchUserByEmail, fetchUserByID, generateRandomString, createUser, urlsForUsers };