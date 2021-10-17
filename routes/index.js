//התחברות ל-firebase,firestore
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

//ייבוא של המודולים שהשתמשנו בהם
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const {
  validUser,
  validLogin,
  generateToken,
  decodeToken,
} = require("../validations/userValidation");
const { validHouse } = require("../validations/houseValidation");

// ראוטים של משתמשים 
// ראוט התחברות של משתמש למערכת
router.post("/login", async (req, res) => {
  var validData = validLogin(req.body);
  if (validData.error) {
    return res.status(400).json(validData.error.details);
  }
  try {
    var loginData = req.body;

    var password = loginData.password;
    var email = loginData.email;
    var user = await db.collection("users").where("email", "==", email).get();
    console.log(user);
    if (user._size == 0) {
      return res.status(400).json({ message: "User is not existed" });
    }

    if (email.trim() === "" || password.trim() === "") {
      throw new Error("Credentials must not be empty");
    } else {
      var validPass = await bcrypt.compare(
        password,
        user.docs[0]._fieldsProto.password.stringValue
      );
      if (!validPass) {
        return res.status(400).json({ message: "Password is inccorrect" });
      }
      var token = generateToken(user.docs[0]._fieldsProto.id.stringValue);
      res.json({ token: token });
    }
  } catch (err) {
    console.log(err);
  }
});

// ראוט הרשמה של משתמש למערכת
router.post("/register", async (req, res) => {
  var validData = validUser(req.body);
  if (validData.error) {
    return res.status(400).json(validData.error.details);
  }
  var registerData = req.body;
  var password = registerData.password;
  var firstName = registerData.first_name;
  var lastName = registerData.last_name;
  var phone = registerData.phone;
  var email = registerData.email;
  var city = registerData.city;
  var street = registerData.street;
  var house = registerData.house;
  var user = await db.collection("users").where("email", "==", email).get();
  console.log(user);
  if (user._size != 0) {
    return res.status(400).json({ message: "User is already existed" });
  }
  if (
    password.trim() === "" ||
    firstName.trim() === "" ||
    lastName.trim() === "" ||
    phone.trim() === "" ||
    email.trim() === ""||
    city.trim() === ""||
    street.trim() === ""
  ) {
    throw new Error("Credentials must not be empty");
  } else {
    const temp = Date.now() + Math.random() * 10000;
    var salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    const doc = db.collection("users").doc(`user ${temp}`);
    doc.set({
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      password: password,
      email: email,
      city: city,
      street: street,
      house: house,
      id: String(temp),
      job: "user",
      created: Date(),
    });
    console.log(doc);
    if (doc._path.segments[1] === `user ${temp}`) {
      return res.json({ add: 1 });
    }
    return res.json({ add: 0 });
  }
});

// ראוט שליפה של כל המשתמשים 
router.get("/", async (req, res) => {
  try {
    var usersRef = db.collection("users");
    var findEmail = (req.query.findEmail) ? (req.query.findEmail) : "";
    var findJob = (req.query.findJob) ? (req.query.findJob) : "";
    var findCity = (req.query.findCity) ?(req.query.findCity): "";
    var sortBy =(req.query.sortBy) ? (req.query.sortBy) : "created";
    var page = (req.query.page) ?(req.query.page) :0;
    var perPage = (req.query.perPage) ? (req.query.perPage) : 3;

    if(findEmail!=""){
      usersRef = usersRef.where("email", "==", findEmail);
    }
    if(findJob!=""){
      usersRef = usersRef.where("job", "==", findJob);
    }
    if(findCity!=""){
      usersRef = usersRef.where("city", "==", findCity);
    }
    var docs = await usersRef.orderBy(sortBy, "desc").get();
    var allDocs = await usersRef.startAt(docs.docs[perPage*page]).limit(perPage).get();
    var allData = [];
    allDocs.forEach((doc) => {
      allData = [
        ...allData,
        {
          created: doc._fieldsProto.created.stringValue,
          email: doc._fieldsProto.email.stringValue,
          first_name: doc._fieldsProto.first_name.stringValue,
          id: doc._fieldsProto.id.stringValue,
          job: doc._fieldsProto.job.stringValue,
          last_name: doc._fieldsProto.last_name.stringValue,
          password: doc._fieldsProto.password.stringValue,
          phone: doc._fieldsProto.phone.stringValue,
          city: doc._fieldsProto.city.stringValue,
          street: doc._fieldsProto.street.stringValue,
          house: doc._fieldsProto.house.integerValue
        },
      ];
    });
    res.json(allData);
  } catch (err) {
    console.log(err);
  }
});

// עריכת משתמש 
router.put("/:userId", async (req, res) => {
  var userId = req.params.userId;
  var user = await db.collection("users").where("id", "==", userId).get();
  if (
    decodeToken(req.header("token")) != userId &&
    user.docs[0]._fieldsProto.job != "admin"
  ) {
    return res.status(400).json({ message: "You can't continue" });
  }

  var validData = validUser(req.body);
  if (validData.error) {
    return res.status(400).json(validData.error.details);
  }
  try {
    if (user._size == 0) {
      return res.status(400).json({ message: "User has not found" });
    }
    var upUser = db.collection("users").doc(`user ${userId}`);
    var salt = await bcrypt.genSalt(10);

    var tempPassword = await bcrypt.hash(req.body.password, salt);
    upUser.set({
      first_name: req.body.first_name,
      last_name: req.body.lastName,
      phone: req.body.phone,
      email: req.body.email,
      password: tempPassword,
      id: userId,
      job: user.docs[0]._fieldsProto.job.stringValue,
      created: user.docs[0]._fieldsProto.created.stringValue,
    });
    console.log(upUser);
  } catch (err) {
    console.log(err);
  }
});

// מחיקת משתמש
router.delete("/:userId", async (req, res) => {
  var userId = req.params.userId;
  var user = await db.collection("users").where("id", "==", userId).get();
  if (user._size == 0) {
    return res.status(400).json({ message: "User is not existed" });
  }
  var adminId = decodeToken(req.header("token"));
  console.log(adminId);
  var admin = await db.collection("users").where("id", "==", adminId).get();
  if (admin._size == 0) {
    return res.status(400).json({ message: "Token is invalid" });
  }
  if (admin.docs[0]._fieldsProto.job.stringValue != "admin") {
    return res.status(400).json({ message: "You can't continue" });
  }
  try {
    var deleteUser = await db
      .collection("users")
      .doc(`user ${userId}`)
      .delete();
    console.log(deleteUser);
    var checkUser = await db
      .collection("users")
      .where("id", "==", userId)
      .get();
    if (checkUser._size == 0) {
      return res.json({ del: 1 });
    }

    res.json({ del: 0 });
  } catch (err) {
    console.log(err);
  }
});

// שליפה של כל הבתים הקיימים 
router.get("/houses", async (req, res) => {
  try {
    var docs = db.collection("houses");
    var city = req.query.findLocation ? req.query.findLocation : "";
    var minPeople = req.query.minPeople ? Number(req.query.minPeople) : -1;
    var maxPeople = req.query.maxPeople ? Number(req.query.maxPeople) : -1;

    if (city != "") {
      docs = docs.where("location", "==", city);
    }
    if (minPeople != -1) {
      console.log(minPeople);
      docs = docs.where("count", ">=", minPeople);
    }
    if (maxPeople != -1) {
      docs = docs.where("count", "<=", maxPeople);
    }

    var allDocs = await docs.get();
    var data = [];
    allDocs.forEach((doc) => {
      data = [
        ...data,
        {
          location: doc._fieldsProto.location.stringValue,
          count: doc._fieldsProto.count.integerValue,
          user_id: doc._fieldsProto.user_id.stringValue,
          id: doc._fieldsProto.id.stringValue,
          created: doc._fieldsProto.created.stringValue,
        },
      ];
    });
    res.json(data);
  } catch (err) {
    console.log(err);
  }
});

// הוספת בית למערכת
router.post("/houses", async (req, res) => {
  var userId = decodeToken(req.header("token"));
  console.log(userId);
  var user = await db.collection("users").where("id", "==", userId).get();
  console.log(user);
  if (user._size == 0) {
    return res.status(400).json({ message: "User is not existed" });
  }
  var validData = validHouse(req.body);
  if (validData.error) {
    return res.status(400).json(validData.error.details);
  }

  try {
    var temp = Date.now() + Math.ceil(Math.random() * 10000);
    var house = db.collection("houses").doc(`house ` + temp);
    house.set({
      count: req.body.count,
      location: req.body.location,
      created: Date(),
      user_id: userId,
      id: String(temp),
    });
    console.log(house);
    if (house._path.segments[1] == `house ` + temp) {
      return res.json({ add: 1 });
    }
    res.json({ add: 0 });
  } catch (err) {
    console.log(err);
  }
});

// עריכת בית קיים
router.put("/houses/:houseId", async (req, res) => {
  var houseId = req.params.houseId;
  var house = await db.collection("houses").where("id", "==", houseId).get();
  if (house._size == 0) {
    return res.status(400).json({ message: "House is not existed" });
  }
  var userId = decodeToken(req.header("token"));
  var user = await db.collection("users").where("id", "==", userId).get();
  if (user._size == 0) {
    return res.status(400).json({ message: "User is not existed" });
  }
  if (
    house.docs[0]._fieldsProto.user_id.stringValue != userId &&
    user.docs[0]._fieldsProto.job.stringValue != "admin"
  ) {
    return res.status(400).json({ message: "You can't continue" });
  }
  var validData = validHouse(req.body);
  if (validData.error) {
    return res.status(400).json(validData.error.details);
  }
  try {
    var updateHouse = db.collection("houses").doc(`house ` + houseId);
    updateHouse.set({
      count: req.body.count,
      location: req.body.location,
      id: houseId,
      created: Date(),
      user_id: userId,
    });
    if (updateHouse._path.segments[1] == `house ` + houseId) {
      return res.json({ update: 1 });
    }
    res.json({ update: 0 });
  } catch (err) {
    console.log(err);
  }
});

// מחיקה של בית
router.delete("/houses/:houseId", async (req, res) => {
  var userId = decodeToken(req.header("token"));
  var user = await db.collection("users").where("id", "==", userId).get();
  if (user._size == 0) {
    return res.status(400).json({ message: "User is not exised" });
  }
  var houseId = req.params.houseId;
  var house = await db.collection("houses").where("id", "==", houseId).get();
  if (house._size == 0) {
    return res.status(400).json({ message: "House is not existed" });
  }

  if (
    house.docs[0]._fieldsProto.user_id.stringValue != userId &&
    user.docs[0]._fieldsProto.job.stringValue != "admin"
  ) {
    return res.status(400).json({ message: " You can't continue" });
  }

  try {
    var deleteHouse = await db
      .collection("houses")
      .doc(`house ${houseId}`)
      .delete();
    console.log(deleteHouse);
    var checkHouse = await db
      .collection("houses")
      .where("id", "==", houseId)
      .get();
    if (checkHouse._size == 0) {
      return res.json({ delete: 1 });
    }
    return res.json({ delete: 0 });
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
