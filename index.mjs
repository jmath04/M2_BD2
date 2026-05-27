import { Sequelize, DataTypes } from 'sequelize';
import 'dotenv/config';
import { MongoClient } from 'mongodb';
import readline from 'readline';

const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);
const db = client.db('database_m2');

const sequelize = new Sequelize('employees', process.env.USER_DB, process.env.SENHA_DB, { 
  host: 'localhost', 
  dialect: 'mysql',
  logging: false // Desativado para não poluir o terminal durante o loop
});

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


Employee.hasMany(Title, { foreignKey: 'emp_no', as: 'titles' });
Title.belongsTo(Employee, { foreignKey: 'emp_no' });

Employee.hasMany(Salary, { foreignKey: 'emp_no', as: 'salaries' });
Salary.belongsTo(Employee, { foreignKey: 'emp_no' });

// Adicionei o alias as: 'departments' para facilitar a separação
Employee.belongsToMany(Department, { 
  through: DeptEmp, 
  as: 'departments', 
  foreignKey: 'emp_no', 
  otherKey: 'dept_no'
});

Employee.belongsToMany(Department, { 
  through: DeptManager, 
  as: 'managed_departments', 
  foreignKey: 'emp_no', 
  otherKey: 'dept_no'
});


async function migraMongo() {
  await client.connect();
  console.log("Conectado ao MongoDB...");

  await db.dropCollection('employees');

  const mongoEmployees = db.collection('employees');

  const BATCH_SIZE = 5000; // batch size pq aparentemente tem um limite do que o node consegue processar, desse jeito ele vai fazendo em lotes;
  let offset = 0; // diz de que indice tem que começar a pesquisa 
  let hasMore = true;

  console.log("Iniciando migração dos dados em lotes...");

  while (hasMore) {
    const employeesData = await Employee.findAll({
      limit: BATCH_SIZE,
      offset: offset,
      include: [
        { model: Title, as: 'titles', attributes: ['title', 'from_date', 'to_date'] },
        { model: Salary, as: 'salaries', attributes: ['salary', 'from_date', 'to_date'] },
        { 
          model: Department, 
          as: 'departments', 
          attributes: ['dept_no', 'dept_name'],
          through: { attributes: ['from_date', 'to_date'] } 
        },
        { 
          model: Department, 
          as: 'managed_departments', 
          attributes: ['dept_no', 'dept_name'],
          through: { attributes: ['from_date', 'to_date'] }
        }
      ],
      order: [['emp_no', 'ASC']] // Garante uma ordem segura para o offset
    });

    if (employeesData.length === 0) {
      hasMore = false;
      break;
    }
    const documentosFormatados = employeesData.map(emp => {
      const data = emp.toJSON(); // isso existe bem mais facil do que a gente fez antes

      return {
        emp_no: data.emp_no,
        birth_date: data.birth_date,
        first_name: data.first_name,
        last_name: data.last_name,
        gender: data.gender,
        hire_date: data.hire_date,
        
        titles: data.titles,
        salaries: data.salaries,
        
        departments: data.departments.map(dept => ({
          dept_no: dept.dept_no,
          dept_name: dept.dept_name,
          from_date: dept.DeptEmp.from_date,
          to_date: dept.DeptEmp.to_date
        })),

        managed_departments: data.managed_departments.map(dept => ({
          dept_no: dept.dept_no,
          dept_name: dept.dept_name,
          from_date: dept.DeptManager.from_date,
          to_date: dept.DeptManager.to_date
        }))
      };
    });

    // Insere o lote no MongoDB
    try {
      await db.collection('employees').insertMany(documentosFormatados, { ordered: false });
    } catch (erro) {
    // O erro de código 11000 é o de duplicata (Duplicate Key)
    if (erro.code === 11000) {
      console.log("Aviso: Alguns documentos foram ignorados porque já existiam.");
    } else {
      console.error("Outro erro ocorreu:", erro);
    }
}
    
    offset += BATCH_SIZE;
    console.log(`Migrados: ${offset} registros...`);
  }

  await mongoEmployees.createIndex({ "emp_no": 1 });
  
  await mongoEmployees.createIndex({ "titles.title": 1 });

  await mongoEmployees.createIndex({ "departments.dept_name": 1 });

  await mongoEmployees.createIndex({ "managed_departments.dept_no": 1 });

  console.log("Migração concluída com sucesso! Todos os dados estão em uma única collection.");
}

async function employeesPorTitle(title){

  await client.connect();

  const resultado = await db.collection('employees').find({

    "titles.title": title

  }).toArray();

  await console.log(JSON.stringify(resultado, null, 2));

}

async function employeesPorDepartamento(departamento){

  await client.connect();

  const resultado = await db.collection('employees').find({

    "departments.dept_name": departamento

  }).toArray();

  await console.log(JSON.stringify(resultado, null, 2));

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

  await console.log(JSON.stringify(resultado, null, 2));

}

async function employeesPorManager(manager) {
  await client.connect();
  const collection = db.collection('employees');

  let queryManager = {};
  // Verifica se a entrada é um número (ID) ou String (Nome)
  if (!isNaN(manager)) {
    queryManager = { "emp_no": parseInt(manager), "managed_departments": { $not: { $size: 0 } } };
  } else {
    queryManager = { 
      "managed_departments": { $not: { $size: 0 } },
      $or: [
        { "first_name": { $regex: manager, $options: 'i' } },
        { "last_name": { $regex: manager, $options: 'i' } }
      ]
    };
  }

  // 1. Encontra o gerente para descobrir qual departamento ele gerencia
  const gerente = await collection.findOne(queryManager);

  if (!gerente || gerente.managed_departments.length === 0) {
    console.log("Gerente não encontrado ou não gerencia nenhum departamento.");
    return;
  }

  // Pega o código do departamento que ele gerencia atualmente (ou histórico)
  const deptNo = gerente.managed_departments[0].dept_no;
  console.log(`\nManager Encontrado: ${gerente.first_name} ${gerente.last_name} (Depto: ${deptNo})`);

  // 2. Busca todos os funcionários vinculados a esse departamento
  const resultado = await collection.find({
    "departments.dept_no": deptNo
  }).limit(10).toArray(); // Limitado a 10 para não travar o terminal com dados excessivos

  console.log(JSON.stringify(resultado, null, 2));
}


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function perguntar(pergunta) {

  return new Promise(resolve => {

    rl.question(pergunta, resposta => {

      resolve(resposta);

    });

  });

}

async function menu() {

  await client.connect();

  let opcao = "";

  while(opcao !== "0") {

    console.log("\n========== MENU ==========");
    console.log("1 - Migrar dados MySQL -> MongoDB");
    console.log("2 - Buscar employees por manager");
    console.log("3 - Buscar employees por title");
    console.log("4 - Buscar employees por departamento");
    console.log("5 - Média salarial por departamento");
    console.log("0 - Sair");

    opcao = await perguntar("\nEscolha uma opção: ");

    switch(opcao) {

      case "1":

        await migraMongo();

        break;

      case "2":

        const manager = await perguntar("Digite nome ou id do manager: ");

        await employeesPorManager(manager);

        break;

      case "3":

        const title = await perguntar("Digite o title: ");

        await employeesPorTitle(title);

        break;

      case "4":

        const departamento = await perguntar("Digite o departamento: ");

        await employeesPorDepartamento(departamento);

        break;

      case "5":

        await mediaSalarialPorDepartamento();

        break;

      case "0":

        console.log("Encerrando...");

        break;

      default:

        console.log("Opção inválida!");

    }

  }

  rl.close();

  await client.close();

  await sequelize.close();

}

menu();







