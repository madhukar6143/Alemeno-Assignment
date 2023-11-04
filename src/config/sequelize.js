import { Sequelize } from "sequelize";


const sequelize = new Sequelize('bankdetails', 'root', 'madhu', {
    host: 'localhost',
    dialect: 'mysql',
    define: {
      timestamps: false // Disable createdAt and updatedAt columns
    },   
  logging: false 
  });

export default sequelize;
