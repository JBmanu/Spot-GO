document.addEventListener("DOMContentLoaded", () => {
    loadHeader();
    loadToolbar();
});

function loadHeader() {
    fetch("header.html")
        .then(response => response.text())
        .then(html => {
            document.getElementById("header-container").innerHTML = html;
        })
        .catch(error => {
            console.error("Errore nel caricamento dell’header:", error);
        });
}

function loadToolbar() {
    fetch("toolbar.html")
        .then(response => response.text())
        .then(html => {
            document.getElementById("toolbar-container").innerHTML = html;
        })
        .catch(error => {
            console.error("Errore nel caricamento della toolbar:", error);
        });
}
