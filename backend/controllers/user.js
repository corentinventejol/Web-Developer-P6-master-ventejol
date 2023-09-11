const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passwordValidator = require('password-validator');
const emailValidator = require('email-validator');

const User = require('../models/user');

exports.signup = (req, res, next) => {
  const { email, password } = req.body;

  // Valider l'adresse e-mail
  if (!emailValidator.validate(email)) {
    return res.status(400).json({ message: "Adresse e-mail non valide" });
  }

  // Valider le mot de passe
  const schema = new passwordValidator();
    schema
        .is().min(7)             // La longueur minimale du mot de passe doit être de 7 caractères
        .is().max(20)            // La longueur maximale du mot de passe doit être de 20 caractères
        .has().uppercase()       // Le mot de passe doit contenir au moins une lettre majuscule
        .has().lowercase()       // Le mot de passe doit contenir au moins une lettre minuscule
        .has().digits(2)         // Le mot de passe doit contenir au moins 2 chiffres
        .has().not().spaces();   // Le mot de passe ne doit pas contenir d'espaces
  

  if (!schema.validate(password)) {
    return res.status(400).json({ message: "Mot de passe non valide" });
  }

  // Si l'adresse e-mail et le mot de passe sont valides, hachez le mot de passe et enregistrez l'utilisateur
  bcrypt.hash(password, 10)
    .then(hash => {
      const user = new User({
        email: email,
        password: hash
      });
      user.save()
        .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
        .catch(error => res.status(400).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
};

exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then(user => {
      if (!user) {
        return res.status(401).json({ message: 'Paire login/mot de passe incorrecte' });
      }
      bcrypt.compare(req.body.password, user.password)
        .then(valid => {
          if (!valid) {
            return res.status(401).json({ message: 'Paire login/mot de passe incorrecte' });
          }
          res.status(200).json({
            userId: user._id,
            token: jwt.sign(
              { userId: user._id },
              'RANDOM_TOKEN_SECRET',
              { expiresIn: '24h' }
            )
          });
        })
        .catch(error => res.status(500).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
};
