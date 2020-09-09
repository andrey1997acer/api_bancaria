const express = require('express')
const bd = require('./src/bd/bd.js');
const axios = require('axios');
const cors = require('cors')


const app = express()
app.use(express.json())
app.use(cors())
 
app.get('/api/', function (req, res) {
  res.send('Hola mundo')
})

async function getUsers(){
    try {
        const users = await axios.get('https://jsonplaceholder.typicode.com/users')
        return users;
    } catch (error) {
        return error;
    }
}

app.get('/api/user', async (req, res)=>{
    res.status(200).send(bd);
})

app.get('/api/user/:id',async (req, res)=>{
    const id = req.params.id;
    await bd.forEach(user=>{
        if(user.id === id){
            res.status(200).send(user);
        }
    })
    res.status(200).send({});
})

app.post('/api/login', (request, response)=>{
   const email = request.body.email;
   const pass = request.body.password;

    bd.forEach((user)=>{
       if(user.email === email && user.password === pass){
        response.status(200).send({
            status:true,
            token: user.token
        })
       }else{
        response.status(200).send({
            status:false,
            login: "Email and/or password incorrect"
        })
       }
   })
})

app.post('/api/trasaction', (req, res)=>{

    res.send('Desde la transaccion')
})



 
app.listen(4000, (res, err)=>{
    if(err){
        console.log('No se pudo iniciar el servidor');
    }else{
        console.log('El servidor esta corriendo el puerto 4000');
    }
})