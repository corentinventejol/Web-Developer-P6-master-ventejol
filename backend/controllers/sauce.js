const Sauce = require('../models/sauces');
const fs = require('fs');


exports.getSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(404).json('Une erreur est survenue lors de la récupération des sauces.');
      console.log('getSauce 1 : ', error );
    });
};

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  const sauce = new Sauce({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
  });

  sauce.save()
    .then(() => {
      res.status(201).json({ message: 'Sauce enregistrée !' });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.updateSauce = (req, res, next) => {
  const sauceId = req.params.id;
  const sauceObject = { ...req.body };

  // Vérifier si une nouvelle image est téléchargée
  if (req.file) {
    sauceObject.imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
    // Récupérer le chemin de l'ancienne image
    Sauce.findOne({ _id: sauceId })
      .then((sauce) => {
        if (sauce.userId !== req.auth.userId) {
          return res.status(403).json({ message: 'Non autorisé' });
        }

        const oldImagePath = `images/${sauce.imageUrl.split('/images/')[1]}`;

        // Supprimer l'ancienne image
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.error('Erreur lors de la suppression de l\'ancienne image :', err);
          }
        });

        // Mettre à jour la sauce avec la nouvelle image
        Sauce.updateOne({ _id: sauceId }, { ...sauceObject, _id: sauceId })
          .then(() => res.status(200).json({ message: 'Sauce modifiée !' }))
          .catch((error) => res.status(400).json({ error }));
      })
      .catch((error) => {
        res.status(500).json({ error });
      });
  } else {
    // Si aucune nouvelle image, mise à jour sans toucher à l'image
    Sauce.updateOne({ _id: sauceId }, { ...sauceObject, _id: sauceId })
      .then(() => res.status(200).json({ message: 'Sauce modifiée !' }))
      .catch((error) => res.status(400).json({ error }));
  }
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId !== req.auth.userId) {
        return res.status(403).json({ message: 'Non autorisé' });
      }

      const filename = sauce.imageUrl.split('/images/')[1];
      const imagePath = `images/${filename}`;

      // Supprimer l'image du dossier "images"
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error('Erreur lors de la suppression de l\'image :', err);
        }

        // Supprimer la sauce de la base de données
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Sauce et image supprimées !' }))
          .catch((error) => res.status(400).json({ error }));
      });
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.likeDislike = (req, res, next) => {
  let like = req.body.like;
  let userId = req.body.userId;
  let sauceId = req.params.id;

  Sauce.findOne({ _id: sauceId })
    .then((sauce) => {
      if (!sauce) {
        return res.status(404).json({ message: 'Sauce non trouvée' });
      }

      let message = '';

      // Recherche de l'index de l'utilisateur dans les listes de likes et dislikes
      let userLikeIndex = sauce.usersLiked.indexOf(userId);
      let userDislikeIndex = sauce.usersDisliked.indexOf(userId);

      if (like === 1) { // Ajouter un like
        if (userLikeIndex === -1) { // Ajouter le like si non présent
          sauce.usersLiked.push(userId);
          sauce.likes += 1;
          message = 'J\'aime ajouté !';
        } else {
          message = 'Déjà liké';
        }
      } else if (like === -1) { // Ajouter un dislike
        if (userDislikeIndex === -1) { // Ajouter le dislike si non présent
          sauce.usersDisliked.push(userId);
          sauce.dislikes += 1;
          message = 'Dislike ajouté !';
        } else {
          message = 'Déjà disliké';
        }
      } else if (like === 0) { // Annuler un like ou un dislike
        if (userLikeIndex !== -1) { // Annuler un like
          sauce.usersLiked.splice(userLikeIndex, 1);
          sauce.likes -= 1;
          message = 'Like retiré !';
        } else if (userDislikeIndex !== -1) { // Annuler un dislike
          sauce.usersDisliked.splice(userDislikeIndex, 1);
          sauce.dislikes -= 1;
          message = 'Dislike retiré !';
        } else {
          message = 'Impossible de supprimer un like ou un dislike';
        }
      }

      // Enregistrez les modifications apportées à l'objet sauce
      sauce.save()
        .then(() => {
          res.status(200).json({ message });
        })
        .catch((error) => {
          res.status(400).json({ error });
        });
    })
    .catch((error) => {
      res.status(500).json({ message: 'Erreur lors de la recherche de la sauce', error });
    });
};