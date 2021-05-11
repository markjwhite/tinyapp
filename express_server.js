const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }))
app.set("view engine", "ejs");


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n")
});

//displays urls index page
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars)
});

//displays urls_new page to create new url
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

//redirects from short url link to original long url site
app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});

//creates new short url and stores both long and short url in urlDatabase
app.post("/urls", (req, res) => {
  const random = generateRandomString();
  urlDatabase[random] = req.body.longURL;
  res.redirect(`urls/${random}`);
});

//deletes a url from the db - DELETE (POST)
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls')

});

//edits a longURL in the db - UPDATE (POST)
app.post("/urls/:shortURL/update", (req, res) => {
  //edit urlDatabase'
  console.log(req.body);
  urlDatabase[req.params.shortURL] = req.body.updateURL;
  res.redirect('/urls');
});


//starts sever on specified port
app.listen(PORT, () => {
  console.log(`Example app is listening on port ${PORT}`);
});

const generateRandomString = () => {
  const random = Math.random().toString(36).substring(6);
  return random;
};