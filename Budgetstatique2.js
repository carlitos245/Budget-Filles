/* ---------------------------------------------------------
   STOCKAGE LOCAL
   - On charge les données existantes ou on crée une structure vide
--------------------------------------------------------- */
let data = JSON.parse(localStorage.getItem("budget-data1")) || {
  budget: []
};

/* Sauvegarde dans localStorage */
function saveData() {
  localStorage.setItem("budget-data1", JSON.stringify(data));
}


/* ---------------------------------------------------------
   RÉFÉRENCES DOM
--------------------------------------------------------- */
const denominationInput = document.getElementById("denomination");
const creditInput = document.getElementById("credit");
const debitInput = document.getElementById("debit");
const dateInput = document.getElementById("task-date");
const addBtn = document.getElementById("add-task");
const list = document.getElementById("task-list");
const soldeGlobal = document.getElementById("solde-global");


/* ---------------------------------------------------------
   MISE À JOUR DU SOLDE GLOBAL
   - Le solde global = total de la dernière ligne
--------------------------------------------------------- */
function updateSoldeGlobal() {
  let solde = 0;

  if (data.budget.length > 0) {
    solde = data.budget[data.budget.length - 1].total;
  }

  soldeGlobal.textContent = "Solde actuel : " + solde;
}


/* ---------------------------------------------------------
   AJOUT D’UNE NOUVELLE LIGNE BUDGET
   - Calcule le mouvement (crédit - débit)
   - Ajoute au total cumulatif précédent
--------------------------------------------------------- */
addBtn.addEventListener("click", () => {
  const denomination = denominationInput.value.trim();
  const credit = Number(creditInput.value) || 0;
  const debit = Number(debitInput.value) || 0;
  const date = dateInput.value;

  // Vérification minimale
  if (!denomination || !date) {
    alert("Veuillez remplir au moins la dénomination et la date.");
    return;
  }

  // Calcul du mouvement de la ligne
  const mouvement = credit - debit;

  // Récupération du total cumulatif précédent
  const dernierTotal = data.budget.length > 0
    ? data.budget[data.budget.length - 1].total
    : 0;

  // Nouveau total cumulatif
  const totalCumule = dernierTotal + mouvement;

  // Création de l'entrée
  const entry = {
    id: crypto.randomUUID(),
    denomination,
    credit,
    debit,
    total: totalCumule,
    date
  };

  // Ajout dans les données
  data.budget.push(entry);
  saveData();

  // Mise à jour de l'affichage
  render();

  // Réinitialisation des champs
  denominationInput.value = "";
  creditInput.value = "";
  debitInput.value = "";
  dateInput.value = "";
});


/* ---------------------------------------------------------
   AFFICHAGE DU TABLEAU
   - Recalcule tout le cumul après suppression
   - Affiche chaque ligne dans un <tr>
--------------------------------------------------------- */
function render() {
  list.innerHTML = "";

  // Recalcul complet du cumul pour garantir la cohérence
  let cumul = 0;
  data.budget = data.budget.map(item => {
    const mouvement = item.credit - item.debit;
    cumul += mouvement;
    return { ...item, total: cumul };
  });

  saveData();

  // Création des lignes du tableau
  data.budget.forEach(item => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.denomination}</td>
      <td>${item.credit}</td>
      <td>${item.debit}</td>
      <td>${item.total}</td>
      <td>${item.date}</td>
      <td><button class="delete-btn" data-id="${item.id}">✕</button></td>
    `;

    // Suppression
    tr.querySelector(".delete-btn").addEventListener("click", () => {
      deleteEntry(item.id);
    });

    list.appendChild(tr);
  });

  // Mise à jour du solde global
  updateSoldeGlobal();
}


/* ---------------------------------------------------------
   SUPPRESSION D’UNE LIGNE
   - Supprime l'entrée
   - Recalcule tout le cumul
--------------------------------------------------------- */
function deleteEntry(id) {
  data.budget = data.budget.filter(e => e.id !== id);
  saveData();
  render();
}

/* ---------------------------------------------------------
   BOUTON RESET GLOBAL (ID UNIQUE)
   - Efface toutes les données du budget
   - Recharge la page
--------------------------------------------------------- */
document.getElementById("budget-reset-btn1").addEventListener("click", () => {
  if (confirm("Voulez-vous vraiment tout réinitialiser ?")) {
    localStorage.removeItem("budget-data1");  // Supprime les données du budget
    location.reload();                       // Recharge la page
  }
});

// ------------------------------------------------------------- 
// 📌 EXPORT PDF — Génération du PDF du budget 
// ------------------------------------------------------------- 
// On attend que la page soit chargée pour éviter que jsPDF soit undefined
document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("pdfBtn").addEventListener("click", () => {

        // Récupération jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        let y = 10;

        // ---------------------------------------------------------
        // 🟦 TITRE
        // ---------------------------------------------------------
        doc.setFontSize(18);
        doc.text("Résumé du budget", 10, y);
        y += 10;

        // ---------------------------------------------------------
        // 🟩 SOLDE GLOBAL
        // ---------------------------------------------------------
        const solde = document.getElementById("solde-global").textContent;
        doc.setFontSize(14);
        doc.text(solde, 10, y);
        y += 10;

        // ---------------------------------------------------------
        // 🟧 TABLEAU FORMATÉ AVEC autoTable
        // ---------------------------------------------------------

        // En-têtes du tableau
        const head = [["Dénomination", "Crédit (€)", "Débit (€)", "Total (€)", "Date"]];

        // Lignes du tableau
        const body = [];

        document.querySelectorAll(".budget-table tbody tr").forEach(row => {
            const denomination = row.cells[0].textContent;
            const credit = row.cells[1].textContent;
            const debit = row.cells[2].textContent;
            const total = row.cells[3].textContent;
            const date = row.cells[4].textContent;

            body.push([denomination, credit, debit, total, date]);
        });

        // ---------------------------------------------------------
        // 🟦 autoTable resutl PDF avec couleurs crédit/débit
        // ---------------------------------------------------------
        doc.autoTable({
    // Position verticale où commence le tableau
    startY: y,

    // En‑têtes du tableau (ligne du haut)
    head: head,

    // Contenu du tableau (toutes les lignes)
    body: body,

    // Styles généraux appliqués à TOUTES les cellules
    styles: {
        fontSize: 10,      // Taille du texte
        cellPadding: 3     // Marges internes des cellules
    },

    // Styles appliqués UNIQUEMENT à la ligne d’en‑tête
    headStyles: {
        fillColor: [100, 170, 255], // 🎨(bleu foncé actuel) [41, 128, 185]
                                   // Bleu clair : [100, 170, 255] Bleu pastel : [150, 200, 255]
                                   //Bleu très doux : [180, 220, 255] Bleu flat design : [52, 152, 219]
                                   // ex : [100, 170, 255] = bleu clair
        textColor: 255,            // Couleur du texte (255 = blanc)
        halign: "center"           // Alignement horizontal du texte
    },

    // Styles appliqués à toutes les lignes du tableau (sauf en‑tête)
    bodyStyles: {
        halign: "center"           // Centre le texte dans les cellules
    },

    // Fonction appelée pour CHAQUE cellule du tableau
    // Permet de modifier dynamiquement les couleurs
    didParseCell: function (data) {

        // Colonne Crédit (index 1)
        // Si la valeur n'est pas "0", on met en vert
        if (data.column.index === 1 && data.cell.raw !== "0") {
            data.cell.styles.textColor = [0, 150, 0]; // Vert
        }

        // Colonne Débit (index 2)
        // Si la valeur n'est pas "0", on met en rouge
        if (data.column.index === 2 && data.cell.raw !== "0") {
            data.cell.styles.textColor = [200, 0, 0]; // Rouge
        }
    }
});


        // ---------------------------------------------------------
        // 🟪 SAUVEGARDE
        // ---------------------------------------------------------
        doc.save("budget.pdf");
    });

});

/* ---------------------------------------------------------
   PREMIER AFFICHAGE AU CHARGEMENT
--------------------------------------------------------- */
render();

