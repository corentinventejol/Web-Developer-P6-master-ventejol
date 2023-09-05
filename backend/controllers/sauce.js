const Sauce = require('../models/sauces');

exports.getSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(404).json({ error });
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
//verifie le update et le delete 
exports.updateSauce = (req, res, next) => {
  const sauceObject = req.file
    ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
      }
    : { ...req.body };

  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId !== req.auth.userId) {
        return res.status(401).json({ message: 'Non autorisé' });
      }

      Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Sauce modifiée !' }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauces) => {
      if (sauces.userId !== req.auth.userId) {
        return res.status(401).json({ message: 'Non autorisé' });
      }

      const filename = sauces.imageUrl.split('images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Sauce supprimée !' }))
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