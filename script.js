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
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);

    // Vérifier la signature PNG
    if (view.getUint32(0) !== 0x89504E47 || view.getUint32(4) !== 0x0D0A1A0A) {
      throw new Error("Le fichier n'est pas un PNG valide.");
    }

    let offset = 8;
    let jsonStr = null;

    while (offset < buffer.byteLength) {
      const length = view.getUint32(offset);
      offset += 4;

      const type = String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3)
      );
      offset += 4;

      const chunkData = new Uint8Array(buffer, offset, length);
      offset += length;

      const crc = view.getUint32(offset);
      offset += 4;

      if (type === 'IEND') break;

      if (type === 'tEXt') {
        let nullIndex = -1;
        for (let i = 0; i < length; i++) {
          if (chunkData[i] === 0) {
            nullIndex = i;
            break;
          }
        }

        if (nullIndex !== -1) {
          const keyword = new TextDecoder().decode(chunkData.slice(0, nullIndex));
          const text = new TextDecoder().decode(chunkData.slice(nullIndex + 1));

          if (keyword === 'prompt') {
            jsonStr = text;
            break;
          }
        }
      }
    }

    if (!jsonStr) {
      throw new Error("Chunk tEXt 'prompt' introuvable.");
    }

    const data = JSON.parse(jsonStr);
    let resultText = "";

    // Extraire la seed
    let seed = null;
    for (const key in data) {
      if (data[key].inputs && data[key].inputs.seed !== undefined) {
        seed = data[key].inputs.seed;
        break;
      }
    }

    if (seed !== null) {
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
      promptText = data[defaultIdentifier].inputs.text;
      resultText += `<br>Contenu de text : ${promptText}`;
    } else if (customIdentifier) {
      if (data[customIdentifier] && data[customIdentifier].inputs && typeof data[customIdentifier].inputs.text === 'string') {
        promptText = data[customIdentifier].inputs.text;
        resultText += `<br><br>Contenu de text : ${promptText}`;
      } else {
        resultText += "<br><br>Contenu text introuvable pour l'identifiant fourni.";
      }
    } else {
      currentFile = file;
      modal.classList.add('active');
    }

    result.innerHTML = resultText;
  } catch (error) {
    result.innerHTML = "Erreur lors de l'extraction des données : " + error.message;
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
