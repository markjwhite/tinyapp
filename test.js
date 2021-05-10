const generateRandomString = () => {
  const random = Math.random().toString(36).substring(6);
  return random;
}

console.log(generateRandomString())