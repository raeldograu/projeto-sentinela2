
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

const FRONTEND_PATH =
    path.join(__dirname, "../frontend");


app.use(
    express.static(FRONTEND_PATH)
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
            consultas: [],
            altas: []

        };

    }


    const db =
        JSON.parse(
            fs.readFileSync(
                DB_FILE,
                "utf8"
            )
        );


    // Garante que todas as listas existam

    db.usuarios =
        db.usuarios || [];

    db.pacientes =
        db.pacientes || [];

    db.triagens =
        db.triagens || [];

    db.consultas =
        db.consultas || [];

    db.altas =
        db.altas || [];


    return db;

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
            FRONTEND_PATH,
            "index.html"
        )
    );

});


// =====================================================
// LOGIN
// =====================================================

app.post("/login", (req, res) => {

    console.log(
        "Tentativa de login:",
        req.body.usuario
    );


    const db = readDB();


    const usuario =
        String(
            req.body.usuario || ""
        ).trim();


    const senha =
        String(
            req.body.senha || ""
        ).trim();


    const user =
        db.usuarios.find(
            u =>
                String(u.usuario).trim() === usuario &&
                String(u.senha).trim() === senha
        );


    if (!user) {

        console.log(
            "Login inválido:",
            usuario
        );


        return res.status(401).json({

            sucesso: false,

            erro:
                "Usuário ou senha inválidos."

        });

    }


    console.log(
        "Login aprovado:",
        user.usuario,
        user.tipo
    );


    res.status(200).json({

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


    res.status(201).json(
        paciente
    );

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

    else if (
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
            "aguardando_medico",

        createdAt:
            new Date().toISOString()

    };


    db.triagens.push(
        triagem
    );


    writeDB(db);


    res.status(201).json(
        triagem
    );

});


// =====================================================
// LISTAR TRIAGENS
// =====================================================

app.get("/triagem", (req, res) => {

    const db = readDB();


    const pacientes =
        db.triagens.filter(
            paciente =>
                paciente.status ===
                "aguardando_medico"
        );


    res.json(
        pacientes
    );

});


// Também mantém /triagens funcionando

app.get("/triagens", (req, res) => {

    const db = readDB();

    res.json(
        db.triagens
    );

});


// =====================================================
// CONSULTA MÉDICA
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


    // Procura o paciente na triagem

    const paciente =
        db.triagens.find(
            p =>
                p.nome ===
                req.body.paciente
        );


    if (paciente) {

        paciente.status =
            "em_atendimento";

    }


    writeDB(db);


    res.status(201).json(
        consulta
    );

});


// =====================================================
// ALTA MÉDICA
// =====================================================

app.post("/alta", (req, res) => {

    const db = readDB();


    const pacienteNome =
        req.body.paciente;


    if (!pacienteNome) {

        return res.status(400).json({

            sucesso: false,

            erro:
                "Paciente não informado."

        });

    }


    const alta = {

        id: Date.now(),

        paciente:
            pacienteNome,

        motivo:
            req.body.motivo || "",

        observacao:
            req.body.observacao || "",

        data:
            req.body.data ||
            new Date()
                .toISOString()
                .split("T")[0],

        status:
            "liberado",

        createdAt:
            new Date().toISOString()

    };


    // Salva a alta

    db.altas.push(
        alta
    );


    // Atualiza paciente da triagem

    db.triagens.forEach(
        paciente => {

            if (
                paciente.nome ===
                pacienteNome
            ) {

                paciente.status =
                    "liberado";

            }

        }
    );


    // Atualiza paciente cadastrado

    db.pacientes.forEach(
        paciente => {

            if (
                paciente.nome ===
                pacienteNome
            ) {

                paciente.status =
                    "liberado";

            }

        }
    );


    writeDB(db);


    console.log(
        "Paciente liberado:",
        pacienteNome
    );


    res.status(200).json({

        sucesso: true,

        mensagem:
            "Paciente liberado com sucesso.",

        alta:
            alta

    });

});


// =====================================================
// CONSULTAS / MEDICAÇÕES
// =====================================================

app.get("/medicacoes", (req, res) => {

    const db = readDB();

    res.json(
        db.consultas
    );

});


// =====================================================
// VERIFICAR SERVIDOR
// =====================================================

app.get("/status", (req, res) => {

    res.json({

        servidor:
            "online",

        sistema:
            "hospitalar",

        status:
            "funcionando"

    });

});


// =====================================================
// PORTA DO RENDER
// =====================================================

const PORT =
    process.env.PORT || 3000;


app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Servidor rodando na porta ${PORT}`
        );

    }
);


module.exports = app;
