const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();


// =====================================================
// CONFIGURAÇÕES
// =====================================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));


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

    try {

        if (!fs.existsSync(DB_FILE)) {

            const bancoInicial = {

                usuarios: [
                    {
                        usuario: "triagem",
                        senha: "123",
                        tipo: "triagem"
                    },
                    {
                        usuario: "medico",
                        senha: "123",
                        tipo: "medico"
                    },
                    {
                        usuario: "atendimento",
                        senha: "123",
                        tipo: "atendimento"
                    }
                ],

                pacientes: [],

                triagens: [],

                consultas: [],

                altas: []

            };


            writeDB(bancoInicial);


            return bancoInicial;
        }


        const conteudo =
            fs.readFileSync(
                DB_FILE,
                "utf8"
            );


        const db =
            JSON.parse(conteudo);


        db.usuarios =
            Array.isArray(db.usuarios)
                ? db.usuarios
                : [];


        db.pacientes =
            Array.isArray(db.pacientes)
                ? db.pacientes
                : [];


        db.triagens =
            Array.isArray(db.triagens)
                ? db.triagens
                : [];


        db.consultas =
            Array.isArray(db.consultas)
                ? db.consultas
                : [];


        db.altas =
            Array.isArray(db.altas)
                ? db.altas
                : [];


        return db;


    } catch (error) {

        console.error(
            "Erro ao ler banco:",
            error
        );


        return {

            usuarios: [],

            pacientes: [],

            triagens: [],

            consultas: [],

            altas: []

        };

    }

}


function writeDB(data) {

    fs.writeFileSync(

        DB_FILE,

        JSON.stringify(
            data,
            null,
            2
        ),

        "utf8"

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

    try {

        const db =
            readDB();


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

            usuario:
                user.usuario,

            tipo:
                user.tipo

        });


    } catch (error) {

        console.error(
            "Erro no login:",
            error
        );


        res.status(500).json({

            sucesso: false,

            erro:
                "Erro interno no servidor."

        });

    }

});


// =====================================================
// ATENDIMENTO / CADASTRO DE PACIENTE
// =====================================================

app.post("/atendimento", (req, res) => {

    try {

        const db =
            readDB();


        const paciente = {

            id:
                Date.now(),

            ...req.body,

            status:
                "triagem",

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


    } catch (error) {

        console.error(
            "Erro ao cadastrar paciente:",
            error
        );


        res.status(500).json({

            sucesso: false,

            erro:
                "Erro ao cadastrar paciente."

        });

    }

});


// =====================================================
// TRIAGEM
// =====================================================

app.post("/triagem", (req, res) => {

    try {

        const db =
            readDB();


        const nome =
            String(
                req.body.nome || ""
            ).trim();


        const sintoma =
            String(
                req.body.sintoma || ""
            ).trim();


        const temperatura =
            Number(
                req.body.temperatura
            );


        const alergias =
            String(
                req.body.alergias || ""
            ).trim();


        const observacao =
            String(
                req.body.observacao ||
                req.body["observação"] ||
                ""
            ).trim();


        let risco =
            req.body.risco ||
            "verde";


        // =============================================
        // CLASSIFICAÇÃO DE RISCO
        // =============================================

        const sintomasVermelhos = [

            "infarto",

            "avc",

            "convulsão",

            "hemorragia",

            "falta_ar_grave"

        ];


        const sintomasAmarelos = [

            "febre",

            "vomito",

            "diarreia",

            "falta_ar",

            "tontura",

            "dor_peito",

            "pressao_alta",

            "pressao_baixa",

            "palpitacao"

        ];


        if (
            sintomasVermelhos.includes(sintoma)
        ) {

            risco =
                "vermelho";

        }

        else if (
            !isNaN(temperatura) &&
            temperatura >= 39
        ) {

            risco =
                "vermelho";

        }

        else if (
            sintomasAmarelos.includes(sintoma)
        ) {

            risco =
                "amarelo";

        }

        else if (
            !isNaN(temperatura) &&
            temperatura >= 38
        ) {

            risco =
                "amarelo";

        }

        else {

            risco =
                "verde";

        }


        if (!nome) {

            return res.status(400).json({

                sucesso: false,

                erro:
                    "Nome do paciente é obrigatório."

            });

        }


        const triagem = {

            id:
                Date.now(),

            nome:
                nome,

            sintoma:
                sintoma,

            temperatura:
                isNaN(temperatura)
                    ? null
                    : temperatura,

            alergias:
                alergias,

            observacao:
                observacao,

            risco:
                risco,

            status:
                "aguardando_medico",

            createdAt:
                new Date().toISOString()

        };


        db.triagens.push(
            triagem
        );


        writeDB(db);


        console.log(
            "Triagem salva:",
            triagem
        );


        res.status(201).json({

            sucesso: true,

            paciente:
                triagem

        });


    } catch (error) {

        console.error(
            "Erro ao salvar triagem:",
            error
        );


        res.status(500).json({

            sucesso: false,

            erro:
                "Erro interno ao salvar a triagem."

        });

    }

});


// =====================================================
// LISTAR PACIENTES AGUARDANDO MÉDICO
// =====================================================

app.get("/triagem", (req, res) => {

    try {

        const db =
            readDB();


        const pacientes =
            db.triagens.filter(
                paciente =>
                    paciente.status ===
                    "aguardando_medico"
            );


        res.json(
            pacientes
        );


    } catch (error) {

        console.error(error);


        res.status(500).json({

            erro:
                "Erro ao carregar pacientes."

        });

    }

});


// =====================================================
// LISTAR TODAS AS TRIAGENS
// =====================================================

app.get("/triagens", (req, res) => {

    const db =
        readDB();


    res.json(
        db.triagens
    );

});


// =====================================================
// BUSCAR PACIENTE ESPECÍFICO
// =====================================================

app.get("/paciente/:id", (req, res) => {

    try {

        const db =
            readDB();


        const id =
            Number(
                req.params.id
            );


        const paciente =
            db.triagens.find(
                p =>
                    Number(p.id) === id
            );


        if (!paciente) {

            return res.status(404).json({

                sucesso: false,

                erro:
                    "Paciente não encontrado."

            });

        }


        res.json(
            paciente
        );


    } catch (error) {

        console.error(
            "Erro ao buscar paciente:",
            error
        );


        res.status(500).json({

            sucesso: false,

            erro:
                "Erro ao buscar paciente."

        });

    }

});


// =====================================================
// CONSULTA MÉDICA
// =====================================================

app.post("/consulta", (req, res) => {

    try {

        const db =
            readDB();


        const pacienteId =
            Number(
                req.body.pacienteId
            );


        if (!pacienteId) {

            return res.status(400).json({

                sucesso: false,

                erro:
                    "ID do paciente não informado."

            });

        }


        const paciente =
            db.triagens.find(
                p =>
                    Number(p.id) === pacienteId
            );


        if (!paciente) {

            return res.status(404).json({

                sucesso: false,

                erro:
                    "Paciente não encontrado."

            });

        }


        const consulta = {

            id:
                Date.now(),

            pacienteId:
                paciente.id,

            paciente:
                paciente.nome,

            sintoma:
                paciente.sintoma,

            temperatura:
                paciente.temperatura,

            alergias:
                paciente.alergias,

            risco:
                paciente.risco,

            diagnostico:
                String(
                    req.body.diagnostico || ""
                ).trim(),

            medicacao:
                String(
                    req.body.medicacao || ""
                ).trim(),

            observacoes:
                String(
                    req.body.observacoes || ""
                ).trim(),

            createdAt:
                new Date().toISOString()

        };


        db.consultas.push(
            consulta
        );


        // =============================================
        // PACIENTE EM ATENDIMENTO
        // =============================================

        paciente.status =
            "em_atendimento";


        writeDB(db);


        console.log(
            "Consulta salva:",
            consulta
        );


        res.status(201).json({

            sucesso: true,

            consulta:
                consulta

        });


    } catch (error) {

        console.error(
            "Erro ao salvar consulta:",
            error
        );


        res.status(500).json({

            sucesso: false,

            erro:
                "Erro interno ao salvar consulta."

        });

    }

});


// =====================================================
// HISTÓRICO DE CONSULTAS DO PACIENTE
// =====================================================

app.get(
    "/paciente/:id/consultas",
    (req, res) => {

        try {

            const db =
                readDB();


            const id =
                Number(
                    req.params.id
                );


            const consultas =
                db.consultas.filter(
                    consulta =>
                        Number(
                            consulta.pacienteId
                        ) === id
                );


            res.json(
                consultas
            );


        } catch (error) {

            console.error(error);


            res.status(500).json({

                erro:
                    "Erro ao carregar histórico."

            });

        }

    }
);


// =====================================================
// ALTA MÉDICA
// =====================================================

app.post("/alta", (req, res) => {

    try {

        const db =
            readDB();


        const pacienteId =
            Number(
                req.body.pacienteId
            );


        if (!pacienteId) {

            return res.status(400).json({

                sucesso: false,

                erro:
                    "ID do paciente não informado."

            });

        }


        const paciente =
            db.triagens.find(
                p =>
                    Number(p.id) === pacienteId
            );


        if (!paciente) {

            return res.status(404).json({

                sucesso: false,

                erro:
                    "Paciente não encontrado."

            });

        }


        const alta = {

            id:
                Date.now(),

            pacienteId:
                paciente.id,

            paciente:
                paciente.nome,

            motivo:
                String(
                    req.body.motivo || ""
                ).trim(),

            observacao:
                String(
                    req.body.observacao || ""
                ).trim(),

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


        db.altas.push(
            alta
        );


        // =============================================
        // ATUALIZA TRIAGEM
        // =============================================

        paciente.status =
            "liberado";


        // =============================================
        // ATUALIZA CADASTRO
        // =============================================

        db.pacientes.forEach(
            p => {

                if (
                    Number(p.id) ===
                    pacienteId
                ) {

                    p.status =
                        "liberado";

                }

            }
        );


        writeDB(db);


        console.log(
            "Paciente liberado:",
            paciente.nome
        );


        res.status(200).json({

            sucesso: true,

            mensagem:
                "Paciente liberado com sucesso.",

            alta:
                alta

        });


    } catch (error) {

        console.error(
            "Erro ao registrar alta:",
            error
        );


        res.status(500).json({

            sucesso: false,

            erro:
                "Erro interno ao registrar alta."

        });

    }

});


// =====================================================
// LISTAR ALTAS
// =====================================================

app.get("/altas", (req, res) => {

    try {

        const db =
            readDB();


        res.json(
            db.altas
        );


    } catch (error) {

        res.status(500).json({

            erro:
                "Erro ao carregar altas."

        });

    }

});


// =====================================================
// MEDICAÇÕES / CONSULTAS
// =====================================================

app.get("/medicacoes", (req, res) => {

    const db =
        readDB();


    res.json(
        db.consultas
    );

});


// =====================================================
// STATUS DO SERVIDOR
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
// 404 DA API
// =====================================================

app.use((req, res, next) => {

    if (
        req.path.startsWith("/api") ||
        req.path === "/triagem" ||
        req.path === "/consulta" ||
        req.path === "/alta"
    ) {

        return res.status(404).json({

            sucesso: false,

            erro:
                "Rota não encontrada."

        });

    }


    next();

});


// =====================================================
// PORTA
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
