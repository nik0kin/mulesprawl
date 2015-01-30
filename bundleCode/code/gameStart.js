
var gameStartHook = function (M) {
  M.setPlayerVariable('p1', 'castlePlaced', false);
  M.setPlayerVariable('p1', 'gold', 1);

  return M.persistQ();
};

module.exports = gameStartHook;