const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { response } = require('express');

const app = express();
const PORT = 8080;
app.set("view engine", "ejs");

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }))


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
const generateRandomString = () => {
  const random = Math.random().toString(36).substring(6);
  return random;
};

const fetchUser = (email) => {
  for (const user in userDatabase) {
    if (userDatabase[user].email === email) {
      return user;
    }
  }
  return null;
}

const fetchUserbyID = (userID) => {
  for (const user_id in userDatabase) {
    if (userID === user_id) {
      const user = userDatabase[user_id]
      return user;
    }
  }
  return undefined;
}

const createUser = (userParams, db, id) => {
  console.log(userParams);
  if (fetchUser(userParams.email, userDatabase)) {
    return { error: "email" }
  }
  const { email, password } = userParams;

  if (!email || !password) {
    return { error: "password" }
  }
  db[id] = { id, email, password }
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
  if (req.cookies["user_id"]) {
    const currentUser = fetchUserbyID(req.cookies["user_id"])
    console.log(currentUser)
    const templateVars = { urls: urlsForUsers(req.cookies["user_id"], urlDatabase), user: currentUser };
    res.render("urls_index", templateVars)
  } else {
    res.redirect("/login")
  }
});

//---Displays urls_new (Creation Page)---//
app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
    const templateVars = { user: fetchUserbyID(req.cookies["user_id"]) }
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login")
  }
});

//---Displays urls_show (Any shortURL)---//
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: fetchUserbyID(req.cookies["user_id"]) };

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
  urlDatabase[random] = { longURL: req.body.longURL, userID: req.cookies["user_id"] }
  res.redirect(`urls/${random}`);
});

//---URL Deletion---//
//deletes a url from the db - DELETE (POST)
app.post("/urls/:shortURL/delete", (req, res) => {
  const currentUser = fetchUserbyID(req.cookies["user_id"])
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
  const currentUser = fetchUserbyID(req.cookies["user_id"])
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

  if (fetchUser(logEmail, userDatabase)) {
    let currentUser = fetchUser(logEmail, userDatabase);
    if (logPass === userDatabase[currentUser].password) {
      res.cookie("user_id", userDatabase[currentUser].id);
      res.redirect("/urls");
    } else {
      res.status(403).send("Invalid Password")
    }
  } else {
    res.status(403).send("Invalid Email")
  }
});

app.get("/login", (req, res) => {
  const templateVars = { user: fetchUserbyID(req.cookies["user_id"]) }
  res.render("login", templateVars);
});

//---Logout Route---//

app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
  res.redirect("/urls")
});

//---Register Routes---//
//displays register (Registration Page)
app.get("/register", (req, res) => {
  const templateVars = { user: fetchUserbyID(req.cookies["user_id"]) }
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
    res.cookie("user_id", userDatabase[id].id)
    res.redirect("/urls")
  }
});

//---Start Server---//
app.listen(PORT, () => {
  console.log(`Example app is listening on port ${PORT}`);
});

