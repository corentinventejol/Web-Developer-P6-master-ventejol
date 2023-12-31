require('dotenv').config();

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');

const stuffRoutes = require('./routes/sauce');
const userRoutes = require('./routes/user');

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS'); 
  next();
});

mongoose.connect(`mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER_URI}/${process.env.MONGODB_BDD_NAME}?retryWrites=true&w=majority`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connexion à MongoDB réussie !'))
.catch(() => console.log('Connexion à MongoDB échouée !'));


  app.use('/api/sauces', stuffRoutes);
  app.use('/api/auth', userRoutes);
  app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;