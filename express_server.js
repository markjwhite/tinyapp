const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const { response } = require('express');
const bcrypt = require('bcrypt');
const { generateRandomString, createUser, urlsForUsers, authenticateUser } = require('./helpers');

const app = express();
const PORT = 8080;
app.set("view engine", "ejs");

//---Middleware---//
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

//gets user id from cookie, finds it in userDatabase
//and assigns it to req.currentUser
//from DominicTremblay's https://github.com/DominicTremblay/w3d4-lecture/blob/demo-east-apr26-2021/server.js
const userParser = (req, res, next) => {
  const userID = req.session.user_id;
  const user = userDatabase[userID];

  req.currentUser = user;
  next();
};
app.use(userParser);

//---Databases---//
//obj stands in for database
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "aJ48lW" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "aJ48lW" }
};

const userDatabase = {
  "instructorTest": {
    id: "instructorTest",
    email: "user@example.com",
    password: bcrypt.hashSync("passthisassignment", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("2", 10)
  }
};

//---Status Code HTML---//
const code400Email = '<html><meta http-equiv=refresh content=5;URL=/register /><body><h1>Error 400: Bad Request: Invalid Email. If you are not redirected in 5 seconds <a href=/register>click here</a>.</h1></body></html>'

const code400Pass = '<html><meta http-equiv=refresh content=5;URL=/register /><body><h1>Error 400: Bad Request: Invalid Password. If you are not redirected in 5 seconds <a href=/register>click here</a>.</h1></body></html>'

const code401 = '<html><meta http-equiv=refresh content=5;URL=/login /><body><h1>Error 401 Unauthorized: You must be logged in to access this page. If you are not redirected in 5 seconds <a href=/login>click here</a>.</h1></body></html>'

const code401Cred = '<html><meta http-equiv=refresh content=5;URL=/login /><body><h1>Error 401 Unauthorized: Invalid Credentials. If you are not redirected in 5 seconds <a href=/login>click here</a>.</h1></body></html>'

const code403 = '<html><meta http-equiv=refresh content=5;URL=/urls /><body><h1>Error 403 Forbidden: You Do Not Have Access To This Page. If you are not redirected in 5 seconds <a href=/urls>click here</a>.</h1></body></html>'

const code404 = '<html><meta http-equiv=refresh content=5;URL=/urls /><body><h1>Error 404 Not Found: The Page You Requested Cannot Be Found. If you are not redirected in 5 seconds <a href=/urls>click here</a>.</h1></body></html>'

//=======R O U T E S=======//

app.get("/", (req, res) => {
  if (req.currentUser) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//---Displays urls_index (Main Page)---//
app.get("/urls", (req, res) => {
  if (req.currentUser) {
    const templateVars = { urls: urlsForUsers(req.currentUser.id, urlDatabase), user: req.currentUser };
    res.render("urls_index", templateVars);
  } else {
    res.status(401).send(code401);
  }
});

//---Displays urls_new (Creation Page)---//
app.get("/urls/new", (req, res) => {
  if (req.currentUser) {
    const templateVars = { user: req.currentUser };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

//---Displays urls_show (Any shortURL)---//
app.get("/urls/:shortURL", (req, res) => {
  if (req.currentUser) {
    if (!urlDatabase[req.params.shortURL]) {
      res.status(404).send(code404);
      //checks if user matches url owner id
    } else if (urlDatabase[req.params.shortURL].userID === req.currentUser.id) {
      const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: req.currentUser };
      res.render("urls_show", templateVars);
    } else {
      res.status(403).send(code403);
    }
  }
});

//---shortURL to longURL---//
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send(code404);
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});

//---shortURL Creation---//
app.post("/urls", (req, res) => {
  //New URL
  if (!req.currentUser) {
    res.status(401).send(code401);
  } else {
    const random = generateRandomString();
    urlDatabase[random] = { longURL: req.body.longURL, userID: req.currentUser.id };
    res.redirect(`urls/${random}`);
  }
});

//---URL Deletion---//
//deletes a url from the db - DELETE (POST)
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.currentUser && urlDatabase[req.params.shortURL].userID === req.currentUser.id) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else if (req.currentUser && !urlDatabase[req.params.shortURL].userID === req.currentUser.id) {
    res.status(403).send(code403);
  } else {
    res.status(401).send(code401);
  }
});

//---URL Edit---//
//edits a longURL in the db - UPDATE (POST)
app.post("/urls/:shortURL/update", (req, res) => {
  if (req.currentUser && urlDatabase[req.params.shortURL].userID === req.currentUser.id) {
    urlDatabase[req.params.shortURL].longURL = req.body.updateURL;
    res.redirect('/urls');
  } else if (req.currentUser && !urlDatabase[req.params.shortURL].userID === req.currentUser.id) {
    res.status(403).send(code403);
  } else {
    res.status(401).send(code401);
  }
});

//---Login Routes---//
//authenticate user && login
app.post("/login", (req, res) => {
  const logEmail = req.body.email;
  const logPass = req.body.password;
  const currentUser = authenticateUser(logEmail, logPass, userDatabase);

  if (currentUser) {
    req.session.user_id = currentUser.id;
    res.redirect("/urls");
  } else {
    res.status(401).send(code401Cred);
  }
});
//displays login page
app.get("/login", (req, res) => {
  if (req.currentUser) {
    res.redirect('/urls');
  } else {
    const templateVars = { user: req.currentUser };
    res.render("login", templateVars);
  }
});

//---Logout Route---//
//deletes encrypted cookies
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//---Register Routes---//
//displays register (Registration Page)
app.get("/register", (req, res) => {
  if (req.currentUser) {
    res.redirect('/urls');
  } else {
    const templateVars = { user: req.currentUser };
    res.render("register", templateVars);
  }
});
//registers new user and adds it to userDatabase - CREATE (POST)
app.post("/register", (req, res) => {
  let randomID = generateRandomString();
  const newUser = createUser(req.body, userDatabase, randomID);
  if (newUser.error === "email") {
    res.status(400).send(code400Email);
  } else if (newUser.error === "password") {
    res.status(400).send(code400Pass);
  } else {
    req.session.user_id = userDatabase[randomID].id;
    res.redirect("/urls");
  }
});

//---Start Server---//
app.listen(PORT, () => {
  console.log(`Example app is listening on port ${PORT}`);
});

