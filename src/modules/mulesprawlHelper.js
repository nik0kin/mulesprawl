define(function () {
	var that = {};
  
  /*  
   * {
   *   'familyLastName': ['member1FirstName', 'member2FirstName']
   * }
   */ 
  that.getPopulationFamilyObject = function (pieces) {
    console.log('organizing ' + pieces.length + ' pieces');
    console.log(pieces);

    var familys = {};

    _.each(pieces, function (piece) {
      if (piece.class != 'Farmer') return;

      if (familys[piece.attributes.familyName]) {
        familys[piece.attributes.familyName].push(piece);
      } else {
        familys[piece.attributes.familyName] = [piece];
      }
    });

    return familys;
  };

  return that;
});