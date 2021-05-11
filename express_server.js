const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080;
app.set("view engine", "ejs");

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }))


//---Database---//
//obj stands in for database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//---Helper Function---//
const generateRandomString = () => {
  const random = Math.random().toString(36).substring(6);
  return random;
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
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars)
});

//---Displays urls_new (Creation Page)---//
app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] }
  res.render("urls_new", templateVars);
});

//---Displays urls_show (Any shortURL)---//
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

//---shortURL to longURL---//
app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});

//---shortURL Creation---//
app.post("/urls", (req, res) => {
  //New URL
  const random = generateRandomString();
  urlDatabase[random] = req.body.longURL;
  res.redirect(`urls/${random}`);
});

//---URL Deletion---//
//deletes a url from the db - DELETE (POST)
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls')

});

//---URL Edit---//
//edits a longURL in the db - UPDATE (POST)
app.post("/urls/:shortURL/update", (req, res) => {
  //edit urlDatabase'
  console.log(req.body);
  urlDatabase[req.params.shortURL] = req.body.updateURL;
  res.redirect('/urls');
});

//---Login Route---//

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

//---Logout Route---//

app.post("/logout", (req, res) => {
  res.clearCookie("username")
  res.redirect("/urls")
})

//---Start Server---//
app.listen(PORT, () => {
  console.log(`Example app is listening on port ${PORT}`);
});

