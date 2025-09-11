// hash.js
const bcrypt = require("bcrypt");
const password_1 = "Gigem2026"; // user password
const password_2 = "sixseven"; 

bcrypt.hash(password_1, 10, (err, hash) => {
  if (err) throw err;
  console.log("Hashed password: ", hash); // copy this value
});
