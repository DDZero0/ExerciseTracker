const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI);
const Schema = mongoose.Schema;

let UserDataSchema = new Schema({
  username:String,
  userId:String,
  description:[String],
  duration:[Number],
  date:[Date]
})

let UserData = mongoose.model("UserData",UserDataSchema);
app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//Created Get Reqs
app.get('/api/exercise/users',(req,res)=>{
  UserData.find({},(err,users)=>{
    let userArr = [];
    for(let i = 0; i < users.length; i++){
      userArr.push({username:users[i].username,userid:users[i].userId})
    }
    res.send(userArr);
  })
})

app.get('/api/exercise/log',(req,res)=>{
  let userId = req.query.userId;
  let from = req.query.from;
  let to = req.query.to;
  let limit = req.query.limit;
  
  UserData.findOne({userId:userId},(err,data)=>{
    if(err) throw err;
    
    if (from && to){
    let startDate = new Date(from);
    let endDate = new Date(to);
    let limitedDateArr= [];
      for(let i = 0; i < limit; i ++){
        if(startDate < data.date[i] && data.date[i] < endDate){
          limitedDateArr.push(data.date[i]);
        }
      }
      let indexArr= [];
    for(let j = 0; j < limitedDateArr.length;j++){
      indexArr.push(data.date.indexOf(limitedDateArr[j]));
    }
    let limitedObj = {};
    limitedObj.description = [];
    limitedObj.duration = [];
    limitedObj.date = [];
    for (let l = 0; l < indexArr.length; l++){
      limitedObj.description.push(data.description[indexArr[l]]);
      limitedObj.duration.push(data.duration[indexArr[l]]);
      limitedObj.date.push(data.date[indexArr[l]]);
    }
     res.send(limitedObj) 
    }
    else{  
    res.send({"Exercise Info":data, "Exercise Count":data.description.length});
    }
  })
})

//Created Post Reqs
app.post('/api/exercise/new-user',(req,res,next)=>{
  let username = req.body.username;
  let userId = Math.floor(Math.random()*10000);
  UserData.find({userId:userId},(err,data)=>{
    if(err) throw err;
    if(data == null){
      return data;
    }
    else{
      userId = Math.floor(Math.random()*10000);
    }
  })
  let user = new UserData({
    username: username,
    userId:userId
  });
  user.save((err,user)=>{
    if(err) throw err;
    console.log(`User ${user.username} Added. Id is ${user.userId}`)
  })
  res.send(`User ${user.username} Added, Id:${user.userId}`);
  });

app.post('/api/exercise/add',(req,res)=>{
  let userId= req.body.userId;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date; 
  if(date == ''){
    date =  new Date().toISOString();
     }
  else{date= new Date(date).toISOString()}
  UserData.findOneAndUpdate({userId:userId},{$push: {description:description,duration:duration,date:date},returnNewDocument:true},(err,data)=>{
    if(err) throw err;
    console.log(data)
    if(data == null){
      res.send('User not Found')
      return;
    }
  let userData = new UserData({
    username: data.username,
    userId:data.userId,
    description:description,
    duration:duration,
    date:date
  });
    
  res.send(`The following data has been added about this exercise:<br>
          User Id:${userId}<br>
          Description:${description}<br>
          Duration:${duration}<br>
          Date:${date}`);
});
});
// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
