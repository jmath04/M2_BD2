import { Sequelize, Op, DataTypes, JSONB } from 'sequelize';
import fs from 'fs/promises';
import 'dotenv/config';
import {createClient} from 'redis';


const sequelize = new Sequelize('sua_base', 'usuario', 'senha', {host: 'localhost',dialect: 'mysql' });


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







