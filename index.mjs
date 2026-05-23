import { Sequelize, Op, DataTypes, JSONB } from 'sequelize';
import fs from 'fs/promises';
import 'dotenv/config';
import {MongoClient} from 'mongodb';

const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);

async function main() {
  await client.connect();
  await listDatabases(client);
}
async function listDatabases(client){
const databasesList = await client.db().admin().listDatabases();
//.db(): Create a new Db instance sharing the current socket connections.
//admin():Object to give access to administrtives commands on mongodb
console.log("Databases:");
databasesList.databases.forEach(db => console.log(  `- ${db.name}` ));
};
main();

const sequelize = new Sequelize('employees', process.env.USER_DB, process.env.SENHA_DB, {host: 'localhost',dialect: 'mysql' });


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



const employees = [];  
const departments = [];
const deptManagers = [];
const deptEmps = [];
const titles = [];
const salaries = [];


async function retornaEmployees(){
  await Employee.findAll().then(result => transforma_js_employees(result));
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


async function carregarTodosOsDados() {
  console.log("Buscando dados no banco...");
  
  await retornaEmployees();
  await retornaDepartments();
  await retornaDeptManagers();
  await retornaDeptEmps();
  await retornaTitles();
  await retornaSalaries();

  console.log("Dados carregados com sucesso!");
  console.log("Exemplo Employee:", employees[0]);
  console.log("Total de Departments:", departments.length);
}

carregarTodosOsDados();









