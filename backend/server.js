```javascript
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();


// =====================================================
// CONFIGURAÇÕES
// =====================================================

app.use(express.json());

app.use(cors());


// =====================================================
// FRONTEND
// =====================================================

app.use(
    express.static(
        path.join(__dirname, "../frontend")
    )
);


// =====================================================
// BANCO DE DADOS
// =====================================================

const DB_FILE =
    path.join(__dirname, "db.json");


function readDB() {

    if (!fs.existsSync(DB_FILE)) {

        return {

            usuarios: [],
            pacientes: [],
            triagens: [],
            consultas: []

        };

    }


    return JSON.parse(
        fs.readFileSync(
            DB_FILE,
            "utf8"
        )
    );

}


function writeDB(data) {

    fs.writeFileSync(
        DB_FILE,
        JSON.stringify(
            data,
            null,
            2
        )
    );

}


// =====================================================
// PÁGINA INICIAL
// =====================================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "../frontend/index.html"
        )
    );

});


// =====================================================
// LOGIN
// =====================================================

app.post("/login", (req, res) => {

    console.log(
        "Dados recebidos:",
        req.body
    );


    const db = readDB();


    const usuario =
        req.body.usuario;

    const senha =
        req.body.senha;


    const user =
        db.usuarios.find(
            u =>
                u.usuario === usuario &&
                u.senha === senha
        );


    if (!user) {

        console.log(
            "Login recusado"
        );

        return res.status(401).json({

            erro:
                "Usuário ou senha inválidos"

        });

    }


    console.log(
        "Login aprovado:",
        user
    );


    res.json({

        sucesso: true,

        usuario: user.usuario,

        tipo: user.tipo

    });

});


// =====================================================
// ATENDIMENTO
// =====================================================

app.post("/atendimento", (req, res) => {

    const db = readDB();


    const paciente = {

        id: Date.now(),

        ...req.body,

        status: "triagem",

        createdAt:
            new Date().toISOString()

    };


    db.pacientes.push(
        paciente
    );


    writeDB(db);


    res.json(paciente);

});


// =====================================================
// TRIAGEM
// =====================================================

app.post("/triagem", (req, res) => {

    const db = readDB();


    let risco =
        req.body.risco;


    const temperatura =
        Number(
            req.body.temperatura
        );


    if (temperatura > 39) {

        risco = "vermelho";

    }


    if (
        temperatura < 38 &&
        risco !== "vermelho"
    ) {

        risco = "amarelo";

    }


    const triagem = {

        id: Date.now(),

        ...req.body,

        risco: risco,

        status:
            "aguardando_medico"

    };


    db.triagens.push(
        triagem
    );


    writeDB(db);


    res.json(triagem);

});


// =====================================================
// LISTAR TRIAGENS
// =====================================================

app.get("/triagens", (req, res) => {

    const db = readDB();

    res.json(
        db.triagens
    );

});


// =====================================================
// CONSULTA
// =====================================================

app.post("/consulta", (req, res) => {

    const db = readDB();


    const consulta = {

        id: Date.now(),

        ...req.body,

        createdAt:
            new Date().toISOString()

    };


    db.consultas.push(
        consulta
    );


    writeDB(db);


    res.json(consulta);

});


// =====================================================
// MEDICAÇÕES
// =====================================================

app.get("/medicacoes", (req, res) => {

    const db = readDB();

    res.json(
        db.consultas
    );

});


// =====================================================
// PORTA
// =====================================================

const PORT =
    process.env.PORT || 3000;


app.listen(
    PORT,
    () => {

        console.log(
            `Servidor rodando em http://localhost:${PORT}`
        );

    }
);


module.exports = app;
```
