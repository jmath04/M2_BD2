import { Sequelize, DataTypes } from 'sequelize';
import 'dotenv/config';
import { MongoClient } from 'mongodb';

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
    await mongoEmployees.insertMany(documentosFormatados);
    
    offset += BATCH_SIZE;
    console.log(`Migrados: ${offset} registros...`);
  }

  console.log("Migração concluída com sucesso! Todos os dados estão em uma única collection.");
}

async function run() {
    await migraMongo();
    await client.close();
    await sequelize.close();
}

run();