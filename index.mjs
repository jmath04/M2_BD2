import { Sequelize, Op, DataTypes, JSONB } from 'sequelize';
import fs from 'fs/promises';
import 'dotenv/config';
import {MongoClient} from 'mongodb';



const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);
const db = client.db('database_m2')

const sequelize = new Sequelize('employees', process.env.USER_DB, process.env.SENHA_DB, {host: '127.0.0.1',dialect: 'mysql' });

const Employee = sequelize.define('Employee', {
  emp_no: { type: DataTypes.INTEGER,primaryKey: true,allowNull: false},
  birth_date: {type: DataTypes.DATEONLY,allowNull: false},
  first_name: {type: DataTypes.STRING(14),allowNull: false},
  last_name: {type: DataTypes.STRING(16),allowNull: false},
  gender: {type: DataTypes.ENUM('M', 'F'),allowNull: false},
  hire_date: {type: DataTypes.DATEONLY,allowNull: false}
}, { tableName: 'employees',timestamps: false});


const Department = sequelize.define('Department', {
  dept_no: {type: DataTypes.CHAR(4),primaryKey: true,allowNull: false},
  dept_name: {type: DataTypes.STRING(40),allowNull: false,unique: true}
}, {  tableName: 'departments',timestamps: false});

const DeptManager = sequelize.define('DeptManager', {
  emp_no: { type: DataTypes.INTEGER,primaryKey: true,allowNull: false},
  dept_no: {type: DataTypes.CHAR(4),primaryKey: true,allowNull: false},
  from_date: {type: DataTypes.DATEONLY,allowNull: false},
  to_date: {type: DataTypes.DATEONLY,allowNull: false}
}, {tableName: 'dept_manager',timestamps: false});


const DeptEmp = sequelize.define('DeptEmp', {
  emp_no: {type: DataTypes.INTEGER,primaryKey: true,allowNull: false},
  dept_no: {type: DataTypes.CHAR(4),primaryKey: true,allowNull: false},
  from_date: {type: DataTypes.DATEONLY,allowNull: false},
  to_date: {type: DataTypes.DATEONLY,allowNull: false}
}, {tableName: 'dept_emp',timestamps: false});


const Title = sequelize.define('Title', {
  emp_no: {type: DataTypes.INTEGER,primaryKey: true,allowNull: false},
  title: {type: DataTypes.STRING(50),primaryKey: true,allowNull: false},
  from_date: {type: DataTypes.DATEONLY,primaryKey: true,allowNull: false},
  to_date: {type: DataTypes.DATEONLY,allowNull: true}
}, {tableName: 'titles',timestamps: false});


const Salary = sequelize.define('Salary', {
  emp_no: {type: DataTypes.INTEGER,primaryKey: true,allowNull: false},
  salary: {type: DataTypes.INTEGER,allowNull: false},
  from_date: {type: DataTypes.DATEONLY,primaryKey: true,allowNull: false},
  to_date: {type: DataTypes.DATEONLY,allowNull: false}
}, {tableName: 'salaries',timestamps: false});


Employee.hasMany(Title, { foreignKey: 'emp_no', onDelete: 'CASCADE' });
Title.belongsTo(Employee, { foreignKey: 'emp_no' });


Employee.hasMany(Salary, { foreignKey: 'emp_no', onDelete: 'CASCADE' });
Salary.belongsTo(Employee, { foreignKey: 'emp_no' });

Employee.belongsToMany(Department, { 
  through: DeptEmp, 
  foreignKey: 'emp_no', 
  otherKey: 'dept_no',
  onDelete: 'CASCADE' 
});
Department.belongsToMany(Employee, { 
  through: DeptEmp, 
  foreignKey: 'dept_no', 
  otherKey: 'emp_no',
  onDelete: 'CASCADE' 
});


Employee.belongsToMany(Department, { 
  through: DeptManager, 
  as: 'ManagedDepartments', // Alias para diferenciar do DeptEmp
  foreignKey: 'emp_no', 
  otherKey: 'dept_no',
  onDelete: 'CASCADE' 
});
Department.belongsToMany(Employee, { 
  through: DeptManager, 
  as: 'Managers', // Alias para diferenciar do DeptEmp
  foreignKey: 'dept_no', 
  otherKey: 'emp_no',
  onDelete: 'CASCADE' 
});


/*
const employees = [];  
const departments = [];
const deptManagers = [];
const deptEmps = [];
const titles = [];
const salaries = [];


async function retornaEmployees(){
  await Employee.findAll({})
  .then(result => transforma_js_employees(result));
}

function transforma_js_employees(resultado){
  resultado.forEach((item) => {
    const data = item.dataValues;
    employees.push({
      emp_no: data.emp_no,
      birth_date: data.birth_date,
      first_name: data.first_name,
      last_name: data.last_name,
      gender: data.gender,
      hire_date: data.hire_date
    });
  });
}


async function retornaDepartments(){
  await Department.findAll().then(result => transforma_js_departments(result));
}

function transforma_js_departments(resultado){
  resultado.forEach((item) => {
    const data = item.dataValues;
    departments.push({
      dept_no: data.dept_no,
      dept_name: data.dept_name
    });
  });
}


async function retornaDeptManagers(){
  await DeptManager.findAll().then(result => transforma_js_deptManagers(result));
}

function transforma_js_deptManagers(resultado){
  resultado.forEach((item) => {
    const data = item.dataValues;
    deptManagers.push({
      emp_no: data.emp_no,
      dept_no: data.dept_no,
      from_date: data.from_date,
      to_date: data.to_date
    });
  });
}


async function retornaDeptEmps(){
  await DeptManager.findAll().then(result => transforma_js_deptEmps(result));
}

function transforma_js_deptEmps(resultado){
  resultado.forEach((item) => {
    const data = item.dataValues;
    deptEmps.push({
      emp_no: data.emp_no,
      dept_no: data.dept_no,
      from_date: data.from_date,
      to_date: data.to_date
    });
  });
}


async function retornaTitles(){
  await Title.findAll().then(result => transforma_js_titles(result));
}

function transforma_js_titles(resultado){
  resultado.forEach((item) => {
    const data = item.dataValues;
    titles.push({
      emp_no: data.emp_no,
      title: data.title,
      from_date: data.from_date,
      to_date: data.to_date
    });
  });
}


async function retornaSalaries(){
  await Salary.findAll().then(result => transforma_js_salaries(result));
}

function transforma_js_salaries(resultado){
  resultado.forEach((item) => {
    const data = item.dataValues;
    salaries.push({
      emp_no: data.emp_no,
      salary: data.salary,
      from_date: data.from_date,
      to_date: data.to_date
    });
  });
}

async function migraMongo(){
  await client.connect();
  console.log("migrando dados para o banco mongo DB...");
  await db.dropCollection('employees');
  await db.dropCollection('department');
  await db.dropCollection('dept_manager');
  await db.dropCollection('dept_emp');
  await db.dropCollection('title');
  await db.dropCollection('salary');
  
  await db.createCollection('employees');
  await db.createCollection('department');
  await db.createCollection('dept_manager');
  await db.createCollection('dept_emp');
  await db.createCollection('title');
  await db.createCollection('salary');

  await db.collection('employees').insertMany(employees);
  await db.collection('department').insertMany(departments);
  await db.collection('dept_manager').insertMany(deptManagers);
  await db.collection('dept_emp').insertMany(deptEmps);
  await db.collection('title').insertMany(titles)
  await db.collection('salary').insertMany(salaries)
}


async function carregarTodosOsDados() {
  console.log("Transformando dados em Json");
  
  await retornaEmployees();
  await retornaDepartments();
  await retornaDeptManagers();
  await retornaDeptEmps();
  await retornaTitles();
  await retornaSalaries();
}

await carregarTodosOsDados();

await migraMongo();
client.close();

*/

async function migraMongo(){

  await client.connect();

  console.log("Migrando dados para MongoDB...");

  const collection = db.collection('employees');

  
  await collection.deleteMany({});

 
  const resultado = await Employee.findAll({

    include: [

      {
        model: Salary
      },

      {
        model: Title
      },

      {
        model: Department,
        through: {
          attributes: ['from_date', 'to_date']
        }
      },

      {
        model: Department,
        as: 'ManagedDepartments',
        through: {
          attributes: ['from_date', 'to_date']
        }
      }

    ]

  });

  const employeesMongo = resultado.map(emp => {

    const data = emp.toJSON();

    return {

      emp_no: data.emp_no,
      birth_date: data.birth_date,
      first_name: data.first_name,
      last_name: data.last_name,
      gender: data.gender,
      hire_date: data.hire_date,

      salaries: data.Salaries,

      titles: data.Titles,

      departments: data.Departments,

      manager_departments: data.ManagedDepartments

    };

  });



  await collection.insertMany(employeesMongo);

  console.log("Dados migrados!");


  await collection.createIndex({ emp_no: 1 });

  await collection.createIndex({ "titles.title": 1 });

  await collection.createIndex({ "departments.dept_name": 1 });

  await collection.createIndex({ "manager_departments.emp_no": 1 });

  console.log("Índices criados!");

}

await migraMongo();

async function employeesPorManager(managerId){

  await client.connect();

  const resultado = await db.collection('employees').find({

    "manager_departments.emp_no": managerId

  }).toArray();

  console.log(resultado);

}

async function employeesPorTitle(title){

  await client.connect();

  const resultado = await db.collection('employees').find({

    "titles.title": title

  }).toArray();

  console.log(resultado);

}

async function employeesPorDepartamento(departamento){

  await client.connect();

  const resultado = await db.collection('employees').find({

    "departments.dept_name": departamento

  }).toArray();

  console.log(resultado);

}

async function mediaSalarialPorDepartamento(){

  await client.connect();

  const resultado = await db.collection('employees').aggregate([

    {
      $unwind: "$departments"
    },

    {
      $unwind: "$salaries"
    },

    {
      $group: {

        _id: "$departments.dept_name",

        media_salarial: {
          $avg: "$salaries.salary"
        }

      }
    }

  ]).toArray();

  console.log(resultado);

}

await client.connect();

await migraMongo();

await client.close();


/*
import { Sequelize, Op, DataTypes } from 'sequelize';
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);
const db = client.db('database_m2');

const sequelize = new Sequelize('employees', process.env.USER_DB, process.env.SENHA_DB, {
  host: '127.0.0.1',
  dialect: 'mysql',
  logging: false // Desativa logs de SQL para não poluir o terminal na migração em lote
});

// --- DEFINIÇÃO DOS MODELOS (Mantidos conforme os seus originais) ---
const Employee = sequelize.define('Employee', {
  emp_no: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
  birth_date: { type: DataTypes.DATEONLY, allowNull: false },
  first_name: { type: DataTypes.STRING(14), allowNull: false },
  last_name: { type: DataTypes.STRING(16), allowNull: false },
  gender: { type: DataTypes.ENUM('M', 'F'), allowNull: false },
  hire_date: { type: DataTypes.DATEONLY, allowNull: false }
}, { tableName: 'employees', timestamps: false });

const Department = sequelize.define('Department', {
  dept_no: { type: DataTypes.CHAR(4), primaryKey: true, allowNull: false },
  dept_name: { type: DataTypes.STRING(40), allowNull: false, unique: true }
}, { tableName: 'departments', timestamps: false });

const DeptManager = sequelize.define('DeptManager', {
  emp_no: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
  dept_no: { type: DataTypes.CHAR(4), primaryKey: true, allowNull: false },
  from_date: { type: DataTypes.DATEONLY, allowNull: false },
  to_date: { type: DataTypes.DATEONLY, allowNull: false }
}, { tableName: 'dept_manager', timestamps: false });

const DeptEmp = sequelize.define('DeptEmp', {
  emp_no: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
  dept_no: { type: DataTypes.CHAR(4), primaryKey: true, allowNull: false },
  from_date: { type: DataTypes.DATEONLY, allowNull: false },
  to_date: { type: DataTypes.DATEONLY, allowNull: false }
}, { tableName: 'dept_emp', timestamps: false });

const Title = sequelize.define('Title', {
  emp_no: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
  title: { type: DataTypes.STRING(50), primaryKey: true, allowNull: false },
  from_date: { type: DataTypes.DATEONLY, primaryKey: true, allowNull: false },
  to_date: { type: DataTypes.DATEONLY, allowNull: true }
}, { tableName: 'titles', timestamps: false });

const Salary = sequelize.define('Salary', {
  emp_no: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
  salary: { type: DataTypes.INTEGER, allowNull: false },
  from_date: { type: DataTypes.DATEONLY, primaryKey: true, allowNull: false },
  to_date: { type: DataTypes.DATEONLY, allowNull: false }
}, { tableName: 'salaries', timestamps: false });

// RELACIONAMENTOS
Employee.hasMany(Title, { foreignKey: 'emp_no', onDelete: 'CASCADE' });
Title.belongsTo(Employee, { foreignKey: 'emp_no' });

Employee.hasMany(Salary, { foreignKey: 'emp_no', onDelete: 'CASCADE' });
Salary.belongsTo(Employee, { foreignKey: 'emp_no' });

Employee.belongsToMany(Department, { through: DeptEmp, foreignKey: 'emp_no', otherKey: 'dept_no', onDelete: 'CASCADE' });
Department.belongsToMany(Employee, { through: DeptEmp, foreignKey: 'dept_no', otherKey: 'emp_no', onDelete: 'CASCADE' });

Employee.belongsToMany(Department, { through: DeptManager, as: 'ManagedDepartments', foreignKey: 'emp_no', otherKey: 'dept_no', onDelete: 'CASCADE' });
Department.belongsToMany(Employee, { through: DeptManager, as: 'Managers', foreignKey: 'dept_no', otherKey: 'emp_no', onDelete: 'CASCADE' });


// --- SCRIPT DE MIGRAÇÃO IDEMPOTENTE COM PAGINAÇÃO ---
async function migraMongo() {
  console.log("Iniciando migração de dados para MongoDB...");
  const collection = db.collection('employees');

  const batchSize = 2000; // Carrega de 2000 em 2000 para não estourar a memória RAM
  let offset = 0;
  let continuar = true;

  while (continuar) {
    const resultado = await Employee.findAll({
      limit: batchSize,
      offset: offset,
      include: [
        { model: Salary },
        { model: Title },
        { model: Department, through: { attributes: ['from_date', 'to_date'] } },
        { model: Department, as: 'ManagedDepartments', through: { attributes: ['from_date', 'to_date'] } }
      ]
    });

    if (resultado.length === 0) {
      continuar = false;
      break;
    }

    // Mapeando e estruturando os dados de forma limpa para o formato de documento
    const bulkOps = resultado.map(emp => {
      const data = emp.toJSON();
      
      const documento = {
        emp_no: data.emp_no,
        birth_date: data.birth_date,
        first_name: data.first_name,
        last_name: data.last_name,
        gender: data.gender,
        hire_date: data.hire_date,
        salaries: data.Salaries.map(s => ({ salary: s.salary, from_date: s.from_date, to_date: s.to_date })),
        titles: data.Titles.map(t => ({ title: t.title, from_date: t.from_date, to_date: t.to_date })),
        // Simplificamos os departamentos incluindo direto os dados do vínculo do relacionamento
        departments: data.Departments.map(d => ({
          dept_no: d.dept_no,
          dept_name: d.dept_name,
          from_date: d.DeptEmp.from_date,
          to_date: d.DeptEmp.to_date
        })),
        manager_departments: data.ManagedDepartments.map(md => ({
          dept_no: md.dept_no,
          dept_name: md.dept_name,
          from_date: md.DeptManager.from_date,
          to_date: md.DeptManager.to_date
        }))
      };

      // Usando bulkWrite com updateOne + upsert: true garante a IDEMPOTÊNCIA solicitada!
      return {
        updateOne: {
          filter: { emp_no: documento.emp_no },
          update: { $set: documento },
          upsert: true
        }
      };
    });

    await collection.bulkWrite(bulkOps);
    offset += batchSize;
    console.log(`Processados ${offset} registros...`);
  }

  console.log("Dados migrados com sucesso via Upsert!");

  // Criação dos índices ideais para cobrir as consultas solicitadas [cite: 41]
  await collection.createIndex({ emp_no: 1 });
  await collection.createIndex({ "titles.title": 1 });
  await collection.createIndex({ "departments.dept_name": 1 });
  // Índice para responder de forma otimizada a busca de funcionários vinculados a gerentes
  await collection.createIndex({ "departments.dept_no": 1 }); 
  
  console.log("Índices criados com sucesso!");
}

// --- CONSULTAS SOLICITADAS NO ITEM 2 ---

// Questão 2.a) Retornar employees dado o ID do Manager 
async function employeesPorManagerId(managerId) {
  // 1. Descobrir quais departamentos esse manager gerencia/gerenciou
  const managerDoc = await db.collection('employees').findOne(
    { emp_no: managerId },
    { projection: { manager_departments: 1 } }
  );

  if (!managerDoc || !managerDoc.manager_departments.length) {
    console.log("Nenhum departamento encontrado para este gerente.");
    return;
  }

  // Extrai a lista de códigos de departamentos gerenciados por ele
  const codigosDepartamentos = managerDoc.manager_departments.map(d => d.dept_no);

  // 2. Buscar todos os funcionários vinculados a esses departamentos
  const resultado = await db.collection('employees').find({
    "departments.dept_no": { $in: codigosDepartamentos }
  }).toArray();

  console.log(`Encontrados ${resultado.length} funcionários gerenciados pelo ID ${managerId}`);
  // console.log(resultado); // Descomente para exibir no terminal
}

// Questão 2.b) Dado um title, recuperar históricos [cite: 44]
async function employeesPorTitle(title) {
  const resultado = await db.collection('employees').find({
    "titles.title": title
  }).toArray();
  console.log(`Funcionários encontrados para o cargo '${title}': ${resultado.length}`);
}

// Questão 2.c) Dado o nome de um departamento [cite: 45]
async function employeesPorDepartamento(departamento) {
  const resultado = await db.collection('employees').find({
    "departments.dept_name": departamento
  }).toArray();
  console.log(`Funcionários encontrados no departamento '${departamento}': ${resultado.length}`);
}

// Questão 2.d) Média salarial corrigindo o produto cartesiano 
async function mediaSalarialPorDepartamento() {
  const resultado = await db.collection('employees').aggregate([
    { $unwind: "$departments" },
    { $unwind: "$salaries" },
    // Ajuste lógico opcional: Filtrar para computar apenas registros onde o período salarial 
    // bate com o período do funcionário no departamento (evita distorções de cargo/tempo)
    {
      $project: {
        dept_name: "$departments.dept_name",
        salary: "$salaries.salary",
        valido: {
          $and: [
            { $gte: ["$salaries.from_date", "$departments.from_date"] },
            { $lte: ["$salaries.to_date", "$departments.to_date"] }
          ]
        }
      }
    },
    // Filtramos apenas as correspondências temporais lógicas para precisão da média
    { $match: { valido: true } }, 
    {
      $group: {
        _id: "$dept_name",
        media_salarial: { $avg: "$salary" }
      }
    },
    { $sort: { media_salarial: -1 } }
  ]).toArray();

  console.log("Média Salarial por Departamento:");
  console.table(resultado);
}

// --- EXECUÇÃO DO FLUXO PRINCIPAL ---
async function main() {
  try {
    await client.connect();
    
    // Executa a migração segura
    await migraMongo();

    // Exemplos de testes das consultas para gerar os prints do seu relatório [cite: 42]
    console.log("\n--- Executando Testes de Consultas ---");
    await employeesPorManagerId(110022); // Exemplo de ID de manager comum no test_db
    await employeesPorTitle('Senior Engineer');
    await employeesPorDepartamento('Development');
    await mediaSalarialPorDepartamento();

  } catch (error) {
    console.error("Erro durante a execução do processo:", error);
  } finally {
    await client.close();
    await sequelize.close();
    console.log("Conexões encerradas de forma segura.");
  }
}

main();

*/

