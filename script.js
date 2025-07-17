const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('dropzone-file');
const result = document.getElementById('result');
const modal = document.getElementById('modal');
const identifierInput = document.getElementById('identifierInput');
const confirmIdentifier = document.getElementById('confirmIdentifier');
const closeModal = document.getElementById('closeModal');
let currentFile = null;

async function handleFile(file, customIdentifier = null) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    let resultText = "";

    // Extraire la seed en parcourant les nœuds
    let seed = null;
    for (const key in data) {
      if (data[key].inputs && data[key].inputs.seed !== undefined) {
        seed = data[key].inputs.seed;
        break;
      }
    }

    if (seed) {
      result.style.display = "block";
      result.style.border = "2px solid rgb(0, 255, 166)";
      resultText += `Seed : ${seed} (copiée dans le presse-papiers)`;
      await navigator.clipboard.writeText(seed.toString());
    } else {
      resultText += "Seed introuvable dans le fichier.";
      result.style.display = "block";
      result.style.border = "2px solid red";
    }

    // Vérifier d'abord l'identifiant par défaut 266
    const defaultIdentifier = "266";
    let promptText = null;

    if (data[defaultIdentifier] && data[defaultIdentifier].inputs && typeof data[defaultIdentifier].inputs.text === 'string') {
      // Si l'identifiant 266 est trouvé et text est une string, afficher son contenu
      promptText = data[defaultIdentifier].inputs.text;
      resultText += `<br>Contenu de text : ${promptText}`;
    } else if (customIdentifier) {
      // Si un identifiant personnalisé est fourni, chercher son contenu
      if (data[customIdentifier] && data[customIdentifier].inputs && typeof data[customIdentifier].inputs.text === 'string') {
        promptText = data[customIdentifier].inputs.text;
        resultText += `<br><br>Contenu de text : ${promptText}`;
      } else {
        resultText += "<br><br>Contenu text introuvable pour l'identifiant fourni.";
      }
    } else {
      // Si ni 266 ni un identifiant personnalisé n'est trouvé, afficher la modale
      currentFile = file;
      modal.classList.add('active');
    }

    result.innerHTML = resultText;
  } catch (error) {
    result.innerHTML = "Erreur lors de l'extraction des données.";
    console.error(error);
  }
}

function submitIdentifier() {
  const customIdentifier = identifierInput.value.trim();
  if (customIdentifier) {
    modal.classList.remove('active');
    result.innerHTML = "";
    if (currentFile) handleFile(currentFile, customIdentifier);
  }
}

confirmIdentifier.addEventListener('click', submitIdentifier);
identifierInput.addEventListener('keyup', (event) => {
  if (event.key === "Enter") submitIdentifier();
});

closeModal.addEventListener('click', () => {
  modal.classList.remove('active');
});

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('dragover');
  const file = event.dataTransfer.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) handleFile(file);
});
