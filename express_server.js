const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const { response } = require('express');
const bcrypt = require('bcrypt');
const { fetchUserByEmail, fetchUserByID, generateRandomString, createUser, urlsForUsers } = require('./helpers');

const app = express();
const PORT = 8080;
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))


//---Databases---//
//obj stands in for database
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "aJ48lW" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "aJ48lW" }
};

const userDatabase = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "marky"
  }
};

//---Helper Function---//










//=======R O U T E S=======//

app.get("/", (req, res) => {
  res.send("Hello");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n")
});

//---Displays urls_index (Main Page)---//
app.get("/urls", (req, res) => {
  if (req.session.user_id) {
    const currentUser = fetchUserByID(req.session.user_id, userDatabase)
    console.log(currentUser)
    const templateVars = { urls: urlsForUsers(req.session.user_id, urlDatabase), user: currentUser };
    res.render("urls_index", templateVars)
  } else {
    res.redirect("/login")
  }
});

//---Displays urls_new (Creation Page)---//
app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const templateVars = { user: fetchUserByID(req.session.user_id, userDatabase) }
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login")
  }
});

//---Displays urls_show (Any shortURL)---//
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: fetchUserByID(req.session.user_id, userDatabase) };

  res.render("urls_show", templateVars);
});

//---shortURL to longURL---//
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//---shortURL Creation---//
app.post("/urls", (req, res) => {
  //New URL
  const random = generateRandomString();
  urlDatabase[random] = { longURL: req.body.longURL, userID: req.session.user_id }
  res.redirect(`urls/${random}`);
});

//---URL Deletion---//
//deletes a url from the db - DELETE (POST)
app.post("/urls/:shortURL/delete", (req, res) => {
  const currentUser = fetchUserByID(req.session.user_id, userDatabase)
  if (!currentUser) {
    res.status(403).send("Not Your Account GTFO!")
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls')
  }
});

//---URL Edit---//
//edits a longURL in the db - UPDATE (POST)
app.post("/urls/:shortURL/update", (req, res) => {
  //edit urlDatabase'
  const currentUser = fetchUserByID(req.session.user_id, userDatabase)
  if (!currentUser) {
    res.status(403).send("Not Your Account STFO")
  } else {
    console.log(req.body);
    urlDatabase[req.params.shortURL].longURL = req.body.updateURL;
    res.redirect('/urls');
  }

});

//---Login Route---//

app.post("/login", (req, res) => {
  const logEmail = req.body.email;
  const logPass = req.body.password;

  if (fetchUserByEmail(logEmail, userDatabase)) {
    let currentUser = fetchUserByEmail(logEmail, userDatabase);
    if (bcrypt.compareSync(logPass, userDatabase[currentUser].password)) {
      req.session.user_id = userDatabase[currentUser].id;
      res.redirect("/urls");
    } else {
      res.status(403).send("Invalid Password") //add html
    }
  } else {
    res.status(403).send("Invalid Email") //add html
  }
});

app.get("/login", (req, res) => {
  const templateVars = { user: fetchUserByID(req.session.user_id, userDatabase) }
  res.render("login", templateVars);
});

//---Logout Route---//

app.post("/logout", (req, res) => {
  req.session = null;
  // res.clearCookie("user_id")
  res.redirect("/urls")
});

//---Register Routes---//
//displays register (Registration Page)
app.get("/register", (req, res) => {
  const templateVars = { user: fetchUserByID(req.session.user_id, userDatabase) }
  res.render("register", templateVars)
});

//registers new user
app.post("/register", (req, res) => {
  let id = generateRandomString();
  const newUser = createUser(req.body, userDatabase, id);
  if (newUser.error === "email") {
    res.status(400).send("Invalid Email")
  } else if (newUser.error === "password") {
    res.status(400).send("Invalid Password")
  } else {
    console.log(userDatabase)
    req.session.user_id = userDatabase[id].id
    res.redirect("/urls")
  }
});

//---Start Server---//
app.listen(PORT, () => {
  console.log(`Example app is listening on port ${PORT}`);
});

