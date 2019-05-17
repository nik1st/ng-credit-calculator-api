const express = require("express");
const app = express();
var pgp = require("pg-promise")(/*options*/);


const conf ={
  host: 'ec2-79-125-6-250.eu-west-1.compute.amazonaws.com',
  port: 5432,
  database: 'd529f9lncuvs',
  user: 'qjgxbqfmglsrxq',
  password: '64556888de2185c20b230e82ed5fd0935a8378e48838a5940697951d8820a440',
  ssl: true
};



const db = pgp(conf);

app.use(express.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  next();
});

app.get('/api/banks', function (req, res) {
    db.any("SELECT \"ID_Bank\", \"Bank Name\" FROM \"Bank\" ORDER BY \"ID_Bank\"").then(function(data){
      res.set('Content-Type', 'application/json');
      let bankMas = [];
      for(let i = 0; i < data.length; i++){
        bankMas.push({bankId: data[i].ID_Bank, bankName: data[i]['Bank Name']});
      }
      res.send(JSON.stringify(bankMas));
    })
  });

app.get('/api/credits', function(req, res){
    db.any("SELECT \"ID_Credit\", \"ID_Bank\", \"Amount\", \"Payment Period\", \"Percent\", \"Date_Starting\""
    + "FROM \"Credit\" WHERE \"ID_User\" = $1 ORDER BY \"Date_Starting\"" , req.query.id).then(function(data){
      res.set('Content-Type', 'application/json');
      let creditMas = [];
      for(let i = 0; i < data.length; i++){
        creditMas.push({idCredit: data[i].ID_Credit, idBank: data[i].ID_Bank, amount: data[i].Amount, paymentPeriod: data[i]['Payment Period'], percent: data[i].Percent, dateStarting: data[i].Date_Starting, id: i+1});
      }
      res.send(JSON.stringify(creditMas));
    })
  });

app.get('/api/credit', function(req,res){
  db.any("SELECT \"ID_Bank\", \"Amount\", \"Payment Period\", \"Percent\", \"Date_Starting\""
    + "FROM \"Credit\" WHERE \"ID_Credit\" = $1", req.query.id).then(function(data){
      res.set('Content-Type', 'application/json');
      let creditMas = {}; 
      creditMas = {idBank: data[0].ID_Bank, amount: data[0].Amount, paymentPeriod: data[0]['Payment Period'], percent: data[0].Percent, dateStarting: data[0].Date_Starting};
      res.send(JSON.stringify(creditMas));
    })
});


app.get('/api/credit/payments', function(req, res){
  db.any("SELECT \"Num_Payment\", \"Amount_Pay\", \"Main Debt\", \"Amount Percent\", \"Rest_Credit\", \"Date_Pay\""
  + "FROM \"Payment Shedule\" WHERE \"ID_Credit\" = $1 ORDER BY \"Num_Payment\"", req.query.id).then(function(data){
    res.set('Content-Type', 'application/json');
    let paymentMas = []
    for(let i = 0; i < data.length; i++){
      paymentMas.push({numOfPay: data[i].Num_Payment, pay: data[i].Amount_Pay, mainDebt: data[i]['Main Debt'], amountOfPercent: data[i]['Amount Percent'], debtOfCredit: data[i].Rest_Credit, dateOfPay: data[i].Date_Pay })
    }
    res.send(JSON.stringify(paymentMas));
  })
});

//get для экономий по кредиту
app.get('/api/credit/payment', function(req, res){
db.any("SELECT DISTINCT \"Credit\".\"ID_Credit\", \"Amount\", \"Percent\", \"Amount_Pay\", \"Date_Starting\", \"Payment Period\"" +
    "FROM \"Payment Shedule\" INNER JOIN \"Credit\" ON \"Credit\".\"ID_Credit\" = \"Payment Shedule\".\"ID_Credit\"" +
    "WHERE \"Credit\".\"ID_User\" = $1 ORDER BY \"Date_Starting\"", req.query.id).then(data => {
    res.set('Content-Type', 'application/json');
    let creditMas = []; 
    for(let i = 0; i < data.length; i++){
      creditMas.push({idCredit: data[i].ID_Credit, amount: data[i].Amount, percent: data[i].Percent, pay: data[i].Amount_Pay, dateStarting: data[i].Date_Starting, period: data[i]["Payment Period"], id: i+1});
    }
    res.send(JSON.stringify(creditMas));
  })
});

app.put('/api/credit', function(req, res){
  db.any("INSERT INTO \"Credit\"(\"ID_Bank\", \"Amount\", \"Payment Period\", \"Percent\", \"Date_Starting\", \"ID_User\")"
         + "VALUES ($(id_bank), $(amount), $(period), $(percent), $(date), $(id_user)) RETURNING \"ID_Credit\"", req.body).then(function(data){
    if(data.length == 0){
    res.send({status: 0, message: 'ERROR!'});
    } else{
      var id = data[0].ID_Credit;
      if(req.body.payments.length == 0){
        res.send('error');
      }
      var inserts = [];
      for(var i = 0; i < req.body.payments.length; i++){
        inserts.push(db.any("INSERT INTO \"Payment Shedule\"(\"ID_Credit\", \"Num_Payment\", \"Amount_Pay\", \"Main Debt\", \"Amount Percent\", \"Rest_Credit\", \"Date_Pay\")"
        + "VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING \"ID_Shedule\"",
        [id, req.body.payments[i].numOfPay, req.body.payments[i].pay, req.body.payments[i].mainDebt, req.body.payments[i].amountOfPercent, req.body.payments[i].debtOfCredit, req.body.payments[i].dateOfPay]));
      }
      var hasInsertErrors = false;
      Promise.all(inserts).then((data)=>{
        res.send({status: 1, message: 'Success!'});
      }).catch((err) => {
        if(hasInsertErrors == false) {
          res.send({status: 0, message: err});
        }
        hasInsertErrors = true;
      });
    }

  })
});

app.post('/api/credit', function(req, res){
  db.any("UPDATE \"Credit\""
  + "SET \"ID_Bank\" = $(id_bank), \"Amount\" = $(amount), \"Payment Period\" = $(period), \"Percent\" = $(percent), \"Date_Starting\" = $(date)"
  + "WHERE \"ID_Credit\" = $(id_credit) RETURNING \"ID_Credit\"", req.body).then((data)=>{
      db.result("DELETE FROM \"Payment Shedule\" WHERE \"ID_Credit\" = $1 RETURNING \"ID_Credit\"", data[0].ID_Credit).then(()=>{
         var id = data[0].ID_Credit;
         inserts = [];
         for(var i = 0; i < req.body.payments.length; i++){
          inserts.push(db.any("INSERT INTO \"Payment Shedule\"(\"ID_Credit\", \"Num_Payment\", \"Amount_Pay\", \"Main Debt\", \"Amount Percent\", \"Rest_Credit\", \"Date_Pay\")"
          + "VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [id, req.body.payments[i].numOfPay, req.body.payments[i].pay, req.body.payments[i].mainDebt, req.body.payments[i].amountOfPercent, req.body.payments[i].debtOfCredit, req.body.payments[i].dateOfPay]));
            }
          var hasInsertErrors = false;
          Promise.all(inserts).then((data)=>{
          res.send({status: 1, message: 'Success!'});
      }).catch((err) => {
        if(hasInsertErrors == false) {
          res.send({status: 0, message: err});
        }
        hasInsertErrors = true;
      });
      }).catch((err)=>{
    res.send({status: 0, message: err.message});
  })
 })
})


app.delete('/api/credit', function(req, res){
  db.result("DELETE FROM \"Credit\" WHERE \"ID_Credit\" = $1", req.query.id).then(function(data){
    if(data.rowCount == 0){
    res.send({status: 0, message:'Such ID does not exist!'});
    } else{
    res.send({status: 1, message: 'Success!'});
    }
  })
});


app.post('/api/user', function(req, res){
  db.result("SELECT \"ID_User\", \"Login\" FROM \"User\" WHERE \"Login\" = $(login) AND \"Password\" = $(password)", req.body).then(function(data){
    res.set('Content-Type', 'application/json');
    let user = {};
    if(data.rowCount !== 0){
      user = {status:1, id: data.rows[0].ID_User, login: data.rows[0].Login};
      res.send(JSON.stringify(user));
    } else{
      res.send({status: 0, message: 'Such user does not exist!'});
    }
  })
});


app.put('/api/user', function(req, res){
  db.result("INSERT INTO \"User\"(\"Login\", \"Password\")"
  + "VALUES ($(login), $(password)) RETURNING \"ID_User\", \"Login\"", req.body).then(function(data){
      let newUser = {status: 1, id: data.rows[0].ID_User, login: data.rows[0].Login}
      res.send(JSON.stringify(newUser));
  }).catch((err)=>{
    res.send({status: 0, message: 'Such user already exist!'});
  })
});

app.get('/', function(req, res) {
  res.send("Server is running on " + process.env.PORT);
});

app.listen(process.env.PORT || 3000, function () {
 console.log('Node js server is running!');
});