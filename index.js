const express = require("express");
const bd = require("./src/bd/bd.js");
const axios = require("axios");
const cors = require("cors");
const crypto = require("crypto-js");

const app = express();
app.use(express.json());
app.use(cors());

app.get("/api/", function (req, res) {
  res.send("Hola mundo");
});

function getComprobante(length) {
  var caracteres = "abcdefghijkmnpqrtuvwxyzABCDEFGHJKMNPQRTUVWXYZ2346789";
  var contrasenna = "";
  var i = 0;
  for (i = 0; i < length; i++)
    contrasenna += caracteres.charAt(
      Math.floor(Math.random() * caracteres.length)
    );
  return contrasenna;
}

async function getUsers() {
  try {
    const users = await axios.get("https://jsonplaceholder.typicode.com/users");
    return users;
  } catch (error) {
    return error;
  }
}

app.get("/api/user", async (req, res) => {
  res.status(200).send(bd.user);
});

app.get("/api/transaction", async (req, res) => {
    res.status(200).send(bd.transaction);
  });

app.get("/api/date", (req, res) => {
  var fecha = Date.now();

  res.status(200).send({
    status: true,
    fecha,
  });
});

app.get("/api/user/:id", async (req, res) => {
  const id = req.params.id;
  await bd.user.forEach((user) => {
    if (user.id === id) {
      res.status(200).send(user);
    }
  });
  res.status(200).send({});
});

app.post("/api/pay", (request, response) => {
  const tipo = request.body.tipo;
  const numero = request.body.numero;
  const fecha = request.body.fecha;
  const csv = request.body.csv;
  const nombre = request.body.nombre;

  const isCard = bd.creditcard.filter(
    (card) => card.name === nombre && card.csv === csv && card.date === fecha && card.number === numero && card.type === tipo
  );

  if(isCard[0]){
    response.status(200).send({
      status:true,
      descripcion:"La transaccion se realizo satisfactoriamente"    
    })
    console.log("Si es la targeta aprobada")
  }else{
    response.status(200).send({
      status:false,
      descripcion:"La transaccion no se realizo"
    })

    console.log("Si es la targeta Denegada")
  }
 


  console.log(nombre)

});

app.post("/api/login", (request, response) => {
  const email = request.body.email;
  const pass = request.body.password;

  const isUser = bd.user.filter(
    (user) => user.email === email && user.password === pass
  );
  if (isUser) {
    response.status(200).send({
      status: true,
      token: isUser[0].token,
    });
  } else {
    response.status(403).send({
      status: false,
      message: "Email or password incorrect",
    });
  }
});

app.post("/api/trasaction", async (req, res) => {
  const token = req.body.token;
  const x_fp_sequence = req.body.x_fp_sequence;
  const x_fp_timestamp = req.body.x_fp_timestamp;
  const x_amount = req.body.x_amount;
  const fingerprint = req.body.fingerprint;

  const user = bd.user.filter((user) => user.token == token);

  if (user[0]) {
    const cadena =
      token + "^" + x_fp_sequence + "^" + x_fp_timestamp + "^" + x_amount + "^";
    const hmac = crypto.HmacMD5(cadena, "transactionKey");
    if (fingerprint.toString() === hmac.toString()) {
      const data = {
        x_response_code: {
          1: "Aprobado",
          2: "Denegado",
          3: "Error",
          4: "Retener para revisión",
        },
        x_response_reason_code: 1,
        x_response_reason_text:
          "Transacción aprobada, fingerprint generado con exito",
        x_auth_code: getComprobante(6),
        x_trans_id: getComprobante(8),
        x_invoice_num: x_fp_sequence,
        x_amount: x_amount,
        x_type: "AUTH_CAPTURE",
        x_MD5_hash: hmac.toString(),
        x_date: Date.now(),
        x_login: token,
      };
      const save =  bd.transaction = [...bd.transaction, data];
      if (save) {
        res.status(200).send(data);
      }
    } else {
      res.status(200).send({
        x_response_code: 2,
      });
    }
  } else {
    res.status(403).send({
      x_response_code: 3,
      fingerprint: hmac.toString(),
    });
  }
});

app.put('/api/transaction-cancel/:x_trans_id',(req, res)=>{
    const {x_trans_id} = req.params;
    console.log(x_trans_id);
    console.log(req.body.status);
    const updated = bd.transaction.map((transaction)=>{
        if(transaction.x_trans_id === x_trans_id){
            return {...transaction, x_response_reason_code:req.body.status,
                x_response_reason_text:'Error, el usuario cancelo la transacción'}
            
        }
        return transaction;
    });

    const updatedata =updated.filter((transaction)=>transaction.x_trans_id = x_trans_id)
    

    if(updated){
        bd.transaction = updated
        res.send(updatedata[0])
    }else{
        res.status(500).send({
            status:false,
            message:'update error'
        })
    }

})

app.listen(4000, (res, err) => {
  if (err) {
    console.log("No se pudo iniciar el servidor");
  } else {
    console.log("El servidor esta corriendo el puerto 4000");
  }
});
