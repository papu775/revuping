// Nx owns the continuous api:serve dependency and stops it when testing ends.
module.exports = async function () {
  console.log('API end-to-end checks finished.');
};
