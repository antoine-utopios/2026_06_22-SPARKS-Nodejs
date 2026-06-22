async function recuperation() {
  const result = await fetch('https://non-existant-blabla-trucbidule.com')
  return result.json();
}

recuperation()
  .then((data) => {
    console.log(data);
  })
  .catch((error) => {
    console.error(`Erreur lors de la promesse: ${error.message}`);
  })
  
async function demo() {
  try {
    const data = await recuperation();
    console.log(data);
  } catch (error) {
    console.error(`Erreur lors de la promesse: ${error.message}`);
  }
}

process.on('unHandledRejection', (message) => {
  console.error(`Erreur non gérée: ${message}`);  
})