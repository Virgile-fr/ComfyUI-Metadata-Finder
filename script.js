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
    let resultText = "";

    // Extraire la seed
    const seedMatch = text.match(/"seed":\s*(\d+)/);
    if (seedMatch) {
        result.style.display = "block";
        result.style.border = "2px solid rgb(0, 255, 166)";
      const seed = seedMatch[1];
      resultText += `Seed : ${seed} (copiée dans le presse-papiers)`;
      await navigator.clipboard.writeText(seed);
    } else {
      resultText += "Seed introuvable dans le fichier.";
      result.style.display = "block";
      result.style.border = "2px solid red";
    }

    // Vérifier d'abord l'identifiant 1290
    const defaultIdentifier = "1290";
    const defaultText2Match = text.match(new RegExp(`"${defaultIdentifier}":\\s*\\{\\s*"inputs":\\s*\\{\\s*"text":\\s*\\[[^\\]]*\\],\\s*"text2":\\s*"([^"]*)`));
    
    if (defaultText2Match) {
      // Si l'identifiant 1290 est trouvé, afficher son contenu
      resultText += `<br>Contenu de text2 : ${defaultText2Match[1]}`;
    } else if (customIdentifier) {
      // Si un identifiant personnalisé est fourni, chercher son contenu
      const customText2Match = text.match(new RegExp(`"${customIdentifier}":\\s*\\{\\s*"inputs":\\s*\\{\\s*"text":\\s*\\[[^\\]]*\\],\\s*"text2":\\s*"([^"]*)`));
      if (customText2Match) {
        resultText += `<br><br>Contenu de text2 : ${customText2Match[1]}`;
      } else {
        resultText += "<br><br>Contenu text2 introuvable pour l'identifiant fourni.";
      }
    } else {
      // Si ni 1290 ni un identifiant personnalisé n'est trouvé, afficher la modale
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