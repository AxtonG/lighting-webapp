// hash.js
const bcrypt = require("bcrypt");

bcrypt.hash("sixseven", 10, (err, hash) => {
  if (err) throw err;
  console.log(hash); // copy this value
});
